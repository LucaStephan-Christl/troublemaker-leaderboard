export type Category = {
  id: string;
  label: string;
  emoji: string;
  points: number;
  /** true = von einem Kollegen in der App angelegt */
  custom?: boolean;
};

export const MIN_CATEGORY_POINTS = 1;
export const MAX_CATEGORY_POINTS = 10;

/** Start-Kategorien. Weitere können Kolleg:innen direkt in der App anlegen. */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "stuhl-versteckt", label: "Stuhl versteckt", emoji: "🪑", points: 3 },
  { id: "kaffee-leer", label: "Kaffeemaschine leer gelassen", emoji: "☕", points: 2 },
  { id: "mittagessen-geklaut", label: "Mittagessen „geliehen“", emoji: "🥪", points: 5 },
  { id: "meeting-gesprengt", label: "Meeting gesprengt", emoji: "🙄", points: 4 },
  { id: "peinliches-foto", label: "Peinliches Foto im Teamchat", emoji: "📸", points: 6 },
  { id: "hintergrundbild", label: "Hintergrundbild umgestellt", emoji: "🖼️", points: 4 },
  { id: "laut-telefoniert", label: "Laut telefoniert im Großraum", emoji: "📢", points: 3 },
  { id: "tastatur-layout", label: "Tastatur-Layout verstellt", emoji: "⌨️", points: 5 },
  { id: "frischhaltefolie", label: "Schreibtisch in Folie gewickelt", emoji: "🎁", points: 8 },
  { id: "airhorn", label: "Airhorn im Büro", emoji: "🎺", points: 7 },
  { id: "antwort-an-alle", label: "„Antwort an alle“-Desaster", emoji: "📧", points: 5 },
  { id: "kuchen-allein", label: "Geburtstagskuchen allein gegessen", emoji: "🍰", points: 9 },
  { id: "ticket-zugeschoben", label: "Ticket heimlich zugeschoben", emoji: "🎫", points: 6 },
  { id: "ladekabel", label: "Ladekabel entführt", emoji: "🔌", points: 4 },
];
