import fs from 'fs';
import path from 'path';

const dir = './analysis_dump';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

console.log('=== DETAILED HOOKS & FUNCTIONS SCAN ===');
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const hooks = content.match(/\"(use[A-Za-z0-9_]+)\"/g);
  if (hooks) {
    const set = [...new Set(hooks.map(h => h.replace(/\"/g, '')))];
    console.log(`${file}:`, set);
  }
}
