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
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Courier New',monospace;background:#0d1117;color:#c9d1d9;height:100vh;display:flex;flex-direction:column;overflow:hidden}
  header{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;border-bottom:1px solid #30363d;flex-shrink:0}
  header h1{color:#f78166;font-size:1.1em;letter-spacing:1px}
  .live-dot{display:inline-block;width:8px;height:8px;background:#3fb950;border-radius:50%;margin-right:5px;animation:pulse 1.5s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  .stats{display:flex;gap:12px;padding:10px 20px;border-bottom:1px solid #30363d;flex-shrink:0;overflow-x:auto}
  .stat-card{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:10px 16px;min-width:110px;flex-shrink:0}
  .stat-val{font-size:1.5em;color:#3fb950;font-weight:bold;line-height:1}
  .stat-lbl{color:#8b949e;font-size:.7em;margin-top:3px;text-transform:uppercase;letter-spacing:1px}
  .main{display:flex;flex:1;overflow:hidden}
  .left{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:16px;border-right:1px solid #30363d}
  .right{width:380px;display:flex;flex-direction:column;flex-shrink:0}
  section h2{color:#79c0ff;font-size:.8em;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}
  table{width:100%;border-collapse:collapse;font-size:.8em}
  th{color:#8b949e;text-align:left;padding:5px 8px;border-bottom:1px solid #30363d;white-space:nowrap}
  td{padding:5px 8px;border-bottom:1px solid #21262d;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  tr:hover td{background:#1c2128}
  #live-log{height:120px;overflow-y:auto;font-size:.75em;color:#8b949e;background:#0d1117;padding:8px;border:1px solid #21262d;border-radius:4px;line-height:1.5}
  .obs-search{width:100%;padding:5px 10px;background:#21262d;border:1px solid #30363d;color:#c9d1d9;border-radius:4px;margin-bottom:8px;font-family:inherit;font-size:.85em}
  .obs-search:focus{outline:none;border-color:#58a6ff}
  /* Chat panel */
  .chat-header{padding:10px 14px;border-bottom:1px solid #30363d;color:#79c0ff;font-size:.8em;text-transform:uppercase;letter-spacing:2px;flex-shrink:0}
  #chat-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px}
  .msg{padding:8px 12px;border-radius:6px;font-size:.83em;line-height:1.5;max-width:100%;word-break:break-word;white-space:pre-wrap}
  .msg.user{background:#1c2950;border:1px solid #264f78;align-self:flex-end;color:#c9d1d9}
  .msg.assistant{background:#161b22;border:1px solid #30363d;align-self:flex-start;color:#c9d1d9}
  .msg.assistant.streaming{border-color:#3fb950}
  .msg.error{background:#2d1618;border:1px solid #6e2d31;color:#f85149}
  .chat-input-area{border-top:1px solid #30363d;padding:10px;display:flex;gap:8px;flex-shrink:0}
  #chat-input{flex:1;background:#21262d;border:1px solid #30363d;color:#c9d1d9;border-radius:4px;padding:7px 10px;font-family:inherit;font-size:.83em;resize:none;height:60px;line-height:1.4}
  #chat-input:focus{outline:none;border-color:#58a6ff}
  #send-btn{background:#238636;color:#fff;border:none;border-radius:4px;padding:0 14px;cursor:pointer;font-size:.83em;flex-shrink:0;transition:background .15s}
  #send-btn:hover{background:#2ea043}
  #send-btn:disabled{background:#21262d;color:#8b949e;cursor:not-allowed}
  .tag{display:inline-block;background:#1c2128;border:1px solid #30363d;border-radius:3px;padding:1px 6px;font-size:.75em;color:#8b949e;margin-right:4px}
  .cost{color:#e3b341}
</style>
</head>
<body>

<header>
  <h1>🦀 ClawForge Monitor</h1>
  <span style="color:#8b949e;font-size:.8em"><span class="live-dot"></span>Live</span>
</header>

<div class="stats">
  <div class="stat-card"><div class="stat-val cost" id="s-cost">$0.0000</div><div class="stat-lbl">Total Cost</div></div>
  <div class="stat-card"><div class="stat-val" id="s-sessions">0</div><div class="stat-lbl">Sessions</div></div>
  <div class="stat-card"><div class="stat-val" id="s-tokens-in">0</div><div class="stat-lbl">Tokens In</div></div>
  <div class="stat-card"><div class="stat-val" id="s-tokens-out">0</div><div class="stat-lbl">Tokens Out</div></div>
  <div class="stat-card"><div class="stat-val" id="s-tool-calls">0</div><div class="stat-lbl">Tool Calls</div></div>
  <div class="stat-card"><div class="stat-val" id="s-obs">0</div><div class="stat-lbl">Observations</div></div>
</div>

<div class="main">
  <div class="left">

    <section>
      <h2><span class="live-dot"></span>Live Activity</h2>
      <div id="live-log">Connecting...</div>
    </section>

    <section>
      <h2>Recent Sessions</h2>
      <table>
        <thead><tr><th>Started</th><th>Project</th><th>Tokens In</th><th>Tokens Out</th><th>Tool Calls</th><th>Cost</th></tr></thead>
        <tbody id="sessions-body"></tbody>
      </table>
    </section>

    <section>
      <h2>Cost by Project</h2>
      <table>
        <thead><tr><th>Project</th><th>Total Tokens</th><th>Cost</th></tr></thead>
        <tbody id="cost-body"></tbody>
      </table>
    </section>

    <section>
      <h2>Memory Browser</h2>
      <input class="obs-search" id="obs-search" placeholder="Search observations..." />
      <table>
        <thead><tr><th>Time</th><th>Type</th><th>Content</th></tr></thead>
        <tbody id="obs-body"></tbody>
      </table>
    </section>

  </div>

  <div class="right" style="display:flex;flex-direction:column">
    <div class="chat-header">Chat with Claude</div>
    <div id="chat-messages">
      <div class="msg assistant">Hi! I can see your ClawForge session data. Ask me anything — about costs, tool usage, memory observations, or how to use ClawForge.</div>
    </div>
    <div class="chat-input-area">
      <textarea id="chat-input" placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"></textarea>
      <button id="send-btn">Send</button>
    </div>
  </div>
</div>

<script>
// ── Data loading ─────────────────────────────────────────────
async function loadStats() {
  try {
    const s = await fetch('/api/stats').then(r=>r.json());
    document.getElementById('s-cost').textContent = '$'+(s.totalCost||0).toFixed(4);
    document.getElementById('s-sessions').textContent = (s.sessions||0).toLocaleString();
    document.getElementById('s-tokens-in').textContent = (s.tokensIn||0).toLocaleString();
    document.getElementById('s-tokens-out').textContent = (s.tokensOut||0).toLocaleString();
    document.getElementById('s-tool-calls').textContent = (s.toolCalls||0).toLocaleString();
    document.getElementById('s-obs').textContent = (s.observations||0).toLocaleString();
  } catch(e) { console.warn('stats', e); }
}

async function loadSessions() {
  try {
    const {sessions=[]} = await fetch('/api/sessions').then(r=>r.json());
    document.getElementById('sessions-body').innerHTML = sessions.slice(0,20).map(s=>{
      const proj = s.project_path.split(/[\\\\/]/).slice(-2).join('/');
      const dur = s.end_time ? Math.round((new Date(s.end_time)-new Date(s.start))/60000)+'m' : 'active';
      return '<tr><td title="'+s.start+'">'+new Date(s.start).toLocaleString()+'</td>'
        +'<td title="'+s.project_path+'">'+proj+' <span class="tag">'+dur+'</span></td>'
        +'<td>'+s.tokens_in.toLocaleString()+'</td>'
        +'<td>'+s.tokens_out.toLocaleString()+'</td>'
        +'<td>'+(s.tool_calls||0).toLocaleString()+'</td>'
        +'<td class="cost">$'+s.cost.toFixed(5)+'</td></tr>';
    }).join('') || '<tr><td colspan="6" style="color:#8b949e;text-align:center">No sessions yet</td></tr>';
  } catch(e) { console.warn('sessions', e); }
}

async function loadCost() {
  try {
    const {byProject=[]} = await fetch('/api/cost').then(r=>r.json());
    document.getElementById('cost-body').innerHTML = byProject.slice(0,10).map(p=>{
      const proj = p.project_path.split(/[\\\\/]/).slice(-2).join('/');
      return '<tr><td title="'+p.project_path+'">'+proj+'</td>'
        +'<td>'+p.total_tokens.toLocaleString()+'</td>'
        +'<td class="cost">$'+p.total_cost.toFixed(5)+'</td></tr>';
    }).join('') || '<tr><td colspan="3" style="color:#8b949e;text-align:center">No data</td></tr>';
  } catch(e) { console.warn('cost', e); }
}

async function loadObs(q='') {
  try {
    const url = '/api/observations?limit=50'+(q?'&q='+encodeURIComponent(q):'');
    const {observations=[]} = await fetch(url).then(r=>r.json());
    document.getElementById('obs-body').innerHTML = observations.map(o=>
      '<tr><td>'+new Date(o.timestamp).toLocaleTimeString()+'</td>'
      +'<td><span class="tag">'+o.type+'</span></td>'
      +'<td title="'+o.content+'">'+o.title+'</td></tr>'
    ).join('') || '<tr><td colspan="3" style="color:#8b949e;text-align:center">No observations</td></tr>';
  } catch(e) { console.warn('obs', e); }
}

function loadAll() { loadStats(); loadSessions(); loadCost(); loadObs(); }
loadAll();
setInterval(loadAll, 30000);

document.getElementById('obs-search').addEventListener('input', e=>loadObs(e.target.value));

// ── Live SSE ──────────────────────────────────────────────────
const log = document.getElementById('live-log');
const es = new EventSource('/api/live');
es.addEventListener('connected', ()=>{ log.textContent='Connected. Waiting for events...\\n'; });
es.onmessage = e=>{
  const line = new Date().toLocaleTimeString()+' '+e.data+'\\n';
  log.textContent += line;
  log.scrollTop = log.scrollHeight;
  // Refresh stats on any tool event
  loadStats();
};
es.onerror = ()=>{ log.textContent += '[reconnecting...]\\n'; };

// ── Chat ──────────────────────────────────────────────────────
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const history = [];

function addMsg(role, text, streaming=false) {
  const div = document.createElement('div');
  div.className = 'msg '+role+(streaming?' streaming':'');
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

async function sendMessage() {
  const msg = chatInput.value.trim();
  if (!msg || sendBtn.disabled) return;

  chatInput.value = '';
  sendBtn.disabled = true;
  addMsg('user', msg);
  history.push({role:'user', content:msg});

  const bubble = addMsg('assistant', '', true);
  let fullText = '';

  try {
    const resp = await fetch('/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message:msg, history: history.slice(-10)}),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(()=>({error:'Request failed'}));
      bubble.className = 'msg error';
      bubble.textContent = err.error || 'Chat unavailable';
      sendBtn.disabled = false;
      return;
    }

    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = '';

    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      buf += dec.decode(value, {stream:true});
      const lines = buf.split('\\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const d = JSON.parse(line.slice(6));
        if (d.error) { bubble.className='msg error'; bubble.textContent=d.error; break; }
        if (d.text) { fullText += d.text; bubble.textContent = fullText; chatMessages.scrollTop=chatMessages.scrollHeight; }
        if (d.done) { bubble.classList.remove('streaming'); }
      }
    }

    if (fullText) history.push({role:'assistant', content:fullText});
  } catch(e) {
    bubble.className = 'msg error';
    bubble.textContent = 'Error: '+e.message;
  }

  sendBtn.disabled = false;
  chatInput.focus();
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e=>{
  if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
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
