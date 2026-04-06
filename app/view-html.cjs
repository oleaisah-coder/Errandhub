const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

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
  await page.goto('http://localhost:5173/#/admin-dashboard', { waitUntil: 'networkidle0' });
  
  const bodyHandle = await page.$('body');
  const html = await page.evaluate(body => body.innerHTML, bodyHandle);
  console.log('--- Body Start ---');
  console.log(html.substring(0, 500));
  console.log('--- Body End ---');
  
  await browser.close();
})();
