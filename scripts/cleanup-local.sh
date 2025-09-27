#!/bin/bash

# ===================================================================
# Clean up debugging files from local development environment
# Run this in VS Code terminal (if using Git Bash/WSL)
# ===================================================================

echo "🧹 Cleaning up debugging files from attached_assets..."
echo ""

# Remove the problematic TypeScript debugging file
if [ -f "attached_assets/me_1758869662882.ts" ]; then
    echo "❌ Removing: attached_assets/me_1758869662882.ts"
    rm "attached_assets/me_1758869662882.ts"
else
    echo "✅ File not found: attached_assets/me_1758869662882.ts"
fi

# Check for any other TypeScript/JavaScript files in attached_assets
echo ""
echo "🔍 Checking for other problematic files..."
find attached_assets -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" 2>/dev/null | while read file; do
    echo "⚠️  Found: $file"
    echo "   You may want to review and remove this file if it's not needed"
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Now try running: npm run build"