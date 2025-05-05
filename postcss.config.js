// Configuration pour PostCSS
const isProd = process.env.NODE_ENV === 'production';

const plugins = {
  // Tailwind CSS - Framework utilitaire CSS
  'tailwindcss': {},
  
  // Autoprefixer - Ajoute automatiquement les préfixes des navigateurs (ex: -webkit, -moz)
  'autoprefixer': {},
};

// Ajouter cssnano en production uniquement pour minifier le CSS
if (isProd) {
  plugins.cssnano = { preset: 'default' };
}

module.exports = {
  plugins
}; 