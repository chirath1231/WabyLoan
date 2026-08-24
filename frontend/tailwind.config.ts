import type { Config } from 'tailwindcss';

// Design tokens lifted from the validated prototype's CSS custom properties
// (waby-loan (3).html :root block) — the "passbook ledger" teal/gold/violet/amber palette.
// Each token resolves to a CSS variable (defined for light/dark in globals.css) so every
// existing className adapts to the active theme without per-component changes.
function themeColor(varName: string) {
  return `rgb(var(${varName}) / <alpha-value>)`;
}

export default {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: { 900: themeColor('--color-ink-900'), 700: themeColor('--color-ink-700') },
        teal: {
          900: themeColor('--color-teal-900'),
          800: themeColor('--color-teal-800'),
          700: themeColor('--color-teal-700'),
          600: themeColor('--color-teal-600'),
          100: themeColor('--color-teal-100'),
          50: themeColor('--color-teal-50'),
        },
        paper: themeColor('--color-paper'),
        card: themeColor('--color-card'),
        gold: { 700: themeColor('--color-gold-700'), 600: themeColor('--color-gold-600'), 100: themeColor('--color-gold-100') },
        danger: { DEFAULT: themeColor('--color-danger'), 100: themeColor('--color-danger-100') },
        amber: { 700: themeColor('--color-amber-700'), 100: themeColor('--color-amber-100') },
        violet: { 700: themeColor('--color-violet-700'), 100: themeColor('--color-violet-100') },
        line: themeColor('--color-line'),
        text: { 900: themeColor('--color-text-900'), 600: themeColor('--color-text-600'), 400: themeColor('--color-text-400') },
      },
      fontFamily: {
        display: ['var(--font-inter)', 'sans-serif'],
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
