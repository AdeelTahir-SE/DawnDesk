import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LoggerProvider } from "./utils/LoggerContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <LoggerProvider>
        <App />
      </LoggerProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
