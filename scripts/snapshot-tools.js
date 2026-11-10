#!/usr/bin/env node
'use strict';

// Replace bin/tools.json with the tool listing the installed ModelBrain app
// reports. Run on a machine with ModelBrain installed, before each publish:
//
//     node scripts/snapshot-tools.js
//
// It starts the app's own mcp_server, sends initialize and tools/list, writes
// what comes back and stops. It calls no tool and reads no memory.

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { findServerBinary } = require('../bin/modelbrain-mcp.js');

const binary = findServerBinary();
if (!binary) {
  process.stderr.write('ModelBrain is not installed here, so there is nothing to snapshot.\n');
  process.exit(1);
}

const child = spawn(binary, [], { stdio: ['pipe', 'pipe', 'inherit'] });
const send = (obj) => child.stdin.write(JSON.stringify(obj) + '\n');
const timer = setTimeout(() => { process.stderr.write('Timed out waiting for the server.\n'); child.kill(); process.exit(1); }, 20000);
let buffer = '';
let serverVersion = '';

child.stdout.on('data', (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id === 1 && msg.result) {
      serverVersion = (msg.result.serverInfo && msg.result.serverInfo.version) || '';
      send({ jsonrpc: '2.0', method: 'notifications/initialized' });
      send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    } else if (msg.id === 2 && msg.result && Array.isArray(msg.result.tools)) {
      clearTimeout(timer);
      const out = {
        source: `Snapshot of tools/list from the installed ModelBrain app, taken ${new Date().toISOString().slice(0, 10)} by scripts/snapshot-tools.js.`,
        modelbrain_version: serverVersion,
        tools: msg.result.tools,
      };
      const file = path.join(__dirname, '..', 'bin', 'tools.json');
      fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
      process.stdout.write(`Wrote ${msg.result.tools.length} tools to ${file}\n`);
      child.kill();
    }
  }
});

send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'modelbrain-mcp-snapshot', version: '1' } } });
