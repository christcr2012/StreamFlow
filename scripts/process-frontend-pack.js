/**
 * Frontend Pack Processor
 * Processes binders with frontend/UI specifications (screens, components, etc.)
 */
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const CONFIG = {
  OUTPUT_DIR: "src/app/(app)",
  COMPONENTS_DIR: "src/components",
  BATCH_SIZE: 1500,
  CHUNK_BYTES: 1024 * 1024 * 8,
};

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function sanitizeComponentName(name) {
  return name
    .replace(/[^a-zA-Z0-9\-_]/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function generatePageComponent(screenName, body) {
  const componentName = screenName
    .split(/[-_\s]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");

  return `'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ${componentName}Page() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // TODO: Fetch data for ${screenName}
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">${screenName}</h1>
      
      {/* TODO: Implement UI for ${screenName} */}
      <div className="bg-card rounded-lg shadow p-6">
        <p className="text-muted-foreground">
          This page is under construction. Implement the UI based on the binder specification.
        </p>
      </div>
    </div>
  );
}
`;
}

function generateComponent(componentName, body) {
  const name = componentName
    .split(/[-_\s]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");

  return `'use client';

import { useState } from 'react';

interface ${name}Props {
  // TODO: Define props based on specification
}

export function ${name}(props: ${name}Props) {
  // TODO: Implement component logic for ${componentName}

  return (
    <div className="component-${componentName.toLowerCase()}">
      {/* TODO: Implement UI for ${componentName} */}
      <p className="text-muted-foreground">
        Component: ${componentName}
      </p>
    </div>
  );
}
`;
}

async function extractScreens(filePath) {
  const screens = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8", highWaterMark: CONFIG.CHUNK_BYTES }),
    crlfDelay: Infinity,
  });

  let currentScreen = null;
  let bodyLines = [];

  for await (const line of rl) {
    // Match ### Screen heading
    const screenMatch = line.match(/^###\s+Screen\s*:\s*(.+)/i) ||
                       line.match(/^###\s+Page\s*:\s*(.+)/i) ||
                       line.match(/^###\s+UI\s*:\s*(.+)/i);
    
    if (screenMatch) {
      // Save previous screen
      if (currentScreen) {
        screens.push({ ...currentScreen, body: bodyLines.join("\n") });
      }
      
      currentScreen = { name: screenMatch[1].trim(), path: null };
      bodyLines = [];
      continue;
    }

    // Match path within screen section
    if (currentScreen && !currentScreen.path) {
      const pathMatch = line.match(/[-*]\s*\*\*Path\*\*:\s*([^\r\n]+)/i) ||
                       line.match(/\*\*Path\*\*:\s*([^\r\n]+)/i) ||
                       line.match(/Path:\s*([^\r\n]+)/i) ||
                       line.match(/Route:\s*([^\r\n]+)/i);
      if (pathMatch) {
        currentScreen.path = pathMatch[1].trim();
      }
    }

    // Collect body lines
    if (currentScreen) {
      bodyLines.push(line);
    }
  }

  // Save last screen
  if (currentScreen) {
    screens.push({ ...currentScreen, body: bodyLines.join("\n") });
  }

  return screens.filter(s => s.name);
}

async function extractComponents(filePath) {
  const components = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8", highWaterMark: CONFIG.CHUNK_BYTES }),
    crlfDelay: Infinity,
  });

  let currentComponent = null;
  let bodyLines = [];

  for await (const line of rl) {
    // Match ### Component heading
    const componentMatch = line.match(/^###\s+Component\s*:\s*(.+)/i) ||
                          line.match(/^###\s+Control\s*:\s*(.+)/i);
    
    if (componentMatch) {
      // Save previous component
      if (currentComponent) {
        components.push({ ...currentComponent, body: bodyLines.join("\n") });
      }
      
      currentComponent = { name: componentMatch[1].trim() };
      bodyLines = [];
      continue;
    }

    // Collect body lines
    if (currentComponent) {
      bodyLines.push(line);
    }
  }

  // Save last component
  if (currentComponent) {
    components.push({ ...currentComponent, body: bodyLines.join("\n") });
  }

  return components;
}

function commitBatch(files, batchNum, totalBatches, binderName) {
  const { spawnSync } = require("child_process");
  
  console.log(`  📦 Committing batch ${batchNum}/${totalBatches} (${files.length} files)...`);
  
  // Add files
  const addResult = spawnSync("git", ["add", ...files], { 
    stdio: "inherit",
    shell: false 
  });
  
  if (addResult.status !== 0) {
    console.error(`  ❌ Failed to add files for batch ${batchNum}`);
    return false;
  }

  // Commit
  const commitMsg = `feat(${binderName}): frontend batch ${batchNum}/${totalBatches} [skip ci]`;
  const commitResult = spawnSync("git", ["commit", "-m", commitMsg], {
    stdio: "inherit",
    shell: false
  });

  if (commitResult.status !== 0) {
    console.error(`  ❌ Failed to commit batch ${batchNum}`);
    return false;
  }

  console.log(`  ✅ Batch ${batchNum}/${totalBatches} committed`);
  return true;
}

async function processBinderFile(binderPath) {
  const binderName = path.basename(binderPath, ".md");
  console.log(`\n🔄 Processing ${binderName} (Frontend)...`);

  const screens = await extractScreens(binderPath);
  const components = await extractComponents(binderPath);
  
  console.log(`  📊 Found ${screens.length} screens and ${components.length} components`);

  if (screens.length === 0 && components.length === 0) {
    console.log(`  ⚠️  No screens or components found - skipping`);
    return;
  }

  const generatedFiles = [];

  // Generate screen pages
  for (const screen of screens) {
    const sanitized = sanitizeComponentName(screen.name);
    const pagePath = screen.path ? screen.path.replace(/^\//, "") : sanitized;
    const filePath = path.join(CONFIG.OUTPUT_DIR, pagePath, "page.tsx");
    
    ensureDir(path.dirname(filePath));
    
    const code = generatePageComponent(screen.name, screen.body);
    fs.writeFileSync(filePath, code, "utf8");
    generatedFiles.push(filePath);
  }

  // Generate components
  for (const component of components) {
    const sanitized = sanitizeComponentName(component.name);
    const filePath = path.join(CONFIG.COMPONENTS_DIR, `${sanitized}.tsx`);
    
    ensureDir(path.dirname(filePath));
    
    const code = generateComponent(component.name, component.body);
    fs.writeFileSync(filePath, code, "utf8");
    generatedFiles.push(filePath);
  }

  console.log(`  ✅ Generated ${generatedFiles.length} files`);

  // Commit in batches
  const totalBatches = Math.ceil(generatedFiles.length / CONFIG.BATCH_SIZE);
  for (let i = 0; i < totalBatches; i++) {
    const start = i * CONFIG.BATCH_SIZE;
    const end = Math.min(start + CONFIG.BATCH_SIZE, generatedFiles.length);
    const batch = generatedFiles.slice(start, end);
    
    const success = commitBatch(batch, i + 1, totalBatches, binderName);
    if (!success) {
      console.error(`  ❌ Failed to commit batch ${i + 1}`);
      process.exit(1);
    }
  }

  console.log(`\n✅ ${binderName} frontend complete!`);
}

async function main() {
  const binderPath = process.argv[2];
  
  if (!binderPath) {
    console.error("Usage: node process-frontend-pack.js <binder-file-path>");
    process.exit(1);
  }

  if (!fs.existsSync(binderPath)) {
    console.error(`Binder file not found: ${binderPath}`);
    process.exit(1);
  }

  await processBinderFile(binderPath);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  });
}

module.exports = { processBinderFile, extractScreens, extractComponents };

