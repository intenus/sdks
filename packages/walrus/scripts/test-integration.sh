#!/bin/bash

# Integration test script for Walrus SDK on testnet
# Requires environment variables:
# - INTENUS_ADMIN_PRIVATE_KEY
# - INTENUS_ADMIN_PUBLIC_KEY

set -e

echo "🧪 Running Walrus SDK Integration Tests on Testnet"
echo "================================================="

# Check if environment variables are set
if [ -z "$INTENUS_ADMIN_PRIVATE_KEY" ]; then
    echo "❌ Error: INTENUS_ADMIN_PRIVATE_KEY environment variable is not set"
    echo "Please set your admin private key:"
    echo "export INTENUS_ADMIN_PRIVATE_KEY=your_private_key_hex"
    exit 1
fi

if [ -z "$INTENUS_ADMIN_PUBLIC_KEY" ]; then
    echo "❌ Error: INTENUS_ADMIN_PUBLIC_KEY environment variable is not set"
    echo "Please set your admin public key:"
    echo "export INTENUS_ADMIN_PUBLIC_KEY=your_public_key_hex"
    exit 1
fi

echo "✅ Environment variables configured"
echo "🔑 Admin Public Key: $INTENUS_ADMIN_PUBLIC_KEY"

# Build the package first
echo "🔨 Building package..."
npm run build

# Run integration tests
echo "🚀 Running integration tests..."
npm run test -- tests/integration.test.ts

echo "✅ Integration tests completed!"
