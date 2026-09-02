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
- The built-in "Dev Panel" settings group (§12i) is judged device-specific
  (independent per tab), not shared, for the same reason the panel's own
  size/position already is — it's the panel's own chrome, being rendered
  within two different-shaped viewports. Persisted alongside panel geometry
  (`panelStyle` in `getPanelGeometry()`/`applyPanelGeometry()`), not in `cfg`.

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
- The double-click-to-cut sweep animation (`cutProgress`, driven by the Cut
  Speed dev control) is purely cosmetic — it must never pause the cut piece's
  own physics. A cut piece keeps integrating (falling/swinging) from the
  very next frame, inheriting whatever velocity it already had; the toppling
  tilt applied at cut time rotates both the current AND the previous-frame
  position around the same pivot (not just the current position), so it adds
  a topple bias without zeroing out that inherited velocity. An earlier
  version froze the piece for the sweep's duration, which visibly paused the
  rope for a moment when cutting mid-swing — confirmed as a real bug by the
  user, not intended behavior.
- `onPointerDown` clears any existing `holdTimer` before starting a new one
  — the actual root cause behind an intermittent "double-click-to-cut stops
  working" report. Without this, a pointerdown that never gets a matching
  pointerup (any dropped/non-round-tripping event) orphans its timer once
  the next pointerdown overwrites the `holdTimer` variable; the orphaned
  timer still fires later against whatever `downInfo` is current *then*,
  marking an unrelated in-progress click as a false hold and silently
  swallowing it (both punch and cut return early on `info.isHold`).
- `applyPanelGeometry(null)` is a meaningful call (reset panel
  position/size/style to their CSS/JS defaults), not a no-op -- it's what
  runs when the active Desktop/Mobile tab has nothing saved yet. An earlier
  version returned early on a falsy `geom`, which left a freshly-clicked tab
  showing whatever the *previous* tab's live panel style/position happened
  to be instead of resetting; caught by explicitly testing a tab with no
  saved state after the other tab had unsaved live changes.
- The rope's point count is NOT fixed — growing/resizing it goes through
  `setMainRopeTotalLength()`, which adds/removes points to hold a roughly
  constant segment density, not just a fixed 14 points stretched further
  apart. A fixed count was the real cause of two real user-reported bugs at
  once: the grown rope acting stiff (too few joints over its length) and
  its extended portion not being cuttable (the smoothed render curve
  diverging from hit-testing's straight-line segments as points got
  sparser). Anything that changes the rope's total length needs to go
  through this function, never assign `segLen` directly against the
  existing point count.
- The main rope collides with and piles on the floor too, not just cut-off
  pieces — `pileRepulsion()` takes an explicit points array now (mainRope's
  points concatenated with every fallen piece's), not just fallenPieces.
  Before this, growing the rope past the floor just clipped straight
  through with no reaction at all.
