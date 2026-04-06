const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[Console Error]:', msg.text());
  });

  await page.goto('http://localhost:5173/#/login', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const userBtn = buttons.find(b => b.textContent && b.textContent.toLowerCase() === 'user');
    if (userBtn) userBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const signInBtn = buttons.find(b => b.textContent && b.textContent.includes('Sign In'));
    if (signInBtn) signInBtn.click();
  });

  await new Promise(r => setTimeout(r, 4000));
  
  await page.goto('http://localhost:5173/#/request-errand', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2000));

  // Click continue to skip to details
  console.log('Skipping to step 2...');
  
  await page.evaluate(() => {
    // Fill out items
    const inputs = document.querySelectorAll('input');
    if (inputs.length >= 2) {
      inputs[0].value = 'Puppeteer test item';
      inputs[1].value = '1500';
      const event = new Event('input', { bubbles: true });
      inputs[0].dispatchEvent(event);
      inputs[1].dispatchEvent(event);
    }
  });

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const requestBtn = buttons.find(b => b.textContent && b.textContent.includes('Request Errand'));
    if (requestBtn && !requestBtn.disabled) requestBtn.click();
  });

  await new Promise(r => setTimeout(r, 5000));
  console.log('Final URL:', page.url());
  
  await browser.close();
})();
