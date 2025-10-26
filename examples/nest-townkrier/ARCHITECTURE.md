# TownKrier NestJS Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT / API CONSUMERS                        │
│                     (HTTP Requests, Swagger UI)                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         NESTJS APPLICATION                           │
│                         (Port 3000)                                  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    API CONTROLLERS                          │    │
│  │                                                             │    │
│  │  ┌──────────────────────┐   ┌─────────────────────────┐   │    │
│  │  │ NotificationsController│   │   QueueController      │   │    │
│  │  │                      │   │                         │   │    │
│  │  │ • POST /send        │   │ • GET /stats           │   │    │
│  │  │ • POST /queue       │   │ • GET /jobs            │   │    │
│  │  │ • POST /bulk        │   │ • GET /jobs/:id        │   │    │
│  │  │ • GET /health       │   │ • GET /jobs/:id/retry  │   │    │
│  │  └──────────┬───────────┘   └─────────┬───────────────┘   │    │
│  └─────────────┼─────────────────────────┼───────────────────┘    │
│                │                         │                          │
│                ▼                         ▼                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    SERVICES LAYER                            │  │
│  │                                                               │  │
│  │  ┌───────────────────────────┐   ┌──────────────────────┐  │  │
│  │  │  NotificationService      │   │  DashboardService    │  │  │
│  │  │                           │   │                      │  │  │
│  │  │ • Send notifications      │   │ • Start dashboard    │  │  │
│  │  │ • Queue notifications     │   │ • Manage monitoring  │  │  │
│  │  │ • Bulk operations         │   │                      │  │  │
│  │  │ • Create notification     │   │                      │  │  │
│  │  └───────────┬───────────────┘   └──────────────────────┘  │  │
│  └──────────────┼───────────────────────────────────────────────┘  │
│                 │                                                   │
└─────────────────┼───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TOWNKRIER CORE SYSTEM                           │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │             NotificationManager                             │    │
│  │                                                             │    │
│  │  • Channel management                                       │    │
│  │  • Fallback logic                                           │    │
│  │  • Event dispatching                                        │    │
│  │  • Factory registration                                     │    │
│  └─────────────┬──────────────────────────────────────────────┘    │
│                │                                                    │
│                ▼                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                  CHANNEL ADAPTERS                           │    │
│  │                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │    │
│  │  │   Email      │  │     SMS      │  │    Push      │    │    │
│  │  │   (Resend)   │  │   (Termii)   │  │    (FCM)     │    │    │
│  │  │              │  │              │  │              │    │    │
│  │  │ Priority: 10 │  │ Priority: 5  │  │ Priority: 3  │    │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                  QueueManager                               │    │
│  │                                                             │    │
│  │  • Job queueing                                             │    │
│  │  • Background processing                                    │    │
│  │  • Retry with exponential backoff                           │    │
│  │  • Job prioritization                                       │    │
│  │  • Scheduled jobs                                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                  StorageManager                             │    │
│  │                                                             │    │
│  │  • Notification logs                                        │    │
│  │  • Job history                                              │    │
│  │  • Metrics and analytics                                    │    │
│  │  • Content privacy/masking                                  │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   TOWNKRIER DASHBOARD                                │
│                      (Port 4000)                                     │
│                                                                      │
│  http://localhost:4000/townkrier/dashboard                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    DASHBOARD UI                             │    │
│  │                                                             │    │
│  │  📊 Queue Statistics        📋 Job List                    │    │
│  │  ✅ Success Metrics         ❌ Failed Jobs                 │    │
│  │  ⏱️  Processing Time         🔄 Retry Controls             │    │
│  │  📝 Job Details & Logs      📈 Analytics                   │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   NOTIFICATION CLASSES                               │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐                       │
│  │ WelcomeNotification│  │OrderConfirmation │                       │
│  │                  │  │   Notification   │                       │
│  │ • Beautiful HTML │  │ • Order details  │                       │
│  │ • Welcome content│  │ • Pricing info   │                       │
│  └──────────────────┘  └──────────────────┘                       │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐                       │
│  │PasswordReset     │  │PaymentReceived   │                       │
│  │   Notification   │  │   Notification   │                       │
│  │                  │  │                  │                       │
│  │ • Reset link     │  │ • Transaction ID │                       │
│  │ • Expiry time    │  │ • Amount details │                       │
│  └──────────────────┘  └──────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘


DATA FLOW EXAMPLES:
===================

1. IMMEDIATE NOTIFICATION:
   Client → Controller → Service → NotificationManager → Channel → External API
                                                                    (e.g., Resend)

2. QUEUED NOTIFICATION:
   Client → Controller → Service → QueueManager → Queue
                                                    ↓
   Background Process → NotificationManager → Channel → External API

3. MONITORING:
   Dashboard ← StorageManager ← QueueManager ← Job Events
                              ← NotificationManager ← Notification Events


KEY FEATURES:
=============

✅ Multi-Channel Support (Email, SMS, Push)
✅ Background Job Processing
✅ Automatic Retry Logic
✅ Job Prioritization
✅ Real-time Monitoring
✅ Event-Driven Architecture
✅ Fallback Mechanism
✅ Beautiful Email Templates
✅ Swagger Documentation
✅ TypeScript Support
```
