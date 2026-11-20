/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        editorial: {
          bg: '#FAF9F6',
          surface: '#FFFFFF',
          border: '#E6E4DD',
          charcoal: '#14211D',
          olive: '#4A5550',
          emerald: '#0F4C3A',
          'emerald-dark': '#0A3629',
          terracotta: '#D97736',
          sand: '#F4F2EC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
