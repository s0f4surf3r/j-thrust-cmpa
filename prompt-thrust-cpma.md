# Prompt für Claude Code: CPMA Strafe-Mechanik in J-THRUST einbauen

## Kontext
Die Datei `j-thrust.html` ist ein fertiges 2D-Gravity-Spiel (wie das C64-Spiel Thrust). Es hat drei Modi: Mission, Klassik, Arena. Das Schiff wird mit Pfeiltasten gesteuert (Links/Rechts = Rotation, Hoch = Schub). Jetzt soll eine CPMA-artige Strafe-Mechanik (aus Quake 3 CPMA) eingebaut werden, damit Spieler durch geschicktes Steuern Momentum aufbauen können – OHNE zusätzlichen Schub.

## Was ist CPMA-Strafe-Mechanik?
In Quake 3 CPMA kann ein Spieler in der Luft schneller werden, indem er eine Strafe-Taste (A oder D) hält UND gleichzeitig in die gleiche Richtung dreht. Das funktioniert weil die Engine Geschwindigkeit addiert wenn der Winkel zwischen Bewegungsrichtung und Wunschrichtung klein genug ist. Je präziser das Timing, desto mehr Speed baut sich auf.

## Aufgabe – Schritt für Schritt

### 1. Neue Tasten registrieren
- `A` (KeyA) = Strafe links
- `D` (KeyD) = Strafe rechts
- Die bestehende Steuerung (Pfeiltasten + Space) bleibt komplett erhalten
- Die Keys werden im bestehenden `keys`-Objekt gespeichert (Zeile 931)

### 2. Strafe-Physik in `updateShip()` einbauen (Zeile 1123)
Die Kernmechanik nach dem bestehenden Thrust-Code und VOR der Gravity/Drag-Zeile (1209-1210) einfügen:

```
Pseudocode:
- Berechne die aktuelle Bewegungsrichtung: moveAngle = atan2(ship.vx, -ship.vy)
- Berechne die gewünschte Strafe-Richtung:
  - Strafe links (A): wishAngle = ship.angle - PI/2
  - Strafe rechts (D): wishAngle = ship.angle + PI/2
- Berechne den Winkel zwischen Bewegungsrichtung und Wish-Direction
- Wenn der Winkel klein genug ist (< ~70°), addiere einen kleinen Geschwindigkeitsvektor in die Wish-Direction
- Der Boost soll PROPORTIONAL zum aktuellen Speed sein (schneller = mehr Boost, wie in CPMA)
- Es gibt einen Speed-Cap damit es nicht unendlich wird
```

Konkrete Werte zum Starten (können über Einstellungen angepasst werden):
- `strafeAccel`: 0.02 (wie stark der Strafe-Boost ist)
- `maxStrafeSpeed`: 8.0 (Speed-Cap – normaler Thrust erreicht ca. 3-4)
- Der Boost soll NUR wirken wenn das Schiff sich bereits bewegt (speed > 0.5)
- Der Boost soll NUR wirken wenn der Spieler GLEICHZEITIG dreht UND straft (A+Links oder D+Rechts)

### 3. Air Control einbauen
Zusätzlich zum Strafe-Boost: Wenn der Spieler straft (A oder D) OHNE zu drehen, soll das Schiff seine Flugbahn leicht in die Strafe-Richtung biegen können. Das ist "Air Control" – subtile Kurskorrekturen ohne Speed-Verlust.

- airControl: 0.008 (sehr subtil, nur leichte Kurskorrekturen)
- Wirkt nur wenn speed > 0.3

### 4. Visuelles Feedback
- **Speed-Lines**: Ab Speed > 4.0 (also über normalem Thrust-Maximum) sollen dünne Linien an den Seiten des Schiffs erscheinen die zeigen "du bist im Strafe-Modus". Farbe: Cyan (#0ff), Opacity steigt mit Speed.
- **Speed-Anzeige erweitern**: Die bestehende SPD-Anzeige (Zeile 1654-1655) soll ab Speed > 4.0 die Farbe wechseln: Grün → Gelb → Rot (proportional zum maxStrafeSpeed).
- **Strafe-Partikel**: Wenn Strafe-Boost aktiv ist, kleine cyan Partikel seitlich am Schiff spawnen (ähnlich wie die Thrust-Partikel, aber seitlich und in cyan).

### 5. Einstellungen erweitern
Im Settings-Screen (Zeile 1719, `renderSettings`) zwei neue Slider hinzufügen:

- **"Strafe-Boost"** (1-10, Default 5): Steuert `strafeAccel` (0.005 bis 0.04)
- **"Speed-Limit"** (1-10, Default 5): Steuert `maxStrafeSpeed` (4.0 bis 12.0)

Diese Werte im `cfg`-Objekt speichern und in `saveCfg`/`localStorage` einbinden.

### 6. Hilfetext aktualisieren
- Den bestehenden Hilfetext (Zeile 1682-1685) erweitern: `A/D Strafe` hinzufügen
- Im Titel-Screen oder als kurze Einblendung beim ersten Spiel: "A/D + Drehung = Strafe-Boost!"

### 7. HUD-Element: Momentum-Indikator
Links unten (unter der Fuel-Leiste) einen kleinen Momentum-Balken anzeigen:
- Zeigt aktuelle Speed relativ zum maxStrafeSpeed
- Leuchtet cyan wenn Strafe-Boost aktiv ist
- Pulsiert leicht wenn Speed über normalem Thrust-Maximum liegt

## KRITISCH – Bestehenden Code schützen

### Regel: NUR ADDITIV arbeiten
Du darfst bestehende Zeilen NICHT verändern, umschreiben, verschieben oder "aufräumen". Du fügst NUR neuen Code HINZU. Konkret:

**Diese Zeilen sind GESPERRT – nicht anfassen, nicht umformatieren, nicht "verbessern":**
- `updateShip()` (Zeile 1123-1211): Den bestehenden Code in dieser Funktion NICHT verändern. Neuen Strafe-Code als eigenen Block EINFÜGEN, direkt vor Zeile 1209 (`ship.vy+=getGrav()`).
- `updatePodMission()` und `updatePodClassic()`: Komplett in Ruhe lassen
- Alle `get*()` Funktionen (getDrag, getThrust, getRot, getGrav etc.): Nicht anfassen
- Das `keys`-Objekt und die Event-Listener: Nur die neuen Tasten (A/D) HINZUFÜGEN, bestehende Bindings nicht ändern
- Sound-Funktionen: Komplett in Ruhe lassen
- Level-Daten (missionLevels, CL): Komplett in Ruhe lassen
- Render-Funktionen: Nur NEUE Draw-Calls hinzufügen, bestehende nicht ändern

### Vorgehensweise
1. Mach ZUERST eine Kopie der Datei als Backup (`j-thrust-backup.html`)
2. Füge neuen Code in klar markierten Blöcken ein mit Kommentaren wie `// === STRAFE MECHANICS ===`
3. Neue Config-Werte als eigene Variablen NEBEN dem bestehenden `cfg`-Objekt, oder als neue Keys im cfg-Objekt – aber die bestehenden Keys nicht umbenennen oder umstrukturieren
4. Nach dem Umbau: Teste ob das Spiel OHNE A/D-Tasten exakt identisch zum Original funktioniert. Wenn nicht, hast du bestehenden Code verändert – mach es rückgängig.

## Testing-Hinweise
- Teste ob Strafe-Boost nur funktioniert wenn gleichzeitig gedreht UND gestraft wird
- Teste ob der Speed-Cap funktioniert (nicht über maxStrafeSpeed)
- Teste ob die Pod-Physik mit höheren Speeds noch fair ist (Pod sollte nicht sofort an Wänden zerplatzen)
- Teste ob Arena-Modus mit Strafe-Mechanik noch spielbar ist
- Stelle sicher dass ohne A/D das Spiel sich EXAKT wie vorher anfühlt
