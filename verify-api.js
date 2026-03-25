const http = require('http');
http.get('http://localhost:3000/api/services', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const services = JSON.parse(data);
    services.forEach((s) => {
      console.log('ID ' + s.id + ' [' + s.title + ']:');
      console.log('  ' + s.description);
      console.log();
    });
  });
}).on('error', (e) => console.error(e));
