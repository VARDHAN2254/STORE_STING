/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F4EE", // Warm Ivory
        surface: "#FFFFFF",    // Pure White
        mist: "#EEF2F0",       // Soft Mist
        pearl: "#E6EAE6",      // Pearl
        sage: {
          light: "#DCE5DC",
          DEFAULT: "#B9C9B8",
          dark: "#8EA38D",
        },
        mint: {
          light: "#D8F3EC",
          DEFAULT: "#A9DED2",
          dark: "#68BAA7",
        },
        coral: {
          light: "#FADCD4",
          DEFAULT: "#F2B7A5",
          dark: "#D97B62",
        },
        lime: {
          light: "#EDF5B5",
          DEFAULT: "#D8E878",
          dark: "#ADC23D",
        },
        ink: {
          light: "#3A4D46",
          DEFAULT: "#1E2925", // Deep Ink
          muted: "#60716A",
          border: "#D8E0DC",
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(30, 41, 37, 0.04), 0 1px 3px -1px rgba(30, 41, 37, 0.02)',
        'soft': '0 10px 30px -4px rgba(30, 41, 37, 0.05), 0 4px 12px -2px rgba(30, 41, 37, 0.02)',
        'soft-lg': '0 20px 45px -8px rgba(30, 41, 37, 0.07), 0 8px 18px -4px rgba(30, 41, 37, 0.03)',
        'soft-float': '0 25px 60px -15px rgba(30, 41, 37, 0.10)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.85, transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
