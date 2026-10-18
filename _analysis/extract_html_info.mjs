import fs from 'fs';

const html = fs.readFileSync('C:/Users/ASUS/.gemini/antigravity/brain/e5ae2191-f8f8-4ac0-ab29-6d2048bfaf7e/.system_generated/steps/3/content.md', 'utf8');

// Find all script tags
const scripts = [...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
console.log('Total scripts found in HTML:', scripts.length);
console.log(scripts);

// Find all href links
const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
console.log('\nTotal hrefs found in HTML:', hrefs.length);
console.log([...new Set(hrefs)]);

// Find all JSON / strings with paths like /form, /survey, /model, etc.
const paths = [...html.matchAll(/["'](\/[a-zA-Z0-9_\-\/]+)["']/g)].map(m => m[1]);
console.log('\nInteresting paths in HTML:');
const uniquePaths = [...new Set(paths)].filter(p => !p.startsWith('/_next') && p.length > 1);
console.log(uniquePaths);
