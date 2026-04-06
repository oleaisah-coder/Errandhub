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
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 1000));

  console.log('Clicking demo admin...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const adminBtn = buttons.find(b => b.textContent && b.textContent.toLowerCase() === 'admin');
    if (adminBtn) adminBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));

  console.log('Clicking sign in...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const signInBtn = buttons.find(b => b.textContent && b.textContent.includes('Sign In'));
    if (signInBtn) signInBtn.click();
  });

  console.log('Waiting for network/redirect...');
  await new Promise(r => setTimeout(r, 4000));
  
  const url = page.url();
  console.log('Final URL:', url);
  
  await browser.close();
})();
