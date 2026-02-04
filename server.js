const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT) || 3000;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const safeSuffix = path.normalize(req.url.split('?')[0]).replace(/^\/(?!$)/, '');
  if (safeSuffix.includes('..')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }
  const requestedPath = safeSuffix === '' ? 'index.html' : safeSuffix;
  const filePath = path.join(__dirname, requestedPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (requestedPath !== 'index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (fallbackErr, fallbackData) => {
          if (fallbackErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(fallbackData);
        });
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
