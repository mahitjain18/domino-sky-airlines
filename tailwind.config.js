/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040711',
          900: '#060B19',
          850: '#0A1226',
          800: '#0E1A36',
          750: '#13234A',
          700: '#1A3065',
          600: '#25458F',
        },
        atc: {
          bg: '#050B14',
          secondary: '#0A1422',
          panel: '#101D2D',
          border: '#1E3048',
          cyan: '#00D9FF',
          blue: '#247BFF',
          green: '#22D3A6',
          amber: '#FFB547',
          red: '#FF5364',
          text: '#EAF4FF',
          muted: '#8498AD'
        },
        electric: {
          cyan: '#00D9FF',
          blue: '#247BFF',
          emerald: '#22D3A6',
          amber: '#FFB547',
          rose: '#FF5364',
          purple: '#7928CA',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 25px -3px rgba(0, 240, 255, 0.35)',
        'neon-blue': '0 0 25px -3px rgba(0, 112, 243, 0.35)',
        'neon-emerald': '0 0 25px -3px rgba(0, 255, 135, 0.35)',
        'neon-purple': '0 0 25px -3px rgba(121, 40, 202, 0.35)',
        'neon-amber': '0 0 25px -3px rgba(255, 184, 0, 0.35)',
        'neon-rose': '0 0 25px -3px rgba(255, 0, 85, 0.35)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
