import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        cream: "#f6f1e7",
        ember: "#d2693c",
        spruce: "#1f6b54",
        sand: "#dcc8a7",
      },
      boxShadow: {
        panel: "0 24px 60px rgba(23, 32, 51, 0.08)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(210, 105, 60, 0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(31, 107, 84, 0.18), transparent 26%)",
      },
    },
  },
  plugins: [],
};

export default config;
