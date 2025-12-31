module.exports = {
    content: [
      './src/**/*.{html,js,jsx,ts,tsx}',  // Ajusta según los archivos que uses
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#CB8D69',
            50: '#F5E8DD',
            100: '#EED9C8',
            200: '#E0BBA3',
            300: '#D29D7E',
            400: '#C48D6B',
            500: '#CB8D69',
            600: '#B87D59',
            700: '#A56D49',
            800: '#925D39',
            900: '#7F4D29',
          },
          secondary: {
            DEFAULT: '#557B7D',
            50: '#E8F0F1',
            100: '#D1E1E3',
            200: '#A3C3C7',
            300: '#75A5AB',
            400: '#47878F',
            500: '#557B7D',
            600: '#4A6B6D',
            700: '#3F5B5D',
            800: '#344B4D',
            900: '#293B3D',
          },
          accent: {
            DEFAULT: '#A4B5B8',
            50: '#F5F7F8',
            100: '#EBEFF1',
            200: '#D7DFE3',
            300: '#C3CFD5',
            400: '#AFBFC7',
            500: '#A4B5B8',
            600: '#8FA0A3',
            700: '#7A8B8E',
            800: '#657679',
            900: '#506164',
          },
        },
      },
    },
    plugins: [],
  };
  