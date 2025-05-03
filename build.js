const fs = require('fs');
const path = require('path');

try {
  // Create public directory if it doesn't exist
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
    console.log("Created public directory.");
  }

  // List of all files to copy to public
  const filesToCopy = [
    'index.html',
    '404.html',
    'service-worker.js',
    'manifest.webmanifest'
  ];

  // Copy each file to public
  console.log("Copying root files to public...");
  filesToCopy.forEach(file => {
    try {
      fs.copyFileSync(file, path.join('public', file));
      console.log(`- Copied ${file}`);
    } catch (err) {
      console.error(`Error copying file ${file}:`, err);
    }
  });

  // Create directories in public if they don't exist
  const directories = ['assets'];
  directories.forEach(dir => {
    const publicDirPath = path.join('public', dir);
    if (!fs.existsSync(publicDirPath)) {
      try {
        fs.mkdirSync(publicDirPath, { recursive: true });
        console.log(`Created directory ${publicDirPath}`);
      } catch (err) {
        console.error(`Error creating directory ${publicDirPath}:`, err);
      }
    }
  });

  // Copy assets recursively
  function copyDir(src, dest) {
    try {
      fs.mkdirSync(dest, { recursive: true });
    } catch (err) {
      // Ignore error if directory already exists, otherwise log
      if (err.code !== 'EEXIST') {
        console.error(`Error creating directory ${dest}:`, err);
        return; // Stop copying this directory if creation failed
      }
    }
    
    let entries;
    try {
        entries = fs.readdirSync(src, { withFileTypes: true });
    } catch (err) {
        console.error(`Error reading directory ${src}:`, err);
        return; // Stop processing this directory
    }


    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      try {
        if (entry.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      } catch (err) {
        console.error(`Error copying ${entry.isDirectory() ? 'directory' : 'file'} from ${srcPath} to ${destPath}:`, err);
      }
    }
  }

  // Copy assets directory to public
  console.log("Copying assets directory...");
  copyDir('assets', path.join('public', 'assets'));

  // Copy data directory if it exists
  if (fs.existsSync('data')) {
    console.log("Copying data directory...");
    copyDir('data', path.join('public', 'data'));
  }

  console.log('\nBuild completed successfully!');

} catch (err) {
  console.error('\nBuild failed:', err);
  process.exit(1); // Exit with error code
} 