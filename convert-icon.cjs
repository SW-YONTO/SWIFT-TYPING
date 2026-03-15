const m = require('png-to-ico');
const pngToIco = m.default || m.imagesToIco || m;
const fs = require('fs');
const path = require('path');

const inputPng = path.join(__dirname, 'build', 'icon.png');

console.log('Converting PNG to ICO...');
console.log('Input:', inputPng, '| Exists:', fs.existsSync(inputPng));
console.log('pngToIco type:', typeof pngToIco);

// Try default export first, then imagesToIco
const convertFn = (typeof pngToIco === 'function') ? pngToIco : m.imagesToIco;

convertFn(inputPng)
    .then(buf => {
        const icoPath1 = path.join(__dirname, 'build', 'icon.ico');
        const icoPath2 = path.join(__dirname, 'public', 'ICONS', 'SWIFTLOGO.ico');
        fs.writeFileSync(icoPath1, buf);
        fs.writeFileSync(icoPath2, buf);
        console.log('SUCCESS! ICO files created:');
        console.log(' -', icoPath1, '(' + buf.length + ' bytes)');
        console.log(' -', icoPath2, '(' + buf.length + ' bytes)');
    })
    .catch(err => {
        console.error('ERROR:', err.message);
        process.exit(1);
    });
