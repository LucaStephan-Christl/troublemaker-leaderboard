"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { RefreshBadge } from "@/components/refresh-badge";
import { CountUp, Avatar, nameOf, TrihowMark } from "@/components/ui";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { isOfficeHours } from "@/lib/time";
import type { Insights, LeaderboardResponse } from "@/lib/types";

const SLIDE_MS = 12000;
const SLIDES = ["Rangliste", "Letzte Fälle", "Hall of Shame"] as const;
// Der TV läuft 24/7: nur zu Bürozeiten und selten abfragen, damit Datenbank & Funktionen nachts schlafen können.
const POLL_MS = 30_000;
const POLL_INSIGHTS_MS = 60_000;

export default function TvPage() {
  const [slide, setSlide] = useState(0);
  const [tick, setTick] = useState(0);
  const [office, setOffice] = useState(() => isOfficeHours(new Date()));
  useEffect(() => {
    const t = setInterval(() => setOffice(isOfficeHours(new Date())), 60_000);
    return () => clearInterval(t);
  }, []);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const { data: lb, mutate: mutateLb } = useSWR<LeaderboardResponse>("/api/leaderboard?period=month", (p: string) => api<LeaderboardResponse>(p, null), {
    refreshInterval: office ? POLL_MS : 0,
    revalidateOnFocus: false,
    onSuccess: () => setUpdatedAt(Date.now()),
  });
  const { data: ins, mutate: mutateIns } = useSWR<Insights>("/api/insights", (p: string) => api<Insights>(p, null), {
    refreshInterval: office ? POLL_INSIGHTS_MS : 0,
    revalidateOnFocus: false,
  });
  /** Sofort neu laden – mit Cache-Buster, damit auch das CDN-Caching umgangen wird */
  const refresh = async () => {
    const stamp = Date.now();
    const [freshLb, freshIns] = await Promise.all([
      api<LeaderboardResponse>(`/api/leaderboard?period=month&fresh=${stamp}`, null),
      api<Insights>(`/api/insights?fresh=${stamp}`, null),
    ]);
    await Promise.all([mutateLb(freshLb, { revalidate: false }), mutateIns(freshIns, { revalidate: false })]);
    setUpdatedAt(Date.now());
  };

  useEffect(() => {
    const t = setInterval(() => { setSlide((s) => (s + 1) % SLIDES.length); setTick((k) => k + 1); }, SLIDE_MS);
    return () => clearInterval(t);
  }, []);

  const month = new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric", timeZone: "Europe/Berlin" });

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-ink text-paper">
      <div className="hazard h-4 shrink-0" />
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-8 py-4">
        <h1 className="display flex items-center gap-4 text-3xl sm:text-5xl"><TrihowMark size={56} invert className="wiggle" /> Mobbing<span className="text-paper">-</span>Board <span className="text-alarm">live</span></h1>
        <div className="flex flex-wrap items-center justify-end gap-4 text-right">
          <span className="hidden text-sm font-extrabold uppercase tracking-widest text-paper xl:block">Saison {month}</span>
          <RefreshBadge dark updatedAt={updatedAt} intervalMs={POLL_MS} paused={!office} pausedLabel="Feierabend" onRefresh={refresh} className="w-60 shrink-0 text-left" />
          <span className="hidden items-center gap-2 text-sm font-bold uppercase lg:flex">
            {office ? <><span className="pulse-ring inline-block h-3 w-3 rounded-full bg-alarm" /> Live</> : <>🌙 Feierabend</>}
          </span>
          <Link href="/" className="text-xs underline opacity-50 hover:opacity-100">zurück</Link>
        </div>
      </header>

      <main className="relative flex-1 px-8 pb-6">
        <AnimatePresence mode="wait">
          <motion.div key={slide} className="h-full" initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -80 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            {slide === 0 && <BoardSlide lb={lb} />}
            {slide === 1 && <RecentSlide lb={lb} />}
            {slide === 2 && <ShameSlide ins={ins} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="flex items-center gap-3 px-8 pb-4">
        {SLIDES.map((s, i) => (
          <div key={s} className="flex-1">
            <p className={`mb-1 text-xs font-extrabold uppercase tracking-widest ${i === slide ? "text-paper" : "opacity-40"}`}>{s}</p>
            <div className="h-2 bg-paper/20">
              {i === slide && <motion.div key={tick} className="h-full bg-paper" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: SLIDE_MS / 1000, ease: "linear" }} />}
            </div>
          </div>
        ))}
      </footer>
    </div>
  );
}

function BoardSlide({ lb }: { lb?: LeaderboardResponse }) {
  const top = (lb?.entries ?? []).slice(0, 6);
  const max = Math.max(1, ...top.map((e) => e.points));
  return (
    <ol className="flex h-full flex-col justify-center gap-3">
      {top.map((e, i) => (
        <motion.li key={e.id} layout initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 28 }} className="flex items-center gap-5">
          <span className="display w-14 text-center text-5xl text-paper">{i === 0 ? "👑" : e.rank}</span>
          <span className="grid w-[84px] shrink-0 place-items-center"><Avatar id={e.id} size={i === 0 ? 84 : 64} /></span>
          <span className="display w-56 shrink-0 text-3xl sm:w-72 sm:text-4xl">{nameOf(e.id)}</span>
          <span className="relative h-9 flex-1 border-[3px] border-paper/60">
            <motion.span className="absolute inset-y-0 left-0" style={{ background: i === 0 ? "linear-gradient(90deg, var(--alarm), var(--gold-2))" : "linear-gradient(90deg, var(--paper-2), var(--gold))" }} initial={{ width: 0 }} animate={{ width: `${(e.points / max) * 100}%` }} transition={{ duration: 1.1, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }} />
          </span>
          <span className="display w-24 text-right text-5xl text-paper"><CountUp value={e.points} /></span>
        </motion.li>
      ))}
    </ol>
  );
}

function RecentSlide({ lb }: { lb?: LeaderboardResponse }) {
  const items = (lb?.recent ?? []).slice(0, 6);
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <h2 className="display mb-2 text-4xl text-paper">Frisch bestätigt</h2>
      {items.length === 0 && <p className="text-3xl opacity-60">Noch nichts passiert. Verdächtig.</p>}
      {items.map((i, idx) => (
        <motion.div key={i.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="flex items-center gap-5 border-[3px] border-paper/30 p-3">
          <span className="text-5xl" aria-hidden>{i.emoji}</span>
          <Avatar id={i.accusedId} size={56} />
          <span className="min-w-0 flex-1">
            <span className="display block truncate text-2xl sm:text-3xl">{nameOf(i.accusedId)} <span className="text-alarm">➜</span> {nameOf(i.victimId)}</span>
            <span className="block truncate text-lg opacity-70">{i.categoryLabel}{i.note ? ` · „${i.note}“` : ""} · {timeAgo(i.createdAt)}</span>
          </span>
          <span className="display text-5xl text-paper">+{i.points}</span>
        </motion.div>
      ))}
    </div>
  );
}

function ShameSlide({ ins }: { ins?: Insights }) {
  if (!ins) return null;
  const cards: { title: string; main: string; sub: string; id?: string }[] = [];
  if (ins.topIncident) cards.push({ title: "Fall aller Zeiten", main: `+${ins.topIncident.points} ${ins.topIncident.emoji}`, sub: `${nameOf(ins.topIncident.accusedId)} ➜ ${nameOf(ins.topIncident.victimId)}: ${ins.topIncident.categoryLabel}`, id: ins.topIncident.accusedId });
  const v = ins.victimOfMonth ?? ins.victimAllTime;
  if (v) cards.push({ title: "Opfer des Monats", main: nameOf(v.id), sub: `${v.count}× erwischt`, id: v.id });
  if (ins.streak) cards.push({ title: "Serientäter:in", main: nameOf(ins.streak.id), sub: `${ins.streak.days} Werktage in Folge`, id: ins.streak.id });
  if (ins.rivalry) cards.push({ title: "Rivalen-Duell", main: `${nameOf(ins.rivalry.a)} ${ins.rivalry.aToB}:${ins.rivalry.bToA} ${nameOf(ins.rivalry.b)}`, sub: `${ins.rivalry.total} Fälle untereinander` });
  return (
    <div className="grid h-full grid-cols-1 content-center gap-5 sm:grid-cols-2">
      {cards.slice(0, 4).map((c, i) => (
        <motion.div key={c.title} initial={{ opacity: 0, scale: 0.85, rotate: i % 2 ? 2 : -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: i * 0.12, type: "spring", stiffness: 300, damping: 22 }} className="border-[4px] border-paper p-6">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.25em] text-paper">{c.title}</p>
          <div className="flex items-center gap-5">
            {c.id && <Avatar id={c.id} size={88} />}
            <div>
              <p className="display text-4xl sm:text-5xl">{c.main}</p>
              <p className="mt-1 text-xl opacity-75">{c.sub}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
