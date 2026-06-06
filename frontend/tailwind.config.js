/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // TAYA palette — Canarias: amarillo + azul + blanco (only 3 hues)
        taxi: {
          DEFAULT: "#FFC400", // amarillo
          dark: "#E0A800",
          soft: "#FFE9A6",
        },
        // "volcanic" token now = deep navy blue (was near-black); used for dark surfaces + text
        volcanic: {
          DEFAULT: "#0B2E4F",
          800: "#123A61",
          700: "#1B4A78",
        },
        atlantic: {
          DEFAULT: "#1577C2", // azul
          dark: "#0B5C9E",
          light: "#4AA3DD",
        },
        palm: "#1577C2", // remapped green -> azul
        coral: "#0B5C9E", // remapped accent/danger -> azul oscuro
        sand: {
          DEFAULT: "#E8F1F8", // blanco azulado
          deep: "#CFE0EE",
        },
        cream: "#F6FAFD", // blanco
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 24px -8px rgba(11,46,79,0.18)",
        drawer: "8px 0 40px -12px rgba(11,46,79,0.45)",
        glow: "0 0 0 4px rgba(255,196,0,0.25)",
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
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "slide-in": "slide-in 0.32s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};
