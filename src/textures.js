// Small procedural canvas textures so surfaces read as materials rather
// than flat colours — no image assets needed.

import * as THREE from 'three';

function hexToRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function make(size, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function speckle(g, size, [r, gr, b], variation, count, dot = 2) {
  for (let i = 0; i < count; i++) {
    const s = 1 - variation + Math.random() * variation * 2;
    g.fillStyle = `rgba(${Math.round(r * s)},${Math.round(gr * s)},${Math.round(b * s)},0.55)`;
    g.fillRect(Math.random() * size, Math.random() * size, dot, dot);
  }
}

// mottled flat colour (render walls, hedges, asphalt)
export function noiseTexture(hex, variation = 0.12, repeat = [1, 1], size = 256) {
  const rgb = hexToRgb(hex);
  return make(size, (g, s) => {
    g.fillStyle = hex;
    g.fillRect(0, 0, s, s);
    speckle(g, s, rgb, variation, s * s * 0.12, 2);
  }, repeat);
}

// lawn with faint mowing stripes
export function grassTexture(repeat = [80, 80]) {
  return make(512, (g, s) => {
    g.fillStyle = '#6f9358';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
      g.fillRect((i * s) / 8, 0, s / 8, s);
    }
    speckle(g, s, hexToRgb('#6f9358'), 0.22, 26000, 2);
  }, repeat);
}

// paving slabs with grout lines
export function paverTexture(hex, cells = 6, repeat = [1, 1]) {
  const rgb = hexToRgb(hex);
  return make(512, (g, s) => {
    g.fillStyle = hex;
    g.fillRect(0, 0, s, s);
    speckle(g, s, rgb, 0.08, 16000, 3);
    g.strokeStyle = 'rgba(60,55,50,0.45)';
    g.lineWidth = 3;
    const step = s / cells;
    for (let i = 0; i <= cells; i++) {
      g.beginPath(); g.moveTo(i * step, 0); g.lineTo(i * step, s); g.stroke();
      g.beginPath(); g.moveTo(0, i * step); g.lineTo(s, i * step); g.stroke();
    }
  }, repeat);
}

// timber with long grain streaks
export function woodTexture(hex, repeat = [1, 1]) {
  const rgb = hexToRgb(hex);
  return make(512, (g, s) => {
    g.fillStyle = hex;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      const sh = 0.82 + Math.random() * 0.34;
      g.fillStyle = `rgba(${Math.round(rgb[0] * sh)},${Math.round(rgb[1] * sh)},${Math.round(rgb[2] * sh)},0.5)`;
      g.fillRect(Math.random() * s, Math.random() * s, 40 + Math.random() * 220, 1 + Math.random() * 2);
    }
    // board joints
    g.fillStyle = 'rgba(40,25,10,0.35)';
    for (let y = 0; y < s; y += s / 6) g.fillRect(0, y, s, 2);
  }, repeat);
}

// seamless tiling normal map of gentle overlapping waves, for the water surface
export function waterNormalTexture(repeat = [4, 3]) {
  const s = 256;
  const waves = [];
  for (let k = 0; k < 7; k++) {
    waves.push({
      fx: Math.round(1 + Math.random() * 3) * (Math.random() < 0.5 ? -1 : 1),
      fy: Math.round(1 + Math.random() * 3) * (Math.random() < 0.5 ? -1 : 1),
      ph: Math.random() * Math.PI * 2,
      amp: 0.5 + Math.random() * 0.8,
    });
  }
  const h = (x, y) => {
    let v = 0;
    for (const w of waves) v += w.amp * Math.sin(((w.fx * x + w.fy * y) / s) * Math.PI * 2 + w.ph);
    return v;
  };
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const img = g.createImageData(s, s);
  const strength = 6;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * s + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.NoColorSpace;      // normal data, not colour
  return tex;
}

// soft light blobs — used as moving caustics on the pool floor
export function rippleTexture(repeat = [3, 2]) {
  return make(256, (g, s) => {
    g.fillStyle = '#2a9ad0';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) {
      const r = 10 + Math.random() * 30;
      const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, 'rgba(190,235,255,0.35)');
      grad.addColorStop(1, 'rgba(190,235,255,0)');
      g.save();
      g.translate(Math.random() * s, Math.random() * s);
      g.fillStyle = grad;
      g.fillRect(-r, -r, r * 2, r * 2);
      g.restore();
    }
  }, repeat);
}
