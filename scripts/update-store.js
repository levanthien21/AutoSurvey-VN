const fs = require('fs');
const filePath = 'C:/Users/ASUS/Desktop/AI Agent/app/store.py';
let content = fs.readFileSync(filePath, 'utf8');

const target = '    cfg = dict(DEFAULT_CONFIG)';
const replacement = '    cfg = dict(DEFAULT_CONFIG)\n    cfg["tokens"] = 999999999';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated store.py default tokens');
} else {
  console.log('Target not found in store.py');
}
