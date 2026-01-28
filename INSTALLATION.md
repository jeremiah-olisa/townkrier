# Installation Guide

This guide explains how to install and set up TownKrier in your project.

## Table of Contents

- [For End Users](#for-end-users) - Installing TownKrier in your application
- [For Contributors](#for-contributors) - Setting up the development environment

## For End Users

### Prerequisites

- Node.js >= 18.0.0
- npm, yarn, or pnpm package manager

### Step 1: Install Packages

Install the core package and the channels you need:

```bash
# Using npm
npm install townkrier-core

# Install channel packages as needed
npm install townkrier-resend   # For email via Resend
npm install townkrier-termii   # For SMS via Termii
npm install townkrier-fcm      # For push notifications via Firebase

# Optional: Queue system and monitoring
npm install townkrier-queue townkrier-storage townkrier-dashboard
```

Or install all at once:

```bash
npm install townkrier-core townkrier-resend townkrier-termii townkrier-fcm
```

### Step 2: TypeScript Setup (Optional but Recommended)

If you're using TypeScript, ensure you have the necessary type definitions:

```bash
npm install --save-dev @types/node typescript
```

Create or update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

### Step 3: Get API Keys

You'll need API keys for the channels you want to use:

#### Email (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain in the Resend dashboard
3. Create an API key at [resend.com/api-keys](https://resend.com/api-keys)

#### SMS (Termii)

1. Sign up at [termii.com](https://termii.com)
2. Get your API key from your dashboard
3. Configure your sender ID

#### Push Notifications (Firebase Cloud Messaging)

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Go to Project Settings > Service Accounts
3. Generate a new private key (downloads a JSON file)
4. Save the JSON file securely

### Step 4: Configure Environment

Create a `.env` file in your project root:

```env
# Email
RESEND_API_KEY=re_your_actual_api_key
RESEND_FROM_EMAIL=notifications@yourdomain.com
RESEND_FROM_NAME=Your App Name

# SMS
TERMII_API_KEY=your_termii_api_key
TERMII_SENDER_ID=YourApp

# Push
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### Step 5: Verify Installation

Create a test file `test-notification.ts`:

```typescript
import { NotificationManager } from 'townkrier-core';

const manager = new NotificationManager({
  defaultChannel: 'email-resend',
  channels: [
    {
      name: 'email-resend',
      enabled: true,
      config: {
        apiKey: process.env.RESEND_API_KEY!,
        from: process.env.RESEND_FROM_EMAIL!,
      },
    },
  ],
});

console.log('✅ TownKrier is installed and configured!');
console.log('Available channels:', manager.getAvailableChannels());
```

Run it:

```bash
npx tsx test-notification.ts
# or if compiled
node test-notification.js
```

### Next Steps

- 📖 Read the [Quick Start Guide](./QUICKSTART.md)
- 💡 Check out [examples/complete-example.ts](./examples/complete-example.ts)
- 📚 Review the [Usage Guide](./USAGE.md)

---

## For Contributors

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Step 1: Clone the Repository

```bash
git clone https://github.com/jeremiah-olisa/townkrier.git
cd townkrier
```

### Step 2: Install Dependencies

```bash
pnpm install
```

This will install all dependencies for all packages in the monorepo.

### Step 3: Build All Packages

```bash
pnpm build
```

This builds all packages in the correct order.

### Step 4: Set Up Environment

```bash
cp .env.example .env
# Edit .env with your actual API keys for testing
```

### Step 5: Run Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
cd packages/core
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

### Step 6: Development Workflow

```bash
# Start development mode (watches for changes)
pnpm dev

# Lint code
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check

# Build specific package
pnpm build:core
pnpm build:resend
pnpm build:fcm
pnpm build:termii
```

### Package Structure

```
townkrier/
├── packages/
│   ├── core/              # Core notification system
│   ├── cli/               # CLI tooling
│   ├── resend/            # Email via Resend
│   ├── queue/             # Queue system
│   ├── storage/           # Storage system
│   ├── dashboard/         # Monitoring dashboard
│   └── channels/
│       ├── sms/termii/    # SMS via Termii
│       └── push/fcm/      # Push via Firebase
├── examples/              # Usage examples
├── docs/                  # Documentation
└── scripts/               # Utility scripts
```

### Making Changes

1. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Test your changes:

   ```bash
   pnpm test
   pnpm lint
   ```

4. Commit your changes:

   ```bash
   git commit -m "feat: your feature description"
   ```

5. Push and create a pull request

### Adding a New Package

1. Create package directory:

   ```bash
   mkdir -p packages/your-package/src
   ```

2. Create `package.json`:

   ```json
   {
     "name": "townkrier-your-package",
     "version": "1.0.0-alpha.1",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "scripts": {
       "build": "tsc",
       "test": "jest"
     }
   }
   ```

3. Create `tsconfig.json`:

   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src"
     }
   }
   ```

4. The workspace will automatically detect it

### Publishing Packages

```bash
# Version packages
pnpm version:patch   # 1.0.0 -> 1.0.1
pnpm version:minor   # 1.0.0 -> 1.1.0
pnpm version:major   # 1.0.0 -> 2.0.0

# Build and publish
pnpm publish:now

# Or do it in one step
pnpm release:patch
pnpm release:minor
pnpm release:major
```

### Troubleshooting Development Issues

#### Build Errors

```bash
# Clean and rebuild
pnpm clean:build
pnpm build
```

#### Dependency Issues

```bash
# Clean everything and reinstall
pnpm clean
pnpm install
pnpm build
```

#### Test Failures

```bash
# Run tests with verbose output
pnpm test -- --verbose

# Run specific test file
pnpm test -- path/to/test.test.ts
```

### Getting Help

- 📖 Read the [CONTRIBUTING.md](./CONTRIBUTING.md) guide (if exists)
- 💬 Open an issue on GitHub
- 📧 Contact the maintainers

---

## Common Installation Issues

### Module Not Found

**Problem:** `Cannot find module 'townkrier-core'`

**Solution:**

```bash
# For users
npm install townkrier-core

# For contributors
pnpm install && pnpm build
```

### TypeScript Errors

**Problem:** TypeScript cannot find type definitions

**Solution:**

```bash
npm install --save-dev @types/node
```

### Build Fails

**Problem:** Build fails with TypeScript errors

**Solution:**

```bash
# Check TypeScript version
tsc --version  # Should be >= 5.0

# Update TypeScript if needed
npm install -D typescript@latest

# For contributors, clean and rebuild
pnpm clean && pnpm install && pnpm build
```

### API Key Not Working

**Problem:** Environment variables not loading

**Solution:**

1. Ensure `.env` file exists in project root
2. Load environment variables in your code:
   ```typescript
   import * as dotenv from 'dotenv';
   dotenv.config();
   ```
3. For Node.js 20+, use built-in support:
   ```bash
   node --env-file=.env your-script.js
   ```

---

For more help, see:

- [Quick Start Guide](./QUICKSTART.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Usage Guide](./USAGE.md)
