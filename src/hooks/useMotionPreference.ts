"use client";

import { useEffect, useState, useCallback } from "react";

export type MotionMode = "always" | "hover-only";

const STORAGE_KEY = "frame-motion-preference";
const EVENT_KEY = "frame-motion-change";

function readMode(): MotionMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "always" ? "always" : "hover-only";
  } catch {
    return "hover-only";
  }
}

// Hook dùng trong UserButton để đọc + set
export function useMotionPreference() {
  // ✅ Luôn bắt đầu với "hover-only" — giống server, tránh hydration mismatch
  const [mode, setModeState] = useState<MotionMode>("hover-only");

  useEffect(() => {
    // Chỉ đọc localStorage SAU khi đã mount trên client
    setModeState(readMode());
    const handler = () => setModeState(readMode());
    window.addEventListener(EVENT_KEY, handler);
    return () => window.removeEventListener(EVENT_KEY, handler);
  }, []);

  const setMode = useCallback((m: MotionMode) => {
    localStorage.setItem(STORAGE_KEY, m);
    setModeState(m);
    window.dispatchEvent(new Event(EVENT_KEY));
  }, []);

  return { mode, setMode };
}

// Hook nhẹ hơn — chỉ đọc, dùng trong UserAvatar
export function useMotionMode(): MotionMode {
  // ✅ Luôn bắt đầu với "hover-only" — giống server, tránh hydration mismatch
  const [mode, setMode] = useState<MotionMode>("hover-only");

  useEffect(() => {
    // Chỉ đọc localStorage SAU khi đã mount trên client
    setMode(readMode());
    const handler = () => setMode(readMode());
    window.addEventListener(EVENT_KEY, handler);
    return () => window.removeEventListener(EVENT_KEY, handler);
  }, []);

  return mode;
}