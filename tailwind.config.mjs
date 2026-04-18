import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        lift: '0 4px 8px rgba(0,0,0,0.04), 0 16px 40px -8px rgba(0,0,0,0.08)',
        glow: '0 0 0 1px rgba(185,28,28,0.2), 0 8px 24px -8px rgba(185,28,28,0.3)',
      },
      animation: {
        'aurora-slow': 'aurora 20s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        aurora: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.5' },
          '50%': { transform: 'translate(-3%, 2%) scale(1.05)', opacity: '0.7' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.ink.700'),
            '--tw-prose-headings': theme('colors.ink.900'),
            '--tw-prose-links': theme('colors.accent.700'),
            '--tw-prose-bold': theme('colors.ink.900'),
            '--tw-prose-quotes': theme('colors.ink.800'),
            '--tw-prose-quote-borders': theme('colors.accent.300'),
            '--tw-prose-code': theme('colors.ink.900'),
            '--tw-prose-invert-body': theme('colors.ink.300'),
            '--tw-prose-invert-headings': theme('colors.ink.50'),
            '--tw-prose-invert-links': theme('colors.accent.400'),
            '--tw-prose-invert-bold': theme('colors.ink.50'),
            '--tw-prose-invert-quotes': theme('colors.ink.200'),
            '--tw-prose-invert-quote-borders': theme('colors.accent.700'),
            '--tw-prose-invert-code': theme('colors.ink.50'),
            maxWidth: 'none',
            fontSize: '1.0625rem',
            lineHeight: '1.75',
            h1: { fontFamily: theme('fontFamily.serif').join(','), fontWeight: '600', letterSpacing: '-0.02em' },
            h2: { fontFamily: theme('fontFamily.serif').join(','), fontWeight: '600', letterSpacing: '-0.015em', marginTop: '2.5em' },
            h3: { fontFamily: theme('fontFamily.serif').join(','), fontWeight: '600' },
          },
        },
      }),
    },
  },
  plugins: [typography],
};
