/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sixx: {
          bg: '#0b0c10',
          panel: '#111318',
          sidebar: '#111318',
          border: '#1f2129',
          cyan: '#00d4ff',
          orange: '#ff5a1f',
          purple: '#c026d3',
          green: '#10b981',
          gray: '#9ca3af',
          muted: '#6b7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
