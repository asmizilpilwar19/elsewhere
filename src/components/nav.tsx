"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useApp } from "./providers";
import { Close, MoonIcon, PlaceMark, SunIcon } from "./ui";

const links = [
  { href: "#destinations", label: "Explore" },
  { href: "#atlas", label: "Dream Atlas" },
  { href: "#story", label: "Our Story" },
];

export function Nav() {
  const { theme, toggleTheme, saved } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const night = theme === "night";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav
        aria-label="Primary"
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2.5 text-sand transition-[background-color,box-shadow] duration-500 sm:px-6 ${
          scrolled || open ? "bg-midnight/85 shadow-[0_10px_40px_-12px_rgba(5,10,28,0.7)]" : "bg-transparent"
        }`}
      >
        <a href="#top" className="font-serif text-xl tracking-[0.32em] sm:text-2xl" aria-label="ELSEWHERE — back to top">
          ELSEWHERE
        </a>

        <ul className="hidden items-center gap-9 text-[0.78rem] font-medium uppercase tracking-[0.2em] md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="relative py-1 opacity-85 transition-opacity hover:opacity-100 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-sunset after:transition-transform after:duration-500 hover:after:scale-x-100">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={night}
            aria-label={night ? "Switch to sunset" : "Switch to night"}
            title={night ? "Switch to sunset" : "Switch to night"}
            className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-sand/10"
          >
            {night ? <SunIcon /> : <MoonIcon />}
          </button>
          <a
            href="#journal"
            aria-label={`Travel Journal — ${saved.length} saved ${saved.length === 1 ? "place" : "places"}`}
            title="Saved places"
            className="relative grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-sand/10"
          >
            <PlaceMark filled={saved.length > 0} />
            {saved.length > 0 && (
              <motion.span
                key={saved.length}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sunset px-1 text-[0.65rem] font-bold text-midnight"
              >
                {saved.length}
              </motion.span>
            )}
          </a>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand/10 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? (
              <Close />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                <path d="M4 8h16M4 16h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-2 max-w-6xl rounded-3xl bg-midnight/95 p-6 text-sand md:hidden"
          >
            <ul className="space-y-1">
              {[...links, { href: "#journal", label: "Travel Journal" }, { href: "#find", label: "Find Your Elsewhere" }].map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setOpen(false)} className="block py-3 font-serif text-3xl">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
