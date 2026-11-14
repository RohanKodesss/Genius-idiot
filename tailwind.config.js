export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Donezo" palette: white cards on a light gray canvas, deep forest
        // green accent. Token names stay stable so every component follows.
        obsidian: '#124C36', // deepest: dark cards, active nav, logo
        ink: '#161A17', // primary text
        slate: '#5E6661', // secondary text
        mist: '#8D948F', // tertiary text
        ivory: '#F4F5F2', // page canvas
        parchment: '#FFFFFF', // cards, sidebar, header
        sand: '#E6E7E3', // borders and subtle fills
        champagne: { DEFAULT: '#1F6A4C', light: '#2A7C5B' },
        sage: '#3E7D5B',
        terracotta: '#C06A34',
        bordeaux: '#A83A3A',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,76,54,0.04), 0 14px 34px -22px rgba(18,76,54,0.20)',
      },
    },
  },
  plugins: [],
};
