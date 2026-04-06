const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  console.log('Logging in as Admin...');
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.toLowerCase() === 'admin');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Sign In'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 5000));
  
  const stats = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div.grid-cols-2 > div'));
    return cards.map(c => ({
      label: c.querySelector('p.text-xs')?.textContent,
      value: c.querySelector('p.text-2xl')?.textContent
    }));
  });

  console.log('Dashboard Stats:', JSON.stringify(stats, null, 2));
  
  await browser.close();
})();
