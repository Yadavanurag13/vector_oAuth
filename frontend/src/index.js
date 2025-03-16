import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // A shade of blue
    },
    secondary: {
      main: '#dc004e', // A shade of red/pink
    },
    background: {
      default: '#f0f2f5', // A light background
    },
  },
  typography: {
    fontFamily: ['"Roboto"', 'sans-serif'].join(','),
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);