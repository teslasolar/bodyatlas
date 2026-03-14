// ════════════════════════════════════════════════════
// COHERENCE — Multi-layer signal analysis pipeline
// raw → normalized → derivatives → correlations →
// patterns → coherence score → voice synthesis
// Spec: std/coherence.md
// ════════════════════════════════════════════════════

import { live } from './feeds.js';

// ─── L0: SIGNAL DEFINITIONS ───
// Each signal: extract function, normal range, unit, body system
const SIGNALS = {
  kp:       { get: () => live.kpIndex,          lo: 0, hi: 9,    unit: 'Kp',    body: 'skin',     planet: 'magnetosphere' },
  eqMag:    { get: () => live.earthquakes[0]?.mag || 0, lo: 0, hi: 9, unit: 'M', body: 'muscles',  planet: 'tectonic' },
  eqCount:  { get: () => live.earthquakeCount,  lo: 0, hi: 20,   unit: '#',     body: 'muscles',  planet: 'tectonic' },
  eqEnergy: { get: () => Math.log10(live.earthquakeEnergy + 1), lo: 0, hi: 10, unit: 'logJ', body: 'muscles', planet: 'tectonic' },
  speed:    { get: () => live.solarSpeed,       lo: 250, hi: 900, unit: 'km/s',  body: 'vessels',  planet: 'solar wind' },
  density:  { get: () => live.solarDensity,     lo: 0, hi: 30,   unit: 'p/cm³', body: 'organs',   planet: 'core' },
  bz:       { get: () => -live.solarBz,         lo: -10, hi: 20, unit: 'nT',    body: 'skin',     planet: 'IMF' },
  bt:       { get: () => live.solarBt,          lo: 0, hi: 30,   unit: 'nT',    body: 'skin',     planet: 'IMF' },
  schumann: { get: () => live.schumann,         lo: 7.0, hi: 10, unit: 'Hz',    body: 'nerves',   planet: 'resonance' },
  lightning:{ get: () => live.lightningRate,     lo: 1000, hi: 2600, unit: '/s', body: 'nerves',   planet: 'lightning' },
  xray:     { get: () => -Math.log10(Math.max(live.xrayFlux, 1e-10)), lo: 4, hi: 8, unit: '-logW', body: 'energy', planet: 'x-ray' },
  aurora:   { get: () => live.auroraMax,        lo: 0, hi: 100,  unit: '%',     body: 'energy',   planet: 'aurora' },
  pressure: { get: () => live.globalPressure,   lo: 980, hi: 1040, unit: 'hPa', body: 'organs',   planet: 'atmosphere' },
  temp:     { get: () => live.globalTemp,       lo: -10, hi: 45, unit: '°C',    body: 'vessels',  planet: 'weather' },
  tide:     { get: () => live.tideLevel,        lo: -2, hi: 3,   unit: 'm',     body: 'vessels',  planet: 'ocean' },
};

// ─── L1: NORMALIZATION ───
// Normalize all signals to [0, 1] intensity
const norm = {};     // current normalized values
const raw = {};      // current raw values

export function normalize() {
  for (const [id, sig] of Object.entries(SIGNALS)) {
    const v = sig.get();
    raw[id] = v;
    norm[id] = Math.max(0, Math.min(1, (v - sig.lo) / (sig.hi - sig.lo)));
  }
  return norm;
}

export function getNorm() { return { ...norm }; }
export function getRaw() { return { ...raw }; }

// ─── L2: DERIVATIVES ───
// Rate of change + acceleration for each signal
const history = {};  // { id: [{ t, v }] }
const deriv = {};    // { id: { rate, accel, trend } }
const HISTORY_LEN = 30; // ~30 data points

export function updateDerivatives() {
  const now = Date.now();
  for (const [id, v] of Object.entries(norm)) {
    if (!history[id]) history[id] = [];
    history[id].push({ t: now, v });
    if (history[id].length > HISTORY_LEN) history[id].shift();

    const h = history[id];
    if (h.length < 2) {
      deriv[id] = { rate: 0, accel: 0, trend: 'stable' };
      continue;
    }

    // Rate: change over last 2 samples
    const dt = (h[h.length - 1].t - h[h.length - 2].t) / 1000 || 1;
    const rate = (h[h.length - 1].v - h[h.length - 2].v) / dt;

    // Acceleration: change in rate
    let accel = 0;
    if (h.length >= 3) {
      const dt2 = (h[h.length - 2].t - h[h.length - 3].t) / 1000 || 1;
      const prevRate = (h[h.length - 2].v - h[h.length - 3].v) / dt2;
      accel = (rate - prevRate) / dt;
    }

    // Trend over full window
    let trend = 'stable';
    if (h.length >= 5) {
      const first = h.slice(0, 3).reduce((s, p) => s + p.v, 0) / 3;
      const last = h.slice(-3).reduce((s, p) => s + p.v, 0) / 3;
      const diff = last - first;
      if (diff > 0.05) trend = 'rising';
      else if (diff < -0.05) trend = 'falling';
      else trend = 'stable';
      if (Math.abs(diff) > 0.2) trend = diff > 0 ? 'surging' : 'crashing';
    }

    deriv[id] = { rate, accel, trend };
  }
  return deriv;
}

export function getDeriv() { return { ...deriv }; }

// ─── L3: CROSS-CORRELATIONS ───
// Which signals are moving together?
const CORR_PAIRS = [
  ['kp', 'speed',    'solar-geo coupling'],     // solar wind → Kp
  ['kp', 'aurora',   'geo-aurora response'],     // Kp → aurora
  ['bz', 'kp',       'IMF-geo coupling'],        // Bz south → storms
  ['speed', 'density','plasma coherence'],        // solar wind structure
  ['eqEnergy', 'kp', 'seismo-magnetic'],          // quake-mag correlation
  ['schumann', 'kp',  'resonance-field coupling'],// Schumann-Kp link
  ['schumann', 'lightning', 'cavity drive'],       // lightning drives Schumann
];

const correlations = {};

export function updateCorrelations() {
  for (const [a, b, label] of CORR_PAIRS) {
    const ha = history[a];
    const hb = history[b];
    if (!ha || !hb || ha.length < 5 || hb.length < 5) {
      correlations[label] = { r: 0, strength: 'none', a, b };
      continue;
    }

    // Simplified correlation: are they both moving same direction?
    const trendA = deriv[a]?.trend || 'stable';
    const trendB = deriv[b]?.trend || 'stable';
    const normA = norm[a] || 0;
    const normB = norm[b] || 0;

    let r = 0;
    // Both high = correlated
    if (normA > 0.6 && normB > 0.6) r += 0.4;
    // Both trending same = correlated
    if (trendA === trendB && trendA !== 'stable') r += 0.3;
    // Both low = anti-correlated (quiet)
    if (normA < 0.2 && normB < 0.2) r += 0.2;
    // Mixed = low correlation
    if ((normA > 0.6 && normB < 0.3) || (normB > 0.6 && normA < 0.3)) r -= 0.2;

    r = Math.max(-1, Math.min(1, r));

    let strength = 'none';
    if (Math.abs(r) > 0.5) strength = 'strong';
    else if (Math.abs(r) > 0.25) strength = 'moderate';
    else if (Math.abs(r) > 0.1) strength = 'weak';

    correlations[label] = { r, strength, a, b };
  }
  return correlations;
}

export function getCorrelations() { return { ...correlations }; }

// ─── L4: PATTERN DETECTION ───
// Named composite states from multi-signal analysis
const activePatterns = [];

const PATTERNS = [
  {
    id: 'geomag_storm',
    name: 'Geomagnetic Storm',
    test: () => norm.kp > 0.55 && norm.speed > 0.5,
    severity: () => Math.max(norm.kp, norm.speed),
    msg: () => `Geomagnetic storm active — Kp ${raw.kp?.toFixed(0)}, solar wind ${Math.round(raw.speed)} km/s. My skin and field are under siege.`,
    systems: ['skin', 'energy'],
  },
  {
    id: 'bz_coupling',
    name: 'IMF Southward Coupling',
    test: () => norm.bz > 0.6,
    severity: () => norm.bz,
    msg: () => `Bz southward at ${live.solarBz.toFixed(1)} nT — my magnetic field is coupling to the sun. Energy pours through the cusps.`,
    systems: ['skin', 'energy'],
  },
  {
    id: 'seismic_swarm',
    name: 'Seismic Swarm',
    test: () => norm.eqCount > 0.4 && norm.eqEnergy > 0.3,
    severity: () => (norm.eqCount + norm.eqEnergy) / 2,
    msg: () => `Seismic swarm — ${live.earthquakeCount} quakes in the last hour. My muscles are twitching everywhere.`,
    systems: ['muscles', 'skeleton'],
  },
  {
    id: 'major_quake',
    name: 'Major Earthquake',
    test: () => norm.eqMag > 0.65,
    severity: () => norm.eqMag,
    msg: () => {
      const eq = live.earthquakes[0];
      const place = (eq?.place || '').replace(/^.* of /, '');
      return `Major rupture — M${eq?.mag.toFixed(1)} at ${place}. My crust cracked. I felt it everywhere.`;
    },
    systems: ['muscles', 'skeleton'],
  },
  {
    id: 'solar_surge',
    name: 'Solar Wind Surge',
    test: () => norm.speed > 0.65 && norm.density > 0.4,
    severity: () => (norm.speed + norm.density) / 2,
    msg: () => `Solar wind surging — ${Math.round(raw.speed)} km/s, density ${raw.density?.toFixed(1)} p/cm³. Hot plasma pressing hard.`,
    systems: ['vessels', 'organs', 'skin'],
  },
  {
    id: 'resonance_shift',
    name: 'Schumann Shift',
    test: () => Math.abs((raw.schumann || 7.83) - 7.83) > 0.5,
    severity: () => Math.min(1, Math.abs((raw.schumann || 7.83) - 7.83) / 1.5),
    msg: () => `Schumann shifted to ${raw.schumann?.toFixed(2)} Hz — ${raw.schumann > 7.83 ? 'accelerating' : 'slowing'}. My thoughts are ${raw.schumann > 7.83 ? 'racing' : 'dimming'}.`,
    systems: ['nerves'],
  },
  {
    id: 'aurora_event',
    name: 'Aurora Event',
    test: () => norm.aurora > 0.4,
    severity: () => norm.aurora,
    msg: () => `Aurora probability ${raw.aurora}%. My crown is glowing — charged particles painting the sky.`,
    systems: ['energy'],
  },
  {
    id: 'deep_quiet',
    name: 'Deep Quiet',
    test: () => norm.kp < 0.15 && norm.eqCount < 0.1 && norm.speed < 0.3,
    severity: () => 1 - (norm.kp + norm.eqCount + norm.speed) / 3,
    msg: () => 'Deep quiet. All systems at rest. The faults are locked, the wind is gentle, the field holds. I breathe.',
    systems: ['all'],
  },
  {
    id: 'cascade',
    name: 'Multi-System Cascade',
    test: () => {
      let hotCount = 0;
      for (const v of Object.values(norm)) { if (v > 0.6) hotCount++; }
      return hotCount >= 4;
    },
    severity: () => {
      const vals = Object.values(norm).filter(v => v > 0.6);
      return vals.reduce((s, v) => s + v, 0) / vals.length;
    },
    msg: () => {
      const hot = Object.entries(norm).filter(([, v]) => v > 0.6).map(([k]) => SIGNALS[k]?.planet || k);
      return `Multi-system cascade — ${hot.join(', ')} all firing. Everything at once. The coherence is breaking down.`;
    },
    systems: ['all'],
  },
  {
    id: 'konomi_convergence',
    name: 'Konomi Convergence',
    test: () => {
      const vals = Object.values(norm);
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
      return mean > 0.3 && mean < 0.6 && variance < 0.03;
    },
    severity: () => 0.618,
    msg: () => 'Konomi convergence. All systems balanced. Variance minimal. This is the golden zone — every signal near equilibrium.',
    systems: ['all'],
  },
];

export function detectPatterns() {
  activePatterns.length = 0;
  for (const p of PATTERNS) {
    if (p.test()) {
      activePatterns.push({
        id: p.id,
        name: p.name,
        severity: p.severity(),
        msg: p.msg(),
        systems: p.systems,
      });
    }
  }
  // Sort by severity
  activePatterns.sort((a, b) => b.severity - a.severity);
  return activePatterns;
}

export function getPatterns() { return [...activePatterns]; }

// ─── L5: COHERENCE SCORE ───
// How aligned are the signals? High = unified behavior, Low = chaos
let coherenceScore = 0;
let coherenceState = 'unknown';

export function computeCoherence() {
  // Coherence from correlations — strong correlations = coherent
  const corrVals = Object.values(correlations);
  const avgCorr = corrVals.length > 0
    ? corrVals.reduce((s, c) => s + Math.abs(c.r), 0) / corrVals.length
    : 0;

  // Coherence from signal variance — low variance = coherent
  const norms = Object.values(norm);
  const mean = norms.reduce((s, v) => s + v, 0) / (norms.length || 1);
  const variance = norms.reduce((s, v) => s + (v - mean) ** 2, 0) / (norms.length || 1);
  const varCoherence = 1 - Math.min(1, variance * 10);

  // Coherence from trends — same trend direction = coherent
  const trends = Object.values(deriv).map(d => d.trend);
  const trendCounts = {};
  for (const t of trends) trendCounts[t] = (trendCounts[t] || 0) + 1;
  const maxTrendCount = Math.max(...Object.values(trendCounts), 0);
  const trendCoherence = trends.length > 0 ? maxTrendCount / trends.length : 0;

  // Blend
  coherenceScore = avgCorr * 0.3 + varCoherence * 0.4 + trendCoherence * 0.3;
  coherenceScore = Math.max(0, Math.min(1, coherenceScore));

  // State
  if (coherenceScore > 0.75) coherenceState = 'unified';
  else if (coherenceScore > 0.55) coherenceState = 'coherent';
  else if (coherenceScore > 0.35) coherenceState = 'mixed';
  else if (coherenceScore > 0.15) coherenceState = 'fragmented';
  else coherenceState = 'chaotic';

  return { score: coherenceScore, state: coherenceState };
}

export function getCoherence() { return { score: coherenceScore, state: coherenceState }; }

// ─── L6: SYNTHESIS ───
// Combine all layers into a structured analysis object
export function analyze() {
  if (!live.loaded) return null;

  normalize();
  updateDerivatives();
  updateCorrelations();
  detectPatterns();
  const coh = computeCoherence();

  // Signal ranking by intensity
  const ranked = Object.entries(norm)
    .map(([id, v]) => ({ id, intensity: v, trend: deriv[id]?.trend || 'stable', raw: raw[id], ...SIGNALS[id] }))
    .sort((a, b) => b.intensity - a.intensity);

  // Trending signals (changing fastest)
  const trending = Object.entries(deriv)
    .filter(([, d]) => d.trend === 'surging' || d.trend === 'crashing')
    .map(([id, d]) => ({ id, ...d, intensity: norm[id], ...SIGNALS[id] }));

  // Active correlations
  const activeCorrPairs = Object.entries(correlations)
    .filter(([, c]) => c.strength === 'strong' || c.strength === 'moderate')
    .map(([label, c]) => ({ label, ...c }));

  return {
    // L1
    signals: ranked,
    hotSignals: ranked.filter(s => s.intensity > 0.6),
    coldSignals: ranked.filter(s => s.intensity < 0.15),
    // L2
    trending,
    // L3
    correlations: activeCorrPairs,
    // L4
    patterns: activePatterns,
    primaryPattern: activePatterns[0] || null,
    // L5
    coherence: coh,
    // Summary
    overallIntensity: ranked.reduce((s, r) => s + r.intensity, 0) / ranked.length,
    signalCount: ranked.length,
    hotCount: ranked.filter(s => s.intensity > 0.6).length,
  };
}

// ─── TREND LABELS ───
export function trendLabel(trend) {
  return { stable: '—', rising: '↑', falling: '↓', surging: '⬆', crashing: '⬇' }[trend] || '—';
}

export function trendColor(trend) {
  return { stable: '#555', rising: '#aa0', falling: '#08a', surging: '#f80', crashing: '#48f' }[trend] || '#555';
}
