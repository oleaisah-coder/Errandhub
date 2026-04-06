const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('[BROWSER CONSOLE]:', msg.text());
  });

  page.on('pageerror', err => {
    console.log('[BROWSER ERR]:', err.toString());
  });

  console.log('Logging in as Admin...');
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'load' });
  
  await page.evaluate(() => {
    const adminUser = {
      id: 'd7ff3cf3-e22b-4489-8131-08344f285b72',
      email: 'oleaisah@gmail.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    };
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        user: adminUser,
        token: 'mock-token',
        isAuthenticated: true,
        isInitialized: true
      },
      version: 0
    }));
  });

  console.log('Navigating to Admin Dashboard...');
  await page.goto('http://localhost:5173/#/admin-dashboard', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'blank-screen-capture.png' });
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log('HTML length:', html.length);
  
  await browser.close();
})();
