const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const terser = require('terser');
const CleanCSS = require('clean-css');
const htmlMinifier = require('html-minifier');

// Configuration
const CONFIG = {
  publicDir: './',
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
    minifyJS: process.env.NODE_ENV === 'production',
    minifyCSS: process.env.NODE_ENV === 'production',
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

// Minify JavaScript file
async function minifyJS(filePath) {
  if (!CONFIG.optimization.minifyJS) return;
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const result = await terser.minify(content, {
      compress: {
        drop_console: false,
        drop_debugger: true
      },
      mangle: true,
      output: {
        comments: false
      }
    });
    
    if (result.error) throw result.error;
    
    await fs.writeFile(filePath, result.code);
    console.log(`- Minified JS: ${filePath}`);
  } catch (error) {
    console.warn(`Failed to minify JS ${filePath}:`, error);
  }
}

// Minify CSS file
async function minifyCSS(filePath) {
  if (!CONFIG.optimization.minifyCSS) return;
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const result = new CleanCSS({
      level: 2,
      compatibility: '*'
    }).minify(content);
    
    await fs.writeFile(filePath, result.styles);
    console.log(`- Minified CSS: ${filePath}`);
  } catch (error) {
    console.warn(`Failed to minify CSS ${filePath}:`, error);
  }
}

// Optimize HTML files (minification)
async function optimizeHTML(filePath) {
  if (!CONFIG.optimization.minifyHTML) return;
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // HTML minification with htmlMinifier
    content = htmlMinifier.minify(content, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      minifyCSS: true,
      minifyJS: true,
      useShortDoctype: true
    });
    
    await fs.writeFile(filePath, content);
    console.log(`- Optimized HTML: ${filePath}`);
  } catch (error) {
    console.warn(`Failed to optimize HTML ${filePath}:`, error);
  }
}

// Process JS files in a directory
async function processJSFiles(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await processJSFiles(fullPath);
      } else if (entry.name.endsWith('.js')) {
        await minifyJS(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Error processing JS files in ${directory}:`, error);
  }
}

// Process CSS files in a directory
async function processCSSFiles(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await processCSSFiles(fullPath);
      } else if (entry.name.endsWith('.css')) {
        await minifyCSS(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Error processing CSS files in ${directory}:`, error);
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

// Main build function
async function build() {
  const startTime = Date.now();
  const performanceReport = generatePerformanceReport();
  
  try {
    console.log(`Starting build in ${performanceReport.environment} mode...`);
    
    // Ensure public directory exists
    await ensureDir(CONFIG.publicDir);
    
    // Optimize HTML files if in production
    if (CONFIG.optimization.minifyHTML) {
      console.log('Optimizing HTML files...');
      for (const file of CONFIG.rootFiles.filter(f => f.endsWith('.html'))) {
        await optimizeHTML(file);
        performanceReport.files.optimized++;
      }
    }
    
    // Optimize JS files
    if (CONFIG.optimization.minifyJS) {
      console.log('Optimizing JavaScript files...');
      await processJSFiles('assets/js');
    }
    
    // Optimize CSS files
    if (CONFIG.optimization.minifyCSS) {
      console.log('Optimizing CSS files...');
      await processCSSFiles('assets/css');
    }
    
    const buildTime = Date.now() - startTime;
    console.log(`\nBuild completed successfully in ${buildTime}ms!`);
    console.log(`Files optimized: ${performanceReport.files.optimized}`);
    
  } catch (err) {
    console.error('\nBuild failed:', err);
    process.exit(1);
  }
}

// Run the build
build();