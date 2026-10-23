"use client";

import { motion } from "motion/react";
import useSWR from "swr";
import { Avatar, CountUp, nameOf, SectionTitle, Skeleton } from "@/components/ui";
import { COWORKER_BY_ID, COWORKERS } from "@/config/coworkers";
import { api } from "@/lib/api";
import { monthLabel, timeAgo } from "@/lib/format";
import { BADGES, type IncidentDTO, type Insights } from "@/lib/types";

export default function InsightsPage() {
  const { data } = useSWR<Insights>("/api/insights", (p: string) => api<Insights>(p, null), { refreshInterval: 15000 });

  return (
    <div className="space-y-12">
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-alarm">Die Zahlen lügen nicht</p>
        <h1 className="display text-5xl sm:text-6xl">Hall of Shame</h1>
      </div>

      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" />
        </div>
      ) : data.totals.incidents === 0 ? (
        <div className="brut p-8 text-center">
          <p className="text-6xl" aria-hidden>📉</p>
          <p className="display mt-3 text-3xl">Noch keine Daten</p>
          <p className="mt-2">Sobald der erste Fall bestätigt ist, wird es hier ungemütlich.</p>
        </div>
      ) : (
        <Content data={data} />
      )}
    </div>
  );
}

function Content({ data }: { data: Insights }) {
  return (
    <>
      <section className="grid grid-cols-3 gap-3">
        <Big label="Bestätigte Fälle" value={data.totals.incidents} />
        <Big label="Punkte verteilt" value={data.totals.points} />
        <Big label="Warten aufs Urteil" value={data.totals.pending} />
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {data.topIncident && <TopIncident title="🏆 Fall aller Zeiten" incident={data.topIncident} className="md:col-span-2" big />}
        {data.topIncidentOfWeek && <TopIncident title="🔥 Fall der Woche" incident={data.topIncidentOfWeek} />}
        {data.victimOfMonth || data.victimAllTime ? (
          <Card title="🎯 Opfer des Monats" tone="sky">
            {(() => {
              const v = data.victimOfMonth ?? data.victimAllTime!;
              return (
                <div className="flex items-center gap-4">
                  <Avatar id={v.id} size={72} className="shadow-[4px_4px_0_var(--ink)]" />
                  <div>
                    <p className="display text-3xl">{nameOf(v.id)}</p>
                    <p className="text-sm">{v.count}× Opfer {data.victimOfMonth ? "in diesem Monat" : "insgesamt"}. Du Armer.</p>
                  </div>
                </div>
              );
            })()}
          </Card>
        ) : null}
        {data.streak && (
          <Card title="🔥 Serientäter:in">
            <div className="flex items-center gap-4">
              <Avatar id={data.streak.id} size={72} className="shadow-[4px_4px_0_var(--ink)]" />
              <div>
                <p className="display text-3xl">{nameOf(data.streak.id)}</p>
                <p className="text-sm">{data.streak.days} Werktage in Folge aufgefallen.</p>
              </div>
            </div>
          </Card>
        )}
        {data.rivalry && <Rivalry r={data.rivalry} />}
      </section>

      <section>
        <SectionTitle kicker="Beliebte Disziplinen">Kategorien</SectionTitle>
        <div className="brut space-y-3 p-4 sm:p-6">
          {data.categories.slice(0, 10).map((c, idx) => {
            const max = data.categories[0].count;
            return (
              <div key={c.id} className="flex items-center gap-3">
                <span className="w-8 text-center text-2xl" aria-hidden>{c.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-sm font-bold">
                    <span className="truncate">{c.label}</span>
                    <span className="tabnum shrink-0">{c.count}× · {c.points} Pkt</span>
                  </div>
                  <div className="mt-1 h-4 border-2 border-ink bg-paper-2">
                    <motion.div className="h-full bg-alarm" initial={{ width: 0 }} whileInView={{ width: `${(c.count / max) * 100}%` }} viewport={{ once: true }} transition={{ delay: idx * 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle kicker="Wann schlägt das Büro zu?">Hochsaison</SectionTitle>
        <Heatmap h={data.heatmap} />
      </section>

      <section>
        <SectionTitle kicker="Die letzten 90 Tage">Punkte-Rennen</SectionTitle>
        <Race race={data.race} />
      </section>

      {data.monthlyWinners.length > 0 && (
        <section>
          <SectionTitle kicker="Ruhmeshalle">Mobbing-Könige der Vormonate</SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {data.monthlyWinners.slice(0, 6).map((w) => (
              <li key={w.month} className="brut-sm flex items-center gap-3 bg-paper p-3">
                <span className="relative">
                  <Avatar id={w.winnerId} size={52} />
                  <span className="absolute -right-2 -top-3 text-2xl" aria-hidden>👑</span>
                </span>
                <span className="leading-tight">
                  <span className="block text-xs font-extrabold uppercase tracking-wider opacity-60">{monthLabel(w.month)}</span>
                  <span className="display text-xl">{nameOf(w.winnerId)}</span>
                  <span className="block text-sm font-bold text-alarm">{w.points} Punkte</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle kicker="Alle Verdächtigen">Steckbriefe &amp; Abzeichen</SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2">
          {[...COWORKERS].sort((a, b) => (data.profiles[b.id]?.points ?? 0) - (data.profiles[a.id]?.points ?? 0)).map((c) => {
            const p = data.profiles[c.id];
            return (
              <li key={c.id} className="brut-sm bg-paper p-4">
                <div className="flex items-center gap-3">
                  <Avatar id={c.id} size={56} />
                  <div className="flex-1">
                    <p className="display text-2xl">{c.name}</p>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-60">{p.incidents} Fälle · {p.timesVictim}× Opfer</p>
                  </div>
                  <p className="display text-3xl text-alarm"><CountUp value={p.points} /></p>
                </div>
                <div className="mt-3 flex min-h-8 flex-wrap gap-2">
                  {p.badges.length === 0 && <span className="text-sm opacity-50">Keine Abzeichen. Noch.</span>}
                  {p.badges.map((b) => (
                    <span key={b} className="chip bg-sun" title={BADGES[b]?.description}>{BADGES[b]?.emoji} {BADGES[b]?.label}</span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-extrabold uppercase tracking-wide">Wie bekommt man Abzeichen?</summary>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {Object.values(BADGES).map((b) => (
              <li key={b.label}>{b.emoji} <b>{b.label}</b> – {b.description}</li>
            ))}
          </ul>
        </details>
      </section>
    </>
  );
}

function Big({ label, value }: { label: string; value: number }) {
  return (
    <div className="brut-sm bg-sun p-3 text-center">
      <p className="display text-4xl sm:text-6xl"><CountUp value={value} /></p>
      <p className="text-[0.65rem] font-extrabold uppercase tracking-wider sm:text-xs">{label}</p>
    </div>
  );
}

function Card({ title, children, tone, className }: { title: string; children: React.ReactNode; tone?: "sky"; className?: string }) {
  return (
    <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`brut p-5 ${className ?? ""}`} style={tone === "sky" ? { background: "var(--sky)" } : undefined}>
      <h3 className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em]">{title}</h3>
      {children}
    </motion.article>
  );
}

function TopIncident({ title, incident, className, big }: { title: string; incident: IncidentDTO; className?: string; big?: boolean }) {
  return (
    <Card title={title} className={className}>
      <div className="flex flex-wrap items-center gap-4">
        <span className={`display border-[3px] border-ink bg-alarm px-3 py-1 text-paper ${big ? "text-6xl" : "text-4xl"}`}>+{incident.points}</span>
        <div className="min-w-0 flex-1">
          <p className="display text-2xl sm:text-3xl">{incident.emoji} {incident.categoryLabel}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 font-bold">
            <Avatar id={incident.accusedId} size={28} /> {nameOf(incident.accusedId)} <span className="text-alarm">➜</span> <Avatar id={incident.victimId} size={28} /> {nameOf(incident.victimId)}
          </p>
          <p className="mt-1 text-sm opacity-70">{timeAgo(incident.createdAt)}{incident.note ? ` · „${incident.note}“` : ""}</p>
        </div>
      </div>
    </Card>
  );
}

function Rivalry({ r }: { r: NonNullable<Insights["rivalry"]> }) {
  const aPct = (r.aToB / r.total) * 100;
  return (
    <Card title="⚔️ Rivalen-Duell" className="md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-center"><Avatar id={r.a} size={64} className="mx-auto" /><p className="display mt-1 text-xl">{nameOf(r.a)}</p></div>
        <p className="display text-4xl sm:text-5xl"><span className="text-alarm">{r.aToB}</span> : <span className="text-alarm">{r.bToA}</span></p>
        <div className="text-center"><Avatar id={r.b} size={64} className="mx-auto" /><p className="display mt-1 text-xl">{nameOf(r.b)}</p></div>
      </div>
      <div className="mt-4 flex h-5 border-[3px] border-ink">
        <motion.div className="h-full" style={{ background: COWORKER_BY_ID[r.a]?.color }} initial={{ width: "50%" }} whileInView={{ width: `${aPct}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
        <div className="h-full flex-1" style={{ background: COWORKER_BY_ID[r.b]?.color }} />
      </div>
      <p className="mt-2 text-center text-sm">{r.total} Fälle untereinander – die Küche bebt.</p>
    </Card>
  );
}

function Heatmap({ h }: { h: Insights["heatmap"] }) {
  return (
    <div className="brut overflow-x-auto p-4 sm:p-6">
      <div className="grid min-w-[30rem] gap-1.5" style={{ gridTemplateColumns: "auto repeat(4, 1fr)" }} role="table" aria-label="Fälle nach Wochentag und Tageszeit">
        <span />
        {h.blocks.map((b) => <span key={b} className="pb-1 text-center text-[0.65rem] font-extrabold uppercase leading-tight">{b}</span>)}
        {h.weekdays.map((d, wi) => (
          <div key={d} className="contents" role="row">
            <span className="pr-2 pt-2 text-sm font-extrabold">{d}</span>
            {h.grid[wi].map((n, bi) => {
              const pct = h.max ? Math.round((n / h.max) * 100) : 0;
              return (
                <motion.div
                  key={bi}
                  role="cell"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: (wi + bi) * 0.03, type: "spring", stiffness: 400, damping: 20 }}
                  className="grid h-11 place-items-center border-2 border-ink text-sm font-extrabold"
                  style={{ background: `color-mix(in srgb, var(--alarm) ${pct}%, var(--paper))`, color: pct > 55 ? "var(--paper)" : "var(--ink)" }}
                  title={`${d}, ${h.blocks[bi]}: ${n} Fälle`}
                >
                  {n || ""}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Race({ race }: { race: Insights["race"] }) {
  const W = 640, H = 280, PAD = { l: 36, r: 56, t: 16, b: 28 };
  const n = race.days.length;
  const top = [...race.series].sort((a, b) => (b.values.at(-1) ?? 0) - (a.values.at(-1) ?? 0)).slice(0, 5);
  const max = Math.max(1, ...top.flatMap((s) => s.values));
  if (n < 2) return <p className="brut p-6 text-center">Zu wenig Daten für ein Rennen.</p>;
  const x = (i: number) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);
  return (
    <div className="brut p-3 sm:p-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Liniendiagramm der kumulierten Punkte der Top 5">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(max * t)} y2={y(max * t)} stroke="var(--ink)" strokeOpacity=".15" strokeDasharray="4 4" />
            <text x={PAD.l - 6} y={y(max * t) + 4} textAnchor="end" fontSize="11" fill="var(--ink)">{Math.round(max * t)}</text>
          </g>
        ))}
        <text x={PAD.l} y={H - 8} fontSize="11" fill="var(--ink)">{race.days[0].slice(5).split("-").reverse().join(".")}.</text>
        <text x={W - PAD.r} y={H - 8} fontSize="11" textAnchor="end" fill="var(--ink)">heute</text>
        {top.map((s, idx) => {
          const d = s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
          const color = COWORKER_BY_ID[s.id]?.color ?? "#999";
          const last = s.values.at(-1) ?? 0;
          return (
            <g key={s.id}>
              <motion.path d={d} fill="none" stroke="var(--ink)" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, delay: idx * 0.12, ease: "easeOut" }} />
              <motion.path d={d} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, delay: idx * 0.12, ease: "easeOut" }} />
              <motion.g initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.6 + idx * 0.12 }}>
                <circle cx={x(n - 1)} cy={y(last)} r="13" fill={color} stroke="var(--ink)" strokeWidth="3" />
                <text x={x(n - 1)} y={y(last) + 5} textAnchor="middle" fontSize="14">{COWORKER_BY_ID[s.id]?.emoji}</text>
              </motion.g>
            </g>
          );
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
        {top.map((s) => (
          <li key={s.id} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-5 border-2 border-ink" style={{ background: COWORKER_BY_ID[s.id]?.color }} /> {nameOf(s.id)} ({s.values.at(-1)})
          </li>
        ))}
      </ul>
    </div>
  );
}
