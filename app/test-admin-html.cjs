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

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const adminBtn = buttons.find(b => b.textContent && b.textContent.toLowerCase() === 'admin');
    if (adminBtn) adminBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const signInBtn = buttons.find(b => b.textContent && b.textContent.includes('Sign In'));
    if (signInBtn) signInBtn.click();
  });

  await new Promise(r => setTimeout(r, 5000));
  
  const content = await page.evaluate(() => document.body.innerHTML);
  console.log('HTML Length:', content.length);
  console.log(content.slice(0, 500)); 
  
  await browser.close();
})();
