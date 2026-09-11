// The grounds: a modern mansion with pool, poolhouse, garage wing, driveway,
// cars, hedgerows and garden lighting. Pure scenery — nothing here is
// clickable, it just sells the "this could be YOUR court" fantasy.

import * as THREE from 'three';

export function buildEstate(scene) {
  const g = new THREE.Group();
  scene.add(g);

  // ---------------- materials ----------------
  const render = new THREE.MeshStandardMaterial({ color: 0xf0ede6, roughness: 0.85 });      // white render walls
  const darkTrim = new THREE.MeshStandardMaterial({ color: 0x2c3238, roughness: 0.55, metalness: 0.4 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.8 });
  const stone = new THREE.MeshStandardMaterial({ color: 0xd6d1c8, roughness: 0.95 });
  const paver = new THREE.MeshStandardMaterial({ color: 0xc3beb4, roughness: 0.95 });
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x3f4347, roughness: 0.95 });
  const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x3d6a3e, roughness: 1 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4f35, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4a7340, roughness: 1 });

  // window glass that glows warm at night
  const glowGlass = new THREE.MeshStandardMaterial({
    color: 0x16232e, roughness: 0.12, metalness: 0.35,
    emissive: 0xffc27a, emissiveIntensity: 0.03,
  });
  // pool water glows at night (underwater lighting)
  const water = new THREE.MeshStandardMaterial({
    color: 0x2596c9, roughness: 0.15, metalness: 0.1,
    emissive: 0x1e9fd8, emissiveIntensity: 0.25,
  });
  const bollardGlow = new THREE.MeshStandardMaterial({
    color: 0xd8dde1, emissive: 0xffd9a0, emissiveIntensity: 0,
  });

  // {mat, day, night} — emissiveIntensity blends between day and night
  const glows = [
    { mat: glowGlass, day: 0.03, night: 1.15 },
    { mat: water, day: 0.25, night: 1.5 },
    { mat: bollardGlow, day: 0, night: 2.4 },
  ];
  // real lights that come on at night: {light, night}
  const nightLights = [];

  const bx = (w, h, d, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };

  // ---------------- mansion (north of the court) ----------------
  bx(22, 4, 12, render, 3, 2, -38);                       // ground floor
  bx(16, 3.6, 10, render, -1, 5.8, -39);                  // cantilevered upper floor
  bx(23.4, 0.3, 13.2, darkTrim, 3, 4.15, -38);            // ground roof slab
  bx(17.2, 0.3, 11, darkTrim, -1, 7.75, -39);             // upper roof slab
  bx(18, 2.9, 0.15, glowGlass, 1, 1.85, -31.95);          // ground-floor glass wall
  bx(13.5, 2.3, 0.15, glowGlass, -1, 5.8, -33.95);        // upper glass band
  bx(3.4, 4, 0.18, wood, 12.2, 2, -31.94);                // timber accent panel
  bx(1.3, 3.1, 0.14, wood, 12.2, 1.55, -31.85);           // pivot front door
  bx(3.6, 0.2, 2.4, darkTrim, 12.2, 3.4, -30.9);          // entry canopy
  bx(1.4, 2.2, 0.15, glowGlass, 8.5, 5.6, -33.96);        // upper corner window

  // warm interior light spilling through the glass at night
  const interior = new THREE.PointLight(0xffc27a, 0, 30, 1.8);
  interior.position.set(1, 2.6, -35);
  g.add(interior);
  nightLights.push({ light: interior, night: 70 });

  // ---------------- garage wing + doors ----------------
  bx(10, 3.2, 8, render, 21, 1.6, -36);
  bx(10.8, 0.28, 8.8, darkTrim, 21, 3.3, -36);
  for (const dx of [-3.3, 0, 3.3]) {
    bx(2.7, 2.5, 0.12, darkTrim, 21 + dx, 1.28, -31.95);
    bx(2.5, 0.06, 0.13, wood, 21 + dx, 2.0, -31.93);      // slat detail
  }

  // ---------------- driveway + motor court ----------------
  bx(18, 0.045, 12, paver, 21, 0.025, -26);               // motor court in front of garage
  bx(44, 0.04, 5.4, asphalt, 50, 0.02, -26);              // driveway heading off east
  // hedgerows lining the driveway
  bx(40, 1.2, 0.9, hedgeMat, 50, 0.6, -22.6);
  bx(40, 1.2, 0.9, hedgeMat, 50, 0.6, -29.4);

  // ---------------- cars on the motor court ----------------
  const carGlass = new THREE.MeshStandardMaterial({ color: 0x10181f, roughness: 0.1, metalness: 0.4 });
  const car = (color, x, z, ry, stretch = 1) => {
    const paint = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.22, metalness: 0.65, clearcoat: 1, clearcoatRoughness: 0.12,
    });
    const c = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.3 * stretch, 0.75, 1.85), paint);
    body.position.y = 0.55;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1 * stretch, 0.6, 1.6), carGlass);
    cabin.position.set(-0.25, 1.2, 0);
    c.add(body, cabin);
    const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 14);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x14171a, roughness: 0.7 });
    for (const wx of [-1.35, 1.35]) for (const wz of [-0.85, 0.85]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx * stretch, 0.34, wz);
      c.add(w);
    }
    c.traverse((o) => { o.castShadow = true; });
    c.position.set(x, 0, z);
    c.rotation.y = ry;
    g.add(c);
  };
  car(0x9e1b23, 17.5, -24.5, 0.35);          // red sports car
  car(0xc9ccd0, 21.5, -23.6, -0.12);         // silver coupe
  car(0x101418, 25.8, -24.8, 0.15, 1.15);    // black SUV

  // ---------------- pool + deck + poolhouse ----------------
  bx(18, 0.035, 12, stone, -9, 0.018, -20.5);             // deck
  bx(10.8, 0.18, 7.8, new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.8 }), -9, 0.1, -20.5); // coping
  bx(10, 0.1, 7, water, -9, 0.13, -20.5);                 // water

  const poolLight = new THREE.PointLight(0x2bb7e8, 0, 16, 1.8);
  poolLight.position.set(-9, 1, -20.5);
  g.add(poolLight);
  nightLights.push({ light: poolLight, night: 40 });

  // sun loungers + umbrella
  const loungeMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.9 });
  for (const lx of [-12.5, -10.5, -8.5]) {
    bx(0.65, 0.22, 1.7, loungeMat, lx, 0.28, -15.6);
    const back = bx(0.65, 0.2, 0.8, loungeMat, lx, 0.55, -14.85);
    back.rotation.x = -0.85;
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.3, 8), darkTrim);
  pole.position.set(-6.3, 1.15, -15.4);
  g.add(pole);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.55, 10), loungeMat);
  canopy.position.set(-6.3, 2.35, -15.4);
  canopy.castShadow = true;
  g.add(canopy);

  // poolhouse pavilion
  bx(8, 3, 6, render, -19, 1.5, -23);
  bx(9, 0.26, 7.2, darkTrim, -19, 3.15, -23);
  bx(0.15, 2.3, 4.6, glowGlass, -14.95, 1.45, -23);       // glass front facing the pool
  bx(0.16, 2.6, 1.1, wood, -14.93, 1.3, -20.2);

  // ---------------- garden structure ----------------
  // stone path: mansion front door area to the court
  bx(1.5, 0.035, 25, stone, 6.5, 0.018, -18.5);
  // formal boundary hedges
  bx(62, 2.2, 1.2, hedgeMat, 2, 1.1, -47);                // behind the mansion
  bx(1.2, 1.8, 60, hedgeMat, -32, 0.9, -16);              // west boundary
  bx(62, 1.3, 1.1, hedgeMat, 2, 0.65, 18);                // front hedge line
  // topiary balls flanking the door + court corners
  const topiary = (x, z, r = 0.7) => {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), hedgeMat);
    ball.position.set(x, r + 0.35, z);
    ball.castShadow = true;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.65, 0.4, 10), darkTrim);
    pot.position.set(x, 0.2, z);
    g.add(ball, pot);
  };
  topiary(10.4, -31.2); topiary(14, -31.2);
  topiary(-12.5, 7); topiary(12.5, 7);

  // bollard path/driveway lights
  const bollard = (x, z) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 8), darkTrim);
    post.position.set(x, 0.28, z);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 8), bollardGlow);
    cap.position.set(x, 0.58, z);
    g.add(post, cap);
  };
  for (let x = 30; x <= 66; x += 9) { bollard(x, -23.3); bollard(x, -28.7); }
  for (let z = -14; z >= -30; z -= 8) bollard(7.6, z);
  bollard(-14.2, -17); bollard(-14.2, -26);

  // ---------------- trees ----------------
  const tree = (x, z, s = 1) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.26 * s, 2.4 * s, 8), trunkMat);
    trunk.position.set(x, 1.2 * s, z);
    trunk.castShadow = true;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7 * s, 1), leafMat);
    crown.position.set(x, 3.1 * s, z);
    crown.castShadow = true;
    g.add(trunk, crown);
  };
  tree(-27, -36, 1.6); tree(30, -44, 1.5); tree(-30, 8, 1.3);
  tree(34, 12, 1.2); tree(-26, -6, 1.1); tree(40, -16, 1.0);
  tree(14, -46, 1.4); tree(-14, -44, 1.2); tree(24, 16, 1.15);
  tree(-20, 14, 1.05);

  // ---------------- day/night ----------------
  function setNight(n) {
    for (const { mat, day, night } of glows) {
      mat.emissiveIntensity = day + (night - day) * n;
    }
    for (const { light, night } of nightLights) light.intensity = night * n;
  }
  setNight(0);

  return { setNight };
}
