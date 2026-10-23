"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useApp } from "@/components/providers";
import { Avatar, nameOf, SectionTitle, Stamp } from "@/components/ui";
import { MAX_CATEGORY_DESCRIPTION, MAX_CATEGORY_LABEL, MAX_CATEGORY_POINTS, MIN_CATEGORY_POINTS, type Category } from "@/config/categories";
import { COWORKERS } from "@/config/coworkers";
import { api } from "@/lib/api";
import { cn, normalize } from "@/lib/format";
import { confettiBurst } from "@/lib/fx";
import { MAX_NOTE_LENGTH } from "@/lib/rules";

export default function MeldenPage() {
  const { me, sfx, toast } = useApp();
  const { mutate } = useSWRConfig();
  const { data: categories, mutate: reloadCategories } = useSWR<Category[]>("/api/categories", (p: string) => api<Category[]>(p, null));

  const [accused, setAccused] = useState<string | null>(null);
  const [victim, setVictim] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [spinning, setSpinning] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<{ label: string; nonce: number } | null>(null);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const category = categories?.find((c) => c.id === categoryId) ?? null;
  const others = useMemo(() => COWORKERS.filter((c) => c.id !== me), [me]);
  const ready = !!(accused && victim && category) && accused !== victim;

  const q = normalize(query);
  const visible = useMemo(() => {
    const list = [...(categories ?? [])].reverse(); // neueste zuerst
    return q ? list.filter((c) => normalize(`${c.label} ${c.description ?? ""}`).includes(q)) : list;
  }, [categories, q]);
  const exactMatch = !!categories?.some((c) => normalize(c.label) === q);

  /** Roulette: Highlight springt durch alle Kandidaten und bremst ab */
  const spin = useCallback(() => {
    if (spinTimer.current) clearTimeout(spinTimer.current);
    const pool = others.filter((c) => c.id !== victim).map((c) => c.id);
    const target = pool[Math.floor(Math.random() * pool.length)];
    const steps = 18 + Math.floor(Math.random() * pool.length);
    let i = 0;
    const tick = () => {
      const id = pool[i % pool.length];
      setSpinning(id);
      sfx("pop");
      i++;
      if (i < steps || id !== target) {
        spinTimer.current = setTimeout(tick, 55 + Math.pow(i / steps, 3) * 380);
      } else {
        setSpinning(null);
        setAccused(target);
        sfx("fanfare");
        confettiBurst(0.5, 0.35);
      }
    };
    tick();
  }, [others, victim, sfx]);

  async function submit() {
    if (!ready || !accused || !victim || !category) return;
    setBusy(true);
    try {
      await api("/api/incidents", me, {
        method: "POST",
        body: JSON.stringify({ accusedId: accused, victimId: victim, categoryId: category.id, note: note.trim() || undefined }),
      });
      sfx("stamp");
      setStamped(true);
      void mutate((key) => Array.isArray(key) && (key[0] === "/api/ticker" || key[0] === "/api/leaderboard"));
      setTimeout(() => {
        setStamped(false);
        setAccused(null);
        setVictim(null);
        setCategoryId(null);
        setNote("");
      }, 2300);
    } catch (e) {
      sfx("nope");
      toast({ emoji: "🚫", title: "Abgelehnt", body: e instanceof Error ? e.message : "Unbekannter Fehler" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-alarm">Anzeige erstatten</p>
        <h1 className="display text-5xl sm:text-6xl">Fall melden</h1>
        <p className="mt-3 max-w-xl">
          Jemand hat zugeschlagen? Trag den Fall ein. Sobald <b>eine andere Person</b> ihn im Tribunal bestätigt, zählen die Punkte. Wer gemeldet hat, bleibt anonym.
        </p>
      </div>

      <section aria-labelledby="s1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle kicker="Schritt 1">
            <span id="s1">Wer war&apos;s?</span>
          </SectionTitle>
          <button className="btn btn-ink mb-4" onClick={spin} disabled={!!spinning}>🎰 Roulette</button>
        </div>
        <PersonGrid people={others.filter((c) => c.id !== victim)} value={accused} spinning={spinning} onPick={(id) => { sfx("pop"); setAccused(id); }} tone="alarm" label="Täter:in suchen" />
      </section>

      <section aria-labelledby="s2">
        <SectionTitle kicker="Schritt 2"><span id="s2">Wen hat&apos;s erwischt?</span></SectionTitle>
        <PersonGrid people={COWORKERS.filter((c) => c.id !== accused)} value={victim} onPick={(id) => { sfx("pop"); setVictim(id); }} tone="sky" meId={me} label="Opfer suchen" />
      </section>

      <section aria-labelledby="s3">
        <SectionTitle kicker="Schritt 3"><span id="s3">Was ist passiert?</span></SectionTitle>
        <label className="relative mb-4 block">
          <span className="sr-only">Kategorien durchsuchen</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl" aria-hidden>🔎</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={categories?.length ? `${categories.length} Kategorien durchsuchen …` : "Kategorie suchen oder neu anlegen …"}
            className="brut-sm w-full bg-paper py-3 pl-11 pr-3 text-base placeholder:opacity-50"
          />
        </label>

        <div className="grid max-h-[34rem] grid-cols-2 gap-3 overflow-y-auto p-1 md:grid-cols-3">
          {query.trim().length >= 2 && !exactMatch && !draft && (
            <motion.button
              whileHover={{ y: -3 }}
              onClick={() => setDraft({ label: capitalize(query.trim()), nonce: Date.now() })}
              className="flex min-h-28 flex-col items-center justify-center gap-1 border-[3px] border-dashed border-ink bg-sky p-3 text-center font-extrabold hover:bg-sun hover:text-paper"
            >
              <span className="text-3xl" aria-hidden>＋</span>
              <span className="leading-tight">„{query.trim()}“ neu anlegen</span>
            </motion.button>
          )}
          {draft && (
            <NewCategory
              key={draft.nonce}
              initialLabel={draft.label}
              onClose={() => setDraft(null)}
              onCreated={async (c) => {
                setDraft(null);
                setQuery("");
                await reloadCategories();
                setCategoryId(c.id);
                toast({ emoji: c.emoji, title: "Neue Kategorie angelegt", body: `${c.label} (+${c.points})` });
              }}
            />
          )}
          {visible.map((c) => (
            <motion.button
              key={c.id}
              layout
              whileHover={{ y: -3, rotate: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { sfx("pop"); setCategoryId(c.id); }}
              aria-pressed={categoryId === c.id}
              className={cn("brut-sm relative flex min-h-28 flex-col items-start gap-1 p-3 text-left transition-colors", categoryId === c.id ? "bg-sun text-paper" : "bg-paper hover:bg-white/50")}
            >
              <span className="text-3xl" aria-hidden>{c.emoji}</span>
              <span className="pr-8 text-sm font-extrabold leading-tight">{c.label}</span>
              {c.description && <span className="line-clamp-2 text-xs leading-snug opacity-70">{c.description}</span>}
              <span className="display absolute right-2 top-2 border-2 border-ink bg-alarm px-1.5 py-0.5 text-sm text-paper">+{c.points}</span>
              {categoryId === c.id && <span className="absolute bottom-2 right-3 text-xl" aria-hidden>✔️</span>}
            </motion.button>
          ))}
          {!draft && query.trim().length < 2 && (
            <motion.button
              whileHover={{ y: -3 }}
              onClick={() => setDraft({ label: "", nonce: Date.now() })}
              className="flex min-h-28 flex-col items-center justify-center gap-1 border-[3px] border-dashed border-ink bg-transparent p-3 font-extrabold hover:bg-sun hover:text-paper"
            >
              <span className="text-3xl" aria-hidden>＋</span>
              Eigene Kategorie
            </motion.button>
          )}
        </div>
        {categories && categories.length === 0 && !draft && (
          <p className="mt-3 text-sm opacity-70">Noch keine Kategorien – leg die erste an. Ab dann kann jede:r sie nutzen und durchsuchen.</p>
        )}
        {categories && categories.length > 0 && visible.length === 0 && query.trim().length >= 2 && (
          <p className="mt-3 text-sm opacity-70" aria-live="polite">Nichts gefunden. Leg „{query.trim()}“ einfach neu an.</p>
        )}
      </section>

      <section aria-labelledby="s4">
        <SectionTitle kicker="Optional"><span id="s4">Beweismaterial</span></SectionTitle>
        <label className="block">
          <span className="sr-only">Notiz</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
            rows={2}
            placeholder="Ein Satz für die Akten … („Vor versammelter Mannschaft!“)"
            className="brut-sm w-full resize-none bg-paper p-3 text-base placeholder:opacity-50"
          />
          <span className="mt-1 block text-right text-xs opacity-60">{note.length}/{MAX_NOTE_LENGTH}</span>
        </label>
      </section>

      <section className="brut sticky bottom-20 z-30 flex flex-col gap-3 bg-paper p-4 sm:flex-row sm:items-center md:bottom-4">
        <p className="flex-1 text-sm sm:text-base" aria-live="polite">
          {ready && accused && victim && category ? (
            <>
              <b>{nameOf(accused)}</b> <span className="text-alarm">➜</span> <b>{nameOf(victim)}</b>: {category.emoji} {category.label}{" "}
              <b className="text-alarm">(+{category.points})</b>
            </>
          ) : (
            <span className="opacity-70">Wähle Täter:in, Opfer und Kategorie, dann kann&apos;s losgehen.</span>
          )}
        </p>
        <button className="btn btn-alarm text-lg" disabled={!ready || busy} onClick={submit}>
          {busy ? "Wird abgelegt …" : "🚨 Fall einreichen"}
        </button>
      </section>

      <AnimatePresence>
        {stamped && (
          <motion.div className="pointer-events-none fixed inset-0 z-[80] grid place-items-center bg-ink/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="shake">
              <Stamp>Zur Prüfung vorgelegt</Stamp>
              <p className="mt-6 text-center font-extrabold uppercase tracking-wider text-paper drop-shadow-[0_2px_0_var(--ink)]">Jetzt muss ein:e Kolleg:in bestätigen ⚖️</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonGrid({
  people,
  value,
  onPick,
  spinning,
  tone,
  meId,
  label,
}: {
  people: typeof COWORKERS;
  value: string | null;
  onPick: (id: string) => void;
  spinning?: string | null;
  tone: "alarm" | "sky";
  meId?: string | null;
  label: string;
}) {
  const [q, setQ] = useState("");
  const nq = normalize(q);
  const shown = nq ? people.filter((c) => normalize(c.name).includes(nq)) : people;
  return (
    <div>
      <label className="relative mb-3 block max-w-xs">
        <span className="sr-only">{label}</span>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" aria-hidden>🔎</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && shown.length === 1) {
              onPick(shown[0].id);
              setQ("");
            }
          }}
          placeholder="Name suchen …"
          className="brut-sm w-full bg-paper py-2 pl-9 pr-3 text-base placeholder:opacity-50"
        />
      </label>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8" role="radiogroup" aria-label={label}>
        {shown.map((c) => {
          const selected = value === c.id;
          const lit = spinning === c.id;
          return (
            <motion.button
              key={c.id}
              role="radio"
              aria-checked={selected}
              whileTap={{ scale: 0.92 }}
              animate={selected ? { scale: 1.06, rotate: -2 } : { scale: lit ? 1.12 : 1, rotate: 0 }}
              onClick={() => onPick(c.id)}
              className={cn(
                "flex min-h-24 flex-col items-center justify-center gap-1.5 border-[3px] border-ink p-2 transition-colors",
                selected || lit ? (tone === "alarm" ? "bg-alarm text-paper" : "bg-sky") : "bg-paper hover:bg-sun hover:text-paper",
                (selected || lit) && "shadow-[4px_4px_0_var(--ink)]",
              )}
            >
              <Avatar id={c.id} size={44} />
              <span className="max-w-full truncate text-xs font-extrabold">{c.name}{meId === c.id ? " (du)" : ""}</span>
            </motion.button>
          );
        })}
        {shown.length === 0 && <p className="col-span-full text-sm opacity-70">Niemanden mit diesem Namen gefunden.</p>}
      </div>
    </div>
  );
}

function NewCategory({
  initialLabel,
  onCreated,
  onClose,
}: {
  initialLabel: string;
  onCreated: (c: Category) => void | Promise<void>;
  onClose: () => void;
}) {
  const { me, toast, sfx } = useApp();
  const [emoji, setEmoji] = useState("🤡");
  const [label, setLabel] = useState(initialLabel);
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(4);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const c = await api<Category>("/api/categories", me, { method: "POST", body: JSON.stringify({ label, emoji, points, description: description.trim() || undefined }) });
      sfx("fanfare");
      await onCreated(c);
    } catch (e) {
      toast({ emoji: "🚫", title: "Klappt nicht", body: e instanceof Error ? e.message : "Fehler" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="brut-sm col-span-2 flex flex-col gap-3 bg-sky p-3 md:col-span-3">
      <p className="font-extrabold uppercase">Neue Kategorie</p>
      <div className="flex gap-2">
        <input aria-label="Emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} className="w-16 border-[3px] border-ink bg-paper p-2 text-center text-2xl" />
        <input aria-label="Name" autoFocus={!initialLabel} value={label} onChange={(e) => setLabel(e.target.value.slice(0, MAX_CATEGORY_LABEL))} maxLength={MAX_CATEGORY_LABEL} placeholder="z. B. Kekse aufgegessen" className="min-w-0 flex-1 border-[3px] border-ink bg-paper p-2 text-base" />
      </div>
      <p className="-mt-2 text-right text-xs opacity-60">{label.length}/{MAX_CATEGORY_LABEL}</p>
      <label className="block">
        <span className="text-sm font-bold">Beschreibung <span className="font-normal opacity-60">(optional)</span></span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, MAX_CATEGORY_DESCRIPTION))}
          rows={2}
          placeholder="Was genau zählt hier? z. B. Die ganze Keksdose, ohne zu fragen."
          className="mt-1 w-full resize-none border-[3px] border-ink bg-paper p-2 text-base placeholder:opacity-50"
        />
        <span className="block text-right text-xs opacity-60">{description.length}/{MAX_CATEGORY_DESCRIPTION}</span>
      </label>
      <label className="flex items-center gap-3 text-sm font-bold">
        Punkte: <span className="display w-8 text-center text-2xl text-alarm">{points}</span>
        <input type="range" min={MIN_CATEGORY_POINTS} max={MAX_CATEGORY_POINTS} value={points} onChange={(e) => setPoints(+e.target.value)} className="flex-1 accent-[var(--alarm)]" />
      </label>
      <div className="flex gap-2">
        <button className="btn btn-alarm flex-1" disabled={busy || label.trim().length < 2 || !emoji.trim()} onClick={create}>Anlegen</button>
        <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
      </div>
    </div>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
