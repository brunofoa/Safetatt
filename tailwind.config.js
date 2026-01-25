/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "selector",
  theme: {
    extend: {
      colors: {
        primary: "#92FFAD",
        secondary: "#5CDFF0",
        accent: "#2DD4BF",
        "background-light": "#F9FAFB",
        "background-dark": "#09090b", // zinc-950
        "surface-dark": "#18181b",    // zinc-900
        "studio-gray": "#27272a",
        "border-studio": "#27272a",   // zinc-800
      },
      fontFamily: {
        display: ["Montserrat", "sans-serif"],
        sans: ["Montserrat", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        'xl': '24px',
        '2xl': '32px',
      },
    },
  },
  plugins: [],
}
