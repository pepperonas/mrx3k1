/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2C2E3B',
        secondary: '#3B3F53',
        accent: '#4F88E5',
        text: {
          light: '#F3F4F6',
          DEFAULT: '#E2E4E9',
          dark: '#9CA3AF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#60A5FA',
      },
      boxShadow: {
        card: '0 4px 15px 0 rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 30px 0 rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}