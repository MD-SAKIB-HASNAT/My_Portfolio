const fs = require('fs');
const path = require('path');

// This script ensures all necessary files are ready for Vercel deployment
console.log('Running build script for Vercel deployment...');

// Ensure the public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory');
}

// List of directories to ensure they exist in public
const directories = ['css', 'js', 'images', 'documents', 'pages', 'config'];

directories.forEach(dir => {
  const dirPath = path.join(publicDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created ${dir} directory in public`);
  }
});

console.log('Build script completed successfully!');