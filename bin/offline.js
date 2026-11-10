'use strict';

// Offline tool listing for modelbrain-mcp.
//
// When the ModelBrain desktop app is not installed, the launcher used to print
// a message and exit, so an MCP client or a directory scanner saw a server
// that never answered. This module answers instead: it speaks just enough MCP
// over stdio to complete the handshake and list the tools, and every tool call
// returns a plain "ModelBrain is not installed" result. It reads and stores
// nothing. The tool definitions come from bin/tools.json, a copy of what the
// real server reports (see scripts/snapshot-tools.js).

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const DEFAULT_PROTOCOL = '2025-06-18';

function loadTools() {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(__dirname, 'tools.json'), 'utf8'));
    return Array.isArray(parsed.tools) ? parsed.tools : [];
  } catch {
    return [];
  }
}

function createHandler({ message, version, tools = loadTools() }) {
  return function handle(msg) {
    if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
      const id = msg && (typeof msg.id === 'string' || typeof msg.id === 'number') ? msg.id : null;
      return { jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request' } };
    }
    // Notifications carry no id and get no reply.
    if (msg.id === undefined || msg.id === null) return null;
    const reply = (result) => ({ jsonrpc: '2.0', id: msg.id, result });

    switch (msg.method) {
      case 'initialize': {
        const asked = msg.params && msg.params.protocolVersion;
        return reply({
          protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : DEFAULT_PROTOCOL,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'modelbrain-mcp', title: 'ModelBrain (app not installed)', version },
          instructions:
            'The ModelBrain desktop app is not installed on this computer, so these tools are listed ' +
            'for reference only and every call returns an error. Nothing is stored or recalled. ' +
            'Tell the user to install ModelBrain from https://modelbrain.net/get-it.html and reconnect.',
        });
      }
      case 'ping':
        return reply({});
      case 'tools/list':
        return reply({ tools });
      case 'tools/call':
        return reply({ content: [{ type: 'text', text: message }], isError: true });
      default:
        return { jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: `Method not found: ${msg.method}` } };
    }
  };
}

function runOffline({ message, version, input = process.stdin, output = process.stdout }) {
  const handle = createHandler({ message, version });
  const send = (obj) => { if (obj) output.write(JSON.stringify(obj) + '\n'); };
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  rl.on('line', (line) => {
    const text = line.trim();
    if (!text) return;
    let msg;
    try {
      msg = JSON.parse(text);
    } catch {
      send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
      return;
    }
    if (Array.isArray(msg)) msg.forEach((m) => send(handle(m)));
    else send(handle(msg));
  });
  return rl;
}

module.exports = { runOffline, createHandler, loadTools };
