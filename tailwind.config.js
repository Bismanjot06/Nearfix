/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — every component reads these, never a raw hex.
        page: 'rgb(var(--color-page) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-muted': 'rgb(var(--color-surface-muted) / <alpha-value>)',
        'surface-raised': 'rgb(var(--color-surface-raised) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--color-ink-muted) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        'line-strong': 'rgb(var(--color-line-strong) / <alpha-value>)',
        navy: {
          DEFAULT: 'rgb(var(--navy-900) / <alpha-value>)',
          50: 'rgb(var(--navy-50) / <alpha-value>)',
          100: 'rgb(var(--navy-100) / <alpha-value>)',
          200: 'rgb(var(--navy-200) / <alpha-value>)',
          300: 'rgb(var(--navy-300) / <alpha-value>)',
          400: 'rgb(var(--navy-400) / <alpha-value>)',
          500: 'rgb(var(--navy-500) / <alpha-value>)',
          600: 'rgb(var(--navy-600) / <alpha-value>)',
          700: 'rgb(var(--navy-700) / <alpha-value>)',
          800: 'rgb(var(--navy-800) / <alpha-value>)',
          900: 'rgb(var(--navy-900) / <alpha-value>)',
          950: 'rgb(var(--navy-950) / <alpha-value>)',
        },
        brand: {
          blue: 'rgb(var(--brand-blue) / <alpha-value>)',
          teal: 'rgb(var(--brand-teal) / <alpha-value>)',
        },
        status: {
          submitted: 'rgb(var(--status-submitted) / <alpha-value>)',
          verified: 'rgb(var(--status-verified) / <alpha-value>)',
          in_progress: 'rgb(var(--status-in-progress) / <alpha-value>)',
          repaired: 'rgb(var(--status-repaired) / <alpha-value>)',
          rejected: 'rgb(var(--status-rejected) / <alpha-value>)',
        },
        priority: {
          low: 'rgb(var(--priority-low) / <alpha-value>)',
          medium: 'rgb(var(--priority-medium) / <alpha-value>)',
          high: 'rgb(var(--priority-high) / <alpha-value>)',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 2px 12px rgba(11,31,58,0.08)',
        'card-hover': '0 4px 20px rgba(11,31,58,0.14)',
      },
    },
  },
  plugins: [],
}
