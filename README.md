# TownKrier Monorepo

> Laravel-style notification system for Node.js with multiple channels and providers

TownKrier is a flexible, provider-agnostic notification system inspired by Laravel's notification system. It supports multiple notification channels including email, SMS, push notifications, and in-app notifications.

## 📦 Packages

This monorepo contains the following packages:

- **[@townkrier/core](./packages/core)** - Core notification system and interfaces
- **[@townkrier/resend](./packages/resend)** - Resend email adapter
- **[@townkrier/fcm](./packages/fcm)** - Firebase Cloud Messaging adapter for push notifications
- **[@townkrier/termii](./packages/termii)** - Termii SMS adapter
- **[@townkrier/in-app](./packages/in-app)** - In-app notification adapter

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install pnpm if you haven't already
npm install -g pnpm@8.15.4

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## 📖 Development

### Available Scripts

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build a specific package
pnpm build:core
pnpm build:resend
pnpm build:fcm
pnpm build:termii
pnpm build:in-app

# Watch mode for development
pnpm dev

# Run tests
pnpm test
pnpm test:cov
pnpm test:watch

# Lint code
pnpm lint

# Format code
pnpm format
pnpm format:check

# Clean build artifacts
pnpm clean:build

# Clean everything (including node_modules)
pnpm clean
```

### Project Structure

```
townkrier-monorepo/
├── packages/              # All packages
│   ├── core/             # Core notification system
│   ├── resend/           # Resend email adapter
│   ├── fcm/              # Firebase Cloud Messaging adapter
│   ├── termii/           # Termii SMS adapter
│   └── in-app/           # In-app notification adapter
├── docs/                 # Documentation
├── .eslintrc.js         # ESLint configuration
├── .prettierrc          # Prettier configuration
├── tsconfig.base.json   # Base TypeScript configuration
├── lerna.json           # Lerna configuration
├── pnpm-workspace.yaml  # pnpm workspace configuration
└── package.json         # Root package.json
```

### Adding a New Package

1. Create a new directory under `packages/`
2. Add a `package.json` with the package name following the pattern `@townkrier/package-name`
3. Add a `tsconfig.json` that extends `../../tsconfig.base.json`
4. The workspace will automatically pick it up

### Publishing

```bash
# Version packages (interactive)
pnpm version

# Version with semantic versioning
pnpm version:patch   # 1.0.0 -> 1.0.1
pnpm version:minor   # 1.0.0 -> 1.1.0
pnpm version:major   # 1.0.0 -> 2.0.0
pnpm version:prerelease  # 1.0.0 -> 1.0.1-alpha.0

# Publish packages
pnpm publish

# Full release workflow
pnpm release:patch   # Build, version, and publish patch
pnpm release:minor   # Build, version, and publish minor
pnpm release:major   # Build, version, and publish major
pnpm release:alpha   # Build, version, and publish alpha
```

## 🛠️ Technology Stack

- **Package Manager:** pnpm
- **Monorepo Tool:** Lerna
- **Language:** TypeScript
- **Testing:** Jest
- **Linting:** ESLint
- **Formatting:** Prettier

## 📝 License

MIT

## 👤 Author

Jeremiah Olisa

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📚 Documentation

For more detailed documentation, see the [docs](./docs) directory:

- [Functional Requirements Document](./docs/TownKrier-FRD.md)
- [Technical Requirements Document](./docs/TownKrier-TRD.md)
