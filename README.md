# Padel Court Cover — 3D Showcase

An interactive 3D sales tool for showing customers how a retractable padel
court cover works — a browser-based replacement for paper blueprints.

The current cover concept is a **rolling awning**: a motorised roller tube at
one end winds a PVC fabric membrane out along guide rails over a single-pitch
steel frame — one flat plane, 7 m on the high side falling to 6 m on the low
side, so all rainwater drains to a full-length gutter and downpipe. The product
details are placeholders and easy to refine later.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5174

## What it does

- **Camera presets** (top right): overview, estate, side profile, end view,
  inside the court, roller mechanism close-up, guide rail detail — plus free
  orbit/zoom with the mouse at any time.
- **Day / night toggle**: at night the court is lit by four LED floodlights
  bracketed under the roof line (so it's lit open or closed), stars and a moon
  come out, the house interiors light up, and the pool glows.
- **Estate surroundings**: the court sits in the grounds of a 32 m wide
  glass-fronted modern mansion you can see into — living lounge with
  fireplace, 8-seat dining, kitchen, a double-height glass stair tower with
  chandelier, a cantilevered master suite (bed, freestanding bath, shower,
  dressing room), a rooftop terrace, and a front terrace with fire pit.
  Plus pool with loungers and a poolhouse bar, a four-door garage wing with
  four detailed cars (extruded body profiles, spoked wheels, lights, spoilers),
  driveway, hedgerows, topiary, and bollard lighting. Surfaces use procedural
  textures (`src/textures.js`): striped lawn, paving, timber, rippling water.
- **Close / open the cover** (bottom): animated motor travel (~7 s), or scrub
  the slider to any position. The roller spins and the stored fabric bulk
  shrinks as the membrane pays out.
- **Show dimensions**: toggleable height and size callouts (7 m high side,
  6 m low side, 20 m court, 20.9 × 10.9 m structure, net height) plus a highlighted
  21 × 11 m foundation outline — the whole system, roller and sensors
  included, is self-contained within standard padel court foundations.
- **Click any part** to get a plain-language description: fabric membrane,
  roller tube, drive motor, lead bar, guide rail, steel columns, eave beams,
  arched ribs, weather hood, glass walls, mesh panels, turf, net, weather
  station, Wi-Fi control unit.
- **Configurator** (left panel):
  - Fabric tensioning: steel ribs (economical) vs. carbon fibre battens
    (lighter, faster). Both travel with the fabric, so an open court always
    has completely clear sky — no structure overhead.
  - Roof colour: white, sand, anthracite, forest, burgundy, navy
  - Court colour: tour blue, green, terracotta, graphite
- **Smart feature demos**:
  - Rain sensor: rain starts falling, sky turns overcast, and the cover
    closes itself
  - Wind gust: a 62 km/h gust spins the anemometer and retracts the cover
    to protect the membrane
  - App control: a phone mockup with live status (cover position, rain,
    wind) and open/stop/close buttons over Wi-Fi

## Where things live

- `src/court.js` — the padel court (turf, lines, glass, mesh, net)
- `src/cover.js` — the cover product (frame, roller, rails, fabric, motor) and
  its deploy animation; **this is the file to edit as the real product design
  firms up**
- `src/scene.js` — sky, sun, stars, ground, day/night/overcast blending
- `src/estate.js` — the mansion grounds scenery (pool, garage, cars, hedges)
- `src/dims.js` — the dimension overlay
- `src/main.js` — camera presets, part picking, UI wiring
