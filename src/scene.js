// Environment: sky, sun, ground, and a bit of surrounding context.

import * as THREE from 'three';
import { grassTexture } from './textures.js';
import { POOL } from './estate.js';

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
      sunDir: { value: new THREE.Vector3(35, 48, 20).normalize() },
      moonDir: { value: new THREE.Vector3(-30, 32, -46).normalize() },
      night: { value: 0 },
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
      uniform vec3 sunDir;
      uniform vec3 moonDir;
      uniform float night;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y * 1.6, 0.0, 1.0);
        vec3 c = mix(horizon, top, pow(h, 0.8));
        // sun disc + warm glow by day
        float sd = max(dot(vDir, sunDir), 0.0);
        c += vec3(1.0, 0.95, 0.85) * (pow(sd, 1400.0) * 10.0 + pow(sd, 10.0) * 0.22) * (1.0 - night);
        // moon disc + cool halo by night
        float md = max(dot(vDir, moonDir), 0.0);
        c += vec3(0.85, 0.9, 1.0) * (pow(md, 3000.0) * 2.2 + pow(md, 40.0) * 0.12) * night;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // lights
  const hemi = new THREE.HemisphereLight(0xbfd9ee, 0x5c6f52, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3dd, 2.2);
  sun.position.set(35, 48, 20);
  sun.castShadow = true;
  // wide enough to shadow the whole estate, not just the court
  const hiRes = window.innerWidth >= 900;
  sun.shadow.mapSize.set(hiRes ? 4096 : 2048, hiRes ? 4096 : 2048);
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.camera.far = 160;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);

  // lawn with mowing stripes, with a hole cut for the pool basin.
  // ShapeGeometry UVs are world units, so the texture repeat is per metre.
  const lawnShape = new THREE.Shape();
  lawnShape.absarc(0, 0, 220, 0, Math.PI * 2, false);
  const poolHole = new THREE.Path();                 // shape y maps to world -z
  const hx0 = POOL.x - POOL.w / 2, hx1 = POOL.x + POOL.w / 2;
  const hy0 = -(POOL.z + POOL.d / 2), hy1 = -(POOL.z - POOL.d / 2);
  poolHole.moveTo(hx0, hy0);
  poolHole.lineTo(hx1, hy0);
  poolHole.lineTo(hx1, hy1);
  poolHole.lineTo(hx0, hy1);
  poolHole.closePath();
  lawnShape.holes.push(poolHole);
  const ground = new THREE.Mesh(
    new THREE.ShapeGeometry(lawnShape, 48),
    new THREE.MeshStandardMaterial({ map: grassTexture([0.2, 0.2]), roughness: 1 })
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

  // stars, visible only at night
  const starPos = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = Math.acos(Math.random());          // upper hemisphere bias
    const r = 205;
    starPos[i * 3] = r * Math.sin(e) * Math.cos(a);
    starPos[i * 3 + 1] = r * Math.cos(e) * 0.95 + 6;
    starPos[i * 3 + 2] = r * Math.sin(e) * Math.sin(a);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xdfe8ff, size: 1.3, transparent: true, opacity: 0, depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.visible = false;
  scene.add(stars);

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

  // ------------- sky states: clear day, overcast (rain), night -------------
  const CLEAR = {
    top: new THREE.Color(0x3f7fc4), horizon: new THREE.Color(0xc4dcec),
    bg: new THREE.Color(0x9ec9e8), fog: new THREE.Color(0xa9c9de),
    sun: 2.2, hemi: 0.85, env: 0.55,
  };
  const OVERCAST = {
    top: new THREE.Color(0x5a6a78), horizon: new THREE.Color(0x9aa6ae),
    bg: new THREE.Color(0x8e9ba4), fog: new THREE.Color(0x8e9ba4),
    sun: 0.55, hemi: 0.6, env: 0.35,
  };
  const NIGHT = {
    top: new THREE.Color(0x0a1226), horizon: new THREE.Color(0x1b2b42),
    bg: new THREE.Color(0x0d1726), fog: new THREE.Color(0x0d1624),
    sun: 0.02, hemi: 0.14, env: 0.12,
  };
  let overcastTarget = 0;
  let overcast = 0;
  let night = 0;       // driven externally (main lerps the toggle)

  function apply() {
    const o = overcast, n = night;
    const mixC = (key, out) => {
      out.lerpColors(CLEAR[key], OVERCAST[key], o).lerp(NIGHT[key], n);
    };
    mixC('top', skyMat.uniforms.top.value);
    mixC('horizon', skyMat.uniforms.horizon.value);
    mixC('bg', scene.background);
    mixC('fog', scene.fog.color);
    const mixN = (key) => THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(CLEAR[key], OVERCAST[key], o), NIGHT[key], n);
    sun.intensity = mixN('sun');
    hemi.intensity = mixN('hemi');
    scene.environmentIntensity = mixN('env');
    skyMat.uniforms.night.value = n;
    starMat.opacity = n * 0.9;
    stars.visible = n > 0.02;
  }

  return {
    setOvercast(t) { overcastTarget = t; },
    setNight(n) {
      if (Math.abs(n - night) < 0.001) return;
      night = n;
      apply();
    },
    update(dt) {
      if (Math.abs(overcast - overcastTarget) < 0.002) return;
      overcast += (overcastTarget - overcast) * Math.min(1, dt * 1.6);
      apply();
    },
  };
}
