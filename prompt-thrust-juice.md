# Prompt für Claude Code: STRAFE JUICE – J-THRUST

## Kontext
Die Datei `j-thrust.html` hat bereits eine funktionierende CPMA Strafe-Mechanik (Zeile 1248-1282). A+Rechts / D+Links erzeugt Strafe-Boost, Speed-Cap funktioniert. ABER: Es fühlt sich nicht gut an. Es fehlt "Juice" – also das audiovisuelle Feedback das die Mechanik von "funktioniert" zu "fühlt sich geil an" bringt.

## KRITISCH – Bestehenden Code schützen
### Regel: NUR ADDITIV arbeiten
- Die Strafe-Physik (Zeile 1248-1282) NICHT verändern – die Werte stimmen
- `updateShip()`, Pod-Logik, Kollision, Level-Daten: NICHT anfassen
- Bestehende Render-Funktionen: Nur ergänzen, nicht umschreiben
- ZUERST ein Backup machen: `j-thrust-backup.html`
- Neuer Code in markierten Blöcken: `// === STRAFE JUICE ===`
- Nach dem Umbau muss das Spiel OHNE A/D exakt gleich sein wie vorher

## Aufgabe: 6 Juice-Elemente einbauen

### 1. KAMERA-ZOOM (wichtigster Effekt)
Wenn Speed über 4.0 steigt, soll die Kamera leicht rauszoomen – der Spieler sieht mehr Umgebung, alles fühlt sich schneller an. Das ist der FOV-Effekt aus Quake, übersetzt in 2D.

**Umsetzung:**
- Neue Variable: `camZoom = 1.0`
- Target-Zoom berechnen: `targetZoom = 1.0 - Math.min(0.15, (speed - 4) * 0.02)` (also max 15% rauszoomen bei Topspeed)
- `camZoom` sanft interpolieren: `camZoom += (targetZoom - camZoom) * 0.05`
- Im Render (vor dem Zeichnen der Spielwelt): `$.save(); $.translate(W/2, H/2); $.scale(camZoom, camZoom); $.translate(-W/2, -H/2);` und am Ende `$.restore();`
- Wenn Speed unter 4.0: `targetZoom = 1.0` (sanft zurückzoomen)
- WICHTIG: Das HUD (`renderHUD()`) AUSSERHALB des Zoom-Transforms rendern, damit Anzeigen nicht mitskalieren

### 2. WIND-SOUND
Ein Rausch-Sound der mit Speed lauter wird. Gibt dem Spieler akustisches Feedback ohne hinzuschauen.

**Umsetzung:**
- Neues Audio-Setup (ähnlich wie `thrustSndOn/Off`):
  - Weißes Rauschen (BufferSource mit random samples, loop=true)
  - Bandpass-Filter bei ~800Hz
  - Gain-Node der mit Speed gesteuert wird
- Gain-Mapping: `volume = Math.max(0, (speed - 3) * 0.015)` – also ab Speed 3 leise einsetzend, bei Topspeed deutlich hörbar aber nicht nervig
- NICHT den bestehenden Thrust-Sound ersetzen – das ist ein zusätzlicher Layer
- Den Sound in `updateShip()` am Ende updaten, direkt nach der Strafe-Mechanik

### 3. SCREEN-SHAKE bei Boost-Aufbau
Wenn der Spieler aktiv Strafe-Boost aufbaut (strafeActive === true), soll die Kamera leicht vibrieren. Nicht viel – gerade genug um "Energie" zu kommunizieren.

**Umsetzung:**
- Wenn `strafeActive` und Speed > 5.0:
  - `shakeX = (Math.random() - 0.5) * Math.min(3, (speed - 5) * 0.5)`
  - `shakeY = (Math.random() - 0.5) * Math.min(3, (speed - 5) * 0.5)`
- In den Kamera-Transform einbauen (zusätzlich zum Zoom)
- Wenn nicht aktiv: Shake auf 0 setzen (kein Interpolieren, sofort stoppen)

### 4. SPEED-LINES VERBESSERN
Die bestehenden Speed-Lines (Zeile 1666-1672) sind zu subtil. Ersetze sie durch bessere:

**Umsetzung:**
- Mehr Linien: bis zu 12 statt 6
- Länger: `len = spd * (3 + Math.random() * 2)` statt `spd * (1.5 + Math.random())`
- Dicker bei höherem Speed: `lineWidth = 1 + (spd - 4) * 0.3`
- Opacity höher: `Math.min(0.9, (spd - 4) * 0.2)` statt `0.12`
- Die Linien sollen VOR dem Schiff spawnen (in Bewegungsrichtung), nicht zufällig
- Einen leichten Glow-Effekt: `$.shadowColor = '#0ff'; $.shadowBlur = 4;` (danach shadowBlur zurücksetzen)

### 5. PARTIKEL-BURST bei Speed-Schwellen
Wenn der Spieler bestimmte Speed-Schwellen durchbricht, soll ein kurzer Partikel-Burst kommen – wie ein Feedback "du wirst schneller!"

**Umsetzung:**
- Schwellen: Speed 5.0, 6.0, 7.0 (jeweils beim Überschreiten, nicht dauerhaft)
- Variable `lastSpeedThreshold = 0` trackt die letzte erreichte Schwelle
- Bei Überschreitung: 8-12 Partikel in einem Ring um das Schiff, Typ 's' (cyan)
- Kurzer Beep: `beep(800 + threshold * 200, 0.08, 'sine', 0.04)` – höherer Ton bei höherer Schwelle
- Reset wenn Speed unter die Schwelle fällt (damit der Burst erneut kommen kann)

### 6. MOMENTUM-BALKEN VERBESSERN
Der bestehende Momentum-Balken (Zeile 1747-1754) ist klein und unauffällig. Mach ihn besser:

**Umsetzung:**
- Position: Unter der Fuel-Leiste (links oben), nicht rechts
- Größe: Gleich breit wie die Fuel-Leiste (150px breit, 8px hoch)
- Label: "FLOW" statt nichts
- Farben: Grün (0-4 Speed) → Cyan (4-6) → Gelb (6-8) → Rot (8+)
- Pulsierender Glow wenn strafeActive: `$.shadowColor = '#0ff'; $.shadowBlur = 6 + Math.sin(Date.now() * 0.01) * 4;`
- Den alten Momentum-Balken rechts entfernen

## Reihenfolge der Umsetzung
1. Kamera-Zoom (größter Impact auf das Gefühl)
2. Wind-Sound (zweitgrößter Impact)
3. Speed-Lines verbessern
4. Screen-Shake
5. Partikel-Burst
6. Momentum-Balken

Teste nach jedem Schritt ob das Spiel noch sauber läuft.

## Testing
- Spiel OHNE A/D: Muss sich exakt gleich anfühlen, kein Zoom, kein Wind, kein Shake
- Spiel MIT Strafe: Zoom, Wind, Shake müssen sanft ein- und ausblenden
- Check ob HUD lesbar bleibt (nicht mitzoomt)
- Check ob Wind-Sound aufhört wenn man stirbt oder pausiert
- Check ob der Zoom in engen Höhlen nicht dazu führt dass man Wände nicht mehr sieht
