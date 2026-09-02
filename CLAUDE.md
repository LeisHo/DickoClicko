# Dicko Clicko — Project Conventions

Single-file HTML/canvas interactive toy. See `docs/PROJECT_SUMMARY.md` for
what it is, `docs/CODE_SUMMARY.md` for how `index.html` is structured.

The dev panel follows the workspace-wide standard in the parent `CLAUDE.md`
§12 (this project was that section's original working example) — this file
only covers what's specific to Dicko Clicko, not a restatement of §12 itself.

## File map

Everything lives in `index.html` — markup, CSS, and JS all inline, no build
step, no dependencies. The `data/`, `datalog/`, `config/`, `models/`,
`deliverable/`, `logs/`, `results/`, `scripts/`, `src/`, `tests/` folders are
the workspace-standard scaffold (CLAUDE.md §11) and are not used by this
project — this is a deliberate single-file architecture exception, same as
Clicko / Quiz Game.

## Untouchable systems

None formally designated yet.

## Dev-panel prompt shorthand (how the user specs dev controls)

Uses the workspace-standard `*DC*`/`*D*` notation (parent `CLAUDE.md` §12g).
This project's own docs/history use the older `*COL*`/`*DEV*` spelling from
before that section existed — read as the same intent, not a separate
convention. A bare `*D*` with no group context goes into whichever existing
collapsible group fits best (per §12g); create a new group only if none fit.

## Dev-panel behavior (project-specific judgment calls under §12)

- **Every setting here is shared between the Desktop and Mobile tabs (§12f),
  none are device-split.** §12f's own rationale for defaulting to
  device-specific is mainly fixed-`px` values that don't translate across
  viewports — every control in this project is already %/vmin-based (§12a),
  so that rationale doesn't apply to any of them. Only the dev panel's own
  chrome (size/position) is device-specific, because it's genuinely being
  positioned within two different-shaped viewports.
- Position/size dev values are expressed in **%/vmin of the viewport**, not
  px, so the layout stays proportionally correct on both desktop and mobile.
  Physics runs in pixel space each frame, re-derived from the %-based config
  (including on resize).

## Gotchas

- Dev mode gates on `location.hostname` being `localhost`/`127.0.0.1`,
  `location.protocol === 'file:'`, or `location.search` containing `dev=1` —
  don't gate on `NODE_ENV` or anything build-time, there is no build step.
- Double-click detection is custom (a `setTimeout` pairing on pointerup), not
  the native `dblclick` event — a native `click` would otherwise fire before
  a `dblclick` is recognized, contradicting the requirement that a double
  click must not trigger a single click in between. See `docs/CODE_SUMMARY.md`
  for the exact gesture state machine.
- Every `el.setPointerCapture(pointerId)` call (panel drag, all 8 resize
  handles, group/setting drag-reorder) is wrapped in try/catch
  (`tryCapture()`) — it throws `NotFoundError` for a pointerId the browser
  doesn't consider "active," which happens with synthetic `PointerEvent`s
  dispatched via JS (as used for testing in this environment) and, per MDN,
  is also a real possibility in production for a pointer that ended between
  the event and the capture call. An uncaught throw there silently aborts
  the rest of the handler and the feature stops working; drag/resize/reorder
  all attach their move/up listeners to `window` rather than the captured
  element specifically so they keep working even when capture itself fails.
- The double-click-to-cut animation freezes the cut-off piece in place
  (`piece.frozen`, skipped by `integrateChain`/floor collision/pile
  repulsion) until its sweep animation (`cutProgress`, driven by the Cut
  Speed dev control) finishes — the piece's random toppling tilt
  (`releasePiece()`) is applied at that release moment, not at the cut
  itself, so it still looks attached to the main rope while the sweep plays.
