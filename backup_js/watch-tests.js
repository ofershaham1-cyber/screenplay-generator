#!/usr/bin/env node

/**
 * Test Log Watcher
 * Monitors test-results directory and displays latest test results
 * Useful for TDD: npm run tdd
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testResultsDir = path.join(__dirname, 'test-results');
const logFile = path.join(testResultsDir, 'test.log');

// Ensure directory exists
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

console.log(`\n📊 Test Log Watcher Started`);
console.log(`📁 Watching: ${logFile}\n`);

let lastSize = 0;

// Watch for changes
setInterval(() => {
  try {
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      const currentSize = stats.size;

      // If file grew, read new content
      if (currentSize > lastSize) {
        const content = fs.readFileSync(logFile, 'utf-8');
        const lines = content.split('\n');
        
        // Show last 20 lines
        const relevantLines = lines.slice(-20);
        console.clear();
        console.log(`\n📊 Test Results (Last Updated: ${new Date().toLocaleTimeString()})\n`);
        console.log(relevantLines.join('\n'));
        console.log('\n---');
        
        lastSize = currentSize;
      }
    }
  } catch (err) {
    // Ignore errors
  }
}, 1000);

// Periodic refresh
setInterval(() => {
  try {
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.split('\n');
      
      // Check for test completion markers
      const lastLine = lines[lines.length - 2] || '';
      if (lastLine.includes('passed') || lastLine.includes('failed')) {
        console.log(`\n✅ Test run detected at ${new Date().toLocaleTimeString()}`);
      }
    }
  } catch (err) {
    // Ignore
  }
}, 5000);

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n\n👋 Test watcher stopped');
  process.exit(0);
});
