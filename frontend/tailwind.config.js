/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // TAYA — "Atlántico Editorial": only 3 hues (amarillo / azul / blanco)
        taxi: {
          DEFAULT: "#FFC400", // amarillo taxi
          dark: "#E8AF00",
          soft: "#FFE9A6",
        },
        // deep Atlantic ink — dark surfaces + text
        volcanic: {
          DEFAULT: "#0B2E4F",
          800: "#11395F",
          700: "#1A4978",
        },
        atlantic: {
          DEFAULT: "#1577C2", // azul océano
          dark: "#0B5C9E",
          light: "#4AA3DD",
        },
        palm: "#1577C2", // remapped -> azul (strict 3-hue palette)
        coral: "#0B5C9E", // remapped accent/danger -> azul oscuro
        sand: {
          DEFAULT: "#E8F1F8", // blanco azulado
          deep: "#CFE0EE",
        },
        cream: "#F7FBFE", // blanco alisio
      },
      fontFamily: {
        display: ['"Unbounded"', "system-ui", "sans-serif"],
        body: ['"Instrument Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 24px -8px rgba(11,46,79,0.18)",
        float: "0 18px 50px -16px rgba(11,46,79,0.35)",
        drawer: "8px 0 40px -12px rgba(11,46,79,0.45)",
        glow: "0 0 0 4px rgba(255,196,0,0.25)",
        sun: "0 10px 30px -8px rgba(255,196,0,0.55)",
      },
      borderRadius: {
        xl2: "1.4rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.7)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.92) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "sun-drift": {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(-12px,8px) scale(1.06)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "slide-in": "slide-in 0.32s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
        pop: "pop 0.34s cubic-bezier(0.22,1,0.36,1) both",
        "sun-drift": "sun-drift 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
