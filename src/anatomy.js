// Procedural Anatomy Generator
// Builds simplified but anatomically-mapped 3D body from Three.js primitives

import * as THREE from 'three';

// Shared materials helper
function mat(color, opacity = 1.0, emissive = null) {
  return new THREE.MeshPhongMaterial({
    color, transparent: opacity < 1, opacity,
    side: THREE.DoubleSide, depthWrite: opacity > 0.5,
    emissive: emissive || new THREE.Color(0x000000),
    emissiveIntensity: emissive ? 0.3 : 0,
  });
}

function wireMat(color, opacity = 1.0) {
  return new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity, linewidth: 1 });
}

// ─── SKELETON (Layer 5) ───
export function buildSkeleton(group) {
  const boneMat = mat(0xeeeedd, 0.9);
  const jointMat = mat(0xddddcc, 0.9);

  function bone(x, y, z, rx, ry, rz, len, rad = 0.03) {
    const geo = new THREE.CylinderGeometry(rad * 0.8, rad, len, 8);
    const m = new THREE.Mesh(geo, boneMat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    m.userData = { system: 'skeleton', clickable: true };
    group.add(m);
    return m;
  }

  function joint(x, y, z, rad = 0.04) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 8, 8), jointMat);
    m.position.set(x, y, z);
    m.userData = { system: 'skeleton', clickable: true };
    group.add(m);
    return m;
  }

  // Spine
  const spineYs = [0.65, 0.75, 0.85, 0.95, 1.05, 1.15, 1.25, 1.35, 1.45, 1.55, 1.6];
  for (let i = 0; i < spineYs.length - 1; i++) {
    bone(0, (spineYs[i] + spineYs[i + 1]) / 2, -0.04, 0, 0, 0, spineYs[i + 1] - spineYs[i], 0.035);
    joint(0, spineYs[i], -0.04, 0.04);
  }

  // Skull
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), boneMat);
  skull.position.set(0, 1.78, 0);
  skull.scale.set(1, 1.15, 1);
  skull.userData = { system: 'skeleton', name: 'Skull', clickable: true };
  group.add(skull);

  // Jaw
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), boneMat);
  jaw.position.set(0, 1.63, 0.05);
  jaw.scale.set(1.4, 0.6, 1);
  jaw.userData = { system: 'skeleton', name: 'Mandible', clickable: true };
  group.add(jaw);

  // Neck vertebrae
  bone(0, 1.65, -0.02, 0, 0, 0, 0.08, 0.025);

  // Ribcage
  for (let i = 0; i < 12; i++) {
    const y = 1.35 - i * 0.045;
    const ribRad = 0.13 + (i < 6 ? i * 0.015 : (12 - i) * 0.01);
    const curve = new THREE.EllipseCurve(0, 0, ribRad, ribRad * 0.5, 0, Math.PI, false);
    const points = curve.getPoints(20).map(p => new THREE.Vector3(p.x, y, p.y * 0.7 + 0.05));
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 16, 0.01, 4);
    const rib = new THREE.Mesh(geo, boneMat);
    rib.userData = { system: 'skeleton', name: `Rib ${i + 1}`, clickable: true };
    group.add(rib);
    // Mirror
    const points2 = curve.getPoints(20).map(p => new THREE.Vector3(-p.x, y, p.y * 0.7 + 0.05));
    const geo2 = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points2), 16, 0.01, 4);
    const rib2 = new THREE.Mesh(geo2, boneMat);
    rib2.userData = { system: 'skeleton', name: `Rib ${i + 1}`, clickable: true };
    group.add(rib2);
  }

  // Sternum
  bone(0, 1.22, 0.1, 0, 0, 0, 0.22, 0.025);

  // Pelvis
  const pelvisShape = new THREE.TorusGeometry(0.14, 0.035, 8, 16, Math.PI);
  const pelvis = new THREE.Mesh(pelvisShape, boneMat);
  pelvis.position.set(0, 0.72, 0);
  pelvis.rotation.x = Math.PI / 2;
  pelvis.userData = { system: 'skeleton', name: 'Pelvis', clickable: true };
  group.add(pelvis);
  // Iliac
  for (const side of [-1, 1]) {
    const iliac = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), boneMat);
    iliac.position.set(side * 0.12, 0.75, 0);
    iliac.scale.set(1, 1.2, 0.5);
    iliac.userData = { system: 'skeleton', name: 'Ilium', clickable: true };
    group.add(iliac);
  }

  // Clavicles + Scapulae
  for (const side of [-1, 1]) {
    bone(side * 0.09, 1.45, 0.02, 0, 0, side * 0.15, 0.18, 0.015);
    const scap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.015), boneMat);
    scap.position.set(side * 0.14, 1.38, -0.08);
    scap.userData = { system: 'skeleton', name: 'Scapula', clickable: true };
    group.add(scap);
  }

  // Arms
  for (const side of [-1, 1]) {
    joint(side * 0.22, 1.42, 0, 0.04); // shoulder
    bone(side * 0.24, 1.24, 0, 0, 0, side * 0.06, 0.32, 0.025); // humerus
    joint(side * 0.26, 1.06, 0, 0.035); // elbow
    bone(side * 0.27, 0.88, 0.01, 0, 0, side * 0.03, 0.3, 0.02); // radius
    bone(side * 0.25, 0.88, -0.01, 0, 0, side * 0.03, 0.3, 0.018); // ulna
    joint(side * 0.28, 0.72, 0, 0.03); // wrist
    // Hand
    for (let f = 0; f < 5; f++) {
      const fx = side * (0.25 + f * 0.018 - 0.03);
      bone(fx, 0.64, 0.01 - f * 0.003, 0, 0, 0, 0.07, 0.008);
      bone(fx, 0.57, 0.01 - f * 0.003, 0, 0, 0, 0.05, 0.007);
    }
  }

  // Legs
  for (const side of [-1, 1]) {
    joint(side * 0.11, 0.68, 0, 0.045); // hip
    bone(side * 0.11, 0.48, 0, 0, 0, side * -0.02, 0.38, 0.035); // femur
    joint(side * 0.10, 0.28, 0, 0.04); // knee
    // Patella
    const patella = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), boneMat);
    patella.position.set(side * 0.10, 0.28, 0.04);
    patella.userData = { system: 'skeleton', name: 'Patella', clickable: true };
    group.add(patella);
    bone(side * 0.10, 0.11, 0, 0, 0, 0, 0.32, 0.028); // tibia
    bone(side * 0.12, 0.11, -0.01, 0, 0, 0, 0.3, 0.015); // fibula
    joint(side * 0.10, -0.05, 0.02, 0.03); // ankle
    // Foot
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.16), boneMat);
    foot.position.set(side * 0.10, -0.07, 0.06);
    foot.userData = { system: 'skeleton', name: 'Foot', clickable: true };
    group.add(foot);
  }
}

// ─── SKIN (Layer 0) ───
export function buildSkin(group) {
  const skinMat = mat(0xffb088, 0.3);
  skinMat.transparent = true;

  // Torso
  const torsoGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.8, 24, 1, false);
  const torso = new THREE.Mesh(torsoGeo, skinMat);
  torso.position.set(0, 1.05, 0);
  torso.userData = { system: 'skin', name: 'Torso', clickable: true };
  group.add(torso);

  // Head
  const headGeo = new THREE.SphereGeometry(0.14, 24, 24);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 1.78, 0.01);
  head.scale.set(1, 1.15, 0.95);
  head.userData = { system: 'skin', name: 'Head', clickable: true };
  group.add(head);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 12), skinMat);
  neck.position.set(0, 1.6, 0);
  neck.userData = { system: 'skin', name: 'Neck', clickable: true };
  group.add(neck);

  // Pelvis area
  const pelvisGeo = new THREE.SphereGeometry(0.18, 16, 16);
  const pelvisSkin = new THREE.Mesh(pelvisGeo, skinMat);
  pelvisSkin.position.set(0, 0.72, 0);
  pelvisSkin.scale.set(1, 0.6, 0.8);
  pelvisSkin.userData = { system: 'skin', clickable: true };
  group.add(pelvisSkin);

  // Arms
  for (const side of [-1, 1]) {
    // Upper arm
    const ua = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.34, 10), skinMat);
    ua.position.set(side * 0.24, 1.24, 0);
    ua.userData = { system: 'skin', name: 'Upper Arm', clickable: true };
    group.add(ua);
    // Shoulder
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), skinMat);
    sh.position.set(side * 0.22, 1.42, 0);
    sh.userData = { system: 'skin', clickable: true };
    group.add(sh);
    // Forearm
    const fa = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.32, 10), skinMat);
    fa.position.set(side * 0.27, 0.88, 0);
    fa.userData = { system: 'skin', name: 'Forearm', clickable: true };
    group.add(fa);
    // Hand
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.03), skinMat);
    hand.position.set(side * 0.27, 0.63, 0.01);
    hand.userData = { system: 'skin', name: 'Hand', clickable: true };
    group.add(hand);
  }

  // Legs
  for (const side of [-1, 1]) {
    // Thigh
    const th = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.4, 12), skinMat);
    th.position.set(side * 0.11, 0.48, 0);
    th.userData = { system: 'skin', name: 'Thigh', clickable: true };
    group.add(th);
    // Calf
    const cf = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.038, 0.34, 12), skinMat);
    cf.position.set(side * 0.10, 0.11, 0);
    cf.userData = { system: 'skin', name: 'Calf', clickable: true };
    group.add(cf);
    // Foot
    const ft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.18), skinMat);
    ft.position.set(side * 0.10, -0.07, 0.06);
    ft.userData = { system: 'skin', name: 'Foot', clickable: true };
    group.add(ft);
  }
}

// ─── MUSCLES (Layer 1) ───
export function buildMuscles(group) {
  const muscleMat = mat(0xcc4455, 0.8);

  function muscleShape(x, y, z, sx, sy, sz, name) {
    const geo = new THREE.SphereGeometry(0.5, 10, 10);
    const m = new THREE.Mesh(geo, muscleMat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.userData = { system: 'muscles', name, clickable: true };
    group.add(m);
  }

  // Pectorals
  for (const side of [-1, 1]) {
    muscleShape(side * 0.08, 1.34, 0.09, 0.14, 0.1, 0.06, 'Pectoralis Major');
  }
  // Deltoids
  for (const side of [-1, 1]) {
    muscleShape(side * 0.2, 1.42, 0, 0.07, 0.08, 0.06, 'Deltoid');
  }
  // Biceps
  for (const side of [-1, 1]) {
    muscleShape(side * 0.24, 1.2, 0.03, 0.04, 0.12, 0.04, 'Biceps Brachii');
  }
  // Triceps
  for (const side of [-1, 1]) {
    muscleShape(side * 0.24, 1.2, -0.03, 0.035, 0.11, 0.04, 'Triceps Brachii');
  }
  // Forearm muscles
  for (const side of [-1, 1]) {
    muscleShape(side * 0.265, 0.92, 0, 0.035, 0.1, 0.03, 'Forearm Flexors');
  }
  // Trapezius
  muscleShape(0, 1.45, -0.06, 0.18, 0.08, 0.04, 'Trapezius');
  // Lats
  for (const side of [-1, 1]) {
    muscleShape(side * 0.1, 1.2, -0.06, 0.1, 0.15, 0.04, 'Latissimus Dorsi');
  }
  // Abs
  for (let i = 0; i < 4; i++) {
    for (const side of [-1, 1]) {
      muscleShape(side * 0.04, 1.12 - i * 0.06, 0.1, 0.04, 0.03, 0.02, 'Rectus Abdominis');
    }
  }
  // Obliques
  for (const side of [-1, 1]) {
    muscleShape(side * 0.13, 1.0, 0.04, 0.05, 0.14, 0.04, 'External Oblique');
  }
  // Glutes
  for (const side of [-1, 1]) {
    muscleShape(side * 0.09, 0.72, -0.05, 0.09, 0.08, 0.07, 'Gluteus Maximus');
  }
  // Quads
  for (const side of [-1, 1]) {
    muscleShape(side * 0.11, 0.48, 0.03, 0.06, 0.16, 0.05, 'Quadriceps');
  }
  // Hamstrings
  for (const side of [-1, 1]) {
    muscleShape(side * 0.11, 0.48, -0.03, 0.05, 0.15, 0.04, 'Hamstrings');
  }
  // Calves
  for (const side of [-1, 1]) {
    muscleShape(side * 0.10, 0.16, -0.01, 0.04, 0.1, 0.04, 'Gastrocnemius');
  }
  // Erector spinae
  for (const side of [-1, 1]) {
    muscleShape(side * 0.04, 1.1, -0.07, 0.03, 0.25, 0.03, 'Erector Spinae');
  }
}

// ─── ORGANS (Layer 2) ───
export function buildOrgans(group) {
  // Heart
  const heartMat = mat(0xcc2233, 0.9);
  const heartGeo = new THREE.SphereGeometry(0.05, 12, 12);
  const heart = new THREE.Mesh(heartGeo, heartMat);
  heart.position.set(0.02, 1.28, 0.04);
  heart.scale.set(1.0, 1.2, 0.9);
  heart.userData = { system: 'organs', name: 'Heart', subOrgan: 'heart', clickable: true,
    detail: 'Cardiac KCNQ1 — the rhythm gate. KCNQ1 mutations = Long QT syndrome.' };
  group.add(heart);
  // Heart glow
  const heartGlow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), mat(0xff3344, 0.15, new THREE.Color(0xff3344)));
  heartGlow.position.copy(heart.position);
  heartGlow.userData = { system: 'organs', pulse: true };
  group.add(heartGlow);

  // Lungs
  for (const side of [-1, 1]) {
    const lungMat = mat(0xcc7799, 0.85);
    const lung = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), lungMat);
    lung.position.set(side * 0.09, 1.3, 0.02);
    lung.scale.set(0.8, 1.2, 0.7);
    lung.userData = { system: 'organs', name: side === -1 ? 'Left Lung' : 'Right Lung', subOrgan: 'lungs', clickable: true,
      detail: 'Gas exchange gate — O2 in, CO2 out. Montelukast acts here.' };
    group.add(lung);
  }

  // Liver
  const liverMat = mat(0x884422, 0.9);
  const liver = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), liverMat);
  liver.position.set(0.06, 1.14, 0.04);
  liver.scale.set(1.4, 0.8, 0.7);
  liver.userData = { system: 'organs', name: 'Liver', subOrgan: 'liver', clickable: true,
    detail: 'Detox gate — where alcohol meets quercetin. Hepatoprotective target.' };
  group.add(liver);

  // Stomach
  const stomachMat = mat(0xcc8844, 0.85);
  const stomach = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), stomachMat);
  stomach.position.set(-0.04, 1.12, 0.03);
  stomach.scale.set(1.0, 1.1, 0.8);
  stomach.userData = { system: 'organs', name: 'Stomach', subOrgan: 'stomach', clickable: true,
    detail: 'Acid gate — KCNQ1 controls gastric acid secretion.' };
  group.add(stomach);

  // Kidneys
  for (const side of [-1, 1]) {
    const kidneyMat = mat(0x993333, 0.9);
    const kidney = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), kidneyMat);
    kidney.position.set(side * 0.08, 1.05, -0.04);
    kidney.scale.set(0.7, 1.2, 0.6);
    kidney.userData = { system: 'organs', name: side === -1 ? 'Left Kidney' : 'Right Kidney', subOrgan: 'kidneys', clickable: true,
      detail: 'Electrolyte gate — K+ balance lives here literally.' };
    group.add(kidney);
  }

  // Intestines
  const intestineMat = mat(0xcc8866, 0.8);
  const intestinePoints = [];
  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const x = Math.sin(t * 12) * (0.06 - t * 0.02);
    const y = 0.88 - t * 0.18;
    const z = Math.cos(t * 12) * 0.03 + 0.02;
    intestinePoints.push(new THREE.Vector3(x, y, z));
  }
  const intestineCurve = new THREE.CatmullRomCurve3(intestinePoints);
  const intestineGeo = new THREE.TubeGeometry(intestineCurve, 60, 0.02, 8);
  const intestines = new THREE.Mesh(intestineGeo, intestineMat);
  intestines.userData = { system: 'organs', name: 'Intestines', subOrgan: 'intestines', clickable: true,
    detail: 'Nutrient gate — 500M neurons, second brain. The gut-brain axis IS the R0-R2 bus.' };
  group.add(intestines);

  // Large intestine (colon frame)
  const colonPoints = [
    new THREE.Vector3(0.08, 0.75, 0.02),
    new THREE.Vector3(0.1, 0.9, 0.02),
    new THREE.Vector3(0.06, 1.0, 0.02),
    new THREE.Vector3(-0.06, 1.0, 0.02),
    new THREE.Vector3(-0.1, 0.9, 0.02),
    new THREE.Vector3(-0.08, 0.75, 0.02),
  ];
  const colonCurve = new THREE.CatmullRomCurve3(colonPoints);
  const colonGeo = new THREE.TubeGeometry(colonCurve, 30, 0.025, 8);
  const colon = new THREE.Mesh(colonGeo, intestineMat);
  colon.userData = { system: 'organs', name: 'Large Intestine', clickable: true };
  group.add(colon);

  // Bladder
  const bladder = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), mat(0xaaaa55, 0.8));
  bladder.position.set(0, 0.73, 0.04);
  bladder.userData = { system: 'organs', name: 'Bladder', clickable: true };
  group.add(bladder);

  // Spleen
  const spleen = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), mat(0x773344, 0.85));
  spleen.position.set(-0.1, 1.14, -0.01);
  spleen.userData = { system: 'organs', name: 'Spleen', clickable: true };
  group.add(spleen);

  // Diaphragm
  const diaGeo = new THREE.CircleGeometry(0.16, 24);
  const dia = new THREE.Mesh(diaGeo, mat(0xcc7777, 0.5));
  dia.position.set(0, 1.2, 0);
  dia.rotation.x = -Math.PI / 2;
  dia.userData = { system: 'organs', name: 'Diaphragm', clickable: true };
  group.add(dia);
}

// ─── VESSELS (Layer 3) ───
export function buildVessels(group) {
  const arteryMat = mat(0xee3333, 0.7);
  const veinMat = mat(0x3344cc, 0.7);
  const lymphMat = mat(0x44cc66, 0.6);

  function vessel(points, material, radius = 0.008, name = 'Vessel') {
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, Math.max(points.length * 4, 12), radius, 6);
    const m = new THREE.Mesh(geo, material);
    m.userData = { system: 'vessels', name, clickable: true };
    group.add(m);
    return m;
  }

  // Aorta
  vessel([
    new THREE.Vector3(0.02, 1.28, 0.03),
    new THREE.Vector3(0.02, 1.35, 0.01),
    new THREE.Vector3(0, 1.38, -0.02),
    new THREE.Vector3(0, 1.2, -0.04),
    new THREE.Vector3(0, 1.0, -0.03),
    new THREE.Vector3(0, 0.8, -0.02),
    new THREE.Vector3(0.01, 0.72, 0),
  ], arteryMat, 0.012, 'Aorta');

  // Vena cava
  vessel([
    new THREE.Vector3(-0.02, 1.28, 0.02),
    new THREE.Vector3(-0.02, 1.1, 0.01),
    new THREE.Vector3(-0.01, 0.9, 0),
    new THREE.Vector3(0, 0.72, 0.01),
  ], veinMat, 0.014, 'Vena Cava');

  // Carotid arteries
  for (const side of [-1, 1]) {
    vessel([
      new THREE.Vector3(0, 1.38, -0.01),
      new THREE.Vector3(side * 0.03, 1.5, 0),
      new THREE.Vector3(side * 0.04, 1.6, 0.01),
      new THREE.Vector3(side * 0.04, 1.7, 0.02),
    ], arteryMat, 0.007, 'Carotid Artery');
  }

  // Subclavian → arm arteries
  for (const side of [-1, 1]) {
    vessel([
      new THREE.Vector3(0, 1.38, -0.01),
      new THREE.Vector3(side * 0.1, 1.42, 0),
      new THREE.Vector3(side * 0.22, 1.4, 0),
      new THREE.Vector3(side * 0.24, 1.2, 0.01),
      new THREE.Vector3(side * 0.26, 1.0, 0.01),
      new THREE.Vector3(side * 0.27, 0.85, 0.01),
      new THREE.Vector3(side * 0.27, 0.7, 0.01),
    ], arteryMat, 0.006, 'Brachial Artery');

    // Arm veins (slightly offset)
    vessel([
      new THREE.Vector3(side * 0.27, 0.7, -0.01),
      new THREE.Vector3(side * 0.27, 0.85, -0.01),
      new THREE.Vector3(side * 0.25, 1.05, -0.01),
      new THREE.Vector3(side * 0.22, 1.4, -0.01),
      new THREE.Vector3(side * 0.1, 1.42, -0.01),
      new THREE.Vector3(0, 1.35, 0),
    ], veinMat, 0.005, 'Brachial Vein');
  }

  // Iliac → femoral → leg arteries
  for (const side of [-1, 1]) {
    vessel([
      new THREE.Vector3(0, 0.72, 0),
      new THREE.Vector3(side * 0.06, 0.68, 0.01),
      new THREE.Vector3(side * 0.1, 0.55, 0.02),
      new THREE.Vector3(side * 0.1, 0.35, 0.02),
      new THREE.Vector3(side * 0.1, 0.15, 0.01),
      new THREE.Vector3(side * 0.1, -0.05, 0.03),
    ], arteryMat, 0.007, 'Femoral Artery');

    vessel([
      new THREE.Vector3(side * 0.1, -0.05, -0.01),
      new THREE.Vector3(side * 0.1, 0.15, -0.01),
      new THREE.Vector3(side * 0.1, 0.35, -0.02),
      new THREE.Vector3(side * 0.1, 0.55, -0.01),
      new THREE.Vector3(side * 0.06, 0.68, -0.01),
      new THREE.Vector3(-0.01, 0.72, 0.01),
    ], veinMat, 0.006, 'Femoral Vein');
  }

  // Renal arteries
  for (const side of [-1, 1]) {
    vessel([
      new THREE.Vector3(0, 1.05, -0.03),
      new THREE.Vector3(side * 0.04, 1.05, -0.035),
      new THREE.Vector3(side * 0.08, 1.05, -0.04),
    ], arteryMat, 0.005, 'Renal Artery');
  }

  // Hepatic artery
  vessel([
    new THREE.Vector3(0, 1.1, -0.02),
    new THREE.Vector3(0.04, 1.12, 0.01),
    new THREE.Vector3(0.06, 1.14, 0.03),
  ], arteryMat, 0.005, 'Hepatic Artery');

  // Pulmonary
  vessel([
    new THREE.Vector3(0.02, 1.28, 0.04),
    new THREE.Vector3(-0.02, 1.32, 0.03),
    new THREE.Vector3(-0.08, 1.3, 0.02),
  ], arteryMat, 0.006, 'Pulmonary Artery');
  vessel([
    new THREE.Vector3(0.02, 1.28, 0.04),
    new THREE.Vector3(0.04, 1.32, 0.03),
    new THREE.Vector3(0.08, 1.3, 0.02),
  ], arteryMat, 0.006, 'Pulmonary Artery');

  // Lymph nodes (simplified)
  const lymphPositions = [
    [0.04, 1.55, 0.02], [-0.04, 1.55, 0.02], // cervical
    [0.18, 1.38, 0], [-0.18, 1.38, 0], // axillary
    [0.06, 0.72, 0.03], [-0.06, 0.72, 0.03], // inguinal
  ];
  for (const pos of lymphPositions) {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), lymphMat);
    node.position.set(...pos);
    node.userData = { system: 'vessels', name: 'Lymph Node', clickable: true };
    group.add(node);
  }

  // Lymphatic vessels (simplified chains)
  vessel([
    new THREE.Vector3(0, 0.72, 0.03),
    new THREE.Vector3(0, 0.9, 0.03),
    new THREE.Vector3(0, 1.1, 0.02),
    new THREE.Vector3(0, 1.3, 0.02),
    new THREE.Vector3(0.02, 1.45, 0.02),
  ], lymphMat, 0.004, 'Thoracic Duct');
}

// ─── NERVES (Layer 4) ───
export function buildNerves(group) {
  const nerveMat = mat(0xaa44ff, 0.8);
  const vagusColor = mat(0xffcc00, 0.9, new THREE.Color(0xffcc00));
  const brainMat = mat(0xddaaff, 0.7);

  function nerve(points, material, radius = 0.005, name = 'Nerve') {
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, Math.max(points.length * 4, 12), radius, 5);
    const m = new THREE.Mesh(geo, material);
    m.userData = { system: 'nerves', name, clickable: true };
    group.add(m);
    return m;
  }

  // Brain
  const brain = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 20), brainMat);
  brain.position.set(0, 1.78, -0.01);
  brain.scale.set(1, 0.9, 1.1);
  brain.userData = { system: 'nerves', name: 'Brain', clickable: true,
    detail: 'R4 (Executive) = prefrontal cortex. R5 (Identity) = default mode network. R6 (Observer) = anterior cingulate + insular cortex.' };
  group.add(brain);

  // Brain structures (visible as slight bumps)
  // Cerebellum
  const cerebellum = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), brainMat);
  cerebellum.position.set(0, 1.72, -0.08);
  cerebellum.userData = { system: 'nerves', name: 'Cerebellum', clickable: true };
  group.add(cerebellum);

  // Brain stem
  const brainstem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.06, 8), brainMat);
  brainstem.position.set(0, 1.67, -0.04);
  brainstem.userData = { system: 'nerves', name: 'Brain Stem', clickable: true };
  group.add(brainstem);

  // Spinal cord
  const spinalPoints = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    spinalPoints.push(new THREE.Vector3(0, 1.65 - t * 1.0, -0.04 + t * 0.01));
  }
  nerve(spinalPoints, nerveMat, 0.012, 'Spinal Cord');

  // Spinal nerve pairs
  for (let i = 0; i < 15; i++) {
    const y = 1.55 - i * 0.06;
    for (const side of [-1, 1]) {
      nerve([
        new THREE.Vector3(0, y, -0.04),
        new THREE.Vector3(side * 0.06, y, -0.02),
        new THREE.Vector3(side * 0.12, y, 0),
      ], nerveMat, 0.003, 'Spinal Nerve');
    }
  }

  // Brachial plexus → arm nerves
  for (const side of [-1, 1]) {
    nerve([
      new THREE.Vector3(0, 1.5, -0.03),
      new THREE.Vector3(side * 0.08, 1.46, -0.01),
      new THREE.Vector3(side * 0.18, 1.42, 0),
      new THREE.Vector3(side * 0.24, 1.3, 0),
      new THREE.Vector3(side * 0.26, 1.1, 0),
      new THREE.Vector3(side * 0.27, 0.9, 0),
      new THREE.Vector3(side * 0.28, 0.7, 0),
    ], nerveMat, 0.004, 'Brachial Plexus');
  }

  // Sciatic → leg nerves
  for (const side of [-1, 1]) {
    nerve([
      new THREE.Vector3(0, 0.72, -0.04),
      new THREE.Vector3(side * 0.06, 0.68, -0.03),
      new THREE.Vector3(side * 0.1, 0.55, -0.03),
      new THREE.Vector3(side * 0.1, 0.35, -0.03),
      new THREE.Vector3(side * 0.1, 0.15, -0.02),
      new THREE.Vector3(side * 0.1, -0.02, -0.01),
    ], nerveMat, 0.005, 'Sciatic Nerve');
  }

  // Vagus nerve (GOLD — highlighted)
  for (const side of [-1, 1]) {
    const vagus = nerve([
      new THREE.Vector3(side * 0.02, 1.67, -0.03),
      new THREE.Vector3(side * 0.03, 1.55, 0),
      new THREE.Vector3(side * 0.025, 1.45, 0.01),
      new THREE.Vector3(side * 0.02, 1.3, 0.02),
      new THREE.Vector3(side * 0.02, 1.15, 0.02),
      new THREE.Vector3(side * 0.01, 1.0, 0.01),
      new THREE.Vector3(side * 0.02, 0.85, 0.02),
    ], vagusColor, 0.005, 'Vagus Nerve');
    vagus.userData.isVagus = true;
  }

  // Sympathetic chain
  for (const side of [-1, 1]) {
    const symp = [];
    for (let i = 0; i <= 12; i++) {
      symp.push(new THREE.Vector3(side * 0.05, 1.55 - i * 0.06, -0.05));
    }
    nerve(symp, mat(0xff6644, 0.6), 0.003, 'Sympathetic Chain');
  }
}

// ─── ENERGY (Layer 6) ───
export function buildEnergy(group) {
  // Aura shell
  const auraMat = new THREE.MeshPhongMaterial({
    color: 0xffd700, transparent: true, opacity: 0.08,
    side: THREE.DoubleSide, emissive: 0xffd700, emissiveIntensity: 0.2,
  });

  const aura = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 32), auraMat);
  aura.position.set(0, 1.05, 0);
  aura.scale.set(1, 2.2, 0.8);
  aura.userData = { system: 'energy', name: 'Bioelectric Field', clickable: true };
  group.add(aura);

  // Head aura
  const headAura = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), auraMat);
  headAura.position.set(0, 1.78, 0);
  headAura.userData = { system: 'energy' };
  group.add(headAura);

  // Chakra/energy points along spine
  const energyPoints = [
    { y: 0.72, color: 0xff0000, name: 'Root (R0)' },
    { y: 0.85, color: 0xff6600, name: 'Sacral (R1)' },
    { y: 1.0, color: 0xffcc00, name: 'Solar Plexus (R2)' },
    { y: 1.25, color: 0x00cc44, name: 'Heart (R3)' },
    { y: 1.45, color: 0x0088ff, name: 'Throat (R4)' },
    { y: 1.7, color: 0x4400ff, name: 'Third Eye (R5)' },
    { y: 1.88, color: 0xaa00ff, name: 'Crown (R6/R7)' },
  ];

  for (const ep of energyPoints) {
    const pointMat = new THREE.MeshPhongMaterial({
      color: ep.color, transparent: true, opacity: 0.4,
      emissive: ep.color, emissiveIntensity: 0.5,
    });
    const point = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), pointMat);
    point.position.set(0, ep.y, 0.02);
    point.userData = { system: 'energy', name: ep.name, clickable: true, pulse: true };
    group.add(point);

    // Ring around point
    const ringGeo = new THREE.TorusGeometry(0.04, 0.003, 8, 24);
    const ring = new THREE.Mesh(ringGeo, pointMat);
    ring.position.copy(point.position);
    ring.rotation.x = Math.PI / 2;
    ring.userData = { system: 'energy', pulse: true };
    group.add(ring);
  }

  // Particle field (using small spheres since we're not using a particle system)
  for (let i = 0; i < 80; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = 0.3 + Math.random() * 0.2;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = 0.5 + Math.random() * 1.5;
    const z = r * Math.sin(phi) * Math.sin(theta) * 0.7;
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.3 });
    const particle = new THREE.Mesh(new THREE.SphereGeometry(0.004, 4, 4), pMat);
    particle.position.set(x, y, z);
    particle.userData = { system: 'energy', floatParticle: true, phase: Math.random() * Math.PI * 2 };
    group.add(particle);
  }
}

// ─── K+ Channel Map Overlay ───
export function buildKChannelMap(group) {
  const kcMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.9 });

  const locations = [
    // Skin mechanoreceptors - KCNQ4
    { pos: [0.14, 1.3, 0.12], label: 'KCNQ4' },
    { pos: [-0.14, 1.3, 0.12], label: 'KCNQ4' },
    { pos: [0.1, 0.5, 0.06], label: 'KCNQ4' },
    { pos: [-0.1, 0.5, 0.06], label: 'KCNQ4' },
    { pos: [0.27, 0.65, 0.02], label: 'KCNQ4' },
    // Brain - KCNQ2/3/5
    { pos: [0.04, 1.82, 0.02], label: 'KCNQ2/3' },
    { pos: [-0.04, 1.82, 0.02], label: 'KCNQ2/3' },
    { pos: [0, 1.75, -0.04], label: 'KCNQ5' },
    { pos: [0.05, 1.78, 0.06], label: 'KCNQ3' },
    // Heart - KCNQ1
    { pos: [0.02, 1.28, 0.06], label: 'KCNQ1' },
    // Gut - KCNQ1
    { pos: [0, 0.88, 0.05], label: 'KCNQ1' },
    { pos: [-0.04, 1.12, 0.06], label: 'KCNQ1' },
    // Vascular - KCNQ4/5
    { pos: [0, 1.38, 0], label: 'KCNQ5' },
    { pos: [0.1, 1.05, -0.05], label: 'KCNQ4' },
    // Motor neurons - KCNQ2/3
    { pos: [0.2, 1.42, 0.03], label: 'KCNQ2/3' },
    { pos: [-0.2, 1.42, 0.03], label: 'KCNQ2/3' },
    { pos: [0.11, 0.48, 0.05], label: 'KCNQ2/3' },
    { pos: [-0.11, 0.48, 0.05], label: 'KCNQ2/3' },
  ];

  for (const loc of locations) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), kcMat);
    dot.position.set(...loc.pos);
    dot.userData = { system: 'kchannel', name: loc.label, clickable: true, pulse: true };
    group.add(dot);
    // Halo
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.01, 0.015, 12),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    halo.position.copy(dot.position);
    halo.userData = { system: 'kchannel', pulse: true };
    group.add(halo);
  }
}

// ─── Drug target highlights ───
export function buildDrugHighlights(group, drugId) {
  const drugData = {
    dextroamphetamine: { color: 0xff8833, positions: [[0, 1.78, 0.05]] },
    montelukast: { color: 0xbb44ff, positions: [[0.09, 1.3, 0.04], [-0.09, 1.3, 0.04], [0, 0.88, 0.04], [0, 1.78, 0.05]] },
    alcohol: { color: 0xff4444, positions: [[0.06, 1.14, 0.06], [0, 0.88, 0.04], [0, 1.78, 0.05]] },
    quercetin: { color: 0x44cc66, positions: [[0.06, 1.14, 0.06], [0, 0.88, 0.04], [0, 1.78, 0.05]] },
    rosemary: { color: 0x00cc44, positions: [[0, 1.78, 0.05]] },
  };

  const d = drugData[drugId];
  if (!d) return;

  for (const pos of d.positions) {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 12),
      new THREE.MeshPhongMaterial({
        color: d.color, transparent: true, opacity: 0.5,
        emissive: d.color, emissiveIntensity: 0.6,
      })
    );
    glow.position.set(...pos);
    glow.userData = { system: 'drug', drugId, pulse: true };
    group.add(glow);
  }
}

// ─── Dual view connector (R7 golden fibers) ───
export function buildDualConnectors(group, offset = 1.5) {
  const fiberMat = new THREE.MeshBasicMaterial({
    color: 0xffd700, transparent: true, opacity: 0.3,
  });

  const connectionPoints = [
    [0, 1.78, 0], // head
    [0.02, 1.28, 0.04], // heart
    [0, 1.0, 0.02], // solar plexus
    [0.18, 1.38, 0], [-0.18, 1.38, 0], // hands area
  ];

  for (const pt of connectionPoints) {
    const start = new THREE.Vector3(pt[0] - offset / 2, pt[1], pt[2]);
    const end = new THREE.Vector3(pt[0] + offset / 2, pt[1], pt[2]);
    const mid = new THREE.Vector3(pt[0], pt[1] + 0.1, pt[2] + 0.3);
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    const geo = new THREE.TubeGeometry(curve, 20, 0.003, 4);
    const fiber = new THREE.Mesh(geo, fiberMat);
    fiber.userData = { system: 'dual', pulse: true };
    group.add(fiber);
  }
}
