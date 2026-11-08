# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static site, no build step: `index.html`, `css/app.css` (plain CSS, one design), `js/app.js` plus pure ES modules `js/model.js`, `js/search.js`, `js/store.js`; marked and DOMPurify vendored in `js/vendor/`; Figtree self-hosted in `css/fonts/`. Content in `solutions/` (598 Markdown files, indexed by `structure.json`). Tests: `node --test tests/`.

## Users

Players of (mostly classic/point-and-click) adventure games who are stuck and want a quick, spoiler-controllable walkthrough. Secondary audience: contributors who write new solution files in the project's plain-text/Markdown format.

## Product Purpose

A community-maintained hub of plain-text, player-centric game walkthroughs ("the raw elegance of text") with an interactive web GUI for browsing: search, per-game status tracking (currently playing / done / no status), favorites, chapter navigation, language (DE/EN) and font-size controls, and export/import of personal progress (client-side, no backend).

## Positioning

Differentiates from typical ad-heavy walkthrough sites by keeping solutions as simple, easy-to-write plain text/Markdown files (easy to contribute, easy to read, no fluff), while still offering a modern interactive GUI on top (search, filters, progress tracking) rather than raw file browsing.

## Operating Context

- This is a fork-in-progress of a third-party open-source project (`AmigaMaster/Simple-Game-Solutions` on GitHub, live at amigamaster.github.io/Simple-Game-Solutions). The user cloned it locally to redesign; not currently deployed anywhere, and deployment/hosting is undecided.
- Content: 598 solution files, ~687k words, under `solutions/`, organized alphabetically by first letter, one Markdown file per game (per language, `-DE`/`-EN` suffix).
- Client-side only: progress/favorites/status presumably stored in browser storage; export/import lets users move that state between browsers/devices.

## Capabilities and Constraints

Must preserve: search, all/favorites/my-games filters, status tracking (currently playing/done/no status), favorites, export/import of progress, DE/EN language switching, font-size adjustment (80–150%), chapter navigation/rendering of Markdown solutions, settings panel, Discord/GitHub Discussions/Issues community links.

Open for redesign: visual language, layout, branding (name, logo, color system) — user approved a full rebrand, not just a reskin.

## Brand Commitments

Standing preference (2026-11-07, chosen on purpose in a direction round): the category standard, executed with craft. Calm, functional, text first, one blue accent, one primary action per screen; no theme, no metaphor, no playful or decorative world (the user rejected the Workbench pixel look, three alternative looks, the indigo/amber/cream look as generic, and a themed "field book" round as "too much design, too playful"). Quality bar: Apple Support, Stripe Docs, Wikipedia, GOG/Steam help pages. Both a light and a dark layout: light uses the blue accent; dark is an owner-requested homage to the original site (Tailwind gray-900/800 surfaces, emerald accent), one accent per scheme. Phone and desktop are equally important (50/50 audience) and each is optimized for its display; phone and desktop are one product with the same design language, desktop uses its space. Figtree stays the typeface.

## Evidence on Hand

Original look kept for reference in `index.original.html`; the rejected Workbench look in `index.workbench.html`. Eng review and design doc live in `~/.gstack/projects/amigamaster-Simple-Game-Solutions/`. Corpus audit: 598 files, all DE or EN, median 8 chapters, max 123.

## Product Principles

- Keep walkthroughs scannable and spoiler-controllable (players want to find their exact stuck point fast, not read everything).
- Content is plain text/Markdown-first; the GUI is a layer on top, not the source of truth.
- No backend/account system — all personalization (favorites, status, progress) is local and portable via export/import.
- Respect bilingual (DE/EN) content and UI parity.
- Simple enough that untrained people succeed without poking around; phone and desktop equally important.
- Spoiler-free guided mode shows only what the player has already seen or is about to need; no chapter count, no later names.
