"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // silencioso — funciona normalmente sem PWA se o registro falhar
      });
    }
  }, []);
  return null;
}
