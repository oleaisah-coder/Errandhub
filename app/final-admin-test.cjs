const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 1000 });

  console.log('--- FINAL TEST: BYPASSING AUTH TO VERIFY RENDER ---');

  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERR:', err.toString()));

  // Navigate directly to admin dashboard with bypass
  console.log('Navigating to Admin Dashboard with ?bypass=true...');
  await page.goto('http://localhost:5173/#/admin-dashboard?bypass=true', { waitUntil: 'networkidle0' });
  
  // Wait for React to mount and try to fetch data
  await new Promise(r => setTimeout(r, 8000));

  const html = await page.evaluate(() => document.body.innerHTML);
  const url = await page.url();
  
  console.log('Current URL after load:', url);
  
  if (html.includes('Admin Portal') || html.includes('Dashboard')) {
    console.log('SUCCESS: Admin Dashboard rendered successfully!');
    console.log('Stats found:', html.includes('Total Revenue') || html.includes('Total Orders'));
  } else if (html.includes('Something went wrong')) {
    console.log('FAILURE: Error Boundary triggered.');
  } else if (html.includes('Initializing Dashboard')) {
    console.log('WAITING: Component stuck in loading state.');
  } else {
    console.log('UNKNOWN STATE. HTML snippet:', html.substring(0, 500));
  }

  await page.screenshot({ path: 'final-admin-success.png' });
  console.log('Screenshot saved as final-admin-success.png');

  await browser.close();
})();
