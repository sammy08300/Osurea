/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './**/*.html',
    './assets/**/*.js'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'osu-blue': '#4287f5',
        'osu-pink': '#FF66AA',
        'gray-850': '#1e2130',
        'gray-750': '#283043',
      },
      animation: {
        'pulse-fade': 'pulse-fade 2.5s ease-out',
      },
      keyframes: {
        'pulse-fade': {
          '0%, 100%': { opacity: 0 },
          '10%, 80%': { opacity: 1 },
        },
      }
    }
  },
  plugins: [],
} 