const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/#/login', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.toLowerCase() === 'admin');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Sign In'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 4000));
  
  const tokenRecord = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.includes('auth-token') || k.includes('sb-') || k === 'token');
    if (key) {
      const val = localStorage.getItem(key);
      try {
        return JSON.parse(val).access_token;
      } catch(e) {
        return val;
      }
    }
  });

  const response = await fetch('http://localhost:5501/api/admin/orders', {
    headers: { 'Authorization': `Bearer ${tokenRecord}` }
  });
  
  const data = await response.json();
  console.log(`Received ${data.orders?.length} orders from Admin API`);
  if (data.orders) {
    const order = data.orders.find(o => o.orderNumber.includes('ORDMNJH') || o.status === 'pending');
    console.log('Found recent order:', order);
  } else {
    console.log(data);
  }

  await browser.close();
})();
