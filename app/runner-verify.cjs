const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('[BROWSER CONSOLE]:', msg.text());
  });

  console.log('Logging in as Runner...');
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'load' });
  
  await page.evaluate(() => {
    const runnerUser = {
      id: 'runner-mock-id',
      email: 'runner@errandhub.com',
      role: 'runner',
      firstName: 'Runner',
      lastName: 'User'
    };
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        user: runnerUser,
        token: 'mock-token',
        isAuthenticated: true,
        isInitialized: true
      },
      version: 0
    }));
  });

  console.log('Navigating to Runner Dashboard...');
  await page.goto('http://localhost:5173/#/runner-dashboard', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => document.body.innerHTML);
  const isDashboardMounted = content.includes('Runner Portal') || content.includes('Syncing Runner Portal');
  console.log('Runner Portal detected:', isDashboardMounted);
  
  await page.screenshot({ path: "runner-dashboard-screenshot.png" }); await browser.close();
  if (!isDashboardMounted) process.exit(1);
})();
