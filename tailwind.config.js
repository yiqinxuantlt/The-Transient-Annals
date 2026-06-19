/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', 'STSong', 'serif'],
        sans: ['"Noto Sans SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        calligraphy: ['"Ma Shan Zheng"', '"LiSu"', 'STLiti', 'cursive'],
      },
      colors: {
        paper: {
          50: 'rgb(var(--paper-50) / <alpha-value>)',
          100: 'rgb(var(--paper-100) / <alpha-value>)',
          200: 'rgb(var(--paper-200) / <alpha-value>)',
          300: 'rgb(var(--paper-300) / <alpha-value>)',
        },
        ink: {
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
        },
        cinnabar: 'rgb(var(--cinnabar) / <alpha-value>)',
        jade: 'rgb(var(--jade) / <alpha-value>)',
        goldline: 'rgb(var(--goldline) / <alpha-value>)',
      },
      boxShadow: {
        archive: '0 18px 60px rgb(var(--shadow-archive) / 0.18)',
        soft: '0 10px 30px rgb(var(--shadow-soft) / 0.12)',
      },
    },
  },
  plugins: [],
}
