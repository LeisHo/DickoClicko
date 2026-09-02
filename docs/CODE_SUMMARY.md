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
    -> control types: slider, color, checkbox, dropdown (added for
       Endcap Design -- the first project setting needing a fixed set of
       named choices rather than a continuous/boolean value). A dropdown
       entry needs `options:[{value,label},...]` alongside the usual
       key/label/def; cfg[key] holds the selected option's `value` string.

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
       thinner into something stick-stiff (see Gotchas). segLen itself is
       pinned to exactly TARGET_SEG_LEN_VH at all times; mainRope.totalLength
       is the separate, persisted "real" current length growRope()/cutRopeAt()
       actually accumulate against (see Gotchas -- these two used to be the
       same derived value, and splitting them was itself a bug-fix).
       mainRope.tipGrowLen is a THIRD piece of state: how far the LAST
       segment currently reaches toward a full TARGET_SEG_LEN_VH (always
       full except mid-growth, when growRope() advances it 0->targetSeg
       every frame). Unlike every other segment, the growing tip is NOT
       solved by integrateChain()'s iterative distance constraint at all --
       positionGrowingTip() places it directly each frame, in the settled
       chain's own local direction (tipGrowDirection()), with zero implied
       velocity (oldx/oldy set to match). See Gotchas for why a constraint-
       based version of this (a continuously-rising target fed into the
       solver) was tried first and caused a real, reproduced instability
       over long holds.

ENDCAP_DESIGNS / drawEndcap() (data/Rope/End1.svg, End2.svg, End3.svg, End4.svg)
    -> optional decorative shapes at the free/tip end of mainRope and every
       fallenPiece (render(), Endcap Design dropdown), replacing the plain
       round cap entirely rather than stacking both. Embedded as Path2D
       objects using each SVG path's own coordinates verbatim -- see
       Gotchas for why the scale/anchor math uses ONE shared
       ENDCAP_ALIGNMENT reference (from data/Rope/End Alignment.svg) for
       every design, not each path's own bbox. Filled with
       cfg.ropeColor (not the SVGs' own authored white), so it always
       matches the rope; cfg.endcapHeight scales ONLY the local "down" axis
       (independent of the width-matching scale), stretching the cap
       vertically while its top edge stays pinned exactly at the tip --
       safe because the anchor-shift translate is applied last in the
       transform chain (so it acts first on the raw path coordinates),
       putting the anchor at local (0,0), which no scale factor can move.
       Optional "Endcap At Cut End" checkbox (ROPE CUT group,
       cfg.endcapAtCutEnd): when on, each fallenPiece ALSO gets a cap at
       points[0] (its severed/cut edge, per renderCutSweep's own
       convention -- see Gotchas), not just its original tip end. Reuses
       drawEndcap() unchanged by passing `[...piece.points].reverse()` --
       that puts the cut point at index length-1 (the position
       drawEndcap always caps) and its neighbor at length-2 (its
       orientation reference), so no second code path was needed.
       mainRope itself is never affected: its own tip already IS the cut
       point after a cut (the falling piece keeps the OTHER end), so it
       was already correctly capped by the existing single call.

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
per §12d/§12l (revised 2026-09-02), Save Settings writes ONLY to a
git-tracked settings log, `data/processed/dev-panel-settings.json` -- there
is no parallel localStorage default. The File System Access API backs this:
`writeGitSettingsLog()`/`readGitSettingsLog()` go through
`getGitSettingsFileHandle(mode, promptIfMissing)`, whose resolved handle is
persisted in IndexedDB (`idbGet()`/`idbSet()`) after the first save's native
picker dialog, so later saves/reads need no dialog at all. `mode` is `'read'`
for boot-time/Reset (uses only the non-prompting `queryPermission()` --
there's no user gesture at boot to back a real permission prompt; falls back
to hardcoded defaults if nothing is reachable yet) or `'readwrite'` for Save
(always gesture-backed, so it can fall through to
`requestPermission()`/`showSaveFilePicker()`). The saved snapshot is one
blob: `{values, order, panelGeometry}` -- setting *values* and *group/row
order* are shared across Desktop/Mobile (every control in this project is
judged non-device-specific, see project CLAUDE.md), while `panelGeometry`
holds two independent entries keyed by `activeDeviceTab`, switched by
clicking the Desktop/Mobile tab buttons -- independent of the actual live
viewport width, so the panel's mobile layout can be previewed without
resizing the real browser window. The built-in "Dev Panel" group (§12i: font
sizes, opacity, colors for the panel's own chrome) is judged device-specific
the same way, so `panelStyle{}` rides inside `panelGeometry`'s per-tab entry
(`getPanelGeometry()`'s `.style` field) rather than living in `cfg`; applied
live via CSS custom properties (`--dp-title-size`, `--dp-bg`, etc.) set on
`#devPanel` by `applyPanelStyle()`. `PANEL_STYLE_CONTROLS` is ONE array
(each entry carries its own `type: 'slider'|'color'`) so its rows can be
freely interleaved/reordered like any other group's -- an earlier version
split sliders and colors into two separate arrays, which made an
interleaved row order structurally impossible to represent at all.

An in-memory `lastLoadedSnapshot` (set by the last successful
save/`readGitSettingsLog()`) is what `copySettings()` and the Desktop/Mobile
tab-switch handler use to preview the *other* device's saved panel geometry
-- there is nothing else to fall back to now that localStorage is gone, so
before any save/reset in a fresh page load, the "other" tab's geometry is
simply unknown (`null`, i.e. CSS default) until a real read succeeds.

§12l's "no server, opened directly as a local file" exception (added
2026-09-02): `GIT_LOG_WRITABLE` gates `saveSettings()`/`resetSettings()`
between the git-log path above and a `SESSION_FALLBACK_KEY` `sessionStorage`
fallback. Gated on PROTOCOL, not just API capability (corrected same day,
per explicit user clarification -- the original version checked only
`'showSaveFilePicker' in window`, which stayed true even when this page was
opened as a bare local file in a browser that happens to support the API,
so it would have still triggered the native save-file picker/disk write in
exactly the case the exception exists to avoid): `GIT_LOG_WRITABLE =
location.protocol !== 'file:' && 'showSaveFilePicker' in window` -- false
both when there's genuinely no server behind the page (`file://`, matching
`DEV_MODE`'s own protocol check just above) AND when the browser lacks the
API entirely (Firefox/Safari), true only when served (http/https,
including a local dev server) with the API present. `sessionStorage`, not
`localStorage`, deliberately: it's gone the moment the tab closes, so it
can never become the persistent "separate browser-local default" §12d/§12l
otherwise bans -- it exists only so a Save made in this mode has anything
for that same tab's own Reset to read back. The Save button says "Saved
(session only)" in this mode, never "Saved!", so it's never mistaken for a
real git-log write.

Gesture dispatch (`onPointerDown`/`onPointerUp`): which hold behavior
applies is decided by WHERE the hold starts, checked once at pointerdown
(`isOnCircle()`, with a generous margin beyond the circle's own visual
radius -- see Gotchas) -- a hold starting on/near the circle grows the rope
(existing `growing`/`growRope()` path); a hold starting on the rope charges
punch intensity instead (`downInfo.charging`) and fires the punch
immediately on release IF it's within `cfg.holdDistance` of the rope,
intensity scaled linearly from `cfg.clickIntensity` (at 0 held time) up to
`cfg.clickIntensity + cfg.intensityCeiling` (at `cfg.clickHoldMaxDuration`,
clamped beyond that) -- Intensity Ceiling stacks ON TOP of Click Intensity
per explicit request, it does not replace it; a hold that's released
essentially immediately still punches at the same intensity a quick tap
would.
Charging isn't limited by `clickDistance` (its own, separate, more generous
`holdDistance` governs it instead) -- press anywhere and hold; only a quick
tap needs real proximity (`clickDistance`) to the rope to mean anything (see
Gotchas for why `charging`'s own eligibility timer is `cfg.doubleClickThreshold`,
not the shorter `HOLD_THRESHOLD_MS`).

Physics timestep: `loop()` runs a fixed-timestep accumulator
(`FIXED_DT = 1/60`) -- `update()` always advances by exactly that much,
called as many times as needed to catch up to real elapsed time, rather
than being fed the raw (jittery) per-frame `requestAnimationFrame` delta
directly. `render()` still runs once per real frame. This is what fixed a
general "everything looks slightly jumpy" report -- growth rate, cut-sweep
speed, and the verlet integration itself were all stepping by a
frame-time-dependent (and therefore jittery) amount before this.

--------------------------------------------------------------------------------
UNTOUCHABLE SYSTEMS

None formally designated yet -- this is the initial build.

--------------------------------------------------------------------------------
GOTCHAS

- `mainRope.segLen` and `mainRope.totalLength` are deliberately two separate
  fields, not one derived from the other. `segLen` is pinned to exactly
  `TARGET_SEG_LEN_VH` forever (see the mainRope architecture note above) --
  which means `segLen * (points.length - 1)` only reflects the rope's real
  current length in whole-point-count jumps, NOT continuously. `totalLength`
  is what `growRope()` actually accumulates growth against every frame, and
  what `cutRopeAt()` recomputes after truncating `points`. An earlier version
  had `growRope()` re-derive "current total" from `segLen * pointCount`
  every frame instead of reading a persisted value -- since that product
  doesn't change at all between point-insertions, growth would silently
  stall for however long it took to cross the next whole-point threshold,
  found by direct reproduction (ropeLength climbed once, then sat frozen for
  270+ simulated frames despite `growing` staying `true` the whole time).
  Any code that changes the rope's real length (a new growth mechanic, a
  different cut behavior, etc.) must update `mainRope.totalLength`
  explicitly -- and if it also changes `cfg.ropeLength`'s displayed value,
  update that too (`cutRopeAt()` does both, via `setCfg('ropeLength', ...)`,
  so the Rope Length slider doesn't show a stale pre-cut length that would
  un-cut the rope if nudged).
- `resetMainRope()` (boot only, called exactly once) MUST build the chain
  using `segLen = vh(TARGET_SEG_LEN_VH)` -- the same constant
  `setMainRopeTotalLength()` pins everything to -- never a POINT_COUNT- or
  cfg.ropeLength-derived value of its own. It used to compute its own
  `totalLen / (POINT_COUNT - 1)`, which only happened to equal
  `TARGET_SEG_LEN_VH` back when Rope Length's default was still 45 (the
  value `TARGET_SEG_LEN_VH` was literally computed from); once a later
  "set defaults" round changed Rope Length's default to
  100.16051775147857 without updating `TARGET_SEG_LEN_VH` to match, the two
  silently diverged (segLen ~55 vs targetSeg ~24.9 at 720px height). Any
  code path that then called `setMainRopeTotalLength()` -- dragging the
  Rope Length slider at all, or `resetSettings()` reapplying a saved
  `ropeLength` value at boot -- unconditionally overwrote `segLen` to
  `targetSeg` for every existing point in one frame, a whole-chain
  rest-length jump the constraint solver had to violently correct: the
  exact bounce/glitch reported both live (first touch of the slider) and
  on page load (after Save Settings had persisted a shorter length).
  Confirmed the mechanism and the fix by direct reproduction, not just
  code review: before the fix would have shown `segLen=55.47...` vs
  `targetSeg=24.92...` at the reported default; after the fix, a real
  boot with a saved `ropeLength:20` loaded `segLen`/`pointCount` already
  equal to what `setMainRopeTotalLength()` independently computes for the
  same total, and reapplying it produced exactly 0 positional displacement
  on every point (a true no-op) instead of a correction.
- Rope growth reads as smooth, continuous extension, not the whole-segment
  jumps it used to (the rope sitting visibly still for several frames, then
  snapping ~1 targetSeg length -- around 25px at current defaults -- into
  place all at once). `growRope()` advances `mainRope.tipGrowLen` by that
  frame's growth every frame (never in whole-point jumps); once it reaches a
  full `targetSeg`, `growRope()` commits: fixes the just-finished segment at
  exactly `targetSeg` (clamping away any single-frame overshoot), pushes a
  fresh zero-length tip point, and carries the overshoot forward into the
  new tip's own `tipGrowLen` so no accumulated growth is lost (a `while`
  loop covers a growth rate fast enough to complete more than one segment
  in a single frame). `resetMainRope()`/`setMainRopeTotalLength()` (direct
  sets: slider drag, saved-settings reload, cut) always set `tipGrowLen =
  segLen` (fully committed) -- `growRope()` is the only place that lets it
  sit below that.
- **The growing tip must be placed directly (`positionGrowingTip()`),
  NEVER fed into `integrateChain()`'s iterative distance-constraint solver
  as a moving rest-length target.** A first version did exactly that (an
  optional `tipSegLen` param overriding the last segment's rest length,
  with the ordinary solver pulling the tip out to match a target that rose
  every frame) -- it looked correct in short tests (a rising target
  produces a perfect sawtooth in the tip segment's own length, and that
  alone was thoroughly verified), but a real user video of an extended
  hold-to-grow session showed the rope violently whipping/tangling after
  several seconds, self-correcting, and behaving noticeably better (though
  still with a faint tip wobble) after a cut reset the point count. A
  15-second, 900-frame direct reproduction confirmed the mechanism: a
  continuously-rising target fed into a solver limited to
  `CONSTRAINT_ITERATIONS=6`, damped only by `DAMPING=0.99` (barely any
  energy loss per frame), acts as a sustained forcing function -- residual
  correction error compounds over hundreds of frames into a large,
  non-monotonic tangle (segment lengths measured up to 2.93x rest length,
  points folding back on themselves in Y instead of hanging straight down).
  Fixed by excluding the growing tip from the constraint solve entirely
  (`integrateChain()`'s `skipLastSegment` shortens its loop by one) and
  positioning it directly every frame instead: `tipGrowDirection()` reads
  the SETTLED chain's own local tangent (the segment before `prev`, never
  the tip's own current/about-to-be-overwritten position), and the tip is
  placed at `prev + direction * tipGrowLen` with `oldx/oldy` set to match
  (zero implied velocity -- it can never accumulate momentum of its own).
  The rest of the chain is completely unaffected and behaves exactly as
  before. Re-verified the same 900-frame/15s stress test (with `cfg.
  ropeLength` explicitly reset first -- a stale large value left over from
  a prior test call inflated an earlier run to 137+ points and produced a
  misleading "still bad" reading before this was caught): 0 non-monotonic
  points across the full run (vs. many with the old approach), and the
  worst single segment-length ratio dropped to a smooth, gradually-rising
  1.36x by 15s -- a separate, much milder, likely pre-existing property of
  a fixed-iteration solver applied to a very long chain, not a tangle.
  Re-ran the tip-smoothness sawtooth check against the new kinematic
  version too: still an exact match to the per-frame growth amount, every
  frame, including with an initial sideways swing applied. Also verified
  via a REAL dispatched pointerdown/pointerup gesture (not just direct
  `growRope()`/`update()` calls) held for a simulated 15s: 0 non-monotonic
  points, and `growing` correctly flips false on release.
- The Click-And-Hold-Distance gate on a charged hold's release must be
  computed from the RELEASE position (`e.clientX/e.clientY` in
  `onPointerUp`), not from `info.hit` -- `info.hit` is captured once at
  `onPointerDown` time and never updated, so it's frozen at wherever the
  press started. An earlier version checked `info.hit.dist` at release,
  which meant moving the pointer toward the rope during the hold had NO
  effect on whether it fired at all -- a hold that started too far from the
  rope stayed stuck failing even after being dragged right over it,
  matching a real user report ("click and hold doesn't work... I should be
  able to click and hold anywhere, then when I release... within the
  tolerance distance, it flicks the rope"). Fixed by computing a fresh
  `releaseHit = nearestPointOnRope(e.clientX, e.clientY, mainRope.points)`
  in `onPointerUp` and gating/aiming the punch with that instead. Verified
  via dispatched PointerEvents with real elapsed hold time (not just
  code review): press far away + release near the rope now fires; press far
  + release far still correctly does not; press near + release near
  (regression) still fires.
- `isOnCircle()`'s hit-radius is the circle's own visual radius PLUS a fixed
  `vmin(4)` margin, not the bare visual radius -- a small `circleSize` (the
  default is 4.5%vmin) is an easy miss otherwise, especially since the rope
  renders visually through/over the circle right where it emerges. This
  margin gates both hold-to-grow eligibility and the rope's own exclusion
  zone (in `hitTestRope()`), so the two stay consistent -- a press "clearly
  meant for the circle" that lands just outside its exact pixel boundary
  should never fall through to charging a punch instead.
- `initPanelDrag()`'s `move()` clamps `left`/`top` against the panel's own
  actual `width`/`height` (captured in `r` at drag start), not a fixed stub
  margin -- an earlier version clamped to `window.innerWidth/Height - 40`
  regardless of the panel's real size, so dragging toward an edge let most
  of the panel (including the resize corners, which sit right at its own
  edges) go off-screen well before the drag actually stopped. Confirmed via
  a 2000px-overshoot drag in each direction landing exactly flush with the
  viewport edge (`right === innerWidth`, `bottom === innerHeight`, or
  `left/top === 0`), not just "roughly on-screen."
- `initResizeHandles()`'s `move()` math for `n`/`s` must stay in sync with
  the CSS `max-height:88vh` on `#devPanel` (its own `maxH` local constant,
  `window.innerHeight * 0.88`) -- letting the requested height diverge from
  what CSS actually renders was a real, reproduced bug: dragging `s` went
  silently unresponsive past the cap (JS kept accumulating a `style.height`
  far beyond what was visibly happening), and dragging `n` was worse -- it
  pushed the panel's `top` off-screen (negative, above the viewport) while
  the uncompensated `height` stayed clamped, so the panel visibly shrank
  from the BOTTOM while its top flew away, instead of the top edge moving
  and the bottom staying put. Fixed by deriving `n`'s `height` FROM its
  (separately clamped) `top` around the fixed `bottomEdge` point, rather
  than computing the two independently -- see the inline comment at the
  call site for the exact clamp order.
- `charging` only becomes eligible after holding for `cfg.doubleClickThreshold`
  ms, not the shorter `HOLD_THRESHOLD_MS` -- this is provably, not just
  empirically, safe against ever hijacking a real double-click into a
  charged punch instead of a cut: if a release's own press duration already
  exceeds `doubleClickThreshold`, the gap from the FIRST click's release
  (necessarily earlier still) must exceed `doubleClickThreshold` too, so it
  could never have passed the `pendingClick` gap check either way. An
  earlier version used `HOLD_THRESHOLD_MS` (180ms) for this, which a real
  human's second click of a double-click can easily exceed just by being
  slightly deliberate about it -- confirmed as the actual cause of a
  reported "cutting bounces the rope like a punch" bug (reproduced directly:
  a second click held 200ms, comfortably still within the double-click gap,
  used to fire a charged punch instead of completing the cut).

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
- `ENDCAP_ALIGNMENT` (`width`/`topY`/`topCenterX`) is ONE shared scale/anchor
  reference for every design in `ENDCAP_DESIGNS`, not a per-design bbox
  measurement -- read directly from `data/Rope/End Alignment.svg`'s
  `<line x1="41.57" y1="80.26" x2="96.06" y2="80.26">` (its explicit
  numeric attributes, no `getBBox()` needed for a plain line). Earlier
  (End1/End2 only) each design measured its own real `getBBox()`
  independently; once a 3rd design (End3.svg) arrived specifically
  authored to start at the alignment line's own `(x1,y1)`, the project
  moved to one shared reference per explicit request, so swapping designs
  in the dropdown doesn't change the cap's apparent size/anchor point --
  only its shape. Never revert to per-design bbox measurement; add a new
  design by giving it ONLY a `path`, no its own width/topY/topCenterX.
  `drawEndcap()`'s transform order matters: translate to the tip, rotate,
  scale, THEN translate by `-ENDCAP_ALIGNMENT.topCenterX,-topY` (applied
  last so it acts first on the path's own local coordinates) -- this is
  what makes the alignment line's own center (not the SVG's origin, not
  any individual design's own bbox center) the pivot that lands exactly
  on the tip point for every design uniformly. The rotation angle
  (`Math.atan2(-dir.x, dir.y)`) maps local "down" (both SVGs' authored
  orientation) onto the tip segment's actual current direction, so the cap
  reorients correctly even when the rope is swinging or hangs at an angle
  -- confirmed via a direct pixel scan of the rendered canvas (not just
  code review): with the tip segment forced to point straight down, the
  cap's white pixels appeared directly below the tip; forced to point
  right instead, the same white pixels appeared to the right of the tip.
  Both `mainRope` and every `fallenPieces` entry share the exact same
  `drawEndcap()` call in `render()` -- there is no special-casing for
  cut pieces, so a fresh cut's remaining tip picks up the cap
  automatically, with no extra code needed. Confirmed the cap was white
  originally (matching both source SVGs' authored `fill:#fff`) and fixed
  it to use `cfg.ropeColor` per an explicit request; `cfg.endcapHeight`
  (a later addition) scales only the local Y axis inside the same
  transform chain, verified to keep the top edge exactly pinned at the
  tip at every tested multiplier (0.5x-3x) while the cap's rendered
  extent scaled linearly (2x height produced exactly 2x the measured
  pixel extent).
- The dev panel's minimum resize size is derived live from
  `computeMinPanelSize()` (header's title `scrollWidth` + collapse
  button width + header padding/gap, for width; header's own
  `offsetHeight`, for height), never a hardcoded guess -- per the
  workspace `CLAUDE.md` §12c requirement added after this project's
  panel already shipped with hardcoded `minW=220,minH=140` (in both the
  JS resize math AND a matching CSS `#devPanel{min-width:220px;
  min-height:140px}` -- exactly the two-sources-of-truth pattern that
  caused the earlier `max-height:88vh` bug in this same file, so both
  were removed together). Computed FRESH at the start of every
  resize-drag (not cached once at boot) because the title's rendered
  width depends on the Dev Panel Title Font Size slider, a live setting;
  a cached value would go stale the moment that slider moves.
  `#dpFps` (the fps counter, `flex:1 1 auto`) is deliberately excluded
  from the floor -- it's the header's own designated shrink-first
  element and isn't a click target, so letting it hit zero width is
  fine; everything below the header already scrolls
  (`.dp-body{overflow-y:auto}`), so it can shrink to 0 too. Real
  measured floor at this project's current header content: 81x34px (vs.
  the old hardcoded 220x140).
- `tipGrowDirection()` MUST fall back to a real direction (straight down)
  when `prev`/`beforePrev` coincide, never silently return `(0,0)`. For a
  2-point rope (`pts[n-3]` underflows past index 0, so both `prev` and
  `beforePrev` resolve to the SAME anchor point), the old code's `|| 1`
  fallback only guarded the divisor, not the degenerate `dx=dy=0` case
  itself, so it returned direction `(0,0)`. Both `positionGrowingTip()`
  and `growRope()`'s commit then placed the new point at EXACTLY `prev`'s
  position -- collapsing multiple chain points onto the same coordinate --
  and `integrateChain()`'s distance constraint, solving a real `segLen`
  against a ~0 measured distance the next frame, produced an effectively
  arbitrary-direction correction (the `|| 0.0001` distance floor divides a
  near-zero `dx,dy` by a value close to 0, amplifying float noise into a
  essentially random kick). This is exactly the tight knot/tangle right at
  the anchor a user reported after cutting the rope down to 2 points and
  then repeatedly growing it -- confirmed by direct reproduction (forced a
  2-point rope, ran 5 real hold-to-grow cycles via dispatched pointer
  events with manually-stepped physics since `requestAnimationFrame`
  doesn't run in this environment): before the fix this collapsed
  immediately; after, `minPairDist` never dropped below ~22px (targetSeg
  ~32px) across all 5 cycles, with 0 non-monotonic points throughout.
- `cutRopeAt()` refuses a cut whose TARGET point (`hit.x,hit.y`, not the
  press position) falls within `cfg.circleCutDistance` of the anchor, on
  top of the existing `minRopeLength` guard. A double-click landing just
  outside `isOnCircle()`'s own (smaller, hold-eligibility) margin can
  still target a rope point well within the circle's zone -- e.g. a click
  offset mostly sideways from the circle, whose nearest point on the
  (vertical) rope still projects close to the anchor in Y. This was
  originally implemented by reusing `isOnCircle()`'s own margin directly,
  but that turned out not to be generous enough for real reported clicks
  (the user hit this same failure mode twice more after that fix shipped)
  -- replaced with `circleCutDistance`, an independent, directly
  user-tunable dev slider, decoupled from `isOnCircle()`'s own radius so
  it can be set more generously without also changing hold-to-grow
  eligibility. Confirmed via a targeted reproduction
  (`isOnCircleAtClick:false`, hit within `circleCutDistance` of the
  anchor) that this used to cut successfully and now correctly gets
  rejected, while a normal cut well clear of the circle still succeeds
  (regression-checked).
- `DAMPING` and `CONSTRAINT_ITERATIONS` are now `cfg.damping`/
  `cfg.constraintIterations` dev sliders (ROPE ANIMATION group), not
  hardcoded module constants -- `integrateChain()` reads them from `cfg`
  directly (both call sites: the velocity/damping loop and the
  distance-constraint loop). Default changed from `0.99`/`6` to `0.85`/
  `10` after a 4th round of "rope physics is erratic/jitters/swings
  wildly" reports: an exhaustive reproduction sweep at the OLD defaults
  found zero divergence/instability (a fully-settled rope showed
  EXACTLY 0 movement, bit-for-bit, over 120 traced frames -- ruling out
  a genuine "jitter at rest" bug in the solver itself), but a single
  punch took ~3.65s of real visible swinging to settle below a
  0.3px/frame threshold -- plausibly reading as "erratic" purely from
  how long it stays visibly in motion, especially under frequent
  interaction. Swept several damping/iteration combinations measuring
  settle time AND worst-case segment-stretch ratio together (never
  picking a value that improved one at the real expense of the other):
  0.85/10 settles a real punch in ~1.77s (vs 3.65s) while ALSO reducing
  worst-case stretch (~1.07x vs ~1.15x) and leaving a fully-settled rope
  still effectively perfectly still (max residual movement ~0.001px/frame
  -- below any visible threshold). Exposed as sliders rather than picked
  once and hardcoded, specifically so this doesn't need another
  round-trip if the chosen default still isn't quite right.
- `positionGrowingTip()` LERPS the growing tip's rendered position toward
  its raw target (`tip.x/y += (target - tip.x/y) * 0.4` originally, tuned
  down to `0.25`) instead of snapping straight to it every frame, after a
  5th round of feedback ("rope animation isn't erratic anymore but the
  extension still isn't smooth, it's jittery") landed once the
  damping/iterations fix above had already resolved the earlier, larger
  "erratic swinging" complaint -- a narrower, real residual. Diagnosed by
  instrumenting `growRope()`/`integrateChain()`/`positionGrowingTip()`
  directly (a manual step-by-step reconstruction of `update()`'s own call
  order kept landing on frame offsets that didn't match a real
  `update()`-driven trace, so the reliable method was always driving
  growth through the real `update()` function and reading `pts[pts.length
  - 1].y` every frame, exactly what `strokeRopeCurve()` renders as the
  rope's own endpoint). Two independent, additive sources of frame-to-frame
  noise were confirmed this way: (1) `dir.prev` (the real physics point
  right behind the growing tip) is still subject to the constraint
  solver's own ordinary per-frame "breathing" even while otherwise
  visually settled, and since `positionGrowingTip()` anchors the tip's
  ABSOLUTE position to `dir.prev` every frame, that breathing showed
  through 1:1; (2) every time a segment completes, `dir.prev`'s IDENTITY
  switches to the just-finalized point, and the newly-pushed
  zero-length tip briefly started at zero velocity next to a
  neighbor that could still be moving, which the constraint solver then
  had to correct for over the next few frames. Fix #1 for the identity
  switch: `growRope()`'s commit code now gives the newly-finalized point
  (and the fresh tip started right after it) `dir.prev`'s CURRENT velocity
  instead of zero (`vx/vy = dir.prev.(x|y) - dir.prev.old(x|y)`) --
  measured to have negligible effect ALONE (the big, roughly-constant
  ~+14.9px forward step at each commit boundary was unchanged before/after:
  14.82px vs 14.90px on repeat 120-frame traces), but reasoned as correct
  regardless (a newly-created point starting at rest next to a moving
  neighbor is objectively worse than inheriting its velocity) and kept.
  Fix #2, the one that actually moved the measured numbers: smoothing
  `positionGrowingTip()`'s output. Swept smoothing factors on a clean
  180-frame hold-to-grow trace (same rope, same settle, same growth rate),
  counting how many of the 179 frame-to-frame deltas were NEGATIVE
  (the tip visibly moving backward for one frame -- the actual
  perceptible "jitter," since the discrete ~+14.9px forward step at each
  commit is monotonic with the overall growth direction and, being a
  single 16.7ms frame once every ~14 frames, was judged separately as very
  unlikely to read as jitter to a human eye): no smoothing (direct snap) --
  19-20 negative deltas per 180 frames, worst -2.94px; smoothing=0.4 --
  still 20 negative deltas but worst reduced to -0.82px; smoothing=0.25 --
  14 negative deltas, worst -0.67px. Settled on 0.25. `tipGrowLen`/
  `mainRope.totalLength` (the actual growth accounting) are untouched by
  either fix -- only the rendered pixel position of the still-growing tip
  lags slightly behind its true target, imperceptible against the ~2px/
  frame steady growth rate at the default Rope Growth Rate.
- The double-click-cut sweep-mark (`cutSweep`) moved from a property on
  the FALLING piece to a property on whichever entity KEEPS ITS OWN
  IDENTITY through the cut -- `mainRope` after `cutRopeAt()`, or the piece
  that keeps `points` after `cutPieceAt()` splits it -- per an explicit,
  exactly-backwards bug report: "when the rope is cut, the white line...
  should stay with the rope instead of the cut segment." Previously
  `renderCutSweep(piece)` read `piece.cutProgress`/`piece.cutNx/cutNy/
  cutStartOffset/cutEndOffset` and anchored to `piece.points[0]` -- so the
  mark visibly followed whatever fell/swung away, not the rope the user
  was still holding. `renderCutSweep(entity)` is now generic (reads
  `entity.points`/`entity.cutSweep`), and `update()`/`render()` both
  advance/draw `mainRope.cutSweep` AND every `fallenPieces[i].cutSweep`
  independently (a rope cut and any number of later piece-splits each
  animate on their own timeline; only entities with an ACTIVE, in-progress
  sweep are touched, `progress >= 1` ones aren't). `cfg.cutSweepColor`/
  `cfg.cutSweepThickness` (ROPE CUT group) replace the previously hardcoded
  `'#ffffff'` / `Math.max(2, vmin(cfg.ropeThickness)*0.35)`, per explicit
  request alongside the placement fix.
- Fallen pieces are now double-click-cuttable (`cutPieceAt(pieceIndex, hit,
  clickX, clickY)`), splitting one piece into two independent pieces at
  the click point -- same tangent/normal/toppling geometry as
  `cutRopeAt()`'s own piece-detach, factored into a shared `topplePiece()`
  helper (identical rotation-around-pivot logic, used by both), but with
  no anchor-pin or growth-accounting since a fallen piece has neither.
  `hitTestAny(x, y)` returns whichever of the main rope (`hitTestRope`) or
  the nearest in-range fallen piece (`hitTestPieces`, one `nearestPointOnRope`
  call per piece) is closer, tagged `target: 'rope' | 'piece'` (+
  `pieceIndex` for the piece case) -- used ONLY to decide the double-click
  branch's cut target, resolved fresh at RELEASE time (not the stale
  press-time hit) since a piece may have fallen/swung since the press, same
  reasoning as the existing hold-charge release-position handling.
  Single-tap punch and hold-to-charge intentionally stay rope-only
  (unchanged scope, per the request's own wording -- only double-click-cut
  was asked to extend to pieces): the quick-tap branch now arms
  `pendingClick` off `hitTestAny()` (so a double-click aimed at a piece, or
  a mix of a rope-tap and a piece-tap, still registers as a double-click),
  but the single-tap-punch timeout callback still gates on the ORIGINAL
  press-time `info.hit.dist <= clickDistance` (rope-only), unchanged from
  before pieces became cuttable.
- `logClick(event, data)` (`console.log('[click]', event, data)`,
  DEV_MODE-gated) is a standing diagnostic, not a temporary debug hook --
  added per explicit request for permanent click/hold/double-click
  visibility. Called at every real input-state transition in
  `onPointerDown`/`onPointerUp`: `down:circle`, `down:rope`,
  `hold:grow-start`, `hold:charging-start`, `up:circle`, `up:double-click`,
  `up:hold-release-too-far`, `up:hold-release-punch`, `up:tap-too-far`,
  `up:tap-pending`, `up:tap-punch`, and `cancel` (on `pointercancel`).
  Verified via dispatched synthetic `PointerEvent`s + `read_console_messages`
  that a real tap produces exactly `down:rope` -> `up:tap-pending` ->
  (after the double-click-threshold timer) `up:tap-punch`, in order, with
  the logged `hitDist`/`intensity` matching the actual computed values.
  Console-only turned out to be the wrong read of the original request --
  the user clarified it needs to be visible IN the dev panel, not just the
  browser console, so `logClick()` also writes each entry into
  `#dpClickLog` (a scrollable `<div>` below `#dpGroups`, capped at
  `CLICK_LOG_MAX_ENTRIES=200`, oldest entries dropped from the front,
  auto-scrolled to bottom on each append, with a Clear button wired
  through `initDevPanelChrome()`) -- confirmed live via the actual
  onPointerDown/onPointerUp path (not calling `logClick()` directly): a
  dispatched rope tap produced exactly 3 new `<div>` children in
  `#dpClickLog` with the expected text.
- **`integrateChain()` gained a bending constraint (`cfg.bendStiffness`,
  ROPE ANIMATION group, default `0.15`) alongside its existing distance
  constraints.** Root-caused from 2 fresh user-recorded videos (one
  showing "crazy movement" after a single click, one showing the
  extension "still jittery" even after the damping/iterations fix already
  shipped) -- frame-extraction (Python + OpenCV, `ffmpeg` not available in
  this environment) of the single-click video showed the rope visibly
  curling into a HOOK/KNOT shape immediately after the click and staying
  visibly kinked for several real seconds (still visible ~5s later),
  not a normal decaying swing. Root cause: pure distance (PBD-style)
  constraints have NO concept of local bending angle -- a segment pair can
  fold back on itself (angle up to 180°) and satisfy the distance solver
  exactly as well as if it were straight, since only inter-point DISTANCE
  is checked, never the ANGLE between consecutive segments. `applyPunch()`
  pushes a wide Gaussian-falloff neighborhood of points sideways by
  DIFFERENT amounts (proportional to `exp(-((i-hitIndex)/3)^2)`), which
  can easily invert the local point ORDER near the (lightly-anchored,
  free) tip end, and the distance solver alone has no way to ever recover
  from that -- it's a stable local configuration, not an unstable one.
  Directly reproduced by replicating `applyPunch()`'s own math against a
  live rope and measuring the distance spanning 2 segments (points[i] to
  points[i+2], which should be close to `segLen*2` for anything
  reasonably straight): stuck at `23.28` vs an expected `55.38` (segLen
  27.69) after 3 full simulated seconds with the OLD constraint-only
  solver -- a real, persistent ~42%-of-expected fold, not a transient. The
  same underlying "the last few points can be almost anywhere, angle-wise,
  and the solver won't object" instability was ALSO the actual source of
  the endcap-rotation flicker during growth that `tipDirection()` exposed
  (see the smoothing entry above) -- confirmed by re-running THAT
  exact reproduction (nudge + settle + grow, tracking `tipDirection()`'s
  angle) with the bending constraint active: max frame-to-frame angle
  delta dropped from up to `180°` (full flips) down to `0.014°`, and the
  fold reproduction above dropped from `23.28` to `55.396` (vs expected
  `55.385` -- essentially exact). Implemented as: for every non-pinned
  interior point `1..points.length-2` (this range naturally excludes the
  growing tip at `points.length-1`, which is never touched by ANY
  constraint pass, kinematic or not, per the existing `skipLastSegment`
  design), pull it toward the midpoint of its immediate neighbors by
  `cfg.bendStiffness`, once per constraint iteration (same cadence/loop as
  the distance pass, so both converge together rather than fighting over
  iteration budget). `0.15` was chosen to be the smallest value that fully
  resolved the fold reproduction above while a regression check (punch a
  freshly-settled rope, track tip speed until it stays under a
  0.3px/frame threshold for 30 consecutive frames) showed settle time
  actually IMPROVED slightly (`~1.35s` vs the previously-measured
  `~1.77s` for a comparable punch) rather than making the rope look
  rigid/stick-like -- the bending pull evidently also damps the
  oscillation faster, not just prevents folding. Re-verified end-to-end
  via the REAL `onPointerDown`/`onPointerUp` handler path (not the
  synthetic direct-math reproduction): a dispatched punch on a live rope
  settled to a 2-point-span ratio of exactly `1.000` after 5 real
  simulated seconds.
- The double-click-cut sweep-mark's perpendicular direction is recomputed
  FRESH every `renderCutSweep()` call from `tipDirection(entity.points)`,
  not read from a `nx,ny` pair stored on the `cutSweep` object at cut time
  (removed from both `cutRopeAt()`'s and `cutPieceAt()`'s `cutSweep`
  object literals -- the local `nx,ny` vars are still needed there, just
  for the `side` calculation, not for storage). An earlier version froze
  the direction at the moment of the cut, so the mark's world-space
  orientation visibly stopped tracking the entity's own rotation as it
  kept swinging afterward -- reported both as "should follow the rotation
  and position of the end it was cut from instead of staying static" and,
  initially, as "cut line max length is [wrong versus] the width of the
  rope" (the same root cause: a stale normal makes the mark's apparent
  span look mismatched against the rope's ACTUAL current edges, even
  though its own length in world-space was always exactly
  `ropeThickness` -- `startOffset`/`endOffset` are pure ± magnitudes,
  unaffected by rotation). Verified via `tipDirection()` directly: forcing
  the last two points into a new relative position changes the returned
  direction immediately, confirming `renderCutSweep()` (which calls
  `tipDirection()` fresh every frame it runs) will track any future
  rotation the same way.
- `GIT_LOG_WRITABLE` now requires `DEV_MODE` in addition to
  `location.protocol !== 'file:'` and File System Access API presence --
  `DEV_MODE && location.protocol !== 'file:' && 'showSaveFilePicker' in
  window`. Per explicit report that clicking Save while viewing a Vercel
  deployment (a normal `https:` origin, not `file:`, not `localhost`)
  still triggered the native save-file picker/disk write -- the previous
  check only excluded `file:`, so any OTHER hosted origin (Vercel,
  GitHub Pages, etc.) still passed it even though there's no
  locally-tracked repo file on that visitor's machine for the write to
  meaningfully "track" through. `DEV_MODE` alone isn't a substitute for
  the protocol check (it still returns true for `file:`, which is exactly
  the case §12l's OWN exception needs to keep excluding) -- both
  conditions stay layered, not merged into one. Verified via a truth-table
  check of the 3-input boolean across the relevant cases (localhost,
  bare `file://`, an ordinary non-dev hosted origin, a hosted origin with
  explicit `?dev=1`, no-API-at-all) -- only the "hosted origin, no
  `?dev=1`" case flips from the old (wrong) `true` to the new (correct)
  `false`; every other case's result is unchanged from before.
