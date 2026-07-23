"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Autosaving state hook backed by localStorage. Debounced writes power the
 * "Draft saved" indicator on the analysis wizard.
 */
export function useAutosave<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hydrate once on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore corrupt drafts */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // debounced persist
  useEffect(() => {
    if (!hydrated) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        setSavedAt(Date.now());
      } catch {
        /* storage full / unavailable */
      }
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [key, value, hydrated]);

  const clear = useCallback(() => {
    window.localStorage.removeItem(key);
    setSavedAt(null);
  }, [key]);

  return { value, setValue, hydrated, savedAt, clear } as const;
}

export function saveResult(result: unknown) {
  try {
    window.localStorage.setItem("gb-last-result", JSON.stringify(result));
  } catch {
    /* ignore */
  }
}

export function loadResult<T>(): T | null {
  try {
    const raw = window.localStorage.getItem("gb-last-result");
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
