const urls = [
  'https://app.fillform.info/',
  'https://app.fillform.info/authentication/register',
  'https://app.fillform.info/credit',
  'https://app.fillform.info/dashboard',
  'https://app.fillform.info/order',
  'https://app.fillform.info/orders',
  'https://app.fillform.info/create-form',
  'https://app.fillform.info/create-form/ratio',
  'https://app.fillform.info/create-form/data',
  'https://app.fillform.info/create-form/model',
  'https://app.fillform.info/create-form/agent',
  'https://app.fillform.info/data-builder',
  'https://app.fillform.info/data-encode',
  'https://app.fillform.info/settings'
];

async function check() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      const location = res.headers.get('location');
      console.log(`${url} -> status: ${res.status}${location ? ' redirect to ' + location : ''}`);
    } catch (e) {
      console.log(`${url} -> error: ${e.message}`);
    }
  }
}

check();
