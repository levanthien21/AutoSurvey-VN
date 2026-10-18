import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://app.fillform.info';
const outDir = './analysis_dump';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Chunks identified from HTML
const chunks = [
  '071--yxaut2nv.js',
  '2r1wxkaj7ho5q.js',
  '1slms18etnojs.js',
  '0i11f_5rn1ls4.js',
  '3qv6unmxrrroj.js',
  'turbopack-1jwpgmco4z4ak.js',
  '0h05qnqg9km1p.js',
  '3qssvey5t78f1.js',
  '2ysn_fsgpx54b.js',
  '3t3ucun_9ptke.js',
  '2bqdwyi7xveta.js',
  '0yppz3_mqqj9_.js',
  '0wbfe9u-53ltp.js',
  '1cbezhwefcx_-.js',
  '1ibc-nnuk59c1.js',
  '3dsw52khu34li.js',
  '1csloi4u1rh3c.js',
  '1xugc3j94f10d.js',
  '190lsxanwjaku.js',
  '0clcyyir3-5-e.js',
  '21rr2w9ardm-w.js',
  '38agwohzan9e4.js',
  '1qfvgmby2f9m1.js',
  '38lyi4r2jgioy.js',
  '051dh-d-u6xdx.js',
  '0mckjgu98043q.js',
  '0cz1d0mv5g_q7.js'
];

async function run() {
  console.log('Downloading chunks and checking for sourcemaps...');
  for (const chunk of chunks) {
    const url = `${BASE_URL}/_next/static/chunks/${chunk}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        fs.writeFileSync(path.join(outDir, chunk), text);
        console.log(`Saved ${chunk} (${text.length} bytes)`);

        // Check for sourcemap
        const mapUrl = `${url}.map`;
        const mapRes = await fetch(mapUrl);
        if (mapRes.ok) {
          const mapText = await mapRes.text();
          fs.writeFileSync(path.join(outDir, `${chunk}.map`), mapText);
          console.log(`Found sourcemap for ${chunk}!`);
        }
      } else {
        console.warn(`Failed ${url}: ${res.status}`);
      }
    } catch (e) {
      console.error(`Error ${chunk}:`, e.message);
    }
  }
}

run();
