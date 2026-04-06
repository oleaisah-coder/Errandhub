const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/#/admin-dashboard', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.evaluate(() => document.body.innerHTML);
  console.log(content.slice(0, 1000)); // Log first 1000 chars of body
  
  await browser.close();
})();
