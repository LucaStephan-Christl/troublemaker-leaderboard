"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/format";

/**
 * Zeigt, wann das Dashboard zuletzt aktualisiert wurde, einen Countdown bis zum nächsten
 * automatischen Update und einen Button zum sofortigen Aktualisieren.
 */
export function RefreshBadge({
  updatedAt,
  intervalMs,
  onRefresh,
  paused,
  pausedLabel = "Pausiert",
  dark,
  className,
}: {
  /** Zeitpunkt (ms) der letzten erfolgreichen Abfrage */
  updatedAt: number | null;
  /** Abstand der automatischen Updates */
  intervalMs: number;
  onRefresh: () => Promise<unknown>;
  paused?: boolean;
  pausedLabel?: string;
  dark?: boolean;
  className?: string;
}) {
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = paused || !updatedAt || !now ? null : Math.max(0, Math.ceil((updatedAt + intervalMs - now) / 1000));
  const progress = remaining === null ? 0 : Math.min(1, Math.max(0, 1 - (remaining * 1000) / intervalMs));
  const last = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Berlin" })
    : null;

  async function refresh() {
    if (busy) return;
    setBusy(true);
    try {
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-[3px] px-3 py-2 text-xs",
        dark ? "border-paper/40 text-paper" : "border-ink bg-paper shadow-[3px_3px_0_var(--ink)]",
        className,
      )}
    >
      <div className="min-w-0 flex-1" aria-live="off">
        <p className="font-extrabold uppercase tracking-wider">
          {paused ? (
            <>🌙 {pausedLabel}</>
          ) : busy ? (
            <>Aktualisiere …</>
          ) : remaining === null ? (
            <>Lade …</>
          ) : remaining === 0 ? (
            <>Gleich neu …</>
          ) : (
            <>
              Update in <span className="tabnum inline-block min-w-[2ch] text-right">{remaining}</span> s
            </>
          )}
        </p>
        <div className={cn("mt-1 h-1.5 w-full", dark ? "bg-paper/20" : "bg-paper-2 outline outline-2 outline-ink")}>
          <div
            className={cn("h-full transition-[width] duration-1000 ease-linear", dark ? "bg-paper" : "bg-gradient-to-r from-sun to-alarm")}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {last && <p className="mt-1 opacity-60">Stand {last} Uhr</p>}
      </div>
      <button
        className={cn("btn !min-h-10 !px-3 !py-1 text-sm", dark && "btn-ghost")}
        onClick={refresh}
        disabled={busy}
        aria-label="Jetzt aktualisieren"
        title="Jetzt aktualisieren"
      >
        <motion.span animate={busy ? { rotate: 360 } : { rotate: 0 }} transition={busy ? { repeat: Infinity, duration: 0.7, ease: "linear" } : { duration: 0 }} className="inline-block" aria-hidden>
          ↻
        </motion.span>
        <span className="hidden sm:inline">Jetzt</span>
      </button>
    </div>
  );
}
