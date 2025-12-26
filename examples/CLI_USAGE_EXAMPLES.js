#!/usr/bin/env node
/**
 * CLI Usage Examples
 *
 * This file demonstrates various ways to use the TownKrier CLI
 * to generate notification classes.
 */

const { execSync } = require('child_process');
const path = require('path');

// Helper function to run CLI commands
function runCLI(command) {
  console.log(`\n$ ${command}`);
  console.log('---');
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      cwd: path.join(__dirname, '../..'),
    });
    console.log(output);
  } catch (error) {
    console.error(error.message);
  }
  console.log('---\n');
}

console.log('='.repeat(60));
console.log('TownKrier CLI - Usage Examples');
console.log('='.repeat(60));

// Example 1: Simple email notification
console.log('\n📧 Example 1: Simple Email Notification');
runCLI('pnpm make:notification WelcomeEmail --channels email --force');

// Example 2: Multi-channel notification
console.log('\n📱 Example 2: Multi-Channel Notification (Email + SMS)');
runCLI('pnpm make:notification OrderConfirmation --channels email,sms --force');

// Example 3: All channels notification
console.log('\n🔔 Example 3: All Channels Notification');
runCLI('pnpm make:notification CriticalAlert --channels email,sms,push,in-app --force');

// Example 4: Custom path
console.log('\n📂 Example 4: Custom Output Path');
runCLI(
  'pnpm make:notification CustomPathNotification --channels email --path ./examples/console/notifications --force',
);

console.log('\n✅ All examples completed!');
console.log('\nGenerated files can be found in:');
console.log('  - ./notifications/ (default location)');
console.log('  - ./examples/console/notifications/ (custom path example)');
console.log('\n💡 To use these notifications, see the examples in ./examples/console/\n');
