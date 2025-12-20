const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'public/favicon_io/android-chrome-512x512.png');
const outputFile = path.join(__dirname, 'public/icon.ico');
const buildOutputFile = path.join(__dirname, 'build/icon.ico');

// Ensure build directory exists
if (!fs.existsSync(path.join(__dirname, 'build'))) {
  fs.mkdirSync(path.join(__dirname, 'build'));
}

pngToIco(inputFile)
  .then(buf => {
    fs.writeFileSync(outputFile, buf);
    fs.writeFileSync(buildOutputFile, buf);
    console.log('✓ Icon created successfully!');
    console.log('  Output: public/icon.ico');
    console.log('  Output: build/icon.ico');
    console.log('  Multi-size ICO created from 512x512 PNG');
  })
  .catch(err => {
    console.error('Error creating icon:', err);
    process.exit(1);
  });
