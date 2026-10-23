"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { COWORKERS } from "@/config/coworkers";
import { api } from "@/lib/api";
import { cn, normalize } from "@/lib/format";
import type { TickerResponse } from "@/lib/types";
import { AppProvider, useApp } from "./providers";
import { Avatar, nameOf, TrihowMark } from "./ui";

const NAV = [
  { href: "/", label: "Rangliste", icon: "🏆" },
  { href: "/melden", label: "Melden", icon: "🚨" },
  { href: "/tribunal", label: "Tribunal", icon: "⚖️" },
  { href: "/insights", label: "Insights", icon: "📊" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ShellInner>{children}</ShellInner>
    </AppProvider>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { me, ready } = useApp();
  const isTv = pathname.startsWith("/tv");
  if (isTv) return <>{children}<Toasts /></>;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-6 md:pb-16">{ready && me ? children : null}</main>
      <MobileNav />
      <Toasts />
      {ready && !me && <IdentityGate />}
    </>
  );
}

/* ---------- Kopf, Ticker, Navigation ---------- */

function useTicker() {
  const { me } = useApp();
  return useSWR<TickerResponse>(["/api/ticker", me], ([p, m]: [string, string | null]) => api<TickerResponse>(p, m), {
    refreshInterval: 10_000,
    keepPreviousData: true,
  });
}

function Header() {
  const pathname = usePathname();
  const { me, setMe, muted, toggleMute } = useApp();
  const { data } = useTicker();
  useNewIncidentToasts(data);

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2" aria-label="Troublemaker-Board – Startseite">
          <span className="grid h-11 w-11 -rotate-6 place-items-center border-[3px] border-ink bg-paper shadow-[3px_3px_0_var(--ink)] transition-transform group-hover:rotate-6"><TrihowMark size={30} /></span>
          <span className="display text-base leading-none sm:text-2xl">
            Troublemaker<span className="text-alarm">-</span>
            <br className="sm:hidden" />
            Board
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
          {NAV.map((n) => (
            <NavLink key={n.href} {...n} active={pathname === n.href} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/tv" className="chip hidden hover:bg-sun hover:text-paper sm:inline-flex" title="Büro-Bildschirm-Modus">📺 TV</Link>
          <button className="btn btn-ghost !min-h-10 !px-3 !py-1" onClick={toggleMute} aria-pressed={!muted} aria-label={muted ? "Ton einschalten" : "Ton ausschalten"} title={muted ? "Ton ist aus" : "Ton ist an"}>
            {muted ? "🔇" : "🔊"}
          </button>
          {me && (
            <button className="flex items-center gap-2 border-[3px] border-ink bg-paper py-1 pl-1 pr-3 shadow-[3px_3px_0_var(--ink)] transition-transform hover:-translate-y-px" onClick={() => setMe(null)} title="Person wechseln" aria-label={`Du bist ${nameOf(me)}. Person wechseln`}>
              <Avatar id={me} size={32} />
              <span className="hidden text-sm font-bold sm:inline">{nameOf(me)}</span>
            </button>
          )}
        </div>
      </div>
      <Marquee data={data} />
    </header>
  );
}

function NavLink({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  const { me } = useApp();
  const { data } = useTicker();
  const badge = href === "/tribunal" && me ? data?.openForMe ?? 0 : 0;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-11 items-center gap-2 border-[3px] px-3 text-sm font-extrabold uppercase tracking-wide transition-colors",
        active ? "border-ink bg-ink text-paper" : "border-transparent hover:border-ink hover:bg-sun hover:text-paper",
      )}
    >
      <span aria-hidden>{icon}</span>
      {label}
      {badge > 0 && (
        <span className="pulse-ring ml-1 grid min-w-6 place-items-center rounded-full border-2 border-ink bg-alarm px-1.5 text-xs text-paper" aria-label={`${badge} offene Fälle`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t-[3px] border-ink bg-paper md:hidden" aria-label="Hauptnavigation">
      {NAV.map((n) => (
        <MobileLink key={n.href} {...n} active={pathname === n.href} />
      ))}
    </nav>
  );
}

function MobileLink({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  const { me } = useApp();
  const { data } = useTicker();
  const badge = href === "/tribunal" && me ? data?.openForMe ?? 0 : 0;
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-extrabold uppercase", active ? "bg-ink text-paper" : "")}>
      <span className="text-xl" aria-hidden>{icon}</span>
      {label}
      {badge > 0 && <span className="absolute right-[22%] top-1.5 grid min-w-5 place-items-center rounded-full border-2 border-ink bg-alarm px-1 text-[0.65rem] text-paper">{badge}</span>}
    </Link>
  );
}

function Marquee({ data }: { data?: TickerResponse }) {
  const items = data?.recent ?? [];
  const text = items.length
    ? items.map((i) => `${i.emoji} ${nameOf(i.accusedId)} ➜ ${nameOf(i.victimId)}: ${i.categoryLabel} (+${i.points})`)
    : ["🕊️ Noch keine bestätigten Fälle – das Büro ist verdächtig friedlich"];
  const row = (
    <>
      {text.map((t, idx) => (
        <span key={idx} className="px-6 text-xs font-extrabold uppercase tracking-wider">
          {t} <span className="text-paper">●</span>
        </span>
      ))}
    </>
  );
  return (
    <div className="marquee overflow-hidden border-t-[3px] border-ink bg-sun py-1.5 text-paper" aria-label="Neueste Fälle">
      <div className="marquee-track" aria-hidden>
        {row}
        {row}
      </div>
    </div>
  );
}

/** Toast, sobald irgendwo im Büro ein neuer Fall bestätigt wurde */
function useNewIncidentToasts(data: TickerResponse | undefined) {
  const { toast, sfx } = useApp();
  const seen = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!data) return;
    const top = data.recent[0]?.id ?? null;
    if (seen.current === undefined) {
      seen.current = top;
      return;
    }
    if (top && top !== seen.current) {
      const fresh: typeof data.recent = [];
      for (const i of data.recent) {
        if (i.id === seen.current) break;
        fresh.push(i);
      }
      seen.current = top;
      for (const i of fresh.slice(0, 2).reverse()) {
        toast({ emoji: i.emoji, title: `${nameOf(i.accusedId)} kassiert +${i.points}`, body: `${i.categoryLabel} → ${nameOf(i.victimId)}` });
      }
      sfx("pop");
    }
  }, [data, toast, sfx]);
}

/* ---------- Toasts ---------- */
function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ x: 120, opacity: 0, rotate: 4 }}
            animate={{ x: 0, opacity: 1, rotate: -1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="brut-sm flex max-w-sm items-center gap-3 bg-sun px-4 py-3 text-paper"
          >
            <span className="text-3xl" aria-hidden>{t.emoji}</span>
            <span>
              <span className="block font-extrabold leading-tight">{t.title}</span>
              {t.body && <span className="block text-sm leading-tight">{t.body}</span>}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------- „Wer bist du?“ ---------- */
function IdentityGate() {
  const { setMe, sfx } = useApp();
  const [q, setQ] = useState("");
  const nq = normalize(q);
  const shown = nq ? COWORKERS.filter((c) => normalize(c.name).includes(nq)) : COWORKERS;
  const choose = (id: string) => { sfx("pop"); setMe(id); };
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-ink/80 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="who">
      <motion.div
        initial={{ y: 40, opacity: 0, rotate: -2 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="brut mx-auto my-8 max-w-2xl p-6 sm:p-8"
      >
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-alarm">Zutritt nur für Kolleg:innen</p>
        <h1 id="who" className="display text-4xl sm:text-5xl">Wer bist du?</h1>
        <p className="mb-6 mt-3 max-w-prose">
          Keine Accounts, keine Passwörter – reine Ehrensache. Wir vertrauen dir. <span className="opacity-60">(Nicht wirklich.)</span>
        </p>
        <label className="relative mb-4 block">
          <span className="sr-only">Name suchen</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl" aria-hidden>🔎</span>
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && shown.length === 1) choose(shown[0].id); }}
            placeholder="Name suchen …"
            className="brut-sm w-full bg-paper py-3 pl-11 pr-3 text-base placeholder:opacity-50"
          />
        </label>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {shown.length === 0 && <p className="col-span-full opacity-70">Niemanden mit diesem Namen gefunden.</p>}
          {shown.map((c, idx) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
              whileHover={{ y: -4, rotate: idx % 2 ? 2 : -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => choose(c.id)}
              className="brut-sm flex min-h-24 flex-col items-center justify-center gap-2 bg-paper p-2 hover:bg-sun hover:text-paper"
            >
              <Avatar id={c.id} size={56} />
              <span className="font-extrabold">{c.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
