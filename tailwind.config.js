module.exports = {
  important: true,
  content: ['./app/**/*.{ts,tsx,jsx,js}'],
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        white: '#ffffff',
        purple: {
          50: '#f1ebfc',
          100: '#d7c6f5',
          200: '#c7aff1',
          300: '#b798ed',
          400: '#9367df',
          500: '#6a40b2',
          600: '#593696',
          700: '#4b3275',
          800: '#2e2248',
          900: '#1b083d'
        },
        gray: {
          50: '#f1f1f1',
          100: '#d6d6d6',
          200: '#c8c8c8',
          300: '#acacac',
          400: '#919191',
          500: '#757575',
          600: '#525252',
          700: '#3b3b3b',
          800: '#232323',
          900: '#171717'
        },
        green: {
          50: '#edf8f3',
          100: '#c8eada',
          200: '#a3dbc2',
          300: '#7fcda9',
          400: '#5abf91',
          500: '#40a577',
          600: '#32805d',
          700: '#245c42',
          800: '#153728',
          900: '#07120d'
        },
        red: {
          50: '#fef0ee',
          100: '#fdd2cd',
          200: '#fdc3bc',
          300: '#fb978a',
          400: '#fa8879',
          500: '#f96a58',
          600: '#e05f4f',
          700: '#ae4a3e',
          800: '#954035',
          900: '#642a23'
        },
        yellow: {
          50: '#fff8ef',
          100: '#ffeacf',
          200: '#ffdcb0',
          300: '#fec780',
          400: '#fec070',
          500: '#feb960',
          600: '#e5a756',
          700: '#cb944d',
          800: '#664a26',
          900: '#332513'
        }
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
