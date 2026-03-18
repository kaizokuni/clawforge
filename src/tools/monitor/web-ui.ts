/**
 * Monitor web UI server.
 * Express server at :19877 serving the dashboard.
 */

import express from "express";
import type { Server } from "node:http";
import { MONITOR_PORT } from "../../shared/constants.js";
import { registerApiRoutes } from "./api.js";
import { logger } from "../../shared/logger.js";

let server: Server | null = null;

/** Inline dashboard HTML — avoids build-time file copying. */
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ClawForge Monitor</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; background: #0d1117; color: #c9d1d9; padding: 20px; }
  h1 { color: #f78166; margin-bottom: 20px; font-size: 1.4em; }
  h2 { color: #79c0ff; margin: 15px 0 10px; font-size: 1em; text-transform: uppercase; letter-spacing: 2px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 16px; }
  .stat { font-size: 2em; color: #3fb950; font-weight: bold; }
  .label { color: #8b949e; font-size: 0.8em; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85em; }
  th { color: #8b949e; text-align: left; padding: 6px 8px; border-bottom: 1px solid #30363d; }
  td { padding: 6px 8px; border-bottom: 1px solid #21262d; }
  tr:hover td { background: #1c2128; }
  .live-dot { display: inline-block; width: 8px; height: 8px; background: #3fb950; border-radius: 50%; margin-right: 6px; animation: pulse 1s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  #live-log { height: 200px; overflow-y: auto; font-size: 0.8em; color: #8b949e; background: #0d1117; padding: 8px; border: 1px solid #21262d; }
  .search { width: 100%; padding: 6px 10px; background: #21262d; border: 1px solid #30363d; color: #c9d1d9; border-radius: 4px; margin-bottom: 10px; }
</style>
</head>
<body>
<h1>🦀 ClawForge Monitor</h1>

<div class="grid">
  <div class="card">
    <div class="stat" id="total-cost">$0.000</div>
    <div class="label">Total Cost</div>
  </div>
  <div class="card">
    <div class="stat" id="session-count">0</div>
    <div class="label">Sessions</div>
  </div>
  <div class="card">
    <div class="stat" id="total-tokens">0</div>
    <div class="label">Total Tokens</div>
  </div>
  <div class="card">
    <div class="stat" id="obs-count">0</div>
    <div class="label">Observations</div>
  </div>
</div>

<h2><span class="live-dot"></span>Live Activity</h2>
<div id="live-log">Connecting...</div>

<h2>Recent Sessions</h2>
<table id="sessions-table">
  <thead><tr><th>Time</th><th>Project</th><th>Tokens In</th><th>Tokens Out</th><th>Cost</th></tr></thead>
  <tbody id="sessions-body"></tbody>
</table>

<h2>Memory Search</h2>
<input class="search" id="obs-search" placeholder="Search observations..." />
<table id="obs-table">
  <thead><tr><th>Time</th><th>Type</th><th>Title</th></tr></thead>
  <tbody id="obs-body"></tbody>
</table>

<script>
async function load() {
  const [cost, sessions, obs] = await Promise.all([
    fetch('/api/cost').then(r=>r.json()),
    fetch('/api/sessions').then(r=>r.json()),
    fetch('/api/observations?limit=20').then(r=>r.json()),
  ]);

  document.getElementById('total-cost').textContent = '$' + (cost.totalCost||0).toFixed(4);
  document.getElementById('session-count').textContent = (sessions.sessions||[]).length;

  const totalTokens = (sessions.sessions||[]).reduce((s,r)=>s+r.tokens_in+r.tokens_out,0);
  document.getElementById('total-tokens').textContent = totalTokens.toLocaleString();
  document.getElementById('obs-count').textContent = (obs.observations||[]).length;

  document.getElementById('sessions-body').innerHTML = (sessions.sessions||[]).map(s =>
    '<tr><td>'+new Date(s.start).toLocaleString()+'</td><td>'+s.project_path+'</td><td>'+s.tokens_in+'</td><td>'+s.tokens_out+'</td><td>$'+s.cost.toFixed(4)+'</td></tr>'
  ).join('');

  renderObs(obs.observations||[]);
}

function renderObs(obs) {
  document.getElementById('obs-body').innerHTML = obs.map(o =>
    '<tr><td>'+new Date(o.timestamp).toLocaleString()+'</td><td>'+o.type+'</td><td>'+o.title+'</td></tr>'
  ).join('');
}

document.getElementById('obs-search').addEventListener('input', async e => {
  const q = e.target.value;
  const obs = await fetch('/api/observations?q='+encodeURIComponent(q)).then(r=>r.json());
  renderObs(obs.observations||[]);
});

const log = document.getElementById('live-log');
const es = new EventSource('/api/live');
es.addEventListener('connected', () => { log.textContent = 'Connected. Waiting for events...\n'; });
es.onmessage = e => { log.textContent += new Date().toLocaleTimeString() + ' ' + e.data + '\n'; log.scrollTop = log.scrollHeight; };
es.onerror = () => { log.textContent += 'Connection lost. Retrying...\n'; };

load();
setInterval(load, 30000);
</script>
</body>
</html>`;

/**
 * Start the monitor web server.
 * @param port - Port to listen on (default: 19877).
 * @returns The HTTP server instance.
 */
export async function startWebServer(port: number = MONITOR_PORT): Promise<Server> {
  if (server) return server;

  const app = express();
  app.use(express.json());

  // Serve dashboard
  app.get("/", (_req, res) => res.send(DASHBOARD_HTML));

  // Register API routes
  registerApiRoutes(app);

  return new Promise((resolve, reject) => {
    const s = app.listen(port, () => {
      server = s;
      logger.info("Monitor web server started", { port, url: `http://localhost:${port}` });
      resolve(s);
    });
    s.on("error", reject);
  });
}

/**
 * Stop the web server.
 */
export async function stopWebServer(): Promise<void> {
  if (server) {
    await new Promise<void>(resolve => server!.close(() => resolve()));
    server = null;
    logger.info("Monitor web server stopped");
  }
}

/**
 * Check if the web server is running.
 */
export function isWebServerRunning(): boolean {
  return server !== null;
}
