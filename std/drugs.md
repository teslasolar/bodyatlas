# STD:DRUGS v1.0
# K-GATE drug overlay data
# KONOMI COMPRESSED

## UDT:Drug
```
{id,name,color,ring,label,targets:[organId]}
```

## COMPOUNDS
```
dextroamphetamine:#ff8833|R2|DA flood→gate forced OPEN|→[brain]
montelukast:#bb44ff|R0+R3|FDA BBW,crosses BBB,bioaccumulates gut|→[lungs,intestines,brain]
alcohol:#ff4444|R0+R2|acute KCNQ enhance→chronic K+ degradation|→[liver,intestines,brain]
quercetin:#44cc66|R0+R2|KCNQ opener+hepatoprotective(shield)|→[liver,intestines,brain]
rosemary:#00cc44|R2|KCNQ3 opener,-62mV shift(brain-specific)|→[brain]
```

## TARGET_POSITIONS
```
brain:[0,1.78,0.05]
lungs_L:[-0.09,1.3,0.04]|lungs_R:[0.09,1.3,0.04]
liver:[0.06,1.14,0.06]
intestines:[0,0.88,0.04]
```
