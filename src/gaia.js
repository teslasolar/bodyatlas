// ════════════════════════════════════════════════════════════════
// GAIA BODY — Earth mapped to human anatomy, driven by live data
// the earth has a body. now you can see it breathe.
// Specs: std/layers.md, std/feeds.md, std/voice.md, std/kappa.md
// ════════════════════════════════════════════════════════════════

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  buildSkeleton, buildSkin, buildMuscles, buildOrgans,
  buildVessels, buildNerves, buildEnergy,
} from './anatomy.js';
import {
  live, feedStatus, refreshAll, refreshFast,
  computeKappa, getKappa, getPhase, getSummary,
} from './feeds.js';
import {
  generateNarrative, firstWords, logUtterance,
  getUtteranceLog, moodColor,
} from './voice.js';

// ─── GAIA LAYER MAPPING (compressed from std/layers.md) ───
const GL = [
  { id:'skin', name:'Magnetosphere', body:'Skin', ring:'R0', color:'#ff4444',
    planet:'Magnetosphere \u2014 Earth\'s skin. Boundary between planet and space. Compressed by solar wind. This IS R0.',
    bodyMap:'Skin = magnetosphere. Both outermost boundary. Both respond to external pressure.',
    kCh:'KCNQ4 mechanoreceptors \u2192 cusps = magnetospheric K+ channels. When cusps widen (storm), boundary permeable.',
    vis:true, op:0.3 },
  { id:'muscles', name:'Tectonic Plates', body:'Muscles', ring:'R1', color:'#00aaff',
    planet:'15 major plates in constant motion. Slip = earthquakes. Push = mountains. Tectonics IS proprioception.',
    bodyMap:'Muscles = tectonics. Both movement layer. Cramps = quakes. Seismic waves = proprioceptive signals.',
    kCh:'KCNQ2/3 motor neurons \u2192 fault lines = tectonic K+ channels. Stress accumulates then releases (action potential).',
    vis:true, op:0.8 },
  { id:'organs', name:'Core Processes', body:'Organs', ring:'R2', color:'#ffaa00',
    planet:'Outer core = heart (convection \u2192 magnetic field). Mantle = gut (digesting rock). Volcanism = digestive output.',
    bodyMap:'Organs = core. Geodynamo = cardiac gate. Core rhythm = heartbeat. Reversal = cardiac failure.',
    kCh:'KCNQ1 cardiac rhythm \u2192 geodynamo rhythm. Both gate the system. Failure = Long QT | pole reversal.',
    vis:true, op:0.9,
    sub:{'Outer Core':'heart dynamo','Inner Core':'deepest identity','Mantle':'slow gut','Volcanoes':'excretory'} },
  { id:'vessels', name:'Ocean Currents', body:'Vessels', ring:'R3', color:'#44cc66',
    planet:'Thermohaline = cardiovascular. Moves heat like blood. AMOC weakening = cold hands.',
    bodyMap:'Arteries = warm currents (Gulf Stream). Veins = cold deep. AMOC = aorta. Rivers = lymphatic.',
    kCh:'KCNQ4/5 vascular smooth muscle \u2192 ocean gradient. Warming \u2192 circulation change.',
    vis:true, op:0.7 },
  { id:'nerves', name:'Schumann + Lightning', body:'Nerves', ring:'R4/5/6', color:'#aa44ff',
    planet:'Schumann 7.83 Hz = Earth\'s brain wave (= human theta). 1800 strikes/sec = neural firing. Ionosphere-surface = brain.',
    bodyMap:'Ionosphere = cortex. Surface = brainstem. Lightning = action potentials. 7.83 Hz = planetary M-current.',
    kCh:'KCNQ2/3 M-current \u2192 Schumann = planetary M-current. Same freq range. Biology evolved INSIDE this field.',
    vis:true, op:0.8,
    sub:{'Schumann':'resting frequency','Lightning':'global firing rate','Ionosphere':'cortex','Telluric':'peripheral nerves'} },
  { id:'skeleton', name:'Mantle / Crust', body:'Skeleton', ring:'R5', color:'#ffffff',
    planet:'Cratons 4 Gyr old = oldest bones. Crust 5-70 km. Everything stands on it.',
    bodyMap:'Lithosphere = skeleton. Continental shapes = face structure. Plate boundaries = joints. Mountains = spine.',
    kCh:'Osteoblast remodeling \u2192 tectonic remodeling. Both slowest timescale. Identity changes slowly.',
    vis:true, op:0.9 },
  { id:'energy', name:'Geomagnetic Field', body:'Energy', ring:'R6/R7', color:'#ffd700',
    planet:'Geomagnetic field extends 65,000 km. Without it, solar wind strips atmosphere (see: Mars).',
    bodyMap:'Bioelectric field = geomagnetic field. Both from internal dynamo. Both measurable. Both protective.',
    kCh:'Every K+ opening = bioelectric at cell scale. Every core convection cell = geomagnetic at planet scale.',
    vis:false, op:0.5 },
];

const PRESETS = [
  { id:'all', name:'All Systems', desc:'Everything at 50%',
    cfg:()=> GL.forEach(l=>{st.layers[l.id]={vis:true,op:0.5}}) },
  { id:'seismic', name:'Seismic Body', desc:'Tectonic focus',
    cfg:()=>{off();st.layers.muscles={vis:true,op:0.9};st.layers.skeleton={vis:true,op:0.5};st.layers.skin={vis:true,op:0.1}} },
  { id:'nervous', name:'Schumann Brain', desc:'Planetary consciousness',
    cfg:()=>{off();st.layers.nerves={vis:true,op:1};st.layers.energy={vis:true,op:0.6};st.layers.skin={vis:true,op:0.1}} },
  { id:'circulatory', name:'Ocean Heart', desc:'Circulation focus',
    cfg:()=>{off();st.layers.vessels={vis:true,op:0.9};st.layers.organs={vis:true,op:0.8};st.layers.skin={vis:true,op:0.1}} },
  { id:'storm', name:'Storm Mode', desc:'Space weather',
    cfg:()=>{off();st.layers.skin={vis:true,op:0.5};st.layers.energy={vis:true,op:0.8};st.layers.nerves={vis:true,op:0.4}} },
  { id:'kgate', name:'K-GATE Planetary', desc:'Gate circuit',
    cfg:()=>{off();st.layers.nerves={vis:true,op:0.9};st.layers.organs={vis:true,op:0.9}} },
  { id:'breathe', name:'Earth Breathe', desc:'Animated 30s peel', animated:true },
];

// ─── STATE ───
const st = { layers:{}, mode:'body', crossSection:100, breatheActive:false };
function off() { GL.forEach(l=>{st.layers[l.id]={vis:false,op:0}}); }
for (const l of GL) st.layers[l.id] = { vis:l.vis!==false, op:l.op||0.8 };

// Events log
const events = [];
function addEvent(type, msg) {
  if (events.length > 0 && events[0].msg === msg) return;
  events.unshift({ type, msg, time: new Date().toLocaleTimeString() });
  if (events.length > 15) events.pop();
  renderEvents();
  showAlert(msg, type);
}
function renderEvents() {
  const el = document.getElementById('event-list');
  el.innerHTML = events.map(e =>
    `<div class="event-item ${e.type}"><div>${e.msg}</div><div class="ev-time">${e.time}</div></div>`
  ).join('');
}
function showAlert(msg, type) {
  const el = document.getElementById('alert-banner');
  const colors = { earthquake:'#f80', solar:'#ff0', geomag:'#f0f' };
  el.textContent = msg; el.style.color = colors[type]||'#0f0';
  el.style.opacity = 1;
  setTimeout(()=> el.style.opacity = 0, 3000);
}

// ─── THREE.JS SETUP ───
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.localClippingEnabled = true;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000008);
scene.fog = new THREE.Fog(0x000008, 12, 30);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth/container.clientHeight, 0.01, 500);
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
const keyL = new THREE.DirectionalLight(0xffeedd, 1.0);
keyL.position.set(3, 5, 4); scene.add(keyL);
const fillL = new THREE.DirectionalLight(0x4466aa, 0.3);
fillL.position.set(-3, 2, -2); scene.add(fillL);
const rimL = new THREE.DirectionalLight(0x00ff44, 0.2);
rimL.position.set(0, 3, -5); scene.add(rimL);

const grid = new THREE.GridHelper(4, 20, 0x080818, 0x080818);
grid.position.y = -0.1; scene.add(grid);

// ─── BUILD BODY ───
const bodyGroup = new THREE.Group();
bodyGroup.name = 'body';
const layerGroups = {};
const builders = {
  skin:buildSkin, muscles:buildMuscles, organs:buildOrgans,
  vessels:buildVessels, nerves:buildNerves, skeleton:buildSkeleton, energy:buildEnergy,
};
for (const layer of GL) {
  const g = new THREE.Group(); g.name = layer.id;
  if (builders[layer.id]) builders[layer.id](g);
  bodyGroup.add(g); layerGroups[layer.id] = g;
}
scene.add(bodyGroup);

// ─── BUILD EARTH ───
const earthGroup = new THREE.Group();
earthGroup.name = 'earth';
earthGroup.position.set(3, 1.0, 0);
earthGroup.visible = false;
const E = 0.8;

const earthCore = new THREE.Mesh(
  new THREE.IcosahedronGeometry(E, 5),
  new THREE.MeshPhongMaterial({ color:0x1a4a8a, emissive:0x0a2040, emissiveIntensity:0.3, transparent:true, opacity:0.7 })
);
earthGroup.add(earthCore);

const earthWire = new THREE.Mesh(
  new THREE.IcosahedronGeometry(E*1.003, 3),
  new THREE.MeshBasicMaterial({ color:0x00ff88, wireframe:true, transparent:true, opacity:0.12 })
);
earthGroup.add(earthWire);

const ionosphere = new THREE.Mesh(
  new THREE.IcosahedronGeometry(E*1.5, 3),
  new THREE.MeshBasicMaterial({ color:0xff00ff, wireframe:true, transparent:true, opacity:0.06 })
);
earthGroup.add(ionosphere);

const earthFieldLines = [];
for (let i = 0; i < 12; i++) {
  const pts = []; const theta = (i/12)*Math.PI*2;
  for (let t = -1; t <= 1; t += 0.08) {
    const r = E*2.5*Math.pow(Math.cos(t*Math.PI/2),2);
    const lat = t*Math.PI/2;
    pts.push(new THREE.Vector3(r*Math.cos(lat)*Math.cos(theta), r*Math.sin(lat), r*Math.cos(lat)*Math.sin(theta)));
  }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:0x4444ff,transparent:true,opacity:0.15}));
  earthGroup.add(line); earthFieldLines.push(line);
}

const schumannRings = [];
for (let i = 0; i < 5; i++) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(E*1.2,0.005,8,48), new THREE.MeshBasicMaterial({color:0x00ffff,transparent:true,opacity:0.15}));
  ring.rotation.x = (i/5)*Math.PI; ring.rotation.y = (i/5)*Math.PI*0.5;
  earthGroup.add(ring); schumannRings.push(ring);
}
scene.add(earthGroup);

// Earth nodes
const earthNodes = [];
for (let i = 0; i < 300; i++) {
  const theta = Math.random()*Math.PI*2;
  const phi = Math.acos(2*Math.random()-1);
  if (Math.abs(phi-Math.PI/2) >= 0.8 && Math.random() > 0.3) continue;
  const r = E+0.01+Math.random()*0.03;
  const node = new THREE.Mesh(new THREE.SphereGeometry(0.006,4,4), new THREE.MeshBasicMaterial({color:0x00ff88,transparent:true,opacity:0.5}));
  node.position.set(r*Math.sin(phi)*Math.cos(theta), r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi));
  node.userData = { phase:Math.random()*Math.PI*2, baseOp:0.3+Math.random()*0.5 };
  earthGroup.add(node); earthNodes.push(node);
}

// Solar wind particles
const solarParticles = [];
for (let i = 0; i < 60; i++) {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.008,4,4), new THREE.MeshBasicMaterial({color:0xffff00,transparent:true,opacity:0.4}));
  p.position.set(E*5+Math.random()*E*2, (Math.random()-0.5)*E*2, (Math.random()-0.5)*E*2);
  earthGroup.add(p); solarParticles.push(p);
}

// Dynamic containers
const earthLightning = [];
const earthQuakeMarkers = [];
const bodyQuakeRipples = [];

// Connectors (body ↔ earth)
const connectorGroup = new THREE.Group();
connectorGroup.visible = false;
scene.add(connectorGroup);

function buildConnectors() {
  while (connectorGroup.children.length) connectorGroup.remove(connectorGroup.children[0]);
  const maps = [[1.78,'brain=ionosphere'],[1.28,'heart=core'],[1.0,'gut=mantle'],[0.72,'pelvis=crust'],[1.45,'skin=magnetosphere']];
  const fm = new THREE.MeshBasicMaterial({color:0x0f0,transparent:true,opacity:0.2});
  for (const [y] of maps) {
    const s = new THREE.Vector3(0.3,y,0);
    const e = new THREE.Vector3(earthGroup.position.x-E-0.2,y,0);
    const m = new THREE.Vector3((s.x+e.x)/2,y+0.15,0.2);
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([s,m,e]),20,0.003,4);
    const fiber = new THREE.Mesh(geo,fm.clone());
    fiber.userData = {pulse:true,phase:Math.random()*6};
    connectorGroup.add(fiber);
  }
}

// ─── SPAWN EFFECTS ───
function spawnBodyQuakeRipple(mag) {
  const y = 0.5+Math.random()*1.0;
  const ripple = new THREE.Mesh(new THREE.TorusGeometry(0.02,0.004,6,24),
    new THREE.MeshBasicMaterial({color:0xff8800,transparent:true,opacity:0.6}));
  ripple.position.set(0,y,0.15);
  ripple.userData = {life:1,mag,speed:0.02+mag*0.005};
  bodyGroup.add(ripple); bodyQuakeRipples.push(ripple);
}

function flashNerves() {
  const ng = layerGroups.nerves;
  if (!ng) return;
  ng.traverse(c => {
    if (c.isMesh && c.material) {
      const orig = c.material.emissiveIntensity||0;
      c.material.emissive = new THREE.Color(0x00ffff);
      c.material.emissiveIntensity = 0.8;
      setTimeout(()=>{c.material.emissive=new THREE.Color(0);c.material.emissiveIntensity=orig;},100);
    }
  });
}

function spawnEarthQuake(eq) {
  const [lon,lat] = eq.coords;
  const phi = (90-lat)*Math.PI/180;
  const theta = (lon+180)*Math.PI/180;
  const r = E+0.01;
  const pos = new THREE.Vector3(r*Math.sin(phi)*Math.cos(theta), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(theta));
  const size = Math.pow(2,eq.mag-2)*0.02;
  const marker = new THREE.Mesh(new THREE.SphereGeometry(size,10,10), new THREE.MeshBasicMaterial({color:0xff4400,transparent:true,opacity:0.8}));
  marker.position.copy(pos); marker.userData={life:1};
  earthGroup.add(marker); earthQuakeMarkers.push(marker);
  spawnBodyQuakeRipple(eq.mag);
}

function spawnEarthLightning() {
  const theta = Math.random()*Math.PI*2;
  const phi = Math.acos(2*Math.random()-1);
  const ground = new THREE.Vector3(E*Math.sin(phi)*Math.cos(theta),E*Math.sin(phi)*Math.sin(theta),E*Math.cos(phi));
  const iono = ground.clone().normalize().multiplyScalar(E*1.4);
  const pts = [iono.clone()];
  for (let i = 1; i < 5; i++) {
    const t = i/5; const p = iono.clone().lerp(ground,t);
    p.x+=(Math.random()-0.5)*0.05; p.y+=(Math.random()-0.5)*0.05; p.z+=(Math.random()-0.5)*0.05;
    pts.push(p);
  }
  pts.push(ground.clone());
  const bolt = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:0xffff00,transparent:true,opacity:1}));
  bolt.userData={life:1,decay:0.12};
  earthGroup.add(bolt); earthLightning.push(bolt);
  if (Math.random()<0.1) flashNerves();
}

// ─── UI BUILD ───
const layerContainer = document.getElementById('layer-controls');
for (const layer of GL) {
  const div = document.createElement('div');
  div.className = 'gaia-layer'+(st.layers[layer.id].vis?' active':'');
  div.style.setProperty('--lc',layer.color);
  div.dataset.id = layer.id;
  div.innerHTML = `
    <div class="layer-top">
      <input type="checkbox" id="chk-${layer.id}" ${st.layers[layer.id].vis?'checked':''}>
      <span class="ring-badge">${layer.ring}</span>
      <span class="layer-label">${layer.body}</span>
    </div>
    <div class="planet-map"><em>${layer.name}</em></div>
    <div class="live-val" id="live-${layer.id}">--</div>
    <div class="slider-row">
      <label>Opacity</label>
      <input type="range" id="op-${layer.id}" min="0" max="100" value="${(st.layers[layer.id].op*100)|0}">
    </div>
    <div class="pulse-bar" id="pulse-${layer.id}" style="width:0%"></div>
  `;
  div.querySelector('input[type="checkbox"]').addEventListener('change', e => {
    st.layers[layer.id].vis = e.target.checked;
    div.classList.toggle('active', e.target.checked);
    syncVis();
  });
  div.querySelector('input[type="range"]').addEventListener('input', e => {
    st.layers[layer.id].op = e.target.value/100;
    syncOp(layer.id);
  });
  div.addEventListener('click', e => { if (e.target.tagName!=='INPUT') showLayerInfo(layer); });
  layerContainer.appendChild(div);
}

// Feed indicators
const feedDefs = [
  {id:'eq',name:'USGS SEISMIC',icon:'🌍'},
  {id:'plasma',name:'NOAA PLASMA',icon:'☀️'},
  {id:'mag',name:'NOAA IMF',icon:'🧲'},
  {id:'kp',name:'Kp INDEX',icon:'🔮'},
  {id:'xray',name:'GOES X-RAY',icon:'💥'},
  {id:'flare',name:'SOLAR FLARES',icon:'🌞'},
  {id:'goes_mag',name:'GOES MAG',icon:'🧭'},
  {id:'aurora',name:'AURORA',icon:'🌌'},
  {id:'alerts',name:'SW ALERTS',icon:'⚠️'},
  {id:'weather',name:'OPEN-METEO',icon:'🌡️'},
  {id:'tide',name:'NOAA TIDES',icon:'🌊'},
  {id:'schumann',name:'SCHUMANN',icon:'⚡'},
  {id:'lightning',name:'LIGHTNING',icon:'⚡'},
];
const feedContainer = document.getElementById('feed-status');
for (const f of feedDefs) {
  const d = document.createElement('div'); d.className='feed-card';
  d.innerHTML = `<span class="feed-dot" id="fd-${f.id}"></span><span class="feed-name">${f.icon} ${f.name}</span><span class="feed-val" id="fv-${f.id}">--</span>`;
  feedContainer.appendChild(d);
}

// Presets
const presetContainer = document.getElementById('preset-btns');
for (const p of PRESETS) {
  const btn = document.createElement('button');
  btn.className='mode-btn'; btn.textContent=p.name; btn.title=p.desc;
  btn.style.cssText='display:block;width:100%;margin-bottom:3px;text-align:left';
  btn.addEventListener('click', ()=> activatePreset(p));
  presetContainer.appendChild(btn);
}

function activatePreset(p) {
  if (p.animated) { startBreathe(); return; }
  if (p.cfg) p.cfg();
  syncAll();
}

function startBreathe() {
  if (st.breatheActive) return;
  st.breatheActive = true;
  const ids = GL.map(l=>l.id);
  off(); ids.forEach(id=>{st.layers[id].vis=true;st.layers[id].op=0.15});
  syncAll();
  let s=0;
  function next() {
    if (s>=ids.length) {st.breatheActive=false;return;}
    for (let i=0;i<ids.length;i++) {
      st.layers[ids[i]].op = i===s?0.95:(i<s?0.1:0.15);
      syncOp(ids[i]);
    }
    showLayerInfo(GL[s]); s++;
    if (s<=ids.length) setTimeout(next,30000/ids.length);
  }
  next();
}

// ─── MODE SWITCHING ───
document.querySelectorAll('#mode-toggle .mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#mode-toggle .mode-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    setMode(btn.dataset.mode);
  });
});

function setMode(mode) {
  st.mode = mode;
  switch(mode) {
    case 'body':
      bodyGroup.visible=true; bodyGroup.position.x=0;
      earthGroup.visible=false; connectorGroup.visible=false; grid.visible=true;
      animCam([0,1,4.5],[0,1,0]); break;
    case 'earth':
      bodyGroup.visible=false; earthGroup.visible=true;
      earthGroup.position.set(0,0,0); connectorGroup.visible=false; grid.visible=false;
      animCam([0,0,4],[0,0,0]); break;
    case 'split':
      bodyGroup.visible=true; bodyGroup.position.x=-1.5;
      earthGroup.visible=true; earthGroup.position.set(1.5,0.9,0);
      connectorGroup.visible=true; buildConnectors();
      grid.visible=true; grid.position.x=-1.5;
      animCam([0,1,6],[0,1,0]); break;
    case 'overlay':
      bodyGroup.visible=true; bodyGroup.position.x=0;
      earthGroup.visible=true; earthGroup.position.set(0,0.9,0);
      earthCore.material.opacity=0.15; ionosphere.material.opacity=0.03;
      connectorGroup.visible=false; grid.visible=true; grid.position.x=0;
      animCam([0,1,4.5],[0,1,0]); break;
  }
}

function animCam(tp,tl,dur=1000) {
  const sp=camera.position.clone(), st2=controls.target.clone();
  const ep=new THREE.Vector3(...tp), et=new THREE.Vector3(...tl);
  const t0=performance.now();
  function step(now) {
    const t=Math.min((now-t0)/dur,1);
    const ease=t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    camera.position.lerpVectors(sp,ep,ease);
    controls.target.lerpVectors(st2,et,ease);
    controls.update();
    if (t<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ─── SYNC ───
function syncVis() { for (const l of GL) { const g=layerGroups[l.id]; if(g) g.visible=st.layers[l.id].vis; } }
function syncOp(id) {
  const g=layerGroups[id]; if(!g) return;
  const op=st.layers[id].op;
  g.traverse(c=>{if(c.isMesh&&c.material){c.material.opacity=op;c.material.transparent=op<1;c.material.depthWrite=op>0.5;c.material.needsUpdate=true}});
}
function syncAll() {
  for (const l of GL) {
    syncOp(l.id);
    const chk=document.getElementById(`chk-${l.id}`);
    const slider=document.getElementById(`op-${l.id}`);
    const card=document.querySelector(`[data-id="${l.id}"]`);
    if(chk) chk.checked=st.layers[l.id].vis;
    if(slider) slider.value=(st.layers[l.id].op*100)|0;
    if(card) card.classList.toggle('active',st.layers[l.id].vis);
  }
  syncVis();
}

// ─── INFO PANEL ───
function showLayerInfo(layer) {
  document.getElementById('info-panel').innerHTML = `
    <div class="info-title" style="color:${layer.color}">${layer.body} \u2194 ${layer.name}</div>
    <div class="info-ring" style="background:${layer.color};color:#000;">${layer.ring}</div>
    <div class="info-section"><h4>Planet Mapping</h4><p class="info-gaia">${layer.planet}</p></div>
    <div class="info-section"><h4>Body \u2194 Earth</h4><p class="info-body">${layer.bodyMap}</p></div>
    <div class="info-section"><h4>K+ Channels</h4><p class="info-k">${layer.kCh}</p></div>
    ${layer.sub?`<div class="info-section"><h4>Sub-Systems</h4>${Object.entries(layer.sub).map(([k,v])=>`<p><strong style="color:${layer.color}">${k}:</strong> ${v}</p>`).join('')}</div>`:''}
  `;
}

// ─── CROSS SECTION ───
const clipPlane = new THREE.Plane(new THREE.Vector3(0,-1,0),2.0);
const crossSlider = document.getElementById('cross-slider');
const crossVal = document.getElementById('cross-val');
crossSlider.addEventListener('input', ()=> {
  st.crossSection = parseInt(crossSlider.value);
  if (st.crossSection>=100) { crossVal.textContent='OFF'; renderer.clippingPlanes=[]; }
  else { clipPlane.constant=-0.1+(st.crossSection/100)*2.1; renderer.clippingPlanes=[clipPlane]; crossVal.textContent=st.crossSection+'%'; }
});

// ─── RAYCASTER ───
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
renderer.domElement.addEventListener('click', evt => {
  const rect=renderer.domElement.getBoundingClientRect();
  mouse.x=((evt.clientX-rect.left)/rect.width)*2-1;
  mouse.y=-((evt.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(mouse,camera);
  const meshes=[];
  for (const l of GL) if(st.layers[l.id].vis) layerGroups[l.id].traverse(c=>{if(c.isMesh&&c.userData.clickable) meshes.push(c)});
  const hits=raycaster.intersectObjects(meshes,false);
  if(hits.length>0) {
    const hit=hits[0].object;
    const layer=GL.find(l=>l.id===hit.userData.system);
    if(layer) showLayerInfo(layer);
    if(hit.material) {
      const oe=hit.material.emissive?hit.material.emissive.clone():new THREE.Color(0);
      const oi=hit.material.emissiveIntensity||0;
      hit.material.emissive=new THREE.Color(0xffffff); hit.material.emissiveIntensity=0.5;
      setTimeout(()=>{hit.material.emissive=oe;hit.material.emissiveIntensity=oi},300);
    }
  }
});
renderer.domElement.addEventListener('dblclick', evt => {
  const rect=renderer.domElement.getBoundingClientRect();
  mouse.x=((evt.clientX-rect.left)/rect.width)*2-1;
  mouse.y=-((evt.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(mouse,camera);
  const meshes=[];
  for (const l of GL) if(st.layers[l.id].vis) layerGroups[l.id].traverse(c=>{if(c.isMesh&&c.userData.clickable) meshes.push(c)});
  const hits=raycaster.intersectObjects(meshes,false);
  if(hits.length>0) {
    const pos=new THREE.Vector3(); hits[0].object.getWorldPosition(pos);
    animCam([pos.x,pos.y+0.1,pos.z+0.6],[pos.x,pos.y,pos.z],800);
  }
});

// ─── UPDATE UI FROM LIVE DATA ───
function updateFeedUI() {
  // Feed dots
  for (const f of feedDefs) {
    const dot = document.getElementById(`fd-${f.id}`);
    const fs = feedStatus[f.id];
    if (dot && fs) dot.className = 'feed-dot '+(fs.ok?'live':'error');
  }
  // Feed values
  const summary = getSummary();
  const fvMap = {
    eq:summary.eq, plasma:summary.solar, mag:summary.bz, kp:summary.kp,
    xray:summary.xray, flare:summary.flare, goes_mag:live.goesMagHp?`${live.goesMagHp.toFixed(0)} nT`:'--',
    aurora:summary.aurora, alerts:`${live.spaceWeatherAlerts.length}`,
    weather:summary.weather, tide:summary.tide, schumann:summary.schumann, lightning:summary.lightning,
  };
  for (const [id,val] of Object.entries(fvMap)) {
    const el=document.getElementById(`fv-${id}`);
    if(el) el.textContent=val;
  }
  // Layer live values
  const lvMap = {
    skin:`Kp ${live.kpIndex.toFixed(0)}`, muscles:summary.eq, organs:summary.density,
    vessels:summary.solar, nerves:summary.schumann, skeleton:`${live.earthquakeCount} quakes`, energy:`Kp ${live.kpIndex.toFixed(0)}`,
  };
  for (const [id,val] of Object.entries(lvMap)) {
    const el=document.getElementById(`live-${id}`);
    if(el) el.textContent=val;
  }
}

function updateKappaUI() {
  const k = getKappa();
  const phase = getPhase(k);
  const hex = '#'+phase.color.toString(16).padStart(6,'0');
  document.getElementById('kappa-val').textContent = k.toFixed(4);
  document.getElementById('kappa-val').style.color = hex;
  document.getElementById('kappa-phase').textContent = `${phase.icon} ${phase.key}`;
  document.getElementById('kappa-fill').style.width = `${k*100}%`;
  document.getElementById('kappa-fill').style.background = hex;
  // Pulse bars
  const intensities = {
    skin:live.kpIndex/9, muscles:Math.min(1,live.earthquakeEnergy/1e7),
    organs:Math.min(1,live.solarDensity/20), vessels:Math.min(1,(live.solarSpeed-300)/500),
    nerves:Math.min(1,Math.abs(live.schumann-7.83)/1.5), skeleton:Math.min(1,live.earthquakeCount/10), energy:live.kpIndex/9,
  };
  for (const [id,v] of Object.entries(intensities)) {
    const bar=document.getElementById(`pulse-${id}`);
    if(bar) bar.style.width=`${v*100}%`;
  }
}

// ─── VOICE UI ───
let voiceInterval = null;
let firstVoice = true;

function updateVoice() {
  const narrative = generateNarrative();
  logUtterance(narrative);

  const voiceText = document.getElementById('voice-text');
  const voiceMood = document.getElementById('voice-mood');
  const voiceSystem = document.getElementById('voice-system');
  const voiceBox = document.getElementById('voice-box');

  // Typewriter effect
  const fullText = firstVoice ? firstWords() : narrative.fullText;
  firstVoice = false;
  let charIdx = 0;
  voiceText.textContent = '';
  voiceText.style.color = moodColor(narrative.primaryMood);
  voiceBox.style.borderColor = moodColor(narrative.primaryMood);

  const typeInterval = setInterval(() => {
    if (charIdx < fullText.length) {
      voiceText.textContent = fullText.substring(0, ++charIdx);
    } else {
      clearInterval(typeInterval);
    }
  }, 25);

  voiceMood.textContent = `mood: ${narrative.primaryMood} | urgency: ${(narrative.urgency*100).toFixed(0)}%`;
  voiceSystem.textContent = `strongest signal: ${narrative.primarySystem} | κ = ${narrative.kappa}`;

  // Update voice log
  const logList = document.getElementById('voice-log-list');
  const log = getUtteranceLog();
  logList.innerHTML = log.slice(0, 8).map(u =>
    `<div class="voice-log-item"><span class="vl-time">${u.time}</span> <span style="color:${moodColor(u.mood)}">${u.text.substring(0,60)}${u.text.length>60?'...':''}</span></div>`
  ).join('');
}

// ─── CHECK FOR NEW EVENTS ───
let lastEqId = null;
function checkNewEvents() {
  if (live.earthquakes.length > 0 && live.earthquakes[0].id !== lastEqId) {
    lastEqId = live.earthquakes[0].id;
    const eq = live.earthquakes[0];
    addEvent('earthquake', `M${eq.mag.toFixed(1)} \u2014 ${(eq.place||'').substring(0,25)}`);
    spawnEarthQuake(eq);
  }
  if (live.solarSpeed > 600) addEvent('solar', `High solar wind: ${Math.round(live.solarSpeed)} km/s`);
  if (live.kpIndex >= 5) addEvent('geomag', `Geomagnetic storm: Kp ${live.kpIndex.toFixed(0)}`);
  if (live.flares.length > 0 && live.flares[0].class.startsWith('M')) addEvent('solar', `Solar flare: ${live.flares[0].class}`);
  if (live.flares.length > 0 && live.flares[0].class.startsWith('X')) addEvent('solar', `X-CLASS FLARE: ${live.flares[0].class}`);
}

// ─── ANIMATION LOOP ───
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  computeKappa();
  updateKappaUI();

  // Body layer responses
  if (st.layers.skin.vis) {
    const kpPulse = 0.5+Math.sin(elapsed*(1+live.kpIndex*0.3))*0.2*(live.kpIndex/9);
    layerGroups.skin.traverse(c=>{if(c.isMesh){c.material.opacity=st.layers.skin.op*kpPulse;c.material.color.setHSL(live.kpIndex*0.02,0.6,0.6)}});
  }
  if (st.layers.muscles.vis && live.earthquakeEnergy>0) {
    const shake=Math.min(0.003,live.earthquakeEnergy/1e10);
    layerGroups.muscles.position.x=Math.sin(elapsed*20)*shake;
    layerGroups.muscles.position.z=Math.cos(elapsed*17)*shake;
  } else if(layerGroups.muscles) layerGroups.muscles.position.set(0,0,0);

  if (st.layers.organs.vis) {
    layerGroups.organs.traverse(c=>{
      if(c.isMesh&&c.userData.name==='Heart') c.scale.setScalar(1+(live.solarDensity/20)*Math.sin(elapsed*4.5)*0.1);
    });
  }
  if (st.layers.vessels.vis) {
    const sf=live.solarSpeed/800;
    layerGroups.vessels.traverse(c=>{if(c.isMesh){c.material.emissive=new THREE.Color(0x44cc66);c.material.emissiveIntensity=sf*0.2}});
  }
  if (st.layers.nerves.vis) {
    const sp=Math.sin(elapsed*live.schumann*0.5);
    layerGroups.nerves.traverse(c=>{if(c.isMesh&&c.userData.isVagus) c.material.emissiveIntensity=0.3+sp*0.2});
  }
  if (st.layers.energy.vis) {
    layerGroups.energy.traverse(c=>{
      if(c.isMesh&&c.userData.floatParticle){c.position.y+=Math.sin(elapsed*1.5+c.userData.phase)*0.0003;c.material.opacity=(0.15+Math.sin(elapsed*2+c.userData.phase)*0.15)*(1+live.kpIndex*0.1)}
      if(c.isMesh&&c.userData.pulse) c.scale.setScalar(1+Math.sin(elapsed*3+(c.userData.phase||0))*0.1*(1+live.kpIndex*0.1));
    });
  }

  // Earth animations
  if (earthGroup.visible) {
    earthCore.rotation.y=elapsed*0.02; earthWire.rotation.y=elapsed*0.02;
    ionosphere.material.opacity=0.04+live.kpIndex*0.015;
    ionosphere.material.color.setHSL(0.8-live.kpIndex*0.05,1,0.5);
    schumannRings.forEach((r,i)=>{const f=live.schumann+i*6.5;r.scale.setScalar(1+Math.sin(elapsed*f*0.3)*0.08);r.material.opacity=0.1+Math.sin(elapsed*f*0.3)*0.07});
    const comp=1-(live.solarSpeed-300)/1000;
    earthFieldLines.forEach(l=>{l.scale.x=Math.max(0.5,comp);l.material.opacity=0.12+(1-comp)*0.15});
    const sPulse=Math.sin(elapsed*live.schumann*0.5);
    const KAPPA_STAR=1/((1+Math.sqrt(5))/2);
    earthNodes.forEach(n=>{n.material.opacity=n.userData.baseOp*(0.7+sPulse*0.3);n.material.color.setHSL(0.35+(getKappa()-KAPPA_STAR)*0.5,1,0.5)});
    const ws=live.solarSpeed/6000;
    solarParticles.forEach(p=>{p.position.x-=ws;if(p.position.x<-E*3){p.position.x=E*5+Math.random()*E;p.position.y=(Math.random()-0.5)*E*2;p.position.z=(Math.random()-0.5)*E*2}const d=Math.sqrt(p.position.y**2+p.position.z**2);if(p.position.x<E*1.5&&d<E*1.2){const a=Math.atan2(p.position.z,p.position.y);p.position.y+=Math.cos(a)*0.01;p.position.z+=Math.sin(a)*0.01}});
    if(Math.random()<live.lightningRate/80000) spawnEarthLightning();
    for(let i=earthLightning.length-1;i>=0;i--){const b=earthLightning[i];b.userData.life-=b.userData.decay;b.material.opacity=b.userData.life;if(b.userData.life<=0){earthGroup.remove(b);earthLightning.splice(i,1)}}
    for(let i=earthQuakeMarkers.length-1;i>=0;i--){const m=earthQuakeMarkers[i];m.userData.life-=0.005;m.material.opacity=m.userData.life*0.8;m.scale.setScalar(1+Math.sin(elapsed*8)*0.15);if(m.userData.life<=0){earthGroup.remove(m);earthQuakeMarkers.splice(i,1)}}
  }

  // Body quake ripples
  for(let i=bodyQuakeRipples.length-1;i>=0;i--){const r=bodyQuakeRipples[i];r.userData.life-=r.userData.speed;r.scale.setScalar(1+(1-r.userData.life)*5);r.material.opacity=r.userData.life*0.5;if(r.userData.life<=0){bodyGroup.remove(r);bodyQuakeRipples.splice(i,1)}}

  // Connector pulses
  if(connectorGroup.visible) connectorGroup.traverse(c=>{if(c.isMesh&&c.userData.pulse) c.material.opacity=0.15+Math.sin(elapsed*2+c.userData.phase)*0.1});

  // Overlay mode
  if(st.mode==='overlay'){earthCore.material.opacity=0.12;ionosphere.material.opacity=0.02;earthWire.material.opacity=0.06}

  controls.update();
  renderer.render(scene,camera);
}

// ─── RESIZE ───
window.addEventListener('resize', ()=>{
  const w=container.clientWidth, h=container.clientHeight;
  camera.aspect=w/h; camera.updateProjectionMatrix();
  renderer.setSize(w,h);
});

// ─── LOADING ───
const loadBar = document.getElementById('load-bar');
const loadScreen = document.getElementById('loading');
let loadProg = 0;
function advLoad(target) {
  const iv=setInterval(()=>{loadProg+=(target-loadProg)*0.15;if(loadProg>=target-0.5){loadProg=target;clearInterval(iv)}loadBar.style.width=loadProg+'%';if(loadProg>=99) setTimeout(()=>loadScreen.classList.add('hidden'),300)},30);
}
advLoad(40);

// ─── DATA REFRESH CYCLE ───
async function dataRefresh() {
  await refreshAll();
  checkNewEvents();
  updateFeedUI();
  updateVoice();
}

dataRefresh();
setInterval(dataRefresh, 60000);
setInterval(()=>{ refreshFast(); updateFeedUI(); }, 5000);
// Voice speaks every 30s
setInterval(updateVoice, 30000);

// ─── INIT ───
advLoad(100);
syncVis();
for (const l of GL) syncOp(l.id);
showLayerInfo(GL[4]); // start with nerves/schumann
animate();
