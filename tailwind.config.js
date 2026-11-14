export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Dark "charcoal + white" theme. Token names kept from the light spec
        // so every component switches with this one block.
        obsidian: '#0A0A0B', // deepest: text on champagne, overlays
        ink: '#F4F2ED', // primary text (warm white)
        slate: '#B3B3BB', // secondary text
        mist: '#8B8B94', // tertiary text
        ivory: '#121214', // page background
        parchment: '#1B1B1F', // cards and surfaces
        sand: '#2E2E35', // borders and subtle fills
        champagne: { DEFAULT: '#C6A55C', light: '#E8D5A8' },
        sage: '#9CB88C',
        terracotta: '#E09A7C',
        bordeaux: '#E28A96',
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
        card: '0 1px 2px rgba(0,0,0,0.5), 0 12px 32px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
};
