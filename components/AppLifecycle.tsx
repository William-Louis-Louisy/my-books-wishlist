"use client";

import { useEffect } from "react";
import { retryDriveExportWhenVisible } from "@/lib/drive-sync";

export function AppLifecycle() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js");
    }

    const onVisibilityChange = () => {
      void retryDriveExportWhenVisible();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return null;
}
