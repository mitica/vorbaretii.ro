"use client";

import { useEffect } from "react";

/** Înregistrează service worker-ul (public/sw.js). Nu randează nimic. */
export default function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline-ul e un bonus — dacă nu se poate, site-ul merge ca înainte */
      });
    }
  }, []);
  return null;
}
