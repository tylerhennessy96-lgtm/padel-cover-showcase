import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildEnvironment } from './scene.js';
import { buildCourt } from './court.js';
import { buildCover } from './cover.js';
import { buildDimensions } from './dims.js';
import { buildRain } from './weather.js';
import { buildEstate } from './estate.js';

// ------------------------------------------------------------------ setup

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'fixed';
labelRenderer.domElement.style.inset = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.zIndex = '4';
document.body.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
{
  // ambient reflections so the steel and aluminium read as metal, not black
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
}
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(28, 16, 24);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 1.5;
controls.maxDistance = 90;
controls.target.set(0, 3, 0);

// ------------------------------------------------------------------ parts / picking

const pickable = [];
function registerPart(mesh, info) {
  mesh.userData.part = info;
  pickable.push(mesh);
}

// ------------------------------------------------------------------ build world

const env = buildEnvironment(scene);
const estate = buildEstate(scene);
const court = buildCourt(registerPart);
scene.add(court.group);
const cover = buildCover(registerPart);
scene.add(cover.group);
const dims = buildDimensions();
scene.add(dims);
const rain = buildRain(scene);

// ------------------------------------------------------------------ camera presets

const PRESETS = {
  overview: { pos: [28, 16, 24], tgt: [0, 3, 0] },
  estate:   { pos: [-42, 27, 42], tgt: [0, 2, -14] },
  side:     { pos: [0, 4, 30], tgt: [0, 4, 0] },
  end:      { pos: [-32, 6, 0.01], tgt: [0, 4.5, 0] },
  inside:   { pos: [-8, 1.7, 0], tgt: [10, 4, 0] },
  roller:   { pos: [-13.6, 8.3, 9.2], tgt: [-9.95, 6.3, 3.2] },
  rail:     { pos: [3.2, 7.5, 8.0], tgt: [1, 6.05, 5.05] },
};

let camTween = null;

// portrait phones need to stand further back to fit the same framing
function presetVectors(p) {
  const tgt = new THREE.Vector3(...p.tgt);
  const pos = new THREE.Vector3(...p.pos);
  if (camera.aspect < 0.9) {
    pos.sub(tgt).multiplyScalar(1.5).add(tgt);
  }
  return { pos, tgt };
}

function flyTo(name) {
  const p = PRESETS[name];
  if (!p) return;
  const { pos, tgt } = presetVectors(p);
  camTween = {
    t: 0,
    fromPos: camera.position.clone(),
    fromTgt: controls.target.clone(),
    toPos: pos,
    toTgt: tgt,
  };
  document.querySelectorAll('#cam-buttons button').forEach((b) =>
    b.classList.toggle('active', b.dataset.cam === name));
}
controls.addEventListener('start', () => { camTween = null; });

// initial view = overview preset (with the portrait adjustment)
{
  const { pos, tgt } = presetVectors(PRESETS.overview);
  camera.position.copy(pos);
  controls.target.copy(tgt);
}

document.querySelectorAll('#cam-buttons button').forEach((b) => {
  b.addEventListener('click', () => flyTo(b.dataset.cam));
});

// ------------------------------------------------------------------ deploy controls

const slider = document.querySelector('#deploy-slider');
const deployBtn = document.querySelector('#deploy-btn');
let deployTarget = 0;     // where the motor is driving to
let deploy = 0;           // current position
let animating = false;

function refreshDeployBtn() {
  const closing = deployTarget > 0.5;
  deployBtn.textContent = animating
    ? (closing ? '⏸ Closing…' : '⏸ Opening…')
    : (deploy > 0.5 ? '▶ Open cover' : '▶ Close cover');
}

deployBtn.addEventListener('click', () => {
  if (animating) {           // pause mid-travel
    animating = false;
    deployTarget = deploy;
  } else {
    deployTarget = deploy > 0.5 ? 0 : 1;
    animating = true;
  }
  refreshDeployBtn();
});

slider.addEventListener('input', () => {
  animating = false;
  deploy = deployTarget = slider.value / 1000;
  cover.setDeploy(deploy);
  refreshDeployBtn();
});

// ------------------------------------------------------------------ configurator

document.querySelectorAll('#rib-seg button').forEach((b) => {
  b.addEventListener('click', () => {
    cover.setRibStyle(b.dataset.rib);
    document.querySelectorAll('#rib-seg button').forEach((x) => x.classList.toggle('active', x === b));
  });
});

function wireSwatches(sel, apply) {
  document.querySelectorAll(`${sel} .swatch`).forEach((b) => {
    b.addEventListener('click', () => {
      apply(b.dataset.color);
      document.querySelectorAll(`${sel} .swatch`).forEach((x) => x.classList.toggle('active', x === b));
    });
  });
}
wireSwatches('#roof-swatches', (c) => cover.setRoofColor(c));
wireSwatches('#court-swatches', (c) => court.setTurfColor(c));

// ------------------------------------------------------------------ mobile drawers

const mbConfig = document.querySelector('#mb-config');
const mbCamera = document.querySelector('#mb-camera');
const configPanel = document.querySelector('#config-panel');
const camPanel = document.querySelector('#cam-panel');

function toggleDrawer(panel, btn, otherPanel, otherBtn) {
  const open = !panel.classList.contains('open');
  panel.classList.toggle('open', open);
  btn.classList.toggle('active', open);
  if (open) {
    otherPanel.classList.remove('open');
    otherBtn.classList.remove('active');
  }
}
mbConfig.addEventListener('click', () => toggleDrawer(configPanel, mbConfig, camPanel, mbCamera));
mbCamera.addEventListener('click', () => toggleDrawer(camPanel, mbCamera, configPanel, mbConfig));

// picking a preset closes the camera drawer (no-op on desktop)
document.querySelectorAll('#cam-buttons button').forEach((b) => {
  b.addEventListener('click', () => {
    camPanel.classList.remove('open');
    mbCamera.classList.remove('active');
  });
});

// ------------------------------------------------------------------ toasts

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.querySelector('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 3800);
  setTimeout(() => el.remove(), 4400);
}

// ------------------------------------------------------------------ smart features

let windKmh = 8;

function autoClose(reason) {
  toast(reason);
  if (deploy < 1) {
    deployTarget = 1;
    animating = true;
    refreshDeployBtn();
  }
}

const rainBtn = document.querySelector('#rain-btn');
rainBtn.addEventListener('click', () => {
  const on = !rain.isActive();
  rain.setActive(on);
  env.setOvercast(on ? 1 : 0);
  rainBtn.classList.toggle('active', on);
  rainBtn.innerHTML = on ? '🌧&nbsp; Stop rain' : '🌧&nbsp; Rain sensor demo';
  if (on) autoClose('🌧 Rain detected — closing cover automatically');
  else toast('☀️ Rain stopped');
});

document.querySelector('#wind-btn').addEventListener('click', () => {
  windKmh = 62;
  toast('💨 Gust 62 km/h — retracting cover to protect the membrane');
  if (deploy > 0) {
    deployTarget = 0;
    animating = true;
    refreshDeployBtn();
  }
});

const phone = document.querySelector('#phone');
const appBtn = document.querySelector('#app-btn');
appBtn.addEventListener('click', () => {
  phone.classList.toggle('hidden');
  appBtn.classList.toggle('active', !phone.classList.contains('hidden'));
});
document.querySelector('#ph-open').addEventListener('click', () => {
  deployTarget = 0; animating = true; refreshDeployBtn();
});
document.querySelector('#ph-close').addEventListener('click', () => {
  deployTarget = 1; animating = true; refreshDeployBtn();
});
document.querySelector('#ph-stop').addEventListener('click', () => {
  animating = false; deployTarget = deploy; refreshDeployBtn();
});

const phCover = document.querySelector('#ph-cover');
const phRain = document.querySelector('#ph-rain');
const phWind = document.querySelector('#ph-wind');
let phoneClock = 0;
function updatePhone(dt) {
  if (phone.classList.contains('hidden')) return;
  phoneClock += dt;
  if (phoneClock < 0.25) return;
  phoneClock = 0;
  phCover.textContent = deploy <= 0.005 ? 'Open'
    : deploy >= 0.995 ? 'Closed'
    : `${Math.round(deploy * 100)}% closed`;
  phRain.textContent = rain.isActive() ? 'Raining' : 'Dry';
  phWind.textContent = `${Math.round(windKmh)} km/h`;
}

// ------------------------------------------------------------------ day / night

let nightTarget = 0;
let nightNow = 0;
const nightBtn = document.querySelector('#night-btn');
nightBtn.addEventListener('click', () => {
  nightTarget = nightTarget > 0.5 ? 0 : 1;
  nightBtn.classList.toggle('active', nightTarget > 0.5);
  nightBtn.textContent = nightTarget > 0.5 ? '☀️ Day' : '🌙 Night';
});

// ------------------------------------------------------------------ dimensions toggle

const dimsBtn = document.querySelector('#dims-btn');
dimsBtn.addEventListener('click', () => {
  dims.visible = !dims.visible;
  dimsBtn.classList.toggle('active', dims.visible);
  dimsBtn.textContent = dims.visible ? 'Hide dimensions' : 'Show dimensions';
});

// ------------------------------------------------------------------ picking (hover + click)

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;

function isShown(mesh) {
  for (let o = mesh; o; o = o.parent) if (!o.visible) return false;
  return true;
}

function pick(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickable.filter(isShown), false);
  return hits.length ? hits[0].object : null;
}

function setHover(mesh) {
  if (hovered === mesh) return;
  if (hovered) {
    hovered.material = hovered.userData.origMat;
    hovered = null;
  }
  if (mesh) {
    if (!mesh.userData.hlMat) {
      mesh.userData.origMat = mesh.material;
      const hl = mesh.material.clone();
      if (hl.emissive) hl.emissive = new THREE.Color(0x2a7ba6);
      hl.emissiveIntensity = 0.9;
      mesh.userData.hlMat = hl;
    }
    mesh.material = mesh.userData.hlMat;
    hovered = mesh;
  }
  canvas.style.cursor = mesh ? 'pointer' : 'grab';
}

window.addEventListener('pointermove', (e) => {
  if (e.target !== canvas) return;
  setHover(pick(e));
});

const infoPanel = document.querySelector('#info-panel');
const infoName = document.querySelector('#info-name');
const infoBlurb = document.querySelector('#info-blurb');
document.querySelector('#info-close').addEventListener('click', () => {
  infoPanel.classList.add('hidden');
});

let downPos = null;
canvas.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
  downPos = null;
  if (moved > 6) return;                    // it was a drag, not a click
  const mesh = pick(e);
  if (mesh && mesh.userData.part) {
    infoName.textContent = mesh.userData.part.name;
    infoBlurb.textContent = mesh.userData.part.blurb;
    infoPanel.classList.remove('hidden');
  } else {
    infoPanel.classList.add('hidden');
  }
});

// ------------------------------------------------------------------ resize

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// ------------------------------------------------------------------ loop

const MOTOR_SPEED = 1 / 7;   // full travel in ~7 s
const clock = new THREE.Clock();
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (animating) {
    const dir = Math.sign(deployTarget - deploy);
    deploy += dir * MOTOR_SPEED * dt;
    if ((dir > 0 && deploy >= deployTarget) || (dir < 0 && deploy <= deployTarget)) {
      deploy = deployTarget;
      animating = false;
      refreshDeployBtn();
    }
    cover.setDeploy(deploy);
    slider.value = Math.round(deploy * 1000);
  }

  if (camTween) {
    camTween.t += dt / 1.4;
    const k = easeInOut(Math.min(camTween.t, 1));
    camera.position.lerpVectors(camTween.fromPos, camTween.toPos, k);
    controls.target.lerpVectors(camTween.fromTgt, camTween.toTgt, k);
    if (camTween.t >= 1) camTween = null;
  }

  // day / night transition
  if (Math.abs(nightNow - nightTarget) > 0.001) {
    nightNow += (nightTarget - nightNow) * Math.min(1, dt * 2.2);
    if (Math.abs(nightNow - nightTarget) < 0.002) nightNow = nightTarget;
    env.setNight(nightNow);
    estate.setNight(nightNow);
    cover.setNightLights(nightNow);
  }

  // weather
  env.update(dt);
  rain.update(dt);
  windKmh += (8 - windKmh) * Math.min(1, dt * 0.25);   // gusts decay back to a breeze
  cover.tickWeather(dt, windKmh);
  updatePhone(dt);

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

// ------------------------------------------------------------------ boot

const loader = document.querySelector('#loader');
const fill = document.querySelector('#loader-fill');
let p = 0;
const bootInt = setInterval(() => {
  p = Math.min(p + 0.34, 1);
  fill.style.width = `${Math.round(p * 100)}%`;
  if (p >= 1) {
    clearInterval(bootInt);
    loader.classList.add('done');
    setTimeout(() => loader.remove(), 700);
    document.querySelector('#hud').classList.remove('hidden');
    setTimeout(() => document.querySelector('#hint')?.classList.add('faded'), 9000);
  }
}, 180);

refreshDeployBtn();
tick();

// handy in the console / for automated checks
window.showcase = {
  camera, controls, flyTo, cover, dims,
  setNight(v) {
    nightTarget = nightNow = v;
    env.setNight(v);
    estate.setNight(v);
    cover.setNightLights(v);
    nightBtn.classList.toggle('active', v > 0.5);
    nightBtn.textContent = v > 0.5 ? '☀️ Day' : '🌙 Night';
  },
  jumpTo(name) {
    const { pos, tgt } = presetVectors(PRESETS[name]);
    camera.position.copy(pos);
    controls.target.copy(tgt);
    camTween = null;
  },
};
