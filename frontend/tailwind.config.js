/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        surface: '#151518',
        surfaceHighlight: '#222226',
        primary: '#4f46e5', // indigo-600
        primaryHover: '#6366f1',
        textMain: '#f3f4f6',
        textMuted: '#9ca3af',
      },
    },
  },
  plugins: [],
}
