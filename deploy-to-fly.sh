#!/bin/bash
# Cortiware Worker - Fly.io Deployment Script
# This script deploys the worker to Fly.io using your existing Vercel environment variables

set -e

echo "🚀 Deploying Cortiware Worker to Fly.io"
echo "========================================"
echo ""

# Navigate to worker directory
cd services/worker

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl not found. Please install it first:"
    echo "   https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io"
    echo "Run: flyctl auth login"
    exit 1
fi

echo "✅ Fly CLI ready"
echo ""

# Pull environment variables from Vercel
echo "📥 Pulling environment variables from Vercel..."
if command -v vercel &> /dev/null; then
    vercel env pull .env.production --yes
    source .env.production
    echo "✅ Environment variables loaded"
else
    echo "⚠️  Vercel CLI not found. You'll need to enter values manually."
    echo ""
    read -p "Enter REDIS_URL: " REDIS_URL
    read -p "Enter DATABASE_URL: " DATABASE_URL
    read -p "Enter STRIPE_SECRET_KEY (or press Enter to skip): " STRIPE_SECRET_KEY
    read -p "Enter STRIPE_WEBHOOK_SECRET (or press Enter to skip): " STRIPE_WEBHOOK_SECRET
fi

echo ""

# Deploy to Fly.io
echo "🚀 Deploying to Fly.io..."

# Check if app exists
if flyctl apps list | grep -q "cortiware-worker"; then
    echo "✅ App exists, deploying update..."
    flyctl deploy
else
    echo "📦 Creating new app..."
    flyctl launch --now --name cortiware-worker --region iad --no-deploy
    flyctl deploy
fi

echo ""

# Set secrets
echo "🔐 Setting environment variables..."

SECRETS_CMD="flyctl secrets set REDIS_URL=\"$REDIS_URL\" DATABASE_URL=\"$DATABASE_URL\" WORKER_CONCURRENCY=\"8\" WORKER_MAX_RETRIES=\"5\" WORKER_BACKOFF_MS=\"15000\""

if [ -n "$STRIPE_SECRET_KEY" ]; then
    SECRETS_CMD="$SECRETS_CMD STRIPE_SECRET_KEY=\"$STRIPE_SECRET_KEY\""
fi

if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
    SECRETS_CMD="$SECRETS_CMD STRIPE_WEBHOOK_SECRET=\"$STRIPE_WEBHOOK_SECRET\""
fi

eval $SECRETS_CMD

echo "✅ Secrets configured"
echo ""

# Configure auto-scaling
echo "⚙️  Configuring auto-scaling..."
flyctl autoscale set min=0 max=2

echo ""
echo "✅ Deployment complete!"
echo ""

# Test health endpoint
APP_NAME=$(grep 'app = ' fly.toml | cut -d'"' -f2)
HEALTH_URL="https://$APP_NAME.fly.dev/health"

echo "🧪 Testing health endpoint..."
sleep 5
if curl -f "$HEALTH_URL" 2>/dev/null; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check failed (worker may still be starting)"
fi

echo ""
echo "🎉 Worker deployed successfully!"
echo ""
echo "Next steps:"
echo "  • View logs: flyctl logs"
echo "  • Check status: flyctl status"
echo "  • Open dashboard: flyctl dashboard"
echo ""
echo "Worker URL: $HEALTH_URL"

