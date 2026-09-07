/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        sans: ['var(--font-body)', 'Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        script: ['var(--font-script)', 'Caveat', 'cursive'],
      },
      colors: {
        primary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#854d0e',
          900: '#713f12',
        },
        brand: {
          bg: '#FAF8F5',
          surface: '#ffffff',
          elevated: '#ffffff',
          amber: '#f59e0b',
          gold: '#fbbf24',
          yellow: '#facc15',
          'yellow-hover': '#d97706',
          'yellow-light': '#fef9c3',
          navy: '#1e293b',
          slate: '#475569',
          muted: '#64748b',
          green: '#10b981',
          script: '#d97706',
          border: '#f3efe6',
          'border-amber': '#fef3c7',
        },
      },
      boxShadow: {
        'amber-glow': '0 4px 14px rgba(245, 158, 11, 0.35)',
        'warm-card': '0 10px 25px -5px rgba(245, 158, 11, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
