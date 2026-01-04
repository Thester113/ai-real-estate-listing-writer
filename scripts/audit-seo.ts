import https from 'https';

const BASE_URL = 'https://www.aipropertywriter.com';

const pagesToCheck = [
  '/',
  '/pricing',
  '/blog',
];

function checkPage(path: string): Promise<string> {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${path}`;
    const req = https.get(url, (res) => {
      let issues = [];
      const headers = res.headers;

      // 1. Check Status Code
      if (res.statusCode !== 200) {
        issues.push(`❌ Status Code: ${res.statusCode} (Expected 200)`);
      }

      // 2. Check X-Robots-Tag Header (Critical!)
      const xRobots = headers['x-robots-tag'];
      if (xRobots && (xRobots.includes('noindex') || xRobots.includes('none'))) {
        issues.push(`❌ BLOCKED by Header: x-robots-tag: ${xRobots}`);
      }

      // 3. Check for Content-Type
      if (!headers['content-type']?.includes('text/html')) {
        issues.push(`⚠️ Content-Type: ${headers['content-type']} (Might not be treated as a page)`);
      }

      // Analyze Body for meta tags
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        // 4. Check Meta Robots (in HTML)
        if (body.match(/<meta\s+name=[\"']robots[\"']\s+content=[\"'][^"']*noindex[^"']*["']/i)) {
          issues.push(`❌ BLOCKED by Meta Tag: <meta name="robots" content="noindex"> found`);
        }

        // 5. Check Canonical
        const canonicalMatch = body.match(/<link\s+rel=[\"']canonical[\"']\s+href=[\"']([^"']+)["']/i);
        if (canonicalMatch) {
          const canonicalUrl = canonicalMatch[1];
          if (canonicalUrl !== url && canonicalUrl !== url + '/') {
            // It's okay if it points to the non-www or www version consistently, but worth noting
            // issues.push(`⚠️ Canonical Mismatch: Points to ${canonicalUrl}`);
          }
        } else {
          issues.push(`⚠️ Missing Canonical Tag`);
        }

        if (issues.length === 0) {
          resolve(`✅ ${path}: OK`);
        } else {
          resolve(`⚠️ ${path} Issues:\n   ${issues.join('\n   ')}`);
        }
      });
    });

    req.on('error', (e) => {
      resolve(`❌ ${path}: Connection Error - ${e.message}`);
    });
  });
}

async function main() {
  console.log(`🔍 Auditing SEO for ${BASE_URL}...
`);
  
  for (const page of pagesToCheck) {
    console.log(await checkPage(page));
  }
}

main();
