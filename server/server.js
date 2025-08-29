const fs = require('fs');
const path = require('path');
const url = require('url');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// Handler function for Vercel serverless deployment
module.exports = (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Parse URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Remove query parameters for file serving
  pathname = pathname.split('?')[0];
  
  // Default to index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // For Vercel deployment, we need to adjust the path resolution
  // In development, server.js is in the server directory
  // In production on Vercel, it's at the root of the serverless function
  const rootDir = process.env.VERCEL ? path.join(__dirname) : path.join(__dirname, '..');
  const filePath = path.join(rootDir, pathname);
  const ext = path.parse(filePath).ext;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  fs.exists(filePath, (exists) => {
    if (!exists) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal server error');
        return;
      }
      
      const mimeType = mimeTypes[ext] || 'text/plain';
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(data);
    });
  });
};

// For local development, create a server if not running on Vercel
if (!process.env.VERCEL) {
  const http = require('http');
  const port = process.env.PORT || 5000;
  
  const server = http.createServer(module.exports);
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
}