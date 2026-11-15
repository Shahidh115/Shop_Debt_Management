import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          primary: '#1B7A4E',
          deep: '#0F4C31',
          soft: '#68B692',
          tint: '#D1ECE0',
          subtle: '#EBF7F1',
        },
        ivory: {
          canvas: '#F4F8F6',
          card: '#FFFFFF',
          elevated: '#E8F1EC',
          muted: '#EEF4F1',
        },
        charcoal: {
          DEFAULT: '#16241D',
          muted: '#5C6F65',
          subtle: '#7D9086',
        },
        border: {
          DEFAULT: '#DCE7E1',
          strong: '#C4D6CD',
        },
        semantic: {
          success: '#16804A',
          successBg: '#E6F5EC',
          warning: '#D99A32',
          warningBg: '#FBF3E2',
          danger: '#C6534B',
          dangerBg: '#FCECEB',
          debit: '#D97736',
          debitBg: '#FDF0E6',
          credit: '#16804A',
          creditBg: '#E6F5EC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 76, 49, 0.05)',
        elevated: '0 8px 24px rgba(15, 76, 49, 0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
