// Rain particle system for the rain-sensor demo.

import * as THREE from 'three';

const COUNT = 1400;
const AREA_X = 22, AREA_Z = 14, TOP = 13;

export function buildRain(scene) {
  const positions = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() * 2 - 1) * AREA_X;
    positions[i * 3 + 1] = Math.random() * TOP;
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * AREA_Z;
    speeds[i] = 9 + Math.random() * 5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const rain = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xbcd2e0,
    size: 0.075,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  }));
  rain.visible = false;
  rain.frustumCulled = false;
  scene.add(rain);

  let active = false;
  return {
    setActive(on) { active = on; rain.visible = on; },
    isActive: () => active,
    update(dt) {
      if (!active) return;
      const pos = geo.attributes.position;
      for (let i = 0; i < COUNT; i++) {
        let y = pos.getY(i) - speeds[i] * dt;
        if (y < 0) y += TOP;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    },
  };
}
