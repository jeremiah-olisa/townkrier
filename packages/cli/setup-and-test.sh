#!/bin/bash

# TownKrier CLI - Setup and Test Script
# This script helps you get started with the CLI package

set -e

echo "========================================"
echo "🔔 TownKrier CLI - Setup & Test"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the TownKrier root directory"
    exit 1
fi

# Step 1: Build the CLI package
echo "📦 Step 1: Building CLI package..."
pnpm build:cli
echo "✅ CLI package built successfully!"
echo ""

# Step 2: Test help command
echo "📖 Step 2: Testing help command..."
node packages/cli/bin/townkrier.js --help
echo ""

# Step 3: Create a test notification
echo "🧪 Step 3: Creating test notification..."
pnpm make:notification CLITestNotification --channels email --path ./notifications --force
echo ""

# Step 4: Show the generated file
echo "📄 Step 4: Generated notification file:"
echo "---"
cat ./notifications/CLITestNotification.notification.ts
echo "---"
echo ""

# Success message
echo "========================================"
echo "✅ CLI Setup Complete!"
echo "========================================"
echo ""
echo "You can now use the CLI with:"
echo ""
echo "  pnpm make:notification YourNotification --channels email,sms"
echo ""
echo "Or directly:"
echo ""
echo "  node packages/cli/bin/townkrier.js make:notification YourNotification --channels email"
echo ""
echo "📚 For more information, see:"
echo "  - packages/cli/README.md"
echo "  - packages/cli/QUICK_START.md"
echo "  - packages/cli/CLI_IMPLEMENTATION_COMPLETE.md"
echo ""
echo "Happy notifying! 🎉"
