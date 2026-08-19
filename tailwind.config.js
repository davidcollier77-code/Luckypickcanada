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
      dropShadow: {
        '3d': [
          '0 2px 2px rgba(0,0,0,0.8)',
          '0 4px 6px rgba(0,0,0,0.5)',
          '0 8px 12px rgba(0,0,0,0.4)',
        ]
      },
      animation: {
        'pop-out': 'popOut 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'vortex-spin': 'vortexSpin 4s linear infinite',
        'vortex-spin-fast': 'vortexSpin 0.5s linear infinite',
        'vortex-spin-reverse': 'vortexSpinReverse 6s linear infinite',
        'spin-slow': 'spin 25s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'aurora-1': 'auroraWave 20s ease-in-out infinite alternate',
        'aurora-2': 'auroraWave 25s ease-in-out infinite alternate-reverse',
        'aurora-3': 'auroraWave 30s ease-in-out infinite alternate',
        'flicker': 'flicker 1.5s infinite alternate',
        'float-slow': 'floatSlow 4s ease-in-out infinite',
        'shake-slight': 'shakeSlight 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'shake-heavy': 'shakeHeavy 0.4s cubic-bezier(.36,.07,.19,.97) both',
        'pulse-rapid': 'pulseRapid 0.6s ease-in-out infinite',
        'surge-flash': 'surgeFlash 0.3s ease-in-out infinite alternate',
        'fade-in-dim': 'fadeInDim 1s ease-out forwards',
        'pop-bright': 'popBright 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'scale-dramatic-neon': 'scaleDramaticNeon 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '10%': { opacity: '0.8' },
          '20%': { opacity: '0.4' },
          '30%': { opacity: '0.9' },
          '40%': { opacity: '0.7' },
          '50%': { opacity: '1' },
          '60%': { opacity: '0.3' },
          '70%': { opacity: '0.8' },
          '80%': { opacity: '0.6' },
          '90%': { opacity: '0.9' },
        },
        popOut: {
          '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: '0' },
          '60%': { transform: 'translate(-50%, -50%) scale(1.2)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
        },
        vortexSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        vortexSpinReverse: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.03)' },
        },
        auroraWave: {
          '0%': { transform: 'translateY(0) scaleX(1)', opacity: 0.3 },
          '50%': { transform: 'translateY(-5%) scaleX(1.05)', opacity: 0.5 },
          '100%': { transform: 'translateY(2%) scaleX(0.95)', opacity: 0.3 },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shakeSlight: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-2px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(2px, 0, 0)' }
        },
        shakeHeavy: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translate3d(-4px, -2px, 0)' },
          '20%, 40%, 60%, 80%': { transform: 'translate3d(4px, 2px, 0)' }
        },
        pulseRapid: {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.1)', opacity: 0.8 },
        },
        surgeFlash: {
          '0%': { filter: 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.2))' },
          '100%': { filter: 'drop-shadow(0 0 30px rgba(74, 222, 128, 1))' },
        },
        fadeInDim: {
          '0%': { opacity: 0 },
          '100%': { opacity: 0.5 },
        },
        popBright: {
          '0%': { transform: 'scale(0.5)', opacity: 0 },
          '80%': { transform: 'scale(1.1)', opacity: 1 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        scaleDramaticNeon: {
          '0%': { transform: 'scale(0.1)', opacity: 0, textShadow: '0 0 5px #000' },
          '50%': { transform: 'scale(1.3)', opacity: 1, textShadow: '0 0 20px #4ade80, 0 0 40px #4ade80' },
          '100%': { transform: 'scale(1)', opacity: 1, textShadow: '0 0 15px #4ade80, 0 0 30px #4ade80' },
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
