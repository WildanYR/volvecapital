const fs = require('fs');
const https = require('https');

const sessionFilePath = 'E:\\\\latihan coding\\\\1volvecapital\\\\volvecapital\\\\apps\\\\bot2\\\\session_data\\\\netflix_jowo7743_gmail_com.json';
const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));

let cookieString = sessionData.cookies.map(c => c.name + '=' + c.value).join('; ');

const options = {
  hostname: 'www.netflix.com',
  path: '/YourAccount',
  method: 'GET',
  headers: {
    'Cookie': cookieString,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const matches = data.match(/"nftoken":"([^"]+)"/g);
    if (matches) {
      console.log('Found nftokens:', matches);
    } else {
      console.log('No nftoken found in /YourAccount HTML.');
    }
  });
});

req.on('error', error => console.error(error));
req.end();
