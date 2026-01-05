/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#10B981',
        danger: '#DC2626',
        warning: '#F59E0B',
        success: '#059669',
        admin: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      spacing: {
        '128': '32rem',
      },
      boxShadow: {
        'admin-card': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'admin-card-hover': '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
        'admin-nav': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
      },
      borderRadius: {
        'admin-lg': '12px',
        'admin-md': '8px',
      },
    },
  },
  plugins: [],
};
