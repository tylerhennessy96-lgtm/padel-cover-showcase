// The grounds: a large glass-fronted modern mansion you can see into
// (furnished, lit at night), rooftop terrace, pool + poolhouse, garage wing
// with detailed cars, driveway, hedgerows and garden lighting.
// Pure scenery — nothing here is clickable.
//
// Stacking note: every horizontal slab sits at a unique height. Coplanar
// top faces (e.g. a floor resting exactly on a roof slab) z-fight and
// flicker, so floors always start 0.06 above the slab beneath them.

import * as THREE from 'three';
import { noiseTexture, paverTexture, woodTexture, rippleTexture, waterNormalTexture } from './textures.js';

// pool footprint — scene.js cuts a matching hole in the lawn so the basin
// is genuinely recessed below ground
export const POOL = { x: -9, z: -20.5, w: 10, d: 7, depth: 1.7 };

export function buildEstate(scene) {
  const g = new THREE.Group();
  scene.add(g);

  // ---------------- materials ----------------
  const render = new THREE.MeshStandardMaterial({ map: noiseTexture('#efece5', 0.05, [4, 2]), roughness: 0.85 });
  const cladding = new THREE.MeshStandardMaterial({ map: woodTexture('#3b3530', [3, 6]), roughness: 0.8 });
  const darkTrim = new THREE.MeshStandardMaterial({ color: 0x2c3238, roughness: 0.5, metalness: 0.45 });
  const wood = new THREE.MeshStandardMaterial({ map: woodTexture('#8a6a4a', [2, 2]), roughness: 0.8 });
  const oakFloor = new THREE.MeshStandardMaterial({ map: woodTexture('#b48a5c', [6, 3]), roughness: 0.6 });
  const plaster = new THREE.MeshStandardMaterial({ color: 0xe9e4dc, roughness: 0.9 });
  const deckStone = new THREE.MeshStandardMaterial({ map: paverTexture('#d8d3ca', 6, [12, 8]), roughness: 0.95 });
  const paver = new THREE.MeshStandardMaterial({ map: paverTexture('#c3beb4', 6, [15, 10]), roughness: 0.95 });
  const asphalt = new THREE.MeshStandardMaterial({ map: noiseTexture('#3f4347', 0.08, [20, 3]), roughness: 0.95 });
  const hedgeMat = new THREE.MeshStandardMaterial({ map: noiseTexture('#3d6a3e', 0.22, [10, 2]), roughness: 1 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4f35, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ map: noiseTexture('#4a7340', 0.2, [2, 2]), roughness: 1 });
  const charcoal = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.9 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.9 });
  const quartz = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.35 });
  const cabinet = new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: 0.5 });
  const rugMat = new THREE.MeshStandardMaterial({ color: 0xb8afa0, roughness: 1 });
  const linen = new THREE.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.95 });
  const stoneDark = new THREE.MeshStandardMaterial({ map: noiseTexture('#4a4744', 0.15, [3, 3]), roughness: 0.9 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.15, metalness: 1 });

  // real see-through glass — reflective, slightly tinted
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xbfd8e6, transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0.2,
    side: THREE.DoubleSide, depthWrite: false,
  });

  // emissive things that come on at night: {mat, day, night}
  const glows = [];
  const glowMat = (color, emissive, day, night, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: day, roughness: 0.6, ...extra });
    glows.push({ mat: m, day, night });
    return m;
  };
  const lampShade = glowMat(0xf1e6d2, 0xffd39a, 0.08, 1.9);
  const downlight = glowMat(0xdedede, 0xfff1d6, 0, 2.4);
  const ledStrip = glowMat(0xffffff, 0xfff3dd, 0, 1.6);
  const tvScreen = glowMat(0x0b0f14, 0x6fa8ff, 0, 0.7, { roughness: 0.2 });
  const bollardGlow = glowMat(0xd8dde1, 0xffd9a0, 0, 2.4);
  const sconce = glowMat(0xd0d4d8, 0xffd9a0, 0, 2.2);
  const headlight = glowMat(0xe8ecef, 0xf4f8ff, 0, 3.0);
  const tailLight = glowMat(0x3a0808, 0xff2a2a, 0.25, 1.6, { roughness: 0.3 });
  const fireGlow = glowMat(0x2a1a10, 0xff7a2a, 0.35, 2.6);
  // water surface: see-through, glossy, rippling normals reflecting the sky
  const water = new THREE.MeshPhysicalMaterial({
    color: 0x5cc4ec, transparent: true, opacity: 0.55, roughness: 0.03, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6,
    normalMap: waterNormalTexture([3, 2]), normalScale: new THREE.Vector2(0.35, 0.35),
    depthWrite: false,
  });
  // pale plaster basin with drifting caustic light patterns; glows at night
  const basin = new THREE.MeshStandardMaterial({
    map: rippleTexture([2.5, 1.8]), color: 0xd8f2f6, roughness: 0.8,
    emissive: 0x1e9fd8, emissiveIntensity: 0,
  });
  glows.push({ mat: basin, day: 0, night: 0.9 });

  // real lights for the night: {light, night}
  const nightLights = [];
  const addLight = (color, x, y, z, night, dist, decay = 1.8) => {
    const l = new THREE.PointLight(color, 0, dist, decay);
    l.position.set(x, y, z);
    g.add(l);
    nightLights.push({ light: l, night });
  };

  const bx = (w, h, d, mat, x, y, z, ry = 0, shadow = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.castShadow = shadow;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const cyl = (rt, rb, h, mat, x, y, z, seg = 10) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const disc = (r, mat, x, y, z, up = false) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 14), mat);
    m.position.set(x, y, z);
    m.rotation.x = up ? -Math.PI / 2 : Math.PI / 2;
    g.add(m);
    return m;
  };
  const lounger = (x, z, y0 = 0) => {
    bx(0.65, 0.22, 1.7, cream, x, y0 + 0.28, z);
    const back = bx(0.65, 0.2, 0.8, cream, x, y0 + 0.55, z + 0.75);
    back.rotation.x = -0.85;
    for (const [ox, oz] of [[-0.25, -0.7], [0.25, -0.7], [-0.25, 0.7], [0.25, 0.7]]) cyl(0.02, 0.02, 0.2, darkTrim, x + ox, y0 + 0.1, z + oz, 5);
  };
  const glassWall = (w, h, x, y, z, vertical = true, mullionStep = 3) => {
    // vertical=true: wall spans x; false: wall spans z
    if (vertical) {
      bx(w, h, 0.06, glass, x, y, z, 0, false);
      for (let mx = x - w / 2; mx <= x + w / 2 + 0.01; mx += mullionStep) bx(0.09, h, 0.12, darkTrim, mx, y, z);
      bx(w, 0.1, 0.12, darkTrim, x, y + h / 2 - 0.05, z);
      bx(w, 0.1, 0.12, darkTrim, x, y - h / 2 + 0.05, z);
    } else {
      bx(0.06, h, w, glass, x, y, z, 0, false);
      for (let mz = z - w / 2; mz <= z + w / 2 + 0.01; mz += mullionStep) bx(0.12, h, 0.09, darkTrim, x, y, mz);
      bx(0.12, 0.1, w, darkTrim, x, y + h / 2 - 0.05, z);
      bx(0.12, 0.1, w, darkTrim, x, y - h / 2 + 0.05, z);
    }
  };

  // ============================================================
  // MANSION — footprint x -14..18, z -46..-32, north of the court
  // ============================================================

  // ---- ground floor shell (y 0..4.3) ----
  bx(32, 0.12, 14, oakFloor, 2, 0.06, -39);                    // floor (0..0.12)
  bx(24, 0.1, 14, plaster, -2, 3.95, -39);                     // ceiling, west of the stair void
  bx(8, 0.1, 2, plaster, 14, 3.95, -33);                       // ceiling strip in front of the tower
  bx(32, 4, 0.3, render, 2, 2, -45.85);                        // back wall
  bx(0.3, 4, 14, render, -13.85, 2, -39);                      // west wall
  bx(0.3, 8.6, 12, cladding, 17.85, 4.3, -40);                 // east wall, full height (tower)
  bx(0.3, 4, 2, render, 17.85, 2, -33);                        // east wall, front stub
  bx(0.3, 8.6, 6, render, 10.15, 4.3, -43);                    // tower west wall, back half
  bx(24.4, 0.3, 14.4, darkTrim, -2.2, 4.15, -39);              // roof slab west (4.0..4.3)
  bx(8.4, 0.3, 2.2, darkTrim, 14.2, 4.15, -32.9);              // roof slab strip in front of tower
  bx(32.8, 0.5, 0.12, darkTrim, 2, 4.05, -31.75);              // fascia
  bx(32.4, 0.03, 0.05, ledStrip, 2, 3.79, -31.7);              // LED strip under the fascia

  // front glazing, split around the entrance portal
  glassWall(25.1, 3.9, -1.45, 2, -32.0, true, 3.2);
  glassWall(5.1, 3.9, 15.45, 2, -32.0, true, 2.5);
  // entrance portal: timber fins + header, pivot door, sconces
  bx(0.25, 4, 0.5, wood, 10.9, 2, -31.95);
  bx(0.25, 4, 0.5, wood, 13.1, 2, -31.95);
  bx(2.45, 0.45, 0.5, wood, 12, 3.78, -31.95);
  bx(1.8, 3.3, 0.14, cabinet, 12, 1.65, -31.97);
  cyl(0.02, 0.02, 1.3, chrome, 12.75, 1.6, -31.85, 6);
  bx(0.12, 0.3, 0.1, sconce, 10.9, 2.7, -31.65);
  bx(0.12, 0.3, 0.1, sconce, 13.1, 2.7, -31.65);

  // ---- ground-floor interior ----
  // living lounge (west end) — L sofa facing the glass, fireplace wall, TV
  bx(6, 0.02, 4.2, rugMat, -8, 0.13, -39, 0, false);
  bx(3.8, 0.45, 0.95, charcoal, -8, 0.35, -40.2);
  bx(3.8, 0.55, 0.25, charcoal, -8, 0.85, -40.75);
  bx(0.95, 0.45, 1.8, charcoal, -10.4, 0.35, -39.0);
  for (const px of [-9.2, -8, -6.8]) bx(0.6, 0.22, 0.4, cream, px, 0.7, -40.5);
  bx(1.6, 0.06, 0.8, wood, -8, 0.42, -38.3);
  for (const [lx, lz] of [[-8.7, -38.65], [-7.3, -38.65], [-8.7, -37.95], [-7.3, -37.95]]) cyl(0.03, 0.03, 0.36, darkTrim, lx, 0.24, lz, 6);
  bx(0.5, 2.6, 3.2, stoneDark, -13.45, 1.3, -36.5);            // fireplace feature wall
  bx(0.2, 0.5, 1.3, fireGlow, -13.15, 0.55, -36.5);            // fire slot
  bx(0.06, 1.35, 2.6, tvScreen, -13.62, 1.7, -41.5);           // TV
  bx(0.4, 0.5, 2.8, cabinet, -13.45, 0.37, -41.5);             // media unit
  bx(0.35, 2.4, 1.8, wood, -13.5, 1.32, -44.3);                // bookshelf
  for (let i = 0; i < 4; i++) bx(0.3, 0.04, 1.7, plaster, -13.5, 0.5 + i * 0.58, -44.3);
  cyl(0.02, 0.02, 1.55, darkTrim, -11.5, 0.9, -36.8, 6);       // floor lamp
  cyl(0.28, 0.22, 0.32, lampShade, -11.5, 1.75, -36.8, 12);
  addLight(0xffd9a0, -8, 3.2, -39, 55, 20);
  addLight(0xff8a3a, -12.8, 0.9, -36.5, 14, 6);

  // dining (middle) — 8 seats under a pendant run
  bx(3.2, 0.07, 1.1, wood, 1, 0.76, -40);
  for (const [lx, lz] of [[-0.4, -40.45], [2.4, -40.45], [-0.4, -39.55], [2.4, -39.55]]) cyl(0.03, 0.03, 0.72, darkTrim, lx, 0.38, lz, 6);
  for (const cx of [-0.2, 0.6, 1.4, 2.2]) {
    for (const cz of [-40.95, -39.05]) {
      bx(0.44, 0.06, 0.44, charcoal, cx, 0.47, cz);
      bx(0.44, 0.5, 0.06, charcoal, cx, 0.75, cz + (cz < -40 ? -0.19 : 0.19));
      for (const [ox, oz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) cyl(0.015, 0.015, 0.45, darkTrim, cx + ox, 0.23, cz + oz, 5);
    }
  }
  for (const px of [0.2, 1, 1.8]) {
    cyl(0.004, 0.004, 1.4, darkTrim, px, 3.2, -40, 4);
    cyl(0.14, 0.1, 0.22, lampShade, px, 2.45, -40, 12);
  }

  // kitchen (east of dining)
  bx(3, 0.82, 1.2, cabinet, 7, 0.47, -38.5);                   // island
  bx(3.2, 0.08, 1.4, quartz, 7, 0.92, -38.5);
  for (const sx of [6.2, 7, 7.8]) { cyl(0.17, 0.17, 0.06, charcoal, sx, 0.7, -37.5, 12); cyl(0.02, 0.02, 0.62, darkTrim, sx, 0.37, -37.5, 6); }
  bx(5.4, 0.86, 0.65, cabinet, 7.2, 0.49, -45.4);              // back run
  bx(5.4, 0.06, 0.7, quartz, 7.2, 0.95, -45.4);
  bx(5.4, 1.0, 0.36, cabinet, 7.2, 2.6, -45.55);               // wall cabinets
  bx(0.7, 2.1, 0.7, quartz, 9.7, 1.05, -45.35);                // fridge
  for (const px of [6.3, 7, 7.7]) {
    cyl(0.004, 0.004, 1.2, darkTrim, px, 3.3, -38.5, 4);
    cyl(0.1, 0.1, 0.2, lampShade, px, 2.6, -38.5, 12);
  }
  addLight(0xffe0b0, 7, 2.6, -39.5, 45, 14);

  // entrance hall (double height, inside the tower) — stair, chandelier, art
  for (let i = 0; i < 12; i++) {
    bx(2.4, 0.12, 0.6, oakFloor, 16.55, 0.12 + (i + 1) * 0.358 - 0.06, -34.8 - i * 0.58);
  }
  const balustrade = bx(0.04, 1.0, 8.3, glass, 15.35, 2.75, -38, 0, false);
  balustrade.rotation.x = 0.55;
  bx(1.8, 0.08, 0.45, wood, 12.3, 0.85, -45.4);                // console table
  for (const lx of [11.6, 13.0]) cyl(0.025, 0.025, 0.8, darkTrim, lx, 0.42, -45.4, 6);
  cyl(0.12, 0.09, 0.4, quartz, 12.3, 1.1, -45.4, 10);          // vase
  bx(2.6, 1.7, 0.06, charcoal, 12.6, 2.6, -45.66);             // artwork
  bx(2.2, 1.3, 0.02, cream, 12.6, 2.6, -45.62, 0, false);
  for (let i = 0; i < 9; i++) {                                // chandelier cluster
    const a = (i / 9) * Math.PI * 2;
    const r = 0.55 + (i % 3) * 0.3;
    const px = 13.3 + Math.cos(a) * r, pz = -38.5 + Math.sin(a) * r;
    const py = 5.2 + (i % 4) * 0.45;
    cyl(0.004, 0.004, 8.55 - py, darkTrim, px, (8.55 + py) / 2, pz, 4);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), lampShade);
    orb.position.set(px, py, pz);
    g.add(orb);
  }
  addLight(0xffd9a0, 13.5, 4.5, -39, 55, 16);

  // ground-floor downlights (none over the stair void)
  for (let x = -12; x <= 16; x += 3.5) {
    for (const z of [-35, -40.5]) {
      if (x > 10.5 && z < -40) continue;
      disc(0.09, downlight, x, 3.89, z);
    }
  }

  // ---- upper floor A: master suite, cantilevered 1 m over the terrace ----
  // x -14..4, z -46..-31, y 4.3..7.9  (floor top 4.42)
  bx(18, 0.12, 15, oakFloor, -5, 4.42, -38.5);                 // floor (4.36..4.48)
  bx(18, 0.06, 0.8, darkTrim, -5, 4.27, -31.4);                // soffit under the overhang
  bx(18, 0.1, 15, plaster, -5, 7.85, -38.5);                   // ceiling
  bx(18, 3.6, 0.3, render, -5, 6.1, -45.85);
  bx(0.3, 3.6, 15, render, -13.85, 6.1, -38.5);
  bx(0.3, 3.6, 15, render, 3.85, 6.1, -38.5);
  bx(18, 0.6, 0.3, render, -5, 4.6, -31.15);                   // spandrel below the glass
  bx(18, 0.5, 0.3, render, -5, 7.65, -31.15);                  // spandrel above
  glassWall(17.4, 2.5, -5, 6.15, -31.0, true, 2.9);
  bx(18.8, 0.3, 15.8, darkTrim, -5, 8.05, -38.5);              // roof slab (7.9..8.2)
  bx(18.8, 0.5, 0.12, darkTrim, -5, 7.95, -30.55);             // fascia
  bx(18.4, 0.03, 0.05, ledStrip, -5, 7.72, -30.5);
  bx(1, 1.3, 1, darkTrim, -9, 8.7, -42);                       // flue

  const fA = 4.48;                                             // finished floor level
  bx(5, 0.02, 3.6, rugMat, -9.5, fA + 0.01, -42.5, 0, false);
  bx(2.3, 1.3, 0.16, charcoal, -9.5, fA + 0.65, -45.6);        // headboard
  bx(2.1, 0.4, 2.2, cabinet, -9.5, fA + 0.2, -44.4);           // bed base
  bx(2.0, 0.18, 2.0, linen, -9.5, fA + 0.49, -44.3);           // duvet
  bx(0.75, 0.14, 0.38, linen, -10.05, fA + 0.65, -45.15);      // pillows
  bx(0.75, 0.14, 0.38, linen, -8.95, fA + 0.65, -45.15);
  for (const nx of [-11.0, -8.0]) {
    bx(0.5, 0.45, 0.45, wood, nx, fA + 0.225, -44.9);
    cyl(0.12, 0.09, 0.2, lampShade, nx, fA + 0.55, -44.9, 10);
  }
  for (const cx of [-11.5, -9.0]) {                            // lounge chairs at the glass
    bx(0.9, 0.42, 0.9, charcoal, cx, fA + 0.21, -33.2);
    bx(0.9, 0.7, 0.2, charcoal, cx, fA + 0.66, -33.75);
  }
  bx(0.5, 0.4, 0.5, wood, -10.25, fA + 0.2, -33.2);            // side table
  bx(4.5, 2.3, 0.5, cabinet, -2.5, fA + 1.15, -45.6);          // walk-in wardrobe run
  const tub = cyl(0.85, 0.85, 0.6, quartz, 1, fA + 0.3, -43.2, 20);   // freestanding bath
  tub.scale.x = 1.6;
  cyl(0.02, 0.02, 0.7, chrome, 1, fA + 0.7, -44.05, 6);        // floor-standing tap
  bx(2.0, 0.9, 0.55, wood, 2.4, fA + 0.45, -45.55);            // vanity
  bx(2.1, 0.06, 0.6, quartz, 2.4, fA + 0.93, -45.55);
  bx(1.2, 2.2, 1.2, glass, 2.9, fA + 1.1, -40.5, 0, false);    // shower enclosure
  for (let x = -12; x <= 2; x += 3.5) for (const z of [-34.5, -39.5, -44.5]) disc(0.09, downlight, x, 7.79, z);
  addLight(0xffd9a0, -8, 7.2, -41, 32, 15);
  addLight(0xffd9a0, 1, 7.2, -43, 18, 9);

  // ---- upper floor B: glass stair tower, x 10..18, z -46..-34, y 4.3..8.6 ----
  bx(8, 4.3, 0.3, cladding, 14, 6.45, -45.85);                 // back wall (dark cladding)
  glassWall(6, 4.3, 10.15, 6.45, -37, false, 2.5);             // west side, facing the terrace
  glassWall(7.7, 4.3, 14, 6.45, -34.0, true, 2.55);            // front
  bx(7.4, 0.12, 4, oakFloor, 14, 4.42, -43.7);                 // gallery landing
  bx(7.4, 1.0, 0.04, glass, 14, 4.98, -41.72, 0, false);       // landing balustrade
  bx(8.8, 0.3, 12.8, darkTrim, 14, 8.75, -40);                 // roof slab
  bx(8.8, 0.5, 0.12, darkTrim, 14, 8.6, -33.55);               // fascia
  bx(8.4, 0.03, 0.05, ledStrip, 14, 8.37, -33.5);

  // ---- rooftop terrace between the two upper volumes (x 4..10) ----
  bx(5.7, 0.06, 13.6, wood, 7, 4.36, -39.1);                   // decking (4.33..4.39)
  bx(5.7, 1.1, 0.05, glass, 7, 4.95, -31.9, 0, false);         // glass balustrade
  for (const px of [4.3, 7, 9.7]) cyl(0.03, 0.03, 1.1, chrome, px, 4.95, -31.9, 6);
  bx(5.7, 0.06, 0.06, chrome, 7, 5.5, -31.9);
  lounger(6, -36.5, 4.39); lounger(8, -36.5, 4.39);
  bx(0.5, 0.4, 0.5, wood, 7, 4.6, -35.4);
  for (const px of [5.2, 8.8]) {
    bx(1.2, 0.5, 1.2, cabinet, px, 4.65, -44.5);
    bx(1.0, 0.7, 1.0, hedgeMat, px, 5.25, -44.5);
  }
  bx(3, 0.45, 0.9, charcoal, 7, 4.62, -41.5);                  // outdoor sofa
  bx(3, 0.5, 0.22, charcoal, 7, 5.1, -41.95);

  // ---- ground terrace along the front, with outdoor lounge + fire pit ----
  bx(34, 0.12, 5.5, deckStone, 2, 0.06, -29.25);               // deck (0..0.12)
  bx(34, 0.06, 0.5, deckStone, 2, 0.03, -26.25);               // step to the lawn
  bx(3.2, 0.45, 0.95, charcoal, -6, 0.35, -30.9);              // outdoor sofa
  bx(3.2, 0.5, 0.22, charcoal, -6, 0.85, -31.35);
  for (const ax of [-8.4, -3.6]) {
    bx(0.9, 0.45, 0.9, charcoal, ax, 0.35, -28);
    bx(0.9, 0.55, 0.2, charcoal, ax, 0.85, -27.6);
  }
  cyl(0.65, 0.65, 0.4, stoneDark, -6, 0.32, -29, 18);          // fire pit
  disc(0.45, fireGlow, -6, 0.53, -29, true);
  addLight(0xff8a3a, -6, 1.1, -29, 24, 8);
  for (const px of [9.9, 14.1]) {                              // topiary flanking the entry
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 12), hedgeMat);
    ball.position.set(px, 1.17, -29.6);
    ball.castShadow = true;
    g.add(ball);
    cyl(0.4, 0.46, 0.4, darkTrim, px, 0.32, -29.6, 12);
  }

  // ============================================================
  // GARAGE WING (x 18..30) + MOTOR COURT + DRIVEWAY
  // ============================================================
  bx(12, 3.4, 9, render, 24, 1.7, -36.5);
  bx(12.8, 0.28, 9.8, darkTrim, 24, 3.5, -36.5);
  bx(12.8, 0.4, 0.12, darkTrim, 24, 3.35, -31.65);
  for (const dx of [19.65, 22.55, 25.45, 28.35]) {
    bx(2.6, 2.6, 0.12, cabinet, dx, 1.32, -31.95);
    for (let y = 0.45; y < 2.5; y += 0.4) bx(2.5, 0.03, 0.14, darkTrim, dx, y, -31.93);
    bx(0.12, 0.3, 0.1, sconce, dx + 1.45, 2.95, -31.9);
  }
  bx(24, 0.045, 12, paver, 24, 0.025, -26);                    // motor court
  bx(44, 0.04, 5.4, asphalt, 58, 0.02, -26);                   // driveway east
  bx(40, 1.2, 0.9, hedgeMat, 58, 0.6, -22.6);
  bx(40, 1.2, 0.9, hedgeMat, 58, 0.6, -29.4);

  // ============================================================
  // CARS — extruded side profiles, spoked wheels, lights and trim
  // ============================================================
  const carGlass = new THREE.MeshPhysicalMaterial({ color: 0x0e1a24, roughness: 0.05, metalness: 0.5, clearcoat: 1 });
  const tyre = new THREE.MeshStandardMaterial({ color: 0x14171a, roughness: 0.85 });
  const PROFILES = {
    coupe: {
      body: [[-2.25, 0.32], [-2.25, 0.85], [-1.7, 0.92], [-1.15, 1.42], [0.45, 1.42], [1.15, 0.98], [2.25, 0.82], [2.3, 0.5], [2.2, 0.32]],
      glass: [[-1.55, 0.95], [-1.12, 1.38], [0.4, 1.38], [1.05, 0.98]],
      width: 1.9, wheelR: 0.36, wheelX: 1.45, lightY: 0.72, spoiler: false, rails: false,
    },
    sports: {
      body: [[-2.3, 0.3], [-2.3, 0.8], [-1.5, 0.86], [-1.0, 1.28], [0.3, 1.28], [1.0, 0.9], [2.3, 0.72], [2.3, 0.3]],
      glass: [[-1.35, 0.9], [-0.98, 1.24], [0.25, 1.24], [0.9, 0.9]],
      width: 1.95, wheelR: 0.36, wheelX: 1.5, lightY: 0.62, spoiler: true, rails: false,
    },
    suv: {
      body: [[-2.4, 0.45], [-2.4, 1.15], [-2.2, 1.85], [1.2, 1.85], [1.6, 1.25], [2.4, 1.1], [2.4, 0.45]],
      glass: [[-2.1, 1.2], [-2.05, 1.78], [1.1, 1.78], [1.5, 1.22]],
      width: 2.0, wheelR: 0.42, wheelX: 1.5, lightY: 0.95, spoiler: false, rails: true,
    },
    supercar: {
      body: [[-2.35, 0.3], [-2.35, 0.72], [-1.5, 0.78], [-0.95, 1.1], [0.25, 1.1], [0.95, 0.78], [2.35, 0.58], [2.35, 0.3]],
      glass: [[-1.3, 0.8], [-0.95, 1.06], [0.2, 1.06], [0.85, 0.8]],
      width: 2.0, wheelR: 0.35, wheelX: 1.55, lightY: 0.5, spoiler: true, rails: false,
    },
  };
  const extrude = (pts, width, bevel) => {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: width, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3,
    });
    geo.translate(0, 0, -width / 2);
    return geo;
  };
  const car = (type, color, x, z, ry) => {
    const p = PROFILES[type];
    const paint = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.18, metalness: 0.7, clearcoat: 1, clearcoatRoughness: 0.08,
    });
    const c = new THREE.Group();
    c.add(new THREE.Mesh(extrude(p.body, p.width, 0.05), paint));
    c.add(new THREE.Mesh(extrude(p.glass, p.width + 0.02, 0.02), carGlass));
    const front = p.body[p.body.length - 2][0] + 0.02;
    const rear = p.body[0][0] - 0.02;
    for (const s of [-1, 1]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.38), headlight);
      hl.position.set(front, p.lightY, s * (p.width / 2 - 0.3));
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.42), tailLight);
      tl.position.set(rear, p.lightY + 0.08, s * (p.width / 2 - 0.32));
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.26), paint);
      mirror.position.set(p.glass[3][0] - 0.1, p.glass[3][1] + 0.08, s * (p.width / 2 + 0.1));
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 10), chrome);
      exhaust.rotation.z = Math.PI / 2;
      exhaust.position.set(rear, p.body[0][1] + 0.08, s * 0.4);
      c.add(hl, tl, mirror, exhaust);
    }
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, p.width * 0.5), cabinet);
    grille.position.set(front, p.lightY - 0.2, 0);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.13, 0.5), quartz);
    plate.position.set(rear - 0.01, p.lightY - 0.18, 0);
    c.add(grille, plate);
    if (p.spoiler) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, p.width * 0.85), paint);
      wing.position.set(rear + 0.35, p.body[1][1] + 0.28, 0);
      c.add(wing);
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.06), paint);
        post.position.set(rear + 0.35, p.body[1][1] + 0.13, s * p.width * 0.32);
        c.add(post);
      }
    }
    if (p.rails) {
      for (const s of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.05, 0.06), chrome);
        rail.position.set(-0.5, 1.9, s * 0.7);
        c.add(rail);
      }
    }
    // wheels: tyre, rim ring, five spokes, hub, brake disc
    const tyreGeo = new THREE.CylinderGeometry(p.wheelR, p.wheelR, 0.3, 24);
    const rimGeo = new THREE.TorusGeometry(p.wheelR * 0.68, 0.035, 8, 24);
    const discGeo = new THREE.CylinderGeometry(p.wheelR * 0.55, p.wheelR * 0.55, 0.02, 20);
    for (const wx of [-p.wheelX, p.wheelX]) {
      for (const s of [-1, 1]) {
        const w = new THREE.Group();
        const t = new THREE.Mesh(tyreGeo, tyre);
        t.rotation.x = Math.PI / 2;
        const ring = new THREE.Mesh(rimGeo, chrome);
        ring.position.z = s * 0.155;
        const brake = new THREE.Mesh(discGeo, darkTrim);
        brake.rotation.x = Math.PI / 2;
        brake.position.z = s * 0.14;
        w.add(t, ring, brake);
        for (let k = 0; k < 5; k++) {
          const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.045, p.wheelR * 1.3, 0.04), chrome);
          spoke.rotation.z = (k / 5) * Math.PI * 2;
          spoke.position.z = s * 0.16;
          w.add(spoke);
        }
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12), chrome);
        hub.rotation.x = Math.PI / 2;
        hub.position.z = s * 0.17;
        w.add(hub);
        w.position.set(wx, p.wheelR, s * (p.width / 2 - 0.12));
        c.add(w);
      }
    }
    c.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    c.position.set(x, 0, z);
    c.rotation.y = ry;
    g.add(c);
  };
  car('sports', 0xb0121f, 19.5, -24.4, 0.3);        // red sports car
  car('coupe', 0xc9ccd0, 23.6, -23.7, -0.1);        // silver coupe
  car('suv', 0x101418, 27.8, -24.6, 0.14);          // black SUV
  car('supercar', 0xf2f2f0, 32.2, -23.8, -0.22);    // white supercar

  // ============================================================
  // POOL + DECK + POOLHOUSE
  // ============================================================
  // deck in four pieces around the hole (x -18..0, z -26.5..-14.5)
  const { x: px, z: pz, w: pw, d: pd, depth: pdeep } = POOL;
  const hx0 = px - pw / 2, hx1 = px + pw / 2, hz0 = pz - pd / 2, hz1 = pz + pd / 2;
  bx(hx0 + 18, 0.035, 12, deckStone, (hx0 - 18) / 2, 0.018, pz);          // west
  bx(-hx1, 0.035, 12, deckStone, hx1 / 2, 0.018, pz);                     // east
  bx(pw, 0.035, hz0 + 26.5, deckStone, px, 0.018, (hz0 - 26.5) / 2);      // north
  bx(pw, 0.035, -14.5 - hz1, deckStone, px, 0.018, (hz1 - 14.5) / 2);     // south
  // coping frame, 0.4 wide, proud of the deck
  bx(0.4, 0.18, pd + 0.8, quartz, hx0 - 0.2, 0.1, pz);
  bx(0.4, 0.18, pd + 0.8, quartz, hx1 + 0.2, 0.1, pz);
  bx(pw, 0.18, 0.4, quartz, px, 0.1, hz0 - 0.2);
  bx(pw, 0.18, 0.4, quartz, px, 0.1, hz1 + 0.2);
  // recessed basin: floor + four walls lining the hole in the lawn
  bx(pw, 0.1, pd, basin, px, -pdeep + 0.05, pz, 0, false);
  bx(pw, pdeep + 0.1, 0.1, basin, px, -pdeep / 2 + 0.05, hz0 + 0.05, 0, false);
  bx(pw, pdeep + 0.1, 0.1, basin, px, -pdeep / 2 + 0.05, hz1 - 0.05, 0, false);
  bx(0.1, pdeep + 0.1, pd, basin, hx0 + 0.05, -pdeep / 2 + 0.05, pz, 0, false);
  bx(0.1, pdeep + 0.1, pd, basin, hx1 - 0.05, -pdeep / 2 + 0.05, pz, 0, false);
  // water surface just below the coping
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(pw - 0.02, pd - 0.02, 1, 1), water);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(px, -0.14, pz);
  pool.receiveShadow = true;
  g.add(pool);
  // pool steps in one corner
  for (let i = 0; i < 3; i++) bx(1.6, 0.1, 0.45 + i * 0.45, basin, hx1 - 0.85, -0.3 - i * 0.45, hz1 - 0.3 - (0.45 + i * 0.45) / 2, 0, false);
  addLight(0x2bb7e8, px, -0.9, pz, 40, 16);                     // underwater light
  for (const lx of [-12.5, -10.5, -8.5]) lounger(lx, -15.6);
  bx(0.5, 0.45, 0.5, wood, -7.4, 0.24, -15.6);
  cyl(0.035, 0.035, 2.3, darkTrim, -6.3, 1.15, -15.4, 8);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.55, 10), cream);
  canopy.position.set(-6.3, 2.35, -15.4);
  canopy.castShadow = true;
  g.add(canopy);

  // poolhouse: x -23..-15, z -26..-20, glass front facing the pool (+x)
  bx(8, 0.12, 6, oakFloor, -19, 0.06, -23);
  bx(8, 0.1, 6, plaster, -19, 2.95, -23);
  bx(0.3, 3, 6, render, -22.85, 1.5, -23);
  bx(8, 3, 0.3, render, -19, 1.5, -25.85);
  bx(8, 3, 0.3, render, -19, 1.5, -20.15);
  glassWall(5.7, 2.9, -15.0, 1.5, -23, false, 1.9);
  bx(9, 0.26, 7.2, darkTrim, -19, 3.15, -23);
  bx(0.12, 0.45, 7.2, darkTrim, -14.55, 3.0, -23);
  bx(0.6, 1.0, 3.2, wood, -16.6, 0.55, -23);                   // bar
  bx(0.7, 0.06, 3.3, quartz, -16.6, 1.08, -23);
  for (const sz of [-24, -23, -22]) { cyl(0.17, 0.17, 0.06, charcoal, -15.8, 0.72, sz, 12); cyl(0.02, 0.02, 0.66, darkTrim, -15.8, 0.39, sz, 6); }
  bx(0.35, 2.0, 3.6, cabinet, -22.5, 1.1, -23);
  for (let i = 0; i < 3; i++) bx(0.3, 0.03, 3.4, plaster, -22.5, 0.7 + i * 0.55, -23);
  for (let i = 0; i < 8; i++) bx(0.09, 0.28, 0.09, glass, -22.5, 0.88 + (i % 2) * 0.55, -24.4 + i * 0.4, 0, false);
  for (const pz of [-24, -22]) { cyl(0.004, 0.004, 0.9, darkTrim, -16.6, 2.5, pz, 4); cyl(0.13, 0.1, 0.2, lampShade, -16.6, 2.0, pz, 12); }
  addLight(0xffd9a0, -18, 2.4, -23, 28, 12);

  // ============================================================
  // GARDEN
  // ============================================================
  bx(1.5, 0.035, 20.5, deckStone, 12, 0.018, -16.5);          // path: front door → court
  bx(74, 2.2, 1.2, hedgeMat, 8, 1.1, -47.5);                   // behind the house
  bx(1.2, 1.8, 60, hedgeMat, -32, 0.9, -16);                   // west boundary
  bx(62, 1.3, 1.1, hedgeMat, 2, 0.65, 18);                     // front hedge line
  const topiary = (x, z, r = 0.7) => {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), hedgeMat);
    ball.position.set(x, r + 0.35, z);
    ball.castShadow = true;
    g.add(ball);
    cyl(r * 0.55, r * 0.65, 0.4, darkTrim, x, 0.2, z, 12);
  };
  topiary(-12.5, 7); topiary(12.5, 7);
  const bollard = (x, z) => {
    cyl(0.05, 0.05, 0.55, darkTrim, x, 0.28, z, 8);
    cyl(0.055, 0.055, 0.1, bollardGlow, x, 0.58, z, 8);
  };
  for (let x = 40; x <= 76; x += 9) { bollard(x, -23.3); bollard(x, -28.7); }
  for (const z of [-10, -16, -22]) bollard(13.1, z);
  bollard(-14.2, -17); bollard(-14.2, -26);

  const tree = (x, z, s = 1) => {
    cyl(0.18 * s, 0.26 * s, 2.4 * s, trunkMat, x, 1.2 * s, z, 8);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7 * s, 1), leafMat);
    crown.position.set(x, 3.1 * s, z);
    crown.castShadow = true;
    g.add(crown);
  };
  tree(-27, -36, 1.6); tree(36, -46, 1.5); tree(-30, 8, 1.3);
  tree(34, 12, 1.2); tree(-26, -6, 1.1); tree(44, -16, 1.0);
  tree(16, -52, 1.4); tree(-22, -46, 1.2); tree(24, 16, 1.15);
  tree(-20, 14, 1.05); tree(-36, -24, 1.8); tree(50, -40, 1.7);

  // ---------------- day/night + animation ----------------
  function setNight(n) {
    for (const { mat, day, night } of glows) mat.emissiveIntensity = day + (night - day) * n;
    for (const { light, night } of nightLights) light.intensity = night * n;
  }
  setNight(0);

  function update(dt) {
    // surface ripples drift one way, floor caustics the other
    water.normalMap.offset.x += dt * 0.025;
    water.normalMap.offset.y += dt * 0.017;
    basin.map.offset.x -= dt * 0.015;
    basin.map.offset.y += dt * 0.01;
  }

  return { setNight, update };
}
