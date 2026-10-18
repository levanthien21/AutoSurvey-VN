import fs from 'fs';
import path from 'path';

const dir = './analysis_dump';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

console.log('--- SCANNING ENDPOINTS & ROUTES ---');
const allApis = new Set();
const allRoutes = new Set();
const allKeywords = new Set();

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  
  // API endpoints
  const apiMatches = content.match(/\/api\/[a-zA-Z0-9_\-\./]+/g) || [];
  apiMatches.forEach(a => allApis.add(a));

  // Next.js page routes
  const routeMatches = content.match(/\"(\/(?:order|survey|fill|create-form|model|data|authentication|user|credit)[a-zA-Z0-9_\-\./]*)\"/g) || [];
  routeMatches.forEach(r => allRoutes.add(r.replace(/\"/g, '')));

  // Interesting keywords
  const keywords = ['docs.google.com', 'forms.gle', 'formResponse', 'viewform', 'cronbach', 'smartpls', 'efanalysis', 'htmt', 'fornell'];
  for (const kw of keywords) {
    if (content.toLowerCase().includes(kw)) {
      allKeywords.add(`${file}: contains "${kw}"`);
    }
  }
}

console.log('API Endpoints found:');
console.log([...allApis]);

console.log('\nPage Routes found:');
console.log([...allRoutes]);

console.log('\nKeywords found:');
console.log([...allKeywords]);
