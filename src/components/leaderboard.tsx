"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { cn, pts, timeAgo } from "@/lib/format";
import { BADGES, type IncidentDTO, type Insights, type LeaderboardEntry } from "@/lib/types";
import { Avatar, CountUp, nameOf, Skeleton } from "./ui";

const spring = { type: "spring", stiffness: 380, damping: 32 } as const;

/* ---------- Podium ---------- */
const PODIUM = [
  { place: 1, h: 190, avatar: 104, label: "🥇", block: "gold-sheen" },
  { place: 2, h: 135, avatar: 80, label: "🥈", block: "bg-gradient-to-b from-paper to-[#E5E5E5]" },
  { place: 3, h: 100, avatar: 80, label: "🥉", block: "bg-gradient-to-b from-[#FFC48E] to-[#DD6C6C]" },
] as const;

export function Podium({ entries, onOpen }: { entries: LeaderboardEntry[]; onOpen: (id: string) => void }) {
  const top = entries.slice(0, 3);
  return (
    <ol className="grid grid-cols-3 items-end gap-2 sm:gap-5" aria-label="Podium">
      {top.map((e, idx) => {
        const spec = PODIUM[idx];
        const order = idx === 0 ? 2 : idx === 1 ? 1 : 3; // 2 · 1 · 3
        return (
          <motion.li key={e.id} layout transition={spring} style={{ order }} className="flex flex-col items-center">
            <button onClick={() => onOpen(e.id)} className="group flex flex-col items-center text-center" aria-label={`${nameOf(e.id)}, Rang ${e.rank}, ${pts(e.points)}. Steckbrief öffnen`}>
              <div className="relative">
                {idx === 0 && e.points > 0 && (
                  <>
                    <span className="bob absolute -top-9 left-1/2 -translate-x-1/2 text-5xl drop-shadow-[0_3px_0_var(--ink)] sm:-top-11 sm:text-6xl" aria-hidden>👑</span>
                    <Sparkles />
                  </>
                )}
                <motion.div whileHover={{ scale: 1.08, rotate: idx === 1 ? 4 : -4 }} className="origin-bottom">
                  <Avatar id={e.id} size={idx === 0 ? 104 : 76} className="shadow-[4px_4px_0_var(--ink)]" />
                </motion.div>
              </div>
              <span className="display mt-3 max-w-full truncate text-lg sm:text-2xl">{nameOf(e.id)}</span>
              <span className="display text-3xl text-alarm sm:text-5xl"><CountUp value={e.points} /></span>
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">{e.incidents} {e.incidents === 1 ? "Fall" : "Fälle"}</span>
            </button>
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.15 * idx, ...spring }}
              style={{ height: spec.h, transformOrigin: "bottom" }}
              className={cn("brut relative mt-3 grid w-full place-items-center", spec.block)}
            >
              <span className="display text-6xl opacity-90 sm:text-8xl" aria-hidden>{spec.place}</span>
              <span className="absolute right-2 top-1 text-2xl" aria-hidden>{spec.label}</span>
            </motion.div>
          </motion.li>
        );
      })}
    </ol>
  );
}

function Sparkles() {
  const spots = [
    { x: "-110%", y: "-10%", d: 0 }, { x: "105%", y: "0%", d: 0.6 }, { x: "-85%", y: "75%", d: 1.2 }, { x: "95%", y: "70%", d: 1.8 },
  ];
  return (
    <>
      {spots.map((s, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute text-2xl"
          style={{ left: "50%", top: "50%", translateX: s.x, translateY: s.y }}
          animate={{ scale: [0, 1.2, 0], rotate: [0, 90, 180], opacity: [0, 1, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: s.d, ease: "easeInOut" }}
        >
          ✨
        </motion.span>
      ))}
    </>
  );
}

/* ---------- Rest der Rangliste ---------- */
export function Rows({ entries, onOpen }: { entries: LeaderboardEntry[]; onOpen: (id: string) => void }) {
  const max = Math.max(1, ...entries.map((e) => e.points));
  const last = entries[entries.length - 1];
  const prev = entries[entries.length - 2];
  const halo = entries.length > 3 && last && prev && max > 0 && last.points < prev.points ? last.id : null;
  return (
    <ul className="flex flex-col gap-3" aria-label="Weitere Plätze">
      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <motion.li key={e.id} layout transition={spring} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => onOpen(e.id)} className="brut-sm relative flex min-h-16 w-full items-center gap-3 overflow-hidden bg-paper p-2 pr-4 text-left transition-transform hover:-translate-y-0.5 hover:bg-white/40 sm:gap-4">
              <span className="display w-9 text-center text-2xl sm:w-12 sm:text-3xl">{e.rank}</span>
              <span className="relative">
                <Avatar id={e.id} size={48} />
                {halo === e.id && <span className="bob absolute -top-4 left-1/2 -translate-x-1/2 text-2xl" aria-hidden>😇</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-extrabold">{nameOf(e.id)}</span>
                <span className="relative block h-2.5 w-full border-2 border-ink bg-paper-2">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-sun to-alarm"
                    initial={false}
                    animate={{ width: `${(e.points / max) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
              </span>
              <span className="text-right">
                <span className="display block text-3xl"><CountUp value={e.points} /></span>
                <span className="block text-[0.7rem] font-bold uppercase tracking-wider opacity-70">{halo === e.id ? "Gutmensch" : `${e.incidents} ${e.incidents === 1 ? "Fall" : "Fälle"}`}</span>
              </span>
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

/* ---------- Letzte Fälle ---------- */
export function RecentFeed({ items }: { items: IncidentDTO[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((i) => (
          <motion.li key={i.id} layout initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 border-b-2 border-dashed border-ink/40 py-2">
            <span className="grid h-11 w-11 shrink-0 place-items-center border-[2.5px] border-ink bg-sun text-2xl" aria-hidden>{i.emoji}</span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate font-bold">
                {nameOf(i.accusedId)} <span className="text-alarm">➜</span> {nameOf(i.victimId)}
              </span>
              <span className="block truncate text-sm opacity-75">
                {i.categoryLabel}
                {i.note ? ` · „${i.note}“` : ""}
              </span>
            </span>
            <span className="text-right leading-tight">
              <span className="display block text-xl text-alarm">+{i.points}</span>
              <span className="block text-xs opacity-60">{i.confessed ? "🙏 Geständnis · " : ""}{timeAgo(i.createdAt)}</span>
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

/* ---------- Steckbrief ---------- */
export function ProfileDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data } = useSWR<Insights>(id ? "/api/insights" : null, (p: string) => api<Insights>(p, null));
  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, onClose]);

  const p = id ? data?.profiles[id] : undefined;
  return (
    <AnimatePresence>
      {id && (
        <motion.div className="fixed inset-0 z-[65] grid place-items-center overflow-y-auto bg-ink/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Steckbrief ${nameOf(id)}`}
            initial={{ scale: 0.8, rotate: -4, y: 40 }}
            animate={{ scale: 1, rotate: 0, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="brut relative w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn btn-ghost absolute right-3 top-3 !min-h-10 !px-3 !py-1" onClick={onClose} aria-label="Schließen">✕</button>
            <div className="flex items-center gap-4">
              <Avatar id={id} size={84} className="shadow-[4px_4px_0_var(--ink)]" />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-alarm">Steckbrief</p>
                <h3 className="display text-4xl">{nameOf(id)}</h3>
              </div>
            </div>
            {!p ? (
              <Skeleton className="mt-6 h-40" />
            ) : (
              <>
                <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <Stat label="Punkte" value={p.points} />
                  <Stat label="Fälle" value={p.incidents} />
                  <Stat label="Opfer-Rolle" value={p.timesVictim} />
                </dl>
                <ul className="mt-5 space-y-2 text-sm">
                  <li>🎨 Lieblingsdisziplin: <b>{p.favoriteCategory ? `${p.favoriteCategory.emoji} ${p.favoriteCategory.label} (${p.favoriteCategory.count}×)` : "—"}</b></li>
                  <li>🎯 Lieblingsopfer: <b>{p.nemesisId ? nameOf(p.nemesisId) : "—"}</b></li>
                  <li>😈 Erzfeind:in: <b>{p.archEnemyId ? nameOf(p.archEnemyId) : "—"}</b></li>
                  <li>🔥 Längste Serie: <b>{p.longestStreak} {p.longestStreak === 1 ? "Werktag" : "Werktage"}</b></li>
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  {p.badges.length === 0 && <span className="text-sm opacity-60">Noch keine Abzeichen – langweilig.</span>}
                  {p.badges.map((b) => (
                    <span key={b} className="chip bg-sun text-paper" title={BADGES[b]?.description}>
                      {BADGES[b]?.emoji} {BADGES[b]?.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="brut-sm bg-paper-2 py-2">
      <dd className="display text-3xl"><CountUp value={value} /></dd>
      <dt className="text-[0.65rem] font-extrabold uppercase tracking-wider">{label}</dt>
    </div>
  );
}
