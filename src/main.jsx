import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { LibraryProvider } from "./LibraryContext.jsx";
import { ToastProvider } from "./ToastContext.jsx";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <LibraryProvider>
          <App />
        </LibraryProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
