#!/usr/bin/env node

/**
 * PWA Icon Generator for Cornucopia
 * 
 * This script generates all required PWA icons from the SVG logo.
 * 
 * Usage:
 *   1. Install sharp: npm install sharp --save-dev
 *   2. Run: node scripts/generate-pwa-icons.js
 * 
 * Or run manually with: npx sharp-cli commands
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not installed. Creating placeholder icons...');
  createPlaceholderIcons();
  process.exit(0);
}

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SVG_SOURCE = path.join(__dirname, '../public/logos/cornucopia-mountain-tree.svg');

// Icon sizes to generate
const ICON_SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  console.log('Created icons directory');
}

async function generateIcons() {
  try {
    // Read the SVG file
    const svgBuffer = fs.readFileSync(SVG_SOURCE);
    
    console.log('Generating PWA icons...');
    
    // Generate standard icons
    for (const size of ICON_SIZES) {
      const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 11, g: 77, b: 44, alpha: 1 } // #0B4D2C
        })
        .png()
        .toFile(outputPath);
      
      console.log(`  ✓ Generated icon-${size}x${size}.png`);
    }
    
    // Generate Apple Touch Icon (180x180 with padding)
    await sharp(svgBuffer)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 11, g: 77, b: 44, alpha: 1 }
      })
      .png()
      .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
    console.log('  ✓ Generated apple-touch-icon.png');
    
    // Generate maskable icons (with padding for safe zone)
    // Maskable icons need ~10% padding on each side
    for (const size of [192, 512]) {
      const innerSize = Math.floor(size * 0.8);
      const padding = Math.floor(size * 0.1);
      
      const innerImage = await sharp(svgBuffer)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 11, g: 77, b: 44, alpha: 1 }
        })
        .png()
        .toBuffer();
      
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 11, g: 77, b: 44, alpha: 1 }
        }
      })
        .composite([{
          input: innerImage,
          top: padding,
          left: padding
        }])
        .png()
        .toFile(path.join(ICONS_DIR, `icon-maskable-${size}x${size}.png`));
      
      console.log(`  ✓ Generated icon-maskable-${size}x${size}.png`);
    }
    
    // Generate favicon.ico (multi-size)
    await sharp(svgBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 11, g: 77, b: 44, alpha: 1 }
      })
      .png()
      .toFile(path.join(ICONS_DIR, 'favicon-32x32.png'));
    console.log('  ✓ Generated favicon-32x32.png');
    
    await sharp(svgBuffer)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 11, g: 77, b: 44, alpha: 1 }
      })
      .png()
      .toFile(path.join(ICONS_DIR, 'favicon-16x16.png'));
    console.log('  ✓ Generated favicon-16x16.png');
    
    console.log('\n✅ All PWA icons generated successfully!');
    console.log(`   Location: ${ICONS_DIR}`);
    
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

function createPlaceholderIcons() {
  // Create icons directory
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }
  
  // Create a simple placeholder SVG that can be used temporarily
  const placeholderSvg = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0B4D2C"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial, sans-serif" font-size="${Math.floor(size * 0.4)}">C</text>
</svg>`;
  
  console.log('Creating placeholder icons (install sharp for proper icons)...');
  
  // Create placeholder SVG icons
  for (const size of ICON_SIZES) {
    const svgContent = placeholderSvg(size);
    fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}x${size}.svg`), svgContent);
    console.log(`  ✓ Created placeholder icon-${size}x${size}.svg`);
  }
  
  // Create apple touch icon
  fs.writeFileSync(path.join(ICONS_DIR, 'apple-touch-icon.svg'), placeholderSvg(180));
  console.log('  ✓ Created placeholder apple-touch-icon.svg');
  
  // Create maskable icons
  for (const size of [192, 512]) {
    fs.writeFileSync(path.join(ICONS_DIR, `icon-maskable-${size}x${size}.svg`), placeholderSvg(size));
    console.log(`  ✓ Created placeholder icon-maskable-${size}x${size}.svg`);
  }
  
  console.log('\n⚠️  Placeholder icons created. For production, install sharp and run again:');
  console.log('   npm install sharp --save-dev');
  console.log('   node scripts/generate-pwa-icons.js');
}

// Run the generator
generateIcons();
