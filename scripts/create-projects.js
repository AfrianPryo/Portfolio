/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'projects');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Project 1: AGILISM 3D
const p1 = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 600' width='960' height='600'>
  <defs>
    <linearGradient id='bg1' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#0a0202'/>
      <stop offset='50%' stop-color='#160404'/>
      <stop offset='100%' stop-color='#000000'/>
    </linearGradient>
    <radialGradient id='glow1' cx='50%' cy='45%' r='50%'>
      <stop offset='0%' stop-color='#ff2200' stop-opacity='0.45'/>
      <stop offset='60%' stop-color='#880000' stop-opacity='0.15'/>
      <stop offset='100%' stop-color='#000000' stop-opacity='0'/>
    </radialGradient>
    <linearGradient id='card-grad1' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#ff3311'/>
      <stop offset='100%' stop-color='#aa0000'/>
    </linearGradient>
    <filter id='drop1' x='-20%' y='-20%' width='140%' height='140%'>
      <feDropShadow dx='0' dy='15' stdDeviation='25' flood-color='#ff0000' flood-opacity='0.25'/>
    </filter>
  </defs>
  <rect width='960' height='600' fill='url(#bg1)'/>
  <circle cx='480' cy='270' r='320' fill='url(#glow1)'/>
  
  <g stroke='#ff2200' stroke-opacity='0.08' stroke-width='1'>
    <line x1='80' y1='0' x2='80' y2='600'/>
    <line x1='240' y1='0' x2='240' y2='600'/>
    <line x1='480' y1='0' x2='480' y2='600'/>
    <line x1='720' y1='0' x2='720' y2='600'/>
    <line x1='880' y1='0' x2='880' y2='600'/>
    <line x1='0' y1='120' x2='960' y2='120'/>
    <line x1='0' y1='280' x2='960' y2='280'/>
    <line x1='0' y1='440' x2='960' y2='440'/>
  </g>

  <g transform='translate(480, 260)' filter='url(#drop1)'>
    <path d='M-180,-40 C-100,-140 0,-160 80,-90 C160,-20 180,60 110,130 C40,200 -80,180 -140,110 C-200,40 -260,60 -180,-40 Z' fill='none' stroke='url(#card-grad1)' stroke-width='12' stroke-linecap='round'/>
    <path d='M-130,-10 C-60,-90 20,-110 90,-50 C160,10 140,80 80,120 C20,160 -60,130 -100,70 Z' fill='none' stroke='#ffffff' stroke-opacity='0.6' stroke-width='4'/>
    <circle cx='-10' cy='15' r='55' fill='#ff2200' fill-opacity='0.18' stroke='#ff2200' stroke-width='2'/>
    <ellipse cx='0' cy='0' rx='220' ry='70' fill='none' stroke='#ff4422' stroke-opacity='0.4' stroke-width='1.5' transform='rotate(-22)' stroke-dasharray='8 6'/>
  </g>

  <rect x='60' y='50' width='840' height='48' rx='8' fill='#180808' fill-opacity='0.7' stroke='#ff2200' stroke-opacity='0.25'/>
  <circle cx='90' cy='74' r='5' fill='#ff3322'/>
  <circle cx='108' cy='74' r='5' fill='#ff7733'/>
  <circle cx='126' cy='74' r='5' fill='#33ff77'/>
  <text x='160' y='79' fill='#ffffff' fill-opacity='0.6' font-family='monospace' font-size='13' letter-spacing='2'>AGILISM // SPATIAL ENGINE v2.4</text>
  <rect x='760' y='62' width='120' height='24' rx='12' fill='#ff2200' fill-opacity='0.2' stroke='#ff2200' stroke-opacity='0.4'/>
  <text x='820' y='78' fill='#ff4422' font-family='sans-serif' font-size='11' font-weight='bold' text-anchor='middle'>LIVE DEMO</text>

  <g transform='translate(80, 480)'>
    <rect width='280' height='64' rx='10' fill='#140505' fill-opacity='0.85' stroke='#ff2200' stroke-opacity='0.3'/>
    <text x='24' y='28' fill='#ff3322' font-family='sans-serif' font-size='11' font-weight='bold' letter-spacing='1.5'>INTERACTIVE WEBGL</text>
    <text x='24' y='48' fill='#ffffff' font-family='sans-serif' font-size='15' font-weight='600'>Procedural Mesh Physics</text>
  </g>
  <g transform='translate(600, 480)'>
    <rect width='280' height='64' rx='10' fill='#140505' fill-opacity='0.85' stroke='#ffffff' stroke-opacity='0.15'/>
    <text x='24' y='28' fill='#888888' font-family='sans-serif' font-size='11' font-weight='bold' letter-spacing='1.5'>PERFORMANCE</text>
    <text x='24' y='48' fill='#ffffff' font-family='sans-serif' font-size='15' font-weight='600'>60 FPS Desktop &amp; Mobile</text>
  </g>
</svg>`;

// Project 2: CHRONO ARCHIVE
const p2 = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 600' width='960' height='600'>
  <defs>
    <linearGradient id='bg2' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#0f0e0d'/>
      <stop offset='100%' stop-color='#000000'/>
    </linearGradient>
  </defs>
  <rect width='960' height='600' fill='url(#bg2)'/>
  <g stroke='#ffffff' stroke-opacity='0.05' stroke-width='1'>
    <line x1='0' y1='100' x2='960' y2='100'/>
    <line x1='0' y1='500' x2='960' y2='500'/>
    <line x1='320' y1='0' x2='320' y2='600'/>
    <line x1='640' y1='0' x2='640' y2='600'/>
  </g>
  <text x='80' y='210' fill='#222222' font-family='serif' font-size='140' font-weight='bold' letter-spacing='-4'>CHRONO</text>
  <text x='80' y='320' fill='#ff2200' font-family='serif' font-size='100' font-weight='bold' letter-spacing='-2'>ARCHIVE.</text>
  
  <rect x='520' y='140' width='360' height='320' rx='12' fill='#191716' stroke='#ffffff' stroke-opacity='0.12'/>
  <circle cx='700' cy='280' r='80' fill='none' stroke='#ff3300' stroke-width='2' stroke-dasharray='12 8'/>
  <circle cx='700' cy='280' r='50' fill='#ffffff' fill-opacity='0.05'/>
  <text x='700' y='286' fill='#ffffff' font-family='sans-serif' font-size='20' font-weight='bold' text-anchor='middle'>2025</text>
  <text x='550' y='420' fill='#aaaaaa' font-family='monospace' font-size='12' letter-spacing='1'>KINETIC TYPOGRAPHY EXPERIMENT</text>
  <text x='80' y='430' fill='#888888' font-family='sans-serif' font-size='16'>High-fidelity digital preservation platform for tactile sound &amp; letterforms.</text>
</svg>`;

// Project 3: LUMEN ENGINE
const p3 = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 600' width='960' height='600'>
  <defs>
    <linearGradient id='bg3' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#050811'/>
      <stop offset='100%' stop-color='#000000'/>
    </linearGradient>
    <linearGradient id='glow3' x1='0' y1='0' x2='1' y2='0'>
      <stop offset='0%' stop-color='#0066ff' stop-opacity='0.3'/>
      <stop offset='100%' stop-color='#ff2200' stop-opacity='0.4'/>
    </linearGradient>
  </defs>
  <rect width='960' height='600' fill='url(#bg3)'/>
  
  <path d='M80,420 C220,380 300,450 420,320 C540,190 620,290 740,160 C800,90 840,120 880,100 L880,480 L80,480 Z' fill='url(#glow3)'/>
  <path d='M80,420 C220,380 300,450 420,320 C540,190 620,290 740,160 C800,90 840,120 880,100' fill='none' stroke='#ff3322' stroke-width='4'/>
  
  <g transform='translate(80, 80)'>
    <text x='0' y='36' fill='#ffffff' font-family='sans-serif' font-size='32' font-weight='800'>LUMEN ANALYTICS</text>
    <text x='0' y='64' fill='#ff4422' font-family='monospace' font-size='13' letter-spacing='2'>REAL-TIME GPU TRADING VISUALIZER</text>
  </g>
  <g transform='translate(680, 70)'>
    <rect width='200' height='70' rx='8' fill='#111827' stroke='#ff3322' stroke-opacity='0.4'/>
    <text x='20' y='30' fill='#9ca3af' font-family='sans-serif' font-size='12'>VOLATILITY INDEX</text>
    <text x='20' y='54' fill='#34d399' font-family='sans-serif' font-size='20' font-weight='bold'>+142.8% ▲</text>
  </g>
</svg>`;

// Project 4: AURA SOUND LAB
const p4 = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 600' width='960' height='600'>
  <defs>
    <linearGradient id='bg4' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#120412'/>
      <stop offset='100%' stop-color='#000000'/>
    </linearGradient>
  </defs>
  <rect width='960' height='600' fill='url(#bg4)'/>
  
  <g stroke='#ff2244' stroke-width='2' stroke-opacity='0.8' fill='none'>
    <path d='M60,300 Q200,120 340,300 T620,300 T900,300'/>
    <path d='M60,300 Q180,80 320,300 T600,300 T900,300' stroke='#ff6600' stroke-opacity='0.6'/>
    <path d='M60,300 Q220,180 360,300 T640,300 T900,300' stroke='#ffffff' stroke-opacity='0.5'/>
    <path d='M60,300 Q240,240 380,300 T660,300 T900,300' stroke='#ff0055' stroke-opacity='0.4'/>
  </g>
  
  <text x='480' y='140' fill='#ffffff' font-family='serif' font-size='44' font-weight='normal' text-anchor='middle' letter-spacing='4'>AURA SOUND LAB</text>
  <text x='480' y='175' fill='#ff3322' font-family='monospace' font-size='12' text-anchor='middle' letter-spacing='3'>GENERATIVE FREQUENCY SYNTHESIS</text>

  <g transform='translate(200, 420)'>
    ${Array.from({length: 28}, (_, i) => {
      const h = 20 + Math.sin(i*0.5)*45 + Math.cos(i*0.8)*25;
      return `<rect x='${i*20}' y='${80 - h}' width='10' height='${h}' rx='3' fill='${i%3===0 ? '#ff2200' : '#ffffff'}' fill-opacity='${0.4 + (i%5)*0.12}'/>`;
    }).join('')}
  </g>
</svg>`;

// Project 5: SOLARIS OS
const p5 = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 600' width='960' height='600'>
  <defs>
    <linearGradient id='bg5' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#0f0f0f'/>
      <stop offset='100%' stop-color='#000000'/>
    </linearGradient>
  </defs>
  <rect width='960' height='600' fill='url(#bg5)'/>
  <rect x='60' y='60' width='840' height='480' rx='16' fill='#171717' stroke='#ff2200' stroke-opacity='0.3' stroke-width='1.5'/>
  <rect x='60' y='60' width='840' height='50' rx='16' fill='#222222' stroke='#ffffff' stroke-opacity='0.08'/>
  <text x='100' y='92' fill='#ffffff' font-family='sans-serif' font-weight='bold' font-size='16'>SOLARIS</text>
  <text x='180' y='92' fill='#ff3322' font-family='monospace' font-size='12'>SYSTEM // v3.0</text>
  
  <rect x='90' y='140' width='360' height='360' rx='10' fill='#0f0f0f' stroke='#ffffff' stroke-opacity='0.08'/>
  <text x='120' y='180' fill='#ffffff' font-family='sans-serif' font-size='24' font-weight='700'>NEO-BRUTALIST</text>
  <text x='120' y='210' fill='#ff3322' font-family='sans-serif' font-size='24' font-weight='700'>COMMERCE</text>
  <circle cx='270' cy='330' r='90' fill='#ff2200' fill-opacity='0.15' stroke='#ff2200' stroke-width='2'/>
  <text x='270' y='336' fill='#ffffff' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle'>COLLECTION '26</text>

  <rect x='480' y='140' width='390' height='165' rx='10' fill='#0f0f0f' stroke='#ffffff' stroke-opacity='0.08'/>
  <text x='510' y='180' fill='#aaaaaa' font-family='sans-serif' font-size='14'>ARCHITECTURE</text>
  <text x='510' y='215' fill='#ffffff' font-family='sans-serif' font-size='20' font-weight='bold'>Frictionless Modular Checkout</text>

  <rect x='480' y='335' width='390' height='165' rx='10' fill='#0f0f0f' stroke='#ff2200' stroke-opacity='0.2'/>
  <text x='510' y='375' fill='#ff3322' font-family='sans-serif' font-size='14'>AWARDS</text>
  <text x='510' y='410' fill='#ffffff' font-family='sans-serif' font-size='20' font-weight='bold'>CSSDA Site of the Day</text>
</svg>`;

fs.writeFileSync(path.join(dir, 'project-1.svg'), p1);
fs.writeFileSync(path.join(dir, 'project-2.svg'), p2);
fs.writeFileSync(path.join(dir, 'project-3.svg'), p3);
fs.writeFileSync(path.join(dir, 'project-4.svg'), p4);
fs.writeFileSync(path.join(dir, 'project-5.svg'), p5);
console.log('Project thumbnails created successfully in public/projects!');
