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
  await page.goto('http://localhost:5173/#/admin-dashboard', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 5000));
  
  const content = await page.evaluate(() => document.body.innerHTML);
  if (content.includes('Something went wrong')) {
    console.log('--- ERROR BOUNDARY TRIGGERED ---');
    console.log(content.substring(content.indexOf('Something went wrong'), content.indexOf('Something went wrong') + 300));
  } else if (content.includes('Admin Portal')) {
    console.log('--- SUCCESS: Admin Portal rendered ---');
  } else {
    console.log('--- Still Blank or Unknown ---');
    console.log('HTML Length:', content.length);
  }

  await browser.close();
})();
