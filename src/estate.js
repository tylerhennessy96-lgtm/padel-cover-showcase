// The grounds: a glass-fronted modern mansion you can see into (furnished,
// lit at night), pool + poolhouse, garage wing with cars, driveway,
// hedgerows and garden lighting. Pure scenery — nothing here is clickable.

import * as THREE from 'three';
import { noiseTexture, paverTexture, woodTexture, rippleTexture } from './textures.js';

export function buildEstate(scene) {
  const g = new THREE.Group();
  scene.add(g);

  // ---------------- materials ----------------
  const render = new THREE.MeshStandardMaterial({ map: noiseTexture('#efece5', 0.05, [4, 2]), roughness: 0.85 });
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
  const tvScreen = glowMat(0x0b0f14, 0x6fa8ff, 0, 0.7, { roughness: 0.2 });
  const bollardGlow = glowMat(0xd8dde1, 0xffd9a0, 0, 2.4);
  const sconce = glowMat(0xd0d4d8, 0xffd9a0, 0, 2.2);
  const headlight = glowMat(0xe8ecef, 0xf4f8ff, 0, 3.0);
  const water = new THREE.MeshStandardMaterial({
    map: rippleTexture(), color: 0xbfe6ff, roughness: 0.12, metalness: 0.1,
    emissive: 0x1e9fd8, emissiveIntensity: 0.15,
  });
  glows.push({ mat: water, day: 0.15, night: 1.1 });

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
  const disc = (r, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 14), mat);
    m.position.set(x, y, z);
    m.rotation.x = Math.PI / 2;      // faces down
    g.add(m);
    return m;
  };

  // ================= MANSION =================
  // Ground floor shell: x -8..14, z -44..-32, 4 m tall, open glass front
  bx(22, 0.12, 12, oakFloor, 3, 0.06, -38);               // floor
  bx(22, 0.1, 12, plaster, 3, 3.95, -38);                 // ceiling
  bx(22, 4, 0.3, render, 3, 2, -43.85);                   // back wall
  bx(0.3, 4, 12, render, -7.85, 2, -38);                  // west wall
  bx(0.3, 4, 12, render, 13.85, 2, -38);                  // east wall
  bx(4, 4, 0.3, render, 12, 2, -32.15);                   // solid front segment by the entry
  bx(23.4, 0.3, 13.2, darkTrim, 3, 4.15, -38);            // roof slab
  bx(23.4, 0.5, 0.12, darkTrim, 3, 4.05, -31.4);          // fascia
  // glass front x -8..10 with mullions
  bx(18, 3.9, 0.06, glass, 1, 2, -32.0, 0, false);
  for (let x = -8; x <= 10; x += 3) bx(0.1, 3.9, 0.12, darkTrim, x, 2, -32.0);
  bx(18, 0.1, 0.12, darkTrim, 1, 3.92, -32.0);
  bx(18, 0.12, 0.12, darkTrim, 1, 0.14, -32.0);
  // entry: timber panel, pivot door, canopy, steps, sconces
  bx(3.4, 4, 0.18, wood, 12.2, 2, -31.94);
  bx(1.3, 3.1, 0.16, cabinet, 12.2, 1.55, -31.83);
  cyl(0.02, 0.02, 1.2, darkTrim, 12.75, 1.55, -31.7, 6);  // door pull
  bx(3.6, 0.2, 2.4, darkTrim, 12.2, 3.4, -30.9);
  bx(3.6, 0.14, 1.2, deckStone, 12.2, 0.07, -31.1);
  bx(0.14, 0.3, 0.1, sconce, 10.6, 2.6, -31.9);
  bx(0.14, 0.3, 0.1, sconce, 13.8, 2.6, -31.9);
  addLight(0xffd9a0, 12.2, 3.0, -30.8, 12, 8);

  // Upper floor shell: x -9..7, z -44..-34, y 4.1..7.7, glass band on the front
  bx(16, 0.2, 10, oakFloor, -1, 4.2, -39);
  bx(16, 0.1, 10, plaster, -1, 7.55, -39);
  bx(16, 3.6, 0.3, render, -1, 5.8, -43.85);
  bx(0.3, 3.6, 10, render, -8.85, 5.8, -39);
  bx(0.3, 3.6, 10, render, 6.85, 5.8, -39);
  bx(16, 0.7, 0.3, render, -1, 4.45, -34.15);             // spandrel below glass
  bx(16, 0.55, 0.3, render, -1, 7.32, -34.15);            // spandrel above glass
  bx(1.1, 3.6, 0.3, render, -8.3, 5.8, -34.15);           // side fillers
  bx(1.1, 3.6, 0.3, render, 6.3, 5.8, -34.15);
  bx(13.5, 2.25, 0.06, glass, -1, 5.92, -34.0, 0, false);
  for (let x = -7.75; x <= 5.75; x += 2.7) bx(0.08, 2.25, 0.12, darkTrim, x, 5.92, -34.0);
  bx(17.2, 0.3, 11, darkTrim, -1, 7.75, -39);             // upper roof slab
  bx(17.2, 0.5, 0.12, darkTrim, -1, 7.6, -33.45);         // fascia
  cyl(0.12, 0.12, 4.1, darkTrim, -8.4, 2.05, -34.6, 8);   // slim column under the overhang
  bx(0.9, 1.2, 0.9, darkTrim, 3, 8.5, -41);               // roof flue

  // ---- ground-floor interior: living / dining / kitchen ----
  // living (west end)
  bx(5, 0.02, 3.6, rugMat, -2, 0.13, -36.8, 0, false);
  bx(3.6, 0.45, 0.9, charcoal, -2, 0.35, -37.6);          // sofa seat
  bx(3.6, 0.55, 0.25, charcoal, -2, 0.85, -38.1);         // sofa back
  bx(0.9, 0.45, 1.6, charcoal, -4.35, 0.35, -36.75);      // L return
  for (const px of [-3, -2, -1]) bx(0.55, 0.22, 0.4, cream, px, 0.7, -37.85);   // cushions
  bx(1.4, 0.06, 0.7, wood, -2, 0.42, -36.1);              // coffee table top
  for (const [lx, lz] of [[-2.6, -36.4], [-1.4, -36.4], [-2.6, -35.8], [-1.4, -35.8]]) cyl(0.03, 0.03, 0.36, darkTrim, lx, 0.24, lz, 6);
  bx(0.06, 1.35, 2.4, tvScreen, -7.62, 1.6, -38);          // wall-mounted TV
  bx(0.4, 0.5, 2.6, cabinet, -7.45, 0.37, -38);           // media unit
  bx(0.35, 2.3, 1.6, wood, -7.5, 1.27, -41.2);            // bookshelf
  for (let i = 0; i < 4; i++) bx(0.3, 0.04, 1.5, plaster, -7.5, 0.5 + i * 0.55, -41.2);
  cyl(0.02, 0.02, 1.55, darkTrim, -5.6, 0.9, -35.2, 6);   // floor lamp
  cyl(0.28, 0.22, 0.32, lampShade, -5.6, 1.75, -35.2, 12);
  // dining (middle)
  bx(2.4, 0.07, 1.05, wood, 5.3, 0.76, -39);
  for (const [lx, lz] of [[4.3, -39.4], [6.3, -39.4], [4.3, -38.6], [6.3, -38.6]]) cyl(0.03, 0.03, 0.72, darkTrim, lx, 0.38, lz, 6);
  for (const cx of [4.5, 5.3, 6.1]) {
    for (const cz of [-39.9, -38.1]) {
      bx(0.44, 0.06, 0.44, charcoal, cx, 0.47, cz);
      bx(0.44, 0.5, 0.06, charcoal, cx, 0.75, cz + (cz < -39 ? -0.19 : 0.19));
      for (const [ox, oz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) cyl(0.015, 0.015, 0.45, darkTrim, cx + ox, 0.23, cz + oz, 5);
    }
  }
  for (const px of [4.6, 5.3, 6.0]) {                     // pendant cluster over the table
    cyl(0.004, 0.004, 1.4, darkTrim, px, 3.2, -39, 4);
    cyl(0.14, 0.1, 0.22, lampShade, px, 2.45, -39, 12);
  }
  // kitchen (east end)
  bx(2.8, 0.82, 1.1, cabinet, 10.8, 0.47, -37.2);         // island base
  bx(3.0, 0.08, 1.3, quartz, 10.8, 0.92, -37.2);          // island worktop
  for (const sx of [10.0, 10.8, 11.6]) cyl(0.17, 0.17, 0.06, charcoal, sx, 0.7, -36.3, 12), cyl(0.02, 0.02, 0.62, darkTrim, sx, 0.37, -36.3, 6);
  bx(5.4, 0.86, 0.65, cabinet, 11, 0.49, -43.35);         // back run
  bx(5.4, 0.06, 0.7, quartz, 11, 0.95, -43.35);
  bx(5.4, 1.0, 0.36, cabinet, 11, 2.6, -43.5);            // wall cabinets
  bx(0.7, 2.1, 0.7, quartz, 13.3, 1.05, -43.3);           // fridge
  for (const px of [10.1, 10.8, 11.5]) {                  // island pendants
    cyl(0.004, 0.004, 1.2, darkTrim, px, 3.3, -37.2, 4);
    cyl(0.1, 0.1, 0.2, lampShade, px, 2.6, -37.2, 12);
  }
  // ceiling downlights
  for (let x = -6; x <= 12; x += 3) for (const z of [-35, -41]) disc(0.09, downlight, x, 3.89, z);
  addLight(0xffd9a0, -2, 3.2, -37, 55, 20);               // living
  addLight(0xffe0b0, 10.8, 2.6, -38, 45, 14);             // kitchen

  // ---- upper floor interior: master bedroom + lounge chair ----
  bx(4, 0.02, 3, rugMat, -3, 4.31, -39.5, 0, false);
  bx(2.0, 0.28, 0.16, charcoal, -3, 4.95, -42.2);         // headboard
  bx(2.0, 0.4, 2.1, cabinet, -3, 4.5, -41.1);             // bed base
  bx(1.9, 0.18, 1.9, linen, -3, 4.79, -41.0);             // duvet
  bx(0.7, 0.14, 0.35, linen, -3.5, 4.95, -41.85);         // pillows
  bx(0.7, 0.14, 0.35, linen, -2.5, 4.95, -41.85);
  for (const nx of [-4.35, -1.65]) {                      // bedside tables + lamps
    bx(0.5, 0.45, 0.45, wood, nx, 4.52, -41.8);
    cyl(0.12, 0.09, 0.2, lampShade, nx, 4.95, -41.8, 10);
  }
  bx(0.9, 0.42, 0.9, charcoal, 3.5, 4.5, -36);            // lounge chair by the glass
  bx(0.9, 0.7, 0.2, charcoal, 3.5, 4.95, -36.5);
  bx(3.2, 2.2, 0.5, cabinet, -6.5, 5.4, -43.5);           // wardrobe
  for (let x = -7; x <= 5; x += 3) disc(0.09, downlight, x, 7.49, -39);
  addLight(0xffd9a0, -3, 6.8, -39.5, 30, 14);

  // ================= GARAGE WING =================
  bx(10, 3.2, 8, render, 21, 1.6, -36);
  bx(10.8, 0.28, 8.8, darkTrim, 21, 3.3, -36);
  for (const dx of [-3.3, 0, 3.3]) {
    bx(2.7, 2.5, 0.12, cabinet, 21 + dx, 1.28, -31.95);
    for (let y = 0.45; y < 2.4; y += 0.4) bx(2.6, 0.03, 0.14, darkTrim, 21 + dx, y, -31.93);
    bx(0.14, 0.3, 0.1, sconce, 21 + dx + 1.6, 2.85, -31.9);
  }

  // ================= DRIVEWAY + MOTOR COURT =================
  bx(18, 0.045, 12, paver, 21, 0.025, -26);
  bx(44, 0.04, 5.4, asphalt, 50, 0.02, -26);
  bx(40, 1.2, 0.9, hedgeMat, 50, 0.6, -22.6);
  bx(40, 1.2, 0.9, hedgeMat, 50, 0.6, -29.4);

  // ================= CARS =================
  const carGlass = new THREE.MeshStandardMaterial({ color: 0x10181f, roughness: 0.1, metalness: 0.4 });
  const tyre = new THREE.MeshStandardMaterial({ color: 0x14171a, roughness: 0.8 });
  const rim = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.9 });
  const car = (color, x, z, ry, stretch = 1, tall = 0) => {
    const paint = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.2, metalness: 0.65, clearcoat: 1, clearcoatRoughness: 0.1,
    });
    const c = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.3 * stretch, 0.7 + tall, 1.85), paint);
    body.position.y = 0.55 + tall / 2;
    const bonnet = new THREE.Mesh(new THREE.BoxGeometry(1.4 * stretch, 0.25, 1.7), paint);
    bonnet.position.set(1.3 * stretch, 0.98 + tall, 0);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0 * stretch, 0.62, 1.62), carGlass);
    cabin.position.set(-0.3, 1.2 + tall, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7 * stretch, 0.06, 1.55), paint);
    roof.position.set(-0.3, 1.53 + tall, 0);
    c.add(body, bonnet, cabin, roof);
    for (const wz of [-0.85, 0.85]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.36), headlight);
      hl.position.set(2.16 * stretch, 0.72 + tall, wz * 0.75);
      c.add(hl);
    }
    for (const wx of [-1.35, 1.35]) for (const wz of [-0.88, 0.88]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 16), tyre);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx * stretch, 0.34, wz);
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.27, 12), rim);
      r.rotation.x = Math.PI / 2;
      r.position.copy(w.position);
      c.add(w, r);
    }
    c.traverse((o) => { o.castShadow = true; });
    c.position.set(x, 0, z);
    c.rotation.y = ry;
    g.add(c);
  };
  car(0x9e1b23, 17.5, -24.5, 0.35);               // red sports car
  car(0xc9ccd0, 21.5, -23.6, -0.12);              // silver coupe
  car(0x101418, 25.8, -24.8, 0.15, 1.15, 0.3);    // black SUV

  // ================= POOL + DECK + POOLHOUSE =================
  bx(18, 0.035, 12, deckStone, -9, 0.018, -20.5);
  bx(10.8, 0.18, 7.8, quartz, -9, 0.1, -20.5);            // coping
  const pool = bx(10, 0.1, 7, water, -9, 0.13, -20.5, 0, false);
  addLight(0x2bb7e8, -9, 1, -20.5, 40, 16);
  for (const lx of [-12.5, -10.5, -8.5]) {                // loungers
    bx(0.65, 0.22, 1.7, cream, lx, 0.28, -15.6);
    const back = bx(0.65, 0.2, 0.8, cream, lx, 0.55, -14.85);
    back.rotation.x = -0.85;
    for (const [ox, oz] of [[-0.25, -0.7], [0.25, -0.7], [-0.25, 0.7], [0.25, 0.7]]) cyl(0.02, 0.02, 0.2, darkTrim, lx + ox, 0.1, -15.6 + oz, 5);
  }
  bx(0.5, 0.45, 0.5, wood, -7.4, 0.24, -15.6);            // side table
  cyl(0.035, 0.035, 2.3, darkTrim, -6.3, 1.15, -15.4, 8);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.55, 10), cream);
  canopy.position.set(-6.3, 2.35, -15.4);
  canopy.castShadow = true;
  g.add(canopy);

  // poolhouse shell: x -23..-15, z -26..-20, glass front facing the pool (+x)
  bx(8, 0.12, 6, oakFloor, -19, 0.06, -23);
  bx(8, 0.1, 6, plaster, -19, 2.95, -23);
  bx(0.3, 3, 6, render, -22.85, 1.5, -23);
  bx(8, 3, 0.3, render, -19, 1.5, -25.85);
  bx(8, 3, 0.3, render, -19, 1.5, -20.15);
  bx(0.06, 2.9, 5.7, glass, -15.0, 1.5, -23, 0, false);
  for (let z = -25.8; z <= -20.2; z += 1.9) bx(0.12, 2.9, 0.08, darkTrim, -15.0, 1.5, z);
  bx(9, 0.26, 7.2, darkTrim, -19, 3.15, -23);
  bx(0.12, 0.45, 7.2, darkTrim, -14.55, 3.0, -23);        // fascia
  // bar inside
  bx(0.6, 1.0, 3.2, wood, -16.6, 0.55, -23);
  bx(0.7, 0.06, 3.3, quartz, -16.6, 1.08, -23);
  for (const sz of [-24, -23, -22]) cyl(0.17, 0.17, 0.06, charcoal, -15.8, 0.72, sz, 12), cyl(0.02, 0.02, 0.66, darkTrim, -15.8, 0.39, sz, 6);
  bx(0.35, 2.0, 3.6, cabinet, -22.5, 1.1, -23);           // back bar
  for (let i = 0; i < 3; i++) bx(0.3, 0.03, 3.4, plaster, -22.5, 0.7 + i * 0.55, -23);
  for (let i = 0; i < 8; i++) bx(0.09, 0.28, 0.09, glass, -22.5, 0.88 + (i % 2) * 0.55, -24.4 + i * 0.4, 0, false);
  for (const pz of [-24, -22]) { cyl(0.004, 0.004, 0.9, darkTrim, -16.6, 2.5, pz, 4); cyl(0.13, 0.1, 0.2, lampShade, -16.6, 2.0, pz, 12); }
  addLight(0xffd9a0, -18, 2.4, -23, 28, 12);

  // ================= GARDEN =================
  bx(1.5, 0.035, 25, deckStone, 6.5, 0.018, -18.5);      // stone path house → court
  bx(62, 2.2, 1.2, hedgeMat, 2, 1.1, -47);                // behind the mansion
  bx(1.2, 1.8, 60, hedgeMat, -32, 0.9, -16);              // west boundary
  bx(62, 1.3, 1.1, hedgeMat, 2, 0.65, 18);                // front hedge line
  const topiary = (x, z, r = 0.7) => {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), hedgeMat);
    ball.position.set(x, r + 0.35, z);
    ball.castShadow = true;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.65, 0.4, 12), darkTrim);
    pot.position.set(x, 0.2, z);
    g.add(ball, pot);
  };
  topiary(10.4, -30.6); topiary(14, -30.6);
  topiary(-12.5, 7); topiary(12.5, 7);
  const bollard = (x, z) => {
    cyl(0.05, 0.05, 0.55, darkTrim, x, 0.28, z, 8);
    cyl(0.055, 0.055, 0.1, bollardGlow, x, 0.58, z, 8);
  };
  for (let x = 30; x <= 66; x += 9) { bollard(x, -23.3); bollard(x, -28.7); }
  for (let z = -14; z >= -30; z -= 8) bollard(7.6, z);
  bollard(-14.2, -17); bollard(-14.2, -26);

  const tree = (x, z, s = 1) => {
    cyl(0.18 * s, 0.26 * s, 2.4 * s, trunkMat, x, 1.2 * s, z, 8);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7 * s, 1), leafMat);
    crown.position.set(x, 3.1 * s, z);
    crown.castShadow = true;
    g.add(crown);
  };
  tree(-27, -36, 1.6); tree(30, -44, 1.5); tree(-30, 8, 1.3);
  tree(34, 12, 1.2); tree(-26, -6, 1.1); tree(40, -16, 1.0);
  tree(14, -46, 1.4); tree(-14, -44, 1.2); tree(24, 16, 1.15);
  tree(-20, 14, 1.05);

  // ---------------- day/night + animation ----------------
  function setNight(n) {
    for (const { mat, day, night } of glows) mat.emissiveIntensity = day + (night - day) * n;
    for (const { light, night } of nightLights) light.intensity = night * n;
  }
  setNight(0);

  function update(dt) {
    // slow drift of the ripple texture reads as moving water
    pool.material.map.offset.x += dt * 0.02;
    pool.material.map.offset.y += dt * 0.013;
  }

  return { setNight, update };
}
