/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          base: "#0A0A0A",
          elevated: "#171717",
          card: "#171717",
          'card-hover': "#262626",
          border: "#262626",
          text: "#FFFFFF",
          'text-secondary': "rgba(255,255,255,0.68)",
          'text-muted': "rgba(255,255,255,0.5)",
          accent: "#FACC15",
          'accent-hover': "#FBBF24",
          success: "#4ADE80",
          warning: "#FACC15",
          error: "#F87171",
          info: "#60A5FA",
        }
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        heading: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem', // 16px
        '3xl': '1.25rem', // 20px
      }
    },
  },
  plugins: [],
}
