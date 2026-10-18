import fs from 'fs';
import path from 'path';

const dir = './analysis_dump';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

const allHrefs = new Set();
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  // Match href="/..." or push("/...")
  const matches = content.match(/(?:push|replace|href|to):\s*["'](\/[a-zA-Z0-9_\-\/]+)["']/g) || [];
  matches.forEach(m => allHrefs.add(m));

  const stringRoutes = content.match(/["'](\/[a-z0-9_\-]+(?:\/[a-z0-9_\-]+)*)["']/g) || [];
  stringRoutes.forEach(r => {
    const clean = r.replace(/['"]/g, '');
    if (!clean.startsWith('/_next') && clean.length > 2 && !clean.includes('.') && !clean.startsWith('/api')) {
      allHrefs.add(clean);
    }
  });
}

console.log('Detected internal routes/paths:');
console.log([...allHrefs].sort());
