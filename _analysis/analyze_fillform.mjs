import fs from 'fs';
import path from 'path';

const dir = './analysis_dump';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

console.log('--- DEEP INSPECTION OF FILLFORM CHUNKS ---');

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');

  // Check for google form parsing
  if (content.includes('FB_PUBLIC_LOAD_DATA_') || content.includes('entry.') || content.includes('formResponse')) {
    console.log(`\n[GOOGLE FORM CORE]: Found in ${file}`);
    // extract surrounding snippets
    const matches = content.match(/.{0,100}(?:FB_PUBLIC_LOAD_DATA_|formResponse|entry\.\d+).{0,100}/g) || [];
    console.log(`Matches (${matches.length}):`, matches.slice(0, 5));
  }

  // Check for models / cronbach / sem
  if (content.includes('cronbach') || content.includes('htmt') || content.includes('fornell') || content.includes('smartpls')) {
    console.log(`\n[RESEARCH MODEL CORE]: Found in ${file}`);
    const matches = content.match(/.{0,100}(?:cronbach|htmt|fornell).{0,100}/gi) || [];
    console.log(`Matches (${matches.length}):`, matches.slice(0, 5));
  }

  // Check for ratio / percentage filling
  if (content.includes('createFormRatio') || content.includes('createFormData') || content.includes('createFormModel')) {
    console.log(`\n[FORM CREATION ROUTES/UI]: Found in ${file}`);
  }
}
