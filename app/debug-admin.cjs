const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('pageerror', err => {
    console.log('[FATAL ERROR]:', err.toString());
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[CONSOLE ERROR]:', msg.text());
    }
  });

  console.log('Navigating to Admin Dashboard...');
  // We need to bypass login for this test, so we'll set the user in localStorage
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

  await page.goto('http://localhost:5173/#/admin-dashboard', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 3000));
  
  const content = await page.evaluate(() => document.body.innerHTML);
  console.log('Body Length:', content.length);
  
  await browser.close();
})();
