# Dicko Clicko — an interactive rope-physics toy

A single-page HTML/canvas toy: a circle hangs a rope you can punch, hold to
grow, or double-click to cut. Cut pieces fall with real physics and (if a
floor is enabled) pile up naturally. Built to work on both desktop and
mobile browsers.

See `docs/PROJECT_SUMMARY.md` for the current state (objective, scope,
current state, recent decisions, known limitations, next action — the part
that changes often) and `docs/PROJECT_PROGRESS.md` for what's being worked
on right now. This README stays a short pointer, not a duplicate of either —
don't let real content drift into this file instead of those.

## How to run it

No build step — `index.html` is the entire app. Open it directly in a
browser, or serve the folder with any static file server.

**Dev mode** (shows the tuning panel) is on automatically when:
- opened via `file://`, or the hostname is `localhost`/`127.0.0.1`, **or**
- the URL has `?dev=1` appended.

Otherwise the panel is hidden and only the animation renders.

## Project structure

```
DICKOCLICKO/
├── index.html               <the entire app — markup, styles, and JS inline>
├── docs/                    <README (pointer only — this file), PROJECT_SUMMARY.md,
│                             CODE_SUMMARY.md, PROJECT_PROGRESS.md, CHANGELOG.txt>
├── data/, datalog/, config/, models/, deliverable/, logs/, results/,
│   scripts/, src/, tests/    <unused for this project — see CLAUDE.md>
```

This is a single-file project (see project `CLAUDE.md` for why) — the
skeleton folders above are the workspace-standard scaffold and mostly stay
empty for this project.

## Known limitations

See `docs/PROJECT_SUMMARY.md`'s Known Limitations section for the current,
maintained list — not duplicated here to avoid drift between two copies of
the same information.

## Roadmap

No formal roadmap is tracked separately. See `docs/PROJECT_PROGRESS.md` for
what's currently being worked on and what's next, and `docs/CHANGELOG.txt`
for the full history of what's been built.
