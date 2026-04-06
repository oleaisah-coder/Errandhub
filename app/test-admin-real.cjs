const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });

  console.log('--- STARTING ADMIN DASHBOARD TEST ---');

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.toString()));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  // 1. Visit login page
  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle0' });

  // 2. Inject Admin Auth State
  console.log('Injecting Admin session...');
  await page.evaluate(() => {
    const adminUser = {
      id: 'admin-123',
      email: 'admin@errandhub.com',
      role: 'admin',
      firstName: 'Test',
      lastName: 'Admin'
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
    // Also set a mock Supabase session if needed by api.ts
    localStorage.setItem('sb-token', 'mock-token'); 
  });

  // 3. Navigate to Admin Dashboard
  console.log('Navigating to Admin Dashboard...');
  await page.goto('http://localhost:5173/#/admin-dashboard', { waitUntil: 'networkidle0' });
  
  // Wait for data hydration
  await new Promise(r => setTimeout(r, 5000));

  // 4. Capture state
  const title = await page.title();
  const url = await page.url();
  const html = await page.evaluate(() => document.body.innerHTML);
  
  console.log('Page Title:', title);
  console.log('Current URL:', url);
  
  if (html.includes('Something went wrong')) {
    console.log('CRITICAL: ErrorBoundary Triggered!');
  } else if (html.length < 500) {
    console.log('CRITICAL: Page is nearly empty (Blank Screen)!');
  } else {
    console.log('HTML Length:', html.length);
    console.log('Dashboard text found:', html.includes('Admin Portal') || html.includes('Dashboard'));
  }

  // 5. Take screenshot
  await page.screenshot({ path: 'admin-dashboard-debug.png' });
  console.log('Screenshot saved as admin-dashboard-debug.png');

  await browser.close();
})();
