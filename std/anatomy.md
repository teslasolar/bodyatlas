# STD:ANATOMY v1.0
# Procedural body geometry specs
# KONOMI COMPRESSED

## UDT:BodyGeometry
```
{system,primitives:[{type,pos:[x,y,z],scale:[sx,sy,sz],rot:[rx,ry,rz],name,clickable}]}
```

## SKELETON:SPINE
```
vertebrae:y=[0.65,0.75,...,1.6]|rad:0.035|joints:0.04
skull:[0,1.78,0]|r:0.12|scale:[1,1.15,1]
jaw:[0,1.63,0.05]|r:0.06|scale:[1.4,0.6,1]
neck:[0,1.65,-0.02]|len:0.08|rad:0.025
sternum:[0,1.22,0.1]|len:0.22|rad:0.025
```

## SKELETON:RIBS
```
count:12|y_start:1.35|spacing:0.045
ribRad:i<6?0.13+i*0.015:0.13+(12-i)*0.01
tube_rad:0.01|segments:16|symmetry:bilateral
```

## SKELETON:PELVIS
```
torus:[0,0.72,0]|R:0.14|r:0.035|arc:π
iliac:±0.12,0.75,0|r:0.09|scale:[1,1.2,0.5]
```

## SKELETON:LIMBS
```
#shoulder→elbow→wrist→hand (bilateral ±)
shoulder:[±0.22,1.42,0]|joint:0.04
humerus:[±0.24,1.24,0]|len:0.32|r:0.025
elbow:[±0.26,1.06,0]|joint:0.035
radius:[±0.27,0.88,0.01]|len:0.3|r:0.02
ulna:[±0.25,0.88,-0.01]|len:0.3|r:0.018
wrist:[±0.28,0.72,0]|joint:0.03
fingers:5×bone pairs|spread:0.018

#hip→knee→ankle→foot (bilateral ±)
hip:[±0.11,0.68,0]|joint:0.045
femur:[±0.11,0.48,0]|len:0.38|r:0.035
knee:[±0.10,0.28,0]|joint:0.04
patella:[±0.10,0.28,0.04]|r:0.025
tibia:[±0.10,0.11,0]|len:0.32|r:0.028
fibula:[±0.12,0.11,-0.01]|len:0.3|r:0.015
ankle:[±0.10,-0.05,0.02]|joint:0.03
foot:[±0.10,-0.07,0.06]|box:[0.07,0.03,0.16]
```

## ORGANS:POSITIONS
```
heart:[0.02,1.28,0.04]|r:0.05|scale:[1,1.2,0.9]|color:#cc2233|pulse:true
lung_L:[-0.09,1.3,0.02]|r:0.08|scale:[0.8,1.2,0.7]|color:#cc7799
lung_R:[0.09,1.3,0.02]|r:0.08|scale:[0.8,1.2,0.7]|color:#cc7799
liver:[0.06,1.14,0.04]|r:0.07|scale:[1.4,0.8,0.7]|color:#884422
stomach:[-0.04,1.12,0.03]|r:0.055|scale:[1,1.1,0.8]|color:#cc8844
kidney_L:[-0.08,1.05,-0.04]|r:0.035|scale:[0.7,1.2,0.6]|color:#993333
kidney_R:[0.08,1.05,-0.04]|r:0.035|scale:[0.7,1.2,0.6]|color:#993333
bladder:[0,0.73,0.04]|r:0.03|color:#aaaa55
spleen:[-0.1,1.14,-0.01]|r:0.03|color:#773344
diaphragm:[0,1.2,0]|circle:0.16|color:#cc7777|op:0.5
intestine:coil y=[0.88→0.70]|tube_r:0.02|30pts spiral
colon:frame y=[0.75→1.0]|tube_r:0.025|6pts
```

## VESSELS:PATHS
```
aorta:[0.02,1.28]→[0,1.38]→[0,0.72]|r:0.012|color:#ee3333
vena_cava:[-0.02,1.28]→[0,0.72]|r:0.014|color:#3344cc
carotid:bilateral [0,1.38]→[±0.04,1.7]|r:0.007
brachial:bilateral [0,1.38]→[±0.27,0.7]|r:0.006
femoral:bilateral [0,0.72]→[±0.1,-0.05]|r:0.007
renal:[0,1.05]→[±0.08,1.05]|r:0.005
hepatic:[0,1.1]→[0.06,1.14]|r:0.005
lymph_nodes:6 positions|r:0.012|color:#44cc66
thoracic_duct:[0,0.72]→[0.02,1.45]|r:0.004
```

## NERVES:PATHS
```
brain:[0,1.78,-0.01]|r:0.1|scale:[1,0.9,1.1]|color:#ddaaff
cerebellum:[0,1.72,-0.08]|r:0.05
brainstem:[0,1.67,-0.04]|cyl h:0.06 r:0.02
spinal:[0,1.65]→[0,0.65]|r:0.012|20pts
spinal_pairs:15×bilateral [0,y,-0.04]→[±0.12,y,0]|r:0.003
brachial:bilateral [0,1.5]→[±0.28,0.7]|r:0.004
sciatic:bilateral [0,0.72]→[±0.1,-0.02]|r:0.005
vagus:bilateral [±0.02,1.67]→[±0.02,0.85]|r:0.005|color:#ffcc00|GOLD
sympathetic:bilateral [±0.05,1.55]→[±0.05,0.83]|r:0.003|color:#ff6644
```

## ENERGY:FIELDS
```
body_aura:[0,1.05,0]|sphere r:0.45|scale:[1,2.2,0.8]|color:#ffd700|op:0.08
head_aura:[0,1.78,0]|sphere r:0.22|color:#ffd700|op:0.08
chakra_points:7×{y,color}=[0.72:red,0.85:orange,1.0:yellow,1.25:green,1.45:blue,1.7:indigo,1.88:violet]
particles:80×random shell|r:0.004|float+pulse
```
