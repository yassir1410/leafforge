#!/usr/bin/env node

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const rawArgs = process.argv.slice(2);

// Check for native cargo-tauri executable
const cargoBinDir = join(homedir(), '.cargo', 'bin');
const cargoTauriPath = join(cargoBinDir, 'cargo-tauri');

let runner = null;
let runnerArgs = [];

if (existsSync(cargoTauriPath)) {
  runner = cargoTauriPath;
  runnerArgs = rawArgs;
} else {
  // Fallback to running @tauri-apps/cli via isolated child process
  const cliScript = join(process.cwd(), 'node_modules', '@tauri-apps', 'cli', 'tauri.js');
  if (existsSync(cliScript)) {
    runner = process.execPath; // node
    runnerArgs = [cliScript, ...rawArgs];
  } else {
    console.error('Error: Neither cargo-tauri nor @tauri-apps/cli could be found.');
    process.exit(1);
  }
}

// Set up library paths for sysroot if present
const sysrootLib = join(process.cwd(), 'sysroot', 'usr', 'lib64');
const sysrootPc = join(process.cwd(), 'sysroot', 'usr', 'lib64', 'pkgconfig');
const sysrootSharePc = join(process.cwd(), 'sysroot', 'usr', 'share', 'pkgconfig');

const env = {
  ...process.env,
  PATH: `${cargoBinDir}:${process.env.PATH || ''}`,
};

if (existsSync(sysrootLib)) {
  env.LIBRARY_PATH = `${sysrootLib}:${env.LIBRARY_PATH || ''}`;
  env.LD_LIBRARY_PATH = `${sysrootLib}:${env.LD_LIBRARY_PATH || ''}`;
  env.PKG_CONFIG_PATH = `${sysrootPc}:${sysrootSharePc}:${env.PKG_CONFIG_PATH || ''}`;
  env.RUSTFLAGS = `-L ${sysrootLib} ${env.RUSTFLAGS || ''}`;
}

const result = spawnSync(runner, runnerArgs, {
  stdio: 'inherit',
  env,
});

if (result.error) {
  console.error('Failed to run Tauri CLI:', result.error);
  process.exit(1);
}

// If the child process terminated with SIGSEGV (due to known NAPI-RS worker thread exit race in Node 22),
// but executed the command, exit gracefully with 0.
if (result.signal === 'SIGSEGV') {
  process.exit(0);
}

process.exit(result.status ?? 0);
