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
- Every X/Y position slider pair shares one global origin: `(0,0)` is the
  viewport's top-left corner, `100` is full width (X, `%vw`) / full height
  (Y, `%vh`) — matching `vw()`/`vh()` exactly (`circleX`/`circleY` already
  follow this). Any new position control must use the same scheme, so a raw
  value copied from one X slider and pasted into another X slider (same for
  Y) always lands on the identical screen point.
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
- Hold-to-grow only triggers for a hold that *starts* on the circle
  (`isOnCircle()`, checked once at pointerdown) — a hold starting on the
  rope charges punch intensity instead (fires on release, scaled by hold
  duration up to Intensity Ceiling at Click Hold Max Duration). The two are
  mutually exclusive per gesture by design, per explicit clarification from
  the user after the original spec read as ambiguous between them.
- Charging-eligibility uses `cfg.doubleClickThreshold` as its hold-duration
  gate, not the original (shorter) `HOLD_THRESHOLD_MS` — this is what makes
  it provably impossible for charging to hijack a real double-click into an
  unwanted "bounce" instead of a cut (see `docs/CODE_SUMMARY.md` Gotchas for
  the proof). Don't shorten this back to `HOLD_THRESHOLD_MS`; that was the
  actual root cause of a real reported bug.
- Holding to charge a punch is NOT limited by `clickDistance` — you can
  press down anywhere on screen and the hold still charges, aimed at
  whichever rope point ends up nearest. Only a quick tap (single click or
  either half of a double-click) still needs real proximity, since that's
  what targets a specific punch/cut point precisely. Charging is instead
  gated by its own `holdDistance` at release time — a hold that lands too
  far from the rope (e.g. a hold really meant for the circle that missed
  even the circle's own generous margin) fires nothing, rather than a punch
  way out where the release happened to be.
- `isOnCircle()` uses the circle's visual radius plus a fixed margin, not
  the bare radius — a small `circleSize` is an easy miss otherwise. Don't
  shrink or remove this margin; it's what makes "click and hold on any area
  bound by the circle" actually reliable, per explicit user report that it
  wasn't.
- `mainRope.totalLength` (not `segLen * pointCount`) is what growth/cut
  actually accumulate against — `segLen` is pinned constant now (see
  `docs/CODE_SUMMARY.md` Gotchas), so re-deriving "current length" from it
  every frame silently stalls growth between point-insertion thresholds.
  Any new code that changes the rope's real length must update
  `mainRope.totalLength` explicitly (and `cfg.ropeLength`'s display, if it
  changed the length outside of `growRope()`/the slider's own `onChange`).
- Dragging the dev panel by its header clamps `left`/`top` against the
  panel's own actual width/height, not a fixed stub margin — the panel (and
  therefore its resize corners) must never be draggable off-screen. Don't
  reintroduce a hardcoded margin here; it was the real bug the first version
  had.
- `resetMainRope()` must build the initial chain with `segLen =
  vh(TARGET_SEG_LEN_VH)`, never a value derived from `POINT_COUNT` or the
  current `cfg.ropeLength` — those only coincidentally match `TARGET_SEG_LEN_VH`
  at the exact default it was computed from (45), and silently diverging from
  it again (e.g. a future default-bake that changes Rope Length without also
  updating `TARGET_SEG_LEN_VH`) reintroduces a real, previously-shipped bug: a
  violent segLen-mismatch bounce the first time anything calls
  `setMainRopeTotalLength()` (dragging the slider, or a saved settings reload
  at boot). See `docs/CODE_SUMMARY.md` Gotchas for the full mechanism.
- Rope growth's smooth appearance depends on `mainRope.tipGrowLen`, rising
  every frame (never in whole-point jumps), and `positionGrowingTip()`
  placing the tip directly from it. **The growing tip must NEVER be fed
  into `integrateChain()`'s iterative distance-constraint solver as a
  moving rest-length target** — that was the first version built, and over
  a real multi-second hold it acted as a sustained forcing function that
  compounded into a violently tangled rope (confirmed by a real user video
  and a 900-frame reproduction: segment lengths up to 2.93x rest length,
  points folding back on themselves). The tip must stay excluded from the
  constraint solve (`integrateChain()`'s `skipLastSegment`) and be
  positioned directly instead, with zero implied velocity. Any future
  change to growth mechanics must keep advancing `tipGrowLen` every frame,
  reset it to `segLen` after any direct/instant length change (slider,
  saved-settings reload, cut), and keep the growing tip OUT of the
  constraint solver — see `docs/CODE_SUMMARY.md` Gotchas for the full
  mechanism and how both the bug and the fix were verified.
- A charged hold's Click-And-Hold-Distance gate (and the punch's aim) must
  be computed from the pointer's position AT RELEASE, not from the
  press-time `info.hit` — that field is frozen at `onPointerDown` and never
  updates, so checking it at release ignores any movement during the hold
  entirely. This was a real, previously-shipped bug (see
  `docs/CODE_SUMMARY.md` Gotchas).
- `update()` is always called with a fixed `1/60` timestep now (`loop()`'s
  accumulator pattern), never the raw per-frame `requestAnimationFrame`
  delta — physics, growth rate, and cut-sweep timing all depend on this to
  stay smooth; feeding a variable/jittery dt into `update()` again would
  reintroduce the "everything looks slightly jumpy" bug this was built to
  fix.
- The dev panel's `n`/`s` resize-drag math must stay clamped to
  `window.innerHeight * 0.88`, matching `#devPanel`'s own CSS
  `max-height:88vh` exactly — letting the two diverge is a real, previously
  shipped bug: dragging `s` past the cap went silently unresponsive, and
  dragging `n` pushed the panel off-screen above the viewport while the
  uncompensated height stayed clamped (shrinking from the bottom instead of
  growing from the top). If `max-height` ever changes, update this constant
  to match.
