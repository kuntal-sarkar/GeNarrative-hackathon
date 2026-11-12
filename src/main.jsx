import { APP_NAME } from "./config/branding"; // TAKEGRID_BRANDING_V1 TITLE
document.title = APP_NAME;
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);