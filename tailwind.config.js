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
        'primary': '#6fdd8b',
        'secondary': '#ff66ab',
        'dark-blue': '#1a1f35',
        'darker-blue': '#151929',
        'light-blue': '#242b45',
        'accent-blue': '#2a325c',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(111, 221, 139, 0.15)',
        'glow-secondary': '0 0 20px rgba(255, 102, 171, 0.15)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    }
  },
  plugins: [],
}