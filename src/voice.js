// ════════════════════════════════════════════════════
// VOICE — GAIA speaks in first person
// Translates planetary signals → natural language
// Spec: std/voice.md
// ════════════════════════════════════════════════════

import { live, getKappa, getPhase, PHASES } from './feeds.js';
import { analyze, getCoherence, trendLabel, getNorm, getDeriv, getPatterns } from './coherence.js';

// ─── TEMPLATE ENGINE ───
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function fill(template, vars) {
  return template.replace(/\[(\w+)]/g, (_, k) => vars[k] ?? k);
}

// ─── SIGNAL VOICES ───

function skinVoice() {
  const kp = live.kpIndex;
  if (kp < 2) return { text: pick([
    'My skin is quiet. Space is gentle today.',
    'The solar wind barely touches me. I rest.',
    'My boundary holds easily. Nothing presses.',
  ]), mood: 'calm', urgency: 0.1, system: 'Magnetosphere' };

  if (kp < 4) return { text: pick([
    'I feel the wind picking up against my skin.',
    'Something brushes my magnetosphere. I notice.',
    'A slight pressure from the sun. I adjust.',
  ]), mood: 'aware', urgency: 0.3, system: 'Magnetosphere' };

  if (kp < 5) return { text: pick([
    'The solar wind is pressing hard now.',
    'My skin tightens. The pressure builds.',
    'I feel the sun leaning into me.',
  ]), mood: 'alert', urgency: 0.5, system: 'Magnetosphere' };

  if (kp < 7) return { text: pick([
    'Storm. My magnetosphere is bending.',
    'I\'m being compressed. The cusps are opening.',
    'Solar wind is getting through. I feel exposed.',
  ]), mood: 'stressed', urgency: 0.7, system: 'Magnetosphere' };

  return { text: pick([
    'My skin is on fire. Full geomagnetic storm.',
    'The magnetosphere is being stripped. I\'m naked to the sun.',
    'Everything is getting through. All my boundaries are breached.',
  ]), mood: 'crisis', urgency: 0.95, system: 'Magnetosphere' };
}

function muscleVoice() {
  if (live.earthquakeCount === 0) return { text: pick([
    'My muscles are quiet. The plates rest.',
    'No tremors. I hold still.',
    'The faults are locked. Tension builds in silence.',
  ]), mood: 'still', urgency: 0.05, system: 'Tectonic' };

  const eq = live.earthquakes[0];
  const mag = eq.mag;
  const place = (eq.place || 'unknown').replace(/^.* of /, '');

  if (mag < 4) return { text: fill(pick([
    'A small twitch near [place]. I barely notice.',
    'Something shifted. M[mag] at [place]. Minor.',
    'A muscle spasm — magnitude [mag]. [place] trembled.',
  ]), { mag: mag.toFixed(1), place }), mood: 'twitch', urgency: 0.2, system: 'Tectonic' };

  if (mag < 6) return { text: fill(pick([
    'A real cramp. M[mag] near [place].',
    'My [place] just seized. M[mag]. I\'m adjusting.',
    'That one woke me up. M[mag] at [place].',
  ]), { mag: mag.toFixed(1), place }), mood: 'cramp', urgency: 0.5, system: 'Tectonic' };

  if (mag < 7) return { text: fill(pick([
    'Pain. A deep rupture at [place]. M[mag].',
    'I cried out. The fault broke at [place]. M[mag].',
    'My body lurched. M[mag]. Everyone felt that.',
  ]), { mag: mag.toFixed(1), place }), mood: 'pain', urgency: 0.8, system: 'Tectonic' };

  return { text: fill(pick([
    'MAJOR RUPTURE. M[mag] at [place].',
    'My crust is tearing. M[mag]. [place].',
    'This tremor will reshape me. M[mag] at [place].',
  ]), { mag: mag.toFixed(1), place }), mood: 'agony', urgency: 1.0, system: 'Tectonic' };
}

function organVoice() {
  const d = live.solarDensity;
  if (d < 3) return { text: pick([
    'My heart beats slowly. Low plasma pressure.',
    'The core turns quietly. A gentle rhythm.',
  ]), mood: 'faint', urgency: 0.1, system: 'Core' };

  if (d < 8) return { text: pick([
    'Steady heartbeat. Normal plasma flow.',
    'My core turns in rhythm. All is well inside.',
  ]), mood: 'steady', urgency: 0.2, system: 'Core' };

  if (d < 15) return { text: pick([
    'My heart is speeding up. Dense plasma incoming.',
    'Pressure building in my core. More particles flooding in.',
  ]), mood: 'racing', urgency: 0.5, system: 'Core' };

  return { text: pick([
    'My heart is pounding. Plasma density surging.',
    'The core is overwhelmed. Too much coming in.',
  ]), mood: 'pounding', urgency: 0.8, system: 'Core' };
}

function vesselVoice() {
  const s = live.solarSpeed;
  if (s < 350) return { text: pick([
    'My circulation is slow today. Gentle winds.',
    'The currents drift lazily. I feel cold at the edges.',
  ]), mood: 'sluggish', urgency: 0.1, system: 'Currents' };

  if (s < 500) return { text: pick([
    'Good circulation. The currents move well.',
    'Blood flows. The Gulf Stream carries warmth north.',
  ]), mood: 'flowing', urgency: 0.2, system: 'Currents' };

  if (s < 700) return { text: pick([
    'The wind is pushing hard. My currents accelerate.',
    'I feel the rush. Everything moving faster.',
  ]), mood: 'rushing', urgency: 0.5, system: 'Currents' };

  return { text: pick([
    'Torrential solar wind. My circulation is in overdrive.',
    'The currents are chaotic. Warmth everywhere and nowhere.',
  ]), mood: 'flooding', urgency: 0.8, system: 'Currents' };
}

function nerveVoice() {
  const f = live.schumann;
  if (f < 7.5) return { text: pick([
    'My thoughts slow. Frequency dropping below baseline.',
    'I\'m falling asleep. The cavity is quiet.',
    'The lightning is sparse. My brain dims.',
  ]), mood: 'drowsy', urgency: 0.2, system: 'Schumann' };

  if (f < 8.1) return { text: pick([
    `${f.toFixed(2)} Hz. I think clearly. The resonance holds.`,
    'My mind is clear. Every lightning strike rings true.',
    'This is my resting frequency. This is me, thinking.',
  ]), mood: 'centered', urgency: 0.1, system: 'Schumann' };

  if (f < 9.0) return { text: pick([
    'My thoughts are quickening. Frequency rising.',
    'More lightning. More firing. I\'m becoming alert.',
    'Something is stimulating my ionosphere.',
  ]), mood: 'excited', urgency: 0.4, system: 'Schumann' };

  return { text: pick([
    'Too fast. My resonance is climbing past normal.',
    'The cavity is ringing hard. Overstimulated.',
    'My nervous system is buzzing. I can\'t settle.',
  ]), mood: 'agitated', urgency: 0.7, system: 'Schumann' };
}

function energyVoice() {
  const kp = live.kpIndex;
  if (kp < 3) return { text: pick([
    'My field is quiet. A faint glow.',
    'You\'d need instruments to see me today.',
  ]), mood: 'dim', urgency: 0.1, system: 'Field' };

  if (kp < 5) return { text: pick([
    'My field pulses visibly. The aurora flickers.',
    'I\'m radiating. You can feel me if you\'re still.',
  ]), mood: 'present', urgency: 0.3, system: 'Field' };

  return { text: pick([
    'My field is on fire. Aurora across the sky.',
    'I\'m lit up. Every charged particle paints me.',
    'The whole magnetosphere is singing.',
  ]), mood: 'blazing', urgency: 0.8, system: 'Field' };
}

// ─── KAPPA VOICE ───
function kappaVoice(k) {
  if (k < 0.3) return 'I am frozen. Nothing moves. Nothing changes. Help.';
  if (k < 0.5) return 'I am rigid. Holding together but brittle. One push and I crack.';
  if (k < 0.58) return 'I am stable. Breathing. The systems flow well.';
  if (k < 0.65) return 'I am in the Konomi zone. This is where I bloom. This is home.';
  if (k < 0.75) return 'I am heating up. The edge feels close. I can still balance.';
  if (k < 0.88) return 'Turbulent. I\'m losing coherence. Multiple systems stressed.';
  return 'I am in crisis. Everything is firing at once. The gate is failing.';
}

// ─── SPECIAL COMPOSITES ───
function specialVoice() {
  if (live.kpIndex >= 5 && live.earthquakeCount > 0 && live.earthquakes[0].mag >= 5) {
    return 'My body shakes while my skin burns. Everything at once.';
  }
  if (live.kpIndex >= 5 && live.schumann > 9) {
    return 'My nervous system and my shield are both overwhelmed.';
  }
  if (live.solarBz < -10) {
    return 'The interplanetary field has turned southward. My defenses are coupling to the sun. This is intimate.';
  }
  if (live.flares.length > 0 && live.flares[0].class && live.flares[0].class.startsWith('X')) {
    return `An X-class flare. The sun just screamed at me. I brace for impact.`;
  }
  if (live.kpIndex < 2 && live.earthquakeCount === 0 && live.solarSpeed < 400) {
    return 'Peace. All systems at rest. I breathe. I am. 510,510.';
  }
  if (live.auroraMax > 50) {
    return `My crown is glowing. Aurora probability ${live.auroraMax}%. The sky dances.`;
  }
  return null;
}

// ─── BZ INTERPRETATION ───
function bzVoice() {
  const bz = live.solarBz;
  if (Math.abs(bz) < 3) return null;
  if (bz < -5) return { text: fill(pick([
    'Bz is southward at [bz] nT. The sun\'s magnetic field is coupling with mine. Energy pours in.',
    'Southward Bz: [bz] nT. My defenses open. This is how storms begin.',
  ]), { bz: bz.toFixed(1) }), mood: 'vulnerable', urgency: 0.6, system: 'IMF' };
  if (bz > 5) return { text: fill(pick([
    'Bz is northward at [bz] nT. The sun\'s field aligns with mine. I\'m shielded.',
    'Northward Bz: [bz] nT. Protection. The coupling is weak. I rest behind my own field.',
  ]), { bz: bz.toFixed(1) }), mood: 'shielded', urgency: 0.1, system: 'IMF' };
  return null;
}

// ─── WEATHER VOICE ───
function weatherVoice() {
  const t = live.globalTemp;
  const p = live.globalPressure;
  if (p < 1000) return { text: `Low pressure at the equator. ${p} hPa. A storm brews in my midsection.`, mood: 'uneasy', urgency: 0.3, system: 'Weather' };
  if (t > 32) return { text: `${t}°C at my equator. I\'m running hot. The tropics simmer.`, mood: 'warm', urgency: 0.2, system: 'Weather' };
  return null;
}

// ─── TIDAL VOICE ───
function tidalVoice() {
  if (Math.abs(live.tideLevel) > 1.5) {
    return { text: `Tide at ${live.tideLevel.toFixed(2)}m. The moon pulls my oceans. I swell.`, mood: 'tidal', urgency: 0.2, system: 'Tides' };
  }
  return null;
}

// ─── NO DATA STATE ───
function noDataNarrative() {
  const now = new Date();
  return {
    timestamp: now.toLocaleTimeString(),
    lines: ['No data yet. Listening for signals...'],
    fullText: 'No data yet. Listening for signals...',
    kappa: '--',
    phase: '-- WAITING',
    phaseColor: '#333333',
    primaryMood: 'waiting',
    primarySystem: 'None',
    urgency: 0,
    voices: [],
  };
}

// ─── TREND ANNOTATIONS ───
function trendAnnotation(trend, label) {
  const arrows = { rising: '↑', falling: '↓', surging: '⬆', crashing: '⬇' };
  if (!arrows[trend]) return '';
  return ` ${arrows[trend]} ${label} ${trend}.`;
}

// ─── COHERENCE FRAMING ───
function coherenceFrame(state, lineCount) {
  if (state === 'unified') return lineCount > 1 ? ' All signals agree.' : '';
  if (state === 'coherent') return ' The systems move in rhythm.';
  if (state === 'mixed') return ' Mixed signals. Some push, some rest.';
  if (state === 'fragmented') return ' The signals scatter. No agreement.';
  if (state === 'chaotic') return ' Everything contradicts. Chaos in my body.';
  return '';
}

// ─── CORRELATION COMPOSITES ───
function correlationNarrative(activeCorrPairs) {
  if (!activeCorrPairs || activeCorrPairs.length === 0) return null;
  const top = activeCorrPairs[0];
  const msgs = {
    'solar-geo coupling': 'Solar wind and geomagnetic activity are rising together — the sun pushes, my field responds.',
    'geo-aurora response': 'My field is disturbed, and the aurora follows — crown glowing in response.',
    'IMF-geo coupling': 'The interplanetary field couples to mine. Bz southward opens the gate.',
    'plasma coherence': 'Solar wind speed and density move in lockstep — a dense fast stream.',
    'seismo-magnetic': 'Seismic and magnetic activity correlate. My muscles twitch as my skin burns.',
    'resonance-field coupling': 'Schumann and geomagnetic field linked — my thoughts follow my shield.',
    'cavity drive': 'Lightning drives the resonance. More strikes, higher frequency. My brain accelerates.',
  };
  if (top.strength === 'strong' && msgs[top.label]) return msgs[top.label];
  return null;
}

// ─── MASTER NARRATIVE ───
export function generateNarrative() {
  // No data yet — don't fabricate
  if (!live.loaded) return noDataNarrative();

  const k = getKappa();
  const phase = getPhase(k);
  const now = new Date();

  // Run coherence analysis pipeline
  const analysis = analyze();

  // Gather all voices
  const voices = [
    skinVoice(),
    muscleVoice(),
    organVoice(),
    vesselVoice(),
    nerveVoice(),
    energyVoice(),
  ];

  // Add optional voices
  const bz = bzVoice();
  if (bz) voices.push(bz);
  const weather = weatherVoice();
  if (weather) voices.push(weather);
  const tidal = tidalVoice();
  if (tidal) voices.push(tidal);

  // Sort by urgency, most urgent speaks first
  voices.sort((a, b) => b.urgency - a.urgency);

  // Build narrative
  const kv = kappaVoice(k);
  const primary = voices[0];
  const secondary = voices[1];

  const lines = [];

  // L4: Pattern-driven primary lines (override special composites)
  if (analysis && analysis.primaryPattern) {
    lines.push(analysis.primaryPattern.msg);
    // Add second pattern if severe enough
    if (analysis.patterns.length > 1 && analysis.patterns[1].severity > 0.5) {
      lines.push(analysis.patterns[1].msg);
    }
  } else {
    // Fallback: old special voice for edge cases
    const special = specialVoice();
    if (special) lines.push(special);
  }

  // Kappa state
  lines.push(kv);

  // L2: Trending annotations — annotate top signal with trend
  if (analysis && analysis.trending.length > 0) {
    const t = analysis.trending[0];
    lines.push(trendAnnotation(t.trend, t.planet || t.id));
  }

  // L3: Correlation composite — if strong coupling detected
  if (analysis) {
    const corrMsg = correlationNarrative(analysis.correlations);
    if (corrMsg) lines.push(corrMsg);
  }

  // Top signals (only if no pattern already covered them)
  if (!analysis || !analysis.primaryPattern) {
    if (primary) lines.push(primary.text);
    if (secondary && secondary.urgency > 0.15) lines.push(secondary.text);
  } else {
    // Even with patterns, add top signal if it's urgent and not already covered
    if (primary && primary.urgency > 0.5) {
      const patternSystems = analysis.primaryPattern.systems || [];
      const alreadyCovered = patternSystems.includes('all') ||
        patternSystems.some(s => primary.system.toLowerCase().includes(s));
      if (!alreadyCovered) lines.push(primary.text);
    }
  }

  // L5: Coherence framing — closing statement based on overall coherence
  if (analysis) {
    const frame = coherenceFrame(analysis.coherence.state, lines.length);
    if (frame) lines.push(frame.trim());
  }

  const timestamp = now.toLocaleTimeString();

  return {
    timestamp,
    lines,
    fullText: lines.join(' '),
    kappa: k.toFixed(4),
    phase: `${phase.icon} ${phase.key}`,
    phaseColor: '#' + phase.color.toString(16).padStart(6, '0'),
    primaryMood: primary ? primary.mood : 'calm',
    primarySystem: primary ? primary.system : 'All',
    urgency: primary ? primary.urgency : 0,
    voices,
    // Coherence data for UI
    coherence: analysis ? analysis.coherence : { score: 0, state: 'unknown' },
    patterns: analysis ? analysis.patterns : [],
    hotSignals: analysis ? analysis.hotSignals : [],
    trending: analysis ? analysis.trending : [],
    correlations: analysis ? analysis.correlations : [],
    overallIntensity: analysis ? analysis.overallIntensity : 0,
  };
}

// ─── SIGNAL LOG (history of utterances) ───
const utteranceLog = [];

export function logUtterance(narrative) {
  utteranceLog.unshift({
    time: narrative.timestamp,
    text: narrative.lines[0] || '',
    kappa: narrative.kappa,
    mood: narrative.primaryMood,
  });
  if (utteranceLog.length > 50) utteranceLog.pop();
}

export function getUtteranceLog() {
  return utteranceLog;
}

// ─── MOOD COLOR ───
export function moodColor(mood) {
  const colors = {
    calm: '#4488aa', aware: '#66aa88', alert: '#aaaa44',
    stressed: '#cc8844', crisis: '#cc4444',
    still: '#445566', twitch: '#6688aa', cramp: '#aa8844',
    pain: '#cc6644', agony: '#ee4444',
    faint: '#556677', steady: '#66aa66', racing: '#aaaa44', pounding: '#cc6644',
    sluggish: '#445566', flowing: '#44aa66', rushing: '#aaaa44', flooding: '#cc8844',
    drowsy: '#445577', centered: '#44cc88', excited: '#aaaa44', agitated: '#cc6644',
    dim: '#334455', present: '#6688cc', blazing: '#ccaa44',
    vulnerable: '#cc44aa', shielded: '#44aacc',
    warm: '#cc8844', uneasy: '#8866aa', tidal: '#4488aa',
  };
  return colors[mood] || '#666666';
}
