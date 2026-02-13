#!/usr/bin/env node
// gen-labyrinth.js — Generator für "THE LABYRINTH" Level (J-THRUST)
// Erzeugt ein Riesenlevel: Serpentinen-Labyrinth, keine Turrets/Doors.
// Usage: node gen-labyrinth.js > labyrinth-level.js

const W = 82, H = 350;
const SKY = 17;
const OX = 72; // Pixel-Offset: (800 - 82*8) / 2

// ─── Grid-Initialisierung ───────────────────────────────────────────
const grid = [];
for (let r = 0; r < H; r++) {
  grid[r] = new Array(W).fill(r < SKY ? 0 : 1);
}

// Rechteck freifräsen (auf 0 setzen)
function carve(r1, r2, c1, c2) {
  for (let r = Math.max(0, r1); r <= Math.min(H - 1, r2); r++) {
    for (let c = Math.max(0, c1); c <= Math.min(W - 1, c2); c++) {
      grid[r][c] = 0;
    }
  }
}

// Rechteck füllen (auf 1 setzen)
function fill(r1, r2, c1, c2) {
  for (let r = Math.max(0, r1); r <= Math.min(H - 1, r2); r++) {
    for (let c = Math.max(0, c1); c <= Math.min(W - 1, c2); c++) {
      grid[r][c] = 1;
    }
  }
}

// ─── Layout-Parameter ───────────────────────────────────────────────
const TOP_WALL = 3;     // Obere Felswand (Zeilen 17-19)
const CORR_H = 5;       // Korridorhöhe in Tiles (war 3, +50%)
const SHAFT_W = 5;      // Schachtbreite in Tiles (war 3, +50%)
const NUM_FLOORS = 12;  // Anzahl horizontaler Etagen
const GAP = 24;         // Wanddicke zwischen Etagen (Schachtlänge)

// Korridor-Spaltenbereich
const LEFT_COL = 5;
const RIGHT_COL = 76;

// Schacht-Positionen (5 Tiles breit statt 3)
const L_SHAFT_L = 5,  L_SHAFT_R = 9;   // Linker Schacht: Spalten 5-9
const R_SHAFT_L = 72, R_SHAFT_R = 76;  // Rechter Schacht: Spalten 72-76

// Spawn-Öffnung in der Deckenwand
const SPAWN_L = 27, SPAWN_R = 34;  // 8 Tiles breit

// ─── Spawn-Öffnung fräsen (Zeilen 17-19) ───────────────────────────
carve(SKY, SKY + TOP_WALL - 1, SPAWN_L, SPAWN_R);

// ─── Serpentinen-Korridore ──────────────────────────────────────────
const floors = [];
for (let i = 0; i < NUM_FLOORS; i++) {
  const startRow = SKY + TOP_WALL + i * (CORR_H + GAP);
  floors.push({ row: startRow, idx: i });

  // Horizontalen Korridor fräsen (3 Tiles hoch, volle Breite)
  carve(startRow, startRow + CORR_H - 1, LEFT_COL, RIGHT_COL);

  // Verbindungsschacht zur nächsten Etage
  if (i < NUM_FLOORS - 1) {
    const shaftTop = startRow + CORR_H;
    const shaftBot = startRow + CORR_H + GAP - 1;

    if (i % 2 === 0) {
      // Gerade Etage (0,2,4...): Schacht RECHTS
      carve(shaftTop, shaftBot, R_SHAFT_L, R_SHAFT_R);
    } else {
      // Ungerade Etage (1,3,5...): Schacht LINKS
      carve(shaftTop, shaftBot, L_SHAFT_L, L_SHAFT_R);
    }
  }
}

// ─── Fuel-Zonen: Korridor auf 5 Tiles verbreitern ──────────────────
const fuelFloorIndices = [0, 2, 4, 6, 8, 10, 11];
const fuels = [];

for (const fi of fuelFloorIndices) {
  const f = floors[fi];
  const midRow = f.row + Math.floor(CORR_H / 2); // Mittlere Zeile des Korridors

  // Fuel-Spalte variiert je nach Etage
  let fuelCol;
  if (fi === 0)       fuelCol = 20;  // Nahe Spawn
  else if (fi === 11) fuelCol = 15;  // Nahe Pod
  else                fuelCol = 40;  // Korridormitte

  // Korridor auf 5 Tiles verbreitern (1 oben + 1 unten extra)
  // Breite der Fuel-Zone: 7 Tiles
  // Nicht in die Deckenwand (oberhalb SKY+TOP_WALL) fräsen
  const widenTop = Math.max(f.row - 1, SKY + TOP_WALL);
  carve(widenTop, f.row + CORR_H, fuelCol - 3, fuelCol + 3);

  fuels.push({ x: fuelCol * 8, y: midRow * 8 });
}

// ─── Pod-Kammer: Größere Fläche am Ende für Wendemanöver ───────────
const lastFloor = floors[NUM_FLOORS - 1];
// Kammer: 8 Tiles hoch × 12 Tiles breit am linken Ende von Floor 12
// (Etage 12 ist gerade → Spieler kommt von rechts, Pod ist links)
carve(lastFloor.row - 1, lastFloor.row + CORR_H + 2, LEFT_COL, LEFT_COL + 11);

// ─── Nadelöhre (Pinch Points): Korridor um 2 Tiles verengen ────────
// Auf Etagen ohne Fuel (1, 3, 5, 7, 9)
const pinchFloors = [1, 3, 5, 7, 9];
const pinchPositions = [32, 48, 25, 55, 38]; // Verschiedene Positionen
for (let p = 0; p < pinchFloors.length; p++) {
  const f = floors[pinchFloors[p]];
  const pinchStart = pinchPositions[p];
  const pinchLen = 6; // 6 Tiles lang
  // 2 Zeilen auffüllen (oben+unten) → 5→3 Tiles
  fill(f.row, f.row, pinchStart, pinchStart + pinchLen - 1);
  fill(f.row + CORR_H - 1, f.row + CORR_H - 1, pinchStart, pinchStart + pinchLen - 1);
}

// ─── Positionen (Pixel-Koordinaten) ─────────────────────────────────
const spawnCol = Math.floor((SPAWN_L + SPAWN_R) / 2); // ~30
const sp = { x: spawnCol * 8, y: (SKY + 1) * 8 };                  // Spawn in Deckenöffnung
const pod = { x: (LEFT_COL + 4) * 8, y: (lastFloor.row + 1) * 8 };  // Pod-Kammer
const rx = { x: sp.x, y: sp.y };                                   // Rückkehrpunkt = Spawn

// ─── RLE-Encoder ────────────────────────────────────────────────────
function encRLE(row) {
  let result = '';
  let i = 0;
  while (i < row.length) {
    const digit = row[i];
    let count = 1;
    while (i + count < row.length && row[i + count] === digit) count++;

    result += String(digit);
    let rem = count - 1;
    while (rem > 0) {
      if (rem <= 26) {
        // A-Z: 1-26 Wiederholungen extra
        result += String.fromCharCode(64 + rem);
        rem = 0;
      } else if (rem <= 52) {
        // a-z: 27-52 Wiederholungen extra
        result += String.fromCharCode(70 + rem);
        rem = 0;
      } else {
        // z = 52 extra, Rest weiter
        result += 'z';
        rem -= 52;
      }
    }
    i += count;
  }
  return result;
}

// ─── RLE-Decoder (Verifikation) ─────────────────────────────────────
function decRLE(s) {
  let r = '', last = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c >= '0' && c <= '9') { r += c; last = c; }
    else {
      let n;
      if (c >= 'A' && c <= 'Z') n = c.charCodeAt(0) - 63;
      else n = c.charCodeAt(0) - 69;
      r += last.repeat(n - 1);
    }
  }
  return r;
}

// ─── Terrain-Zeilen erzeugen ────────────────────────────────────────
// Nur Terrain-Zeilen (ab SKY), Sky wird vom Spiel generiert.
// Trailing all-solid Zeilen weglassen (Bedrock-Autofill).

const tRows = [];
let lastContentRow = SKY; // Letzte Zeile mit Inhalt (nicht nur solid)

// Finde letzte Zeile, die nicht komplett solid ist
for (let r = H - 1; r >= SKY; r--) {
  if (grid[r].some(c => c !== 1)) {
    lastContentRow = r;
    break;
  }
}

// Encode und verifiziere jede Zeile
for (let r = SKY; r <= lastContentRow; r++) {
  const encoded = encRLE(grid[r]);

  // Roundtrip-Verifikation
  const decoded = decRLE(encoded);
  if (decoded.length !== W) {
    console.error(`FEHLER Zeile ${r}: Dekodiert ${decoded.length} statt ${W} Zeichen`);
    console.error(`  Encoded: "${encoded}"`);
    process.exit(1);
  }
  for (let c = 0; c < W; c++) {
    if (parseInt(decoded[c]) !== grid[r][c]) {
      console.error(`FEHLER Zeile ${r}, Spalte ${c}: Erwartet ${grid[r][c]}, bekommen ${decoded[c]}`);
      process.exit(1);
    }
  }
  tRows.push(encoded);
}

// ─── Level-Objekt ausgeben ──────────────────────────────────────────
let out = `{n:'THE LABYRINTH',w:${W},h:${H},sky:${SKY},emp:5,rock:25,`;
out += `sp:{x:${sp.x},y:${sp.y}},pod:{x:${pod.x},y:${pod.y}},rx:{x:${rx.x},y:${rx.y}},`;
out += `fuels:[${fuels.map(f => `{x:${f.x},y:${f.y}}`).join(',')}],`;
out += `turrets:[],tc:'#0a0',sw:[],d0:[],d1:[],t:[\n`;
out += tRows.map(r => `'${r}'`).join(',\n');
out += `]}`;

console.log(out);

// ─── Statistiken (stderr) ───────────────────────────────────────────
console.error(`\n=== THE LABYRINTH Stats ===`);
console.error(`Grid: ${W}×${H} Tiles (${W * 8}×${H * 8} px)`);
console.error(`Terrain-Zeilen in t[]: ${tRows.length}`);
console.error(`Etagen: ${NUM_FLOORS}, Abstand: ${GAP} Zeilen (${GAP * 8} px)`);
console.error(`Spawn: (${sp.x}, ${sp.y}) → Tile (${spawnCol}, ${SKY + 1})`);
console.error(`Pod: (${pod.x}, ${pod.y}) → Tile (${pod.x / 8}, ${pod.y / 8})`);
console.error(`Return: (${rx.x}, ${rx.y})`);
console.error(`Fuel-Depots: ${fuels.length}`);
console.error(`Etagen-Startzeilen: ${floors.map(f => f.row).join(', ')}`);
console.error(`Nadelöhre auf Etagen: ${pinchFloors.join(', ')}`);
console.error(`Letzte Inhaltszeile: ${lastContentRow} (Rest = Bedrock-Autofill)`);
console.error(`Output-Größe: ~${(out.length / 1024).toFixed(1)} KB`);
