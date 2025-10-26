#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * TownKrier Setup Verification Script
 *
 * This script checks if your TownKrier environment is properly configured
 * and ready to send notifications.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`  ${message}`, 'bold');
  log('='.repeat(70), 'cyan');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Load environment variables from .env file if it exists
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([^#][^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    return true;
  }
  return false;
}

// Check if .env file exists
function checkEnvFile() {
  header('Environment Configuration Check');

  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (fs.existsSync(envPath)) {
    success('.env file found');
    return true;
  } else {
    error('.env file not found');
    if (fs.existsSync(envExamplePath)) {
      info('Copy .env.example to .env and fill in your values:');
      log('  cp .env.example .env', 'cyan');
    } else {
      warning('.env.example not found either');
    }
    return false;
  }
}

// Check Email channel configuration (Resend)
function checkEmailConfig() {
  header('Email Channel (Resend) Configuration');

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const enabled = process.env.RESEND_ENABLED !== 'false';

  let isValid = true;

  if (enabled) {
    if (apiKey && apiKey !== 're_your_api_key_here') {
      success('RESEND_API_KEY is configured');
    } else {
      error('RESEND_API_KEY is missing or using example value');
      info('Get your API key from: https://resend.com/api-keys');
      isValid = false;
    }

    if (fromEmail && fromEmail !== 'notifications@yourdomain.com') {
      success(`RESEND_FROM_EMAIL is configured: ${fromEmail}`);
    } else {
      error('RESEND_FROM_EMAIL is missing or using example value');
      info('Set to a verified email address in your Resend account');
      isValid = false;
    }

    if (process.env.RESEND_FROM_NAME) {
      success(`RESEND_FROM_NAME is configured: ${process.env.RESEND_FROM_NAME}`);
    } else {
      warning('RESEND_FROM_NAME is not set (optional)');
    }
  } else {
    warning('Email channel is disabled (RESEND_ENABLED=false)');
  }

  return isValid;
}

// Check SMS channel configuration (Termii)
function checkSmsConfig() {
  header('SMS Channel (Termii) Configuration');

  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID;
  const enabled = process.env.TERMII_ENABLED !== 'false';

  let isValid = true;

  if (enabled) {
    if (apiKey && apiKey !== 'your_termii_api_key_here') {
      success('TERMII_API_KEY is configured');
    } else {
      error('TERMII_API_KEY is missing or using example value');
      info('Get your API key from: https://termii.com');
      isValid = false;
    }

    if (senderId && senderId !== 'YourApp') {
      success(`TERMII_SENDER_ID is configured: ${senderId}`);
    } else {
      warning('TERMII_SENDER_ID is using default value');
      info('Configure a custom sender ID for better delivery');
    }
  } else {
    warning('SMS channel is disabled (TERMII_ENABLED=false)');
  }

  return isValid;
}

// Check Push channel configuration (FCM)
function checkPushConfig() {
  header('Push Channel (Firebase Cloud Messaging) Configuration');

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const enabled = process.env.FCM_ENABLED !== 'false';

  let isValid = true;

  if (enabled) {
    if (serviceAccountPath) {
      if (fs.existsSync(serviceAccountPath)) {
        success(`Firebase service account file found: ${serviceAccountPath}`);
      } else {
        error(`Firebase service account file not found: ${serviceAccountPath}`);
        isValid = false;
      }
    } else if (serviceAccount) {
      try {
        JSON.parse(serviceAccount);
        success('FIREBASE_SERVICE_ACCOUNT is configured');
      } catch (e) {
        error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
        isValid = false;
      }
    } else {
      error('Neither FIREBASE_SERVICE_ACCOUNT_PATH nor FIREBASE_SERVICE_ACCOUNT is configured');
      info('Download service account JSON from Firebase Console');
      isValid = false;
    }

    if (projectId && projectId !== 'your-firebase-project-id') {
      success(`FIREBASE_PROJECT_ID is configured: ${projectId}`);
    } else {
      error('FIREBASE_PROJECT_ID is missing or using example value');
      isValid = false;
    }
  } else {
    warning('Push channel is disabled (FCM_ENABLED=false)');
  }

  return isValid;
}

// Check packages are installed
function checkPackages() {
  header('Package Installation Check');

  const packages = ['@townkrier/core', '@townkrier/resend', '@townkrier/termii', '@townkrier/fcm'];

  let allInstalled = true;

  for (const pkg of packages) {
    try {
      require.resolve(pkg);
      success(`${pkg} is installed`);
    } catch (e) {
      error(`${pkg} is not installed`);
      allInstalled = false;
    }
  }

  if (!allInstalled) {
    info('Install missing packages with:');
    log('  npm install @townkrier/core @townkrier/resend @townkrier/termii @townkrier/fcm', 'cyan');
    log('  or', 'cyan');
    log('  pnpm add @townkrier/core @townkrier/resend @townkrier/termii @townkrier/fcm', 'cyan');
  }

  return allInstalled;
}

// Main verification function
async function main() {
  log('\n🏰 TownKrier Setup Verification\n', 'bold');

  // Load .env file
  const envLoaded = loadEnv();
  if (envLoaded) {
    info('Loaded environment variables from .env file\n');
  }

  // Run all checks
  const checks = {
    envFile: checkEnvFile(),
    packages: checkPackages(),
    email: checkEmailConfig(),
    sms: checkSmsConfig(),
    push: checkPushConfig(),
  };

  // Summary
  header('Verification Summary');

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;

  log('');
  if (passedChecks === totalChecks) {
    success('All checks passed! Your TownKrier setup is ready. 🎉');
    log('\nYou can now start sending notifications!', 'green');
    log('\nNext steps:', 'bold');
    log('  1. Import and configure NotificationManager', 'cyan');
    log('  2. Create notification classes', 'cyan');
    log('  3. Send your first notification', 'cyan');
    log('\nSee examples/ directory for usage examples.', 'blue');
  } else {
    warning(`${passedChecks}/${totalChecks} checks passed. Please fix the issues above.`);
    log('\nFor help, see:', 'bold');
    log('  - README.md', 'cyan');
    log('  - USAGE.md', 'cyan');
    log('  - examples/complete-example.ts', 'cyan');
  }

  log('');

  // Exit with appropriate code
  process.exit(passedChecks === totalChecks ? 0 : 1);
}

// Run verification
main().catch((error) => {
  error(`Verification failed: ${error.message}`);
  process.exit(1);
});
