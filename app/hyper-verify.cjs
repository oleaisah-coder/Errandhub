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

  console.log('Logging in...');
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
  // Force a wait to see if any Error Boundary triggers
  await page.goto('http://localhost:5173/#/admin-dashboard', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 5000));
  
  const body = await page.evaluate(() => document.body.innerHTML);
  console.log('HTML length:', body.length);
  
  if (body.includes('Something went wrong')) {
    console.log('--- ERROR BOUNDARY TRIGGERED ---');
    console.log(body.substring(body.indexOf('Something went wrong'), body.indexOf('Something went wrong') + 200));
  } else if (body.includes('Admin Portal') || body.includes('Initializing Dashboard')) {
    console.log('--- DASHBOARD DETECTED (SUCCESS or INITIALIZING) ---');
  } else {
    console.log('--- STILL BLANK or UNKNOWN STATE ---');
  }
  
  await browser.close();
})();
