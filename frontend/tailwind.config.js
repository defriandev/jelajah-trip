/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          obsidian: '#08261E',
          'obsidian-dark': '#041510',
          forest: '#0D3B2E',
          emerald: '#104E3E',
          gold: '#C5A059',
          'gold-light': '#E8C98B',
          'gold-dark': '#9A7532',
          sand: '#F4F0E8',
          canvas: '#FCFCFA',
          surface: '#FFFFFF',
          charcoal: '#111827',
          slate: '#64748B',
          'slate-light': '#94A3B8',
          border: '#EAE7DF',
        },
        editorial: {
          bg: '#FCFCFA',
          surface: '#FFFFFF',
          border: '#EAE7DF',
          charcoal: '#111827',
          olive: '#64748B',
          emerald: '#08261E',
          'emerald-dark': '#041510',
          terracotta: '#C5A059',
          sand: '#F4F0E8',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
