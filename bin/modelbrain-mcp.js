#!/usr/bin/env node
'use strict';

// Thin stdio client for ModelBrain (https://modelbrain.net).
//
// This package does not bundle ModelBrain or talk to its daemon directly.
// ModelBrain's own installed app already ships a binary, mcp_server, that
// does exactly that (connects to the resident daemon over a Unix socket on
// macOS or a named pipe on Windows, spawning the daemon on demand, then
// relays raw MCP bytes between its own stdio and that connection). This
// wrapper's only job is to find that binary on the current machine and
// exec it, or say plainly that it is not installed.
//
// Why a wrapper at all, instead of pointing a client straight at the
// installed binary: the MCP Registry, and directories that ingest from it,
// want a published package as the distribution target. This is that
// package, kept deliberately thin.

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function macCandidates() {
  const home = os.homedir();
  return [
    '/Applications/ModelBrain.app/Contents/MacOS/mcp_server',
    path.join(home, 'Applications/ModelBrain.app/Contents/MacOS/mcp_server'),
  ];
}

function windowsCandidates() {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return [];
  return [path.join(localAppData, 'Programs', 'ModelBrain', 'mcp_server.exe')];
}

function candidatesForPlatform() {
  if (process.platform === 'darwin') return macCandidates();
  if (process.platform === 'win32') return windowsCandidates();
  return [];
}

function findServerBinary() {
  for (const candidate of candidatesForPlatform()) {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      // Not there, or not executable. Try the next candidate.
    }
  }
  return null;
}

function notFoundMessage() {
  const lines = [
    'ModelBrain desktop app not detected on this computer.',
    '',
    'modelbrain-mcp is a thin client: it connects to the ModelBrain app',
    'already running on your machine. It does not install or bundle',
    'ModelBrain itself.',
    '',
  ];
  if (process.platform === 'darwin' || process.platform === 'win32') {
    lines.push('Install ModelBrain, then run this again: https://modelbrain.net/get-it.html');
  } else {
    lines.push(
      `${process.platform} is not part of this launch. ModelBrain currently`,
      'ships for macOS (Apple Silicon) and Windows (x64 and arm64) only:',
      'https://modelbrain.net/get-it.html'
    );
  }
  return lines.join('\n');
}

function main() {
  const binaryPath = findServerBinary();

  if (!binaryPath) {
    process.stderr.write(notFoundMessage() + '\n');
    process.exitCode = 1;
    return;
  }

  const child = spawn(binaryPath, process.argv.slice(2), { stdio: 'inherit' });

  child.on('error', (err) => {
    process.stderr.write(`Failed to start ModelBrain's MCP server: ${err.message}\n`);
    process.exitCode = 1;
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exitCode = code === null ? 1 : code;
  });
}

main();
