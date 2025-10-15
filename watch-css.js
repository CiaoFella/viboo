#!/usr/bin/env node
import { spawn } from 'child_process';

// Start both SASS watch processes
const distWatch = spawn('sass', [
  '--watch',
  '--style=compressed',
  '--no-source-map',
  'src/styles/style.scss',
  'dist/style.css'
], { stdio: 'inherit', shell: true });

const srcWatch = spawn('sass', [
  '--watch',
  '--style=compressed',
  '--no-source-map',
  'src/styles/style.scss',
  'src/style.css'
], { stdio: 'inherit', shell: true });

// Handle process termination
process.on('SIGINT', () => {
  distWatch.kill();
  srcWatch.kill();
  process.exit();
});