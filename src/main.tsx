import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./index.css";
import App from "./App.tsx";
import { initLocale } from "./i18n";

// The language (its strings, its boards, its letters) is one small chunk,
// loaded before the first render so t() can stay synchronous everywhere.
void initLocale().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});

// Register the service worker for offline play / installability. Uses a path
// relative to the page so it works under any GitHub Pages subpath.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("sw.js", document.baseURI)).catch(() => {});
  });
}
