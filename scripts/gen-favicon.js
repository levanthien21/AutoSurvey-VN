const fs = require('fs');

const logoB64 = fs.readFileSync('public/logo.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
  <image href="data:image/png;base64,${logoB64}" x="8" y="8" width="84" height="84" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

fs.writeFileSync('public/icon.svg', svg);
fs.writeFileSync('src/app/icon.svg', svg);
console.log('Successfully generated public/icon.svg and src/app/icon.svg');
