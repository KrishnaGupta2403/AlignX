const fs = require('fs');
const file = 'd:/Atomberg/frontend/src/components/backgrounds/Hyperspeed.jsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/\\`/g, '`').replace(/\\\${/g, '${');
fs.writeFileSync(file, code);
console.log('Fixed syntax errors');
