// J-THRUST Duel Server — WebSocket Relay
// Usage: node j-thrust-server.js [port]
const http = require('http');
const WebSocket = require('ws');
const PORT = parseInt(process.env.PORT || process.argv[2]) || 3000;

// HTTP server (needed for Render.com health checks)
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('J-THRUST Duel Server');
});

const wss = new WebSocket.Server({ server });

let waiting = null;
let matches = new Map();

function send(ws, msg) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.t === 'join') {
      ws._name = msg.name || 'Anon';
      if (waiting && waiting.readyState === WebSocket.OPEN && waiting !== ws) {
        let map = Math.floor(Math.random() * 3);
        matches.set(ws, { opponent: waiting, side: 'blue', name: ws._name });
        matches.set(waiting, { opponent: ws, side: 'red', name: waiting._name });
        send(waiting, { t: 'matched', side: 'red', map, opponent: ws._name });
        send(ws, { t: 'matched', side: 'blue', map, opponent: waiting._name });
        waiting = null;
        let n = 3;
        let iv = setInterval(() => {
          if (n > 0) {
            send(ws, { t: 'countdown', n });
            send(matches.get(ws).opponent, { t: 'countdown', n });
            n--;
          } else {
            send(ws, { t: 'go' });
            send(matches.get(ws).opponent, { t: 'go' });
            clearInterval(iv);
          }
        }, 1000);
      } else {
        waiting = ws;
        send(ws, { t: 'wait' });
        console.log(`${ws._name} waiting`);
      }
    } else {
      let match = matches.get(ws);
      if (match && match.opponent.readyState === WebSocket.OPEN) {
        match.opponent.send(raw.toString());
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (waiting === ws) waiting = null;
    let match = matches.get(ws);
    if (match) {
      send(match.opponent, { t: 'disconnected' });
      matches.delete(match.opponent);
      matches.delete(ws);
    }
  });

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
});

setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

server.listen(PORT, () => {
  console.log(`J-THRUST Duel Server on port ${PORT}`);
});
