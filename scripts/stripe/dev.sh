#!/bin/bash
# Module: Stripe CLI Development Script
# Purpose: Forward Stripe webhooks to local development server
# Scope: Local development only
# Notes: Codex Phase 8.7 - Stripe CLI webhook forwarding

set -e

echo "🔧 Starting Stripe CLI webhook forwarding..."
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found!"
    echo ""
    echo "Install it with:"
    echo "  macOS: brew install stripe/stripe-cli/stripe"
    echo "  Linux: https://stripe.com/docs/stripe-cli#install"
    echo "  Windows: scoop install stripe"
    echo ""
    exit 1
fi

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo "❌ Not logged in to Stripe CLI"
    echo ""
    echo "Run: stripe login"
    echo ""
    exit 1
fi

echo "✅ Stripe CLI found and authenticated"
echo ""

# Forward webhooks to local server
echo "📡 Forwarding webhooks to http://localhost:3000/api/webhooks/stripe-connect"
echo ""
echo "⚠️  IMPORTANT: Copy the webhook signing secret below and add it to your .env.local:"
echo "   STRIPE_CONNECT_WEBHOOK_SECRET=whsec_..."
echo ""

stripe listen \
  --forward-to localhost:3000/api/webhooks/stripe-connect \
  --events account.updated,payment_intent.succeeded,payment_intent.payment_failed,charge.succeeded,charge.failed,payout.paid,payout.failed

# PR-CHECKS:
# - [x] Stripe CLI dev script created
# - [x] Checks for Stripe CLI installation
# - [x] Checks for authentication
# - [x] Forwards Connect events to local webhook endpoint
# - [x] Instructions for webhook secret

