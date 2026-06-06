/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // TAYA palette — taxi + Canarias coastal
        taxi: {
          DEFAULT: "#FFC400", // taxi yellow
          dark: "#E0A800",
          soft: "#FFE48A",
        },
        volcanic: {
          DEFAULT: "#221B1A", // warm near-black basalt
          800: "#2E2523",
          700: "#3B302D",
        },
        atlantic: {
          DEFAULT: "#0E7C9B", // deep teal sea
          dark: "#0A5E77",
          light: "#36A7C4",
        },
        palm: "#2F8F5B",
        coral: "#E8643C", // sunset accent
        sand: {
          DEFAULT: "#F6ECD4",
          deep: "#EADFC0",
        },
        cream: "#FBF7EE",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 24px -8px rgba(34,27,26,0.18)",
        drawer: "8px 0 40px -12px rgba(34,27,26,0.45)",
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
