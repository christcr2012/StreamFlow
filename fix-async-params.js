const fs = require("fs");
const path = require("path");

const files = [
  "apps/tenant-app/src/app/api/referrals/[id]/route.ts",
  "apps/tenant-app/src/app/api/v2/contacts/[id]/route.ts",
  "apps/tenant-app/src/app/api/integrations/[provider]/route.ts",
];

files.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, "utf8");
  const original = content;

  // Fix function signatures: { params }: { params: { X: string } } → { params }: { params: Promise<{ X: string }> }
  content = content.replace(
    /\{ params \}: \{ params: \{ ([a-z]+): string \} \}/g,
    "{ params }: { params: Promise<{ $1: string }> }",
  );

  //  Add `const { X } = await params;` after function signature if not already present
  content = content.replace(
    /(export async function (?:GET|POST|PATCH|DELETE|PUT)\([^)]+\{ params \}: \{ params: Promise<\{ ([a-z]+): string \}> \}\)[^{]*\{)\s*\n(\s*)(try \{)?/g,
    (match, funcStart, paramName, indent, tryBlock) => {
      // Check if destructure already exists
      if (!match.includes(`const { ${paramName} } = await params;`)) {
        return `${funcStart}\n${indent}const { ${paramName} } = await params;\n${indent}${tryBlock || ""}`;
      }
      return match;
    },
  );

  // Fix all instances of `params.X` → `X` in where clauses and other usages
  content = content.replace(/params\.([a-z]+)(?![a-zA-Z])/g, "$1");

  if (content !== original) {
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
});

console.log("\n✨ Done!");
