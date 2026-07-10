/** Portado 1:1 de frontend/tailwind.config.js — paleta "Atlántico Editorial". */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.js", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        taxi: { DEFAULT: "#FFC400", dark: "#E8AF00", soft: "#FFE9A6" },
        volcanic: { DEFAULT: "#0B2E4F", 800: "#11395F", 700: "#1A4978" },
        atlantic: { DEFAULT: "#1577C2", dark: "#0B5C9E", light: "#4AA3DD" },
        palm: "#1577C2",
        coral: "#0B5C9E",
        sand: { DEFAULT: "#E8F1F8", deep: "#CFE0EE" },
        cream: "#F7FBFE",
      },
      // En RN cada peso de fuente es una familia distinta.
      fontFamily: {
        display: "Unbounded_800ExtraBold",
        displayblack: "Unbounded_900Black",
        displaybold: "Unbounded_700Bold",
        body: "InstrumentSans_400Regular",
        bodymed: "InstrumentSans_500Medium",
        bodysemi: "InstrumentSans_600SemiBold",
        bodybold: "InstrumentSans_700Bold",
      },
      borderRadius: { xl2: 22 },
    },
  },
  plugins: [],
};
