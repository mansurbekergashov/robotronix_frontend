import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/common.css";
import App from "./App.tsx";
import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);

