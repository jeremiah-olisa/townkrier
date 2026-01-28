# TownKrier Troubleshooting Guide

Common issues and their solutions.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Problems](#configuration-problems)
- [Email Channel Issues](#email-channel-issues)
- [SMS Channel Issues](#sms-channel-issues)
- [Push Channel Issues](#push-channel-issues)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)

## Installation Issues

### Package Not Found

**Problem:** `Cannot find module 'townkrier-core'`

**Solutions:**

1. Ensure packages are installed:

   ```bash
   npm install townkrier-core
   ```

2. If using the monorepo, build all packages:

   ```bash
   pnpm install
   pnpm build
   ```

3. Check your `node_modules` directory exists

4. Try clearing cache and reinstalling:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### TypeScript Type Errors

**Problem:** TypeScript cannot find type definitions

**Solutions:**

1. Install type definitions:

   ```bash
   npm install --save-dev @types/node
   ```

2. Ensure `tsconfig.json` includes:

   ```json
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "esModuleInterop": true
     }
   }
   ```

3. Rebuild packages:
   ```bash
   pnpm build
   ```

## Configuration Problems

### Environment Variables Not Loading

**Problem:** Environment variables are undefined

**Solutions:**

1. Create `.env` file from example:

   ```bash
   cp .env.example .env
   ```

2. Load environment variables in your app:

   ```typescript
   import * as dotenv from 'dotenv';
   dotenv.config();
   ```

3. For Next.js, prefix with `NEXT_PUBLIC_` for client-side variables

4. Verify `.env` file is in the correct directory

### Invalid Configuration

**Problem:** `ValidationError: Invalid configuration`

**Solutions:**

1. Run the verification script:

   ```bash
   npm run verify
   ```

2. Check all required fields are present:
   - Email: `apiKey`, `from`
   - SMS: `apiKey`, `senderId`
   - Push: `serviceAccount` or `serviceAccountPath`, `projectId`

3. Ensure no trailing spaces in API keys

## Email Channel Issues

### Email Not Sending (Resend)

**Problem:** Emails are not being delivered

**Solutions:**

1. **Verify API Key:**
   - Check key is correct (starts with `re_`)
   - Verify key has sending permissions
   - Test key in Resend dashboard

2. **Verify Domain:**
   - Domain must be verified in Resend
   - `from` email must use verified domain
   - Check DNS records are correct

3. **Check Rate Limits:**
   - Free tier has limits
   - Check your quota in Resend dashboard
   - Implement retry logic for rate limit errors

4. **Enable Debug Mode:**
   ```typescript
   config: {
     apiKey: process.env.RESEND_API_KEY,
     from: 'notifications@yourdomain.com',
     debug: true, // Enable debug logging
   }
   ```

### Email in Spam

**Problem:** Emails go to spam folder

**Solutions:**

1. Set up SPF, DKIM, and DMARC records
2. Use a verified domain
3. Include an unsubscribe link
4. Avoid spam trigger words
5. Maintain good sender reputation

## SMS Channel Issues

### SMS Not Sending (Termii)

**Problem:** SMS messages are not being delivered

**Solutions:**

1. **Check Account Balance:**
   - Verify you have sufficient credits
   - Top up your Termii account

2. **Verify API Key:**
   - Check key is correct
   - Ensure key has SMS permissions

3. **Check Sender ID:**
   - Sender ID must be registered
   - Some countries require pre-registration
   - Max 11 characters for alphanumeric IDs

4. **Phone Number Format:**
   - Use international format: `+1234567890`
   - No spaces or special characters
   - Include country code

5. **Test with Termii Dashboard:**
   - Send a test SMS from dashboard
   - Verify your configuration works there first

### SMS Delivery Issues

**Problem:** SMS delivered but delayed

**Solutions:**

1. Check network congestion
2. Verify recipient's phone is on
3. Try different channel type (generic, dnd, whatsapp)
4. Contact Termii support for route issues

## Push Channel Issues

### Push Notifications Not Sending (FCM)

**Problem:** Push notifications are not being delivered

**Solutions:**

1. **Verify Service Account:**
   - Check JSON file exists
   - Verify file path is correct
   - Ensure JSON is valid
   - Check file permissions

2. **Verify Device Token:**
   - Token must be valid FCM token
   - Token expires after app reinstall
   - Test with a fresh token

3. **Check Firebase Project:**
   - Verify project ID is correct
   - Check FCM is enabled in Firebase Console
   - Verify app is registered

4. **Platform-Specific Issues:**
   - **Android:** Check Google Play Services is installed
   - **iOS:** Verify APNs certificate is configured
   - **Web:** Check service worker is registered

### Device Token Invalid

**Problem:** `Error: Invalid registration token`

**Solutions:**

1. Regenerate device token in your app
2. Check token hasn't expired
3. Verify token is for correct Firebase project
4. Remove old/invalid tokens from database

## Runtime Errors

### Channel Not Found

**Problem:** `Channel 'xxx' not found`

**Solutions:**

1. Register channel factory:

   ```typescript
   manager.registerFactory('email-resend', createResendChannel);
   ```

2. Check channel name matches configuration:

   ```typescript
   channels: [{ name: 'email-resend', ... }]
   ```

3. Verify channel is enabled:
   ```typescript
   enabled: true;
   ```

### Notification Failed with Fallback

**Problem:** Primary channel fails, fallback doesn't work

**Solutions:**

1. Enable fallback in config:

   ```typescript
   {
     enableFallback: true,
     channels: [
       { name: 'primary', priority: 10 },
       { name: 'fallback', priority: 5 },
     ]
   }
   ```

2. Ensure fallback channel is ready:

   ```typescript
   console.log(manager.getReadyChannels());
   ```

3. Check both channels are configured correctly

### Memory Leaks

**Problem:** Memory usage grows over time

**Solutions:**

1. Clear old notification logs:

   ```typescript
   storageManager.clearOldLogs(30); // Keep last 30 days
   ```

2. Use database storage instead of in-memory:

   ```typescript
   // Coming soon: Database adapter
   ```

3. Limit queue size:
   ```typescript
   const queue = new InMemoryQueueAdapter({
     maxSize: 10000,
   });
   ```

## Performance Issues

### Slow Notification Sending

**Problem:** Notifications take too long to send

**Solutions:**

1. **Use Queue System:**

   ```typescript
   // Queue for background processing
   await queueManager.enqueue(notification, recipient);
   ```

2. **Reduce Retries:**

   ```typescript
   const queue = new InMemoryQueueAdapter({
     maxRetries: 2, // Reduce from default 3
     retryDelay: 500, // Reduce delay
   });
   ```

3. **Disable Debug Mode:**
   - Remove `debug: true` in production

4. **Use Proper Channel Priority:**
   - Faster channels get higher priority

### High API Costs

**Problem:** Too many API calls to providers

**Solutions:**

1. Implement caching for validation
2. Use batch sending when available
3. Reduce retry attempts
4. Enable rate limiting
5. Monitor usage with dashboard

## Queue System Issues

### Jobs Stuck in Queue

**Problem:** Jobs not processing

**Solutions:**

1. Start queue processing:

   ```typescript
   queueManager.startProcessing();
   ```

2. Check processing interval:

   ```typescript
   new InMemoryQueueAdapter({
     processingInterval: 1000, // Process every second
   });
   ```

3. Look for errors in job logs:
   ```typescript
   const jobs = await queueManager.getFailedJobs();
   console.log(jobs);
   ```

### Jobs Failing Repeatedly

**Problem:** Jobs fail and retry endlessly

**Solutions:**

1. Check error logs:

   ```typescript
   const job = await queueManager.getJob(jobId);
   console.log(job.error);
   ```

2. Reduce max retries:

   ```typescript
   maxRetries: 2,
   ```

3. Fix underlying issue (API key, network, etc.)

4. Manually mark as failed:
   ```typescript
   await queueManager.markJobAsFailed(jobId);
   ```

## Dashboard Issues

### Dashboard Not Loading

**Problem:** Cannot access dashboard UI

**Solutions:**

1. Check dashboard is started:

   ```typescript
   await dashboard.start();
   console.log('Dashboard running on http://localhost:3000/dashboard');
   ```

2. Verify port is not in use:

   ```bash
   lsof -i :3000
   ```

3. Check firewall settings

4. Try different port:
   ```typescript
   new DashboardServer({ port: 3001 });
   ```

### Dashboard Shows No Data

**Problem:** Dashboard is empty

**Solutions:**

1. Ensure storage manager is connected:

   ```typescript
   const dashboard = new DashboardServer({
     queueManager,
     storageManager, // Must be provided
   });
   ```

2. Check storage adapter is initialized

3. Verify notifications are being logged:
   ```typescript
   const logs = await storageManager.getLogs();
   console.log(logs);
   ```

## Getting More Help

If you're still stuck:

1. **Check Examples:**
   - See `examples/` directory for working code
   - Review `examples/complete-example.ts`

2. **Enable Debug Logging:**

   ```typescript
   config: {
     debug: true;
   }
   ```

3. **Run Verification Script:**

   ```bash
   npm run verify
   ```

4. **Check GitHub Issues:**
   - Search existing issues
   - Open new issue with:
     - Error message
     - Code snippet
     - Environment details
     - Steps to reproduce

5. **Review Documentation:**
   - [USAGE.md](./USAGE.md)
   - [README.md](./README.md)
   - Package-specific READMEs

---

Still having issues? [Open an issue on GitHub](https://github.com/jeremiah-olisa/townkrier/issues) with details about your problem.
