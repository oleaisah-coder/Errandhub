const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('[BROWSER CONSOLE]:', msg.text());
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
  // Wait longer to allow for hydration and data fetch
  await page.goto('http://localhost:5173/#/admin-dashboard', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => document.body.innerHTML);
  const isDashboardMounted = content.includes('Admin Portal');
  console.log('Dashboard text found:', isDashboardMounted);
  console.log('HTML length:', content.length);
  
  await browser.close();
  if (!isDashboardMounted) process.exit(1);
})();
