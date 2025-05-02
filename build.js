const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// List of all files to copy to public
const filesToCopy = [
  'index.html',
  '404.html',
  'service-worker.js',
  'manifest.webmanifest'
];

// Copy each file to public
filesToCopy.forEach(file => {
  fs.copyFileSync(file, path.join('public', file));
});

// Create directories in public if they don't exist
const directories = ['assets'];
directories.forEach(dir => {
  if (!fs.existsSync(path.join('public', dir))) {
    fs.mkdirSync(path.join('public', dir), { recursive: true });
  }
});

// Copy assets recursively
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy assets directory to public
copyDir('assets', path.join('public', 'assets'));

// Copy data directory if it exists
if (fs.existsSync('data')) {
  copyDir('data', path.join('public', 'data'));
}

console.log('Build completed successfully!'); 