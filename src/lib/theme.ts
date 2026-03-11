"use client";
import { createTheme } from "@mui/material/styles";
import { viVN } from "@mui/material/locale";

const theme = createTheme(
  {
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1440,
      },
    },
    palette: {
      mode: "light",
      primary: {
        main: "#16a34a", // green-600
        light: "#22c55e", // green-500
        dark: "#15803d", // green-700
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#0f172a", // slate-900
        light: "#1e293b",
        dark: "#020617",
        contrastText: "#ffffff",
      },
      success: {
        main: "#16a34a",
        light: "#dcfce7",
      },
      error: {
        main: "#dc2626",
      },
      warning: {
        main: "#f59e0b",
      },
      background: {
        default: "#f8fafc",
        paper: "#ffffff",
      },
      text: {
        primary: "#0f172a",
        secondary: "#475569",
      },
      divider: "#e2e8f0",
    },
    typography: {
      fontFamily:
        '"Inter", "Be Vietnam Pro", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
          containedPrimary: {
            background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: "0 1px 0 0 #e2e8f0",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow:
              "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
            "&:hover": {
              boxShadow: "0 4px 16px 0 rgb(22 163 74 / 0.15)",
              transform: "translateY(-2px)",
              transition: "all 0.2s ease",
            },
            transition: "all 0.2s ease",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6 },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
          size: "small",
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#16a34a",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          elevation1: {
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.07)",
          },
        },
      },
    },
  },
  viVN,
);

export default theme;
