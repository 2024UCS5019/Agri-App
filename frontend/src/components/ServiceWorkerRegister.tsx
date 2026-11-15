"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Agri-App Service Worker registered successfully:", reg.scope);
          })
          .catch((err) => {
            console.warn("Agri-App Service Worker registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}
