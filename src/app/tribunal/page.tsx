"use client";

import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useApp } from "@/components/providers";
import { Avatar, nameOf, SectionTitle, Skeleton, Stamp } from "@/components/ui";
import { api } from "@/lib/api";
import { cn, timeAgo } from "@/lib/format";
import { confettiCannons } from "@/lib/fx";
import type { IncidentDTO, TribunalResponse } from "@/lib/types";

type Verdict = "approve" | "reject";
type VoteResult = { status: "pending" | "committed" | "rejected"; confessed: boolean; points: number };

export default function TribunalPage() {
  const { me, sfx, toast } = useApp();
  const { mutate: globalMutate } = useSWRConfig();
  const { data, isLoading, mutate } = useSWR<TribunalResponse>(
    ["/api/tribunal", me],
    ([p, m]: [string, string | null]) => api<TribunalResponse>(p, m),
    { refreshInterval: 10_000, keepPreviousData: true },
  );

  const [gone, setGone] = useState<Set<string>>(new Set());
  const [exitDir, setExitDir] = useState<1 | -1>(1);
  const [stamp, setStamp] = useState<{ verdict: Verdict; key: number } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const queue = (data?.toJudge ?? []).filter((i) => !gone.has(i.id));
  const current = queue[0];

  const vote = useCallback(
    async (incident: IncidentDTO, verdict: Verdict) => {
      setExitDir(verdict === "approve" ? 1 : -1);
      setGone((g) => new Set(g).add(incident.id));
      setStamp({ verdict, key: Date.now() });
      setShakeKey((k) => k + 1);
      sfx("stamp");
      setTimeout(() => setStamp(null), 1100);
      try {
        const res = await api<VoteResult>(`/api/incidents/${incident.id}/vote`, me, { method: "POST", body: JSON.stringify({ verdict }) });
        if (res.status === "committed") {
          setTimeout(() => {
            confettiCannons();
            sfx(res.confessed ? "airhorn" : "fanfare");
          }, 350);
          toast({
            emoji: res.confessed ? "🙏" : "✅",
            title: res.confessed ? `Geständnis! ${nameOf(incident.accusedId)} +${res.points}` : `Bestätigt: ${nameOf(incident.accusedId)} +${res.points}`,
            body: `${incident.categoryLabel} → ${nameOf(incident.victimId)}`,
          });
        } else if (res.status === "rejected") {
          sfx("nope");
          toast({ emoji: "🗑️", title: "Verfahren eingestellt", body: "Zwei Ablehnungen – der Fall ist vom Tisch." });
        } else if (verdict === "reject") {
          toast({ emoji: "🗳️", title: "Ablehnung gezählt", body: "Eine zweite Ablehnung stellt den Fall ein." });
        }
        void mutate();
        void globalMutate((k) => Array.isArray(k) && (k[0] === "/api/ticker" || k[0] === "/api/leaderboard"));
      } catch (e) {
        setGone((g) => {
          const n = new Set(g);
          n.delete(incident.id);
          return n;
        });
        sfx("nope");
        toast({ emoji: "🚫", title: "Urteil ungültig", body: e instanceof Error ? e.message : "Fehler" });
      }
    },
    [me, sfx, toast, mutate, globalMutate],
  );

  // Pfeiltasten für Desktop
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight") void vote(current, "approve");
      if (e.key === "ArrowLeft") void vote(current, "reject");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, vote]);

  return (
    <div className="space-y-10">
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-alarm">Hohes Gericht der Kaffeeküche</p>
        <h1 className="display text-5xl sm:text-6xl">Das Tribunal</h1>
        <p className="mt-3 max-w-xl">
          Wische nach <b className="text-blue-2">rechts</b> zum Bestätigen, nach <b className="text-danger">links</b> zum Ablehnen (oder Pfeiltasten ← →). Eine Bestätigung genügt, zwei Ablehnungen kippen den Fall.
        </p>
      </div>

      <section key={shakeKey} className={cn("relative mx-auto max-w-md", shakeKey > 0 && "shake")}>
        {isLoading && !data ? (
          <Skeleton className="h-96" />
        ) : !current ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="brut p-8 text-center">
            <p className="text-6xl" aria-hidden>🕊️</p>
            <p className="display mt-3 text-3xl">Alles abgearbeitet</p>
            <p className="mt-2">Keine offenen Fälle für dich. Das Büro atmet auf – oder plant schon den nächsten Streich.</p>
            <Link href="/melden" className="btn btn-alarm mt-5">🚨 Fall melden</Link>
          </motion.div>
        ) : (
          <>
            <div className="relative h-[33rem]">
              <AnimatePresence custom={exitDir} mode="popLayout">
                {queue.slice(0, 3).reverse().map((inc) => (
                  <SwipeCard key={inc.id} incident={inc} depth={queue.indexOf(inc)} exitDir={exitDir} onVote={(v) => vote(inc, v)} />
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-6 flex items-center justify-center gap-4">
              <button className="btn btn-danger min-w-36" onClick={() => vote(current, "reject")}>❌ Ablehnen</button>
              <span className="text-sm font-bold opacity-60">{queue.length} offen</span>
              <button className="btn btn-ok min-w-36" onClick={() => vote(current, "approve")}>✅ Bestätigen</button>
            </div>
          </>
        )}

        <AnimatePresence>
          {stamp && (
            <motion.div key={stamp.key} className="pointer-events-none fixed inset-0 z-[80] grid place-items-center" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Stamp tone={stamp.verdict === "approve" ? "approve" : "reject"} className="bg-paper">
                {stamp.verdict === "approve" ? "Bestätigt" : "Abgelehnt"}
              </Stamp>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section>
        <SectionTitle kicker="Nur für deine Augen">Meine eingereichten Fälle</SectionTitle>
        {!data || data.mine.length === 0 ? (
          <p className="opacity-70">Du hast noch nichts gemeldet. Feigling.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.mine.map((i) => (
              <li key={i.id} className="brut-sm flex items-center gap-3 bg-paper p-3">
                <span className="text-2xl" aria-hidden>{i.emoji}</span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate font-bold">{nameOf(i.accusedId)} ➜ {nameOf(i.victimId)}</span>
                  <span className="block truncate text-sm opacity-70">{i.categoryLabel} · {timeAgo(i.createdAt)}</span>
                </span>
                <StatusChip incident={i} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusChip({ incident }: { incident: IncidentDTO }) {
  if (incident.status === "committed") return <span className="chip bg-mint">✅ +{incident.points}</span>;
  if (incident.status === "rejected") return <span className="chip bg-danger text-paper">🗑️ eingestellt</span>;
  return <span className="chip bg-sun text-paper">⏳ wartet</span>;
}

function SwipeCard({
  incident,
  depth,
  exitDir,
  onVote,
}: {
  incident: IncidentDTO;
  depth: number;
  exitDir: 1 | -1;
  onVote: (v: Verdict) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const yes = useTransform(x, [30, 130], [0, 1]);
  const no = useTransform(x, [-130, -30], [1, 0]);
  const top = depth === 0;

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 110 || info.velocity.x > 700) onVote("approve");
    else if (info.offset.x < -110 || info.velocity.x < -700) onVote("reject");
  }

  return (
    <motion.article
      layout
      drag={top ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      style={{ ...(top ? { x, rotate } : {}), zIndex: 10 - depth }}
      initial={{ scale: 0.9, y: 30, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 16, rotate: top ? undefined : depth % 2 ? 3 : -3, opacity: 1 }}
      exit={{ x: exitDir * 700, rotate: exitDir * 28, opacity: 0, transition: { duration: 0.4, ease: "easeIn" } }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className={cn("brut absolute inset-x-0 top-0 touch-pan-y select-none overflow-hidden bg-paper", top ? "cursor-grab active:cursor-grabbing" : "pointer-events-none")}
      aria-label={`Fall: ${nameOf(incident.accusedId)} gegen ${nameOf(incident.victimId)}`}
    >
      <div className="hazard h-3" />
      <div className="p-5">
        <p className="text-center text-xs font-extrabold uppercase tracking-[0.25em] text-alarm">Akte · {timeAgo(incident.createdAt)}</p>
        <div className="mt-4 flex items-center justify-around gap-2">
          <Party id={incident.accusedId} role="Täter:in" />
          <span className="display text-4xl text-alarm" aria-hidden>➜</span>
          <Party id={incident.victimId} role="Opfer" />
        </div>
        <div className="mt-5 border-y-[3px] border-dashed border-ink py-4 text-center">
          <p className="text-5xl" aria-hidden>{incident.emoji}</p>
          <p className="display mt-2 text-2xl">{incident.categoryLabel}</p>
          {incident.categoryDescription && <p className="mx-auto mt-1 max-w-xs text-sm opacity-70">{incident.categoryDescription}</p>}
          <p className="display mt-1 text-4xl text-alarm">+{incident.points}</p>
        </div>
        <p className="mt-4 min-h-12 text-center italic">{incident.note ? `„${incident.note}“` : <span className="opacity-50">Keine Aussage zur Sache.</span>}</p>
      </div>
      {top && (
        <>
          <motion.div style={{ opacity: yes }} className="pointer-events-none absolute left-4 top-10 -rotate-12 border-[5px] border-blue-2 px-3 py-1 display text-3xl text-blue-2">Bestätigt</motion.div>
          <motion.div style={{ opacity: no }} className="pointer-events-none absolute right-4 top-10 rotate-12 border-[5px] border-danger px-3 py-1 display text-3xl text-danger">Abgelehnt</motion.div>
        </>
      )}
    </motion.article>
  );
}

function Party({ id, role }: { id: string; role: string }) {
  return (
    <div className="flex w-28 flex-col items-center gap-1 text-center">
      <Avatar id={id} size={80} className="shadow-[4px_4px_0_var(--ink)]" />
      <span className="display text-xl">{nameOf(id)}</span>
      <span className="text-[0.65rem] font-extrabold uppercase tracking-wider opacity-60">{role}</span>
    </div>
  );
}
