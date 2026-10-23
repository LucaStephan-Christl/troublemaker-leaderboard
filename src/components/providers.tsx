"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { isCoworkerId } from "@/config/coworkers";
import { playSound, type SoundName } from "@/lib/sound";

/* ---------- winziger localStorage-Store (SSR-sicher) ---------- */
const EVENT = "mlb-local";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* privater Modus o. Ä. – dann eben ohne Gedächtnis */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** undefined = Server / noch nicht hydriert, null = nichts gespeichert */
function useLocal(key: string): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => undefined,
  );
}

/* ---------- App-Kontext ---------- */
export type Toast = { id: number; emoji: string; title: string; body?: string };

type AppCtx = {
  me: string | null;
  ready: boolean;
  setMe: (id: string | null) => void;
  muted: boolean;
  toggleMute: () => void;
  sfx: (name: SoundName) => void;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
};

const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp außerhalb des Providers");
  return v;
}

let toastId = 0;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const storedMe = useLocal("mlb:me");
  const storedMuted = useLocal("mlb:sound");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const ready = storedMe !== undefined;
  const me = typeof storedMe === "string" && isCoworkerId(storedMe) ? storedMe : null;
  // Ton ist standardmäßig AUS
  const muted = storedMuted !== "on";

  const setMe = useCallback((id: string | null) => write("mlb:me", id), []);
  const toggleMute = useCallback(() => write("mlb:sound", muted ? "on" : "off"), [muted]);
  const sfx = useCallback((name: SoundName) => { if (!muted) playSound(name); }, [muted]);
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5200);
  }, []);

  const value = useMemo(
    () => ({ me, ready, setMe, muted, toggleMute, sfx, toasts, toast }),
    [me, ready, setMe, muted, toggleMute, sfx, toasts, toast],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
