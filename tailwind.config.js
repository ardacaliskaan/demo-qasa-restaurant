/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // QASA Brand Colors
        'qasa': '#131925',              // Ana koyu lacivert
        'qasa-light': '#1e2a3b',        // Açık lacivert
        'qasa-accent': '#A855F7',       // Mor accent
        'qasa-accent-light': '#C084FC', // Açık mor
        
        // Default colors
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundImage: {
        // QASA Gradients
        'qasa-gradient': 'linear-gradient(135deg, #131925 0%, #A855F7 100%)',
        'qasa-gradient-hover': 'linear-gradient(135deg, #1e2a3b 0%, #C084FC 100%)',
      },
      boxShadow: {
        // QASA Glow Effects
        'qasa-sm': '0 0 10px rgba(168, 85, 247, 0.2)',
        'qasa': '0 0 20px rgba(168, 85, 247, 0.3)',
        'qasa-lg': '0 0 30px rgba(168, 85, 247, 0.4)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'scan': 'scan 2s ease-in-out infinite',
        'glitch': 'glitch 0.3s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
      },
    },
  },
  plugins: [],
}