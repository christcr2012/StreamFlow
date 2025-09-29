// scripts/generate-pwa-icons.js
const fs = require('fs');
const path = require('path');

/**
 * 📱 PWA ICON GENERATOR SCRIPT
 * 
 * This script creates placeholder PWA icons by copying the existing logo
 * to the required icon sizes. In production, you would use proper image
 * processing tools like Sharp or ImageMagick to resize images properly.
 */

const iconSizes = [
  { size: '16x16', name: 'favicon-16x16.png' },
  { size: '32x32', name: 'favicon-32x32.png' },
  { size: '72x72', name: 'icon-72x72.png' },
  { size: '96x96', name: 'icon-96x96.png' },
  { size: '128x128', name: 'icon-128x128.png' },
  { size: '144x144', name: 'icon-144x144.png' },
  { size: '152x152', name: 'icon-152x152.png' },
  { size: '192x192', name: 'icon-192x192.png' },
  { size: '384x384', name: 'icon-384x384.png' },
  { size: '512x512', name: 'icon-512x512.png' },
  { size: '180x180', name: 'apple-touch-icon.png' },
  { size: '152x152', name: 'apple-touch-icon-152x152.png' },
  { size: '180x180', name: 'apple-touch-icon-180x180.png' },
  { size: '167x167', name: 'apple-touch-icon-167x167.png' },
];

const shortcutIcons = [
  { name: 'shortcut-dashboard.png', size: '96x96' },
  { name: 'shortcut-leads.png', size: '96x96' },
  { name: 'shortcut-work-orders.png', size: '96x96' },
  { name: 'shortcut-clock.png', size: '96x96' },
];

const socialIcons = [
  { name: 'og-image.png', size: '1200x630' },
  { name: 'twitter-image.png', size: '1200x600' },
];

async function generateIcons() {
  const publicDir = path.join(process.cwd(), 'public');
  const iconsDir = path.join(publicDir, 'icons');
  const logoPath = path.join(publicDir, 'logo.png');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Check if logo exists
  if (!fs.existsSync(logoPath)) {
    console.log('⚠️  Logo not found at public/logo.png');
    console.log('📝 Creating placeholder icons...');
    
    // Create a simple SVG placeholder for each icon
    for (const icon of iconSizes) {
      const [width, height] = icon.size.split('x').map(Number);
      const svgContent = createPlaceholderSVG(width, height, 'StreamFlow');
      const iconPath = path.join(iconsDir, icon.name);
      
      // For now, we'll create SVG files and rename them to PNG
      // In production, you'd convert SVG to PNG using proper tools
      fs.writeFileSync(iconPath.replace('.png', '.svg'), svgContent);
      console.log(`✅ Created ${icon.name.replace('.png', '.svg')}`);
    }

    // Create shortcut icons
    for (const icon of shortcutIcons) {
      const [width, height] = icon.size.split('x').map(Number);
      const iconName = icon.name.replace('shortcut-', '').replace('.png', '');
      const svgContent = createPlaceholderSVG(width, height, iconName);
      const iconPath = path.join(iconsDir, icon.name);
      
      fs.writeFileSync(iconPath.replace('.png', '.svg'), svgContent);
      console.log(`✅ Created ${icon.name.replace('.png', '.svg')}`);
    }

    // Create social media images
    for (const icon of socialIcons) {
      const [width, height] = icon.size.split('x').map(Number);
      const svgContent = createSocialImageSVG(width, height);
      const iconPath = path.join(iconsDir, icon.name);
      
      fs.writeFileSync(iconPath.replace('.png', '.svg'), svgContent);
      console.log(`✅ Created ${icon.name.replace('.png', '.svg')}`);
    }

    // Create browserconfig.xml for Windows tiles
    const browserConfig = createBrowserConfig();
    fs.writeFileSync(path.join(iconsDir, 'browserconfig.xml'), browserConfig);
    console.log('✅ Created browserconfig.xml');

    // Create favicon.ico placeholder
    const faviconSVG = createPlaceholderSVG(32, 32, 'SF');
    fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSVG);
    console.log('✅ Created favicon.svg');

    console.log('\n🎉 PWA icons generated successfully!');
    console.log('📝 Note: SVG placeholders created. For production, convert to PNG using:');
    console.log('   - Sharp (Node.js): npm install sharp');
    console.log('   - ImageMagick: convert icon.svg icon.png');
    console.log('   - Online tools: https://convertio.co/svg-png/');
    
  } else {
    console.log('✅ Logo found! For production, use image processing tools to resize logo.png to all required sizes.');
    console.log('📝 Recommended: Use Sharp or ImageMagick to generate proper PWA icons from logo.png');
  }
}

function createPlaceholderSVG(width, height, text) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad)" rx="${Math.min(width, height) * 0.1}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.3}" 
        fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">
    ${text}
  </text>
</svg>`;
}

function createSocialImageSVG(width, height) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="socialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#socialGrad)"/>
  <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="${width * 0.08}" 
        fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">
    StreamFlow
  </text>
  <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="${width * 0.03}" 
        fill="#94a3b8" text-anchor="middle" dominant-baseline="middle">
    Enterprise Business Management Platform
  </text>
</svg>`;
}

function createBrowserConfig() {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square70x70logo src="/icons/mstile-70x70.png"/>
            <square150x150logo src="/icons/mstile-150x150.png"/>
            <square310x310logo src="/icons/mstile-310x310.png"/>
            <wide310x150logo src="/icons/mstile-310x150.png"/>
            <TileColor>#1e293b</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;
}

// Run the script
generateIcons().catch(console.error);
