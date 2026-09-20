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
          400: '#fff352',
          500: '#fff352',
          600: '#fee833',
          700: '#f5d800',
          800: '#d4b800',
          900: '#8a7800',
        },
        brand: {
          bg: '#FAF8F5',
          surface: '#ffffff',
          elevated: '#ffffff',
          amber: '#f5d800',
          gold: '#fee833',
          yellow: '#fff352',
          'yellow-hover': '#fee833',
          'yellow-light': '#fffde0',
          navy: '#1e293b',
          slate: '#475569',
          muted: '#64748b',
          green: '#10b981',
          script: '#d4b800',
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
