# COHERENCE — 6-Layer Signal Analysis
> src/coherence.js | Konomi Standard

## Pipeline
L0 → L1 → L2 → L3 → L4 → L5 → L6

## L0: Signals (15)
| ID | Source | Range | Body | Planet |
|---|---|---|---|---|
| kp | kpIndex | 0-9 | skin | magnetosphere |
| eqMag | eq[0].mag | 0-9 | muscles | tectonic |
| eqCount | earthquakeCount | 0-20 | muscles | tectonic |
| eqEnergy | log10(energy) | 0-10 | muscles | tectonic |
| speed | solarSpeed | 250-900 | vessels | solar wind |
| density | solarDensity | 0-30 | organs | core |
| bz | -solarBz | -10-20 | skin | IMF |
| bt | solarBt | 0-30 | skin | IMF |
| schumann | schumann | 7-10 | nerves | resonance |
| lightning | lightningRate | 1000-2600 | nerves | lightning |
| xray | -log10(flux) | 4-8 | energy | x-ray |
| aurora | auroraMax | 0-100 | energy | aurora |
| pressure | globalPressure | 980-1040 | organs | atmosphere |
| temp | globalTemp | -10-45 | vessels | weather |
| tide | tideLevel | -2-3 | vessels | ocean |

## L1: Normalize
All → [0,1]: `(v - lo) / (hi - lo)` clamped

## L2: Derivatives
- Rate: Δv/Δt last 2 samples
- Accel: Δrate/Δt last 3 samples
- Trend: 5-sample window → stable|rising|falling|surging|crashing
- Threshold: ±0.05 = change, ±0.2 = surge/crash

## L3: Correlations (7 pairs)
| A | B | Label |
|---|---|---|
| kp | speed | solar-geo coupling |
| kp | aurora | geo-aurora response |
| bz | kp | IMF-geo coupling |
| speed | density | plasma coherence |
| eqEnergy | kp | seismo-magnetic |
| schumann | kp | resonance-field |
| schumann | lightning | cavity drive |

Strength: strong (|r|>0.5), moderate (>0.25), weak (>0.1)

## L4: Patterns (10)
| ID | Trigger | Systems |
|---|---|---|
| geomag_storm | kp>0.55 & speed>0.5 | skin,energy |
| bz_coupling | bz>0.6 | skin,energy |
| seismic_swarm | eqCount>0.4 & eqEnergy>0.3 | muscles |
| major_quake | eqMag>0.65 | muscles |
| solar_surge | speed>0.65 & density>0.4 | vessels,organs |
| resonance_shift | |schumann-7.83|>0.5 | nerves |
| aurora_event | aurora>0.4 | energy |
| deep_quiet | kp<0.15 & eqCount<0.1 & speed<0.3 | all |
| cascade | 4+ signals >0.6 | all |
| konomi_convergence | mean 0.3-0.6 & var<0.03 | all |

## L5: Coherence Score
Blend: avgCorr×0.3 + varCoherence×0.4 + trendCoherence×0.3
States: unified(>0.75) coherent(>0.55) mixed(>0.35) fragmented(>0.15) chaotic

## L6: Synthesis → analyze()
Returns: ranked signals, trending, correlations, patterns, coherence
Feeds into voice.js generateNarrative()
