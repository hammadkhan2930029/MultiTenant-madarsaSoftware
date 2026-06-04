export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        urdu: ['"Noto Nastaliq Urdu"', "serif"],
        arabic: ['"Noto Sans Arabic"', "sans-serif"],
        marhey: ['"Marhey"', 'cursive'],
      },
      darkMode: ['selector', '[data-theme="dark"]'],
      boxShadow: {
        // Ye rahi aapki custom shadows
        'theme': 'var(--shadow-main)',
        'card-theme': 'var(--shadow-card)',
      },
      fontSize: {
        'theme-title': ['clamp(1.8rem, 1.1rem + 2.2vw, 3.2rem)', { lineHeight: '1.9' }],
        'theme-kicker': ['1.5rem', { lineHeight: '1.7' }],
        'theme-body': ['1.75rem', { lineHeight: '2.25rem' }],
        'theme-nav': ['1.5rem', { lineHeight: '1.6' }],
        'theme-button': ['1.5rem', { lineHeight: '1.7' }],
        'theme-detail': ['0.875rem', { lineHeight: '1.75rem' }],
      },
      colors: {
        // Ab aap ye names pure project mein use kar sakte hain
        themeBg: "var(--color-bg)",
        themeSurface: "var(--color-surface)",
        themeText: "var(--color-text-main)",
        themePrimary: "var(--color-primary)",
        themePrimaryHover: "var(--color-primary-hover)",
        themeBorder: "var(--color-border)",
      },
      sidebar: {
          text: "#9ca3af",       // Gray-400
          textHover: "#ffffff",  // White
          activeBg: "#00d094",
          primary: "#00d094",    // Emerald Green (Accent)
          dark: "#002a33",       // Deep Navy (Footer/Card Header)
          gradientStart: "#004d61", 
          gradientEnd: "#002a33",
          surface: "rgba(255, 255, 255, 0.05)",
        }
    },
  },
  plugins: [],
};
