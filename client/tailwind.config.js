/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        govblue: {
          50: '#f0f4f9',
          100: '#dbe5f2',
          600: '#1d4ed8',
          700: '#1d40af',
          800: '#1e3a8a',
          900: '#172554',
        }
      }
    },
  },
  plugins: [],
}
