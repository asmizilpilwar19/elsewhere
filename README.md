# ELSEWHERE

An immersive virtual travel experience: six imaginary destinations, an illustrated Dream Atlas, a destination quiz and a personal travel journal.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4 and `motion` (Framer Motion).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
```

## What's inside

| Section | Where |
| --- | --- |
| Hero (layered parallax scene) | `src/components/hero.tsx` |
| Featured destinations + save button | `src/components/destinations.tsx` |
| Destination detail overlay | `src/components/destination-overlay.tsx` |
| Dream Atlas (SVG map, routes, regions) | `src/components/atlas.tsx` |
| Immersive scroll section | `src/components/immersive.tsx` |
| Our Story | `src/components/story.tsx` |
| Find Your Elsewhere quiz | `src/components/quiz.tsx` |
| Travel Journal | `src/components/journal.tsx` |
| Closing section + footer | `src/components/closing.tsx` |
| Destination artwork (procedural SVG) | `src/components/scenes.tsx`, `src/lib/svg.ts` |
| Destinations, quiz scoring, regions | `src/data/destinations.ts` |
| Journal, theme and overlay state | `src/components/providers.tsx` |
| Colours and day/night tokens | `src/app/globals.css` |

## Notes

- **Artwork** is inline SVG generated in code (seeded, so server and client match). There are no raster images or videos.
- **Day/night** swaps CSS variables on `<html data-theme>`. The choice is stored in `localStorage` (`elsewhere:theme`).
- **Journal** is stored in `localStorage` (`elsewhere:journal`). No account is needed.
- **Adding a destination:** add an entry to `src/data/destinations.ts` and a matching scene in `src/components/scenes.tsx` (keyed by `slug`). The quiz, atlas and journal pick it up automatically.
- **Accessibility:** keyboard-operable controls, a skip link, a focus-trapped destination dialog, and `prefers-reduced-motion` support.
- **Footer social links** point to platform home pages. Replace them with real profiles in `closing.tsx`.
