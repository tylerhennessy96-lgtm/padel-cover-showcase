// The padel court itself: turf, lines, glass walls, mesh fencing, net.
// Standard court is 20 m x 10 m; back walls 3 m glass + 1 m mesh above.

import * as THREE from 'three';

const COURT_L = 20;   // along x
const COURT_W = 10;   // along z

function turfTexture(hex = '#1d6ea5') {
  const r = parseInt(hex.slice(1, 3), 16);
  const gr = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = hex;
  g.fillRect(0, 0, 512, 512);
  // mottled fibres
  for (let i = 0; i < 9000; i++) {
    const shade = 0.85 + Math.random() * 0.3;
    g.fillStyle = `rgba(${Math.round(r * shade)}, ${Math.round(gr * shade)}, ${Math.round(b * shade)}, 0.5)`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildCourt(registerPart) {
  const court = new THREE.Group();

  // ---------------- turf + lines ----------------
  const turfMat = new THREE.MeshStandardMaterial({ map: turfTexture(), roughness: 0.95 });
  const turf = new THREE.Mesh(new THREE.BoxGeometry(COURT_L, 0.08, COURT_W), turfMat);
  turf.position.y = 0.04;
  turf.receiveShadow = true;
  court.add(turf);
  registerPart(turf, {
    name: 'Artificial turf',
    blurb: 'Sand-dressed monofilament turf, the standard playing surface for padel. The cover keeps it dry so the court is playable in any weather.',
  });

  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf5f7fa, roughness: 0.8 });
  const addLine = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.01, d), lineMat);
    m.position.set(x, 0.085, z);
    court.add(m);
  };
  // service lines 3 m from each back wall (i.e. x = ±(10-3) = ±7)
  addLine(0.05, COURT_W, -7, 0);
  addLine(0.05, COURT_W, 7, 0);
  // centre service line between the two service lines
  addLine(14, 0.05, 0, 0);

  // ---------------- glass + mesh walls ----------------
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xd7ecf5,
    transparent: true,
    opacity: 0.16,
    roughness: 0.05,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const meshMat = new THREE.MeshStandardMaterial({
    color: 0x2a3b4a,
    transparent: true,
    opacity: 0.5,
    roughness: 0.6,
    metalness: 0.6,
    side: THREE.DoubleSide,
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x22303d, roughness: 0.4, metalness: 0.7 });

  const glassParts = [];
  const meshParts = [];

  const wall = (mat, w, h, x, z, ry, y) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    court.add(m);
    return m;
  };

  // back walls (x = ±10): 3 m glass + 1 m mesh above
  for (const sx of [-1, 1]) {
    glassParts.push(wall(glassMat, COURT_W, 3, sx * 10, 0, Math.PI / 2, 1.5));
    meshParts.push(wall(meshMat, COURT_W, 1, sx * 10, 0, Math.PI / 2, 3.5));
  }
  // side walls (z = ±5): 2 m of 3 m glass off each corner, 3 m mesh between,
  // topped with mesh to 4 m near the corners (simplified to: glass corners, mesh middle)
  for (const sz of [-1, 1]) {
    for (const sx of [-1, 1]) {
      glassParts.push(wall(glassMat, 4, 3, sx * 8, sz * 5, 0, 1.5));
      meshParts.push(wall(meshMat, 4, 1, sx * 8, sz * 5, 0, 3.5));
    }
    meshParts.push(wall(meshMat, 12, 4, 0, sz * 5, 0, 2));
  }

  for (const g of glassParts) {
    registerPart(g, {
      name: 'Tempered glass wall',
      blurb: '10–12 mm tempered safety glass. Balls rebound off it during play — and spectators get a clear view of the action.',
    });
  }
  for (const m of meshParts) {
    registerPart(m, {
      name: 'Steel mesh panel',
      blurb: 'Welded steel mesh, galvanised and powder-coated. Keeps balls in the court while letting air flow through — important under a closed cover.',
    });
  }

  // wall frame posts every 2 m
  const postGeo = new THREE.BoxGeometry(0.09, 4, 0.09);
  for (let x = -10; x <= 10; x += 2) {
    for (const sz of [-1, 1]) {
      const p = new THREE.Mesh(postGeo, frameMat);
      p.position.set(x, 2, sz * 5);
      p.castShadow = true;
      court.add(p);
    }
  }
  for (let z = -5; z <= 5; z += 2.5) {
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(postGeo, frameMat);
      p.position.set(sx * 10, 2, z);
      p.castShadow = true;
      court.add(p);
    }
  }
  // top rails
  const railGeo = new THREE.BoxGeometry(COURT_L + 0.1, 0.08, 0.08);
  const railGeoW = new THREE.BoxGeometry(0.08, 0.08, COURT_W + 0.1);
  for (const sz of [-1, 1]) {
    const r = new THREE.Mesh(railGeo, frameMat);
    r.position.set(0, 4, sz * 5);
    court.add(r);
  }
  for (const sx of [-1, 1]) {
    const r = new THREE.Mesh(railGeoW, frameMat);
    r.position.set(sx * 10, 4, 0);
    court.add(r);
  }

  // ---------------- net ----------------
  const netMat = new THREE.MeshStandardMaterial({
    color: 0x101418,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    roughness: 0.9,
  });
  const net = new THREE.Mesh(new THREE.PlaneGeometry(COURT_W, 0.88), netMat);
  net.rotation.y = Math.PI / 2;
  net.position.set(0, 0.44, 0);
  court.add(net);
  registerPart(net, {
    name: 'Net',
    blurb: 'Regulation padel net — 10 m wide, 88 cm high at the centre. Completely independent of the cover system above it.',
  });

  const netBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.06, COURT_W),
    new THREE.MeshStandardMaterial({ color: 0xf5f7fa })
  );
  netBand.position.set(0, 0.9, 0);
  court.add(netBand);

  const netPostGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.05, 12);
  for (const sz of [-1, 1]) {
    const np = new THREE.Mesh(netPostGeo, frameMat);
    np.position.set(0, 0.52, sz * 5.15);
    np.castShadow = true;
    court.add(np);
  }

  function setTurfColor(hex) {
    const old = turfMat.map;
    turfMat.map = turfTexture(hex);
    turfMat.needsUpdate = true;
    if (old) old.dispose();
  }

  return { group: court, setTurfColor };
}

export { COURT_L, COURT_W };
