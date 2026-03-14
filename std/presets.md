# STD:PRESETS v1.0
# View presets for atlas + gaia modes
# KONOMI COMPRESSED

## UDT:Preset
```
{id,name,desc,layers:{id:{vis,op}},highlight?,animated?,dual?,showDrugPanel?}
```

## ATLAS_PRESETS
```
all:All Systems|all vis:true op:0.5
kgate:K-GATE View|organs+nerves op:0.9,rest off
ringwalk:Ring Walk|animated 30s peel R0→R6
vagal:Vagal Tone|nerves:1.0+organs:0.4+skeleton:0.2,highlight:vagus
gutbrain:Gut-Brain Axis|skin:0.15+organs:0.9+nerves:0.6,highlight:gutbrain
kchannel:K+ Channel Map|multi vis,highlight:kchannel
drugoverlay:Drug Overlay|multi vis,showDrugPanel:true
dual:Dual View|multi vis,dual:true
```

## GAIA_PRESETS
```
all:All Systems|all vis:true op:0.5
seismic:Seismic Body|muscles:0.9+skeleton:0.5+skin:0.1
nervous:Schumann Brain|nerves:1.0+energy:0.6+skin:0.1
circulatory:Ocean Heart|vessels:0.9+organs:0.8+skin:0.1
storm:Storm Mode|skin:0.5+energy:0.8+nerves:0.4
kgate:K-GATE Planetary|nerves:0.9+organs:0.9
breathe:Earth Breathe|animated 30s peel
```
