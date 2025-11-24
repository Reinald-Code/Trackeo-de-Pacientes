/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#005A9C',
        background: '#F1F1F1',
        dark: '#333333',
        success: '#28A745',
        warning: '#FFC107',
        danger: '#DC3545',
        info: '#EBF5FB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
