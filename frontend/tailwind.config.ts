import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#43273f',
        mist: '#fff6fd',
        line: '#f1cce5',
        accent: '#e872b4',
        accentSoft: '#f9cae4',
        lilac: '#cdb7ff',
        butter: '#fff0bf',
        blush: '#fdf2f8',
        plum: '#7f4b75',
      },
      boxShadow: {
        panel: '0 28px 80px rgba(169, 103, 154, 0.18)',
        glow: '0 0 0 1px rgba(255,255,255,0.55), 0 20px 60px rgba(226, 118, 179, 0.24)',
      },
    },
  },
  plugins: [],
} satisfies Config
