/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ghost: {
          950: "#0B1628",
          900: "#111B21",
          800: "#202C33",
          700: "#222D34",
          600: "#2A3942",
          500: "#374045",
          400: "#54656F",
          300: "#8696A0",
          200: "#AEBAC1",
          100: "#D1D7DB",
          50: "#E9EDEF",
        },
        wa: {
          green: "#06CF9C",
          blue: "#53BDEB",
          teal: "#00A884",
          red: "#EA4335",
          dark: "#0B1628",
          header: "#111B21",
          bubble: {
            me: "#005C4B",
            other: "#202C33",
          },
        },
        navy: {
          950: "#0B132B",
          900: "#1C2541",
          800: "#273A63",
          700: "#2E4370",
          600: "#3B5795",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E5C158",
          dark: "#B8942E",
          text: "#F4E8C1",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
