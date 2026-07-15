const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERR:', err));
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' }).catch(e=>console.log(e));
  await browser.close();
})();
