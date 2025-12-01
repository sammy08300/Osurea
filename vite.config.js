import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  json: {
    stringify: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Split locales into separate chunk (lazy loaded)
          locales: ['./src/modules/i18n.js'],
        },
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 50,
  },
  // Optimize CSS
  css: {
    devSourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [],
  },
  // Enable esbuild optimizations
  esbuild: {
    legalComments: 'none',
    treeShaking: true,
  },
});
