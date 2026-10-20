/**
 * Simulasi fluida (Navier–Stokes, WebGL2) untuk efek "liquify" api yang mengikuti kursor.
 * Tanpa dependensi. Dye disimpan sebagai satu kanal (kepadatan), lalu diwarnai di shader
 * display memakai satu tone merah (#ff0000) dengan gradasi terang → inti gelap seperti api.
 */

export type FlameOptions = {
  simRes?: number; // resolusi sisi terpendek grid kecepatan
  dyeRes?: number; // resolusi sisi terpendek grid dye
  velocityDissipation?: number;
  dyeDissipation?: number; // makin besar makin cepat padam
  pressureIterations?: number;
  curl?: number; // kekuatan pusaran (kesan cair)
  buoyancy?: number; // dorongan ke atas (kesan api)
  splatRadius?: number;
  splatForce?: number;
};

const DEFAULTS: Required<FlameOptions> = {
  simRes: 128,
  dyeRes: 640,
  velocityDissipation: 0.9,
  dyeDissipation: 2.8,
  pressureIterations: 18,
  curl: 16,
  buoyancy: 1.2,
  splatRadius: 0.05,
  splatForce: 2000,
};

const VERT = `#version 300 es
precision highp float;
in vec2 aPos;
uniform vec2 uTexel;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
void main(){
  vUv = aPos*0.5+0.5;
  vL = vUv - vec2(uTexel.x,0.); vR = vUv + vec2(uTexel.x,0.);
  vT = vUv + vec2(0.,uTexel.y); vB = vUv - vec2(0.,uTexel.y);
  gl_Position = vec4(aPos,0.,1.);
}`;

const HEAD = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
`;

const SPLAT = HEAD + `
uniform sampler2D uTarget; uniform float uAspect; uniform vec3 uColor; uniform vec2 uPoint; uniform float uRadius;
void main(){
  vec2 p = vUv - uPoint; p.x *= uAspect;
  vec3 s = exp(-dot(p,p)/uRadius) * uColor;
  o = vec4(min(texture(uTarget,vUv).xyz + s, vec3(2.5)), 1.);
}`;

const ADVECT = HEAD + `
uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 uSimTexel; uniform float uDt; uniform float uDiss;
void main(){
  vec2 c = vUv - uDt * texture(uVelocity,vUv).xy * uSimTexel;
  o = texture(uSource,c) / (1. + uDiss*uDt);
}`;

const DIVERGENCE = HEAD + `
uniform sampler2D uVelocity;
void main(){
  float L=texture(uVelocity,vL).x, R=texture(uVelocity,vR).x, T=texture(uVelocity,vT).y, B=texture(uVelocity,vB).y;
  vec2 C = texture(uVelocity,vUv).xy;
  if(vL.x<0.) L=-C.x; if(vR.x>1.) R=-C.x; if(vT.y>1.) T=-C.y; if(vB.y<0.) B=-C.y;
  o = vec4(.5*(R-L+T-B),0.,0.,1.);
}`;

const CURL = HEAD + `
uniform sampler2D uVelocity;
void main(){
  float L=texture(uVelocity,vL).y, R=texture(uVelocity,vR).y, T=texture(uVelocity,vT).x, B=texture(uVelocity,vB).x;
  o = vec4(.5*(R-L-T+B),0.,0.,1.);
}`;

// Vorticity confinement + buoyancy (dye naik seperti api)
const VORTICITY = HEAD + `
uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform sampler2D uDye;
uniform float uCurlAmt; uniform float uBuoy; uniform float uDt;
void main(){
  float L=texture(uCurl,vL).x, R=texture(uCurl,vR).x, T=texture(uCurl,vT).x, B=texture(uCurl,vB).x, C=texture(uCurl,vUv).x;
  vec2 f = .5*vec2(abs(T)-abs(B), abs(R)-abs(L));
  f /= length(f)+1e-4; f *= uCurlAmt*C; f.y *= -1.;
  vec2 v = texture(uVelocity,vUv).xy + f*uDt;
  float d = texture(uDye,vUv).r;
  v.y += uBuoy * min(d,1.5) * 60. * uDt;
  o = vec4(clamp(v,-1000.,1000.),0.,1.);
}`;

const PRESSURE = HEAD + `
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main(){
  float L=texture(uPressure,vL).x, R=texture(uPressure,vR).x, T=texture(uPressure,vT).x, B=texture(uPressure,vB).x;
  o = vec4((L+R+B+T-texture(uDivergence,vUv).x)*.25,0.,0.,1.);
}`;

const GRADIENT = HEAD + `
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main(){
  float L=texture(uPressure,vL).x, R=texture(uPressure,vR).x, T=texture(uPressure,vT).x, B=texture(uPressure,vB).x;
  vec2 v = texture(uVelocity,vUv).xy - vec2(R-L,T-B);
  o = vec4(v,0.,1.);
}`;

const CLEAR = HEAD + `
uniform sampler2D uTexture; uniform float uValue;
void main(){ o = uValue*texture(uTexture,vUv); }`;

// Satu tone merah: tepi lebih terang/transparan → badan #ff0000 → inti sedikit lebih gelap
const DISPLAY = HEAD + `
uniform sampler2D uDye; uniform float uTime; uniform float uAspect;
float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y);
}
void main(){
  float d = texture(uDye,vUv).r;
  vec2 p = vec2(vUv.x*uAspect, vUv.y)*7.;
  float n = noise(p + vec2(0.,-uTime*1.6)) * .6 + noise(p*2.1 + vec2(0.,-uTime*2.7)) * .4;
  d *= .72 + .56*n;                                // lidah api bergetar
  float a = smoothstep(.07,.5,d);
  float core = smoothstep(.55,1.5,d);
  vec3 outer = vec3(1.,.16,.10);                   // tepi: merah lebih terang
  vec3 body  = vec3(1.,0.,0.);                     // #ff0000
  vec3 deep  = vec3(.74,0.,0.);                    // inti: merah lebih dalam
  vec3 col = mix(outer, body, smoothstep(.1,.55,d));
  col = mix(col, deep, core);
  a *= .7;
  o = vec4(col*a, a);
}`;

type FBO = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };
type DoubleFBO = { read: FBO; write: FBO; swap: () => void };

export function createFlameFluid(canvas: HTMLCanvasElement, opts: FlameOptions = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;
  if (!gl.getExtension("EXT_color_buffer_float")) return null;
  gl.getExtension("OES_texture_float_linear");

  // ---------- program ----------
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || "shader error");
    }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const makeProgram = (frag: string) => {
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p) || "link error");
    }
    const cache: Record<string, WebGLUniformLocation | null> = {};
    const u = (n: string) => (n in cache ? cache[n] : (cache[n] = gl.getUniformLocation(p, n)));
    return { p, u };
  };

  let progs: ReturnType<typeof makeProgram>[] = [];
  let P: Record<string, ReturnType<typeof makeProgram>>;
  try {
    P = {
      splat: makeProgram(SPLAT),
      advect: makeProgram(ADVECT),
      div: makeProgram(DIVERGENCE),
      curl: makeProgram(CURL),
      vort: makeProgram(VORTICITY),
      press: makeProgram(PRESSURE),
      grad: makeProgram(GRADIENT),
      clear: makeProgram(CLEAR),
      display: makeProgram(DISPLAY),
    };
    progs = Object.values(P);
  } catch (e) {
    console.warn("[flameFluid]", e);
    return null;
  }

  // ---------- quad ----------
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND);

  // ---------- FBO ----------
  const createFBO = (w: number, h: number, filter: number): FBO => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h };
  };
  const createDouble = (w: number, h: number, filter: number): DoubleFBO => {
    const a = createFBO(w, h, filter);
    const b = createFBO(w, h, filter);
    const d: DoubleFBO = {
      read: a,
      write: b,
      swap() {
        const t = d.read;
        d.read = d.write;
        d.write = t;
      },
    };
    return d;
  };
  const free = (f: FBO) => {
    gl.deleteTexture(f.tex);
    gl.deleteFramebuffer(f.fbo);
  };

  let velocity: DoubleFBO, dye: DoubleFBO, pressure: DoubleFBO;
  let divergence: FBO, curlF: FBO;
  let simW = 0, simH = 0, dyeW = 0, dyeH = 0;

  const resolution = (base: number, aspect: number): [number, number] =>
    aspect >= 1
      ? [Math.round(base * aspect), Math.round(base)]
      : [Math.round(base), Math.round(base / aspect)];

  const build = () => {
    const aspect = canvas.width / canvas.height;
    [simW, simH] = resolution(cfg.simRes, aspect);
    [dyeW, dyeH] = resolution(cfg.dyeRes, aspect);
    if (velocity) {
      free(velocity.read); free(velocity.write);
      free(dye.read); free(dye.write);
      free(pressure.read); free(pressure.write);
      free(divergence); free(curlF);
    }
    velocity = createDouble(simW, simH, gl.LINEAR);
    dye = createDouble(dyeW, dyeH, gl.LINEAR);
    pressure = createDouble(simW, simH, gl.NEAREST);
    divergence = createFBO(simW, simH, gl.NEAREST);
    curlF = createFBO(simW, simH, gl.NEAREST);
  };

  const useProgram = (p: (typeof P)[string], texelW: number, texelH: number) => {
    gl.useProgram(p.p);
    gl.uniform2f(p.u("uTexel"), 1 / texelW, 1 / texelH);
  };
  const bindTex = (p: (typeof P)[string], name: string, tex: WebGLTexture, unit: number) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(p.u(name), unit);
  };
  const blit = (target: FBO | null) => {
    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.w, target.h);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  // ---------- resize ----------
  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (w !== canvas.width || h !== canvas.height || !velocity) {
      canvas.width = w;
      canvas.height = h;
      build();
    }
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);

  // ---------- step ----------
  const splat = (x: number, y: number, dx: number, dy: number, amount: number) => {
    const aspect = canvas.width / canvas.height;
    const radius = (cfg.splatRadius / 100) * (aspect > 1 ? aspect : 1);

    useProgram(P.splat, simW, simH);
    gl.uniform1f(P.splat.u("uAspect"), aspect);
    gl.uniform2f(P.splat.u("uPoint"), x, y);
    gl.uniform1f(P.splat.u("uRadius"), radius);
    bindTex(P.splat, "uTarget", velocity.read.tex, 0);
    gl.uniform3f(P.splat.u("uColor"), dx, dy, 0);
    blit(velocity.write);
    velocity.swap();

    useProgram(P.splat, dyeW, dyeH);
    bindTex(P.splat, "uTarget", dye.read.tex, 0);
    gl.uniform3f(P.splat.u("uColor"), amount, 0, 0);
    gl.uniform1f(P.splat.u("uRadius"), radius * 0.8);
    blit(dye.write);
    dye.swap();
  };

  const step = (dt: number) => {
    // curl
    useProgram(P.curl, simW, simH);
    bindTex(P.curl, "uVelocity", velocity.read.tex, 0);
    blit(curlF);

    // vorticity + buoyancy
    useProgram(P.vort, simW, simH);
    bindTex(P.vort, "uVelocity", velocity.read.tex, 0);
    bindTex(P.vort, "uCurl", curlF.tex, 1);
    bindTex(P.vort, "uDye", dye.read.tex, 2);
    gl.uniform1f(P.vort.u("uCurlAmt"), cfg.curl);
    gl.uniform1f(P.vort.u("uBuoy"), cfg.buoyancy);
    gl.uniform1f(P.vort.u("uDt"), dt);
    blit(velocity.write);
    velocity.swap();

    // divergence
    useProgram(P.div, simW, simH);
    bindTex(P.div, "uVelocity", velocity.read.tex, 0);
    blit(divergence);

    // pressure (warm start dengan decay)
    useProgram(P.clear, simW, simH);
    bindTex(P.clear, "uTexture", pressure.read.tex, 0);
    gl.uniform1f(P.clear.u("uValue"), 0.8);
    blit(pressure.write);
    pressure.swap();

    useProgram(P.press, simW, simH);
    bindTex(P.press, "uDivergence", divergence.tex, 1);
    for (let i = 0; i < cfg.pressureIterations; i++) {
      bindTex(P.press, "uPressure", pressure.read.tex, 0);
      blit(pressure.write);
      pressure.swap();
    }

    // gradient subtract
    useProgram(P.grad, simW, simH);
    bindTex(P.grad, "uPressure", pressure.read.tex, 0);
    bindTex(P.grad, "uVelocity", velocity.read.tex, 1);
    blit(velocity.write);
    velocity.swap();

    // advect velocity
    useProgram(P.advect, simW, simH);
    gl.uniform2f(P.advect.u("uSimTexel"), 1 / simW, 1 / simH);
    bindTex(P.advect, "uVelocity", velocity.read.tex, 0);
    bindTex(P.advect, "uSource", velocity.read.tex, 1);
    gl.uniform1f(P.advect.u("uDt"), dt);
    gl.uniform1f(P.advect.u("uDiss"), cfg.velocityDissipation);
    blit(velocity.write);
    velocity.swap();

    // advect dye
    useProgram(P.advect, dyeW, dyeH);
    gl.uniform2f(P.advect.u("uSimTexel"), 1 / simW, 1 / simH);
    bindTex(P.advect, "uVelocity", velocity.read.tex, 0);
    bindTex(P.advect, "uSource", dye.read.tex, 1);
    gl.uniform1f(P.advect.u("uDiss"), cfg.dyeDissipation);
    blit(dye.write);
    dye.swap();
  };

  const render = (time: number) => {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    useProgram(P.display, canvas.width, canvas.height);
    bindTex(P.display, "uDye", dye.read.tex, 0);
    gl.uniform1f(P.display.u("uTime"), time);
    gl.uniform1f(P.display.u("uAspect"), canvas.width / canvas.height);
    blit(null);
    gl.disable(gl.BLEND);
  };

  // ---------- pointer ----------
  let px = -1, py = -1, hasPrev = false;
  let pendingX = 0, pendingY = 0, pendingDx = 0, pendingDy = 0, pendingAmt = 0, pendingMoved = false;

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;
    if (hasPrev) {
      const dx = x - px;
      const dy = y - py;
      pendingDx += dx;
      pendingDy += dy;
      pendingAmt += Math.min(Math.hypot(dx * (canvas.width / canvas.height), dy) * 9, 0.9);
      pendingMoved = true;
    }
    pendingX = x;
    pendingY = y;
    px = x;
    py = y;
    hasPrev = true;
    if (sleeping && running) {
      sleeping = false;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  const onLeave = () => {
    hasPrev = false;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);

  // ---------- loop ----------
  let raf = 0;
  let last = performance.now();
  const t0 = last;
  let running = true;
  let idleFrames = 0;
  let sleeping = false; // true = loop rAF dihentikan total saat api sudah padam

  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    if (dt <= 0) return;

    if (pendingMoved) {
      splat(
        pendingX,
        pendingY,
        pendingDx * cfg.splatForce,
        pendingDy * cfg.splatForce,
        Math.min(pendingAmt, 0.9)
      );
      pendingDx = pendingDy = pendingAmt = 0;
      pendingMoved = false;
      idleFrames = 0;
    } else {
      idleFrames++;
    }

    // Setelah api padam total, hentikan simulasi supaya GPU idle
    if (idleFrames < 360) {
      step(dt);
      render((now - t0) / 1000);
    } else {
      if (idleFrames === 360) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      // Hentikan penjadwalan frame; dibangunkan lagi oleh pointermove
      cancelAnimationFrame(raf);
      sleeping = true;
    }
  };
  raf = requestAnimationFrame(frame);

  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      last = performance.now();
      if (!sleeping) raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  return {
    /** Untuk uji manual / debug: tambahkan semburan di titik (0..1). */
    splat,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      free(velocity.read); free(velocity.write);
      free(dye.read); free(dye.write);
      free(pressure.read); free(pressure.write);
      free(divergence); free(curlF);
      progs.forEach((p) => gl.deleteProgram(p.p));
      gl.deleteShader(vs);
      gl.deleteBuffer(vbo);
    },
  };
}