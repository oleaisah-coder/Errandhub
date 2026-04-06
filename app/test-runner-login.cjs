const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('[BROWSER CONSOLE]:', msg.text());
  });

  console.log('Attempting Runner Login...');
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'load' });
  
  await page.type('#email', 'runner@errandhub.com');
  await page.type('#password', 'runner123');
  
  await page.click('button[type="submit"]');
  
  // Wait for potential redirect or toast
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Current URL:', page.url());
  
  const content = await page.evaluate(() => document.body.innerHTML);
  if (content.includes('Welcome back')) {
    console.log('Success toast detected!');
  } else if (content.includes('Invalid email or password')) {
    console.log('Error toast detected: Invalid credentials');
  } else {
    console.log('No specific status text found.');
  }

  await browser.close();
})();
