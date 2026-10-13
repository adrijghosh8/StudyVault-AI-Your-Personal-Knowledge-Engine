/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#090909',
        sidebar: '#101010',
        panel: '#121212',
        elevated: '#191919',
        line: '#292929',
        ink: '#F5F5F5',
        soft: '#929292',
        mute: '#656565',
        accent: '#3478F6',
        ok: '#5FA777',
        warn: '#C9A04A',
        err: '#C9615F',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        indeterminate: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(350%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        indeterminate: 'indeterminate 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
