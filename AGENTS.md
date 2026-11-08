# Repository instructions

Quranic is a static site for Quran-learning games. Read `PROJECT.md` before starting any task; it describes the project's current scope and constraints.

## Repository note

- `.opencode/opencode.json` registers the `@dietrichgebert/ponytail` plugin and loads `PROJECT.md`; `.opencode/` is OpenCode configuration, not product code.

## Development preferences

- Prefer the simplest maintainable solution; avoid unnecessary dependencies and abstractions.
- Keep changes focused on the requested feature and explain important architectural decisions briefly.
- Keep game-specific content and rules distinct so one game can be changed without entangling others.
- Do not invent Quranic text, translations, transliterations, or attributions; use a source approved by the user.
- Run relevant checks after making changes; never claim a test passed unless it was run.
- Never expose secrets or commit credentials. Ask before introducing paid services or infrastructure.

## Working rules

- Make the smallest diff that does the job. Follow existing style and structure; do not refactor, rename, or "improve" unrelated code.
- Never run Git commands or modify Git state.
- Do not create new files, tests, or scripts unless asked.
- Ask when a request is ambiguous or conflicts with constraints in `PROJECT.md`.
- For large or judgement-heavy changes, investigate and report first, then wait for approval.
- Keep final messages short; mention changed files and remind the user to rebuild `output.css` if Tailwind classes were added.
- Update `PROJECT.md` when a change affects its description of the project (structure, behaviour, data, storage, constraints, limitations, or decisions). Add a one-line design-decision entry for non-obvious choices, using only rationale that is known or supplied by the user. Edit existing text rather than appending change logs, and remove anything no longer true. Leave `README.md` alone unless it becomes inaccurate. State in the final message whether `PROJECT.md` was updated.
