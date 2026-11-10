'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { createHandler, loadTools } = require('../bin/offline.js');

const launcher = path.join(__dirname, '..', 'bin', 'modelbrain-mcp.js');

function talk(lines, extraArgs = [], env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [launcher, ...extraArgs], { env: { ...process.env, MODELBRAIN_MCP_FORCE_OFFLINE: '1', ...env } });
    let out = '', err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('exit', (code) => resolve({ code, err, replies: out.split('\n').filter(Boolean).map((l) => JSON.parse(l)) }));
    lines.forEach((l) => child.stdin.write((typeof l === 'string' ? l : JSON.stringify(l)) + '\n'));
    child.stdin.end();
  });
}

test('tools.json lists the fourteen tools with valid shapes', () => {
  const tools = loadTools();
  assert.strictEqual(tools.length, 14);
  const names = tools.map((t) => t.name);
  assert.strictEqual(new Set(names).size, 14);
  for (const name of ['ping', 'recall', 'remember', 'expand', 'forget', 'list_memories', 'diagnostics', 'usage']) assert.ok(names.includes(name), name);
  for (const t of tools) {
    assert.match(t.name, /^[a-z_]+$/);
    assert.ok(t.title && t.description.length > 20, t.name);
    assert.strictEqual(t.inputSchema.type, 'object');
    for (const r of t.inputSchema.required || []) assert.ok(t.inputSchema.properties[r], `${t.name}.${r}`);
    assert.ok(!JSON.stringify(t).includes('$ref'), `${t.name} has an unresolved $ref`);
  }
  assert.strictEqual(tools.find((t) => t.name === 'forget').annotations.destructiveHint, true);
  assert.strictEqual(tools.find((t) => t.name === 'recall').annotations.readOnlyHint, true);
});

test('handshake, listing and a tool call over stdio when the app is absent', async () => {
  const { code, err, replies } = await talk([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'ping' },
    { jsonrpc: '2.0', id: 3, method: 'tools/list' },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'recall', arguments: { query: 'x' } } },
    { jsonrpc: '2.0', id: 5, method: 'resources/list' },
    'this is not json',
  ]);
  assert.strictEqual(code, 0);
  assert.match(err, /not detected/);
  assert.strictEqual(replies.length, 6, 'the notification gets no reply');
  assert.strictEqual(replies[0].result.protocolVersion, '2025-06-18');
  assert.deepStrictEqual(replies[0].result.capabilities, { tools: { listChanged: false } });
  assert.match(replies[0].result.instructions, /not installed/);
  assert.deepStrictEqual(replies[1].result, {});
  assert.strictEqual(replies[2].result.tools.length, 14);
  assert.strictEqual(replies[3].result.isError, true);
  assert.match(replies[3].result.content[0].text, /modelbrain\.net\/get-it\.html/);
  assert.strictEqual(replies[4].error.code, -32601);
  assert.strictEqual(replies[5].error.code, -32700);
});

test('an unknown protocol version falls back to a supported one', () => {
  const handle = createHandler({ message: 'm', version: '0' });
  const r = handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1999-01-01' } });
  assert.strictEqual(r.result.protocolVersion, '2025-06-18');
  assert.strictEqual(handle({ jsonrpc: '2.0', method: 'notifications/cancelled' }), null);
  assert.strictEqual(handle({ nope: true }).error.code, -32600);
});

test('--require-app and the environment switch keep the old exit status', async () => {
  const flag = await talk([], ['--require-app']);
  assert.strictEqual(flag.code, 1);
  assert.strictEqual(flag.replies.length, 0);
  const env = await talk([], [], { MODELBRAIN_MCP_REQUIRE_APP: '1' });
  assert.strictEqual(env.code, 1);
});
