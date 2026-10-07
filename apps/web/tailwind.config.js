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
          400: '#FFEE45',
          500: '#FFEE45',
          600: '#FDD835',
          700: '#F5DE25',
          800: '#d4b800',
          900: '#8a7800',
        },
        brand: {
          bg: '#FAF8F5',
          surface: '#ffffff',
          elevated: '#ffffff',
          amber: '#FFEE45',
          gold: '#FDD835',
          yellow: '#FFEE45',
          'yellow-hover': '#FDD835',
          'yellow-light': '#FFFDE6',
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
