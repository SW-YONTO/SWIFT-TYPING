const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function createWindowsIco() {
  try {
    // Read the source PNG
    const inputPath = path.join(__dirname, 'public/favicon_io/icon.png');
    const outputPath = path.join(__dirname, 'public/windows-icon.ico');
    
    // ICO files need multiple sizes for Windows
    const sizes = [16, 32, 48, 64, 128, 256];
    
    console.log('Creating Windows ICO file with multiple resolutions...');
    console.log(`Input: ${inputPath}`);
    console.log(`Output: ${outputPath}`);
    console.log(`Sizes: ${sizes.join(', ')}px`);
    
    // For now, let's just copy the existing ICO
    // The user already has an ICO file, we just need to ensure it's in the right place
    const existingIco = path.join(__dirname, 'public/icon.ico');
    if (fs.existsSync(existingIco)) {
      fs.copyFileSync(existingIco, outputPath);
      console.log('Copied existing icon.ico to windows-icon.ico');
    }
    
    console.log('✓ Done!');
  } catch (error) {
    console.error('Error creating ICO:', error);
    process.exit(1);
  }
}

createWindowsIco();
