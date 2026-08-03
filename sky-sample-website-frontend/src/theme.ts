import { createTheme, Theme } from "@mui/material/styles";

export type ColorMode = "light" | "dark";

function getTheme(mode: ColorMode): Theme {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      background: {
        default: isDark ? "#0b1020" : "#f4f6fa",
        paper: isDark ? "#141a2e" : "#ffffff",
      },
      text: {
        primary: isDark ? "#e7ebf5" : "#0c1222",
        secondary: isDark ? "#a6aec4" : "#56607c",
      },
      divider: isDark ? "#2b3350" : "rgba(0, 0, 0, 0.12)",
      primary: {
        main: isDark ? "#6ea1ff" : "#00327e",
      },
    },
    typography: {
      fontFamily: "Poppins, sans-serif",
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}

export { getTheme };

/**
 * Static light-mode theme, kept as the default export for the many call
 * sites that only need mode-independent values (theme.breakpoints,
 * theme.spacing, theme.zIndex) outside of React context. Anything that
 * needs to react to the user's light/dark choice should use
 * useColorMode()/useTheme() instead.
 */
export default getTheme("light");
