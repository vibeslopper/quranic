# Quranic project guide

Read this before working on the project. It describes the current scope, code, and constraints.

## 1. Overview

Quranic is a static site for distinct Quran-learning games. Its first game, **Surah learning**, practises all 114 surahs' order, transliterated names, and English meanings. The README's deployment instructions target GitHub Pages, serving the repository root from the `main` branch.

## 2. Design goals

- Keep play quick, keyboard-friendly, and lightweight on older devices and slow connections.
- Keep implementation simple and readable to a beginner-to-intermediate web developer.
- Keep each game's data and rules separate from the shared site so further games can be added without entangling this one.
- Use no runtime framework, web fonts, or icon library.

## 3. Hard constraints

- Keep the site static: plain HTML, vanilla JavaScript, and Tailwind CSS. Runtime scripts are classic scripts using ES2015-level syntax; do not add modules, TypeScript, a framework, or a bundler.
- Compile Tailwind with the standalone CLI into `output.css`; commit the generated production stylesheet. Do not use the Play CDN. Any class toggled from JavaScript must appear literally in a file Tailwind scans.
- Tailwind scans `index.html` and product HTML/JavaScript under `games/`; keep reference/archive HTML out of those paths.
- Do not add runtime `fetch()` or remote/CDN assets. Use relative paths for local assets.
- Do not add animations or transitions, modals, overlays, floating popups, toasts, autocomplete, or suggestions. Prefer simple, accessible inline feedback.
- Guard every `localStorage` access with `try/catch` and validate stored values before using them.
- Do not invent Quranic text, translations, transliterations, or attributions. Use the extracted game data; get user approval for new sources or content.

## 4. Project structure

| Path | Purpose |
| --- | --- |
| `AGENTS.md` | Repository working rules; directs agents to this guide. |
| `PROJECT.md` | Living description of scope, behaviour, data, storage, and decisions. |
| `README.md` | CSS build, local run, and GitHub Pages instructions. |
| `index.html` | Shared landing page with links to available games. |
| `games/surah-learning/index.html` | Setup, study, and quiz screens for the Surah learning game. |
| `games/surah-learning/data.js` | Classic script defining the global `SURAHS` array of 114 records. |
| `games/surah-learning/game.js` | Modes, round generation, rendering, answers, and per-mode progress. |
| `src/input.css` | Tailwind CSS input and config reference. |
| `tailwind.config.js` | Scans the landing page and game HTML/JavaScript; uses media-based dark mode. |
| `output.css` | Generated production stylesheet linked by the pages. |
| `tailwindcss` | Local standalone Tailwind CLI executable; ignored by `.gitignore` and not a runtime dependency. |
| `.gitignore` | Excludes the local `tailwindcss` executable. |
| `.nojekyll` | Empty marker that prevents GitHub Pages from running Jekyll. |
| `.opencode/opencode.json` | Registers the Ponytail plugin and loads `PROJECT.md` as OpenCode instructions. |

There is no package manifest, JavaScript build step, automated browser test suite, or CI configuration in the repository root.

## 5. Build, run, and deploy

Build the production CSS with the local Tailwind v4 standalone CLI:

```sh
./tailwindcss -i ./src/input.css -o ./output.css --minify
```

To run locally, build the CSS and open `index.html` directly in a browser or use any static web server. For deployment, follow `README.md`: publish from GitHub Pages branch `main`, folder `/` (repository root).

## 6. Surah data and provenance

- The user supplied and approved two data sources, `source-names.html` and `source-meanings.html`; both were deleted after extraction. The game does not load or require them.
- Names and Arabic were extracted verbatim from the names source, trimming only surrounding Arabic whitespace. English meanings were taken from the meanings source and joined by number. URLs and other markup/scripts/styles were ignored; no other Quranic data source was used.
- Each `SURAHS` record has `number`, `name`, `arabic`, `meaning`, and `meaningSource` (`"source"` or `"agent"`). Optional `meaningQuizEligible: false` excludes name-only/letter-only answers from meaning quiz modes; optional `meaningGroup` and `nameGroup` prevent close answers from being used as each other's distractors.
- Compared all 114 source-title pairs. Eight titles were genuinely different and their meanings were determined by the agent at the user's instruction; the other title differences were spelling/transliteration variants or equivalent renderings. In particular, surah 3 (`Aal-e-`Imran` / `Al-Imran`) and 94 (`Al-Inshirah` / `Ash-Sharh`) keep the supplied meaning because the meanings match. The 58, 60, and 83 title differences are treated as genuine differences, not spelling variants.

| No. | Names-source title | Different meanings-source title | Agent-determined meaning | Reason |
| ---: | --- | --- | --- | --- |
| 17 | Bani Isra'il | Al-Isra | Children of Israel | Literal rendering of the names-source title, not “The Night Journey”. |
| 40 | Al-Mu'min | Ghafir | The Believer | “Believer” is distinct from Ghafir, “Forgiver”. |
| 41 | Ha Mim As-Sajdah | Fussilat | Ha Mim, The Prostration | Keeps the letters and prostration in the names-source title. |
| 58 | Al-Mujadalah | Al-Mujadila | The Disputation | Renders the names-source form as the act, not the person who pleads. |
| 60 | Al-Mumtahinah | Al-Mumtahanah | The Examiner | Follows the names-source active form, not the other title's passive form. |
| 76 | Ad-Dahr | Al-Insan | The Time | Renders Ad-Dahr, not Al-Insan (“The Man”). |
| 83 | At-Tatfif | Al-Mutaffifin | Giving Short Measure | Renders the act, not the people who give short measure. |
| 111 | Al-Lahab | Al-Masad | The Flame | Renders Al-Lahab, not the palm-fibre title. |

The study view marks these eight meanings with `*` and explains their provenance. The source meanings also received these clear spelling/capitalisation fixes in `data.js`: 1 `The opener` → `The Opener`; 2 `The cow` → `The Cow`; 38 `The letter Saad` → `The Letter Saad`; 64 `Mutual Disposession` → `Mutual Dispossession`; 79 `Those who drag forth` → `Those Who Drag Forth`; 86 `The Nightcommer` → `The Nightcomer`; 102 `Vying for increase` → `Vying for Increase`.

## 7. Game behaviour

### Modes and rounds

| Mode | Practice |
| --- | --- |
| Number → name | Choose the transliterated name for a surah number. |
| Name → number | Enter the number for a transliterated name. |
| Name → meaning | Choose the English meaning for a name. |
| Meaning → name | Choose the name for an English meaning. |
| Meaning → number | Enter the number for an English meaning. |
| Arabic → name | Choose the transliterated name for an Arabic prompt. |
| Surah order | Choose the surah immediately before or after another, within the selected range. |

- The range selector offers all surahs or blocks of ten (with 111–114 as the last block). The range limits questions, while distractors may come from the full eligible data set. Each round asks each eligible target once in shuffled order.
- Name/number, Arabic/name, and order modes include all 114 surahs. Meaning modes omit entries that are only English name-equivalents or letters: 10, 11, 12, 14, 19, 20, 31, 34, 36, 38, 47, 50, 71, and 106. All meanings, including these, remain in the study table. Surah 35 Fatir stays in meaning modes because its supplied meaning, “The Originator”, is a descriptive English gloss.
- Multiple-choice distractors come from real surah data. Near-spellings are filtered textually; `nameGroup` excludes close pairs (Al-Fatihah/Fatir/Al-Fath, Al-Hijr/Al-Hajj, Al-Mu'min/Al-Mu'minun, As-Sajdah/Ha Mim As-Sajdah, As-Saff/As-Saffat, Al-Qamar/Al-Qari'ah, and Al-Alaq/Al-Falaq). `meaningGroup` excludes close glosses (cow/cattle, believers, prostration, ranks, covered figures, breaking apart, and dawn/daybreak).
- Press 1–4 to select a choice, then Enter or **Check answer**. Number-entry modes use a numeric input and accept only integer values 1–114. Feedback is inline and gives the right answer; answers are scored once per question.
- Arabic text from the approved names source is preserved in `data.js`, displayed with `lang="ar"`, `dir="rtl"`, and system serif fonts. The study view lists all 114 numbers, transliterations, Arabic names, and meanings.

### Progress storage

Each mode has independent progress under `quranic.surahs.v1.<mode>`, where `<mode>` is one of `number-name`, `name-number`, `name-meaning`, `meaning-name`, `meaning-number`, `arabic-name`, or `order`. Each key stores JSON `{ version: 1, surahs: { "1": { attempts, correct } } }`; entries are per-surah counts for that mode. Stored mode/version, surah keys (1–114), and non-negative integer counts (`correct` cannot exceed `attempts`) are validated. If any value is invalid, that mode starts with empty progress. Every storage read/write/removal is guarded; storage failures do not stop play. Progress can be reset for the current mode using an inline confirmation; the active round itself is not persisted.

## 8. Design decisions and rationale

- Use a separate `games/surah-learning/` folder with its own data and rules so more games can be added independently.
- Keep the source transliterations and Arabic exactly as supplied; join the meaning source by number and flag all agent-determined meanings for review.
- Exclude name-only/letter-only rows from meaning questions rather than presenting a repeated or misleading answer; keep them visible in the complete study table and available in other modes.
- Use per-mode, per-surah attempt/correct counts as the smallest useful persistent progress measure; do not persist an unfinished round.
- Filter semantically close meanings as well as near-identical text so a correct answer does not have a misleading distractor.
- Let distractors come from the full data set while limiting question targets to the chosen range, so even small ranges can offer four real choices.
- Mark the selected answer through `aria-pressed` with a persistent blue background/ring, keeping font weight unchanged to avoid shifting text.

## 9. Known limitations and ideas

- The eight agent-determined meanings are literal, conservative renderings made at the user's instruction and should be reviewed; their source titles and explanations are listed above.
- Arabic glyph appearance depends on the player's browser and installed system fonts. It rendered in a local Chrome check, but has not been checked across browsers or devices.
- A future typing mode may accept transliterated names leniently, ignoring case, hyphens, and apostrophe/backtick differences. It is not built in this version.
- The original source HTML files have been deleted. `games/surah-learning/data.js` is the self-contained runtime data; ask the user to restore the sources if a later source-level audit is needed.
