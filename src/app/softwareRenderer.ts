import * as THREE from "three";

/**
 * Renderer cadangan tanpa WebGL: memproyeksikan mesh Three.js ke canvas 2D.
 *
 * Dipakai OrnamentScene saat browser tidak punya akses GPU (hardware acceleration mati / diblokir).
 * Scene graph, kamera, dan seluruh animasi tetap sama dengan versi WebGL; hanya tahap menggambar
 * yang diganti. Hasilnya tetap objek 3D (berputar, berperspektif, berbayang), bukan gambar 2D/SVG.
 *
 * Pencahayaan disederhanakan: flat shading per segitiga dari dua arah cahaya (key + fill),
 * dikelompokkan ke beberapa tingkat warna supaya satu mesh cukup digambar dengan beberapa path.
 */

const SHADE_LEVELS = 14;
const DARK = new THREE.Color(0x8f0c0c);
const LIGHT = new THREE.Color(0xff6a58);

// Sama dengan arah DirectionalLight "key" & "fill" di OrnamentScene (sudah dinormalisasi di bawah)
const KEY = new THREE.Vector3(0.3, 1, -0.4).normalize();
const FILL = new THREE.Vector3(-0.5, 0.6, 0.3).normalize();

const palette: string[] = Array.from({ length: SHADE_LEVELS }, (_, i) => {
  const c = DARK.clone().lerp(LIGHT, i / (SHADE_LEVELS - 1));
  return `#${c.getHexString()}`;
});

type Work = { world: Float32Array; sx: Float32Array; sy: Float32Array; ok: Uint8Array };

export class SoftwareRenderer {
  readonly isSoftware = true;
  readonly domElement: HTMLCanvasElement = document.createElement("canvas");
  // Properti ini hanya ada supaya antarmukanya sama dengan WebGLRenderer
  toneMapping = 0;
  toneMappingExposure = 1;

  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private work = new WeakMap<THREE.BufferGeometry, Work>();

  private readonly viewProj = new THREE.Matrix4();
  private readonly mvp = new THREE.Matrix4();
  private readonly v = new THREE.Vector3();
  private readonly a = new THREE.Vector3();
  private readonly b = new THREE.Vector3();
  private readonly c = new THREE.Vector3();
  private readonly n = new THREE.Vector3();
  private readonly center = new THREE.Vector3();

  constructor() {
    const ctx = this.domElement.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D tidak tersedia");
    this.ctx = ctx;
  }

  setClearColor() {}

  setPixelRatio(ratio: number) {
    // Rasterisasi di CPU: batasi supaya tetap ringan di laptop tanpa GPU
    this.dpr = Math.min(Math.max(ratio, 1), 1.5);
  }

  setSize(width: number, height: number) {
    this.w = width;
    this.h = height;
    this.domElement.width = Math.max(1, Math.round(width * this.dpr));
    this.domElement.height = Math.max(1, Math.round(height * this.dpr));
  }

  clear() {
    const { ctx, domElement } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, domElement.width, domElement.height);
  }

  render(scene: THREE.Object3D, camera: THREE.Camera) {
    const { ctx } = this;
    if (!this.w || !this.h) return;

    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    this.viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

    this.clear();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.lineJoin = "round";
    ctx.lineWidth = 0.8; // garis tipis sewarna isi: menutup celah antar segitiga

    const meshes: Array<{ mesh: THREE.Mesh; dist: number }> = [];
    const camPos = this.a.setFromMatrixPosition(camera.matrixWorld);
    scene.traverseVisible((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry?.getAttribute("position")) return;
      if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
      this.center.copy(mesh.geometry.boundingSphere!.center).applyMatrix4(mesh.matrixWorld);
      meshes.push({ mesh, dist: this.center.distanceTo(camPos) });
    });
    meshes.sort((p, q) => q.dist - p.dist); // jauh -> dekat

    for (const { mesh } of meshes) this.drawMesh(mesh);
  }

  private drawMesh(mesh: THREE.Mesh) {
    const { ctx, v, a, b, c, n } = this;
    const geo = mesh.geometry;
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const count = pos.count;

    let work = this.work.get(geo);
    if (!work || work.sx.length !== count) {
      work = {
        world: new Float32Array(count * 3),
        sx: new Float32Array(count),
        sy: new Float32Array(count),
        ok: new Uint8Array(count),
      };
      this.work.set(geo, work);
    }

    this.mvp.multiplyMatrices(this.viewProj, mesh.matrixWorld);
    const e = this.mvp.elements;
    const m = mesh.matrixWorld;
    const W = this.w;
    const H = this.h;

    for (let i = 0; i < count; i++) {
      v.fromBufferAttribute(pos, i);
      const x = v.x;
      const y = v.y;
      const z = v.z;
      const cw = e[3] * x + e[7] * y + e[11] * z + e[15];
      if (cw <= 1e-6) {
        work.ok[i] = 0;
        continue;
      }
      const cx = (e[0] * x + e[4] * y + e[8] * z + e[12]) / cw;
      const cy = (e[1] * x + e[5] * y + e[9] * z + e[13]) / cw;
      work.sx[i] = (cx * 0.5 + 0.5) * W;
      work.sy[i] = (1 - (cy * 0.5 + 0.5)) * H;
      work.ok[i] = 1;
      // posisi dunia untuk menghitung normal permukaan
      work.world[i * 3] = m.elements[0] * x + m.elements[4] * y + m.elements[8] * z + m.elements[12];
      work.world[i * 3 + 1] = m.elements[1] * x + m.elements[5] * y + m.elements[9] * z + m.elements[13];
      work.world[i * 3 + 2] = m.elements[2] * x + m.elements[6] * y + m.elements[10] * z + m.elements[14];
    }

    // Kelompokkan segitiga per tingkat warna -> satu path per tingkat
    const buckets: Array<number[]> = Array.from({ length: SHADE_LEVELS }, () => []);
    const index = geo.getIndex();
    const triCount = index ? index.count / 3 : count / 3;

    for (let t = 0; t < triCount; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3;
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
      if (!work.ok[i0] || !work.ok[i1] || !work.ok[i2]) continue;

      a.fromArray(work.world, i0 * 3);
      b.fromArray(work.world, i1 * 3);
      c.fromArray(work.world, i2 * 3);
      n.subVectors(b, a).cross(c.sub(a));
      const len = n.length();
      if (len < 1e-12) continue; // segitiga degenerate
      n.divideScalar(len);

      // Material DoubleSide: sisi depan & belakang sama-sama terlihat
      const tone = 0.3 + 0.5 * Math.abs(n.dot(KEY)) + 0.2 * Math.abs(n.dot(FILL));
      const level = Math.min(SHADE_LEVELS - 1, Math.max(0, Math.round(tone * (SHADE_LEVELS - 1))));
      buckets[level].push(i0, i1, i2);
    }

    for (let L = 0; L < SHADE_LEVELS; L++) {
      const tris = buckets[L];
      if (!tris.length) continue;
      ctx.beginPath();
      for (let k = 0; k < tris.length; k += 3) {
        const i0 = tris[k];
        const i1 = tris[k + 1];
        const i2 = tris[k + 2];
        ctx.moveTo(work.sx[i0], work.sy[i0]);
        ctx.lineTo(work.sx[i1], work.sy[i1]);
        ctx.lineTo(work.sx[i2], work.sy[i2]);
        ctx.closePath();
      }
      ctx.fillStyle = palette[L];
      ctx.strokeStyle = palette[L];
      ctx.fill();
      ctx.stroke();
    }
  }

  dispose() {}
  forceContextLoss() {}
}