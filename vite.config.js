import legacy from '@vitejs/plugin-legacy';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html' // Assuming index.html will be at the root after restructuring
      }
    }
  },
  // We might need to define `base` later if assets are not found, 
  // but for now, let's stick to the default.
  // base: './', 
});
