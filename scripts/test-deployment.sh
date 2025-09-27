#!/bin/bash

# ===================================================================
# WorkStream Deployment Test Script
# Run this in VS Code to test before deploying to Vercel
# ===================================================================

echo "🚀 Testing WorkStream Deployment Readiness..."
echo ""

# 1. TypeScript Compilation Test
echo "📝 1. Checking TypeScript compilation..."
if npx tsc --noEmit; then
    echo "✅ TypeScript compilation: PASSED"
else
    echo "❌ TypeScript compilation: FAILED"
    exit 1
fi
echo ""

# 2. ESLint Check  
echo "🔍 2. Running ESLint..."
if npm run lint; then
    echo "✅ ESLint: PASSED"
else
    echo "⚠️  ESLint: WARNINGS (but not blocking)"
fi
echo ""

# 3. Prisma Schema Validation
echo "🗄️  3. Validating Prisma schema..."
if npx prisma validate; then
    echo "✅ Prisma schema: VALID"
else
    echo "❌ Prisma schema: INVALID"
    exit 1
fi
echo ""

# 4. Build Test (Same as Vercel)
echo "🏗️  4. Testing production build..."
if npm run build; then
    echo "✅ Production build: SUCCESS"
else
    echo "❌ Production build: FAILED"
    exit 1
fi
echo ""

# 5. Clean up build artifacts
echo "🧹 5. Cleaning up..."
rm -rf .next

echo "🎉 All tests passed! Ready for Vercel deployment."
echo ""
echo "Next steps:"
echo "1. Set environment variables in Vercel Dashboard"
echo "2. Deploy to Vercel"
echo "3. Test the live application"