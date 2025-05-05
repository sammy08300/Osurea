const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  publicDir: 'public',
  rootFiles: [
    'index.html',
    '404.html',
    'service-worker.js',
    'manifest.webmanifest'
  ],
  dirsToCopy: ['assets', 'data']
};

// Create directory if it doesn't exist
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Created directory ${dirPath}`);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

// Copy a single file
async function copyFile(src, dest) {
  try {
    await fs.copyFile(src, dest);
    console.log(`- Copied ${src} to ${dest}`);
  } catch (err) {
    console.error(`Error copying file ${src} to ${dest}:`, err);
  }
}

// Copy all root files to public directory
async function copyRootFiles() {
  console.log("Copying root files to public...");
  
  const copyPromises = CONFIG.rootFiles.map(file => {
    return copyFile(file, path.join(CONFIG.publicDir, file));
  });
  
  await Promise.allSettled(copyPromises);
}

// Recursively copy directory
async function copyDir(src, dest) {
  try {
    // Create destination directory
    await ensureDir(dest);
    
    // Read source directory
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    // Process each entry
    const copyPromises = entries.map(async entry => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    });
    
    await Promise.allSettled(copyPromises);
  } catch (err) {
    console.error(`Error copying directory ${src} to ${dest}:`, err);
  }
}

// Main build function
async function build() {
  try {
    // Ensure public directory exists
    await ensureDir(CONFIG.publicDir);
    
    // Copy root files
    await copyRootFiles();
    
    // Copy directories
    for (const dir of CONFIG.dirsToCopy) {
      if (fsSync.existsSync(dir)) {
        console.log(`Copying ${dir} directory...`);
        await copyDir(dir, path.join(CONFIG.publicDir, dir));
      }
    }
    
    console.log('\nBuild completed successfully!');
  } catch (err) {
    console.error('\nBuild failed:', err);
    process.exit(1);
  }
}

// Run the build
build(); 