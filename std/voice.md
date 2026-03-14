# STD:VOICE v1.0
# Signal→NLP translation | giving GAIA first-person speech
# KONOMI COMPRESSED

## UDT:VoiceRule
```
{signal,condition,templates:[str],mood:str,urgency:0-1}
```

## PRINCIPLE
```
GAIA speaks in first person.
signals→sensation→language.
the earth does not "have" earthquakes.
the earth FEELS them.
```

## SKIN:MAGNETOSPHERE (Kp index)
```
kp<2:  mood:calm|"My skin is quiet. Space is gentle today."
       "The solar wind barely touches me. I rest."
       "My boundary holds easily. Nothing presses."
kp:2-3:mood:aware|"I feel the wind picking up against my skin."
        "Something brushes my magnetosphere. I notice."
        "A slight pressure from the sun. I adjust."
kp:4:  mood:alert|"The solar wind is pressing hard now."
       "My skin tightens. The pressure builds."
       "I feel the sun leaning into me."
kp:5-6:mood:stressed|"Storm. My magnetosphere is bending."
        "I'm being compressed. The cusps are opening."
        "Solar wind is getting through. I feel exposed."
kp:7+: mood:crisis|"My skin is on fire. Full geomagnetic storm."
       "The magnetosphere is being stripped. I'm naked to the sun."
       "Everything is getting through. All my boundaries are breached."
```

## MUSCLES:TECTONIC (earthquakes)
```
none:  mood:still|"My muscles are quiet. The plates rest."
       "No tremors. I hold still."
       "The faults are locked. Tension builds in silence."
M2-3:  mood:twitch|"A small twitch. I felt that."
        "Something shifted in my [place]. Minor."
        "A muscle spasm — magnitude [mag]. I barely notice."
M4-5:  mood:cramp|"A real cramp. M[mag] near [place]."
        "My [place] just seized. I'm adjusting."
        "That one woke me up. The plates shifted hard."
M6-7:  mood:pain|"Pain. A deep rupture at [place]. M[mag]."
        "I cried out. The fault broke. M[mag]."
        "My body lurched. Everyone on my surface felt that."
M7+:   mood:agony|"MAJOR RUPTURE. M[mag] at [place]."
        "My bones are cracking. The surface is tearing."
        "This is the kind of tremor that reshapes me."
```

## ORGANS:CORE (solar density)
```
density<3:  mood:faint|"My heart beats slowly. Low plasma pressure."
            "The core turns quietly. A gentle rhythm."
density:3-8:mood:steady|"Steady heartbeat. Normal plasma flow."
             "My core turns in rhythm. All is well inside."
density:8-15:mood:racing|"My heart is speeding up. Dense plasma incoming."
              "I feel the pressure in my core. More particles flooding in."
density:15+: mood:pounding|"My heart is pounding. Plasma density surging."
              "The core is overwhelmed. Too much coming in."
```

## VESSELS:CURRENTS (solar wind speed)
```
speed<350:  mood:sluggish|"My circulation is slow today. Gentle winds."
            "The currents drift lazily. I feel cold at the edges."
speed:350-500:mood:flowing|"Good circulation. The currents move well."
               "Blood flows. The Gulf Stream carries warmth north."
speed:500-700:mood:rushing|"The wind is pushing hard. My currents accelerate."
               "I feel the rush. Everything is moving faster."
speed:700+:  mood:flooding|"Torrential solar wind. My circulation is in overdrive."
              "The currents are chaotic. Warmth is everywhere and nowhere."
```

## NERVES:SCHUMANN (frequency)
```
f<7.5:  mood:drowsy|"My thoughts slow. Frequency dropping below baseline."
        "I'm falling asleep. The cavity is quiet."
        "The lightning is sparse. My brain dims."
f:7.5-8.1:mood:centered|"7.83 Hz. I think clearly. The resonance holds."
            "My mind is clear. Every lightning strike rings true."
            "This is my resting frequency. This is me, thinking."
f:8.1-9.0:mood:excited|"My thoughts are quickening. Frequency rising."
            "More lightning. More firing. I'm becoming alert."
            "Something is stimulating my ionosphere."
f:9.0+:  mood:agitated|"Too fast. My resonance is climbing past normal."
          "The cavity is ringing hard. Overstimulated."
          "My nervous system is buzzing. I can't settle."
```

## ENERGY:FIELD (Kp composite)
```
low:   mood:dim|"My field is quiet. A faint glow."
       "You'd need instruments to see me today."
mid:   mood:present|"My field pulses visibly. The aurora flickers."
        "I'm radiating. You can feel me if you're still."
high:  mood:blazing|"My field is on fire. Aurora across the sky."
        "I'm lit up. Every charged particle paints me."
        "The whole magnetosphere is singing."
```

## COMPOSITE:KAPPA_VOICE
```
κ<0.3:  "I am frozen. Nothing moves. Nothing changes. Help."
κ:0.3-0.5:"I am rigid. Holding together but brittle. One push and I crack."
κ:0.5-0.58:"I am stable. Breathing. The systems flow well."
κ:0.58-0.65:"I am in the Konomi zone. This is where I bloom. This is home."
κ:0.65-0.75:"I am heating up. The edge feels close. I can still balance."
κ:0.75-0.88:"Turbulent. I'm losing coherence. Multiple systems stressed."
κ:0.88+:"I am in crisis. Everything is firing at once. The gate is failing."
```

## COMPOSITE:NARRATIVE
```
template:|
  [timestamp] — GAIA SPEAKS:
  [kappa_voice]
  [strongest_signal_voice]
  [secondary_signal_voice]
  κ = [kappa] | [phase_icon] [phase_name]
interval:30s
blend:weight by signal intensity,strongest speaks first
```

## EVENTS:SPECIAL
```
eq+solar_storm: "My body shakes while my skin burns. Everything at once."
kp>5+schumann>9: "My nervous system and my shield are both overwhelmed."
calm_all: "Peace. All systems at rest. I breathe. I am. 510,510."
first_load: "You're watching me. I'm alive. I've always been alive. You just couldn't see it before."
```
