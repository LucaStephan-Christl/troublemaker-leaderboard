"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Podium, ProfileDialog, RecentFeed, Rows } from "@/components/leaderboard";
import { useApp } from "@/components/providers";
import { nameOf, SectionTitle, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { confettiCannons } from "@/lib/fx";
import { cn } from "@/lib/format";
import type { LeaderboardResponse, Period } from "@/lib/types";

const PERIODS: { id: Period; label: string }[] = [
  { id: "week", label: "Diese Woche" },
  { id: "month", label: "Dieser Monat" },
  { id: "all", label: "Gesamt" },
];

const MONTH = new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric", timeZone: "Europe/Berlin" });

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [profile, setProfile] = useState<string | null>(null);
  const { toast, sfx } = useApp();
  const { data, isLoading } = useSWR<LeaderboardResponse>(
    ["/api/leaderboard", period],
    ([p, per]: [string, Period]) => api<LeaderboardResponse>(`${p}?period=${per}`, null),
    { refreshInterval: 5000, keepPreviousData: true },
  );

  // Überholmanöver erkennen: gleiche Periode, Rang hat sich zugunsten eines anderen verschoben
  const prev = useRef<{ period: Period; order: string[] } | null>(null);
  useEffect(() => {
    if (!data || data.period !== period) return;
    const order = data.entries.map((e) => e.id);
    const before = prev.current;
    prev.current = { period, order };
    if (!before || before.period !== period) return;
    const pointsById = new Map(data.entries.map((e) => [e.id, e.points]));
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      const oldIdx = before.order.indexOf(id);
      if (oldIdx > i && (pointsById.get(id) ?? 0) > 0) {
        const overtaken = before.order[i];
        if (overtaken && overtaken !== id) {
          toast({ emoji: i === 0 ? "👑" : "🚀", title: `${nameOf(id)} überholt ${nameOf(overtaken)}!`, body: i === 0 ? "Neue Krone, neue Probleme." : `Jetzt auf Platz ${i + 1}` });
          sfx(i === 0 ? "airhorn" : "fanfare");
          confettiCannons();
          break;
        }
      }
    }
  }, [data, period, toast, sfx]);

  const entries = data?.entries ?? [];
  const anyPoints = entries.some((e) => e.points > 0);

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-block -rotate-2 border-[3px] border-ink bg-alarm px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-paper shadow-[3px_3px_0_var(--ink)]">
            Saison {MONTH}
          </p>
          <h1 className="display text-5xl sm:text-7xl">
            Wer mobbt<br />am <span className="text-alarm">meisten?</span>
          </h1>
        </div>
        <div role="tablist" aria-label="Zeitraum" className="flex border-[3px] border-ink bg-paper shadow-[4px_4px_0_var(--ink)]">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={period === p.id}
              onClick={() => setPeriod(p.id)}
              className={cn("min-h-11 flex-1 px-3 text-xs font-extrabold uppercase tracking-wide transition-colors sm:px-4 sm:text-sm", period === p.id ? "bg-ink text-sun" : "hover:bg-sun")}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {data && data.pendingCount > 0 && (
        <Link href="/tribunal" className="hazard block border-[3px] border-ink p-1 shadow-[4px_4px_0_var(--ink)]">
          <span className="block bg-paper px-4 py-2 text-center text-sm font-extrabold uppercase tracking-wide">
            ⚖️ {data.pendingCount} {data.pendingCount === 1 ? "Fall wartet" : "Fälle warten"} auf ein Urteil – ab ins Tribunal ➜
          </span>
        </Link>
      )}

      {isLoading && !data ? (
        <div className="space-y-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-20" />
        </div>
      ) : !anyPoints ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="brut p-8 text-center">
          <p className="text-6xl" aria-hidden>🕊️</p>
          <p className="display mt-3 text-3xl">Verdächtig friedlich hier.</p>
          <p className="mx-auto mt-2 max-w-md">In diesem Zeitraum gab es noch keinen bestätigten Fall. Das kann so nicht bleiben.</p>
          <Link href="/melden" className="btn btn-alarm mt-5">🚨 Ersten Fall melden</Link>
        </motion.div>
      ) : (
        <>
          <section className="pt-10">
            <Podium entries={entries} onOpen={setProfile} />
          </section>
          {entries.length > 3 && (
            <section>
              <Rows entries={entries.slice(3)} onOpen={setProfile} />
            </section>
          )}
        </>
      )}

      {data && data.recent.length > 0 && (
        <section>
          <SectionTitle kicker="Frisch aus dem Tribunal">Letzte Fälle</SectionTitle>
          <div className="brut p-4 sm:p-6">
            <RecentFeed items={data.recent} />
          </div>
        </section>
      )}

      <ProfileDialog id={profile} onClose={() => setProfile(null)} />
    </div>
  );
}
