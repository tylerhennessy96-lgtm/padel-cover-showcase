// Environment: sky, sun, ground, and a bit of surrounding context.

import * as THREE from 'three';

export function buildEnvironment(scene) {
  scene.background = new THREE.Color(0x9ec9e8);
  scene.fog = new THREE.Fog(0xa9c9de, 90, 260);

  // gradient sky dome
  const skyGeo = new THREE.SphereGeometry(240, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0x3f7fc4) },
      horizon: { value: new THREE.Color(0xc4dcec) },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 top;
      uniform vec3 horizon;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y * 1.6, 0.0, 1.0);
        gl_FragColor = vec4(mix(horizon, top, pow(h, 0.8)), 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // lights
  const hemi = new THREE.HemisphereLight(0xbfd9ee, 0x5c6f52, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3dd, 2.2);
  sun.position.set(35, 48, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -25;
  sun.shadow.camera.right = 25;
  sun.shadow.camera.top = 25;
  sun.shadow.camera.bottom = -25;
  sun.shadow.camera.far = 120;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  // grass ground
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(220, 48),
    new THREE.MeshStandardMaterial({ color: 0x6d8f5a, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  // the 21 x 11 m court foundation slab — the entire system fits on it
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(21, 0.06, 11),
    new THREE.MeshStandardMaterial({ color: 0xb9bcbe, roughness: 0.9 })
  );
  apron.position.y = 0.01;
  apron.receiveShadow = true;
  scene.add(apron);

  // a few simple trees for scale
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4f35, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4a7340, roughness: 1 });
  const treeAt = (x, z, s = 1) => {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.26 * s, 2.4 * s, 8), trunkMat);
    trunk.position.y = 1.2 * s;
    trunk.castShadow = true;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7 * s, 1), leafMat);
    crown.position.y = 3.1 * s;
    crown.castShadow = true;
    t.add(trunk, crown);
    t.position.set(x, 0, z);
    scene.add(t);
  };
  treeAt(-22, 14, 1.4); treeAt(-26, -10, 1.1); treeAt(24, 16, 1.2);
  treeAt(28, -8, 1.5); treeAt(-18, -16, 1.0); treeAt(20, -18, 1.3);

  // person silhouette for scale, near a corner
  const person = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a4c5c, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.05, 4, 10), bodyMat);
  body.position.y = 0.95;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), bodyMat);
  head.position.y = 1.72;
  person.add(body, head);
  person.traverse((o) => { o.castShadow = true; });
  person.position.set(-13.5, 0, 8);
  scene.add(person);

  // ------------- clear-sky <-> overcast blend (for the rain demo) -------------
  const CLEAR = {
    top: new THREE.Color(0x3f7fc4), horizon: new THREE.Color(0xc4dcec),
    bg: new THREE.Color(0x9ec9e8), fog: new THREE.Color(0xa9c9de),
    sun: 2.2, hemi: 0.85,
  };
  const OVERCAST = {
    top: new THREE.Color(0x5a6a78), horizon: new THREE.Color(0x9aa6ae),
    bg: new THREE.Color(0x8e9ba4), fog: new THREE.Color(0x8e9ba4),
    sun: 0.55, hemi: 0.6,
  };
  let overcastTarget = 0;
  let overcast = 0;

  return {
    setOvercast(t) { overcastTarget = t; },
    update(dt) {
      if (Math.abs(overcast - overcastTarget) < 0.002) return;
      overcast += (overcastTarget - overcast) * Math.min(1, dt * 1.6);
      skyMat.uniforms.top.value.lerpColors(CLEAR.top, OVERCAST.top, overcast);
      skyMat.uniforms.horizon.value.lerpColors(CLEAR.horizon, OVERCAST.horizon, overcast);
      scene.background.lerpColors(CLEAR.bg, OVERCAST.bg, overcast);
      scene.fog.color.lerpColors(CLEAR.fog, OVERCAST.fog, overcast);
      sun.intensity = THREE.MathUtils.lerp(CLEAR.sun, OVERCAST.sun, overcast);
      hemi.intensity = THREE.MathUtils.lerp(CLEAR.hemi, OVERCAST.hemi, overcast);
    },
  };
}
