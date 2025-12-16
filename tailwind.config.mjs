import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  plugins: [forms, containerQueries],
  theme: {
    extend: {
      colors: {
        primary: "#953dd0",
        "background-dark": "#151517",
        "background-light": "#f0e5f5",
        "accent-pink": "#d415b1",
        "accent-blue": "#cce4fc",
        "dark-purple": "#4c0c44",
        "mid-purple": "#80289c",
        "action-blue": "#5860e2",
      },
      fontFamily: {
        display: ["Spline Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
    },
  },
};
