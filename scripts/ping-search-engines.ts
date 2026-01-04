import https from 'https';

const SITEMAP_URL = 'https://www.aipropertywriter.com/sitemap.xml';

const searchEngines = [
  {
    name: 'Google',
    url: `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
  },
  {
    name: 'Bing',
    url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
  }
];

function ping(engine: { name: string; url: string }) {
  return new Promise((resolve, reject) => {
    https.get(engine.url, (res) => {
      if (res.statusCode === 200) {
        resolve(`✅ ${engine.name}: Pinged successfully`);
      } else {
        // Google deprecated this endpoint for some, so it might return 404.
        // We log it but don't fail hard.
        resolve(`⚠️ ${engine.name}: Returned status ${res.statusCode}`);
      }
    }).on('error', (e) => {
      reject(`❌ ${engine.name}: Error - ${e.message}`);
    });
  });
}

async function main() {
  console.log('📡 Pinging search engines with sitemap...');
  
  const results = await Promise.allSettled(searchEngines.map(ping));
  
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      console.log(result.value);
    } else {
      console.error(result.reason);
    }
  });
}

main();
