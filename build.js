const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  publicDir: 'public',
  rootFiles: [
    'index.html',
    '404.html',
    'service-worker.js',
    'manifest.webmanifest'
  ],
  dirsToCopy: ['assets', 'data'],
  // Performance optimization settings
  optimization: {
    minifyHTML: process.env.NODE_ENV === 'production',
    compressAssets: process.env.NODE_ENV === 'production',
    generateSourceMaps: process.env.NODE_ENV !== 'production'
  }
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

      // If we are currently copying the root 'assets' directory, and the entry is 'js', we need to
      // ensure we still copy over JavaScript files that might not be compiled from TypeScript
      if (src === 'assets' && entry.name === 'js' && entry.isDirectory()) {
        // Instead of skipping, we'll copy .js files that aren't compiled from .ts
        await ensureDir(destPath); // Ensure the js directory exists
        await copyJSFiles(srcPath, destPath);
        return;
      }

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

// Copy JS files that aren't compiled from TS
async function copyJSFiles(srcDir, destDir) {
  console.log(`Copying JS files from ${srcDir} to ${destDir}...`);
  try {
    // Recursively find all files
    const copyJSFilesRecursive = async (src, dest) => {
      const entries = await fs.readdir(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          await ensureDir(destPath);
          await copyJSFilesRecursive(srcPath, destPath);
        } else if (entry.name.endsWith('.js') && !srcPath.includes('node_modules')) {
          // Skip if there's a corresponding .ts file (which would be compiled)
          const tsPath = srcPath.replace(/\.js$/, '.ts');
          const tsExists = await fs.access(tsPath).then(() => true).catch(() => false);
          
          if (!tsExists) {
            console.log(`- Copying JS file: ${srcPath} -> ${destPath}`);
            await fs.copyFile(srcPath, destPath);
          }
        }
      }
    };
    
    await copyJSFilesRecursive(srcDir, destDir);
  } catch (err) {
    console.error(`Error copying JS files from ${srcDir} to ${destDir}:`, err);
  }
}

// Optimize HTML files (basic minification)
async function optimizeHTML(filePath) {
  if (!CONFIG.optimization.minifyHTML) return;
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Basic HTML minification
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/>\s+</g, '><') // Remove spaces between tags
      .replace(/\s+>/g, '>') // Remove spaces before closing tags
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .trim();
    
    await fs.writeFile(filePath, content);
    console.log(`- Optimized HTML: ${filePath}`);
  } catch (error) {
    console.warn(`Failed to optimize HTML ${filePath}:`, error);
  }
}

// Generate performance report
function generatePerformanceReport() {
  const report = {
    buildTime: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    optimizations: CONFIG.optimization,
    files: {
      copied: 0,
      optimized: 0
    }
  };
  
  return report;
}

// Recursively delete a directory
async function removeDir(dirPath) {
  try {
    const exists = await fs.access(dirPath).then(() => true).catch(() => false);
    if (!exists) return;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    await Promise.all(entries.map(async entry => {
      const fullPath = path.join(dirPath, entry.name);
      return entry.isDirectory() ? removeDir(fullPath) : fs.unlink(fullPath);
    }));
    
    await fs.rmdir(dirPath);
    console.log(`Removed directory ${dirPath}`);
  } catch (error) {
    console.error(`Error removing directory ${dirPath}:`, error);
  }
}

// Clean output directory
async function cleanOutputDirectory() {
  console.log(`Cleaning output directory: ${CONFIG.publicDir}/assets/js`);
  await removeDir(path.join(CONFIG.publicDir, 'assets', 'js'));
  console.log('Output directory cleaned');
}

// Compile TypeScript files
async function compileTypeScript() {
  console.log('Compiling TypeScript files...');
  try {
    // Execute the TypeScript compiler
    execSync('npx tsc', { stdio: 'inherit' }); // stdio: 'inherit' will show tsc output in the console
    console.log('TypeScript compilation successful.');
    
    // Verify compilation success by checking if key files exist
    const keyFiles = [
      path.join(CONFIG.publicDir, 'assets', 'js', 'app.js'),
      path.join(CONFIG.publicDir, 'assets', 'js', 'i18n-init.js')
    ];
    
    for (const file of keyFiles) {
      if (!fsSync.existsSync(file)) {
        throw new Error(`Critical file not compiled: ${file}`);
      }
    }
  } catch (error) {
    console.error('TypeScript compilation failed:', error);
    // Propagate the error to stop the build process if compilation fails
    throw new Error('TypeScript compilation failed.');
  }
}

// Main build function
async function build() {
  const startTime = Date.now();
  const performanceReport = generatePerformanceReport();
  
  try {
    console.log(`Starting build in ${performanceReport.environment} mode...`);
    
    // Ensure public directory exists
    await ensureDir(CONFIG.publicDir);
    await ensureDir(path.join(CONFIG.publicDir, 'assets')); // Ensure public/assets exists
    
    // Clean output directory before compiling
    await cleanOutputDirectory();
    
    // Recreate js directory
    await ensureDir(path.join(CONFIG.publicDir, 'assets', 'js')); // Ensure public/assets/js exists for tsc output

    // Compile TypeScript (tsc will output directly to public/assets/js as per tsconfig.json)
    await compileTypeScript(); 
    
    // Copy root files
    await copyRootFiles();
    performanceReport.files.copied += CONFIG.rootFiles.length;
    
    // Copy directories (dirsToCopy includes 'assets')
    // The modified copyDir above will skip 'assets/js'
    for (const dir of CONFIG.dirsToCopy) {
      if (fsSync.existsSync(dir)) {
        console.log(`Copying ${dir} directory...`);
        await copyDir(dir, path.join(CONFIG.publicDir, dir));
      }
    }
    
    // Optimize HTML files if in production
    if (CONFIG.optimization.minifyHTML) {
      console.log('Optimizing HTML files...');
      for (const file of CONFIG.rootFiles.filter(f => f.endsWith('.html'))) {
        await optimizeHTML(path.join(CONFIG.publicDir, file));
        performanceReport.files.optimized++;
      }
    }
    
    const buildTime = Date.now() - startTime;
    console.log(`\nBuild completed successfully in ${buildTime}ms!`);
    console.log(`Files copied: ${performanceReport.files.copied}`);
    console.log(`Files optimized: ${performanceReport.files.optimized}`);
    
  } catch (err) {
    console.error('\nBuild failed:', err);
    process.exit(1);
  }
}

// Run the build
build(); 