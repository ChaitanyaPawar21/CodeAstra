/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neobrutalist pastel-yellow surfaces.
        // Low numbers = deeper yellow, high numbers = pale panels.
        dark: {
          950: '#FDEFA8',
          900: '#FBF3C4', // page background (pastel yellow)
          850: '#FCF6D4',
          800: '#FFFBE0', // panels / cards
          750: '#FFFDF0',
          700: '#FFFDF0',
          600: '#FFFDF0',
        },
        // Primary accent: buttery yellow (neo-button).
        primary: {
          500: '#FBE16B',
          600: '#F5D13F',
          700: '#E8BE28',
        },
        accent: {
          indigo: '#FBE16B', // yellow
          blue: '#F5D13F',   // yellow
          emerald: '#6F9E7E',// sage (charts)
          amber: '#F5D13F',  // yellow
          rose: '#FBE16B',   // yellow
        },

        // Inverted to a warm taupe scale so every existing text-/bg-slate-*
        // flips coherently: low numbers = dark ink, high numbers = light.
        slate: {
          50: '#000000',
          100: '#0A0A0A',
          200: '#1A1A1A',
          300: '#2E2E2E',
          400: '#595959', // muted text
          500: '#808080',
          600: '#A6A6A6',
          700: '#C7C7C7',
          800: '#DCDCDC',
          900: '#EAEAEA',
          950: '#F5F5F5',
        },

        // Accent/categorical hues muted to pastels (deep-merged: only the
        // steps actually used are overridden, other shades keep defaults).
        indigo: { // yellow accent
          200: '#FEF6C7',
          300: '#FCEC9B',
          400: '#FADF6B',
          500: '#F5D13F',
          600: '#E8BE28',
          700: '#C99E15',
        },
        emerald: {
          300: '#AFCDB4',
          400: '#8FB89A',
          500: '#6F9E7E',
          600: '#5A8568',
        },
        green: {
          400: '#96C08A',
          500: '#78A66C',
        },
        purple: {
          300: '#CDBBDC',
          400: '#B29AC6',
          500: '#9579AE',
          600: '#7E6397',
        },
        amber: { // light yellow
          300: '#FBEFC0',
          400: '#F7E39A',
          500: '#F2D778',
          600: '#E4C34A',
        },
        yellow: {
          300: '#FBEFC0',
          400: '#F7E39A',
          500: '#F2D778',
        },
        orange: {
          300: '#EDC4A6',
          400: '#DDA074',
          500: '#CB8455',
        },
        rose: { // pink
          300: '#F6CAD9',
          400: '#EFA7C0',
          500: '#E485A6',
          600: '#D16B90',
        },
        pink: {
          300: '#EEC4D2',
          500: '#CF84A0',
        },
        blue: {
          400: '#92AECF',
          500: '#7693BC',
          600: '#5F7BA3',
        },
        cyan: {
          300: '#A7D0D1',
          400: '#82BCBE',
          500: '#64A3A6',
          600: '#4E888B',
        },
        red: {
          400: '#D68B86',
          500: '#C06A64',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      // Neobrutalist: hard black offset shadows (no blur) replace soft ones.
      boxShadow: {
        sm: '2px 2px 0 0 #000',
        DEFAULT: '3px 3px 0 0 #000',
        md: '4px 4px 0 0 #000',
        lg: '6px 6px 0 0 #000',
        xl: '8px 8px 0 0 #000',
        '2xl': '10px 10px 0 0 #000',
      },
      // Bolder default border so every `border` reads as a neo outline.
      borderWidth: {
        DEFAULT: '2px',
      },
    },
  },
  plugins: [],
}
