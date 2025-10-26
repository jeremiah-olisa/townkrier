#!/usr/bin/env node

/**
 * Quick test script for TownKrier NestJS example
 * This script sends test notifications to verify the setup
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:3000';

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testNotifications() {
  console.log('🧪 Testing TownKrier NestJS Integration\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣  Testing health endpoint...');
    const health = await makeRequest('/notifications/health', 'GET');
    console.log('✅ Health:', health);
    console.log('');

    // Test 2: Send Welcome Notification
    console.log('2️⃣  Sending welcome notification...');
    const welcome = await makeRequest('/notifications/send', 'POST', {
      type: 'welcome',
      email: 'test@example.com',
      name: 'Test User',
    });
    console.log('✅ Welcome notification:', welcome);
    console.log('');

    // Test 3: Queue Order Confirmation
    console.log('3️⃣  Queueing order confirmation...');
    const order = await makeRequest('/notifications/queue', 'POST', {
      type: 'order_confirmation',
      email: 'test@example.com',
      name: 'Test User',
      data: {
        orderId: 'ORD-12345',
        amount: 99.99,
        itemCount: 3,
      },
      priority: 'high',
    });
    console.log('✅ Order notification queued:', order);
    console.log('');

    // Test 4: Queue Password Reset
    console.log('4️⃣  Queueing password reset...');
    const reset = await makeRequest('/notifications/queue', 'POST', {
      type: 'password_reset',
      email: 'test@example.com',
      name: 'Test User',
      data: {
        resetToken: 'abc123xyz',
        expiresInMinutes: 30,
      },
      delay: 2000,
    });
    console.log('✅ Password reset queued:', reset);
    console.log('');

    // Test 5: Send Payment Received
    console.log('5️⃣  Sending payment received notification...');
    const payment = await makeRequest('/notifications/send', 'POST', {
      type: 'payment_received',
      email: 'test@example.com',
      name: 'Test User',
      data: {
        amount: 150.0,
        currency: 'USD',
        transactionId: 'TXN-789012',
      },
    });
    console.log('✅ Payment notification:', payment);
    console.log('');

    // Test 6: Get Queue Stats
    console.log('6️⃣  Getting queue statistics...');
    const stats = await makeRequest('/queue/stats', 'GET');
    console.log('✅ Queue stats:', stats);
    console.log('');

    // Test 7: Get Jobs
    console.log('7️⃣  Getting queued jobs...');
    const jobs = await makeRequest('/queue/jobs', 'GET');
    console.log(`✅ Found ${jobs.length} jobs`);
    if (jobs.length > 0) {
      console.log('   First job:', {
        id: jobs[0].id,
        status: jobs[0].status,
        priority: jobs[0].priority,
      });
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('🎉 All tests completed successfully!');
    console.log('='.repeat(60));
    console.log(
      '\n📊 Visit the dashboard: http://localhost:4000/townkrier/dashboard',
    );
    console.log('📚 View API docs: http://localhost:3000/api\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nMake sure the server is running:');
    console.error('  pnpm run start:dev\n');
    process.exit(1);
  }
}

// Run tests
testNotifications();
