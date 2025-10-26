# Dashboard API Testing Guide

The error "Unexpected token '<'" when parsing JSON means you're receiving HTML instead of JSON.

## Common Causes

1. **Wrong URL**: Accessing UI route instead of API route
2. **Missing `/api` prefix**: API routes require `/api/` in the path

## Correct API Endpoints

With dashboard at `/townkrier/dashboard`:

### ✅ CORRECT (Returns JSON)

```bash
# Get stats
curl http://localhost:3000/townkrier/dashboard/api/stats

# Get jobs
curl http://localhost:3000/townkrier/dashboard/api/jobs

# Get specific job
curl http://localhost:3000/townkrier/dashboard/api/jobs/some-job-id

# Retry job
curl -X POST http://localhost:3000/townkrier/dashboard/api/jobs/some-job-id/retry

# Delete job
curl -X DELETE http://localhost:3000/townkrier/dashboard/api/jobs/some-job-id

# Get logs
curl http://localhost:3000/townkrier/dashboard/api/logs

# Get specific log
curl http://localhost:3000/townkrier/dashboard/api/logs/some-log-id

# Health check
curl http://localhost:3000/townkrier/dashboard/api/health
```

### ❌ WRONG (Returns HTML)

```bash
# These are UI routes and will return HTML:
curl http://localhost:3000/townkrier/dashboard
curl http://localhost:3000/townkrier/dashboard/jobs
curl http://localhost:3000/townkrier/dashboard/logs
curl http://localhost:3000/townkrier/dashboard/analysis
```

## Testing

### Test 1: Health Check (Should return JSON)

```bash
curl -v http://localhost:3000/townkrier/dashboard/api/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-26T...",
  "version": "1.0.0-alpha.1"
}
```

### Test 2: Get Stats (Should return JSON)

```bash
curl -v http://localhost:3000/townkrier/dashboard/api/stats
```

**Expected Response:**

```json
{
  "queue": {
    "pending": 0,
    "processing": 0,
    "completed": 0,
    "failed": 0,
    "retrying": 0,
    "scheduled": 0
  },
  "notifications": {
    "total": 0,
    "sent": 0,
    "failed": 0
  },
  "timestamp": "2025-10-26T..."
}
```

### Test 3: UI Route (Should return HTML)

```bash
curl -v http://localhost:3000/townkrier/dashboard
```

**Expected Response:** HTML page (starts with `<!DOCTYPE html>`)

## If You're Still Getting HTML Instead of JSON

Check your code for these patterns:

### ❌ Bad

```typescript
// Missing /api in path
fetch('/townkrier/dashboard/jobs'); // Returns HTML
fetch('/townkrier/dashboard/stats'); // Returns HTML
```

### ✅ Good

```typescript
// With /api prefix
fetch('/townkrier/dashboard/api/jobs'); // Returns JSON
fetch('/townkrier/dashboard/api/stats'); // Returns JSON
```

## Debugging

Add this to your code to see what URL you're actually requesting:

```typescript
const url = '/townkrier/dashboard/api/stats';
console.log('Fetching:', url);

const response = await fetch(url);
console.log('Content-Type:', response.headers.get('content-type'));

const text = await response.text();
console.log('Response preview:', text.substring(0, 100));

// Only try to parse as JSON if it's actually JSON
if (response.headers.get('content-type')?.includes('application/json')) {
  const data = JSON.parse(text);
  console.log('Data:', data);
} else {
  console.error('Expected JSON but got:', text.substring(0, 200));
}
```

## Summary

- **UI Routes**: `/townkrier/dashboard`, `/townkrier/dashboard/jobs`, `/townkrier/dashboard/logs` → Return HTML
- **API Routes**: `/townkrier/dashboard/api/*` → Return JSON

Always include `/api/` in the path when you want JSON responses!
