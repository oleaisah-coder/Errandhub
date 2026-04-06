const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('pageerror', err => {
    console.log('[React Page Error]:', err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[Console Error]:', msg.text());
  });

  await page.goto('http://localhost:5173/#/admin-dashboard', { waitUntil: 'load' });
  
  // Wait a bit for React to render
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
