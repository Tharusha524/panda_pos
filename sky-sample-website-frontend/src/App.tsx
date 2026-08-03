import { BrowserRouter } from "react-router";
import AppRoutes from "./Routes.tsx";
import { CssBaseline } from "@mui/material";
import { ColorModeProvider } from "./state/colorMode.tsx";
import { SnackbarProvider } from "notistack";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./state/queryClient.ts";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ColorModeProvider>
          <CssBaseline />
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <SnackbarProvider maxSnack={3} autoHideDuration={2500}>
              <AppRoutes />
            </SnackbarProvider>
          </BrowserRouter>
        </ColorModeProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}

export default App;
