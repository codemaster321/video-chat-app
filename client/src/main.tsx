import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import VideoCallApp from "./App";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VideoCallApp />
  </StrictMode>
);
