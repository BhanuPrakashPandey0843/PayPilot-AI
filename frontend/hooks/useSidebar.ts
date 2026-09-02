"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "paypilot_sidebar_collapsed";

/**
 * Desktop sidebar collapse state, persisted across reloads (Step 5 of
 * the dashboard-shell brief: "State persists"). Mobile ignores this
 * entirely — the sidebar renders as an off-canvas drawer below the
 * `lg` breakpoint regardless of `collapsed` (see Sidebar.tsx).
 */
export function useSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return {
    collapsed: hydrated && collapsed,
    toggleCollapsed,
    mobileOpen,
    openMobile: () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
  };
}
