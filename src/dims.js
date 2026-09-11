// Toggleable dimension overlay: height lines and size callouts with
// CSS2D labels, so the customer can see exactly how big the cover is.

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { FRAME_HALF_L, FRAME_HALF_W, EAVE_H, PITCH_RISE } from './cover.js';

const GREEN = 0x7ee787;

function label(text, pos) {
  const div = document.createElement('div');
  div.className = 'dim-label';
  div.textContent = text;
  const obj = new CSS2DObject(div);
  obj.position.copy(pos);
  return obj;
}

function dimLine(from, to) {
  const mat = new THREE.LineBasicMaterial({ color: GREEN });
  const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
  const line = new THREE.Line(geo, mat);
  // arrow-ish end ticks
  return line;
}

export function buildDimensions() {
  const group = new THREE.Group();

  const zOut = FRAME_HALF_W + 1.2;

  // low side (6 m) — the drainage edge
  const lowTop = new THREE.Vector3(-FRAME_HALF_L, EAVE_H, zOut);
  group.add(dimLine(new THREE.Vector3(-FRAME_HALF_L, 0, zOut), lowTop));
  group.add(dimLine(lowTop, new THREE.Vector3(-FRAME_HALF_L, EAVE_H, FRAME_HALF_W)));
  group.add(label(`${EAVE_H.toFixed(1)} m low side — drainage edge`, new THREE.Vector3(-FRAME_HALF_L, EAVE_H / 2, zOut)));

  // high side (7 m)
  const highY = EAVE_H + PITCH_RISE;
  const highTop = new THREE.Vector3(-FRAME_HALF_L, highY, -zOut);
  group.add(dimLine(new THREE.Vector3(-FRAME_HALF_L, 0, -zOut), highTop));
  group.add(dimLine(highTop, new THREE.Vector3(-FRAME_HALF_L, highY, -FRAME_HALF_W)));
  group.add(label(`${highY.toFixed(1)} m high side`, new THREE.Vector3(-FRAME_HALF_L, highY * 0.62, -zOut)));

  // court length
  const yFloor = 0.12;
  group.add(dimLine(new THREE.Vector3(-10, yFloor, zOut), new THREE.Vector3(10, yFloor, zOut)));
  group.add(label('court 20 m', new THREE.Vector3(0, yFloor + 0.4, zOut)));

  // structure length
  group.add(dimLine(
    new THREE.Vector3(-FRAME_HALF_L, yFloor, -zOut),
    new THREE.Vector3(FRAME_HALF_L, yFloor, -zOut)
  ));
  group.add(label(`structure ${(FRAME_HALF_L * 2 + 0.3).toFixed(1)} m`, new THREE.Vector3(0, yFloor + 0.4, -zOut)));

  // width
  const xOut = FRAME_HALF_L + 1.4;
  group.add(dimLine(new THREE.Vector3(xOut, yFloor, -FRAME_HALF_W), new THREE.Vector3(xOut, yFloor, FRAME_HALF_W)));
  group.add(label(`structure ${(FRAME_HALF_W * 2 + 0.3).toFixed(1)} m wide`, new THREE.Vector3(xOut, yFloor + 0.4, 0)));

  // 21 x 11 m foundation outline — everything stays inside it
  const fnd = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-10.5, 0.1, -5.5),
      new THREE.Vector3(10.5, 0.1, -5.5),
      new THREE.Vector3(10.5, 0.1, 5.5),
      new THREE.Vector3(-10.5, 0.1, 5.5),
    ]),
    new THREE.LineBasicMaterial({ color: 0x4fc3f7 })
  );
  group.add(fnd);
  const fndLabel = label('foundation 21 × 11 m — fully self-contained', new THREE.Vector3(10.5, 0.5, 5.5));
  fndLabel.element.style.borderColor = 'rgba(79,195,247,0.6)';
  fndLabel.element.style.color = '#a8dcf7';
  group.add(fndLabel);

  // net height, small but fun
  group.add(label('net 0.88 m', new THREE.Vector3(0, 1.25, FRAME_HALF_W - 0.7)));

  group.visible = false;
  return group;
}
