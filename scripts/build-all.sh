#!/bin/bash

set -e

echo "🚀 Building Intenus TypeScript SDKs..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Type checking
echo "🔍 Type checking..."
pnpm typecheck

# Linting
echo "🧹 Linting..."
pnpm lint

# Testing
echo "🧪 Running tests..."
pnpm test

# Building
echo "🔨 Building packages..."
pnpm build

echo "✅ Build completed successfully!"
echo ""
echo "📚 Available packages:"
echo "  - @intenus/common (pure types)"
echo "  - @intenus/solver-sdk (optional helpers)"
echo "  - @intenus/client-sdk (optional helpers)"
echo ""
echo "📖 Examples:"
echo "  - examples/solver-basic (using SDK helpers)"
echo "  - examples/solver-advanced (direct SDK usage)"
echo "  - examples/client-basic (client implementation)"
