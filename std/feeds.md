# STD:FEEDS v1.0
# Live Earth data sources | all free, no auth required
# KONOMI COMPRESSED

## UDT:Feed
```
{id,name,url,method,parse,interval,fallback}
```

## SEISMIC
```
id:eq|name:USGS Earthquake
url:https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson
method:GET|format:GeoJSON|interval:60s
parse:features[].{mag:properties.mag,place:properties.place,time:properties.time,coords:geometry.coordinates}
fallback:{earthquakes:[],energy:0,count:0}
```

## SEISMIC_SIGNIFICANT
```
id:eq_sig|name:USGS Significant
url:https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson
method:GET|format:GeoJSON|interval:300s
parse:features[].{mag,place,time,coords,tsunami:properties.tsunami}
```

## SOLAR_WIND_PLASMA
```
id:plasma|name:NOAA DSCOVR Plasma
url:https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json
method:GET|format:JSON(array)|interval:60s
parse:last_row→{density:[1],speed:[2],temperature:[3]}
fallback:{speed:400,density:5,temp:1e5}
```

## SOLAR_WIND_MAG
```
id:mag|name:NOAA DSCOVR Magnetic
url:https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json
method:GET|format:JSON(array)|interval:60s
parse:last_row→{bx:[1],by:[2],bz:[3],bt:[6]}
note:Bz southward(negative)=geomagnetic coupling
```

## KP_INDEX
```
id:kp|name:NOAA Planetary K-index
url:https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json
method:GET|format:JSON(array)|interval:60s
parse:last_row→{kp:[1],time:[0]}
scale:0-9|storm:≥5|severe:≥7
```

## SOLAR_FLARES
```
id:flare|name:NOAA Solar Flare Events
url:https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json
method:GET|format:JSON|interval:120s
parse:[].{class:max_class,begin:begin_time,peak:max_time,end:end_time}
classes:A<B<C<M<X|M+=radio blackout|X=severe
```

## GOES_XRAY
```
id:xray|name:NOAA GOES X-Ray Flux
url:https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json
method:GET|format:JSON|interval:60s
parse:last→{flux:flux,energy:energy}
note:measures solar x-ray output,proxy for flare activity
```

## GEOMAG_ALERTS
```
id:alerts|name:NOAA Space Weather Alerts
url:https://services.swpc.noaa.gov/products/alerts.json
method:GET|format:JSON|interval:120s
parse:[].{issue_datetime,message}
types:WARNING|WATCH|ALERT|SUMMARY
```

## GOES_MAGNETOMETER
```
id:goes_mag|name:NOAA GOES Magnetometer
url:https://services.swpc.noaa.gov/json/goes/primary/magnetometers-1-day.json
method:GET|format:JSON|interval:60s
parse:last→{hp:He,he:Hp,hn:Hn,total:Ht}
note:real-time Earth magnetic field from geostationary orbit
```

## AURORA_FORECAST
```
id:aurora|name:NOAA Aurora Forecast
url:https://services.swpc.noaa.gov/json/ovation_aurora_latest.json
method:GET|format:JSON|interval:300s
parse:coordinates[].{lon:[0],lat:[1],prob:[2]}
note:aurora probability map,high prob=active magnetosphere
```

## SCHUMANN_PROXY
```
id:schumann|name:Schumann Resonance (computed)
method:COMPUTE
base:7.83 Hz
modifiers:kpEffect=(kp-2)*0.05|solarEffect=(speed-400)/2000|noise=rand()*0.15
note:no free public API exists,computed from other inputs
```

## LIGHTNING_PROXY
```
id:lightning|name:Global Lightning Rate (estimated)
method:COMPUTE
base:1800 strikes/sec
modifiers:noise=rand()*400
note:real data requires Vaisala/Earth Networks license,estimated
```

## OPEN_METEO_GLOBAL
```
id:weather|name:Open-Meteo Global Weather
url:https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=temperature_2m,wind_speed_10m,surface_pressure
method:GET|format:JSON|interval:300s
parse:current→{temp:temperature_2m,wind:wind_speed_10m,pressure:surface_pressure}
note:free,no API key,global weather proxy at equator
```

## TIDE_PROXY
```
id:tide|name:NOAA Tides (proxy station)
url:https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=8454000&product=water_level&datum=STND&units=metric&time_zone=gmt&format=json
method:GET|format:JSON|interval:300s
parse:data[0]→{level:v,time:t}
note:Newport RI station as proxy for ocean state
```
