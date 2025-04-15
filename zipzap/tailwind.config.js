/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2C2E3B',
        secondary: '#21232F',
        accent: '#5D64E4',
      },
    },
  },
  plugins: [],
}
