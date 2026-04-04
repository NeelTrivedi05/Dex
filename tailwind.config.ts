import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', '-apple-system',
               'BlinkMacSystemFont', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        'bg-primary':     '#FFFFFF',
        'bg-surface':     '#F5F5F7',
        'bg-elevated':    '#FAFAFA',
        'text-primary':   '#1D1D1F',
        'text-secondary': '#6E6E73',
        'text-tertiary':  '#AEAEB2',
        'accent-blue':    '#007AFF',
        'accent-green':   '#34C759',
        'accent-orange':  '#FF9F0A',
        'accent-red':     '#FF3B30',
        'accent-purple':  '#AF52DE',
        'border-subtle':  'rgba(0,0,0,0.08)',
        'border-default': 'rgba(0,0,0,0.12)',
      },
      borderRadius: {
        sm: '6px', md: '10px', lg: '14px', xl: '20px',
      },
      boxShadow: {
        card:     '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        elevated: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        modal:    '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
      },
      fontSize: {
        '2xs':     ['11px', { lineHeight: '1.4' }],
        'xs':      ['12px', { lineHeight: '1.5' }],
        'sm':      ['13px', { lineHeight: '1.5' }],
        'base':    ['15px', { lineHeight: '1.6' }],
        'lg':      ['17px', { lineHeight: '1.5' }],
        'xl':      ['20px', { lineHeight: '1.4' }],
        '2xl':     ['24px', { lineHeight: '1.3' }],
        '3xl':     ['32px', { lineHeight: '1.2' }],
        'display': ['48px', { lineHeight: '1.1' }],
      },
    },
  },
  plugins: [],
} satisfies Config;
