#!/usr/bin/env node

// Workaround for Node v23 + Vite compatibility issues
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Vite with Node v23 workaround...');
console.log('Node version:', process.version);

// Force IPv4 and add compatibility flags
const env = {
  ...process.env,
  NODE_OPTIONS: '--dns-result-order=ipv4first',
  // Force Vite to use IPv4
  VITE_HOST: '127.0.0.1'
};

const vite = spawn('npx', ['vite'], {
  cwd: path.resolve(__dirname),
  env: process.env,
  stdio: 'inherit'
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
  process.exit(1);
});

vite.on('exit', (code) => {
  process.exit(code);
});