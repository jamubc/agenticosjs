const express = require('express');
const request = require('request');
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/proxy/*', (req, res) => {
  const targetUrl = req.url.replace('/proxy/', '');
  request(targetUrl).pipe(res);
});

app.listen(3000, () => {
  console.log('Proxy server running on http://localhost:3000');
});