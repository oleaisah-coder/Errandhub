const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  console.log('Logging in as User...');
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const userBtn = buttons.find(b => b.textContent && b.textContent.toLowerCase() === 'user');
    if (userBtn) userBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const signInBtn = buttons.find(b => b.textContent && b.textContent.includes('Sign In'));
    if (signInBtn) signInBtn.click();
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
  
  if (!tokenRecord) {
    console.log("No token found!");
    return browser.close();
  }

  console.log('Making POST request to backend...');
  const orderData = {
    errandType: "grocery",
    items: [{ name: "Milk", quantity: 1, estimatedPrice: 2000 }],
    pickupAddress: "", pickupCity: "", pickupState: "",
    deliveryAddress: "Test", deliveryCity: "Test", deliveryState: "Test",
    itemFee: 2000, deliveryFee: 500, serviceFee: 200, totalAmount: 2700, notes: "", isEmergency: false
  };

  const response = await fetch('http://localhost:5501/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenRecord}` },
    body: JSON.stringify(orderData)
  });
  
  const responseData = await response.json();
  console.log(`Backend Create Order Response: ${response.status}`, responseData);

  await browser.close();
})();
