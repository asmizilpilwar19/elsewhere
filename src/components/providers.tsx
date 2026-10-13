"use client";

import { MotionConfig } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { destinations } from "@/data/destinations";
import { DestinationOverlay } from "./destination-overlay";

/* ---------------- Journal (localStorage) ---------------- */

const JOURNAL_KEY = "elsewhere:journal";
const journalListeners = new Set<() => void>();
const EMPTY = "[]";

function readJournal(): string {
  try {
    return window.localStorage.getItem(JOURNAL_KEY) ?? EMPTY;
  } catch {
    return memoryJournal;
  }
}
let memoryJournal = EMPTY;

function writeJournal(slugs: string[]) {
  const raw = JSON.stringify(slugs);
  memoryJournal = raw;
  try {
    window.localStorage.setItem(JOURNAL_KEY, raw);
  } catch {
    /* storage unavailable — keep in memory for this session */
  }
  journalListeners.forEach((l) => l());
}

function subscribeJournal(cb: () => void) {
  journalListeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === JOURNAL_KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    journalListeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function parse(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    const valid = new Set(destinations.map((d) => d.slug));
    return v.filter((s): s is string => typeof s === "string" && valid.has(s));
  } catch {
    return [];
  }
}

/* ---------------- Theme ---------------- */

export type Theme = "day" | "night";
const THEME_KEY = "elsewhere:theme";
const themeListeners = new Set<() => void>();

function subscribeTheme(cb: () => void) {
  themeListeners.add(cb);
  return () => void themeListeners.delete(cb);
}
const getTheme = (): Theme => (document.documentElement.dataset.theme === "night" ? "night" : "day");

/* ---------------- Context ---------------- */

interface Ctx {
  saved: string[];
  isSaved: (slug: string) => boolean;
  toggleSaved: (slug: string) => void;
  clearSaved: () => void;
  theme: Theme;
  toggleTheme: () => void;
  openSlug: string | null;
  /** where the portal opens from (viewport px); defaults to screen centre */
  origin: { x: number; y: number } | null;
  openDestination: (slug: string, origin?: { x: number; y: number }) => void;
  closeDestination: () => void;
}

const AppContext = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppContext);
  if (!c) throw new Error("useApp must be used inside <Providers>");
  return c;
}

export function Providers({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribeJournal, readJournal, () => EMPTY);
  const saved = useMemo(() => parse(raw), [raw]);
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "day" as Theme);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  const toggleSaved = useCallback((slug: string) => {
    const current = parse(readJournal());
    writeJournal(current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]);
  }, []);
  const clearSaved = useCallback(() => writeJournal([]), []);
  const isSaved = useCallback((slug: string) => saved.includes(slug), [saved]);

  const toggleTheme = useCallback(() => {
    const next: Theme = getTheme() === "night" ? "day" : "night";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    themeListeners.forEach((l) => l());
  }, []);

  const openDestination = useCallback((slug: string, o?: { x: number; y: number }) => {
    // only a fresh opening sets the portal origin; prev/next inside the overlay keep it
    setOrigin((prev) => o ?? prev);
    setOpenSlug(slug);
  }, []);
  const closeDestination = useCallback(() => {
    setOpenSlug(null);
    setOrigin(null);
  }, []);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", theme === "night" ? "#0B1530" : "#17294C");
  }, [theme]);

  const value = useMemo<Ctx>(
    () => ({ saved, isSaved, toggleSaved, clearSaved, theme, toggleTheme, openSlug, origin, openDestination, closeDestination }),
    [saved, isSaved, toggleSaved, clearSaved, theme, toggleTheme, openSlug, origin, openDestination, closeDestination],
  );

  return (
    <AppContext.Provider value={value}>
      <MotionConfig reducedMotion="user">
        {children}
        <DestinationOverlay />
      </MotionConfig>
    </AppContext.Provider>
  );
}
