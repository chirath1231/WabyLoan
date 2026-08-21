import type { Config } from 'tailwindcss';

// Design tokens lifted from the validated prototype's CSS custom properties
// (waby-loan (3).html :root block) — the "passbook ledger" teal/gold/violet/amber palette.
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: { 900: '#0A2E2A', 700: '#134E48' },
        teal: { 900: '#00352F', 800: '#00453D', 700: '#00695C', 600: '#0C8577', 100: '#DCEFEC', 50: '#F2F8F7' },
        paper: '#F7F9F8',
        card: '#FFFFFF',
        gold: { 700: '#8A6D1D', 600: '#B4922D', 100: '#FBF3DD' },
        danger: { DEFAULT: '#B3261E', 100: '#FBEAE9' },
        amber: { 700: '#9A5B13', 100: '#FDF0DF' },
        violet: { 700: '#5B3B9E', 100: '#EFE9FB' },
        line: '#E4E9E7',
        text: { 900: '#132420', 600: '#4B615C', 400: '#7E938D' },
      },
      fontFamily: {
        display: ['var(--font-sora)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      borderRadius: {
        xl2: '14px',
      },
    },
  },
  plugins: [],
} satisfies Config;
