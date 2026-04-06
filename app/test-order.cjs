const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Submitting order...')) {
      console.log('[Browser Console]:', msg.text());
    }
  });

  console.log('Logging in as User...');
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

  // Wait for redirect to dashboard
  await new Promise(r => setTimeout(r, 4000));
  
  console.log('Navigating to Request Errand...');
  await page.goto('http://localhost:5173/#/request-errand', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));

  // We don't have to fill the form because `api.ts` allows us to just make a network request!
  // It's easier: just grab the token from localStorage and fetch directly in node!
  const token = await page.evaluate(() => localStorage.getItem('supabase.auth.token') || localStorage.getItem('token') || Object.values(localStorage).find(v => v.includes('access_token')));
  console.log('Token snippet:', token ? token.slice(0, 30) : 'none');

  await browser.close();
})();
