/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // All JS/TS/React files
  ],
  theme: {
    extend: {},  // You can extend colors, fonts, spacing, etc.
  },
  plugins: [],  // Add Tailwind plugins if needed
}
