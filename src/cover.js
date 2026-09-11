// The retractable cover: freestanding steel frame around the court, a
// motorised roller tube at one end, guide rails along the eaves, and a
// tensioned fabric membrane that rolls out across the court.
//
// Geometry notes:
//   - the WHOLE system is self-contained within a 21 x 11 m padel court
//     foundation (x ∈ [-10.5, 10.5], z ∈ [-5.5, 5.5]) — columns, roller,
//     hood and sensors all stay inside that envelope
//   - single-pitch roof: one flat fabric plane, high side 7 m, low side 6 m
//     (1 m cross-fall for drainage, all run-off to the low-side gutter)
//   - fabric is built at full length and scaled in x from the roller end,
//     which works because the roof cross-section is constant along x.

import * as THREE from 'three';

export const FRAME_HALF_L = 10.3;   // column centreline; outer faces at ±10.45
export const FRAME_HALF_W = 5.3;    // column centreline; outer faces at ±5.45
const ROLLER_X = -FRAME_HALF_L + 0.35;   // roller sits inboard, over the back wall
export const EAVE_H = 6;            // low side (z = +FRAME_HALF_W)
export const PITCH_RISE = 1;        // high side (z = -FRAME_HALF_W) is 1 m higher

// flat single-pitch roof plane: 7 m on the high side, 6 m on the low side
export const roofY = (z) => EAVE_H + PITCH_RISE * (FRAME_HALF_W - z) / (2 * FRAME_HALF_W);

function fabricTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#f2f4f6';
  g.fillRect(0, 0, 512, 64);
  // welded seam lines across the width every panel
  g.fillStyle = 'rgba(160,170,180,0.55)';
  g.fillRect(0, 0, 3, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(11, 1);
  return tex;
}

export function buildCover(registerPart) {
  const group = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x31424f, roughness: 0.45, metalness: 0.75 });
  const alloyMat = new THREE.MeshStandardMaterial({ color: 0x9fb2bd, roughness: 0.35, metalness: 0.85 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a232c, roughness: 0.5, metalness: 0.6 });

  // ---------------- columns ----------------
  const postXs = [-FRAME_HALF_L, -6.18, -2.06, 2.06, 6.18, FRAME_HALF_L];
  // the high-side row is 1 m taller than the low-side row (single pitch)
  const postGeos = {
    '-1': new THREE.BoxGeometry(0.3, roofY(-FRAME_HALF_W), 0.3),
    '1': new THREE.BoxGeometry(0.3, roofY(FRAME_HALF_W), 0.3),
  };
  for (const x of postXs) {
    for (const sz of [-1, 1]) {
      const h = roofY(sz * FRAME_HALF_W);
      const p = new THREE.Mesh(postGeos[String(sz)], steelMat);
      p.position.set(x, h / 2, sz * FRAME_HALF_W);
      p.castShadow = true;
      group.add(p);
      registerPart(p, {
        name: 'Steel column',
        blurb: 'Hot-dip galvanised steel column, 300 mm box section, anchored just outside the court walls — the whole system stays inside the standard 21 × 11 m court foundation. Twelve columns carry the canopy.',
      });
      // base plate
      const bp = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.55), darkMat);
      bp.position.set(x, 0.03, sz * FRAME_HALF_W);
      group.add(bp);
    }
  }

  // ---------------- eave beams (longitudinal) ----------------
  const beamGeo = new THREE.BoxGeometry(FRAME_HALF_L * 2 + 0.3, 0.42, 0.3);
  for (const sz of [-1, 1]) {
    const b = new THREE.Mesh(beamGeo, steelMat);
    b.position.set(0, roofY(sz * FRAME_HALF_W) + 0.21, sz * FRAME_HALF_W);
    b.castShadow = true;
    group.add(b);
    registerPart(b, {
      name: 'Steel eave beam',
      blurb: 'Main longitudinal beam running the full 20.9 m length of the structure. It ties the columns together and carries the fabric guide rail.',
    });
  }

  // ---------------- straight sloped ribs across the width ----------------
  // BOTH rib options are fixed to the membrane and travel with it, so an
  // open court always has completely clear sky — no structure overhead.
  const ribCurvePts = [];
  for (let i = 0; i <= 24; i++) {
    const z = -FRAME_HALF_W + (i / 24) * FRAME_HALF_W * 2;
    ribCurvePts.push(new THREE.Vector3(0, roofY(z) + 0.03, z));
  }
  const ribCurve = new THREE.CatmullRomCurve3(ribCurvePts);

  // option A: galvanised steel ribs — chunkier and economical; they slide
  // along the rails with the fabric and park under the hood when open.
  // World positions are driven by setDeploy() below.
  const steelRibs = new THREE.Group();
  const ribGeo = new THREE.TubeGeometry(ribCurve, 32, 0.09, 10, false);
  const steelRibList = [];
  for (let i = 0; i < 7; i++) {
    const rib = new THREE.Mesh(ribGeo, steelMat);
    rib.castShadow = true;
    rib.visible = false;
    steelRibs.add(rib);
    steelRibList.push(rib);
    registerPart(rib, {
      name: 'Steel rib',
      blurb: 'Galvanised steel rib fixed to the membrane. It slides along the guide rails with the fabric and parks under the weather hood when open — clear sky above the court. Heavier than carbon, but lower cost.',
    });
  }
  group.add(steelRibs);

  // option B: slim carbon-fibre battens sewn into pockets in the membrane.
  // They ride out with the fabric and wind onto the roller with it, so with
  // the cover open there is NO structure above the court at all.
  // Their world positions are driven by setDeploy() below.
  const carbonRibs = new THREE.Group();
  const carbonMat = new THREE.MeshPhysicalMaterial({
    color: 0x17191c, roughness: 0.28, metalness: 0.2, clearcoat: 0.7, clearcoatRoughness: 0.25,
  });
  const battenCurvePts = [];
  for (let i = 0; i <= 24; i++) {
    const z = -FRAME_HALF_W + (i / 24) * FRAME_HALF_W * 2;
    battenCurvePts.push(new THREE.Vector3(0, roofY(z) + 0.07, z));
  }
  const battenGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(battenCurvePts), 32, 0.045, 8, false
  );
  const battens = [];
  for (let i = 0; i < 13; i++) {
    const bt = new THREE.Mesh(battenGeo, carbonMat);
    bt.castShadow = true;
    bt.visible = false;
    carbonRibs.add(bt);
    battens.push(bt);
    registerPart(bt, {
      name: 'Carbon fibre batten',
      blurb: 'Slim carbon fibre batten sewn into a welded pocket in the membrane, rolling up with it. Around 70% lighter than the steel rib option — slimmer profile, smaller roller, faster travel.',
    });
  }
  carbonRibs.visible = false;
  group.add(carbonRibs);

  function setRibStyle(style) {
    steelRibs.visible = style === 'steel';
    carbonRibs.visible = style === 'carbon';
  }

  // ---------------- guide rails ----------------
  for (const sz of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(FRAME_HALF_L * 2 + 0.3, 0.14, 0.16),
      alloyMat
    );
    rail.position.set(0, roofY(sz * (FRAME_HALF_W - 0.28)) + 0.05, sz * (FRAME_HALF_W - 0.28));
    group.add(rail);
    registerPart(rail, {
      name: 'Guide rail',
      blurb: 'Extruded aluminium zip-track rail. The welded edge of the fabric runs captive inside this channel, so the membrane stays sealed and tensioned even in strong wind.',
    });
  }

  // ---------------- roller assembly ----------------
  const rollerGroup = new THREE.Group();
  rollerGroup.position.set(ROLLER_X, roofY(0) + 0.55, 0);
  // tilt the whole assembly so the roller axis matches the roof pitch
  rollerGroup.rotation.x = Math.atan(PITCH_RISE / (2 * FRAME_HALF_W));
  group.add(rollerGroup);

  const rollerTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, FRAME_HALF_W * 2 + 0.2, 24),
    alloyMat
  );
  rollerTube.rotation.x = Math.PI / 2;
  rollerTube.castShadow = true;
  rollerGroup.add(rollerTube);
  registerPart(rollerTube, {
    name: 'Roller tube',
    blurb: 'Aluminium winding tube, ~160 mm diameter, spanning the full width. The whole membrane wraps around it when the cover is open — like a giant awning.',
  });

  // rolled-up fabric around the tube (radius shrinks as the cover closes)
  const rolledFabric = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, FRAME_HALF_W * 2 - 0.4, 24),
    new THREE.MeshStandardMaterial({ color: 0xe8ebee, roughness: 0.8 })
  );
  rolledFabric.rotation.x = Math.PI / 2;
  rolledFabric.castShadow = true;
  rollerGroup.add(rolledFabric);
  registerPart(rolledFabric, {
    name: 'Rolled fabric',
    blurb: 'The membrane stored on the roller. Watch it get thinner as the cover deploys — every metre that rolls off travels down the rails.',
  });

  // end brackets
  for (const sz of [-1, 1]) {
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.12), darkMat);
    br.position.set(0.1, -0.15, sz * (FRAME_HALF_W + 0.08));
    rollerGroup.add(br);
  }

  // motor housing on one end (kept inside the foundation envelope)
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.32, 16), darkMat);
  motor.rotation.x = Math.PI / 2;
  motor.position.set(0, 0, FRAME_HALF_W + 0.02);
  rollerGroup.add(motor);
  const motorBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.34, 0.3), darkMat);
  motorBox.position.set(0, -0.35, FRAME_HALF_W - 0.05);
  rollerGroup.add(motorBox);
  for (const m of [motor, motorBox]) {
    registerPart(m, {
      name: 'Tubular drive motor',
      blurb: '400 W tubular motor inside the roller end, with a gearbox and encoder. One button press opens or closes the court in about 90 seconds. A hand crank backup covers power cuts.',
    });
  }

  // weather hood over the roller
  // open half-cylinder over the roller (a curved sheet, not a solid)
  const hood = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, FRAME_HALF_W * 2 + 0.3, 24, 1, true, Math.PI / 2, Math.PI),
    new THREE.MeshStandardMaterial({
      color: 0x31424f, roughness: 0.45, metalness: 0.75, side: THREE.DoubleSide,
    })
  );
  hood.rotation.x = Math.PI / 2;      // axis across the width; arc covers the top
  hood.castShadow = true;
  rollerGroup.add(hood);              // tilts with the roller to match the pitch
  registerPart(hood, {
    name: 'Weather hood',
    blurb: 'Folded steel hood that shields the rolled-up fabric from UV, rain and leaves when the court is open.',
  });

  // ---------------- fabric membrane ----------------
  const FAB_LEN = FRAME_HALF_L * 2 - 0.3;         // roller to the far eave end
  const FAB_HALF_W = FRAME_HALF_W - 0.28;         // meets the guide rails
  const segX = 40, segZ = 24;
  const fabGeo = new THREE.PlaneGeometry(FAB_LEN, FAB_HALF_W * 2, segX, segZ);
  fabGeo.rotateX(-Math.PI / 2);                   // now spans x/z, y up
  const pos = fabGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    pos.setY(i, roofY(z) + 0.12 - EAVE_H);        // arch profile, relative
  }
  fabGeo.computeVertexNormals();

  const fabric = new THREE.Mesh(fabGeo, new THREE.MeshStandardMaterial({
    map: fabricTexture(),
    side: THREE.DoubleSide,
    roughness: 0.85,
    transparent: true,
    opacity: 0.97,
    // translucent membrane: let it glow a little so the underside reads as
    // daylight coming through, not a dark ceiling
    emissive: 0xf4f0e6,
    emissiveIntensity: 0.38,
  }));
  // geometry is centred; shift so its -x edge sits at the roller
  fabGeo.translate(FAB_LEN / 2, 0, 0);
  fabric.position.set(ROLLER_X, EAVE_H, 0);
  fabric.castShadow = true;
  fabric.receiveShadow = true;
  group.add(fabric);
  registerPart(fabric, {
    name: 'PVC fabric membrane',
    blurb: 'High-tenacity polyester weave with a PVC coating (~900 g/m²). 100% waterproof, UV-stable, and translucent enough to play under in daylight. Welded seams every 2 m.',
  });

  // ---------------- lead bar (front edge of the fabric) ----------------
  const leadPts = [];
  for (let i = 0; i <= 24; i++) {
    const z = -FAB_HALF_W + (i / 24) * FAB_HALF_W * 2;
    leadPts.push(new THREE.Vector3(0, roofY(z) + 0.12, z));
  }
  const leadBar = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leadPts), 32, 0.07, 10, false),
    darkMat
  );
  leadBar.castShadow = true;
  group.add(leadBar);
  registerPart(leadBar, {
    name: 'Lead bar',
    blurb: 'Weighted aluminium profile on the leading edge of the fabric. The motor drives it along the guide rails; its weight and end-glides keep the membrane taut behind it.',
  });

  // ---------------- gutter + downpipe on the low side ----------------
  const lowEaveY = roofY(FRAME_HALF_W);
  const gutter = new THREE.Mesh(
    // open half-shell facing up, running the full length under the low eave
    new THREE.CylinderGeometry(0.09, 0.09, FRAME_HALF_L * 2 + 0.3, 16, 1, true, Math.PI, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x9fb2bd, roughness: 0.35, metalness: 0.85, side: THREE.DoubleSide })
  );
  gutter.rotation.z = Math.PI / 2;     // axis along x
  gutter.position.set(0, lowEaveY - 0.06, FRAME_HALF_W + 0.11);
  group.add(gutter);
  const downpipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, lowEaveY - 0.1, 12),
    alloyMat
  );
  downpipe.position.set(FRAME_HALF_L - 0.28, (lowEaveY - 0.1) / 2, FRAME_HALF_W + 0.11);
  group.add(downpipe);
  for (const m of [gutter, downpipe]) {
    registerPart(m, {
      name: 'Gutter & downpipe',
      blurb: 'The roof falls 1 m across its width, so every drop of rain drains to this side — into a full-length gutter and down a single pipe. No water sheeting off onto spectators or neighbouring courts.',
    });
  }

  // ---------------- weather station + control unit ----------------
  // anemometer + rain sensor on a rear corner column
  const station = new THREE.Group();
  station.position.set(FRAME_HALF_L - 0.2, EAVE_H + 0.42, FRAME_HALF_W - 0.2);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.85, 8), alloyMat);
  station.add(mast);
  const cups = new THREE.Group();
  cups.position.y = 0.48;
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.02), alloyMat);
    const a = (i / 3) * Math.PI * 2;
    arm.position.set(Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13);
    arm.rotation.y = -a;
    cups.add(arm);
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8, 0, Math.PI), darkMat);
    cup.position.set(Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26);
    cup.rotation.y = -a + Math.PI / 2;
    cups.add(cup);
  }
  station.add(cups);
  const rainSensor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.16), darkMat);
  rainSensor.position.set(0, 0.12, 0.18);
  station.add(rainSensor);
  group.add(station);
  for (const m of [mast, rainSensor]) {
    registerPart(m, {
      name: 'Weather station',
      blurb: 'Anemometer plus rain sensor. The controller closes the cover automatically when rain is detected, and retracts it when gusts pass the set wind threshold to protect the membrane — no staff needed.',
    });
  }

  // wifi control unit on a column at reachable height
  const controlBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.36, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xd8dde1, roughness: 0.4, metalness: 0.1 })
  );
  controlBox.position.set(FRAME_HALF_L, 1.45, FRAME_HALF_W + 0.14);
  group.add(controlBox);
  const controlLed = new THREE.Mesh(
    new THREE.CircleGeometry(0.025, 12),
    new THREE.MeshBasicMaterial({ color: 0x44e07c })
  );
  controlLed.position.set(FRAME_HALF_L, 1.56, FRAME_HALF_W + 0.201);
  group.add(controlLed);
  registerPart(controlBox, {
    name: 'Wi-Fi control unit',
    blurb: 'Connected controller with wall buttons and a phone app — open, close or stop the cover from anywhere, check status remotely, and get alerts. Integrates with venue booking systems.',
  });

  // ---------------- deploy state ----------------
  let deployT = 0;
  function setDeploy(t) {
    deployT = THREE.MathUtils.clamp(t, 0, 1);
    const scale = Math.max(deployT, 0.004);
    fabric.scale.x = scale;
    fabric.visible = deployT > 0.005;
    const leadX = ROLLER_X + FAB_LEN * scale;
    leadBar.position.x = leadX;
    // both rib types sit at fixed spacing along the fabric, so they emerge
    // one by one behind the lead bar and park at the roller end on opening
    for (const list of [battens, steelRibList]) {
      const spacing = FAB_LEN / list.length;
      for (let i = 0; i < list.length; i++) {
        const behindLead = (i + 1) * spacing;
        list[i].position.x = leadX - behindLead;
        list[i].visible = deployT > 0.005 && behindLead < FAB_LEN * scale - 0.25;
      }
    }
    // roller spins as fabric pays out; rolled bulk shrinks
    rollerTube.rotation.y = -deployT * FAB_LEN / 0.16;
    rolledFabric.rotation.y = rollerTube.rotation.y;
    const r = 0.2 + 0.15 * (1 - deployT);
    rolledFabric.scale.set(r / 0.34, 1, r / 0.34);
  }
  setDeploy(0);

  // ---------------- roof colour ----------------
  function setRoofColor(hex) {
    fabric.material.color.set(hex);
    fabric.material.emissive.set(hex);
    rolledFabric.material.color.set(hex);
  }

  // anemometer spin, driven by the current wind speed (km/h)
  function tickWeather(dt, windKmh) {
    cups.rotation.y += dt * (0.6 + windKmh * 0.22);
  }

  return { group, setDeploy, getDeploy: () => deployT, setRibStyle, setRoofColor, tickWeather };
}
