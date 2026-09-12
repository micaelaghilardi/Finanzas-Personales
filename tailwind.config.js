/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["Work Sans", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        border: "var(--border)",
        sage: "var(--sage)",
        "sage-tint": "var(--sage-tint)",
        lavender: "var(--lavender)",
        "lavender-tint": "var(--lavender-tint)",
        peach: "var(--peach)",
        sky: "var(--sky)",
        gold: "var(--gold)",
        expense: "var(--expense)",
        income: "var(--income)",
        savings: "var(--savings)",
      },
      borderRadius: {
        card: "20px",
        chip: "20px",
      },
    },
  },
  plugins: [],
};
