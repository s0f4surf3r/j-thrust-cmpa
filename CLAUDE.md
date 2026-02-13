# J-THRUST

Retro-Gravitationsspiel inspiriert vom C64-Klassiker "Thrust".
Single-file HTML/Canvas-Spiel (j-thrust.html, ~178 KB).

## Benutzer
- Sprache: Deutsch bevorzugt

## Spielübersicht
- 800x600 Canvas, Pixel-Art-Stil
- **Spielmechanik**: Schiff steuern mit Thrust, Rotation, Gravitation, Trägheit, Tether/Pod
- **3 Modi**: Mission, Classic, Arena
- **5 Mission-Levels**: The Cavern, Narrow Descent, The Serpent, The Abyss, The Gauntlet
- **10 Classic Levels** (RLE-komprimierte Tilemaps): Outpost Alpha, Power Plant, The Reactor, Door Maze, The Descent, Planet Core, Gravity Well, Crystal Caves, The Stronghold, The Labyrinth
- **Features**: Fuel-System, Turrets, Sound, Highscore via localStorage, Settings auto-save
- **Terrain-Rendering**: Marching Squares + Contour Tracing + Chaikin-Smoothing

## Einstellungen (cfg)
- `cfg` Objekt: `{inertia, thrust, rotation, gravity, difficulty, tether, lives, sound, explo}`
- **Inertia** (1-10): DRAGS-Array, Trägheit/Reibung
- **Thrust** (1-10): cfg.thrust*0.02, Schubkraft
- **Rotation** (1-10): cfg.rotation*0.015, Drehgeschwindigkeit (mit Rampe: 30%→100% über ~14 Frames)
- **Gravity** (1-10): cfg.gravity*0.0035, Schwerkraft
- **Difficulty** (1-10): Kollisionsradius, Turret-Tracking/Speed/Feuerrate, Fuel-Verbrauch, Spawn-Anteil, Passage-Breite, Erosion, Breakable-Walls
- **Tether/Seillänge** (1-9): Classic: 40+(tether-1)*5 px (40-80px), Mission: 30+difficulty*5
- **Lives** (1-9): Startleben direkt
- **Sound** (1-2): WEICH (Triangle 0.04) / KLASSIK (Noise 0.08)
- **Explo** (1-3): KLASSIK (Rauschen+Beep) / SCI-FI (5-Layer-Synth) / V-KTOR (WAV-Sample, base64-eingebettet)
- **Presets**: LEICHT, KLASSIK, STANDARD, SCHWER + custom speicherbar
- Settings auto-save via localStorage ('thrustSettings')

## Audio-System
- `beep(freq, dur, type, vol)` — Allgemeiner Oszillator-Ton
- `boom()` — Klassischer Explosions-Sound (weißes Rauschen)
- `boom2()` — Sci-Fi Explosion (5 Layer: Transient, Bass-Punch+Distortion, Noise-Crunch, Debris, Metallic)
- `boom3(vol)` — V-KTOR WAV-Sample Wiedergabe
- `playBoom(vol)` — Einheitliche Explosions-Funktion, wählt nach cfg.explo
- `pew()` — Schuss-Sound (Sawtooth-Sweep mit LFO)
- `thrustSndOn/Off/Kill()` — Schub-Sound (looped)
- Eigener Tod: `playBoom(1.0)`, Feind/Turret: `playBoom(0.5)`
- Schuss-Cooldown: 8 Frames (~133ms)

## Classic-Level-Architektur
- **Tile-Typen**: 0=leer, 1=Fels, 9=zerbrechbar, 10=Tür (runtime aus d0/d1)
- **RLE-Encoding**: Ziffern 0-9=Tile, A-Z=1-26 Wiederholungen, a-z=27-52 Wiederholungen
- **Switches/Doors**: sw-Array mit Gruppen (g:0/g:1), d0/d1-Arrays für Tür-Tiles
- **Level-Daten**: `{n, w, h, sky, emp, rock, sp, pod, rx, fuels, turrets, tc, sw, d0, d1, t}`
- **Schwierigkeitsanpassung**: Turret-Anzahl, Fuel-Rate, Breakable-Walls, Passage-Erosion skalieren mit difficulty
- **Level-Positionen**: sp/pod/rx/fuels/turrets/sw speichern Pixel-Koordinaten OHNE OX-Offset (Spiel addiert OX in loadClassicLevel)

## States & Modes
- `state`: 'title'|'settings'|'playing'|'dead'|'gameover'|'win'|'paused'|'levelselect'|'complete'
- `mode`: 'mission'|'classic'|'arena'

## Wichtige Funktionen
- `getColR()`: SHIP_R*(0.2+difficulty*0.04) — Kollisionsradius
- `getTrkSpd()`: 0.004+difficulty*0.004 — Turret-Tracking
- `getBltSpd()`: 0.8+difficulty*0.2 — Turret-Schussgeschwindigkeit
- `getFireRate()`: 300-difficulty*20 — Turret-Feuerrate
- `getFuelRate()`: 0.3+difficulty*0.04 — Fuel-Verbrauch
- `getTether()`: Classic: 40+(tether-1)*5, Mission: 30+difficulty*5

## Konstanten
- SHIP_R=10, POD_R=8
- Canvas: W=800, H=600
- Tile-Größe: 8x8 px

## Dateien im Projekt
- `j-thrust.html` — Das komplette Spiel (single-file, ~185KB)
- `435413__v-ktor__explosion12.wav` — V-KTOR Explosions-Sample (84KB, 16-bit mono 44100Hz, ~1s)
- `settings-referenz.html` — Einstellungen-Referenztabelle (HTML)
- `gen-labyrinth.js` — Node.js Generator-Script für THE LABYRINTH Level
- `verify-labyrinth.js` — Verifikations-Script für Level-Integration
- `labyrinth-level.js` — Generierte Level-Daten (Zwischendatei)

## Bekannte Fixes (Session 2)
- Level 4-6: Passages verbreitert, Switches umplatziert, Türen komplett gemacht
- RLE-Encoder Off-by-one Bug bei extra>52 gefixt

## Session 3: THE LABYRINTH + Rotation-Rampe
- **THE LABYRINTH** (Classic Level 10): Riesenlevel 82×350 Tiles, 12 Serpentinen-Etagen, 5-Tile-Korridore, 5-Tile-Schächte, 7 Fuel-Depots, keine Turrets/Doors
- **gen-labyrinth.js**: Prozeduraler Generator mit RLE-Encoding, Roundtrip-Verifikation
- **Rotations-Rampe**: rotHoldL/rotHoldR Zähler, Faktor `min(1, 0.3 + hold*0.05)` → 30%-100% über ~14 Frames
- **Fix**: Level-Positionen dürfen OX nicht enthalten (Spiel addiert OX beim Laden)
