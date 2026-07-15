/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
              "background": "var(--bg-primary)",
              "surface": "var(--bg-secondary)",
              "surface-container": "var(--bg-card)",
              "surface-container-low": "var(--bg-glass)",
              "surface-container-high": "var(--bg-glass-hover)",
              "surface-container-highest": "var(--bg-card-hover)",
              "surface-container-lowest": "var(--bg-primary)",
              "surface-variant": "var(--bg-glass-hover)",
              "on-surface": "var(--text-primary)",
              "on-surface-variant": "var(--text-secondary)",
              "primary": "var(--accent)",
              "primary-container": "var(--accent-glow)",
              "on-primary": "#ffffff",
              "on-primary-container": "var(--accent-light)",
              "secondary": "var(--accent2)",
              "secondary-container": "var(--accent2-glow)",
              "on-secondary": "#ffffff",
              "tertiary": "var(--success)",
              "tertiary-container": "var(--success)",
              "on-tertiary": "#ffffff",
              "error": "var(--danger)",
              "on-error": "#ffffff",
              "outline-variant": "var(--border)",
              "outline": "var(--border-hover)",
              "icon": "currentColor"
      },
      "borderRadius": {
              "DEFAULT": "0.25rem",
              "lg": "0.5rem",
              "xl": "0.75rem",
              "full": "9999px"
      },
      "maxWidth": {
              "max-width": "1440px",
              "container-max": "1440px"
      },
      "spacing": {
              "margin-desktop": "40px",
              "margin-mobile": "16px",
              "gutter-md": "24px",
              "gutter-sm": "16px",
              "gutter": "24px",
              "base": "8px",
              "xs": "4px",
              "sm": "8px",
              "md": "16px",
              "lg": "24px",
              "xl": "32px",
              "xxl": "48px",
              "container-max": "1440px",
              "max-width": "1440px"
      },
      "fontFamily": {
              "headline-lg": ["Inter", "sans-serif"],
              "body-md": ["Inter", "sans-serif"],
              "headline-xl": ["Inter", "sans-serif"],
              "headline-md": ["Inter", "sans-serif"],
              "headline-lg-mobile": ["Inter", "sans-serif"],
              "label-sm": ["Inter", "sans-serif"],
              "label-md": ["Inter", "sans-serif"],
              "body-lg": ["Inter", "sans-serif"]
      },
      "fontSize": {
              "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
              "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
              "headline-xl": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
              "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
              "headline-lg-mobile": ["28px", {"lineHeight": "36px", "fontWeight": "600"}],
              "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "600"}],
              "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500"}],
              "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}]
      }
    },
  },
  plugins: [],
}
