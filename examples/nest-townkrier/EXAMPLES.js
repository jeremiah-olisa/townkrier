/**
 * Complete Usage Examples for TownKrier NestJS Integration
 *
 * This file demonstrates various ways to send notifications
 * using curl commands and example payloads.
 */

// =============================================================================
// 1. SENDING NOTIFICATIONS IMMEDIATELY
// =============================================================================

/**
 * Example 1: Send Welcome Email
 */
const welcomeExample = {
  endpoint: 'POST http://localhost:3000/notifications/send',
  payload: {
    type: 'welcome',
    email: 'newuser@example.com',
    name: 'Jane Doe',
  },
  curl: `curl -X POST http://localhost:3000/notifications/send \\
  -H "Content-Type: application/json" \\
  -d '{"type":"welcome","email":"newuser@example.com","name":"Jane Doe"}'`,
};

/**
 * Example 2: Send Order Confirmation
 */
const orderConfirmationExample = {
  endpoint: 'POST http://localhost:3000/notifications/send',
  payload: {
    type: 'order_confirmation',
    email: 'customer@example.com',
    name: 'John Smith',
    data: {
      orderId: 'ORD-98765',
      amount: 249.99,
      itemCount: 5,
    },
  },
  curl: `curl -X POST http://localhost:3000/notifications/send \\
  -H "Content-Type: application/json" \\
  -d '{"type":"order_confirmation","email":"customer@example.com","name":"John Smith","data":{"orderId":"ORD-98765","amount":249.99,"itemCount":5}}'`,
};

/**
 * Example 3: Send Password Reset
 */
const passwordResetExample = {
  endpoint: 'POST http://localhost:3000/notifications/send',
  payload: {
    type: 'password_reset',
    email: 'user@example.com',
    name: 'Alice Johnson',
    data: {
      resetToken: 'abc123def456ghi789',
      expiresInMinutes: 60,
    },
  },
  curl: `curl -X POST http://localhost:3000/notifications/send \\
  -H "Content-Type: application/json" \\
  -d '{"type":"password_reset","email":"user@example.com","name":"Alice Johnson","data":{"resetToken":"abc123def456ghi789","expiresInMinutes":60}}'`,
};

/**
 * Example 4: Send Payment Received Notification
 */
const paymentReceivedExample = {
  endpoint: 'POST http://localhost:3000/notifications/send',
  payload: {
    type: 'payment_received',
    email: 'customer@example.com',
    name: 'Bob Williams',
    data: {
      amount: 500.0,
      currency: 'USD',
      transactionId: 'TXN-2024-001234',
    },
  },
  curl: `curl -X POST http://localhost:3000/notifications/send \\
  -H "Content-Type: application/json" \\
  -d '{"type":"payment_received","email":"customer@example.com","name":"Bob Williams","data":{"amount":500.00,"currency":"USD","transactionId":"TXN-2024-001234"}}'`,
};

// =============================================================================
// 2. QUEUEING NOTIFICATIONS (BACKGROUND PROCESSING)
// =============================================================================

/**
 * Example 5: Queue a Notification (Simple)
 */
const queueSimpleExample = {
  endpoint: 'POST http://localhost:3000/notifications/queue',
  payload: {
    type: 'welcome',
    email: 'newuser@example.com',
    name: 'Queue User',
  },
  curl: `curl -X POST http://localhost:3000/notifications/queue \\
  -H "Content-Type: application/json" \\
  -d '{"type":"welcome","email":"newuser@example.com","name":"Queue User"}'`,
};

/**
 * Example 6: Queue with Delay (Send in 30 seconds)
 */
const queueWithDelayExample = {
  endpoint: 'POST http://localhost:3000/notifications/queue',
  payload: {
    type: 'order_confirmation',
    email: 'customer@example.com',
    name: 'Customer Name',
    data: {
      orderId: 'ORD-55555',
      amount: 99.99,
      itemCount: 2,
    },
    delay: 30000, // 30 seconds in milliseconds
    priority: 'high',
  },
  curl: `curl -X POST http://localhost:3000/notifications/queue \\
  -H "Content-Type: application/json" \\
  -d '{"type":"order_confirmation","email":"customer@example.com","name":"Customer Name","data":{"orderId":"ORD-55555","amount":99.99,"itemCount":2},"delay":30000,"priority":"high"}'`,
};

/**
 * Example 7: Queue with Priority
 */
const queueWithPriorityExample = {
  endpoint: 'POST http://localhost:3000/notifications/queue',
  payload: {
    type: 'password_reset',
    email: 'urgent@example.com',
    name: 'Urgent User',
    data: {
      resetToken: 'urgent-token-123',
      expiresInMinutes: 15,
    },
    priority: 'critical', // Options: low, normal, high, critical
  },
  curl: `curl -X POST http://localhost:3000/notifications/queue \\
  -H "Content-Type: application/json" \\
  -d '{"type":"password_reset","email":"urgent@example.com","name":"Urgent User","data":{"resetToken":"urgent-token-123","expiresInMinutes":15},"priority":"critical"}'`,
};

// =============================================================================
// 3. BULK NOTIFICATIONS
// =============================================================================

/**
 * Example 8: Send Bulk Notifications
 */
const bulkNotificationExample = {
  endpoint: 'POST http://localhost:3000/notifications/bulk',
  payload: {
    recipients: [
      {
        type: 'welcome',
        email: 'user1@example.com',
        name: 'User One',
      },
      {
        type: 'welcome',
        email: 'user2@example.com',
        name: 'User Two',
      },
      {
        type: 'welcome',
        email: 'user3@example.com',
        name: 'User Three',
      },
    ],
  },
  curl: `curl -X POST http://localhost:3000/notifications/bulk \\
  -H "Content-Type: application/json" \\
  -d '{"recipients":[{"type":"welcome","email":"user1@example.com","name":"User One"},{"type":"welcome","email":"user2@example.com","name":"User Two"},{"type":"welcome","email":"user3@example.com","name":"User Three"}]}'`,
};

// =============================================================================
// 4. QUEUE MANAGEMENT
// =============================================================================

/**
 * Example 9: Get Queue Statistics
 */
const getQueueStatsExample = {
  endpoint: 'GET http://localhost:3000/queue/stats',
  curl: `curl http://localhost:3000/queue/stats`,
};

/**
 * Example 10: List All Jobs
 */
const listJobsExample = {
  endpoint: 'GET http://localhost:3000/queue/jobs',
  curl: `curl http://localhost:3000/queue/jobs`,
};

/**
 * Example 11: Get Specific Job
 */
const getJobExample = {
  endpoint: 'GET http://localhost:3000/queue/jobs/:jobId',
  curl: `curl http://localhost:3000/queue/jobs/[JOB_ID_HERE]`,
};

/**
 * Example 12: Retry Failed Job
 */
const retryJobExample = {
  endpoint: 'GET http://localhost:3000/queue/jobs/:jobId/retry',
  curl: `curl http://localhost:3000/queue/jobs/[JOB_ID_HERE]/retry`,
};

/**
 * Example 13: Health Check
 */
const healthCheckExample = {
  endpoint: 'GET http://localhost:3000/notifications/health',
  curl: `curl http://localhost:3000/notifications/health`,
};

// =============================================================================
// 5. USING WITH DIFFERENT NOTIFICATION TYPES
// =============================================================================

/**
 * Example 14: Welcome Email with Custom Data
 */
const customWelcomeExample = {
  endpoint: 'POST http://localhost:3000/notifications/send',
  payload: {
    type: 'welcome',
    email: 'vip@example.com',
    name: 'VIP Customer',
    data: {
      // Additional custom data can be passed
      accountType: 'premium',
      referralCode: 'VIP2024',
    },
  },
};

/**
 * Example 15: Order with Multiple Items
 */
const largeOrderExample = {
  endpoint: 'POST http://localhost:3000/notifications/queue',
  payload: {
    type: 'order_confirmation',
    email: 'bigspender@example.com',
    name: 'Big Spender',
    data: {
      orderId: 'ORD-MEGA-001',
      amount: 9999.99,
      itemCount: 50,
    },
    priority: 'high',
  },
};

// =============================================================================
// RESPONSE EXAMPLES
// =============================================================================

/**
 * Success Response Example
 */
const successResponse = {
  success: true,
  message: 'Notification sent successfully',
  channels: ['email'],
};

/**
 * Queue Success Response Example
 */
const queueSuccessResponse = {
  success: true,
  message: 'Notification queued successfully',
  jobId: '550e8400-e29b-41d4-a716-446655440000',
};

/**
 * Bulk Response Example
 */
const bulkResponse = {
  total: 3,
  successful: 3,
  failed: 0,
  results: [
    {
      success: true,
      message: 'Notification sent successfully',
      channels: ['email'],
    },
    // ... more results
  ],
};

/**
 * Queue Stats Response Example
 */
const queueStatsResponse = {
  pending: 5,
  processing: 2,
  completed: 150,
  failed: 3,
  retrying: 1,
  scheduled: 8,
};

// =============================================================================
// TESTING SCRIPT
// =============================================================================

console.log(`
=============================================================================
TownKrier NestJS Integration - Usage Examples
=============================================================================

To test these examples:

1. Make sure the server is running:
   pnpm run start:dev

2. Use the provided curl commands or the test script:
   node test-notifications.js

3. View the dashboard:
   http://localhost:4000/townkrier/dashboard

4. View API documentation:
   http://localhost:3000/api

=============================================================================
QUICK START EXAMPLES
=============================================================================

# Send a welcome email immediately
${welcomeExample.curl}

# Queue an order confirmation
${queueWithDelayExample.curl}

# Send bulk notifications
${bulkNotificationExample.curl}

# Get queue statistics
${getQueueStatsExample.curl}

# Check service health
${healthCheckExample.curl}

=============================================================================
For more examples, visit: http://localhost:3000/api
=============================================================================
`);

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    welcomeExample,
    orderConfirmationExample,
    passwordResetExample,
    paymentReceivedExample,
    queueSimpleExample,
    queueWithDelayExample,
    queueWithPriorityExample,
    bulkNotificationExample,
    getQueueStatsExample,
    listJobsExample,
    getJobExample,
    retryJobExample,
    healthCheckExample,
  };
}
