#!/usr/bin/env node
// Verifiziert THE LABYRINTH Level-Integration in j-thrust.html
const fs = require('fs');
const html = fs.readFileSync('j-thrust.html', 'utf-8');
const match = html.match(/const CL=\[([\s\S]*?)\];\s*\/\//);
const CL = new Function('return [' + match[1] + ']')();
const lv = CL[CL.length - 1];
const OX = 72;

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

// Build tile grid like the game does
const tileGrid = [];
for (let r = 0; r < lv.sky; r++) {
  const row = []; for (let c = 0; c < lv.w; c++) row.push(0);
  tileGrid.push(row);
}
for (let ri = 0; ri < lv.t.length; ri++) {
  const decoded = decRLE(lv.t[ri]);
  const row = [];
  for (let c = 0; c < decoded.length && c < lv.w; c++) row.push(parseInt(decoded[c]) || 0);
  while (row.length < lv.w) row.push(1);
  tileGrid.push(row);
}
while (tileGrid.length < lv.h) {
  const row = []; for (let c = 0; c < lv.w; c++) row.push(1);
  tileGrid.push(row);
}

console.log('Level:', lv.n, '- CL Index:', CL.length - 1);
console.log('Grid:', lv.w + 'x' + lv.h, 'tileGrid rows:', tileGrid.length);

// Check positions WITH OX offset (as game does in loadClassicLevel)
function check(label, baseX, baseY) {
  const px = baseX + OX; // game adds OX
  const tx = Math.floor((px - OX) / 8);
  const ty = Math.floor(baseY / 8);
  const open = tileGrid[ty] && tileGrid[ty][tx] === 0;
  console.log(label + ': base(' + baseX + ',' + baseY + ') +OX→(' + px + ',' + baseY + ') tile(' + tx + ',' + ty + ') ' + (open ? 'OPEN ✓' : 'BLOCKED ✗'));
  return open;
}

let ok = true;
ok = check('Spawn', lv.sp.x, lv.sp.y) && ok;
ok = check('Pod', lv.pod.x, lv.pod.y) && ok;
ok = check('Return', lv.rx.x, lv.rx.y) && ok;
lv.fuels.forEach((f, i) => { ok = check('Fuel ' + i, f.x, f.y) && ok; });

// Flood fill from spawn
const spTx = Math.floor(lv.sp.x / 8);
const spTy = Math.floor(lv.sp.y / 8);
const podTx = Math.floor(lv.pod.x / 8);
const podTy = Math.floor(lv.pod.y / 8);

const visited = Array.from({ length: lv.h }, () => new Array(lv.w).fill(false));
const q = [[spTx, spTy]];
visited[spTy][spTx] = true;
while (q.length > 0) {
  const [x, y] = q.shift();
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (const [dx, dy] of dirs) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && nx < lv.w && ny >= 0 && ny < lv.h && !visited[ny][nx] && tileGrid[ny][nx] === 0) {
      visited[ny][nx] = true;
      q.push([nx, ny]);
    }
  }
}

const podReach = visited[podTy][podTx];
console.log('Pod erreichbar: ' + (podReach ? 'JA ✓' : 'NEIN ✗'));
ok = ok && podReach;

const fuelsReach = lv.fuels.every(f => visited[Math.floor(f.y / 8)][Math.floor(f.x / 8)]);
console.log('Alle Fuels erreichbar: ' + (fuelsReach ? 'JA ✓' : 'NEIN ✗'));
ok = ok && fuelsReach;

console.log('Keine Turrets: ' + (lv.turrets.length === 0 ? '✓' : '✗'));
console.log('Keine Switches: ' + (lv.sw.length === 0 ? '✓' : '✗'));
console.log('Keine Doors: ' + (lv.d0.length === 0 && lv.d1.length === 0 ? '✓' : '✗'));

console.log(ok ? '\nALLE CHECKS BESTANDEN ✓' : '\nFEHLER GEFUNDEN ✗');
process.exit(ok ? 0 : 1);
