import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initAuthSession } from "./utils/authSession";
import "./api/index";
import App from "./App";

initAuthSession();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
