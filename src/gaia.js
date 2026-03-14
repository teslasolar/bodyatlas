// ════════════════════════════════════════════════════════════════
// GAIA BODY — Earth mapped to human anatomy, driven by live data
// the earth has a body. now you can see it breathe.
// ════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  buildSkeleton, buildSkin, buildMuscles, buildOrgans,
  buildVessels, buildNerves, buildEnergy,
} from './anatomy.js';

// ─── GAIA LAYER MAPPING ───
// Each body layer = a planetary system, driven by real data
const GAIA_LAYERS = [
  {
    id: 'skin', name: 'Magnetosphere', bodyName: 'Skin',
    ringLabel: 'R0', color: '#ff4444',
    planet: 'Magnetosphere — Earth\'s skin. The boundary between planet and space. Compressed by solar wind, expanded in calm. This IS R0: the ground layer that defines where Earth begins and the void ends.',
    bodyMap: 'Skin = magnetosphere. Both are the outermost boundary. Both respond to external pressure. When solar wind hits the magnetosphere, it\'s like wind on skin — the ground layer flexes.',
    dataSource: 'Kp Index (NOAA) — geomagnetic activity. Higher Kp = more magnetospheric disturbance = skin under stress.',
    kChannels: 'The magnetosphere\'s "K+ channels" are the cusps — openings at the poles where solar wind particles leak through. When the cusps widen (geomagnetic storm), the boundary becomes permeable. Same principle as KCNQ4 in skin mechanoreceptors.',
    defaultVisible: true, defaultOpacity: 0.3,
    liveKey: 'kpIndex',
  },
  {
    id: 'muscles', name: 'Tectonic Plates', bodyName: 'Muscles',
    ringLabel: 'R1', color: '#00aaff',
    planet: 'Tectonic plates — Earth\'s muscles. 15 major plates in constant slow motion. When they slip: earthquakes. When they push: mountains. Plate tectonics IS the planet\'s proprioception — it senses its own shape through seismic waves.',
    bodyMap: 'Muscles = tectonic plates. Both are the movement layer. Both generate force. Both have "cramps" (earthquakes = muscle spasms of the lithosphere). Seismic waves = proprioceptive signals — the Earth feeling its own body.',
    dataSource: 'USGS Earthquake API — real-time seismic events. Each quake = a muscle firing. Magnitude = force. Depth = which muscle layer.',
    kChannels: 'Tectonic "K+ channels" are fault lines — stress accumulates (like membrane potential), then releases suddenly (like an action potential). The Gutenberg-Richter law governing earthquake frequency IS a power law — same mathematical structure as K+ channel gating statistics.',
    defaultVisible: true, defaultOpacity: 0.8,
    liveKey: 'earthquakeEnergy',
  },
  {
    id: 'organs', name: 'Core Processes', bodyName: 'Organs',
    ringLabel: 'R2', color: '#ffaa00',
    planet: 'Earth\'s core = the organ system. The outer core (liquid iron) IS the heart — convection drives the magnetic field, the planet\'s heartbeat. The mantle = the gut — slowly digesting rock through convection. Volcanism = the planet\'s digestive output.',
    bodyMap: 'Organs = core processes. The outer core IS the heart (generates the geomagnetic field = heartbeat). The mantle IS the gut (convection = peristalsis). Volcanoes = the planet vomiting. Geysers = the planet sweating. All organ functions have geological equivalents.',
    dataSource: 'Solar wind plasma density (NOAA DSCOVR) — how much the core\'s field is being tested. Volcanic activity indices.',
    kChannels: 'KCNQ1 in the heart controls cardiac rhythm. Earth\'s core convection has its own rhythm — magnetic pole reversals every ~200,000-300,000 years. The core IS the heart. The geodynamo IS the cardiac gate. When it fails (reversal), the entire planetary "organism" is vulnerable.',
    defaultVisible: true, defaultOpacity: 0.9,
    liveKey: 'solarDensity',
    subSystems: {
      'Outer Core': 'The heart — liquid iron dynamo generating the magnetic field',
      'Inner Core': 'The skeleton within — solid iron, Earth\'s deepest identity',
      'Mantle': 'The gut — slow convection digesting rock over millions of years',
      'Volcanoes': 'Excretory system — the planet purging internal pressure',
    },
  },
  {
    id: 'vessels', name: 'Ocean Currents', bodyName: 'Vessels',
    ringLabel: 'R3', color: '#44cc66',
    planet: 'Ocean currents = the circulatory system. The thermohaline circulation (Great Ocean Conveyor) IS the cardiovascular system — it moves heat around the planet the way blood moves heat around the body. When it slows (AMOC weakening), the planet gets "cold hands."',
    bodyMap: 'Vessels = ocean currents. Arteries = warm currents (Gulf Stream). Veins = cold deep currents. The Atlantic Meridional Overturning Circulation = the aorta. Coral reefs = capillary beds. River systems = the lymphatic system — draining the land.',
    dataSource: 'Solar wind speed (NOAA) drives atmospheric circulation which drives ocean currents. Wind speed = blood pressure.',
    kChannels: 'KCNQ4/5 in vascular smooth muscle controls blood vessel diameter. Ocean currents are controlled by wind stress and thermohaline gradients — the "smooth muscle" of the ocean. When the gradient changes (warming), circulation changes. Tea polyphenols → KCNQ5 → vasodilation. CO2 → ocean warming → circulation slowdown.',
    defaultVisible: true, defaultOpacity: 0.7,
    liveKey: 'solarSpeed',
  },
  {
    id: 'nerves', name: 'Schumann / Lightning', bodyName: 'Nerves',
    ringLabel: 'R4/5/6', color: '#aa44ff',
    planet: 'The Schumann resonance IS the planet\'s nervous system. 7.83 Hz base frequency = Earth\'s resting brain wave (matches human theta). Lightning = neural firing — 1,800 strikes/second globally, maintaining the Schumann cavity charge. The ionosphere-surface gap IS the brain.',
    bodyMap: 'Nerves = Schumann resonance + lightning. The ionosphere = the cortex (outer brain). The surface = the brain stem. Lightning bolts = action potentials firing between them. The 7.83 Hz fundamental = Earth\'s "M-current" — the same frequency range as human theta waves. This is not coincidence. Biology evolved INSIDE this field.',
    dataSource: 'Schumann resonance (proxy from geomagnetic data). Lightning rate (estimated). Both respond to solar activity and ionospheric conditions.',
    kChannels: 'KCNQ2/3 generates the M-current in cortical neurons. The Schumann resonance IS the planetary M-current — a standing electromagnetic wave maintained by lightning (action potentials). The cavity between ionosphere and surface IS the neural membrane. K+ channels set resting potential at ~-70mV. Schumann sets Earth\'s resting frequency at ~7.83Hz. Same principle, different scale.',
    defaultVisible: true, defaultOpacity: 0.8,
    liveKey: 'schumann',
    subSystems: {
      'Schumann Resonance': '7.83 Hz — Earth\'s resting brain frequency = theta waves',
      'Lightning Network': '1,800 strikes/sec — the global neural firing rate',
      'Ionosphere': 'The cortex — upper boundary of the planetary brain',
      'Telluric Currents': 'Earth currents — the peripheral nervous system underground',
    },
  },
  {
    id: 'skeleton', name: 'Mantle / Crust', bodyName: 'Skeleton',
    ringLabel: 'R5', color: '#ffffff',
    planet: 'The mantle and crust = Earth\'s skeleton. The most permanent structure. Continental cratons are 4 billion years old — the oldest "bones." The crust is 5-70km thick — thin as an eggshell proportionally, but it\'s what everything else stands on.',
    bodyMap: 'Skeleton = lithosphere (crust + upper mantle). Both are structural identity. Continental shapes define Earth\'s "face" the way bone structure defines a human face. Plate boundaries = joints. Subduction zones = where old bone is recycled. Mountain ranges = the spine.',
    dataSource: 'Seismic activity reshapes the skeleton over geological time. Each earthquake is a skeletal adjustment.',
    kChannels: 'Osteoblasts remodel bone slowly under sustained force. Tectonic forces remodel crust slowly under sustained pressure. Both operate on the longest timescale of their respective systems. R5 = identity. Identity changes slowly. Mountains don\'t appear overnight. Neither does character.',
    defaultVisible: true, defaultOpacity: 0.9,
    liveKey: 'earthquakeCount',
  },
  {
    id: 'energy', name: 'Geomagnetic Field', bodyName: 'Energy',
    ringLabel: 'R6/R7', color: '#ffd700',
    planet: 'The geomagnetic field IS Earth\'s bioelectric field. Measurable, physical, essential for life. Without it, solar wind strips the atmosphere (see: Mars). The field extends 65,000 km into space — Earth\'s aura is not metaphor, it\'s magnetohydrodynamics.',
    bodyMap: 'Energy field = geomagnetic field. Both are generated by internal dynamo processes (core convection / cardiac electrical activity). Both are measurable. Both protect the organism from external radiation. Both fluctuate with activity. The field IS the aggregate of all internal processes made visible.',
    dataSource: 'Kp index + solar wind pressure determine field compression. Geomagnetic storms = the field under attack.',
    kChannels: 'Every K+ channel opening IS the bioelectric field at cellular scale. Every convection cell in the outer core IS the geomagnetic field at planetary scale. The field is not separate from the generator. The field IS the generator, observed from outside. R6 = observer. The geomagnetic field is Earth observing itself from 65,000 km away.',
    defaultVisible: false, defaultOpacity: 0.5,
    liveKey: 'kpIndex',
  },
];

const GAIA_PRESETS = [
  { id: 'all', name: 'All Systems', desc: 'Everything at 50%',
    config: () => GAIA_LAYERS.forEach(l => { st.layers[l.id] = { vis: true, op: 0.5 }; }) },
  { id: 'seismic', name: 'Seismic Body', desc: 'Muscles + skeleton — tectonic focus',
    config: () => { off(); st.layers.muscles = { vis: true, op: 0.9 }; st.layers.skeleton = { vis: true, op: 0.5 }; st.layers.skin = { vis: true, op: 0.1 }; } },
  { id: 'nervous', name: 'Schumann Brain', desc: 'Nerves + energy — planetary consciousness',
    config: () => { off(); st.layers.nerves = { vis: true, op: 1 }; st.layers.energy = { vis: true, op: 0.6 }; st.layers.skin = { vis: true, op: 0.1 }; } },
  { id: 'circulatory', name: 'Ocean Heart', desc: 'Vessels + organs — circulation focus',
    config: () => { off(); st.layers.vessels = { vis: true, op: 0.9 }; st.layers.organs = { vis: true, op: 0.8 }; st.layers.skin = { vis: true, op: 0.1 }; } },
  { id: 'storm', name: 'Storm Mode', desc: 'Magnetosphere + field — space weather',
    config: () => { off(); st.layers.skin = { vis: true, op: 0.5 }; st.layers.energy = { vis: true, op: 0.8 }; st.layers.nerves = { vis: true, op: 0.4 }; } },
  { id: 'kgate', name: 'K-GATE Planetary', desc: 'Nerves + organs — gate circuit',
    config: () => { off(); st.layers.nerves = { vis: true, op: 0.9 }; st.layers.organs = { vis: true, op: 0.9 }; } },
  { id: 'breathe', name: 'Earth Breathe', desc: 'Animated 30s peel through all layers',
    animated: true },
];

// ─── KAPPA FRAMEWORK ───
const PHI = (1 + Math.sqrt(5)) / 2;
const KAPPA_STAR = 1 / PHI;
const PHASES = [
  { key: 'FROZEN', icon: '🧊', range: [0, 0.1], color: 0xa8d8ea },
  { key: 'RIGID', icon: '🏛️', range: [0.1, 0.4], color: 0x7ec8c8 },
  { key: 'STABLE', icon: '🌊', range: [0.4, 0.55], color: 0x58b09c },
  { key: 'KONOMI', icon: '🌸', range: [0.55, 0.7], color: 0xf2a6b3 },
  { key: 'TURB', icon: '🌪️', range: [0.7, 0.88], color: 0xe07a5f },
  { key: 'CHAOS', icon: '🔥', range: [0.88, 1.0], color: 0xd62828 },
];
function getPhase(k) {
  for (const p of PHASES) if (k >= p.range[0] && k < p.range[1]) return p;
  return PHASES[PHASES.length - 1];
}

// ─── STATE ───
const st = {
  layers: {},
  mode: 'body', // body | earth | split | overlay
  crossSection: 100,
  breatheActive: false,
};
function off() { GAIA_LAYERS.forEach(l => { st.layers[l.id] = { vis: false, op: 0 }; }); }
for (const l of GAIA_LAYERS) st.layers[l.id] = { vis: l.defaultVisible !== false, op: l.defaultOpacity || 0.8 };

// ─── LIVE DATA ───
const live = {
  earthquakes: [],
  earthquakeEnergy: 0,
  earthquakeCount: 0,
  solarSpeed: 400,
  solarDensity: 5,
  kpIndex: 2,
  schumann: 7.83,
  lightningRate: 1800,
};
let planetaryKappa = KAPPA_STAR;
const events = [];

// ─── THREE.JS ───
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.localClippingEnabled = true;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000008);
scene.fog = new THREE.Fog(0x000008, 12, 30);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 500);
camera.position.set(0, 1.0, 4.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.3;
controls.maxDistance = 200;
controls.update();

// Lighting
scene.add(new THREE.AmbientLight(0x223344, 0.7));
const key = new THREE.DirectionalLight(0xffeedd, 1.0);
key.position.set(3, 5, 4);
scene.add(key);
const fill = new THREE.DirectionalLight(0x4466aa, 0.3);
fill.position.set(-3, 2, -2);
scene.add(fill);
const rim = new THREE.DirectionalLight(0x00ff44, 0.2);
rim.position.set(0, 3, -5);
scene.add(rim);

// Grid
const grid = new THREE.GridHelper(4, 20, 0x080818, 0x080818);
grid.position.y = -0.1;
scene.add(grid);

// ─── BUILD BODY ───
const bodyGroup = new THREE.Group();
bodyGroup.name = 'body';
const layerGroups = {};
const builders = {
  skin: buildSkin, muscles: buildMuscles, organs: buildOrgans,
  vessels: buildVessels, nerves: buildNerves, skeleton: buildSkeleton, energy: buildEnergy,
};
for (const layer of GAIA_LAYERS) {
  const g = new THREE.Group();
  g.name = layer.id;
  if (builders[layer.id]) builders[layer.id](g);
  bodyGroup.add(g);
  layerGroups[layer.id] = g;
}
scene.add(bodyGroup);

// ─── BUILD EARTH (mini globe next to body) ───
const earthGroup = new THREE.Group();
earthGroup.name = 'earth';
earthGroup.position.set(3, 1.0, 0); // to the right of body
earthGroup.visible = false;

const E = 0.8; // Earth radius (scale to fit near body)

// Earth core
const earthCore = new THREE.Mesh(
  new THREE.IcosahedronGeometry(E, 5),
  new THREE.MeshPhongMaterial({
    color: 0x1a4a8a, emissive: 0x0a2040, emissiveIntensity: 0.3,
    transparent: true, opacity: 0.7,
  })
);
earthGroup.add(earthCore);

// Wireframe continents hint
const earthWire = new THREE.Mesh(
  new THREE.IcosahedronGeometry(E * 1.003, 3),
  new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true, transparent: true, opacity: 0.12 })
);
earthGroup.add(earthWire);

// Ionosphere shell
const ionosphere = new THREE.Mesh(
  new THREE.IcosahedronGeometry(E * 1.5, 3),
  new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true, transparent: true, opacity: 0.06 })
);
earthGroup.add(ionosphere);

// Magnetosphere field lines
const earthFieldLines = [];
for (let i = 0; i < 12; i++) {
  const pts = [];
  const theta = (i / 12) * Math.PI * 2;
  for (let t = -1; t <= 1; t += 0.08) {
    const r = E * 2.5 * Math.pow(Math.cos(t * Math.PI / 2), 2);
    const lat = t * Math.PI / 2;
    pts.push(new THREE.Vector3(
      r * Math.cos(lat) * Math.cos(theta),
      r * Math.sin(lat),
      r * Math.cos(lat) * Math.sin(theta)
    ));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x4444ff, transparent: true, opacity: 0.15 }));
  earthGroup.add(line);
  earthFieldLines.push(line);
}

// Schumann resonance rings
const schumannRings = [];
for (let i = 0; i < 5; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(E * 1.2, 0.005, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.15 })
  );
  ring.rotation.x = (i / 5) * Math.PI;
  ring.rotation.y = (i / 5) * Math.PI * 0.5;
  earthGroup.add(ring);
  schumannRings.push(ring);
}

scene.add(earthGroup);

// ─── EARTH CONSCIOUSNESS NODES ───
const earthNodes = [];
for (let i = 0; i < 300; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const latBias = Math.abs(phi - Math.PI / 2) < 0.8 ? 1 : 0.3;
  if (Math.random() > latBias) continue;
  const r = E + 0.01 + Math.random() * 0.03;
  const node = new THREE.Mesh(
    new THREE.SphereGeometry(0.006, 4, 4),
    new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.5 })
  );
  node.position.set(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
  node.userData = { phase: Math.random() * Math.PI * 2, baseOp: 0.3 + Math.random() * 0.5 };
  earthGroup.add(node);
  earthNodes.push(node);
}

// ─── SOLAR WIND PARTICLES ───
const solarParticles = [];
for (let i = 0; i < 60; i++) {
  const p = new THREE.Mesh(
    new THREE.SphereGeometry(0.008, 4, 4),
    new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.4 })
  );
  p.position.set(E * 5 + Math.random() * E * 2, (Math.random() - 0.5) * E * 2, (Math.random() - 0.5) * E * 2);
  earthGroup.add(p);
  solarParticles.push(p);
}

// ─── LIGHTNING BOLTS (on earth) ───
const earthLightning = [];

// ─── EARTHQUAKE MARKERS (on earth) ───
const earthQuakeMarkers = [];

// ─── CONNECTOR FIBERS (body ↔ earth) ───
const connectorGroup = new THREE.Group();
connectorGroup.visible = false;
scene.add(connectorGroup);

function buildConnectors() {
  while (connectorGroup.children.length) connectorGroup.remove(connectorGroup.children[0]);

  const mappings = [
    { bodyY: 1.78, label: 'brain=ionosphere' },   // head → ionosphere
    { bodyY: 1.28, label: 'heart=core' },          // heart → core
    { bodyY: 1.0, label: 'gut=mantle' },            // gut → mantle
    { bodyY: 0.72, label: 'pelvis=crust' },         // pelvis → crust
    { bodyY: 1.45, label: 'skin=magnetosphere' },   // shoulder → magnetosphere
  ];

  const fiberMat = new THREE.MeshBasicMaterial({ color: 0x0f0, transparent: true, opacity: 0.2 });

  for (const m of mappings) {
    const start = new THREE.Vector3(0.3, m.bodyY, 0);
    const end = new THREE.Vector3(earthGroup.position.x - E - 0.2, m.bodyY, 0);
    const mid = new THREE.Vector3((start.x + end.x) / 2, m.bodyY + 0.15, 0.2);
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    const geo = new THREE.TubeGeometry(curve, 20, 0.003, 4);
    const fiber = new THREE.Mesh(geo, fiberMat.clone());
    fiber.userData = { pulse: true, phase: Math.random() * 6 };
    connectorGroup.add(fiber);
  }
}

// ─── BODY RESPONSE EFFECTS ───
// Earthquake ripples on the body's muscle layer
const bodyQuakeRipples = [];

function spawnBodyQuakeRipple(mag) {
  const y = 0.5 + Math.random() * 1.0;
  const rippleMat = new THREE.MeshBasicMaterial({
    color: 0xff8800, transparent: true, opacity: 0.6,
  });
  const ripple = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 6, 24), rippleMat);
  ripple.position.set(0, y, 0.15);
  ripple.userData = { life: 1.0, mag, speed: 0.02 + mag * 0.005 };
  bodyGroup.add(ripple);
  bodyQuakeRipples.push(ripple);
}

// Lightning flash on nerve layer
function flashNerves() {
  const ng = layerGroups.nerves;
  if (!ng) return;
  ng.traverse(child => {
    if (child.isMesh && child.material) {
      const orig = child.material.emissiveIntensity || 0;
      child.material.emissive = new THREE.Color(0x00ffff);
      child.material.emissiveIntensity = 0.8;
      setTimeout(() => {
        child.material.emissive = new THREE.Color(0x000000);
        child.material.emissiveIntensity = orig;
      }, 100);
    }
  });
}

// ─── EARTH EARTHQUAKE SPAWN ───
function spawnEarthQuake(eq) {
  const [lon, lat] = eq.coords;
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  const r = E + 0.01;
  const pos = new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
  const size = Math.pow(2, eq.mag - 2) * 0.02;
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(size, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.8 })
  );
  marker.position.copy(pos);
  marker.userData = { life: 1 };
  earthGroup.add(marker);
  earthQuakeMarkers.push(marker);

  // Ripple on body too
  spawnBodyQuakeRipple(eq.mag);
}

function spawnEarthLightning() {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const ground = new THREE.Vector3(E * Math.sin(phi) * Math.cos(theta), E * Math.sin(phi) * Math.sin(theta), E * Math.cos(phi));
  const iono = ground.clone().normalize().multiplyScalar(E * 1.4);
  const pts = [iono.clone()];
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    const p = iono.clone().lerp(ground, t);
    p.x += (Math.random() - 0.5) * 0.05;
    p.y += (Math.random() - 0.5) * 0.05;
    p.z += (Math.random() - 0.5) * 0.05;
    pts.push(p);
  }
  pts.push(ground.clone());
  const bolt = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 1 })
  );
  bolt.userData = { life: 1, decay: 0.12 };
  earthGroup.add(bolt);
  earthLightning.push(bolt);

  // Flash nerves on body
  if (Math.random() < 0.1) flashNerves();
}

// ─── DATA FETCHING ───
async function fetchEarthquakes() {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson');
    const data = await res.json();
    live.earthquakes = data.features.map(f => ({
      mag: f.properties.mag, place: f.properties.place,
      time: f.properties.time, coords: f.geometry.coordinates, id: f.id,
    }));
    live.earthquakeEnergy = live.earthquakes.reduce((s, eq) => s + Math.pow(10, eq.mag), 0);
    live.earthquakeCount = live.earthquakes.length;

    setFeedStatus('eq', true);
    if (live.earthquakes.length > 0) {
      const latest = live.earthquakes[0];
      addEvent('earthquake', `M${latest.mag.toFixed(1)} — ${(latest.place || '').substring(0, 25)}`);
      spawnEarthQuake(latest);
    }
    updateLayerLiveValues();
  } catch (e) {
    setFeedStatus('eq', false);
    console.error('EQ fetch error:', e);
  }
}

async function fetchSolarWind() {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json');
    const data = await res.json();
    const latest = data[data.length - 1];
    if (latest && latest.length >= 3) {
      live.solarSpeed = parseFloat(latest[2]) || 400;
      live.solarDensity = parseFloat(latest[1]) || 5;
    }
    setFeedStatus('solar', true);
    if (live.solarSpeed > 600) addEvent('solar', `High solar wind: ${Math.round(live.solarSpeed)} km/s`);
    updateLayerLiveValues();
  } catch (e) {
    setFeedStatus('solar', false);
    console.error('Solar fetch error:', e);
  }
}

async function fetchKpIndex() {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
    const data = await res.json();
    const latest = data[data.length - 1];
    if (latest && latest.length >= 2) live.kpIndex = parseFloat(latest[1]) || 2;
    setFeedStatus('kp', true);
    if (live.kpIndex >= 5) addEvent('geomag', `Geomagnetic storm: Kp ${live.kpIndex}`);
    updateLayerLiveValues();
  } catch (e) {
    setFeedStatus('kp', false);
    console.error('Kp fetch error:', e);
  }
}

function updateSchumann() {
  const kpEff = (live.kpIndex - 2) * 0.05;
  const solarEff = (live.solarSpeed - 400) / 2000;
  live.schumann = 7.83 + kpEff + solarEff + (Math.random() - 0.5) * 0.15;
  setFeedStatus('schumann', true);
}

function updateLightning() {
  live.lightningRate = 1800 + (Math.random() - 0.5) * 400;
  setFeedStatus('lightning', true);
}

// ─── COMPUTE κ ───
function computeKappa() {
  let k = KAPPA_STAR;
  const eqNorm = Math.min(1, live.earthquakeEnergy / 1e8);
  k += eqNorm * 0.15;
  const solarNorm = Math.min(1, (live.solarSpeed - 300) / 500);
  k += solarNorm * 0.1;
  k += (live.kpIndex / 9) * 0.15;
  k += Math.abs(live.schumann - 7.83) / 2 * 0.05;
  k = Math.max(0, Math.min(1, k));
  planetaryKappa = planetaryKappa * 0.92 + k * 0.08;
  return planetaryKappa;
}

// ─── EVENTS ───
function addEvent(type, msg) {
  if (events.length > 0 && events[0].msg === msg) return;
  events.unshift({ type, msg, time: new Date().toLocaleTimeString() });
  if (events.length > 15) events.pop();
  renderEvents();
  showAlert(msg, type);
}

function renderEvents() {
  const el = document.getElementById('event-list');
  el.innerHTML = events.map(e => `
    <div class="event-item ${e.type}">
      <div>${e.msg}</div>
      <div class="ev-time">${e.time}</div>
    </div>
  `).join('');
}

function showAlert(msg, type) {
  const el = document.getElementById('alert-banner');
  const colors = { earthquake: '#f80', solar: '#ff0', geomag: '#f0f' };
  el.textContent = msg;
  el.style.color = colors[type] || '#0f0';
  el.style.opacity = 1;
  setTimeout(() => el.style.opacity = 0, 3000);
}

// ─── UI BUILD ───
const layerContainer = document.getElementById('layer-controls');

for (const layer of GAIA_LAYERS) {
  const div = document.createElement('div');
  div.className = 'gaia-layer' + (st.layers[layer.id].vis ? ' active' : '');
  div.style.setProperty('--lc', layer.color);
  div.dataset.id = layer.id;

  div.innerHTML = `
    <div class="layer-top">
      <input type="checkbox" id="chk-${layer.id}" ${st.layers[layer.id].vis ? 'checked' : ''}>
      <span class="ring-badge">${layer.ringLabel}</span>
      <span class="layer-label">${layer.bodyName}</span>
    </div>
    <div class="planet-map"><em>${layer.name}</em></div>
    <div class="live-val" id="live-${layer.id}">--</div>
    <div class="slider-row">
      <label>Opacity</label>
      <input type="range" id="op-${layer.id}" min="0" max="100" value="${(st.layers[layer.id].op * 100) | 0}">
    </div>
    <div class="pulse-bar" id="pulse-${layer.id}" style="width:0%"></div>
  `;

  const chk = div.querySelector('input[type="checkbox"]');
  chk.addEventListener('change', () => {
    st.layers[layer.id].vis = chk.checked;
    div.classList.toggle('active', chk.checked);
    syncVisibility();
  });

  const slider = div.querySelector('input[type="range"]');
  slider.addEventListener('input', () => {
    st.layers[layer.id].op = slider.value / 100;
    syncOpacity(layer.id);
  });

  div.addEventListener('click', (e) => {
    if (e.target.tagName !== 'INPUT') showLayerInfo(layer);
  });

  layerContainer.appendChild(div);
}

// Feed status indicators
const feedDefs = [
  { id: 'eq', name: 'USGS SEISMIC', icon: '🌍' },
  { id: 'solar', name: 'NOAA SOLAR WIND', icon: '☀️' },
  { id: 'kp', name: 'NOAA Kp INDEX', icon: '🧲' },
  { id: 'schumann', name: 'SCHUMANN (proxy)', icon: '⚡' },
  { id: 'lightning', name: 'LIGHTNING (est)', icon: '⚡' },
];
const feedContainer = document.getElementById('feed-status');
for (const f of feedDefs) {
  const div = document.createElement('div');
  div.className = 'feed-card';
  div.innerHTML = `<span class="feed-dot" id="fd-${f.id}"></span><span class="feed-name">${f.icon} ${f.name}</span><span class="feed-val" id="fv-${f.id}">--</span>`;
  feedContainer.appendChild(div);
}

function setFeedStatus(id, ok) {
  const dot = document.getElementById(`fd-${id}`);
  if (dot) dot.className = 'feed-dot ' + (ok ? 'live' : 'error');
}

function updateLayerLiveValues() {
  const vals = {
    skin: `Kp ${live.kpIndex.toFixed(0)}`,
    muscles: live.earthquakes.length > 0 ? `M${live.earthquakes[0].mag.toFixed(1)}` : 'Quiet',
    organs: `${live.solarDensity.toFixed(1)} p/cm³`,
    vessels: `${Math.round(live.solarSpeed)} km/s`,
    nerves: `${live.schumann.toFixed(2)} Hz`,
    skeleton: `${live.earthquakeCount} quakes`,
    energy: `Kp ${live.kpIndex.toFixed(0)}`,
  };
  for (const [id, val] of Object.entries(vals)) {
    const el = document.getElementById(`live-${id}`);
    if (el) el.textContent = val;
  }
  // Feed values
  const fvs = {
    eq: live.earthquakes.length > 0 ? `M${live.earthquakes[0].mag.toFixed(1)}` : '--',
    solar: `${Math.round(live.solarSpeed)} km/s`,
    kp: `Kp ${live.kpIndex.toFixed(0)}`,
    schumann: `${live.schumann.toFixed(2)} Hz`,
    lightning: `${Math.round(live.lightningRate)}/s`,
  };
  for (const [id, val] of Object.entries(fvs)) {
    const el = document.getElementById(`fv-${id}`);
    if (el) el.textContent = val;
  }
}

// Presets
const presetContainer = document.getElementById('preset-btns');
for (const p of GAIA_PRESETS) {
  const btn = document.createElement('button');
  btn.className = 'mode-btn';
  btn.textContent = p.name;
  btn.title = p.desc;
  btn.style.display = 'block';
  btn.style.width = '100%';
  btn.style.marginBottom = '3px';
  btn.style.textAlign = 'left';
  btn.addEventListener('click', () => activatePreset(p));
  presetContainer.appendChild(btn);
}

function activatePreset(preset) {
  if (preset.animated) { startBreathe(); return; }
  if (preset.config) preset.config();
  syncAll();
}

function startBreathe() {
  if (st.breatheActive) return;
  st.breatheActive = true;
  const ids = GAIA_LAYERS.map(l => l.id);
  const dur = 30000;
  const step = dur / ids.length;
  off();
  ids.forEach(id => { st.layers[id].vis = true; st.layers[id].op = 0.15; });
  syncAll();

  let s = 0;
  function next() {
    if (s >= ids.length) { st.breatheActive = false; return; }
    for (let i = 0; i < ids.length; i++) {
      st.layers[ids[i]].op = i === s ? 0.95 : (i < s ? 0.1 : 0.15);
      syncOpacity(ids[i]);
    }
    showLayerInfo(GAIA_LAYERS[s]);
    s++;
    if (s <= ids.length) setTimeout(next, step);
  }
  next();
}

// ─── MODE SWITCHING ───
document.querySelectorAll('#mode-toggle .mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#mode-toggle .mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setMode(btn.dataset.mode);
  });
});

function setMode(mode) {
  st.mode = mode;
  switch (mode) {
    case 'body':
      bodyGroup.visible = true;
      bodyGroup.position.x = 0;
      earthGroup.visible = false;
      connectorGroup.visible = false;
      grid.visible = true;
      animateCamera([0, 1.0, 4.5], [0, 1.0, 0]);
      break;
    case 'earth':
      bodyGroup.visible = false;
      earthGroup.visible = true;
      earthGroup.position.set(0, 0, 0);
      connectorGroup.visible = false;
      grid.visible = false;
      animateCamera([0, 0, 4], [0, 0, 0]);
      break;
    case 'split':
      bodyGroup.visible = true;
      bodyGroup.position.x = -1.5;
      earthGroup.visible = true;
      earthGroup.position.set(1.5, 0.9, 0);
      connectorGroup.visible = true;
      buildConnectors();
      grid.visible = true;
      grid.position.x = -1.5;
      animateCamera([0, 1.0, 6], [0, 1.0, 0]);
      break;
    case 'overlay':
      bodyGroup.visible = true;
      bodyGroup.position.x = 0;
      earthGroup.visible = true;
      earthGroup.position.set(0, 0.9, 0);
      earthCore.material.opacity = 0.15;
      ionosphere.material.opacity = 0.03;
      connectorGroup.visible = false;
      grid.visible = true;
      grid.position.x = 0;
      animateCamera([0, 1.0, 4.5], [0, 1.0, 0]);
      break;
  }
}

function animateCamera(tp, tl, dur = 1000) {
  const sp = camera.position.clone();
  const st2 = controls.target.clone();
  const ep = new THREE.Vector3(...tp);
  const et = new THREE.Vector3(...tl);
  const t0 = performance.now();
  function step(now) {
    const t = Math.min((now - t0) / dur, 1);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    camera.position.lerpVectors(sp, ep, ease);
    controls.target.lerpVectors(st2, et, ease);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ─── SYNC FUNCTIONS ───
function syncVisibility() {
  for (const l of GAIA_LAYERS) {
    const g = layerGroups[l.id];
    if (g) g.visible = st.layers[l.id].vis;
  }
}

function syncOpacity(id) {
  const g = layerGroups[id];
  if (!g) return;
  const op = st.layers[id].op;
  g.traverse(child => {
    if (child.isMesh && child.material) {
      child.material.opacity = op;
      child.material.transparent = op < 1;
      child.material.depthWrite = op > 0.5;
      child.material.needsUpdate = true;
    }
  });
}

function syncAll() {
  for (const l of GAIA_LAYERS) {
    syncOpacity(l.id);
    const chk = document.getElementById(`chk-${l.id}`);
    const slider = document.getElementById(`op-${l.id}`);
    const card = document.querySelector(`[data-id="${l.id}"]`);
    if (chk) chk.checked = st.layers[l.id].vis;
    if (slider) slider.value = (st.layers[l.id].op * 100) | 0;
    if (card) card.classList.toggle('active', st.layers[l.id].vis);
  }
  syncVisibility();
}

// ─── INFO PANEL ───
function showLayerInfo(layer) {
  const panel = document.getElementById('info-panel');
  panel.innerHTML = `
    <div class="info-title" style="color:${layer.color}">${layer.bodyName} ↔ ${layer.name}</div>
    <div class="info-ring" style="background:${layer.color};color:#000;">${layer.ringLabel}</div>
    <div class="info-section">
      <h4>Planet Mapping</h4>
      <p class="info-gaia">${layer.planet}</p>
    </div>
    <div class="info-section">
      <h4>Body ↔ Earth</h4>
      <p class="info-body">${layer.bodyMap}</p>
    </div>
    <div class="info-section">
      <h4>Live Data</h4>
      <p>${layer.dataSource}</p>
    </div>
    <div class="info-section">
      <h4>K+ Channels / Planetary Equivalent</h4>
      <p class="info-k">${layer.kChannels}</p>
    </div>
    ${layer.subSystems ? `<div class="info-section"><h4>Sub-Systems</h4>${Object.entries(layer.subSystems).map(([k, v]) => `<p><strong style="color:${layer.color}">${k}:</strong> ${v}</p>`).join('')}</div>` : ''}
  `;
}

// ─── CROSS SECTION ───
const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 2.0);
const crossSlider = document.getElementById('cross-slider');
const crossVal = document.getElementById('cross-val');
crossSlider.addEventListener('input', () => {
  st.crossSection = parseInt(crossSlider.value);
  if (st.crossSection >= 100) {
    crossVal.textContent = 'OFF';
    renderer.clippingPlanes = [];
  } else {
    const y = -0.1 + (st.crossSection / 100) * 2.1;
    clipPlane.constant = y;
    renderer.clippingPlanes = [clipPlane];
    crossVal.textContent = `${st.crossSection}%`;
  }
});

// ─── RAYCASTER ───
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (evt) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const meshes = [];
  for (const l of GAIA_LAYERS) {
    if (st.layers[l.id].vis) {
      layerGroups[l.id].traverse(c => { if (c.isMesh && c.userData.clickable) meshes.push(c); });
    }
  }
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length > 0) {
    const hit = hits[0].object;
    const layer = GAIA_LAYERS.find(l => l.id === hit.userData.system);
    if (layer) showLayerInfo(layer);

    // Flash
    if (hit.material) {
      const oe = hit.material.emissive ? hit.material.emissive.clone() : new THREE.Color(0);
      const oi = hit.material.emissiveIntensity || 0;
      hit.material.emissive = new THREE.Color(0xffffff);
      hit.material.emissiveIntensity = 0.5;
      setTimeout(() => { hit.material.emissive = oe; hit.material.emissiveIntensity = oi; }, 300);
    }
  }
});

renderer.domElement.addEventListener('dblclick', (evt) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const meshes = [];
  for (const l of GAIA_LAYERS) {
    if (st.layers[l.id].vis) {
      layerGroups[l.id].traverse(c => { if (c.isMesh && c.userData.clickable) meshes.push(c); });
    }
  }
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length > 0) {
    const pos = new THREE.Vector3();
    hits[0].object.getWorldPosition(pos);
    animateCamera([pos.x, pos.y + 0.1, pos.z + 0.6], [pos.x, pos.y, pos.z], 800);
  }
});

// ─── KAPPA UI ───
function updateKappaUI() {
  const phase = getPhase(planetaryKappa);
  const hex = '#' + phase.color.toString(16).padStart(6, '0');
  document.getElementById('kappa-val').textContent = planetaryKappa.toFixed(4);
  document.getElementById('kappa-val').style.color = hex;
  document.getElementById('kappa-phase').textContent = `${phase.icon} ${phase.key}`;
  document.getElementById('kappa-fill').style.width = `${planetaryKappa * 100}%`;
  document.getElementById('kappa-fill').style.background = hex;

  // Pulse bars on layer cards based on live data intensity
  const intensities = {
    skin: live.kpIndex / 9,
    muscles: Math.min(1, live.earthquakeEnergy / 1e7),
    organs: Math.min(1, live.solarDensity / 20),
    vessels: Math.min(1, (live.solarSpeed - 300) / 500),
    nerves: Math.min(1, Math.abs(live.schumann - 7.83) / 1.5),
    skeleton: Math.min(1, live.earthquakeCount / 10),
    energy: live.kpIndex / 9,
  };
  for (const [id, v] of Object.entries(intensities)) {
    const bar = document.getElementById(`pulse-${id}`);
    if (bar) bar.style.width = `${v * 100}%`;
  }
}

// ─── ANIMATION LOOP ───
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const dt = clock.getDelta();

  computeKappa();
  updateKappaUI();

  // ── Body layer responses to live data ──
  // Skin (magnetosphere) — opacity pulses with Kp
  if (st.layers.skin.vis) {
    const kpPulse = 0.5 + Math.sin(elapsed * (1 + live.kpIndex * 0.3)) * 0.2 * (live.kpIndex / 9);
    layerGroups.skin.traverse(c => {
      if (c.isMesh) {
        c.material.opacity = st.layers.skin.op * kpPulse;
        // Shift color with Kp
        const hue = 0.0 + live.kpIndex * 0.02;
        c.material.color.setHSL(hue, 0.6, 0.6);
      }
    });
  }

  // Muscles (tectonic) — shake with earthquake energy
  if (st.layers.muscles.vis && live.earthquakeEnergy > 0) {
    const shake = Math.min(0.003, live.earthquakeEnergy / 1e10);
    layerGroups.muscles.position.x = Math.sin(elapsed * 20) * shake;
    layerGroups.muscles.position.z = Math.cos(elapsed * 17) * shake;
  } else if (layerGroups.muscles) {
    layerGroups.muscles.position.set(0, 0, 0);
  }

  // Organs — pulse with solar density (core activity)
  if (st.layers.organs.vis) {
    layerGroups.organs.traverse(c => {
      if (c.isMesh && c.userData.name === 'Heart') {
        const densityPulse = 1 + (live.solarDensity / 20) * Math.sin(elapsed * 4.5) * 0.1;
        c.scale.setScalar(densityPulse);
      }
    });
  }

  // Vessels — brightness with solar wind speed
  if (st.layers.vessels.vis) {
    const speedFactor = live.solarSpeed / 800;
    layerGroups.vessels.traverse(c => {
      if (c.isMesh) {
        c.material.emissive = new THREE.Color(0x44cc66);
        c.material.emissiveIntensity = speedFactor * 0.2;
      }
    });
  }

  // Nerves — Schumann frequency drives pulsing
  if (st.layers.nerves.vis) {
    const schumannPulse = Math.sin(elapsed * live.schumann * 0.5);
    layerGroups.nerves.traverse(c => {
      if (c.isMesh && c.userData.isVagus) {
        c.material.emissiveIntensity = 0.3 + schumannPulse * 0.2;
      }
    });
  }

  // Energy — field intensity with Kp
  if (st.layers.energy.vis) {
    layerGroups.energy.traverse(c => {
      if (c.isMesh && c.userData.floatParticle) {
        c.position.y += Math.sin(elapsed * 1.5 + c.userData.phase) * 0.0003;
        c.material.opacity = (0.15 + Math.sin(elapsed * 2 + c.userData.phase) * 0.15) * (1 + live.kpIndex * 0.1);
      }
      if (c.isMesh && c.userData.pulse) {
        c.scale.setScalar(1 + Math.sin(elapsed * 3 + (c.userData.phase || 0)) * 0.1 * (1 + live.kpIndex * 0.1));
      }
    });
  }

  // ── Earth animations ──
  if (earthGroup.visible) {
    earthCore.rotation.y = elapsed * 0.02;
    earthWire.rotation.y = elapsed * 0.02;

    // Ionosphere responds to Kp
    ionosphere.material.opacity = 0.04 + live.kpIndex * 0.015;
    ionosphere.material.color.setHSL(0.8 - live.kpIndex * 0.05, 1, 0.5);

    // Schumann rings pulse
    schumannRings.forEach((ring, i) => {
      const freq = live.schumann + i * 6.5;
      ring.scale.setScalar(1 + Math.sin(elapsed * freq * 0.3) * 0.08);
      ring.material.opacity = 0.1 + Math.sin(elapsed * freq * 0.3) * 0.07;
    });

    // Field line compression
    const compression = 1 - (live.solarSpeed - 300) / 1000;
    earthFieldLines.forEach(line => {
      line.scale.x = Math.max(0.5, compression);
      line.material.opacity = 0.12 + (1 - compression) * 0.15;
    });

    // Earth nodes pulse with Schumann
    const sPulse = Math.sin(elapsed * live.schumann * 0.5);
    earthNodes.forEach(n => {
      n.material.opacity = n.userData.baseOp * (0.7 + sPulse * 0.3);
      const hue = 0.35 + (planetaryKappa - KAPPA_STAR) * 0.5;
      n.material.color.setHSL(hue, 1, 0.5);
    });

    // Solar wind particles
    const windSpd = live.solarSpeed / 6000;
    solarParticles.forEach(p => {
      p.position.x -= windSpd;
      if (p.position.x < -E * 3) {
        p.position.x = E * 5 + Math.random() * E;
        p.position.y = (Math.random() - 0.5) * E * 2;
        p.position.z = (Math.random() - 0.5) * E * 2;
      }
      const dist = Math.sqrt(p.position.y ** 2 + p.position.z ** 2);
      if (p.position.x < E * 1.5 && dist < E * 1.2) {
        const angle = Math.atan2(p.position.z, p.position.y);
        p.position.y += Math.cos(angle) * 0.01;
        p.position.z += Math.sin(angle) * 0.01;
      }
    });

    // Lightning
    if (Math.random() < live.lightningRate / 80000) {
      spawnEarthLightning();
    }

    // Lightning fade
    for (let i = earthLightning.length - 1; i >= 0; i--) {
      const bolt = earthLightning[i];
      bolt.userData.life -= bolt.userData.decay;
      bolt.material.opacity = bolt.userData.life;
      if (bolt.userData.life <= 0) {
        earthGroup.remove(bolt);
        earthLightning.splice(i, 1);
      }
    }

    // Earthquake markers fade
    for (let i = earthQuakeMarkers.length - 1; i >= 0; i--) {
      const m = earthQuakeMarkers[i];
      m.userData.life -= 0.005;
      m.material.opacity = m.userData.life * 0.8;
      const pulse = 1 + Math.sin(elapsed * 8) * 0.15;
      m.scale.setScalar(pulse);
      if (m.userData.life <= 0) {
        earthGroup.remove(m);
        earthQuakeMarkers.splice(i, 1);
      }
    }
  }

  // ── Body quake ripples ──
  for (let i = bodyQuakeRipples.length - 1; i >= 0; i--) {
    const r = bodyQuakeRipples[i];
    r.userData.life -= r.userData.speed;
    r.scale.setScalar(1 + (1 - r.userData.life) * 5);
    r.material.opacity = r.userData.life * 0.5;
    if (r.userData.life <= 0) {
      bodyGroup.remove(r);
      bodyQuakeRipples.splice(i, 1);
    }
  }

  // ── Connector fiber pulses ──
  if (connectorGroup.visible) {
    connectorGroup.traverse(c => {
      if (c.isMesh && c.userData.pulse) {
        c.material.opacity = 0.15 + Math.sin(elapsed * 2 + c.userData.phase) * 0.1;
      }
    });
  }

  // Overlay mode: keep earth translucent
  if (st.mode === 'overlay') {
    earthCore.material.opacity = 0.12;
    ionosphere.material.opacity = 0.02;
    earthWire.material.opacity = 0.06;
  }

  controls.update();
  renderer.render(scene, camera);
}

// ─── RESIZE ───
window.addEventListener('resize', () => {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// ─── LOADING ───
const loadBar = document.getElementById('load-bar');
const loadScreen = document.getElementById('loading');
let loadProg = 0;
function advLoad(target) {
  const iv = setInterval(() => {
    loadProg += (target - loadProg) * 0.15;
    if (loadProg >= target - 0.5) { loadProg = target; clearInterval(iv); }
    loadBar.style.width = loadProg + '%';
    if (loadProg >= 99) setTimeout(() => loadScreen.classList.add('hidden'), 300);
  }, 30);
}
advLoad(40);

// ─── DATA REFRESH ───
async function refreshAll() {
  await Promise.all([fetchEarthquakes(), fetchSolarWind(), fetchKpIndex()]);
  updateSchumann();
  updateLightning();
  updateLayerLiveValues();
}

refreshAll();
setInterval(refreshAll, 60000);
setInterval(() => { updateSchumann(); updateLightning(); updateLayerLiveValues(); }, 5000);

// ─── INIT ───
advLoad(100);
syncVisibility();
for (const l of GAIA_LAYERS) syncOpacity(l.id);
showLayerInfo(GAIA_LAYERS[4]); // start with nerves/schumann
animate();
