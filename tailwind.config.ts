import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rk: {
          green: "#2F6B65",
          yellow: "#FBC440",
          orange: "#F05A22",
          cream: "#fdfbf7",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
