// Script to generate PNG icons from SVG
// Run with: node scripts/generate-icons.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 128];
const svgPath = path.join(__dirname, '../public/icon.svg');
const outputDir = path.join(__dirname, '../public');

console.log('To generate PNG icons from the SVG:');
console.log('1. Install sharp: npm install sharp');
console.log('2. Run this script: node scripts/generate-icons.js');
console.log('\nOr convert manually:');
console.log('- Open public/icon.svg in a browser');
console.log('- Take screenshots at 128x128, then resize to other sizes');
console.log('- Or use an online SVG to PNG converter like https://svgtopng.com');
console.log('\nRequired sizes: 16x16, 32x32, 48x48, 128x128');

// Try to use sharp if available
try {
  const sharp = (await import('sharp')).default;

  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated ${outputPath}`);
  }

  console.log('\n✓ All icons generated successfully!');
} catch (error) {
  console.log('\nSharp not installed. Install it with: npm install sharp');
  console.log('Then run this script again.');
}
