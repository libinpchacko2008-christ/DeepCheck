/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          50: '#f6f7f8',
          100: '#eceff1',
          200: '#cfd8dc',
          300: '#90a4ae',
          400: '#607d8b',
          500: '#455a64',
          600: '#37474f',
          700: '#263238',
          800: '#1e252b',
          900: '#14181c',
          950: '#0c0e11',
        },
      },
    },
  },
  plugins: [],
}
