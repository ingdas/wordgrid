import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register the service worker for offline play / installability. Uses a path
// relative to the page so it works under any GitHub Pages subpath.
//
// Only when the game is the page, though. Inside a portal's iframe (CrazyGames
// serves it from games.crazygames.com, one origin shared by every game) there
// is nothing to install, the portal needs the network anyway, and a worker's
// cache housekeeping would be running on everyone's origin — so the upload zip
// leaves sw.js out (scripts/dist-zip.mts) and this never asks for it.
function isTopLevel(): boolean {
  try {
    return window.top === window;
  } catch {
    return false;
  }
}
if ("serviceWorker" in navigator && isTopLevel()) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("sw.js", document.baseURI)).catch(() => {});
  });
}
