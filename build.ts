import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface OptimizationConfig {
  minifyHTML: boolean;
  compressAssets: boolean;
  generateSourceMaps: boolean;
}

interface BuildConfig {
  publicDir: string;
  rootFiles: string[];
  dirsToCopy: string[];
  optimization: OptimizationConfig;
}

const CONFIG: BuildConfig = {
  publicDir: 'public',
  rootFiles: [
    'index.html',
    '404.html',
    // 'service-worker.js', // Removed, will be compiled by tsc to public/service-worker.js
    'manifest.webmanifest'
  ],
  dirsToCopy: ['assets', 'data'],
  optimization: {
    minifyHTML: process.env.NODE_ENV === 'production',
    compressAssets: process.env.NODE_ENV === 'production',
    generateSourceMaps: process.env.NODE_ENV !== 'production'
  }
};

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Created directory ${dirPath}`);
  } catch (err: any) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

async function copyFile(src: string, dest: string): Promise<void> {
  try {
    await fs.copyFile(src, dest);
    console.log(`- Copied ${src} to ${dest}`);
  } catch (err) {
    console.error(`Error copying file ${src} to ${dest}:`, err);
  }
}

async function copyRootFiles(): Promise<void> {
  console.log("Copying root files to public...");
  
  const copyPromises = CONFIG.rootFiles.map(file => {
    return copyFile(file, path.join(CONFIG.publicDir, file));
  });
  
  await Promise.allSettled(copyPromises);
}

async function copyDir(src: string, dest: string): Promise<void> {
  try {
    await ensureDir(dest);
    const entries = await fs.readdir(src, { withFileTypes: true });

    const copyPromises = entries.map(async (entry: fsSync.Dirent) => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (src === 'assets' && entry.name === 'js' && entry.isDirectory()) {
        await ensureDir(destPath);
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

async function copyJSFiles(srcDir: string, destDir: string): Promise<void> {
  console.log(`Copying JS files from ${srcDir} to ${destDir}...`);
  try {
    const copyJSFilesRecursive = async (src: string, dest: string): Promise<void> => {
      const entries = await fs.readdir(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          await ensureDir(destPath);
          await copyJSFilesRecursive(srcPath, destPath);
        } else if (entry.name.endsWith('.js') && !srcPath.includes('node_modules')) {
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

async function optimizeHTML(filePath: string): Promise<void> {
  if (!CONFIG.optimization.minifyHTML) return;
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    content = content
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s+>/g, '>')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
    
    await fs.writeFile(filePath, content);
    console.log(`- Optimized HTML: ${filePath}`);
  } catch (error) {
    console.warn(`Failed to optimize HTML ${filePath}:`, error);
  }
}

interface PerformanceReport {
  buildTime: number;
  environment: string;
  optimizations: OptimizationConfig;
  files: {
    copied: number;
    optimized: number;
  };
}

export function generatePerformanceReport(): PerformanceReport {
  const report: PerformanceReport = {
    buildTime: Date.now(), // This will be updated at the end of the build
    environment: process.env.NODE_ENV || 'development',
    optimizations: CONFIG.optimization,
    files: {
      copied: 0,
      optimized: 0
    }
  };
  
  return report;
}

async function removeDir(dirPath: string): Promise<void> {
  try {
    const exists = await fs.access(dirPath).then(() => true).catch(() => false);
    if (!exists) return;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    await Promise.all(entries.map(async (entry: fsSync.Dirent) => {
      const fullPath = path.join(dirPath, entry.name);
      return entry.isDirectory() ? removeDir(fullPath) : fs.unlink(fullPath);
    }));
    
    await fs.rmdir(dirPath);
    console.log(`Removed directory ${dirPath}`);
  } catch (error) {
    console.error(`Error removing directory ${dirPath}:`, error);
  }
}

async function cleanOutputDirectory(): Promise<void> {
  console.log(`Cleaning specific parts of output directory: ${CONFIG.publicDir}`);
  const pathsToRemove = [
    path.join(CONFIG.publicDir, 'assets', 'js'),
    path.join(CONFIG.publicDir, 'assets', 'locales'),
    path.join(CONFIG.publicDir, 'service-worker.js'),
    path.join(CONFIG.publicDir, 'build.js'),
    path.join(CONFIG.publicDir, 'verify-build.js')
    // Add any other specific files/dirs tsc will create at the root of publicDir
  ];
  for (const itemPath of pathsToRemove) {
    if (fsSync.existsSync(itemPath)) { // Check if path exists before removing
      if ((await fs.lstat(itemPath)).isDirectory()) {
        await removeDir(itemPath);
      } else {
        await fs.unlink(itemPath);
        console.log(`Removed file ${itemPath}`);
      }
    }
  }
  console.log('Specific output paths cleaned.');
}

async function compileTypeScript(): Promise<void> {
  console.log('Compiling TypeScript files...');
  try {
    execSync('npx tsc', { stdio: 'inherit' });
    console.log('TypeScript compilation successful.');
    
    const keyFiles: string[] = [
      path.join(CONFIG.publicDir, 'assets', 'js', 'app.js'),
      path.join(CONFIG.publicDir, 'assets', 'js', 'i18n-init.js'), // Assuming this is a key file
      path.join(CONFIG.publicDir, 'service-worker.js'),
      path.join(CONFIG.publicDir, 'assets', 'locales', 'en.js'), // Example locale
      path.join(CONFIG.publicDir, 'assets', 'locales', 'es.js'), // Example locale
      path.join(CONFIG.publicDir, 'assets', 'locales', 'fr.js'), // Example locale
      path.join(CONFIG.publicDir, 'assets', 'locales', 'index.js') // Main locale index
    ];
    
    for (const file of keyFiles) {
      if (!fsSync.existsSync(file)) {
        throw new Error(`Critical file not compiled: ${file}`);
      }
    }
  } catch (error) {
    console.error('TypeScript compilation failed:', error);
    throw new Error('TypeScript compilation failed.');
  }
}

async function build(): Promise<void> {
  const startTime = Date.now();
  const performanceReport = generatePerformanceReport();
  
  try {
    console.log(`Starting build in ${performanceReport.environment} mode...`);
    
    await ensureDir(CONFIG.publicDir);
    await ensureDir(path.join(CONFIG.publicDir, 'assets'));
    
    await cleanOutputDirectory();
    // Ensure directories that tsc will output to are present
    await ensureDir(path.join(CONFIG.publicDir, 'assets', 'js'));
    await ensureDir(path.join(CONFIG.publicDir, 'assets', 'locales'));
    // service-worker.js will be created by tsc in publicDir directly.

    await compileTypeScript(); 
    
    await copyRootFiles();
    performanceReport.files.copied += CONFIG.rootFiles.length;
    
    for (const dir of CONFIG.dirsToCopy) {
      if (fsSync.existsSync(dir)) {
        console.log(`Copying ${dir} directory...`);
        await copyDir(dir, path.join(CONFIG.publicDir, dir));
      }
    }
    
    if (CONFIG.optimization.minifyHTML) {
      console.log('Optimizing HTML files...');
      for (const file of CONFIG.rootFiles.filter(f => f.endsWith('.html'))) {
        await optimizeHTML(path.join(CONFIG.publicDir, file));
        performanceReport.files.optimized++;
      }
    }
    
    const endTime = Date.now();
    performanceReport.buildTime = endTime - startTime; // Update build time
    console.log(`\nBuild completed successfully in ${performanceReport.buildTime}ms!`);
    console.log(`Files copied: ${performanceReport.files.copied}`);
    console.log(`Files optimized: ${performanceReport.files.optimized}`);
    
  } catch (err) {
    console.error('\nBuild failed:', err);
    process.exit(1);
  }
}

build();
