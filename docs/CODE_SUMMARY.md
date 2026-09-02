DICKO CLICKO -- CODE SUMMARY
================================================================================

Status: see ../README.md for the project-structure layout and how to run it;
this file is a quick orientation pointer into the actual code, not a
duplicate of the README's tree.

--------------------------------------------------------------------------------
FILE MAP

- `index.html` -- the entire app. One `<canvas>` for the animation, one
  `<div id="devPanel">` (built dynamically from a config array, with
  Desktop/Mobile tabs, Copy/Save/Reset, and drag-to-reorder groups/settings
  per the workspace's §12 dev-panel standard) for the dev panel, one inline
  `<script>` for everything else. No build step, no dependencies.

--------------------------------------------------------------------------------
ARCHITECTURE

```
DEV_GROUPS (config array: one entry per *D*/*DC* from the spec)
    -> cfg{} (live values, seeded from DEV_GROUPS defaults)
    -> buildDevPanel() generates the panel DOM from DEV_GROUPS
    -> every render/physics read of a tunable value reads cfg[key] directly,
       each frame -- so most sliders are "live" with zero extra wiring.
       The exception is ropeLength/ropeGrowthRate, which go through
       setMainRopeTotalLength() instead of a direct per-frame read
       (see Gotchas).

circleAnchor() / vw() / vh() / vmin()
    -> convert cfg's %-based position/size values to CSS pixels each frame,
       so resizing the window/rotating a mobile device is handled for free.

mainRope (module state, point[0] pinned to circleAnchor())
fallenPieces[] (module state, one entry per cut-off rope segment)
    -> both are arrays of {x,y,oldx,oldy} verlet points, advanced every
       single frame by integrateChain() (gravity + distance constraints) in
       update() -- a freshly-cut piece is NEVER paused/gated; it keeps
       moving continuously from the very next frame, inheriting whatever
       velocity it had at the moment of the cut (see Gotchas -- an earlier
       version froze it during the cut-sweep animation and that was wrong).
       mainRope's own point COUNT is not fixed -- setMainRopeTotalLength()
       adds/removes points to hold a roughly constant segment length
       (TARGET_SEG_LEN_VH) as the rope grows/shrinks, so a long rope stays
       just as flexible (and just as accurately hit-testable) as a short
       one, instead of a fixed 14 points getting stretched thinner and
       thinner into something stick-stiff (see Gotchas).

update(rawDt) each animation frame:
    1. re-pin mainRope's anchor point to the (possibly-moved) circle
    2. grow mainRope if a hold-to-grow gesture is active
       (setMainRopeTotalLength(), adds points as needed)
    3. advance every not-yet-fully-swept piece's cutProgress (cosmetic only)
    4. integrateChain() for mainRope, then for every fallenPieces entry
       (its own gravity scale)
    5. floor collision (clamp to floorY) + pileRepulsion() across
       mainRope's points AND every fallen-piece's points together, if the
       floor is enabled -- the main rope collides with and piles on the
       floor too, not just cut-off pieces; otherwise cull fallen pieces
       once they've fallen well below the viewport

render() each frame: background -> floor -> circle -> main rope -> fallen
pieces -> cut-sweep mark for any piece still mid-sweep (circle drawn
*before* the rope so the rope renders on top of it, not behind).
```

Input (click/hold/double-click) never touches rendering directly -- it only
ever mutates `cfg`, `mainRope`, or `fallenPieces`, which the next `update()`/
`render()` picks up. Rope pieces once cut into `fallenPieces` are never
reattached to `mainRope`.

Physics and rendering are already fully separate -- `strokeRopeCurve()` is
the only place that turns a chain's `{x,y}` points into pixels, and it never
reads or writes physics state. Restyling the rope to something other than a
stroked line (an SVG/image-based segment, a sprite chain, etc.) is a
render-only change: swap what `strokeRopeCurve()` (and the equivalent draw
call for fallen pieces) does with the same `points` array it already
receives every frame: it stays exactly as smooth as it is now, since the
verlet simulation producing those points doesn't change at all.

Dev panel persistence (`saveSettings()`/`resetSettings()`/`copySettings()`):
setting *values* and the *group/row order* are one shared blob
(`localStorage['dickoClicko.devSettings']`) since every control in this
project is judged non-device-specific (see project CLAUDE.md); the panel's
own size/position is two independent blobs keyed by `activeDeviceTab`
(`'dickoClicko.devPanelGeom.desktop'` / `'...mobile'`), switched by clicking
the Desktop/Mobile tab buttons -- independent of the actual live viewport
width, so the panel's mobile layout can be previewed without resizing the
real browser window. The built-in "Dev Panel" group (§12i: font sizes,
opacity, colors for the panel's own chrome) is judged device-specific the
same way, so `panelStyle{}` rides inside that same per-tab geometry blob
(`getPanelGeometry()`'s `.style` field) rather than living in `cfg`; applied
live via CSS custom properties (`--dp-title-size`, `--dp-bg`, etc.) set on
`#devPanel` by `applyPanelStyle()`.

Gesture dispatch (`onPointerDown`/`onPointerUp`): which hold behavior
applies is decided by WHERE the hold starts, checked once at pointerdown
(`isOnCircle()`) -- a hold starting on the circle grows the rope (existing
`growing`/`growRope()` path); a hold starting on the rope charges punch
intensity instead (`downInfo.charging`, flipped by the same `holdTimer`
used to detect "hold" at all) and fires the punch immediately on release,
intensity scaled linearly from 0 to `cfg.intensityCeiling` as total hold
time goes from 0 to `cfg.clickHoldMaxDuration` (clamped at 1x beyond that).
A quick tap on the rope (never reaches `charging`) is unaffected -- still
goes through the existing double-click-threshold punch/cut disambiguation.

--------------------------------------------------------------------------------
UNTOUCHABLE SYSTEMS

None formally designated yet -- this is the initial build.

--------------------------------------------------------------------------------
GOTCHAS

- Double-click is hand-rolled (a `setTimeout` pairing keyed off
  `doubleClickThreshold` in `onPointerUp`), not the native `dblclick` event --
  a native `click` would otherwise fire before `dblclick` is recognized,
  which the spec explicitly rules out ("a double click should not trigger a
  single click"). This also means every single click has a deliberate delay
  (up to `doubleClickThreshold` ms) before the punch visibly applies, since
  the code can't yet know a second click won't follow. That delay is the
  intended tradeoff of this disambiguation approach, not a bug.
- `ropeLength`'s slider does NOT drive the rope's current segment length on
  its own every frame -- `mainRope`'s point count/`segLen` are deliberately
  decoupled from `cfg.ropeLength` after the rope is created, because
  hold-to-grow and cutting both need to change the *effective*
  length/point-count without a manually-dragged slider snapping it back to
  the full default. Dragging the `Rope Length` slider calls its `onChange`
  hook, which calls `setMainRopeTotalLength()` using the rope's *current*
  point count as the base (so it still works correctly on an already-cut
  remainder, without regenerating the chain). Any new dev control whose
  value needs to affect an in-flight simulation state (not just a per-frame
  render/physics read) needs the same `onChange`-hook treatment -- see
  `ropeLength`'s entry in `DEV_GROUPS` for the pattern.
- `setMainRopeTotalLength(newTotalPx)` is what both `growRope()` and the
  `Rope Length` slider's `onChange` call -- it never just stretches the
  existing points; it computes how many points *should* exist to hold
  `TARGET_SEG_LEN_VH` and adds new ones (extending along the current tip's
  tangent direction, not just plopped at the same spot) or truncates as
  needed. A fixed point count that only got stretched further apart as the
  rope grew was the real cause of two real bugs the user reported: the
  grown rope behaving like a stiff stick (too few joints over the length to
  bend realistically) and its extended portion not being cuttable (the
  visually-smoothed curve, drawn between increasingly sparse/distant points,
  increasingly diverges from the straight-line segments `hitTestRope()`
  actually tests against).
- `cutRopeAt()` refuses the cut entirely (returns with no change at all) if
  it would leave the anchor-side remainder shorter than `cfg.minRopeLength`
  -- it does not clamp the cut point to the minimum, the rope just stays
  whole.
- `pileRepulsion(points)` takes an explicit points array now (previously
  built it internally from `fallenPieces` only) -- `update()` passes
  `mainRope.points` concatenated with every fallen piece's points, so a
  long main rope resting on the floor piles/spreads against itself and
  against already-cut pieces the same way cut pieces pile against each
  other.
- A perfectly vertical cut piece has no asymmetry to fall over on, so
  `cutRopeAt()` applies a small random initial tilt (rotated around the
  piece's own cut-point end), applied *immediately* at cut time -- without
  this, a piece cut from an undisturbed hanging rope stands on the floor as
  a rigid straight column instead of settling into a heap. Both the current
  position AND the old (previous-frame) position are rotated by the same
  angle around the same pivot -- rotating position alone and resetting
  oldx/oldy to match would zero out whatever velocity the point already had
  from an in-progress swing, which is exactly the "freezes mid-swing" bug an
  earlier version of this had (see CHANGELOG).
- The cut-sweep animation (`cutProgress`, driven by the Cut Speed dev
  control) is a purely cosmetic overlay (`renderCutSweep()`, anchored to the
  piece's own *live* `points[0]` position every frame, not a remembered
  static point) -- it must never gate a piece's physics. An earlier version
  froze the piece (skipped its integration/floor-collision/pile-repulsion)
  for the sweep's duration, which visibly paused a rope that was already
  mid-swing when cut -- exactly what the sweep animation must NOT do.
- `onPointerDown` clears any existing `holdTimer` before starting a new one.
  Without this, a pointerdown that never reaches a matching pointerup/
  pointercancel (a dropped event, or any interaction that doesn't cleanly
  round-trip) leaves its `holdTimer` reference orphaned once the *next*
  pointerdown overwrites the `holdTimer` variable -- the orphaned timer
  still fires ~180ms after its own (stale) pointerdown, and its callback
  reads the then-current (now different) `downInfo` and marks it as a false
  hold, silently swallowing whatever click was actually in progress (both
  punch and cut return early on `info.isHold`). This is the actual root
  cause behind an intermittent "double-click-to-cut just stops working"
  report. The fix itself was verified afterward by reproducing the race
  scenario (an orphaned pointerdown followed by real clicks landing in its
  180ms window) in an isolated async test and confirming the click still
  resolves correctly -- the pre-fix code was not separately re-tested to
  confirm it actually reproduces the corruption, so this is the identified
  mechanism and a verified fix, not a verified-then-fixed repro.
- `applyPanelGeometry(null)` deliberately resets panel position/size/style to
  their defaults rather than being a no-op -- needed so switching to a
  Desktop/Mobile tab with nothing saved yet doesn't silently keep showing
  whatever the other tab's live (possibly unsaved) geometry/style was.
- Every `el.setPointerCapture(pointerId)` call is wrapped in `tryCapture()`
  (try/catch) and every drag/resize/reorder handler attaches its move/up
  listeners to `window`, not the captured element -- `setPointerCapture`
  throws `NotFoundError` for a pointerId the browser doesn't consider
  "active" (hit directly during this build: synthetic `PointerEvent`s
  dispatched via `javascript_tool` for testing all triggered it), and an
  uncaught throw there would otherwise abort the rest of the handler before
  the move/up listeners are ever attached, silently breaking the feature.
- Piling between fallen pieces is a plain pairwise point-repulsion pass
  (`pileRepulsion()`), not a rigid-body/polygon collision system -- a cheap
  approximation that reads as natural stacking for a handful of pieces, not
  an exact physical simulation. `MAX_FALLEN_PIECES` (60) silently drops the
  oldest piece once exceeded, to bound the O(n^2) repulsion cost.
- This headless testing environment doesn't composite frames for the
  Browser-pane tab, which throttles/pauses `requestAnimationFrame` entirely
  -- physics verification during this build was done by calling the
  (temporarily exposed) `update()` function directly in a loop via
  `javascript_tool`, not by watching the live animation. A real browser tab
  (visible, foregrounded) runs the `requestAnimationFrame` loop normally;
  this only affects how this specific environment was used to test it.
