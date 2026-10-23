import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/** Nur selbst angelegte Kategorien. Die Start-Kategorien liegen in src/config. */
export const customCategories = pgTable("custom_categories", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  emoji: text("emoji").notNull(),
  points: integer("points").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  accusedId: text("accused_id").notNull(),
  victimId: text("victim_id").notNull(),
  categoryId: text("category_id").notNull(),
  /** Punkte der Kategorie zum Zeitpunkt der Einreichung */
  points: integer("points").notNull(),
  note: text("note"),
  /** Wird niemals über die API ausgeliefert (Anonymität). */
  submittedBy: text("submitted_by").notNull(),
  status: text("status", { enum: ["pending", "committed", "rejected"] })
    .notNull()
    .default("pending"),
  /** Der Beschuldigte hat selbst bestätigt -> Geständnis-Bonus */
  confessed: boolean("confessed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    incidentId: uuid("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    /** Wird niemals über die API ausgeliefert (Anonymität). */
    voterId: text("voter_id").notNull(),
    verdict: text("verdict", { enum: ["approve", "reject"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("votes_incident_voter_uq").on(t.incidentId, t.voterId)],
);

export type IncidentRow = typeof incidents.$inferSelect;
export type VoteRow = typeof votes.$inferSelect;
