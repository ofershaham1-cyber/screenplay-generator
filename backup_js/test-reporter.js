#!/usr/bin/env node

/**
 * Playwright Custom Reporter for TDD
 * Writes test results to a persistent log file that can be watched in real-time
 */

import fs from 'fs';
import path from 'path';

export class TDDReporter {
  constructor() {
    const testResultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    this.logFile = path.join(testResultsDir, 'test.log');
    
    // Clear log on startup
    fs.writeFileSync(this.logFile, `\n📋 Test Run Started: ${new Date().toISOString()}\n`);
  }

  onTestBegin(test) {
    const msg = `\n▶️  ${test.title}`;
    console.log(msg);
    this.appendLog(msg);
  }

  onTestEnd(test, result) {
    let msg = '';
    
    if (result.status === 'passed') {
      msg = `✅ ${test.title} (${result.duration}ms)`;
    } else if (result.status === 'failed') {
      msg = `❌ ${test.title} (${result.duration}ms)`;
      if (result.error) {
        msg += `\n   Error: ${result.error.message}`;
      }
    } else if (result.status === 'skipped') {
      msg = `⏭️  ${test.title} (skipped)`;
    } else if (result.status === 'interrupted') {
      msg = `⏸️  ${test.title} (interrupted)`;
    }
    
    console.log(msg);
    this.appendLog(msg);
  }

  onEnd(result) {
    const stats = result.stats;
    const summary = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Test Summary
  ✅ Passed: ${stats.expected}
  ❌ Failed: ${stats.unexpected}
  ⏭️  Skipped: ${stats.skipped}
  ⏸️  Interrupted: ${stats.interrupted}
  ⏱️  Duration: ${result.duration}ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    
    console.log(summary);
    this.appendLog(summary);
    
    if (stats.unexpected > 0) {
      this.appendLog(`\n⚠️  ${stats.unexpected} test(s) failed - Check details above\n`);
    } else {
      this.appendLog(`\n✨ All tests passed!\n`);
    }
  }

  appendLog(message) {
    try {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = `[${timestamp}] ${message}\n`;
      fs.appendFileSync(this.logFile, logEntry, { encoding: 'utf-8' });
    } catch (err) {
      console.error('Error writing to test log:', err);
    }
  }
}
