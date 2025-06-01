// PostCSS configuration
const isProd = process.env.NODE_ENV === 'production';

const plugins = {
  // Tailwind CSS - Utility-first CSS framework
  'tailwindcss': {},
  
  // Autoprefixer - Automatically adds browser prefixes (e.g., -webkit, -moz)
  'autoprefixer': {},
};

// Add cssnano in production only to minify CSS
if (isProd) {
  plugins.cssnano = { preset: 'default' };
}

module.exports = {
  plugins
};