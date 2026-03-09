import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import MigrationAtlas from "./MigrationAtlas";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MigrationAtlas />
    <Analytics />
  </React.StrictMode>
);
