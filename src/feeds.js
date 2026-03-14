// ════════════════════════════════════════════════════
// FEEDS — Consolidated live Earth data engine
// All free APIs, no auth required
// Spec: std/feeds.md
// ════════════════════════════════════════════════════

export const live = {
  // Seismic
  earthquakes: [],
  earthquakeEnergy: 0,
  earthquakeCount: 0,
  significantQuakes: [],

  // Solar
  solarSpeed: 400,
  solarDensity: 5,
  solarTemp: 1e5,
  solarBz: 0,
  solarBt: 0,
  xrayFlux: 0,
  flares: [],

  // Geomagnetic
  kpIndex: 2,
  goesMagHp: 0,
  goesMagHe: 0,
  auroraMax: 0,

  // Resonance
  schumann: 7.83,
  lightningRate: 1800,

  // Weather
  globalTemp: 20,
  globalWind: 10,
  globalPressure: 1013,

  // Ocean
  tideLevel: 0,

  // Alerts
  spaceWeatherAlerts: [],

  // Meta
  lastUpdate: Date.now(),
  errors: [],
};

// Status tracking per feed
export const feedStatus = {};

function setStatus(id, ok, msg) {
  feedStatus[id] = { ok, msg, time: Date.now() };
}

// ─── FETCH HELPERS ───
async function fetchJSON(url, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ─── SEISMIC ───
export async function fetchEarthquakes() {
  try {
    const data = await fetchJSON(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson'
    );
    live.earthquakes = data.features.map(f => ({
      mag: f.properties.mag,
      place: f.properties.place,
      time: f.properties.time,
      coords: f.geometry.coordinates,
      tsunami: f.properties.tsunami,
      id: f.id,
    }));
    live.earthquakeEnergy = live.earthquakes.reduce(
      (s, eq) => s + Math.pow(10, eq.mag), 0
    );
    live.earthquakeCount = live.earthquakes.length;
    setStatus('eq', true, `${live.earthquakeCount} quakes`);
    return live.earthquakes;
  } catch (e) {
    setStatus('eq', false, e.message);
    live.errors.push({ feed: 'eq', error: e.message, time: Date.now() });
    return [];
  }
}

export async function fetchSignificantQuakes() {
  try {
    const data = await fetchJSON(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson'
    );
    live.significantQuakes = data.features.map(f => ({
      mag: f.properties.mag,
      place: f.properties.place,
      time: f.properties.time,
      coords: f.geometry.coordinates,
      tsunami: f.properties.tsunami,
    }));
    setStatus('eq_sig', true, `${live.significantQuakes.length} significant`);
  } catch (e) {
    setStatus('eq_sig', false, e.message);
  }
}

// ─── SOLAR WIND ───
export async function fetchSolarPlasma() {
  try {
    const data = await fetchJSON(
      'https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json'
    );
    const row = data[data.length - 1];
    if (row && row.length >= 3) {
      live.solarDensity = parseFloat(row[1]) || 5;
      live.solarSpeed = parseFloat(row[2]) || 400;
      if (row.length >= 4) live.solarTemp = parseFloat(row[3]) || 1e5;
    }
    setStatus('plasma', true, `${Math.round(live.solarSpeed)} km/s`);
  } catch (e) {
    setStatus('plasma', false, e.message);
  }
}

export async function fetchSolarMag() {
  try {
    const data = await fetchJSON(
      'https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json'
    );
    const row = data[data.length - 1];
    if (row && row.length >= 7) {
      live.solarBz = parseFloat(row[3]) || 0;
      live.solarBt = parseFloat(row[6]) || 0;
    }
    setStatus('mag', true, `Bz: ${live.solarBz.toFixed(1)} nT`);
  } catch (e) {
    setStatus('mag', false, e.message);
  }
}

// ─── GEOMAGNETIC ───
export async function fetchKpIndex() {
  try {
    const data = await fetchJSON(
      'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'
    );
    const row = data[data.length - 1];
    if (row && row.length >= 2) {
      live.kpIndex = parseFloat(row[1]) || 2;
    }
    setStatus('kp', true, `Kp ${live.kpIndex.toFixed(0)}`);
  } catch (e) {
    setStatus('kp', false, e.message);
  }
}

export async function fetchGoesMag() {
  try {
    const data = await fetchJSON(
      'https://services.swpc.noaa.gov/json/goes/primary/magnetometers-1-day.json'
    );
    const row = data[data.length - 1];
    if (row) {
      live.goesMagHp = row.Hp || 0;
      live.goesMagHe = row.He || 0;
    }
    setStatus('goes_mag', true, `Hp: ${live.goesMagHp.toFixed(0)} nT`);
  } catch (e) {
    setStatus('goes_mag', false, e.message);
  }
}

// ─── SOLAR FLARES / X-RAY ───
export async function fetchXray() {
  try {
    const data = await fetchJSON(
      'https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json'
    );
    const row = data[data.length - 1];
    if (row) {
      live.xrayFlux = row.flux || 0;
    }
    setStatus('xray', true, `${live.xrayFlux.toExponential(1)} W/m²`);
  } catch (e) {
    setStatus('xray', false, e.message);
  }
}

export async function fetchFlares() {
  try {
    const data = await fetchJSON(
      'https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json'
    );
    live.flares = (data || []).slice(0, 5).map(f => ({
      class: f.max_class || 'unknown',
      begin: f.begin_time,
      peak: f.max_time,
      end: f.end_time,
    }));
    setStatus('flare', true, live.flares.length > 0 ? live.flares[0].class : 'none');
  } catch (e) {
    setStatus('flare', false, e.message);
  }
}

// ─── AURORA ───
export async function fetchAurora() {
  try {
    const data = await fetchJSON(
      'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json'
    );
    if (data && data.coordinates) {
      live.auroraMax = Math.max(...data.coordinates.map(c => c[2] || 0));
    }
    setStatus('aurora', true, `max: ${live.auroraMax}%`);
  } catch (e) {
    setStatus('aurora', false, e.message);
  }
}

// ─── SPACE WEATHER ALERTS ───
export async function fetchAlerts() {
  try {
    const data = await fetchJSON(
      'https://services.swpc.noaa.gov/products/alerts.json'
    );
    live.spaceWeatherAlerts = (data || []).slice(0, 5).map(a => ({
      time: a.issue_datetime,
      message: (a.message || '').substring(0, 200),
    }));
    setStatus('alerts', true, `${live.spaceWeatherAlerts.length} alerts`);
  } catch (e) {
    setStatus('alerts', false, e.message);
  }
}

// ─── WEATHER (Open-Meteo) ───
export async function fetchWeather() {
  try {
    const data = await fetchJSON(
      'https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=temperature_2m,wind_speed_10m,surface_pressure'
    );
    if (data && data.current) {
      live.globalTemp = data.current.temperature_2m || 20;
      live.globalWind = data.current.wind_speed_10m || 10;
      live.globalPressure = data.current.surface_pressure || 1013;
    }
    setStatus('weather', true, `${live.globalTemp}°C`);
  } catch (e) {
    setStatus('weather', false, e.message);
  }
}

// ─── TIDES (NOAA) ───
export async function fetchTide() {
  try {
    const data = await fetchJSON(
      'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=8454000&product=water_level&datum=STND&units=metric&time_zone=gmt&format=json'
    );
    if (data && data.data && data.data[0]) {
      live.tideLevel = parseFloat(data.data[0].v) || 0;
    }
    setStatus('tide', true, `${live.tideLevel.toFixed(2)} m`);
  } catch (e) {
    setStatus('tide', false, e.message);
  }
}

// ─── COMPUTED PROXIES ───
export function updateSchumann() {
  const kpEff = (live.kpIndex - 2) * 0.05;
  const solarEff = (live.solarSpeed - 400) / 2000;
  const bzEff = Math.abs(live.solarBz) * 0.02;
  live.schumann = 7.83 + kpEff + solarEff + bzEff + (Math.random() - 0.5) * 0.12;
  setStatus('schumann', true, `${live.schumann.toFixed(2)} Hz`);
}

export function updateLightning() {
  live.lightningRate = 1800 + (Math.random() - 0.5) * 400;
  setStatus('lightning', true, `${Math.round(live.lightningRate)}/s`);
}

// ─── KAPPA ───
const PHI = (1 + Math.sqrt(5)) / 2;
const KAPPA_STAR = 1 / PHI;
let _kappa = KAPPA_STAR;

export function computeKappa() {
  let k = KAPPA_STAR;
  k += Math.min(1, live.earthquakeEnergy / 1e8) * 0.15;
  k += Math.min(1, (live.solarSpeed - 300) / 500) * 0.10;
  k += (live.kpIndex / 9) * 0.15;
  k += (Math.abs(live.schumann - 7.83) / 2) * 0.05;
  // Bz southward adds instability
  k += Math.max(0, -live.solarBz / 20) * 0.05;
  k = Math.max(0, Math.min(1, k));
  _kappa = _kappa * 0.92 + k * 0.08;
  return _kappa;
}

export function getKappa() { return _kappa; }

export const PHASES = [
  { key: 'FROZEN', icon: '🧊', range: [0, 0.1], color: 0xa8d8ea },
  { key: 'RIGID', icon: '🏛️', range: [0.1, 0.4], color: 0x7ec8c8 },
  { key: 'STABLE', icon: '🌊', range: [0.4, 0.55], color: 0x58b09c },
  { key: 'KONOMI', icon: '🌸', range: [0.55, 0.7], color: 0xf2a6b3 },
  { key: 'TURB', icon: '🌪️', range: [0.7, 0.88], color: 0xe07a5f },
  { key: 'CHAOS', icon: '🔥', range: [0.88, 1.0], color: 0xd62828 },
];

export function getPhase(k) {
  for (const p of PHASES) if (k >= p.range[0] && k < p.range[1]) return p;
  return PHASES[PHASES.length - 1];
}

// ─── MASTER REFRESH ───
export async function refreshAll() {
  await Promise.all([
    fetchEarthquakes(),
    fetchSolarPlasma(),
    fetchSolarMag(),
    fetchKpIndex(),
    fetchGoesMag(),
    fetchXray(),
    fetchFlares(),
    fetchAlerts(),
    fetchWeather(),
    fetchTide(),
  ]);
  // Less frequent
  fetchSignificantQuakes();
  fetchAurora();
  // Computed
  updateSchumann();
  updateLightning();
  live.lastUpdate = Date.now();
}

export async function refreshFast() {
  updateSchumann();
  updateLightning();
}

// ─── SUMMARY ───
export function getSummary() {
  return {
    eq: live.earthquakeCount > 0 ? `M${live.earthquakes[0].mag.toFixed(1)}` : 'Quiet',
    eqPlace: live.earthquakeCount > 0 ? live.earthquakes[0].place : null,
    solar: `${Math.round(live.solarSpeed)} km/s`,
    density: `${live.solarDensity.toFixed(1)} p/cm³`,
    kp: `Kp ${live.kpIndex.toFixed(0)}`,
    bz: `Bz ${live.solarBz.toFixed(1)} nT`,
    schumann: `${live.schumann.toFixed(2)} Hz`,
    lightning: `${Math.round(live.lightningRate)}/s`,
    xray: live.xrayFlux > 0 ? live.xrayFlux.toExponential(1) : '--',
    aurora: `${live.auroraMax}%`,
    weather: `${live.globalTemp}°C`,
    tide: `${live.tideLevel.toFixed(2)} m`,
    flare: live.flares.length > 0 ? live.flares[0].class : 'none',
  };
}
