/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dae6ff',
          200: '#bcd1ff',
          300: '#90b3ff',
          400: '#6390ff',
          500: '#3b6dff',
          600: '#2c54f0',
          700: '#2440c4',
          800: '#1f389d',
          900: '#1c317c',
        },
        ink: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
        },
        line: '#e5e7eb',
        canvas: '#f6f8fb',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 0 rgba(15,23,42,0.02)',
        pop: '0 12px 32px -12px rgba(15, 23, 42, 0.18)',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
      },
    },
  },
  plugins: [],
};
