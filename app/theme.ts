import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f172a",
    },
    secondary: {
      main: "#f59e0b",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Space Grotesk", "Segoe UI", system-ui, sans-serif',
    h1: {
      fontFamily: '"Fraunces", "Times New Roman", serif',
      fontWeight: 600,
    },
    h2: {
      fontFamily: '"Fraunces", "Times New Roman", serif',
      fontWeight: 600,
    },
    h3: {
      fontFamily: '"Fraunces", "Times New Roman", serif',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 4,
  },
});

export default theme;
