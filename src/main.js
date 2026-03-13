// A.S.S.-OS Anatomical Atlas — Main Application
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LAYERS, PRESETS, DRUGS, CAMERA_VIEWS } from './data.js';
import {
  buildSkeleton, buildSkin, buildMuscles, buildOrgans,
  buildVessels, buildNerves, buildEnergy, buildKChannelMap,
  buildDrugHighlights, buildDualConnectors,
} from './anatomy.js';

// ─── State ───
const state = {
  layers: {},
  activePreset: null,
  activeDrugs: new Set(),
  crossSection: 100,
  isDual: false,
  ringWalkActive: false,
};

// Initialize layer state
for (const layer of LAYERS) {
  state.layers[layer.id] = {
    visible: layer.defaultVisible !== false,
    opacity: layer.defaultOpacity || 0.8,
  };
}

// ─── Three.js Setup ───
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0f);
scene.fog = new THREE.Fog(0x0a0a0f, 8, 20);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 100);
camera.position.set(0, 1.0, 4.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.5;
controls.maxDistance = 12;
controls.update();

// ─── Lighting ───
const ambient = new THREE.AmbientLight(0x334466, 0.8);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffeedd, 1.2);
keyLight.position.set(3, 5, 4);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x8899bb, 0.4);
fillLight.position.set(-3, 2, -2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffd700, 0.3);
rimLight.position.set(0, 3, -5);
scene.add(rimLight);

// Ground grid
const gridHelper = new THREE.GridHelper(4, 20, 0x111122, 0x111122);
gridHelper.position.y = -0.1;
scene.add(gridHelper);

// ─── Build Anatomy Groups ───
const layerGroups = {};
const builders = {
  skin: buildSkin,
  muscles: buildMuscles,
  organs: buildOrgans,
  vessels: buildVessels,
  nerves: buildNerves,
  skeleton: buildSkeleton,
  energy: buildEnergy,
};

for (const layer of LAYERS) {
  const group = new THREE.Group();
  group.name = layer.id;
  if (builders[layer.id]) {
    builders[layer.id](group);
  }
  scene.add(group);
  layerGroups[layer.id] = group;
}

// K+ channel overlay group
const kchannelGroup = new THREE.Group();
kchannelGroup.name = 'kchannel';
buildKChannelMap(kchannelGroup);
kchannelGroup.visible = false;
scene.add(kchannelGroup);

// Drug overlay groups
const drugGroups = {};
for (const drug of DRUGS) {
  const g = new THREE.Group();
  g.name = `drug_${drug.id}`;
  buildDrugHighlights(g, drug.id);
  g.visible = false;
  scene.add(g);
  drugGroups[drug.id] = g;
}

// Dual view group
const dualGroup = new THREE.Group();
dualGroup.name = 'dual';
dualGroup.visible = false;
scene.add(dualGroup);

// Second body for dual mode
let dualBody = null;

// Cross-section clipping plane
const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 2.0);
renderer.localClippingEnabled = true;

// ─── Loading ───
const loadBar = document.getElementById('load-bar');
const loadScreen = document.getElementById('loading');
let loadProgress = 0;
function advanceLoad(target) {
  const interval = setInterval(() => {
    loadProgress += (target - loadProgress) * 0.15;
    if (loadProgress >= target - 0.5) { loadProgress = target; clearInterval(interval); }
    loadBar.style.width = loadProgress + '%';
    if (loadProgress >= 99) {
      setTimeout(() => loadScreen.classList.add('hidden'), 300);
    }
  }, 30);
}
advanceLoad(40);

// ─── UI: Layer Toggles ───
const toggleContainer = document.getElementById('layer-toggles');

for (const layer of LAYERS) {
  const div = document.createElement('div');
  div.className = 'layer-control' + (state.layers[layer.id].visible ? ' active' : '');
  div.style.setProperty('--layer-color', layer.color);
  div.dataset.layerId = layer.id;

  div.innerHTML = `
    <div class="layer-header">
      <input type="checkbox" id="toggle-${layer.id}" ${state.layers[layer.id].visible ? 'checked' : ''}>
      <span class="ring-badge">${layer.ringLabel}</span>
      <span class="layer-name">${layer.toggle}</span>
    </div>
    <div class="layer-slider">
      <label>Opacity</label>
      <input type="range" id="opacity-${layer.id}" min="0" max="100" value="${(state.layers[layer.id].opacity * 100) | 0}">
    </div>
  `;

  const checkbox = div.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', () => {
    state.layers[layer.id].visible = checkbox.checked;
    div.classList.toggle('active', checkbox.checked);
    updateLayerVisibility();
    showLayerInfo(layer);
  });

  const slider = div.querySelector('input[type="range"]');
  slider.addEventListener('input', () => {
    state.layers[layer.id].opacity = slider.value / 100;
    updateLayerOpacity(layer.id);
  });

  div.querySelector('.layer-header').addEventListener('click', (e) => {
    if (e.target.tagName !== 'INPUT') {
      showLayerInfo(layer);
    }
  });

  toggleContainer.appendChild(div);
}

// ─── UI: Presets ───
const presetContainer = document.getElementById('preset-buttons');

for (const preset of PRESETS) {
  const btn = document.createElement('button');
  btn.className = 'preset-btn';
  btn.textContent = preset.name;
  btn.title = preset.description;
  btn.addEventListener('click', () => activatePreset(preset));
  presetContainer.appendChild(btn);
}

// ─── UI: Drug Toggles ───
const drugToggleContainer = document.getElementById('drug-toggles');

for (const drug of DRUGS) {
  const div = document.createElement('div');
  div.className = 'drug-toggle';
  div.style.setProperty('--drug-color', drug.color);
  div.innerHTML = `
    <input type="checkbox" id="drug-${drug.id}">
    <span class="drug-dot" style="background:${drug.color}"></span>
    <label for="drug-${drug.id}">${drug.name}<br><span style="font-size:9px;color:#666;">${drug.ring} — ${drug.label}</span></label>
  `;
  div.querySelector('input').addEventListener('change', (e) => {
    if (e.target.checked) {
      state.activeDrugs.add(drug.id);
    } else {
      state.activeDrugs.delete(drug.id);
    }
    updateDrugOverlays();
  });
  drugToggleContainer.appendChild(div);
}

// ─── UI: Cross Section ───
const crossSlider = document.getElementById('cross-section-slider');
const crossValue = document.getElementById('cross-section-value');

crossSlider.addEventListener('input', () => {
  state.crossSection = parseInt(crossSlider.value);
  updateCrossSection();
});

// ─── UI: Camera Controls ───
document.querySelectorAll('.cam-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = CAMERA_VIEWS[btn.dataset.view];
    if (view) animateCamera(view.pos, view.target);
  });
});

// ─── Functions ───

function updateLayerVisibility() {
  for (const layer of LAYERS) {
    const group = layerGroups[layer.id];
    if (group) group.visible = state.layers[layer.id].visible;
  }
}

function updateLayerOpacity(layerId) {
  const group = layerGroups[layerId];
  if (!group) return;
  const opacity = state.layers[layerId].opacity;
  group.traverse(child => {
    if (child.isMesh && child.material) {
      child.material.opacity = opacity;
      child.material.transparent = opacity < 1;
      child.material.depthWrite = opacity > 0.5;
      child.material.needsUpdate = true;
    }
  });
}

function updateCrossSection() {
  if (state.crossSection >= 100) {
    crossValue.textContent = 'OFF';
    renderer.clippingPlanes = [];
  } else {
    const y = -0.1 + (state.crossSection / 100) * 2.1;
    clipPlane.constant = y;
    renderer.clippingPlanes = [clipPlane];
    crossValue.textContent = `${state.crossSection}%`;
  }
}

function animateCamera(targetPos, targetLook, duration = 1000) {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = new THREE.Vector3(...targetPos);
  const endTarget = new THREE.Vector3(...targetLook);
  const startTime = performance.now();

  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    camera.position.lerpVectors(startPos, endPos, ease);
    controls.target.lerpVectors(startTarget, endTarget, ease);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function activatePreset(preset) {
  // Update button states
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  const btns = document.querySelectorAll('.preset-btn');
  for (const b of btns) { if (b.textContent === preset.name) b.classList.add('active'); }

  state.activePreset = preset.id;

  // Drug panel
  const drugPanel = document.getElementById('drug-panel');
  if (preset.showDrugPanel) {
    drugPanel.classList.add('visible');
  } else {
    drugPanel.classList.remove('visible');
  }

  // Handle Ring Walk animation
  if (preset.animated && preset.id === 'ringwalk') {
    startRingWalk();
    return;
  }

  // Apply layer config
  if (preset.config) {
    for (const [layerId, cfg] of Object.entries(preset.config)) {
      state.layers[layerId].visible = cfg.visible !== false;
      if (cfg.opacity !== undefined) state.layers[layerId].opacity = cfg.opacity;

      // Update UI
      const checkbox = document.getElementById(`toggle-${layerId}`);
      const slider = document.getElementById(`opacity-${layerId}`);
      const control = document.querySelector(`[data-layer-id="${layerId}"]`);
      if (checkbox) checkbox.checked = state.layers[layerId].visible;
      if (slider) slider.value = (state.layers[layerId].opacity * 100) | 0;
      if (control) control.classList.toggle('active', state.layers[layerId].visible);

      updateLayerOpacity(layerId);
    }
    updateLayerVisibility();
  }

  // K+ channel map
  kchannelGroup.visible = preset.highlight === 'kchannel';

  // Dual view
  if (preset.dual) {
    enableDualView();
  } else {
    disableDualView();
  }

  // Highlight modes
  if (preset.highlight === 'vagus') {
    highlightVagus(true);
  } else {
    highlightVagus(false);
  }

  if (preset.highlight === 'gutbrain') {
    highlightGutBrain(true);
  } else {
    highlightGutBrain(false);
  }
}

function startRingWalk() {
  if (state.ringWalkActive) return;
  state.ringWalkActive = true;

  const layerIds = LAYERS.map(l => l.id);
  const totalDuration = 30000;
  const stepDuration = totalDuration / layerIds.length;

  // Start: all visible low opacity
  for (const lid of layerIds) {
    state.layers[lid].visible = true;
    state.layers[lid].opacity = 0.15;
    updateLayerOpacity(lid);
  }
  updateLayerVisibility();

  let step = 0;
  function nextStep() {
    if (step >= layerIds.length) {
      state.ringWalkActive = false;
      return;
    }

    // Highlight current layer
    for (let i = 0; i < layerIds.length; i++) {
      const lid = layerIds[i];
      if (i === step) {
        state.layers[lid].opacity = 0.95;
        state.layers[lid].visible = true;
      } else if (i < step) {
        state.layers[lid].opacity = 0.1;
      } else {
        state.layers[lid].opacity = 0.15;
      }
      updateLayerOpacity(lid);
      // Update UI
      const slider = document.getElementById(`opacity-${lid}`);
      if (slider) slider.value = (state.layers[lid].opacity * 100) | 0;
    }
    updateLayerVisibility();

    showLayerInfo(LAYERS[step]);

    step++;
    if (step <= layerIds.length) setTimeout(nextStep, stepDuration);
  }
  nextStep();
}

function highlightVagus(on) {
  const nervesGroup = layerGroups.nerves;
  if (!nervesGroup) return;
  nervesGroup.traverse(child => {
    if (child.isMesh && child.userData.isVagus) {
      if (on) {
        child.material.emissive = new THREE.Color(0xffd700);
        child.material.emissiveIntensity = 0.8;
        child.scale.set(2, 1, 2);
      } else {
        child.material.emissiveIntensity = 0.3;
        child.scale.set(1, 1, 1);
      }
    }
  });
}

let gutBrainConnectors = null;
function highlightGutBrain(on) {
  if (on && !gutBrainConnectors) {
    gutBrainConnectors = new THREE.Group();
    const fiberMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.5 });
    // Gut to brain pathway
    const points = [
      new THREE.Vector3(0, 0.85, 0.03),
      new THREE.Vector3(0.01, 1.0, 0.04),
      new THREE.Vector3(0.02, 1.2, 0.03),
      new THREE.Vector3(0.02, 1.4, 0.02),
      new THREE.Vector3(0.01, 1.6, 0.01),
      new THREE.Vector3(0, 1.75, 0),
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 30, 0.008, 6);
    const tube = new THREE.Mesh(geo, fiberMat);
    tube.userData = { pulse: true };
    gutBrainConnectors.add(tube);
    scene.add(gutBrainConnectors);
  } else if (!on && gutBrainConnectors) {
    scene.remove(gutBrainConnectors);
    gutBrainConnectors = null;
  }
}

function enableDualView() {
  if (state.isDual) return;
  state.isDual = true;

  // Offset existing body to the left
  for (const group of Object.values(layerGroups)) {
    group.position.x = -0.75;
  }
  kchannelGroup.position.x = -0.75;

  // Clone body to the right
  dualBody = new THREE.Group();
  for (const layer of LAYERS) {
    const srcGroup = layerGroups[layer.id];
    const clone = srcGroup.clone(true);
    clone.position.x = 0.75;
    dualBody.add(clone);
  }
  scene.add(dualBody);

  // Build connectors
  buildDualConnectors(dualGroup, 1.5);
  dualGroup.visible = true;

  // Adjust camera
  animateCamera([0, 1.0, 6], [0, 1.0, 0]);
}

function disableDualView() {
  if (!state.isDual) return;
  state.isDual = false;

  for (const group of Object.values(layerGroups)) {
    group.position.x = 0;
  }
  kchannelGroup.position.x = 0;

  if (dualBody) {
    scene.remove(dualBody);
    dualBody = null;
  }
  dualGroup.visible = false;

  animateCamera([0, 1.0, 4.5], [0, 1.0, 0]);
}

function updateDrugOverlays() {
  for (const drug of DRUGS) {
    if (drugGroups[drug.id]) {
      drugGroups[drug.id].visible = state.activeDrugs.has(drug.id);
    }
  }
}

function showLayerInfo(layer) {
  const info = document.getElementById('info-content');
  info.innerHTML = `
    <div class="info-title" style="color:${layer.color}">${layer.name}</div>
    <div class="info-ring" style="background:${layer.color};color:#000;">${layer.ringLabel}</div>

    <div class="info-section">
      <h4>Anatomy</h4>
      <p class="info-anatomy">${layer.anatomy}</p>
    </div>

    <div class="info-section">
      <h4>A.S.S.-OS Mapping</h4>
      <p>${layer.assos}</p>
    </div>

    <div class="info-section">
      <h4>K+ Channels</h4>
      <p class="info-k">${layer.kChannels}</p>
    </div>

    ${layer.subOrgans ? `<div class="info-section"><h4>Sub-Systems</h4>${Object.entries(layer.subOrgans).map(([k, v]) => `<p><strong style="color:${layer.color}">${k}:</strong> ${v}</p>`).join('')}</div>` : ''}
    ${layer.subSystems ? `<div class="info-section"><h4>Sub-Systems</h4>${Object.entries(layer.subSystems).map(([k, v]) => `<p><strong style="color:${layer.color}">${k}:</strong> ${v}</p>`).join('')}</div>` : ''}
  `;
}

function showStructureInfo(userData) {
  if (!userData || !userData.name) return;

  // Find which layer this belongs to
  const layer = LAYERS.find(l => l.id === userData.system);

  const info = document.getElementById('info-content');
  let html = `<div class="info-title" style="color:${layer ? layer.color : '#fff'}">${userData.name}</div>`;

  if (layer) {
    html += `<div class="info-ring" style="background:${layer.color};color:#000;">${layer.ringLabel}</div>`;
  }

  if (userData.detail) {
    html += `<div class="info-section"><h4>Detail</h4><p>${userData.detail}</p></div>`;
  }

  if (layer) {
    html += `
      <div class="info-section"><h4>System</h4><p class="info-anatomy">${layer.anatomy}</p></div>
      <div class="info-section"><h4>K+ Channels</h4><p class="info-k">${layer.kChannels}</p></div>
    `;
  }

  info.innerHTML = html;
}

// ─── Raycaster (Click interaction) ───
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const allMeshes = [];
  for (const layer of LAYERS) {
    if (state.layers[layer.id].visible) {
      layerGroups[layer.id].traverse(child => {
        if (child.isMesh && child.userData.clickable) allMeshes.push(child);
      });
    }
  }
  if (kchannelGroup.visible) {
    kchannelGroup.traverse(child => {
      if (child.isMesh && child.userData.clickable) allMeshes.push(child);
    });
  }

  const intersects = raycaster.intersectObjects(allMeshes, false);
  if (intersects.length > 0) {
    const hit = intersects[0].object;
    showStructureInfo(hit.userData);

    // Flash highlight
    if (hit.material) {
      const origEmissive = hit.material.emissive ? hit.material.emissive.clone() : new THREE.Color(0);
      const origIntensity = hit.material.emissiveIntensity || 0;
      hit.material.emissive = new THREE.Color(0xffffff);
      hit.material.emissiveIntensity = 0.5;
      setTimeout(() => {
        hit.material.emissive = origEmissive;
        hit.material.emissiveIntensity = origIntensity;
      }, 300);
    }
  }
});

// Double-click: zoom to
renderer.domElement.addEventListener('dblclick', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const allMeshes = [];
  for (const layer of LAYERS) {
    if (state.layers[layer.id].visible) {
      layerGroups[layer.id].traverse(child => {
        if (child.isMesh && child.userData.clickable) allMeshes.push(child);
      });
    }
  }

  const intersects = raycaster.intersectObjects(allMeshes, false);
  if (intersects.length > 0) {
    const pos = intersects[0].object.position.clone();
    // Get world position
    intersects[0].object.getWorldPosition(pos);
    const camDist = 0.6;
    const camPos = pos.clone().add(new THREE.Vector3(0, 0.1, camDist));
    animateCamera([camPos.x, camPos.y, camPos.z], [pos.x, pos.y, pos.z], 800);
  }
});

// ─── Animation Loop ───
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  // Pulse animations
  scene.traverse(child => {
    if (child.isMesh && child.userData.pulse) {
      const scale = 1 + Math.sin(elapsed * 3 + (child.userData.phase || 0)) * 0.1;
      child.scale.setScalar(scale);
    }
    if (child.isMesh && child.userData.floatParticle) {
      child.position.y += Math.sin(elapsed * 1.5 + child.userData.phase) * 0.0003;
      child.material.opacity = 0.15 + Math.sin(elapsed * 2 + child.userData.phase) * 0.15;
    }
  });

  // Heart pulse on organ layer
  if (state.layers.organs && state.layers.organs.visible) {
    layerGroups.organs.traverse(child => {
      if (child.userData.name === 'Heart') {
        const beat = Math.sin(elapsed * 4.5) * 0.5 + 0.5;
        child.scale.setScalar(1 + beat * 0.06);
      }
    });
  }

  controls.update();
  renderer.render(scene, camera);
}

// ─── Resize ───
window.addEventListener('resize', () => {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// ─── Init ───
advanceLoad(100);
updateLayerVisibility();
for (const layer of LAYERS) {
  updateLayerOpacity(layer.id);
}
animate();

// Show initial layer info
showLayerInfo(LAYERS[0]);
