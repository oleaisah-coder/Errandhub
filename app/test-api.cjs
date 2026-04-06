const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5501,
  path: '/api/orders',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer DUMMY_TOKEN'
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(`STATUS: ${res.statusCode} | MESSAGE: ${data}`));
});

req.on('error', error => console.error(error));
req.end();
