# STD:KAPPA v1.0
# Planetary κ framework | phase detection from live data
# KONOMI COMPRESSED

## UDT:KappaFramework
```
PHI:(1+√5)/2=1.6180339887
KAPPA_STAR:1/PHI=0.6180339887
```

## PHASES
```
FROZEN:  0.00-0.10|🧊|#a8d8ea|system crystallized,no flow
RIGID:   0.10-0.40|🏛️|#7ec8c8|over-constrained,brittle
STABLE:  0.40-0.55|🌊|#58b09c|healthy equilibrium,flow
KONOMI:  0.55-0.70|🌸|#f2a6b3|edge of bloom,optimal
TURB:    0.70-0.88|🌪️|#e07a5f|turbulent,approaching chaos
CHAOS:   0.88-1.00|🔥|#d62828|system breakdown,emergency
```

## COMPUTE:planetaryKappa
```
base:KAPPA_STAR(0.618)
+earthquakeNorm * 0.15    # seismic energy / 1e8, capped 1
+solarWindNorm * 0.10     # (speed-300) / 500, capped 1
+kpNorm * 0.15            # kpIndex / 9
+schumannDev * 0.05       # |schumann-7.83| / 2
clamp:[0,1]
smooth:prev*0.92+new*0.08
```

## INTERPRETATION
```
κ<κ*:   system over-ordered → rigid body, suppressed signals
κ≈κ*:   golden balance → konomi zone, optimal gate function
κ>κ*:   system over-excited → turbulent, approaching breakdown
κ→1:    full chaos → geomagnetic storm, seismic swarm, gate failure
```
