/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './themes/**/*.{js,jsx,ts,tsx}',
    './*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 25s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.03)' },
        }
      },
      colors: {
        background: 'var(--lp-bg)',
        foreground: 'var(--lp-text)',
        aurora: {
          blue: 'var(--lp-aurora-blue)',
          violet: 'var(--lp-aurora-violet)',
        },
        starry: {
          night: 'var(--lp-night)',
          ink: 'var(--lp-ink)',
        },
      },
    },
  },
  plugins: [],
};
