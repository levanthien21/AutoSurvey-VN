import fs from 'fs';
import path from 'path';

const dir = './analysis_dump';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  // Check for any route definitions or page exports
  const routes = content.match(/\/create-form[a-zA-Z0-9_\-\/]*/g);
  if (routes) {
    console.log(`Routes in ${file}:`, [...new Set(routes)]);
  }
}
