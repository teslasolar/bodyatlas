# STD:LAYERS v1.0
# Body↔Planet mapping | 7 layers = 7 rings
# KONOMI COMPRESSED — sub-250 tokens per block

## UDT:Layer
```
{id,name,bodyName,ring,ringLabel,color,planet,bodyMap,kChannels,liveKey,defaultVis,defaultOp}
```

## L0:SKIN
```
id:skin|name:Magnetosphere|body:Skin|ring:0|label:R0 GROUND|color:#ff4444
vis:true|op:0.3|liveKey:kpIndex
planet:boundary between planet+space,compressed by solar wind,expanded in calm
bodyMap:skin=magnetosphere,both outermost boundary,both respond to pressure
kCh:KCNQ4 skin mechanoreceptors→cusps=magnetospheric K+ channels,polar openings where solar wind leaks
```

## L1:MUSCLES
```
id:muscles|name:Tectonic Plates|body:Muscles|ring:1|label:R1 SENSORS|color:#00aaff
vis:true|op:0.8|liveKey:earthquakeEnergy
planet:15 major plates,slip=earthquakes,push=mountains,proprioception via seismic waves
bodyMap:muscles=tectonics,both movement layer,cramps=quakes,seismic=proprioceptive signals
kCh:KCNQ2/3 motor neurons→fault lines=tectonic K+ channels,stress accumulates then releases(action potential)
```

## L2:ORGANS
```
id:organs|name:Core Processes|body:Organs|ring:2|label:R2 GATE|color:#ffaa00
vis:true|op:0.9|liveKey:solarDensity
planet:outer core=heart(convection→magnetic field),mantle=gut(digesting rock),volcanism=digestive output
bodyMap:organs=core,geodynamo=cardiac gate,core convection rhythm=heartbeat,reversals=cardiac failure
kCh:KCNQ1 cardiac rhythm→geodynamo rhythm,both gate the system,failure=Long QT|pole reversal
sub:OuterCore=heart dynamo|InnerCore=deepest identity|Mantle=slow gut|Volcanoes=excretory
```

## L3:VESSELS
```
id:vessels|name:Ocean Currents|body:Vessels|ring:3|label:R3 AFFECT|color:#44cc66
vis:true|op:0.7|liveKey:solarSpeed
planet:thermohaline=cardiovascular,moves heat like blood moves heat,AMOC weakening=cold hands
bodyMap:arteries=warm currents(Gulf Stream),veins=cold deep,AMOC=aorta,rivers=lymphatic
kCh:KCNQ4/5 vascular smooth muscle→ocean gradient=smooth muscle,warming→circulation change
```

## L4:NERVES
```
id:nerves|name:Schumann+Lightning|body:Nerves|ring:4|label:R4/5/6|color:#aa44ff
vis:true|op:0.8|liveKey:schumann
planet:Schumann 7.83Hz=Earth brain wave(=human theta),1800 strikes/sec=neural firing,ionosphere-surface=brain
bodyMap:ionosphere=cortex,surface=brainstem,lightning=action potentials,7.83Hz=planetary M-current
kCh:KCNQ2/3 M-current→Schumann=planetary M-current,same freq range,biology evolved INSIDE this field
sub:Schumann=resting frequency|Lightning=global firing rate|Ionosphere=cortex|Telluric=peripheral nerves
```

## L5:SKELETON
```
id:skeleton|name:Mantle/Crust|body:Skeleton|ring:5|label:R5 IDENTITY|color:#ffffff
vis:true|op:0.9|liveKey:earthquakeCount
planet:cratons 4Gyr old=oldest bones,crust 5-70km=thin eggshell,everything stands on it
bodyMap:lithosphere=skeleton,continental shapes=face structure,plate boundaries=joints,mountains=spine
kCh:osteoblast remodeling→tectonic remodeling,both slowest timescale,identity changes slowly
```

## L6:ENERGY
```
id:energy|name:Geomagnetic Field|body:Energy|ring:6|label:R6/R7 OBSERVER|color:#ffd700
vis:false|op:0.5|liveKey:kpIndex
planet:geomagnetic field extends 65000km,without it solar wind strips atmosphere(see:Mars)
bodyMap:bioelectric field=geomagnetic field,both from internal dynamo,both measurable,both protective
kCh:every K+ opening=bioelectric field at cell scale,every core convection cell=geomagnetic at planet scale
```
