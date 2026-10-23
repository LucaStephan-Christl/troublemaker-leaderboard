"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { COWORKER_BY_ID } from "@/config/coworkers";
import { cn } from "@/lib/format";

export function Avatar({ id, size = 48, className }: { id: string; size?: number; className?: string }) {
  const c = COWORKER_BY_ID[id];
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-ink", className)}
      style={{ width: size, height: size, background: c?.color ?? "#ccc", fontSize: size * 0.52 }}
      role="img"
      aria-label={c?.name ?? id}
    >
      {c?.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden className="leading-none">{c?.emoji ?? "?"}</span>
      )}
    </span>
  );
}

export const nameOf = (id: string) => COWORKER_BY_ID[id]?.name ?? id;

/** Zahl, die beim Wertwechsel hochzählt */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [mv, value]);
  return <motion.span className={cn("tabnum", className)}>{text}</motion.span>;
}

/** Gummistempel, der auf den Bildschirm knallt */
export function Stamp({
  children,
  tone = "alarm",
  className,
}: {
  children: React.ReactNode;
  tone?: "alarm" | "mint" | "ink";
  className?: string;
}) {
  const color = tone === "alarm" ? "var(--alarm)" : tone === "mint" ? "var(--mint)" : "var(--ink)";
  return (
    <motion.div
      initial={{ scale: 3.2, opacity: 0, rotate: -24 }}
      animate={{ scale: 1, opacity: 1, rotate: -9 }}
      exit={{ opacity: 0, scale: 1.15 }}
      transition={{ type: "spring", stiffness: 520, damping: 22, mass: 0.7 }}
      className={cn("display border-[6px] px-5 py-2 text-3xl sm:text-5xl", className)}
      style={{ color, borderColor: color, boxShadow: `inset 0 0 0 3px var(--paper), 0 0 0 3px ${color}`, background: "rgba(242,232,211,.92)" }}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({
  kicker,
  children,
  className,
}: {
  kicker?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4", className)}>
      {kicker && <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-alarm">{kicker}</p>}
      <h2 className="display text-3xl sm:text-4xl">{children}</h2>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse border-[3px] border-ink/30 bg-ink/10", className)} />;
}
