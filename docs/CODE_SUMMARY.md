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

ENDCAP_DESIGNS / drawEndcap() (data/Rope/End_Form1-*.svg, End_Form2-*.svg,
data/Rope/End_Form3-*.svg)
    -> optional decorative shapes at the free/tip end of mainRope and every
       fallenPiece (render(), Endcap Design dropdown), replacing the plain
       round cap entirely rather than stacking both. Each entry stores both
       the raw `d` string AND a Path2D built from it (ENDCAP_WIDTHS needs
       the raw string to measure each design's own true bbox width via a
       throwaway SVG element -- Path2D itself can't be measured). See
       Gotchas for why the scale/anchor math uses ONE shared
       ENDCAP_ALIGNMENT reference (from data/Rope/End Alignment.svg) for
       every design, not each path's own bbox, and for End Emerge (its own
       dev-panel group), which delays/scales-up a freshly-cut edge's
       endcap instead of showing it immediately. Filled with
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

Save/Reset are a 3-tier fallback chain (added to in full 2026-09-02), each
tier covering what the one before it can't:

1. **Vercel/GitHub API** (`writeSettingsViaApi()`/`readSettingsViaApi()`,
   `api/save-settings.js`) -- a serverless function commits straight to
   `data/processed/dev-panel-settings.json` via GitHub's Contents API,
   authenticated with a `GITHUB_TOKEN` env var and gated by a shared
   `DEV_PANEL_SAVE_SECRET` (sent as the `X-Dev-Panel-Secret` header --
   NOT a real secret, it ships in the client source same as CLICKO's
   identical mechanism; it exists only to stop a random visitor spamming
   commits). The ONLY tier that works from a device with no filesystem of
   its own (a phone visiting the deployed site with `?dev=1`). Reads are
   simpler than writes: once committed, the settings file is just an
   ordinary static asset, so `readSettingsViaApi()` is a plain
   `fetch('/data/processed/dev-panel-settings.json')` -- no server
   function needed for that half, so it works on ANY server (a local
   static file server too, not just Vercel), which is why Reset tries it
   first regardless of whether the Vercel function is actually configured
   yet. Both are skipped entirely on `location.protocol === 'file:'`
   (nothing to fetch/POST to at all). **Requires the Vercel project's
   `GITHUB_TOKEN`/`DEV_PANEL_SAVE_SECRET` env vars to actually be set
   before writes do anything -- see README.md's setup section; until
   then Save silently falls through to tier 2/3, which is expected, not
   a bug.**
2. **File System Access API** (`GIT_LOG_WRITABLE`,
   `getGitSettingsFileHandle()`) -- direct local disk write via a native
   picker. Gated on PROTOCOL, not just API capability (corrected
   2026-09-02, per explicit user clarification -- checking only
   `'showSaveFilePicker' in window` alone stayed true even when opened as
   a bare local file in a browser that happens to support the API, so it
   would have still triggered the native picker/disk write in exactly the
   case tier 1's absence and this tier's own exclusion both exist to
   avoid): `GIT_LOG_WRITABLE = DEV_MODE && location.protocol !== 'file:'
   && 'showSaveFilePicker' in window` -- false for a bare local file, a
   browser lacking the API (Firefox/Safari), or outside DEV_MODE; true
   only when served (http/https, including a local dev server) with the
   API present and the dev panel itself visible.
3. **Local save prompt + `SESSION_FALLBACK_KEY` `sessionStorage`**
   (`downloadSettingsAsFile()`) -- last resort when neither tier above
   reached the git-tracked log at all. `sessionStorage`, not
   `localStorage`, deliberately: it's gone the moment the tab closes, so
   it can never become the persistent "separate browser-local default"
   §12d/§12l otherwise bans -- it exists only so a Save made in this mode
   has anything for that same tab's own Reset to read back. The Save
   button says "Saved to repo!" (tier 1), "Saved!" (tier 2), or "Saved
   (session only)" (tier 3) -- never a generic "Saved!" for tier 3, so
   it's never mistaken for a real git-log write.

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
- **The floor's `pileRepulsion()` call was the actual (and only) cause of
  a severe, still-reported "extension jitter."** After the bendStiffness
  fix above, the user supplied a further screen recording showing the
  rope still tangling into a chaotic knot during a sustained hold-to-grow,
  specifically after a cut. Diagnosed methodically rather than guessed:
  extracted and montaged frames (Python + OpenCV/PIL) confirmed the video
  showed real, severe self-knotting, not subtle jitter; a direct point-
  coordinate dump from a synthetic zero-perturbation straight-down growth
  test showed Y-coordinates going non-monotonic (a real fold), which led
  first to `integrateChain()`'s bending constraint (fixed -- see
  `bendEnd` in that function, a real, independent bug: its loop read the
  kinematically-positioned growing tip as a neighbor on its last
  iteration, closing a feedback loop with `positionGrowingTip()`) and
  `tipGrowDirection()`'s raw per-frame direction (also fixed -- now
  exponentially smoothed into a persisted `mainRope.growDir`, since a
  single noisy frame's raw tangent could get baked into a permanent kink
  at commit time). Both were real bugs and are still fixed, but NEITHER
  was the actual cause of the reported tangle -- confirmed by reproducing
  it with `cfg.bendStiffness` forced to `0`. The real cause: a static,
  non-growing 67-point chain was proven perfectly stable under gravity
  with the floor disabled (max segment-length ratio 1.0-1.6 over 5
  simulated seconds, 0 chain-order violations) but severely unstable with
  the floor enabled once long enough to reach it (ratio up to ~4.6x,
  20-35 chain-order violations) -- isolating the floor-collision block in
  `update()` as the true root cause, unrelated to growth, bending, or
  direction noise. Further isolation (disabling just `pileRepulsion()`,
  same floor clamp) dropped the same repro's worst-case ratio from >6x
  (still climbing after 20s) to a stable ~0.7-1.3x band: `pileRepulsion()`
  has no concept of chain adjacency, so once several points pile near the
  floor it repels ANY two of them closer than `minSep` -- including two
  points from far apart in the SAME chain -- fighting
  `integrateChain()`'s distance constraint (which only ever acts between
  true chain neighbors) faster than `cfg.constraintIterations` (a few,
  by default) can resolve. Two other fixes were tried and rejected before
  landing on removing the call: softening the floor clamp from a hard
  snap to a partial correction (tested rates 0.02-0.35, none reliably
  helped, worst case got WORSE at low rates) and re-solving constraints a
  second time on floor-contact frames (measurably worse -- re-running
  `integrateChain()` re-triggers its own velocity-integration step,
  amplifying the correction instead of just resolving it, worst ratio hit
  16x). Final fix: `pileRepulsion()` is no longer called from the floor-
  collision block in `update()` at all. Verified via the full original
  repro (cut short, hold-to-grow) over 1800 simulated frames (30s, past
  the user's own ~24.5s recording): max segment-length ratio never
  exceeded `1.201` and converged to a constant `1.074` by ~10s, vs. the
  unfixed version's unbounded climb past 16x. Known tradeoff, not yet
  addressed: a rope piled deep at the floor may render with less visual
  separation between overlapping coils than `pileRepulsion()` was meant
  to provide (chain-order "folding" at the pile itself is now expected --
  a rope genuinely coils when it piles -- and isn't itself a sign of
  instability, since segment lengths stay correct throughout). A real fix
  for that would need `pileRepulsion()` to skip chain-adjacent pairs
  rather than being removed outright; flagged as a follow-up if dense
  piling's visual clumping becomes its own complaint.
- `strokeRopeCurve()`'s final segment now curves through to the actual
  tip coordinate instead of `ctx.lineTo()`-ing there. Reported as "the
  last ~20px end seems to be a stiff piece" -- confirmed as a pure
  rendering artifact (every OTHER segment uses `ctx.quadraticCurveTo()`
  through each point toward the MIDPOINT of it and its neighbor, but the
  final leg was always a dead-straight line from the last midpoint to
  the tip, roughly one segLen regardless of any physics setting -- an
  exact match for the reported span). Fixed by having the last loop
  iteration target `points[i+1]` (the real tip) instead of a midpoint.
  `n === 2` (a single segment, nothing to curve through) still renders as
  a plain `lineTo()`, unchanged.
- New "Fall Delay" slider (`cfg.fallDelay`, ROPE CUT group, 0-3s, default
  0): a cut-off piece is captured with `fallDelay: cfg.fallDelay` at cut
  time (`cutRopeAt()`/`cutPieceAt()`) and gets no independent physics of
  its own -- the fallenPieces loop in `update()` skips its
  `integrateChain()` call entirely while `piece.fallDelay > 0`, only
  counting it down against `dt` -- until it falls normally from that
  point on. Toppling (the initial random tilt) and the cut-sweep mark
  are both unaffected, same as before -- neither was ever gated by
  physics timing. The cut-end endcap (`endcapAtCutEnd`) is likewise
  hidden in `render()` while `piece.fallDelay > 0`, appearing the
  instant it hits 0 -- per explicit request that the new rope end
  shouldn't visually appear until the piece actually starts falling.
  While still delayed, per a further explicit request ("continue to
  swing with the main rope segment until its time to fall") the piece
  is NOT left hanging motionless: it rigidly translates each frame by
  however far its `delayParent`'s own current tip moved that frame
  (`delayParent` = `mainRope` for a `cutRopeAt()` cut, or the upper
  remaining piece for a `cutPieceAt()` piece-on-piece cut; both x/y AND
  oldx/oldy shift together, so releasing the piece injects no false
  velocity). Translation only, no rotation -- the piece's own shape
  (set once at `topplePiece()` time) never changes during the delay.
  Verified via a synthetic mainRope given real swinging velocity: the
  cut piece's own cut-edge point matched the parent's tip position
  EXACTLY at every sampled frame throughout the delay, then correctly
  decoupled (parent kept oscillating, piece stayed fixed) the instant
  `fallDelay` hit 0.
- `growRope()`'s commit and `positionGrowingTip()`'s smoothing were
  BOTH involved in a real, reproduced "still jittery" report specific
  to extending while mid-swing (independent of the earlier
  pileRepulsion/floor fix -- reproduced with the floor disabled
  entirely). Direct frame-by-frame acceleration tracing at the growing
  tip found real velocity-discontinuity spikes (up to ~50px/frame^2 vs
  a ~4px/frame^2 baseline) recurring almost exactly at the segment-
  commit interval: `growRope()` always snapped the tip to the
  mathematically "complete" targetSeg-away position at commit, but
  `positionGrowingTip()`'s own smoothing (added 2 rounds ago to filter
  solver noise) could still be meaningfully lagging behind that exact
  position at the commit instant -- closing the gap in one frame is
  what produced the spike. Fixed with two changes together (neither
  alone was sufficient -- see below): (1) `growRope()`'s commit now
  finalizes the tip at whatever position it's ALREADY at instead of
  snapping (only on the FIRST commit within a frame -- a rare
  multi-commit-per-frame burst falls back to the original explicit
  computation, since that tip was only just created this same frame
  and has no meaningful smoothed history to preserve); (2)
  `positionGrowingTip()`'s smoothing factor now ramps from 0.25 up to 1
  as `tipGrowLen` approaches `segLen` (`Math.max(0.25,
  tipGrowLen/segLen)`), so the tip has essentially caught up to its
  target by the instant before commit. (1) alone fixed the spikes but
  regressed segment-length stability (undershooting segments compounded
  over many commits into a worse max ratio, ~3.6x by 5s, than before
  any of this); (2) alone would leave the original gap unaddressed.
  Together, verified via the same repro (a real punch to induce
  swinging, then grow immediately): max acceleration dropped from
  50.27 to 9.93 (2 residual spikes vs 8), AND max segment-length ratio
  over a full 5s test came out at 1.274 -- better than the ORIGINAL
  pre-any-fix baseline (1.774), not just better than the failed
  single-change attempt.
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
- **The `DEV_MODE` fix directly above did NOT actually close the bug it
  was meant to fix.** Its own truth-table (quoted verbatim above) already
  admitted only the "hosted origin, NO `?dev=1`" case flipped -- but that
  case was never reachable as a real bug in the first place, since a
  hosted deployment without `?dev=1` hides the dev panel/Save button
  entirely (DEV_MODE false), so there's no way to even click Save there.
  The ACTUAL only way to reach Save on a real deployment is WITH
  `?dev=1` -- and `DEV_MODE && location.protocol !== 'file:' &&
  'showSaveFilePicker' in window` stayed `true` for that exact case both
  before AND after the `DEV_MODE` fix, since `?dev=1` makes `DEV_MODE`
  true regardless of hostname and the protocol check alone can't
  distinguish a real deployed `https:` origin from `http://localhost`.
  Confirmed via direct user report: hitting Save on a real, correctly
  env-var-configured Vercel deployment still triggered the native
  File-System-Access picker dialog -- exactly the "local save prompt on
  a served deployment" behavior §12d/§12l explicitly forbids. Root cause:
  `GIT_LOG_WRITABLE` (and by extension `saveSettings()`'s own Tier-1-
  failure fallback) never actually checked HOSTNAME, only protocol.
  Fixed with a new `IS_LOCAL_CONTEXT` constant (`location.protocol ===
  'file:' || location.hostname === 'localhost' || location.hostname ===
  '127.0.0.1'`) folded into `GIT_LOG_WRITABLE`, AND -- the other half of
  the actual fix -- `saveSettings()` itself now checks `IS_LOCAL_CONTEXT`
  after a Tier 1 failure and stops there (flashing the real error text)
  instead of falling through to Tier 2/3 at all when not local; the old
  code fell through to Tier 2 purely because `GIT_LOG_WRITABLE` happened
  to still be true, an accident of the incomplete boolean rather than a
  deliberate check of "are we actually local." Also improved
  `writeSettingsViaApi()` to return `{ok, error}` instead of a bare
  boolean, so a real Tier 1 failure (missing env var, secret mismatch, a
  GitHub API error) is now visible in both the Save button's flash text
  (held 4s for errors, not the usual 900ms) and the console, rather than
  collapsing every failure into an indistinguishable "didn't work" --
  needed since the user's own live deployment is STILL failing Tier 1
  for a reason not yet diagnosed from this environment; the new error
  surfacing is what should make that reason visible from their own
  browser now. Verified: real localhost regression-checked (unchanged:
  `IS_LOCAL_CONTEXT`/`GIT_LOG_WRITABLE` both true, Save cascades through
  all 3 tiers same as before); a throwaway test copy with
  `IS_LOCAL_CONTEXT` forced `false` (simulating a real deployed hostname,
  since this sandbox has no way to actually navigate to one) confirmed
  Save now stops immediately after Tier 1's failure with an honest error
  ("Save failed: HTTP 501" against this environment's own static test
  server, which naturally lacks the real API route) and never attempts
  Tier 2/3 at all.
- Fall Delay cutting no longer splits `mainRope.points`/a piece's `points`
  into two independent chains immediately at cut time. That approach (the
  previous entry above) rigidly translated the falling piece to follow its
  "delayParent"'s tip each frame, but a shortened parent rope genuinely
  swings differently than the original undivided rope did, so the
  translated piece could visibly diverge from where it should be --
  reported as "collision issues with cutting while the rope is swinging."
  Now `cutRopeAt()`/`cutPieceAt()` store a `pendingCut` (`{idx, delay}`) on
  `mainRope`/the piece instead of splitting right away; the rope stays ONE
  physics chain, fully solved by the normal `integrateChain()` call, for
  the whole delay. `update()` ticks `pendingCut.delay` down each frame and
  calls `performMainRopeSplit(idx)`/`performPieceSplit(piece, idx)` (the
  actual array-slicing logic, unchanged from before) the instant it
  reaches 0, using that frame's already-integrated positions. `delayParent`
  /`delayAnchorPrev` and the whole per-frame rigid-translation block in
  `update()` are gone -- no longer needed since there's nothing to keep in
  sync until the real split happens. `topplePiece()` (the one-time random
  tumble) now also happens at that same real-separation instant, which is
  also the only instant it makes physical sense (a still-attached piece
  has no reason to tumble). A second cut attempt while one is already
  pending is rejected (`if (mainRope.pendingCut) return;` /
  `if (!piece || piece.pendingCut) return;`). Continuity across the
  eventual split holds BY CONSTRUCTION, not by any runtime check: the new
  piece's first point is a direct clone of the shared boundary point's
  x/y/oldx/oldy at the exact instant of the split, so there's no gap for a
  collision artifact to come from. Verified: default Fall Delay (0)
  reproduces the old immediate-split behavior exactly (mainRope shortens
  the same frame, `pendingCut` stays null); with Fall Delay > 0 and real
  swing velocity applied, the rope measurably stays undivided through the
  whole delay (max per-frame jump at the pending cut point ~4.25px,
  matching the swing, no discontinuity) and the real split fires at the
  correct countdown boundary.
- `renderCutSweep()`'s anchor point is no longer always `entity.points[
  points.length-1]`. With Fall Delay deferring the real split (previous
  entry), the entity isn't actually shortened at cut time, so its true
  last point is the wrong place to anchor the cosmetic cut-sweep mark --
  it needs to track the PENDING cut point instead, which is some interior
  index until the real split happens. `cutRopeAt()`/`cutPieceAt()` now
  store `cutSweep.anchorIndex = idx`, and `renderCutSweep()` reads
  `pts[Math.min(sweep.anchorIndex, pts.length-1)]` (and derives its
  tangent from that same index's neighbor) instead of unconditionally
  using the last point -- this resolves correctly both before the real
  split (anchorIndex is an interior index) and after (anchorIndex now
  equals pts.length-1, same as the old behavior).
- `render()`'s cut-end endcap no longer has a `piece.fallDelay > 0` gate.
  With the pendingCut redesign above, a piece can't exist in
  `fallenPieces` at all while still delayed -- it isn't created until the
  real split happens, which only happens once the delay has fully
  elapsed. Per-piece `fallDelay` itself no longer exists (pieces are
  always created already fully "released"). The gate was reported as
  looking unimplemented; code inspection confirmed it WAS wired correctly,
  it was just testing a condition (`piece.fallDelay > 0`) that, under the
  redesign, can now never be true for anything actually in the array --
  removed as dead code rather than left in place.
- Extension jitter ("much better but still noticeable" after the prior
  round's acceleration-spike fix) had TWO further, previously-unaddressed
  causes, found via frame-by-frame tracing of the ANGLE between the
  newly-committed segment and the brand-new growing segment (a metric the
  prior round's tip-position/acceleration tracing didn't cover):
  1. `integrateChain()`'s basic per-point Verlet loop (`for (let i=0; i<
     points.length; i++)`) excluded only `pinnedIndex` -- NOT the growing
     tip, despite the function's own comment claiming the growing tip
     "never enters the iterative solver at all." Only the SECOND loop
     (distance/bend constraints) actually respected `skipLastSegment`. So
     the fresh, near-zero-length tip pushed by `growRope()` still got a
     real gravity+inherited-velocity kick on its very first frame, which
     `positionGrowingTip()`'s own smoothing then only partially corrected.
     Fixed by adding a `tipIndex = skipLastSegment ? points.length-1 : -1`
     exclusion alongside `pinnedIndex`. This alone reduced the worst-case
     kink from ~180 degrees to ~162 (measured) -- a real improvement, but
     not the dominant cause.
  2. The dominant cause: `positionGrowingTip()` smoothed the tip's
     ABSOLUTE position toward a target (`tip.x += (targetX - tip.x) *
     smoothing`), but `dir.prev` (the point the tip is anchored to, the
     just-finalized neighbor) can itself move several px during the SAME
     commit frame -- it inherits the outgoing segment's velocity (an
     existing, intentional mechanism, see `growRope()`'s own comment on
     that), then gets constraint-solved as an ordinary point for the
     first time. Direct tracing showed exactly this: at a commit frame
     with real swing velocity present, `dir.prev` moved several px while
     the tip -- still smoothing from its OWN stale pre-move position at a
     0.25 factor -- barely followed, leaving the new segment (dir.prev ->
     tip) pointing in a near-arbitrary direction (measured up to ~180
     degrees off the established growth direction) relative to its
     anchor. Because `drawEndcap()` orients the whole endcap graphic
     directly off this exact segment's direction (`tipDirection(points)`,
     the last two points), this reads as the endcap visibly snapping/
     spinning at the tip on every single commit during real swinging --
     the actual visible "jitter." Fixed by restructuring
     `positionGrowingTip()` to smooth a RELATIVE offset-from-anchor
     (`mainRope.tipOffset`) instead of an absolute position: `dir.prev`'s
     own current position is now always applied in FULL every frame (zero
     lag, since it's real physics and the tip must render attached to
     it), while only the small growing offset itself (`growDir *
     tipGrowLen`) is smoothed. `growRope()` resets `mainRope.tipOffset =
     {x:0,y:0}` every time a new tip point is pushed (it starts exactly
     coincident with its anchor, so the offset really is 0 at that
     instant); `resetMainRope()`/`cutRopeAt()`'s post-cut reset both null
     it out alongside `growDir`, same fresh-start reasoning. Verified via
     the angle-kink metric (degrees between consecutive segment
     directions at the tip, frame to frame) over a 2s swinging+growing
     test using the user's own saved settings: worst case dropped from
     179.89 (with only fix 1 above applied) to 5.57, average from 18.33 to
     0.42. A combined 5s stress test (stronger swing + continuous growth +
     a mid-test cut with Fall Delay 0.6s, exercising all of today's fixes
     together) held max segment-length ratio 1.132 and max kink 9.30/avg
     0.66, with the deferred cut/split completing correctly alongside the
     growth -- no interaction bugs between the three fixes. The user's own
     new screencap (`datalog/Recording 2026-09-02 144811.mp4`) was also
     frame-extracted and inspected around its actual cut and growth
     phases to ground the investigation in what the video showed, rather
     than relying on the physics simulation alone.
- The original End1-End4 endcap source SVGs were removed and replaced
  wholesale with a new 12-design set: `data/Rope/End_Form1-02.svg`
  through `-06.svg` plus `End_Form1-C.svg` (Form 1 family), and
  `End_Form2-07.svg` through `-11.svg` plus `End_Form2-C.svg` (Form 2
  family) -- `ENDCAP_DESIGNS` keys are the lowercased file suffix
  (`'form1-02'`, ..., `'form1-c'`, `'form2-07'`, ..., `'form2-c'`), and
  the dropdown's default (`endcapDesign`, both the `DEV_GROUPS` hardcoded
  `def` and `data/processed/dev-panel-settings.json`'s git-tracked
  default) moved from the now-nonexistent `'end3'` to `'form1-c'` --
  picked as a like-for-like replacement (previously the 3rd/most-refined
  design in a small set; now the flagship of the first family) since the
  user didn't specify a preference and it's a one-click dropdown change
  either way. `ENDCAP_ALIGNMENT` itself needed NO change: every one of
  the 12 new source SVGs embeds the exact same reference `<line>`
  (x1=41.57, y1=80.26, x2=96.06, y2=80.26) as `data/Rope/End Alignment.svg`
  (confirmed by reading all 12 files directly), so they're already
  authored against the same shared frame the existing transform math in
  `drawEndcap()` expects -- per the standing Gotcha above ("a new design
  gets only a `path` entry"), that's exactly what was added, nothing else
  in the rendering pipeline needed touching. `data/Rope/Untitled-1.ai`
  (the source Illustrator file another concurrent session is evidently
  iterating the design set from) and `data/Rope/End Alignment.svg` itself
  were left untouched, same as this session's standing practice of never
  touching that other session's own files.
- `ENDCAP_DESIGNS` entries get their `path` data updated in place whenever
  the user revises one of the source SVGs (found via `git status` on
  `data/Rope/`, not announced file-by-file) -- same key, new `d` string,
  no other code changes needed since the design's identity (its dropdown
  key/label) doesn't change, only its shape.
- Removed `cfg.ropeWeight` entirely (redundant setting, explicit request).
  It and `cfg.gravityStrength` were pure multiplicative factors on the
  SAME acceleration term (`gravityAccel = vh(90) * gravityStrength *
  ropeWeight`, both for mainRope and fallGravity) -- scaling either one
  had an identical visible effect, so there was nothing `ropeWeight`
  contributed that `gravityStrength` alone couldn't. Rather than just
  deleting it and leaving `gravityStrength` at its own old default (which
  would have silently HALVED the effective gravity the rope actually
  experiences, since the product `gravityStrength * ropeWeight` no longer
  gets computed), folded ropeWeight's value into gravityStrength's own
  default: new `gravityStrength` default = old default × old ropeWeight
  default (1.9 × 1.9 = 3.61, applied to both the DEV_GROUPS hardcoded
  default and `data/processed/dev-panel-settings.json`'s git-tracked
  default) -- preserves the EXACT same rope behavior post-removal, not
  just a similar one. `gravityStrength`'s slider max (5) already
  comfortably covers 3.61, no range change needed.
- `damping`'s slider min moved from 0.5 to 0.7 (explicit request) -- the
  git-tracked default (0.999) was already well above the new floor, so no
  clamping was needed there.
- **Dev panel group collapse/expand state is now captured and restored**
  by Save/Copy/Reset, per the workspace's own §12e spec (it wasn't before
  -- confirmed via direct code reading when the user asked). `getPanelOrder()`
  now includes `collapsed: g.classList.contains('collapsed')` per group
  alongside the existing row-order data; `applyOrder()` now does
  `groupEl.classList.toggle('collapsed', !!g.collapsed)` when re-applying a
  saved order. A saved order entry from before this change simply has no
  `collapsed` key, which reads as `false` (expanded) -- the same default the
  markup already starts at, so nothing needed backfilling in the
  git-tracked settings file.
- **Fall Delay removed as a standalone setting** -- explicit request: "set
  the fall delay as the time it takes the cut line to cut through the
  entire rope." `cutRopeAt()`/`cutPieceAt()`'s `pendingCut.delay` (the
  deferred-split mechanism from 2 rounds ago) now always uses
  `cutThroughDuration()` (`CUT_SWEEP_BASE_SEC / cfg.cutSpeed` -- the exact
  inverse of how `cutSweep.progress` itself accumulates) instead of the
  old `cfg.fallDelay`. Since this duration is always > 0 (cutSpeed's
  slider floor is 0.2, never 0), the old `if (cfg.fallDelay > 0){...}
  else performXSplit(idx)` branch in both functions collapsed to always
  deferring -- the immediate-split code path no longer exists at all (a
  real simplification, not just a rename). `data/processed/
  dev-panel-settings.json`'s `fallDelay` key and its `ROPE CUT` order-list
  entry were both removed.
- **Double-click near the circle chopping the rope down to almost
  nothing, "regardless of rope length"** -- confirmed as a real,
  reproducible bug, not assumed from the report alone: pulled the user's
  own live-saved settings from the git repo (`circleCutDistance: 9.5`,
  `circleSize: 8`) and reproduced it via direct, timing-controlled
  simulation (`performance.now()` stubbed, since this sandbox's
  setTimeout is throttled ~15-1000x when the tab isn't the foreground
  tab -- confirmed by observing a requested 60ms gap between two
  simulated clicks actually elapse as ~1000-1850ms of real wall-clock
  time; calling `onPointerDown`/`onPointerUp` directly with a fake,
  incrementing `performance.now()` sidesteps this entirely). Root cause:
  `cutRopeAt()`'s Circle Cut Distance guard (protects the anchor from
  being cut too close to) and `isOnCircle()`'s own click-exclusion radius
  are two INDEPENDENT thresholds that can drift apart -- with the
  project's OLD default Circle Cut Distance (5%vmin = 40px) sitting
  BELOW `isOnCircle`'s exclusion radius (64px at default Circle Size),
  rope-point index 2 (55.4px from anchor at default segLen) is
  unreachable (still inside the exclusion zone) but index 3 (83.1px) is
  reachable AND clears the (too-small) Circle Cut Distance guard --
  chopping a potentially-hundreds-of-px-long rope down to 3 segments.
  Verified via direct simulation at 6 click offsets from the anchor (0,
  16, 31.7, 63.4, 64.6, 83.2px): only 83.2px (the first point past BOTH
  thresholds) scheduled a cut before the fix. Fixed with a shared
  `circleExclusionRadius()` function (extracted from `isOnCircle()`'s own
  inline calculation, so the two can never independently drift again) and
  a `Math.max(vmin(cfg.circleCutDistance), circleExclusionRadius())`
  floor in `cutRopeAt()`'s guard. **Known residual gap, disclosed rather
  than silently left unmentioned:** with the user's OWN live Circle Cut
  Distance (9.5%vmin = 76px), already comfortably above the 64px
  exclusion radius, this fix changes nothing for their current config --
  the exact same 83.2px/index-3 reproduction still schedules a cut there,
  since 83.1px already clears their own 76px threshold. The underlying
  cause there is segLen granularity (27.7px at default growth), not a
  drifted threshold -- a genuinely different, smaller residual case,
  flagged to the user rather than claimed as fully resolved.
- **Rope End Curve Arc's minimum (0) now actually renders a flat/straight
  end** -- explicit request. `strokeRopeCurve()`'s `ctx.lineCap` was
  unconditionally `'round'` before, so even at Rope End Curve Arc 0 the
  canvas stroke's own inherent (non-adjustable, fixed at thickness/2)
  round cap still rounded the tip -- `ropeEndCurveArc`/`endArcMult` only
  ever gated a SEPARATE filled arc circle drawn past the stroke, never the
  stroke's own cap. Now `ctx.lineCap` is always `'butt'`, and ALL
  roundedness comes from that same filled-arc mechanism, now drawable at
  BOTH ends of the path independently (`strokeRopeCurve(points,
  thicknessPx, color, endArcMult, startArcMult)`, the new optional 5th
  param) -- necessary, not just tidier, because `ctx.lineCap` is one value
  for the WHOLE stroked path, but a fallen piece's two ends (its own free/
  growing tip vs. its own cut edge) can genuinely need different treatment
  at the same time once End Emerge (below) is in play, which one shared
  lineCap could never express. `mainRope`'s own `points[0]` is always the
  anchor (covered by the circle graphic) so callers always pass `0` for
  its `startArcMult`.
- **New feature: End Emerge** (`END EMERGE` dev-panel group --
  `endEmergeEnabled`, `endEmergeDelay`, `endEmergeSpeed`,
  `endEmergeTweening`). When enabled, a freshly-cut edge's endcap doesn't
  appear at full size the instant the real split happens (`performMainRopeSplit()`/
  `performPieceSplit()`) -- it starts scaled down so its FULL bounding-box
  width (not just its neck) equals the rope's own thickness, i.e.
  visually indistinguishable from the rope's own end (rendered via the
  normal Rope End Curve Arc treatment during this phase, per the fix
  above), waits `endEmergeDelay`, then scales up to its real size over
  `endEmergeSpeed`'s own duration, eased by `endEmergeTweening` (`linear`
  / `easeIn` / `easeOut` / `easeInOut`, `EMERGE_TWEENS`). Key pieces:
  - `ENDCAP_WIDTHS`: each design's TRUE bounding-box width (its widest
    point, wider than `ENDCAP_ALIGNMENT.width`'s neck-only measurement),
    computed ONCE at startup from each design's raw `d` string (now kept
    alongside its `Path2D` in `ENDCAP_DESIGNS`, `{d, path}` instead of just
    `{path}` -- Path2D itself has no bounding-box query) via a throwaway
    real SVG `<path>` element's `getBBox()`. Deliberately NOT hand-measured
    and hardcoded -- stays correct automatically no matter how many more
    times the source SVGs get swapped, with zero added maintenance,
    exactly the failure mode a hardcoded table would eventually hit.
  - `newEmergeState()`/`tickEmerge()`/`emergeFactor()`: the same
    delay-then-progress shape as `cutSweep`'s own mechanism, on the same
    raw-wall-clock convention (not `dt`, so Rope Animation Speed doesn't
    also secretly scale emergence). `emergeFactor()` reads as `1` (fully
    emerged, immediate, matching pre-existing behavior exactly) whenever
    End Emerge is off OR the entity's relevant emerge state was never
    created -- so a rope/piece that's never been cut, or any cut made
    while the feature is off, behaves completely unchanged.
  - EVERY cut creates up to 2 independent emerge states, not one: the
    remaining rope/piece's own tip (`tipEmerge` -- its `points[length-1]`
    IS the fresh cut edge post-split) AND the newly-split-off piece's own
    near/cut edge (`cutEdgeEmerge` -- its `points[0]`). A piece therefore
    carries BOTH fields, since it can independently be the "upper"
    (tipEmerge-relevant) half of some LATER cut if it's split again via
    `cutPieceAt()`. Verified via direct simulation that a piece-on-piece
    cut correctly populates both the parent's `tipEmerge` and the new
    sub-piece's `cutEdgeEmerge` without disturbing the parent's own
    pre-existing `cutEdgeEmerge` from ITS OWN original creation.
  - `drawEndcap()`'s new `factor` param (default `1`, backward compatible)
    interpolates between a `hiddenScale` (`thicknessPx / ENDCAP_WIDTHS[key]`)
    and the existing `normalScale` (`thicknessPx / ENDCAP_ALIGNMENT.width`).
    Because the anchor-shift translate stays the LAST transform call (an
    existing, unchanged property -- see that function's own comment), the
    shape's attachment point stays pinned exactly at the tip regardless of
    scale, which is what gives "scales up and moves out to where it's
    meant to be" for free with no separate position animation.
  - Verified via direct frame-by-frame simulation (a short 0.1s delay +
    fast 2x speed, for a quick observable timeline): factor reads exactly
    `0` for the first ~6 frames post-split (matching the 0.1s delay at
    60fps), then ramps smoothly from ~0.095 to `1.0` over frames 7-17
    (matching `EMERGE_BASE_SEC(0.35)/speed(2) = 0.175s` ≈ 10.5 frames),
    then holds at exactly `1` indefinitely after. A parallel run with
    `endEmergeEnabled: false` confirmed `tipEmerge` stays `null` and
    `emergeFactor` reads `1` immediately at the same split frame -- zero
    behavior change for the feature-off case. A full 40-frame render()
    pass (both the plain cut and a subsequent piece-on-piece cut) threw
    no errors.
- **New setting: `ropeTopCurveArc` ("Rope Top Curve Arch")** -- mirrors
  Rope End Curve Arc but for `mainRope.points[0]` (the anchor), wired via
  `strokeRopeCurve()`'s `startArcMult` param (added the round before for
  pieces' own cut edges, but never actually connected to mainRope's own
  call, which always passed `0`). A prior Gotchas entry's claim that "the
  anchor end always renders under the circle graphic so its cap style is
  never actually visible" was WRONG -- checked before trusting it:
  `render()` draws the circle FIRST, the rope stroke AFTER (on top), and
  `ropeColor` differs from `circleColor` by default, so a curved cap
  there is genuinely visible, not a no-op. Default `1` (not `0`) so the
  change is immediately visible per the request's own phrasing, matching
  Rope End Curve Arc's own default. Verified via a monkey-patched
  `ctx.arc` during a real `render()` pass: exactly 2 arc calls (the
  circle itself, r=32px; the new anchor arc, r=19.2px = thickness/2 × 1,
  both centered at the anchor) and zero at the tip (correctly suppressed
  -- Rope End Curve Arc is 0 in the live settings and an endcap design is
  active there); separately regression-checked Rope End Curve Arc's own
  mechanism still works unchanged (r=38.4px = thickness × 2 at the tip,
  `endcapDesign: 'none'`).
- **`mainRope.points[0]` (the anchor) is no longer rigidly pinned to
  `circleAnchor()`** -- per explicit request, it's now a free physics
  point kept inside the circle graphic by a real, bouncy collision, so
  gravity/momentum affect it exactly like every other point, and it comes
  to rest at the bottom of the circle by default (no special-casing --
  just this constraint's own natural equilibrium). `update()`'s old
  `mainRope.points[0].x = circleAnchor().x; ...y = ...y;` pin is gone;
  `integrateChain()`'s `pinnedIndex` for mainRope is now `-1` (no pin at
  all), matching how `fallenPieces` already integrate.
  - The circular boundary itself is split into TWO separate mechanisms,
    not one, after a real bug was found and fixed mid-implementation (see
    below): `integrateChain()` gained an optional `boundaryConstraint`
    param (`{index, center, radius}`) that clamps that point's POSITION
    back inside the circle, applied once per solve iteration alongside
    the existing distance/bend constraints (not as a one-shot post-pass).
    Separately, `constrainAnchorToCircle()` (called once per frame, right
    after `integrateChain()`) handles ONLY the bounce -- reflecting the
    point's implied velocity off the boundary normal (`v' = v -
    (1+restitution)*(v.n)*n`, `restitution = 0.4`, hardcoded matching the
    floor collision's own hardcoded 0.3) -- and deliberately never
    touches position, only `oldx`/`oldy`, and only when the point is
    genuinely still moving outward at the boundary (`vDotN > 0`); resting
    contact (most frames, once settled) naturally skips it.
  - **Why it's split this way, not one function:** the FIRST
    implementation attempt did the position-clamp AND the bounce together
    in a single post-pass, called once after `integrateChain()` finished
    (same shape as the floor collision). This produced a real, measured,
    PERSISTENT instability -- not a transient stress artifact: a gentle
    5-round alternating-flick test, replayed with the anchor's own
    Constraint Iterations (3, the user's live setting), left
    segment(0,1)'s length ratio permanently elevated at ~1.4-1.7x even
    after 30 full simulated seconds of otherwise undisturbed settling
    (confirmed via a 30s timeline sample: flat at ~1.29-1.3x from ~6s
    onward, never trending toward 1.0), while every OTHER segment settled
    near a healthy ~1.0-1.1x -- clearly localized to the one segment
    fighting this constraint. Root cause: unilaterally snapping the point
    to an EXACT boundary position every frame discards whatever the
    distance constraint (segment 0-1) had just computed for it, and
    unlike the floor's collision (which only clamps ONE axis, `y`,
    leaving `x` fully free for the distance constraint to satisfy segLen
    through), a CIRCULAR boundary has no spare axis -- clamping position
    at all necessarily fixes both `x` and `y` simultaneously, leaving the
    distance constraint nothing to work with. Fixed by moving the
    position-clamp into the SAME iterative loop the distance/bend
    constraints already use, so they negotiate a mutually-acceptable
    position over `constraintIterations` rounds instead of one
    unconditionally overriding the other -- the same general lesson this
    project already learned once before with `pileRepulsion` fighting the
    distance constraint (see that Gotcha above), applied to a new site.
  - After the fix, the SAME adversarial 5-round test's residual dropped
    to ~1.29x and PLATEAUS there (confirmed flat via the same 30s
    timeline) rather than the earlier open-ended-looking elevation --
    and critically, this residual shrinks monotonically as
    `constraintIterations` increases (3 → 1.293, 6 → 1.138, 10 → 1.076,
    20 → 1.033), the EXACT SAME pattern Constraint Iterations already
    produces everywhere else in the rope (documented directly to the user
    this session: "fewer iterations = the solver doesn't fully converge
    each frame... a stretchier, springier, less stable look") -- so this
    isn't a new class of bug, just the same existing, already-understood,
    already-user-tunable tradeoff showing up at a site (the anchor) that
    never had to negotiate anything before. The user's own live
    Constraint Iterations (3) is a deliberate choice already accepted
    project-wide; no further change made without their direction.
  - Verified the actual described scenario directly, not just synthetic
    stress: a single hard, sustained upward drag of the tip well above
    the circle (`center.y - R*4`, held 20 frames, then released) showed
    the anchor point rise cleanly from resting at the bottom
    (dist=R=32px, below center) up through the center and out the TOP
    (dist=32px, ABOVE center -- confirmed hitting the exact opposite
    boundary), held there while the tip stayed forced, then fell back
    through center and resettled at the bottom after a decaying
    oscillation -- exactly the user's own described mechanism ("rope
    start will also move upwards until it hits the other side of the
    circle, bounces off and falls back down and finds equilibrium at the
    bottom"). Final settled ratio for this exact scenario: 0.96 (healthy,
    not the adversarial test's 1.29 -- that residual is specific to
    rapid, repeated, uninterrupted re-stressing, not normal single-flick
    usage). Growth and cutting both regression-checked afterward (grew
    5→14 points cleanly with the anchor still correctly held at the
    boundary throughout; a mid-rope cut produced a normal fallen piece,
    no errors) to confirm neither mechanism silently assumed a fixed
    anchor position anywhere else.
  - One real test-methodology trap hit and worked around while
    investigating, worth recording since it wasted real time: calling
    `resetMainRope()` again from a debug-hook test (after the hook's
    `mainRope` reference was already captured at page load) silently
    reassigns the MODULE-LEVEL `mainRope` variable to a brand-new object
    (`resetMainRope()`'s own `mainRope = {...}` line) -- the debug hook's
    `mainRope` property still points to the old, now-abandoned object,
    so every subsequent `d.update()` call correctly simulates the REAL
    (new) rope while every readback via `d.mainRope` reads the orphaned
    old one, which never appears to move no matter how many frames run.
    Same trap doesn't apply when mutating `d.mainRope.points`/other
    fields in place (the established pattern all session), only when
    calling a function that REASSIGNS the module-level variable.
    Confirmed as the actual explanation (not a rendering/physics bug) by
    re-running the identical test via in-place mutation instead, which
    immediately showed correct movement.
- **Anchor-physics tuning follow-up**, from a 4-note `*D*` spec building
  directly on the anchor-boundary work above:
  - `constrainAnchorToCircle()`'s restitution is now `cfg.anchorBounceIntensity`
    (was hardcoded `0.4`); `integrateChain()`'s `boundaryConstraint` param
    gained a `weightMult` field (read only for the index it targets) that
    multiplies just that point's `gravityAccel * dt * dt` term, wired to
    `cfg.anchorWeight`; the boundary radius itself moved into a shared
    `anchorBoundaryRadius()` helper (`vmin(circleSize)/2 +
    vmin(circleBoundaryOffset)`) so both `integrateChain()`'s call site and
    `constrainAnchorToCircle()` always agree on the same radius.
  - **Real bug caught during verification, not left for the user to find**:
    `anchorBoundaryRadius()` had no floor, so a large negative
    `circleBoundaryOffset` combined with a small `circleSize` produced a
    NEGATIVE radius (measured: `circleBoundaryOffset=-5` against the live
    `circleSize=8` → `-8`), which breaks both the `dist > R` check (always
    true regardless of actual position, since `dist` can't be negative) and
    the `center + normal*R` clamp (places the point on the WRONG side of
    center). Fixed by flooring the return value at `Math.max(2, ...)`.
    Verified the fix directly: the same inputs now return `2`.
  - **Test-methodology trap, caught before being reported as a bug**: an
    initial combined bounce/weight test set the anchor's position/velocity
    directly and called the FULL `d.update()` (rather than
    `constrainAnchorToCircle()` in isolation), and got an identical `-5`
    result across `anchorBounceIntensity` values `0`/`0.4`/`1.0` -- a flat,
    suspicious result, since different restitution values should produce
    different reflected velocities per the formula. Root cause: `update()`
    runs `integrateChain()`'s own per-iteration `boundaryConstraint`
    position-clamp (which does NOT depend on restitution at all) BEFORE
    `constrainAnchorToCircle()` ever runs, so by the time the bounce logic
    executed, the position-clamp (plus the distance constraint pulling
    against it across `constraintIterations` rounds) had already
    overwritten most of the manually-set test velocity, producing similar
    residual results across all three intensities almost by coincidence.
    Resolved by exposing `constrainAnchorToCircle` on the debug hook and
    testing it directly, bypassing `integrateChain()`/`update()` entirely:
    `restitution=0 → 0` rebound velocity, `0.4 → -4`, `1.0 → -10`, against a
    fixed `+10` outward test velocity -- exactly matches
    `v' = v - (1+r)*(v.n)*n`. Confirmed the formula and its wiring were
    correct all along; only the test setup was flawed. (Same general shape
    as the `resetMainRope()` trap above -- a debug-hook test that routes
    through more machinery than the thing actually being tested can produce
    a convincing false signal.)
  - `anchorWeight` verified via a from-rest single-frame comparison: weight
    1 vs 3 produced downward velocities `1.089` vs `1.776` -- a real,
    correctly-directed difference, though not a clean 3x ratio (expected,
    since the boundary clamp and distance constraint both act on the anchor
    point within the same frame/iteration, diluting a pure gravity-term
    multiplier).
  - **End Emerge's spawn mechanism redesigned** per explicit request: the
    original build (see the End Emerge Gotcha above) only scaled the
    endcap up uniformly in place; the new design also moves WHERE on the
    endcap's own local geometry gets anchored to the rope's tip.
    `drawEndcap()` gained a new `factor`-driven anchor interpolation
    alongside its existing scale interpolation: at `factor=0` (spawn), the
    local anchor point is the design's own bbox BOTTOM edge
    (`ENDCAP_BOTTOM_Y[designKey]`) at `normalScale * cfg.endcapStartingScale`;
    at `factor=1` (fully emerged), it's the normal
    `ENDCAP_ALIGNMENT.topY`/full `normalScale` used everywhere else. The X
    anchor (`ENDCAP_ALIGNMENT.topCenterX`) stays fixed throughout --
    verified all 14 endcap designs are horizontally symmetric around it, so
    a fixed X anchor never introduces a lateral jump. `ENDCAP_BOTTOM_Y` is
    computed once at startup the same way `ENDCAP_ALIGNMENT` already is (a
    throwaway off-DOM SVG `<path>` + `getBBox()`), REPLACING the unused
    `ENDCAP_WIDTHS` concept from the original End Emerge build (bbox width
    was never actually used by anything; bbox bottom Y is what this
    redesign actually needs).
  - Verified via a real triggered cut (`hitTestRope()` + `cutRopeAt()` with
    a synthesized `{...hit, target:'rope'}`, matching `hitTestAny()`'s own
    tagging -- `cutRopeAt()` takes a hit-test result object, not raw
    coordinates) then stepping the simulation forward: `tipEmerge` stayed
    `null` while the cut was still mid-sweep (`pieceCount` 0, confirming
    the deferred-split `pendingCut` mechanism from an earlier round hadn't
    fired yet), then `emergeFactor()` rose cleanly `null → 0.265 → 1.0`
    across the delay+speed window and held at `1.0` afterward, no thrown
    errors. Confirmed `startAnchorY` (157.80, the live `endcapDesign`'s own
    bbox bottom) sits numerically BELOW `normalAnchorY` (80.26, the same
    design's neck/top edge) -- correct, since canvas/SVG Y increases
    downward, so "bottom edge" being a larger Y than "top/neck edge" is
    exactly the ordering the spawn→settled interpolation depends on.
  - General regression re-confirmed with anchor physics active throughout:
    5s of settle time post-cut kept segment-length ratios bounded at
    1.0-1.139x (the same already-documented `constraintIterations=3`
    tradeoff, not a new instability), and the anchor point settled at
    exactly `circleAnchor + (0, anchorBoundaryRadius)` -- dead center of
    the bottom of its own boundary circle, the expected resting
    equilibrium from the original anchor-physics build.
- Added Tip Segment Shape (`cfg.tipSegmentShapeEnabled`, ROPE group): a
  user-supplied shape (`data/Rope/RopeEG.svg`, a tall vase-like silhouette
  with a symmetric two-lobed forked bottom) drawn on the segment(s) right
  below the endcap, per an explicit multi-message design conversation.
  `TIP_SEGMENT_SHAPE` is computed once at boot the same way
  `ENDCAP_BOTTOM_Y` already is -- a throwaway `<path>` + `getBBox()` -- to
  get `topCenterX`/`width`/`topY`/`bottomY` automatically from the raw `d`
  string rather than hand-measuring, since this SVG has no explicit
  alignment `<line>` of its own (the user specified its orientation
  directly instead: "a vertical line through the horizontal center of this
  svg" -- so `topCenterX` comes from the bbox's own X midpoint, not a
  shared reference). `getBBox()`'s measured values matched an independent
  hand-trace of the path's bezier vertices almost exactly (topCenterX
  134.62 vs hand-traced 134.62; topY/bottomY 27.32/341.30 vs 27.32/341.3),
  cross-confirming both.
  - First implementation attempt scaled the shape's height to exactly
    match the live segment's current length (`liveLength/naturalHeight`),
    mirroring how the endcap's `heightMult` slider works. This was WRONG:
    the shape's natural proportions are ~2.5:1 tall (`naturalHeight`
    313.98 vs `width` 125.58), but one physics segment is only ~28px at
    default settings -- ~9% of the shape's own natural height. Squashing
    it that hard destroyed all its detail: a per-row filled-width scan
    across the compressed render showed essentially NO variation (~37px
    constant throughout a 5-sample scan), meaning the neck/waist/belly/
    fork had no vertical room left to read as anything but a flat blob.
    Caught before shipping by directly measuring the compressed output,
    not just eyeballing intent.
  - Presented the tradeoff to the user directly (3 options: proportion-
    preserving scale non-matched to the segment; forced segment-length
    match, accepting the squash; a middle-ground multi-segment span) with
    a stated recommendation, rather than silently picking one -- this is a
    real visual/behavioral tradeoff (does the shape always look right, or
    always end exactly on a physics point), not an implementation detail.
    User chose proportion-preserving. Rewrote `drawTipSegmentShape()` to
    scale uniformly from rope thickness alone (`thicknessPx /
    TIP_SEGMENT_SHAPE.width`, both axes), same formula `drawEndcap()`
    already uses -- the shape's own top edge generally does NOT land
    exactly on the second-to-last physics point anymore (it reaches
    further back up the chain), which is expected and accepted per the
    user's own choice.
  - This surfaced a SECOND real bug, only visible after fixing the first:
    the plain rope stroke (`strokeRopeCurve`) draws the mainRope/piece
    chain all the way to the true tip regardless, in the exact same
    `cfg.ropeColor` as the new shape -- so the full-width stroke UNDERNEATH
    filled in exactly where the shape's own narrower silhouette (waist,
    fork) should have shown as a visible cutout, making the shape
    effectively invisible (same color, same area, stroke drawn first).
    Confirmed via a targeted width-profile scan at the (wrongly) uniform-
    scale version: constant ~38px width the entire span, no taper visible
    at all, despite the shape function itself working correctly when
    called in isolation (verified separately by drawing it directly in a
    bright test color and finding it exactly where expected). Fixed with
    `pointsExcludingTipSegmentShape(points, segLen, thicknessPx)`: computes
    the shape's own scaled height, converts that to a whole number of
    segments via the entity's own `segLen` (`Math.ceil(shapeHeightPx /
    segLen)`, clamped so at least 2 points always remain), and returns the
    points array truncated by that many trailing points -- so the stroke
    stops short of the shape's own vertical extent, leaving that area for
    the shape alone to render. Approximate (whole segments, not exact
    stroke arc-length) is intentional and sufficient: over-omitting by a
    fraction of a segment just shows a bit more of the shape's own natural
    taper instead of stroke, never a visible gap, since the shape's own
    bottom is always exactly anchored to the true tip regardless of how
    much stroke got omitted above it. The truncated points are used ONLY
    for the stroke call -- `drawTipSegmentShape()` itself always receives
    the FULL, untruncated points array, so its own position/rotation
    calculation (from the true last two points) is never affected.
    `mainArcMult`/`tipArcMult` (the round-cap-at-the-free-end treatment)
    are also forced to 0 whenever Tip Segment Shape is on, same reasoning
    as `hasEndcap` already forces it to 0 -- the shape now covers that end
    entirely, no separate cap treatment needed there.
  - Re-verified via a targeted width-profile scan after both fixes: real,
    smooth taper matching the shape's own silhouette exactly -- 34px near
    the top (flared edge just appearing) -> 20px at the waist (~68-77px
    from the tip) -> 38px at the belly (~32-35px from the tip) -> down to
    6px right at the forked bottom tip. Also confirmed the OFF state
    (`tipSegmentShapeEnabled: false`) still renders a perfectly flat,
    constant-width plain rope (9/9 samples identical), i.e. zero regression
    to the default appearance.
  - This entire feature was verified WITHOUT screenshots: this session's
    Browser pane intermittently failed to composite fresh frames after
    direct `ctx`-level draw calls (confirmed via a controlled test --
    `ctx.fillRect` and a direct `drawEndcap()` call with an unmistakable
    bright test color produced no visible change in 3 consecutive
    screenshots, while `getImageData` read back on the SAME canvas
    correctly showed the new pixels were actually there). All verification
    for this feature used direct pixel sampling (`ctx.getImageData`)
    against the live canvas instead, which is unaffected by the
    compositor issue -- reads the ACTUAL drawn pixels regardless of
    whether the browser has visually repainted the pane. Canvas backing-
    store scale relative to CSS pixels (`canvas.width` vs
    `window.innerWidth`) was observed to differ between page loads in this
    same environment (1600x1000 vs 1280x800 for a 1280x800 CSS viewport) --
    always compute the actual ratio fresh (`canvas.width /
    window.innerWidth`) rather than assuming `window.devicePixelRatio`
    matches the backing store, when sampling pixels in a future session.
- **Anchor bounce removed; the position-clamp itself needed NO extra
  mechanism to look natural.** Per explicit feedback ("I dont like how it
  suddenly zooms back into its default spot"), `constrainAnchorToCircle()`
  (the separate velocity-reflection function from the anchor-physics
  round above) and `cfg.anchorBounceIntensity` are both fully removed.
  - **A first fix attempt introduced a real, measured bug, caught before
    shipping.** The instinct was to make `integrateChain()`'s own
    `boundaryConstraint` position-clamp "velocity preserving" by shifting
    `oldx`/`oldy` by the SAME delta as the position correction, on the
    theory (correct in isolation) that this keeps Verlet's implied
    velocity unchanged, letting tangential motion continue while only
    radial over-penetration gets corrected. The bug: this block runs
    INSIDE the `constraintIterations` loop, and can fire on more than one
    of those rounds within a single frame (the distance constraint
    pulling point 0 back out between rounds, then the boundary clamp
    pulling it back in again) -- shifting `oldx`/`oldy` on EVERY firing
    sums each round's own correction on top of the last, even though only
    the FINAL position matters. Confirmed via direct simulation: a
    synthetic point placed 20px past the boundary with a +15px/frame
    outward velocity came out with an IMPLIED velocity of +323.782
    next-frame (`y - oldy`) after a single `update()` call -- wildly
    wrong, not a rounding artifact.
  - **The actual fix is simpler than the broken attempt**: revert to a
    PLAIN position-only clamp -- exactly like the distance and bend
    constraints already in the same loop, neither of which EVER touches
    `oldx`/`oldy`. This works because `oldx`/`oldy` is already fixed for
    the whole frame (set once, at the very top of `integrateChain()`, to
    last frame's final position) -- leaving it alone during the
    constraint-iteration loop means next frame's implied velocity is
    naturally `(this frame's FINAL clamped position - last frame's
    position)`, which already correctly preserves tangential motion
    (rolling along the boundary) while killing radial motion (no bounce),
    with zero extra bookkeeping. Re-verified with the identical adversarial
    test: implied velocity came out as a sane -20 (pulled back in by
    roughly the amount it overshot by), not 323.
  - Verified the "rolls/slides naturally" claim directly, not just
    "doesn't blow up": a point given a strong tangential (sideways)
    velocity while resting at the boundary visibly slid sideways (x drifted
    640 -> 643.76) before gravity pulled it back down to rest at the
    bottom over ~15 frames, then held steady there (639.85-640.2, pure
    numerical jitter) for 165+ more simulated frames. A real
    chain-propagated disturbance (kicking `points[1]`, the segment right
    next to the anchor, hard upward) displaced the anchor off the boundary
    (`dist` dropped from 32 to 27.08) then resettled it at the boundary
    within 5 frames, with the SAME already-documented `constraintIterations`-
    dependent residual ratio (1.29 at the live setting) as the original
    anchor-physics round -- confirming no new instability, not just no
    crash.
- **Double-click-in-circle: two independent, layered bugs, both needed
  fixing before a real cut would succeed.** Reported directly ("double
  click in the circle STILL DOESNT WORK").
  - **Bug 1 -- routing.** `onPointerDown` checked `isOnCircle(x,y)` FIRST
    and returned immediately into `downInfo = {mode:'circle'}` for
    hold-to-grow, with no double-click detection anywhere in that branch.
    Fixed by giving the `'circle'` branch of `onPointerUp` the same
    `pendingClick`-timestamp-based double-click check the `'rope'` branch
    already had, resolving the target via a new `hitTestAnyIgnoringCircle(x,y)`
    -- identical to `hitTestAny()` but calls `nearestPointOnRope()`
    directly instead of `hitTestRope()`, deliberately skipping
    `isOnCircle()`'s own exclusion (that exclusion still fully governs
    normal single-click/hold-to-grow routing; only this specific
    already-double-click-confirmed path bypasses it).
  - **Bug 2 -- the cut floor, found DURING verification of bug 1's fix,
    not assumed away.** After fixing bug 1, a scripted double-click that
    `hitTestAnyIgnoringCircle()` correctly resolved to a real rope point
    still never produced a cut. Root cause: `cutRopeAt()`'s own "too close
    to cut" guard was `Math.max(vmin(cfg.circleCutDistance),
    circleExclusionRadius())`, measured from `circleAnchor()` (the circle
    GRAPHIC's fixed center). Since this is a `Math.max` against
    `circleExclusionRadius()` -- the EXACT SAME threshold `isOnCircle()`
    uses to route a press into `'circle'` mode in the first place -- the
    guard's effective radius is ALWAYS >= that routing threshold, by
    construction. This means NO click that could ever reach `cutRopeAt()`
    via the circle-mode double-click path (bug 1's fix) could EVER pass
    this check, regardless of how far it actually was from the anchor --
    confirmed directly: an inflated-`circleSize` test where
    `hitTestAnyIgnoringCircle()` found a real point 67.74px from the
    circle's center still got rejected, because the inflated
    `circleExclusionRadius()` inflated the floor by the same amount.
    This floor's own original design (see the Circle Cut Distance Gotcha
    elsewhere in this doc) predates the anchor becoming a free-moving
    point -- when the anchor was rigidly pinned to the circle's fixed
    center, "close to the anchor" and "close to the circle's own edge"
    were the same statement, so flooring at `circleExclusionRadius()` cost
    nothing. That's no longer true. Fixed by (a) measuring the guard from
    `mainRope.points[0]` (the anchor's REAL current position) instead of
    `circleAnchor()`, and (b) removing the `circleExclusionRadius()` floor
    entirely -- `cfg.circleCutDistance` (already independently tunable,
    and set noticeably smaller in the user's own current settings) is now
    the guard's ONLY radius, trusted directly rather than silently
    enlarged.
  - Verified end-to-end via the REAL `onPointerDown`/`onPointerUp`
    handlers (not calling `cutRopeAt()` directly): with the merged
    settings live (`circleCutDistance: 3`), a scripted double-click on
    `mainRope.points[1]` (confirmed via `hitTestRope()` returning `null`
    for that exact point, i.e. genuinely "inside the circle" per the
    routing logic) correctly created a `pendingCut`, which then correctly
    produced a real fallen piece after advancing past its delay. A
    double-click at `mainRope.points[0]`'s own position (distance 0 from
    the anchor) was still correctly refused -- the safety floor still
    works, just measured from the right point with the right radius now.
- **Rope End Curve Arc / Rope Top Curve Arch was drawing the wrong
  SHAPE, not just the wrong size.** Per explicit clarification ("At 0,
  the end of the rope is a straight line, at 1 its a full semi circle...
  at 0.5, it woud be halfway between the two"), the setting is meant to
  interpolate how much of a semicircle the end is -- not the radius of a
  circle sitting on top of a flat-cut end. The previous
  `strokeRopeCurve()` drew `ctx.arc(tip, (thickness/2)*arcMult, 0,
  2*PI)` -- a FULL circle whose radius shrank with `arcMult`, so 0.5
  looked like a small button poking out of a flat-cornered tip (the
  circle no longer spanning the stroke's own width), not a flattened
  semicircle. Replaced with `drawEndArc(px, py, dirx, diry, thicknessPx,
  arcMult)`: rotates into the local frame where +x is the outward
  direction (`tipDirection()` at the tip, `normalize(points[0]-points[1])`
  at the start), then draws a HALF-ellipse via
  `ctx.ellipse(0,0,protrusion,halfW,0,-PI/2,PI/2)` + `closePath()` --
  the flat chord (from the implicit `closePath` back to the arc's start)
  always spans the full rope width (`halfW*2 = thicknessPx`), while only
  the outward `protrusion = halfW*arcMult` varies. At `arcMult=1`,
  `protrusion === halfW`, making the ellipse a TRUE semicircle (matching
  the old always-round look exactly); at 0 the protrusion collapses to
  nothing (a flat chord, i.e. invisible, matching a straight end); values
  between are a proportionally flattened arc. Verified via a
  monkey-patched `ctx.ellipse()` call during a real `render()` pass:
  called with `radiusX === radiusY === 19.2` (exactly `thicknessPx/2` at
  the live 4.8%vmin thickness) for `ropeTopCurveArc: 1`, confirming a true
  semicircle rather than an undersized circle.
- **End Emerge: Y-only scale, tunable hide distance, tunable easing
  strength -- all 3 verified via monkey-patched canvas calls, not visual
  inspection alone (screenshots don't reliably composite fresh
  `ctx`-level draws in this environment -- see the Tip Segment Shape
  Gotcha above).**
  - `drawEndcap()`'s `ctx.scale(x,y)` call now passes a FIXED
    `normalScale` for X and an interpolated `yScale` (start ->
    `normalScale`) for Y, replacing the old shared `scale` variable used
    for both axes -- per explicit feedback ("scaling it only in the Y
    axis, as in the length axis"). Verified: monkey-patched `ctx.scale`
    calls at factor=0 and factor=1 showed an IDENTICAL X term (0.367,
    `thicknessPx/ENDCAP_ALIGNMENT.width`) both times, with only Y
    changing (0.0367 -> 0.367, matching `normalScale *
    cfg.endcapStartingScale` -> `normalScale` exactly).
  - The spawn anchor Y position (previously hardcoded to
    `ENDCAP_BOTTOM_Y[designKey]`, the design's own bbox bottom) is now
    `ENDCAP_ALIGNMENT.topY + (ENDCAP_BOTTOM_Y[designKey] -
    ENDCAP_ALIGNMENT.topY) * cfg.endEmergeHideDistance` -- a new tunable
    slider (`End Emerge Hide Distance`, x, 0-3, default 1). `0` collapses
    the offset to exactly `topY`, i.e. "already aligned with its final
    position" per explicit spec; `1` reproduces the exact old automatic
    behavior. Verified via monkey-patched `ctx.translate()` calls (the
    2nd `translate()` in `drawEndcap()` is the anchor-shift one): hide=0/
    factor=0 -> `-80.26` (`-topY` exactly); hide=1/factor=0 -> `-157.804`
    (`-ENDCAP_BOTTOM_Y`, the old default, confirming hide=1 is a true
    behavioral no-op vs. the prior hardcoded version); hide=1/factor=1 ->
    `-80.26` (always settles to normal `topY` regardless of hide
    distance, confirming the setting only affects the SPAWN state, never
    the settled one).
  - `EMERGE_TWEENS` entries now take `(t, s)` instead of just `(t)`,
    generalizing each curve's previously-hardcoded exponent (all
    originally fixed at 2 -- `t*t`, `1-(1-t)*(1-t)`, etc.) into `Math.pow`
    calls parameterized by a new `s` -- `cfg.endEmergeEasingStrength`
    (x, 1-6, default 2), fed through from `emergeFactor()`. `linear`
    ignores `s` entirely (`t => t` regardless), matching the intuitive
    "no easing" reading of that option. Added per explicit feedback that
    the fixed curves were "not enough" (too subtle a visual effect).
    Verified: `easeOut(0.5, s)` for `s = 1/2/4` produced `0.5/0.75/0.9375`
    -- `s=1` is exactly linear (matches `t`), `s=2` exactly reproduces the
    OLD hardcoded formula's output (`1-(1-0.5)^2 = 0.75`, confirming
    zero default-behavior regression from generalizing the formula),
    `s=4` is visibly more pronounced, all monotonically increasing with
    `s` as expected from `1-(1-t)^s`.
- **§12m "Set defaults" merge computed programmatically, not by hand, once
  the field count made manual O/G/P comparison error-prone.** With ~40
  settings and the live git-tracked settings file having ALREADY moved
  independently since an earlier read in this same session (confirmed by
  re-reading it immediately before merging, per the standing multi-session
  discipline -- ropeLength and circleCutDistance had both changed from a
  live client's own further tweaks), a small throwaway Node script applied
  this project's own §12m resolution rule (`P==G` -> stays `P`; `P==O &&
  G!=O` -> adopt `G`; `P!=O` -> `P` wins regardless of `G`) across every
  field, rather than reasoning through ~15 differing fields by hand where
  a transcription slip could silently ship the wrong default. Every
  differing field in this merge resolved via the `P!=O -> P wins` case (no
  field required the 3-way judgment call) -- confirmed by inspecting the
  script's own per-field log before writing the result.
- Incorporated 7 endcap SVGs the user added/edited directly in
  `data/Rope/`: 2 brand-new numbered variants (`End_Form1-15.svg`,
  `End_Form2-16.svg`), 2 new standalone designs with their own naming
  convention (`End_Form4.svg`, `End_Form5.svg` -- no dash-number suffix),
  and 3 files at ALREADY-REGISTERED filenames whose content had changed
  (`End_Form1-01.svg`, `End_Form1-02.svg`, `End_Form1-04.svg`). Confirmed
  via direct content comparison (not assumed from filenames alone) that
  the "already registered" ones weren't simple no-op edits -- e.g.
  `End_Form1-01.svg`'s current content is byte-identical to what key
  `form1-02` used to hold, and `End_Form1-04.svg`'s current content is
  byte-identical to what key `form1-05` used to hold -- i.e. the user has
  been reshuffling which numbered slot holds which shape, not just
  tweaking existing ones in place. Handled by treating each file's
  CURRENT on-disk content as authoritative for its filename-derived key
  (`End_Form<N>-<M>.svg` -> `form<N>-<M>`) unconditionally, rather than
  trying to infer or preserve any renumbering intent -- simpler and can't
  be wrong, since "incorporate what's there" doesn't require understanding
  WHY it moved. Added/updated all 7 in `ENDCAP_DESIGNS` (`d` string +
  matching `Path2D`) and the `Endcap Design` dropdown's `options` list (19
  designs total afterward, up from 14); `ENDCAP_BOTTOM_Y` needed no manual
  change since it iterates `ENDCAP_DESIGNS` by key automatically. Verified
  via 2 passes: `node --check` clean, then live -- cycling the dropdown
  through all 7 new/changed keys via a real `change` event confirmed no
  thrown errors and the expected value landing in `cfg.endcapDesign`, and
  a separate direct `render()` call per key (Tip Segment Shape disabled to
  isolate the endcap specifically) confirmed each one fills a
  similar-magnitude, non-zero pixel region around the tip (2614-2624
  rope-colored pixels in an 80x70 sample box across all 9 checked keys --
  consistent, no degenerate/empty outliers), catching any silently-broken
  path data before reporting the sync as complete rather than trusting
  `node --check` (which can't validate SVG path syntax) alone.
- **Startup animation (`introPhase`) reuses existing physics/growth code
  wholesale instead of introducing a parallel implementation.** A 5-value
  state machine (`'waiting' -> 'rising' -> 'pausing' -> 'growing' ->
  'done'`), ticked once per frame from the very top of `update()` via
  `updateIntro(rawDt)`. Key design choices, for any future session
  touching this:
  - `mainRope` is built (minimal, single-segment, via `resetMainRope()`'s
    new optional `startingLengthPx` param) and physically integrates
    normally throughout `'waiting'`/`'rising'`/`'pausing'` -- it's just not
    DRAWN (`render()`'s `showMainRope = introPhase === 'done' ||
    introPhase === 'growing'` gates the 3 mainRope-specific draw calls:
    `strokeRopeCurve`, `drawTipSegmentShape`, `drawEndcap`; `fallenPieces`
    rendering is untouched and unconditional, since nothing can be cut
    before the intro finishes). This means the rising dot's target
    (`mainRope.points[0]`, read live every frame) is always the REAL
    settled anchor position under whatever Anchor Physics settings are
    currently live, never a hardcoded `circleAnchor()+anchorBoundaryRadius()`
    formula that could drift out of sync if that physics changes later.
  - The `'growing'` phase does NOT reimplement extension -- it sets the
    same module-level `growing` flag the manual hold-to-grow-on-circle
    interaction already drives, so `growRope()`/`positionGrowingTip()` run
    completely unmodified. `updateIntro()` only watches
    `mainRope.totalLength` against `introTargetLengthPx` (captured at the
    `'pausing'->'growing'` transition) to flip `growing` back to `false`.
    A 1-frame overshoot past the target (observed: target 193.85px,
    landed at 195.85px) is expected and harmless -- the check happens
    AFTER that frame's growth already applied, same tolerance the
    existing growth-commit logic elsewhere already accepts.
  - `resetSettings()` is async and unawaited at boot, so `cfg.introEnabled`
    may not reflect a saved `false` value for the first several frames.
    Solved WITHOUT awaiting anything: `'waiting'` re-checks
    `cfg.introEnabled` every single frame (not once at boot) and jumps
    straight to a full-length `'done'` rope the instant it sees the
    feature is off, however late that arrives.
  - `onPointerDown()`'s very first line is `if (introPhase !== 'done')
    return;` -- the whole animation (including `'growing'`, which is
    otherwise indistinguishable from a normal interactive grow) is
    non-interruptible by a stray click.
  - Verified live via a temporary `window.__debugTMP1()` state-dump hook
    (removed before commit, `grep -c "__debugTMP"` confirmed 0 references
    remain) polled every animation frame across a real run: all 5 phases
    fire in order with correct timing (~2.0s wait; pause landed at 0.526s
    against a configured 0.5s, one `FIXED_DT` step of quantization,
    expected), and `ctx.getImageData` pixel sampling confirmed the exact
    background color at the circle's edge during `'waiting'` (no stray
    dot) and the exact rope color at the dot's position during
    `'pausing'`.
- **`detachEntireRopeAndRestartIntro()` (double-click in the circle) is
  literally "cut the whole rope off, then reuse Boot's own startup
  sequence" -- no new state machine.** The whole `mainRope.points` array
  becomes one new `fallenPieces` entry (same `topplePiece()` +
  `cutEdgeEmerge`/`tipEmerge` convention `performMainRopeSplit()` already
  uses), `mainRope` is rebuilt via `resetMainRope(vh(TARGET_SEG_LEN_VH))`
  (the same minimal-starting-rope call Boot makes), and `introPhase` is
  set back to `'waiting'` -- the existing `updateIntro()`/`render()`
  gating from the startup animation feature (above) does the rest
  unmodified, including `onPointerDown()`'s existing `introPhase !==
  'done'` guard automatically blocking interaction for the whole replay.
  Wired in at `onPointerUp`'s existing double-click-on-circle branch,
  replacing `cutRopeAt()` specifically when the resolved target is the
  rope (a double-click landing on an already-fallen piece is untouched,
  still a normal `cutPieceAt()`). What initially read as a bug report
  (from a user testing the live Vercel deployment, whose small
  `circleSize`/`circleCutDistance`/`minRopeLength` made a correct
  minimum-length cut's resulting stub nearly invisible against the
  circle) turned out, once investigated (grep confirming `introPhase`
  has exactly one `'waiting'` assignment in the whole file, plus a live
  debug-hook test proving a normal cut leaves a real, pixel-verified,
  attached stub with no code-level defect), to actually be describing a
  feature the user wanted -- confirmed directly rather than assumed.
  Verified live via a temporary debug hook: a real double-click at the
  circle's center moved the full original rope (9 points) into a new
  fallen piece, reset `mainRope` to 2 points, set `introPhase` to
  `'waiting'`, and the sequence correctly replayed end to end (regrown
  length within the same 1-frame-overshoot tolerance already documented
  for the startup animation's own growth phase); triggering it a SECOND
  time produced a second fallen piece and a second full replay,
  confirming repeatability, with a double-click attempted mid-replay
  verified as a no-op.
- **`bgRope` (the background "peeking" rope) is a second, fully
  independent chain -- only its anchor point is externally driven.**
  Built once at Boot (`resetBgRope()`) and rebuilt again at the startup
  animation's own `'pausing'->'growing'` transition (same race-avoidance
  reasoning as `introTargetLengthPx`'s own capture -- locks the length in
  against the real settings-loaded `cfg.ropeLength`, not a pre-load
  default). Every frame in `update()`, AFTER `mainRope`'s own
  `integrateChain()` call has produced this frame's final anchor
  position: `bgRope.points[0].x/y = mainRope.points[0].x/y`, then
  `integrateChain(bgRope.points, bgRope.segLen, dt, gravityAccel, 0)` --
  `pinnedIndex=0` excludes that point from gravity/integration entirely
  (the same mechanism `mainRope`'s own anchor used back when it was
  rigidly pinned, before the anchor-physics work made it free-floating),
  so the rest of the chain solves normally against a fixed anchor each
  frame while that anchor itself gets externally relocated every frame --
  net effect: bgRope's start tracks mainRope's start exactly, but its
  body swings under its own fully independent physics, never mirroring
  mainRope's own shape. `bgRope` is never touched by any cut/punch/grow
  code path -- non-interactivity ("it cant get cut and it cant get
  extended... will not be affected by our click") is achieved simply by
  never wiring it into any of those functions, not by an explicit guard.
  Rendered via a `ctx.save()/beginPath()/arc()/clip()/strokeRopeCurve()/
  restore()` block in `render()`, right after the circle's own fill --
  the first use of canvas clipping in this project. Gated behind the
  same `introPhase === 'done' || introPhase === 'growing'` condition
  `showMainRope` uses (re-stated inline since `showMainRope` isn't
  computed until later in the function), so it stays hidden during
  waiting/rising/pausing rather than contradicting "no rope, just the
  circle." Verified live via monkey-patched `ctx.save/clip/restore/
  stroke`: exactly 1 `clip()` call wrapping exactly 1 `stroke()` call
  per `render()` frame, confirming the block executes as written.
- **Found while verifying the above: a real, previously-undiagnosed bug
  where `resetSettings()` silently defeated the startup animation's own
  "grow from nothing" effect on every load where a saved Rope Length
  existed -- which is the normal case, not an edge case.** `ropeLength`'s
  `DEV_GROUPS` entry has an `onChange: v => setMainRopeTotalLength(vh(v))`
  handler (needed for a real slider drag to resize `mainRope` live); but
  `applyValues()` -- called by `resetSettings()` whenever it loads a saved
  snapshot -- ALSO fires every loaded slider's `onChange`, the exact same
  as a real drag would. Since `resetSettings()` runs async and unawaited
  at Boot (see the startup animation's own Gotcha above), it typically
  resolves DURING `'waiting'`, snapping `mainRope` from its intentionally
  minimal single-segment start straight to the full saved length via
  `setMainRopeTotalLength()` -- with `introPhase` completely untouched by
  that call, so the animation kept running its own timer/dot-rise/pause
  sequence against an already-full rope that was simply hidden by
  `showMainRope`'s gate, then "grew" from a length that was already at
  (or past) its own target the instant `'growing'` began, finishing
  instantly. This had been happening since the startup animation's very
  first round and passed every earlier direct-code-path test in this
  file's own history, because those tests checked PHASE TIMING and
  final-state pixel colors, never mainRope's actual point count/
  totalLength DURING `'waiting'` against what a truly minimal rope
  should measure (confirmed only this round, by computing the expected
  minimal length --`vh(TARGET_SEG_LEN_VH)`, ~28px at this project's
  typical viewport -- and noticing every prior test's own logged
  `totalLength` during `'waiting'` was actually ~190-250px, matching a
  FULL rope all along). Fixed with a minimal, targeted guard --
  `onChange: v => { if (mainRope && introPhase === 'done')
  setMainRopeTotalLength(vh(v)); }` -- skipping the resize while the
  animation is actively managing `mainRope`'s own length; the animation
  already reads `cfg.ropeLength` itself, fresh, at the exact moment it
  needs to (`'pausing'->'growing'`), so nothing is lost. Verified live: a
  full cycle after the fix showed `mainRope.totalLength` genuinely start
  at ~28px and grow smoothly to the configured ~252px over a duration
  matching the new Startup Extension Speed slider almost exactly (1863ms
  measured vs. ~1867ms computed from rate × distance).
- **Incorporating edited/new endcap SVGs: diff programmatically, don't
  trust file mtimes.** Per "i added new svgs and edited some. incorporate"
  -- several `data/Rope/End_Form*.svg` files had recent mtimes (from
  01:30-01:39 AND separately 03:23-03:46, two different editing sessions
  by the look of it), but a Python script comparing each file's own
  `<path d="...">` against what's actually embedded in `ENDCAP_DESIGNS`
  found only 2 of those recently-touched files (`form1-01`, `form4`) had
  genuinely different path data -- the rest (`form1-02`, `form1-04`,
  `form1-15`, `form2-16`, `form5`) were re-saved with byte-identical path
  content (likely other attributes changed -- style, anchor-line
  position -- that don't affect the embedded geometry). Trusting mtimes
  alone would have either updated designs that didn't need it (harmless
  but wasted verification effort) or, worse, given false confidence that
  "everything with a recent mtime is handled" while missing a design
  whose file changed without a correspondingly recent mtime (e.g. a
  batch-touch or sync operation). The diff script is the reliable check;
  mtimes are a hint at best.
- **`form1-01`'s SVG edit did NOT fix the neck-seam bug diagnosed 2
  rounds ago** (see that Gotcha above for the original measurement
  technique and root cause). Re-measured the NEW path's fill at y=80.26
  (the shared `ENDCAP_ALIGNMENT.topY` reference line every endcap is
  pinned to) using the identical `ctx.isPointInPath()` sweep: still only
  41.6-45.8 filled (~4 units), against the expected full 41.6-96 span --
  nearly unchanged from the pre-edit measurement. The specific edit that
  landed (the path's closing segment changed from `h-4.31` to `h-50.19Z`)
  altered how the path closes near its start point, not the actual shape
  of its top edge, which remains a narrow peak rather than a flat line at
  the pin line. `form4`'s edit (genuinely different `d`, same underlying
  design concept) and all 4 new designs (`form6`/`form7`/`form8`/`form9`)
  DO fill the full expected span at that exact line, confirmed the same
  way -- they're correctly built like the project's other already-good
  designs. `ENDCAP_BOTTOM_Y` needed no code change for the 4 new designs
  -- it's computed dynamically by iterating `ENDCAP_DESIGNS` at module
  load, so new keys are picked up automatically.
- **Verifying against this project's newest concurrent feature (Startup
  Animation) required working around 2 real, live bugs in it, neither of
  which is this session's own work to fix.** A completely fresh page
  reload with the live `introEnabled: true` default has `mainRope.points`
  empty (`length === 0`) immediately after boot -- calling
  `resetMainRope()` directly doesn't fix it either (returns with
  `segLen: 0`, `totalLength: 0`, all still consistent with the object
  literal it builds, just built from inputs that must themselves be
  wrong/uninitialized at that point in the intro's own state machine, not
  investigated further since it's out of scope). Any `update()` call in
  this state throws at `integrateChain()`'s `boundaryConstraint` block
  (`points[boundaryConstraint.index]` is `undefined`). Once `mainRope`
  is manually populated (mutated in place via a `getMainRope: () =>
  mainRope` getter exposed on the debug hook -- NOT a captured object
  reference, which would hit the exact same stale-reference trap
  documented in an earlier Gotcha above, since `resetMainRope()`/the
  intro logic reassigns the module-level `mainRope` variable rather than
  mutating it), the SAME class of crash recurs one level down:
  `bgRope.points[0]` is ALSO empty, crashing the line that copies
  `mainRope`'s anchor position onto it (`update()`, right after the main
  `integrateChain()` call). Manually populating both (via `getMainRope`/
  a new `getBgRope: () => bgRope` getter) was enough to get a clean,
  crash-free environment to actually test the endcap changes in.
  **Confirmed this is a REAL bug, not a test artifact**: reproduced
  identically via `read_console_messages` on a totally untouched fresh
  reload, with no debug hook attached at all -- `loop()`'s own error
  handler logs "loop() error (frame skipped): Cannot read properties of
  undefined (reading 'x')" on every single animation frame, meaning the
  rope currently never renders or updates at all with the app's own live
  default settings. Notably, the Startup Animation feature's own most
  recent changelog entry (immediately preceding this one) mentions seeing
  this exact error message ONCE during its own testing and dismissing it
  as "a likely stale-tab-reload race in this session's own browser
  tooling, not the app," not recurring across 4 subsequent clean runs
  for that session -- worth flagging that this session's own reproduction
  was 100% consistent across every fresh reload attempted, with no
  navigation race involved, suggesting that earlier dismissal may not
  hold up, or something changed since it was written. Not investigated
  further or fixed here -- it's squarely the Startup Animation feature's
  own still-in-progress code, not this task's scope (incorporating
  endcap SVGs); flagged in PROJECT_PROGRESS's Open Questions instead of
  silently working around it in the shipped code or silently leaving it
  undiscovered.
- **RESOLVED, not a code bug: the "empty points array" crash above is
  `window.innerWidth`/`innerHeight` reading `0` on certain fresh-tab-open
  paths in this specific Claude Code Browser-pane sandbox.** Root-caused
  during the next round's own testing by directly checking those two
  values on a freshly `preview_start`-opened tab (no prior `navigate` on
  it) immediately after load: both read `0`. Every `vh()`/`vw()`/`vmin()`
  call divides by one of them, so `TARGET_SEG_LEN_VH`'s derived `segLen`
  becomes `0`, and `Math.round(totalLen / 0)` (or `0/0` when `totalLen`
  is also `0`) feeds `NaN`/`Infinity` into `makeChain()`'s point count --
  producing exactly the empty/degenerate `points` array both sessions
  independently hit. Switching to an already-`navigate`'d tab with a real
  measured viewport made the crash disappear across every subsequent run.
  This matches an already-documented quirk elsewhere in this workspace
  (HANDO's and BUTTSONS3D's own "window.innerWidth/innerHeight read 0 on
  the very first script tick" entries) -- not new, and not reachable from
  a real browser/deployment load (a real page always has a valid
  viewport by the time scripts run). No production code fix was needed
  for the root cause itself; see the next entry for the (independently
  motivated) `loop()` resilience change made anyway.
- **CORRECTION to the "RESOLVED, not a code bug" entry above: it was real,
  and it happened on a real phone.** That entry's own conclusion --
  "not reachable from a real browser/deployment load" -- turned out to be
  an unverified assumption, not something actually tested against a real
  device. The user directly reported the real-world symptom from an
  actual phone on the live Vercel deployment: "I just texted it on mobile
  on vercel. And the start button [the circle] appears then disappears
  after a second so I can't start game" -- reported independently, with
  no visibility into (or reference to) the earlier "sandbox-only"
  conclusion, which strengthens rather than undermines it as corroborating
  evidence. `window.innerWidth`/`innerHeight` reading `0` or being
  otherwise unreliable very early in page life -- before layout settles,
  especially with a mobile browser's dynamic address-bar-driven viewport
  height -- is a real, widely-documented category of mobile Safari/Chrome
  quirk, independent of and unrelated to this specific dev sandbox's own
  tab-opening behavior; the earlier entry's reasoning (confirmed via
  `preview_start` vs. `navigate`'d tabs) only ever tested THIS sandbox
  tool's own quirk, never an actual mobile device, so it couldn't have
  ruled out the real-device case at all despite the confident phrasing.
  Fixed at the actual root this time: `viewportW()`/`viewportH()` (new
  helpers, declared right before "Canvas setup" so `resizeCanvas()` --
  which runs synchronously and immediately at boot -- can use them too)
  wrap `window.innerWidth`/`innerHeight` with a fallback chain --
  `window.inner* || document.documentElement.client* || <hardcoded
  default (400/800)>` -- and `vw()`/`vh()`/`vmin()`/`resizeCanvas()` all
  route through them instead of reading `window.inner*` directly. Since
  the fallback only ever engages when the real value is falsy (`0` or
  otherwise unavailable), this changes NOTHING about normal operation on
  any device where the viewport reads correctly -- purely additive
  robustness, not a behavior change for the common case. Verified via a
  fresh reload in this SAME sandbox (which, per the entry above, ALSO
  reads `window.innerWidth/innerHeight` as `0` -- confirming the
  underlying zero-read condition is real, reproducible, and NOT
  self-resolving via a resize event the way the earlier entry assumed,
  whatever exactly triggers it in a given environment): `mainRope.points`/
  `bgRope.points` now correctly hold 2 points immediately (previously 0),
  and a full 300-frame `update()` run through the entire intro sequence
  (`waiting` -> `growing` -> `done`) completed with 0 thrown errors and a
  correctly-rendered circle+rope on screen, vs. reliably crashing every
  single frame before this fix. The earlier round's `loop()` try/catch
  (see the next entry) remains a valid, independent resilience
  improvement -- it just isn't what actually stops this specific NaN-math
  root cause from recurring every frame, which is what this fix does.
- **5-item startup-animation follow-up round** (background rope becomes
  the climbing visual with a geometric clear-boundary trigger; gradient
  coloring for both ropes via a new "gradient" dev-panel control type;
  cross-piece-only fallen-piece collision via `pieceCollision()`;
  `maintainBgRopeEnd()` keeping the background rope's own tip
  perpetually out of the circle's clip view; End Emerge redesigned to
  slide-then-scale sequentially instead of simultaneously, with a
  width-clip against sideways overflow) -- full mechanism details for
  each are in that round's own CHANGELOG entry rather than duplicated
  here. One cross-cutting change worth calling out on its own: `loop()`
  now wraps its own body in try/catch, logging via `console.error`
  rather than letting an uncaught exception silently stop
  `requestAnimationFrame` from ever rescheduling itself (which is
  EXACTLY what made the sandbox-only crash two entries above look like a
  permanent, unrecoverable freeze rather than a single bad frame) -- a
  real, generally-applicable resilience improvement, kept independent of
  whatever specific exception triggers it.
- **A CanvasGradient's own stored coordinates are subject to whatever
  transform is active when it's PAINTED, not when it was created --**
  drawEndcap()'s own gradient (rope+endcap "one consistent gradient")
  has to account for this or it renders in completely the wrong place.
  drawEndcap() runs its fill deep inside its own `translate(tip)` /
  `rotate(angle)` / `scale(normalScale, yScale*heightMult)` /
  `translate(-topCenterX,-anchorY)` stack; a gradient built with WORLD
  coordinates (e.g. mainRope's own anchor-to-tip span, matching
  ropeStrokeColor()'s gradient exactly) and then used as `fillStyle`
  INSIDE that stack gets transformed a SECOND time by it, landing
  nowhere near the rope's own gradient. Fixed by mapping the same 2
  world points through the INVERSE of the CTM active at that point
  (`ctx.getTransform().inverse().transformPoint(worldPoint)`) to get
  LOCAL coordinates, then building `createLinearGradient` from those --
  since the gradient and the `design.path` it colors now live in the
  same local space, the SAME forward transform that correctly places
  the path also correctly places the gradient, landing it in exactly
  the world position the rope's own stroke gradient already occupies.
- **The gradient dev-panel control (`type:'gradient'`) went through 2
  designs this session -- the current one is a Photoshop-style
  draggable bar, NOT the original stop-count-slider-plus-N-color-
  pickers version.** Direct correction: "I dont want gradients equally
  spaced. I want to be able to slide the sliders to determine where a
  gradient color kicks in... clickable... opens color picker ui".
  `cfg[key]` is an array of `{pos: 0-1, color}` objects (order-
  independent -- always re-sorted by `pos` before building the real
  canvas gradient, both in `ropeStrokeColor()` and `drawEndcap()`'s
  gradientInfo path). The editor itself (`buildRow()`'s 'gradient'
  case): one shared hidden `<input type=color>` per row, repositioned
  and reused for whichever stop is currently being edited (not one
  color input per stop) -- opened via `.click()` only when a marker's
  own pointerdown+pointerup resolve to the SAME position (a real click,
  tracked via a `dragged` flag set the instant `pointermove` fires
  during that press) rather than a drag. Clicking empty bar space adds
  a new stop, color-interpolated from the gradient's own current value
  at that position; double-clicking a marker removes it, floored at 2
  stops (a gradient needs a start and end). A settings file saved under
  the OLD plain-hex-array format still loads correctly: `applyValues()`'s
  own gradient case checks `typeof v[0]` and auto-converts a plain array
  of hex strings to evenly-spaced `{pos,color}` stops before handing it
  to `el.setStops()` -- caught as a real gap while writing this note
  (the original implementation would have silently done nothing with an
  old-format array, since `el.setStops` expects objects) and fixed
  before shipping, not left as a known limitation.
- **A fallen piece's own thickness decay is fully independent per
  piece, not a single global timer.** Each piece created via
  `performMainRopeSplit()`, `performPieceSplit()`, or
  `detachEntireRopeAndRestartIntro()` gets its own `age` (ticked by
  `rawDt` every frame in `update()`'s existing fallenPieces loop) and
  `baseThickness` (captured once, at the moment it fell, from
  mainRope's/the parent piece's REAL live thickness at that instant --
  including whatever Detach Thickness Multiplier had already
  compounded, so a piece that falls off an already-thickened rope
  starts decaying from that real thickness, not the plain unmultiplied
  default). `pieceThickness(piece)` computes the current value fresh
  each render call: holds at `baseThickness` until `age` exceeds Piece
  Decay Delay, then decreases at Piece Decay Speed (%vmin/s) down to a
  floor of Piece Minimum Thickness. The "upper" half of a piece-on-piece
  cut (`performPieceSplit()`'s `piece` itself, which keeps its identity)
  deliberately does NOT get a fresh age/baseThickness -- it's the same
  continuous piece, just shorter, so its decay timeline doesn't restart;
  only the newly-split-off lower half starts fresh, seeded from the
  parent's CURRENT (possibly already-decayed) thickness via
  `pieceThickness(piece)` at the moment of the split, so the split-off
  piece doesn't visually jump back to full thickness.
- **A fixed-timestep accumulator's `lastTime` clock starting too early
  makes ordinary page-load work look like a physics catch-up burst.**
  `lastTime = performance.now()` used to be set where `FIXED_DT` itself
  is declared, well before Boot's own synchronous work (dev-panel
  construction, `resetSettings()`, etc.) actually runs -- all of that
  real wall-clock time landed in frame 1's own `frameDt`, which the
  `MAX_FRAME_DT`-capped accumulator (see `loop()`) then "catches up" on
  in a burst of extra `update(FIXED_DT)` ticks BEFORE the first
  `render()`. Since `updateIntro()`'s 'rising' phase moves
  `bgRope.points[0].y` by a fixed amount PER TICK, a burst of several
  ticks compressed into one JS turn paints as a sudden jump the instant
  `render()` finally runs; a smaller, more variable burst reads as
  stutter instead -- reported as "sometimes it lags, sometimes it jumps
  really high up". Fixed by re-syncing `lastTime = performance.now()`
  again immediately before the FIRST `requestAnimationFrame(loop)` call,
  after all of Boot's synchronous work has already run -- frame 1's own
  `frameDt` then reflects only the real gap until the browser's next
  paint (a normal single frame), not the page's own startup cost.
  `MAX_FRAME_DT` itself is untouched -- it still does its real job of
  capping a genuine catch-up burst (e.g. after a backgrounded tab).
- **`drawEndcap()`'s width and height used to scale off the SAME
  `thicknessPx`, so a fallen piece's own thickness decay silently
  shrank its endcap's LENGTH too, not just its width.** The endcap's
  footprint extends beyond the piece's actual polyline tip; `ctx.scale
  (normalScale, yScale*heightMult)` used one `normalScale =
  thicknessPx / ENDCAP_ALIGNMENT.width` for both axes, so as
  `pieceThickness(piece)` decayed toward `pieceMinThickness`, the
  endcap's own vertical span shrank right along with its width --
  reducing how far the visible piece extended beyond the anchor even
  though the underlying `points` array never changed length. Reported
  as "i dont want them to get shorter, just thinner" and "the cut off
  segment begins to shrink immediately" (immediately here meaning
  "within the first couple of decaying seconds", not literally frame
  0 -- `pieceThickness()` still honors Piece Decay Delay). Fixed by
  giving `drawEndcap()` an optional 8th param, `heightThicknessPx`
  (defaults to `thicknessPx` -- mainRope's own call site is unchanged,
  so its endcap still scales uniformly with `liveThickness`, including
  the intentional Detach Thickness Multiplier growth). The fallenPieces
  call site now passes `piece.baseThickness` (fixed at the moment the
  piece fell) for this param, so the endcap's X axis still tracks the
  live decaying thickness (visibly thinning, as intended) while its Y
  axis stays pinned to the piece's own original thickness (length no
  longer recedes as it thins). Live-verified via an actual cut in a
  local static-server browser session: the fallen piece's width
  visibly narrowed over ~18s of real decay while its top-to-bottom
  span stayed constant (within ordinary physics-settle variance).
- **`emergeFactor()`'s invisible slide-into-position phase and its
  visible grow phase used to share ONE rate, so slowing End Emerge
  Speed for a slower visible grow-in silently slowed the invisible
  slide by the same factor.** `tickEmerge()` advanced a single
  `emerge.progress` at `cfg.endEmergeSpeed / EMERGE_BASE_SEC` for its
  entire 0..1 span; `drawEndcap()`'s own `SLIDE_SHARE` (0.15) then
  treated the first 15% of that span as an invisible slide and the
  rest as the visible scale-up. At Speed's own current default (0.01,
  set several rounds ago per an explicit "at least 5x slower" request
  for the visible grow), reaching even that first 15% took
  `0.15 / (0.01/0.35)` ~= 5.25s -- reported as "even with delay set to
  0 it takes a while... like 5 seconds at least" (Delay adds ON TOP of
  this; setting it to 0 only removes the separate `delayRemaining`
  wait, not this slide cost). This is the SAME class of bug as an
  earlier-fixed one (the original 50/50 slide/scale split that made
  growth invisible for half the configured duration) resurfacing
  through a different mechanism -- back then SLIDE_SHARE itself was
  too large; now the shared RATE got slowed down for an unrelated
  reason. Fixed by decoupling the two phases' rates: `tickEmerge()` now
  advances at a fixed `EMERGE_SLIDE_SHARE / EMERGE_SLIDE_SEC` (always
  ~0.3s real time) while `emerge.progress < EMERGE_SLIDE_SHARE`, and
  only switches to the Speed-scaled rate once past that point --
  `EMERGE_SLIDE_SHARE` is now a shared top-level const (`drawEndcap()`'s
  local `SLIDE_SHARE` reads it) so the two functions can't drift apart
  again. End Emerge Speed still governs only the part the user actually
  sees.
- **Startup Rise Clear Offset's raw target can sit far outside mainRope's
  own anchor boundary, and the intro handoff didn't account for that --
  producing a real one-frame implied-velocity spike, not a random
  glitch.** `updateIntro()`'s 'rising' phase used to compute `clearY =
  circleAnchor().y + circleSize/2 - introRiseClearOffset` with no upper
  bound on how far it could sit from `anchorBoundaryRadius()` (the
  radius `integrateChain()`'s own `boundaryConstraint` actually confines
  mainRope's anchor to, every frame). At the live default Offset
  (-18.5), the raw target sits ~29%vmin from `circleAnchor()` against an
  ~8.75%vmin boundary radius at default Circle Size/Circle Boundary
  Offset -- bgRope's own rope-start (fully unconstrained/scripted during
  'rising') climbed there anyway, then the handoff code set mainRope's
  anchor AND its `oldx`/`oldy` equal to that same far-outside position
  (intending zero implied velocity). The very next `integrateChain()`
  call's `boundaryConstraint` clamps position back inside the radius
  WITHOUT touching `oldx`/`oldy` (a DELIBERATE design, see that
  constraint's own comment on why touching it there was tried and was
  wrong) -- so `oldx`/`oldy` was left holding the far-outside spawn
  position while `x`/`y` held the clamped one. The FOLLOWING frame's
  verlet step (`vx = (p.x - p.oldx) * damping`) then computed a real
  implied velocity from that mismatch and flung the anchor hard in the
  correction's own direction, confirmed via direct trace to be large
  enough to overshoot past the boundary's opposite side before damping
  settled it -- reported as "sometimes i see the background rope jump up
  past the top edge of the circle, then come back down" / "the rope
  comes from above". Fixed by clamping `clearY` ITSELF (the 'rising'
  phase's own climb target) to `[circleAnchor().y - anchorBoundaryRadius(),
  circleAnchor().y + anchorBoundaryRadius()]` -- bgRope's visible climb
  now stops exactly where mainRope's anchor can actually rest, so the
  existing handoff code's own "zero implied velocity" assignment is
  finally true on the very next frame too, not just the one it's set on.
  A material, visible side effect worth knowing: an Offset large enough
  to target beyond that boundary no longer visibly extends the climb any
  further than the boundary itself allows -- it never actually could,
  without reproducing this exact bug; Circle Boundary Offset (or Circle
  Size) is what actually governs how far the anchor -- and therefore the
  visible climb -- can range from center. Added a `Debug: Show Rise
  Clear Offset Line` checkbox (off by default) per direct request,
  rendered at the very end of `render()` regardless of `introPhase`: a
  dashed magenta line at the RAW (uncapped) target and a dashed cyan
  circle at `anchorBoundaryRadius()`, so the two quantities this fix
  reconciles can be visually compared directly -- confirmed live (both
  lines render at the expected positions, the cyan boundary circle sits
  visibly inside the drawn circle graphic's own bottom edge at default
  settings) before concluding the fix was correct.
- **The clamp-fix above ("Fix startup rope jump/bounce") only stopped
  the OVERSHOOT -- it didn't fix a second, deeper bug it exposed:
  `makeChain()` builds every point at the EXACT same x with `oldx===x`
  (zero implied velocity), so a freshly-reset mainRope is perfectly
  vertically symmetric from frame one.** With the clamp fix in place,
  mainRope's anchor spawns exactly at the boundary's own bottom-most
  point (x identical to `circleAnchor().x`) -- gravity pulls it straight
  down, `integrateChain()`'s own `boundaryConstraint` clamps it straight
  back up along that SAME line every single frame, and nothing ever
  introduces a net lateral force to break the symmetry. Confirmed via
  live tracing (a temporary `window.__debug` hook, removed before
  commit): mainRope's anchor sat frozen at EXACTLY its boundary radius,
  every point's x identical to `circleAnchor().x`, `oldx`/`oldy`
  identical to `x`/`y`, for 10+ real seconds with zero net motion --
  reported as "on startup... it stays this way for 5-10 seconds then it
  settles to the position i expect". On a real device, ordinary
  floating-point/timing noise eventually perturbs it enough to fall
  off-axis (explaining the reported, variable delay), but nothing
  GUARANTEED that happened promptly, or at all -- this sandbox's own
  more deterministic timing never once escaped it across 10+ seconds of
  direct measurement.

  Two fix attempts were tried and measured before landing on the right
  one, each confirmed via the same live-tracing technique rather than
  assumed:
  1. A one-frame nudge to `oldx` at the intro handoff itself (giving
     mainRope's spawn a small deterministic sideways velocity). Measured
     to fail even at a substantial magnitude (8% of the anchor's own
     boundary radius): by the time handoff runs, mainRope has already
     been integrating hidden for the entire waiting+rising duration,
     long enough to have settled deep into the symmetric trap across the
     WHOLE chain, not just the anchor -- a one-frame nudge that late is
     fighting already-settled inertia across every point, not preventing
     it, and decayed back to the exact same frozen x within the
     measurement window.
  2. Fixing `makeChain()` itself, at a small magnitude (max 3% of
     `segLen`) first -- also measured to fail: confirmed via direct
     chain-construction inspection (calling `makeChain()` fresh via the
     debug hook, bypassing the running loop) that it DID apply real,
     nonzero per-point offsets, but they were far too small relative to
     `damping` (0.984/tick) to survive the many physics ticks that
     elapse before mainRope is ever inspected/rendered -- decayed to
     floating-point-noise levels (~1e-12px) well before becoming
     visible, functionally indistinguishable from the original bug.

  **The actual fix**: `makeChain()` now gives every point a real,
  substantial per-point random x lean (`segLen * 0.4` range) at
  construction time, confirmed via the same fresh-construction check to
  produce real, meaningfully-sized offsets (e.g. one live sample:
  427.76/420.96/422.39/424.85 against a 422 center, for a chain built
  with `segLen≈31.6`). This gives mainRope a real, deterministic reason
  to settle off-axis from frame one, with the ENTIRE hidden
  wait+rise+pause duration available to do so naturally before it's ever
  shown (mainRope isn't rendered until `introPhase` reaches
  `'growing'`/`'done'`, per `render()`'s own `showMainRope` gate) --
  fixing the chain's own construction means there's nothing left for a
  late handoff-time nudge to fight.

  **A genuine environment limitation, disclosed rather than papered
  over**: this sandbox's own `performance.now()`/frame timing runs at an
  effectively extreme, accelerated rate relative to real wall-clock time
  (hundreds of "fps" reported by the panel's own counter, and repeated
  live tracing showed even large, deliberate perturbations -- a manual
  5px/frame kick applied directly via the debug hook -- fully decaying
  back to floating-point-precision zero within what this environment
  reports as only ~100ms of real elapsed time). This makes any
  wall-clock/screenshot-based attempt to directly OBSERVE the fix's
  settling motion unreliable here -- by the time a screenshot can be
  taken, thousands of physics ticks (at the code's own genuine,
  unaccelerated `FIXED_DT = 1/60`) may have already elapsed by this
  sandbox's own clock. Verification for this fix therefore rests on: (1)
  direct confirmation the lean mechanism produces real, substantial
  displacement at construction time (measured above, not assumed), (2)
  the physics math connecting `FIXED_DT`/`damping` (both genuine,
  device-independent code constants) to an estimated real-world settling
  time -- decaying a lean of this magnitude down to a perceptually-still
  ~1px amplitude takes roughly 150-200 ticks at `damping=0.984`, i.e.
  roughly 2.5-3.5 real seconds at a true 60Hz tick rate, the right order
  of magnitude for the reported "5-10 seconds" without claiming an exact
  match, and (3) confirming the app's final resting pose and everything
  else about it renders identically to before (no visual regression),
  via a normal screenshot once phase reaches `'done'`. This is explicitly
  NOT the same as having watched the actual settle animation play out in
  real time -- that specific claim is not made.
- **`detachEntireRopeAndRestartIntro()` (the double-click full-detach
  path) never called `resetBgRope()`, unlike Boot's own version of this
  exact restart sequence -- so `bgRope`'s chain carried over stale
  positions from wherever it was swinging right before the cut.** Boot
  calls `resetMainRope()` AND `resetBgRope()` together; this function
  only ever called `resetMainRope()`. `updateIntro()`'s 'rising' phase
  DOES explicitly reposition `bgRope.points[0]` alone to the fresh
  "below the circle" start the moment 'rising' begins -- but every OTHER
  point in the chain (`points[1]` onward) was left wherever it had last
  settled during normal `'done'`-phase operation (integrated every
  frame, following `mainRope`'s real anchor around). The instant 'rising'
  snapped point 0 to its new position while the rest of the chain stayed
  stale and potentially far away, the distance/bend constraints spent
  several real seconds violently whipping those stale points back into a
  normal chain shape relative to the new point 0 -- reported as "the
  background rope act[s] weird" for "5-8 seconds", "coming from the top
  or something" (wherever the rope happened to be swinging when double-
  clicked), reproduced reliably by cutting/detaching repeatedly ("I cut
  it 3 times"), since every detach re-triggers this same missing-reset
  path. Confirmed via direct live measurement (a temporary
  `window.__debug` hook, removed before commit): manually swinging
  `mainRope`'s anchor 150px sideways before triggering a detach, the
  post-detach `bgRope` chain's own X-spread across all points measured
  26.5px once 'rising' began -- a normal, compact hanging-rope shape,
  not a stale scattered one -- confirming the fix (adding `resetBgRope()`
  right alongside `resetMainRope()` in this function, matching Boot's
  own pairing) actually closes the gap rather than just plausibly
  sounding like it should.
- **`anchorBoundaryRadius()` had `circleBoundaryOffset`'s sign backwards
  relative to its OWN documented intent, confining the anchor to a
  boundary noticeably SMALLER than the drawn circle at the live default
  offset -- confirmed by directly reviewing the user's own screen
  recording, not just reasoning about the formula in the abstract.** The
  function's own comment: "Circle Offset... positive shrinks the
  playable interior, negative lets the anchor bulge past the drawn
  circle's own edge." The formula ADDED `circleBoundaryOffset` to
  `circleSize/2` -- for the negative default (-2), that SUBTRACTS,
  shrinking the radius to 8.75%vmin against a 10.75%vmin circle, the
  opposite of "bulge past the edge". Harmless once the rope has grown
  long enough to hang down and out past the (unconstrained) anchor
  regardless of exactly where it sits -- but during the brief early-
  growth window, while total length is still shorter than the gap
  between the anchor's overly-confined position and the circle's actual
  edge, the whole tiny rope+endcap sat entirely INSIDE the circle's
  interior. Reported as "the back rope i coming from the top or
  something" -- confirmed by actually watching the user's own recording
  (played via a local `<video>` element in a Browser-pane tab, seeking
  frame by frame with `currentTime`/`seeked` since no video-reading tool
  is available): at ~0.95s into a fresh startup, a small endcap-shaped
  blob sits near the TOP of the circle, well inside it, nowhere near the
  bottom edge where the rope is meant to "peek out of a hole in a wall".
  Fixed by SUBTRACTING `circleBoundaryOffset` instead of adding it, so
  the current negative default now correctly computes a 12.75%vmin
  radius (bulging past the circle's own 10.75%vmin edge) instead of
  8.75%vmin (confined inside it) -- confirmed via a temporary debug hook
  (removed before commit) that the live-computed radius exactly matches
  the hand-derived expected value (107.61px measured against 107.61px
  expected, from `vmin(1) * 12.75` at the test viewport's own actual
  `vmin(1)`). Also visually confirmed via the existing "Debug: Show Rise
  Clear Offset Line" checkbox (added 2 rounds ago): its own boundary
  circle now visibly bulges past the drawn circle's edge instead of
  sitting entirely inside it. This same function backs BOTH of the
  previous 2 rounds' own fixes (the rise-clear-offset clamp, and the
  boundary-clamp inside `integrateChain()` itself) -- neither of those
  fixes was wrong, they were both correctly clamping to whatever radius
  this function returned; the radius itself was the part that didn't
  match its own documented intent.
- **"Still not fixed, same issue" (with the same screenshot showing the
  rope reaching into the circle) turned out to have NO remaining code
  bug at all -- it's a pure scale mismatch in the user's own live
  settings, confirmed by direct measurement, not a further sign error.**
  Per explicit request ("check my saved setting defaults"), fetched and
  computed the actual pixel geometry from their live values: at
  `ropeThickness=10`, `endcapHeight=1.45`, and their chosen endcap
  design, the endcap graphic itself renders ~92.8px tall -- but their
  `ropeLength=4.21%vh` produces a TOTAL rope length of only ~29.4px, and
  their `circleSize=21.5%vmin` circle is only ~134.6px in diameter. The
  endcap alone is more than 3x the entire rope's own length, and its
  "excess" reach beyond the rope's actual points (92.8-29.4=63.4px)
  almost exactly matches the circle's own radius (~67.3px) -- which is
  exactly why the endcap's own top edge lands right around the circle's
  center, regardless of where the (now-correctly-positioned, per the
  previous fix) anchor point actually sits. `drawEndcap()` draws the
  endcap's full natural (scaled) height unconditionally once fully
  emerged -- nothing clips it to the rope's own actual length. Confirmed
  directly, not just calculated: regrowing the SAME rope to 25%vh (via
  `setMainRopeTotalLength()` through a temporary debug hook) made the
  endcap sit entirely below the circle, exactly as intended, with the
  circle showing empty/dark above it -- proving the anchor-radius fix
  from the previous entry is genuinely correct, and this was a proportion
  issue in the settings, not a residual bug. Also directly tested
  `endcapHeight` 1.45 vs 1.0 (a live A/B) and found no meaningful visual
  difference -- confirms the endcap is already oversized relative to the
  rope even at its UNSTRETCHED natural size, so the height multiplier
  alone was never going to be the deciding factor. No code change made
  for this finding; reported the exact numbers to the user rather than
  a vague "try increasing X".
- **Added an independent Endcap Gradient (separate from the existing
  Rope Gradient), and made fallen pieces retain their gradient coloring
  instead of reverting to a solid color the instant they fall -- both
  per explicit request.** New `endcapGradientEnabled`/
  `endcapGradientColors` dev controls; `drawEndcap()`'s own
  `gradientInfo` param (already existed, previously always built from
  `cfg.ropeGradientEnabled`/`ropeGradientColors`) now reads the new
  endcap-specific config instead, for BOTH mainRope's own endcap and
  every fallen piece's endcap (including the separate cut-end endcap
  drawn when `endcapAtCutEnd` is on, using the piece's ORIGINAL
  pre-reversal far point as `worldTop` so that end's gradient stays in
  the same world-space orientation as the tip end's, rather than
  flipping independently). Separately, fallen pieces' own STROKE color
  (`strokeRopeCurve()`'s color argument) used to be hardcoded to
  `cfg.ropeColor` regardless of Rope Gradient Enabled -- now calls
  `ropeStrokeColor(piece.points, cfg.ropeGradientEnabled,
  cfg.ropeGradientColors, cfg.ropeColor)`, recomputed fresh each frame
  from the piece's own current points span, same convention mainRope's
  own stroke already used. Live-verified end to end via a temporary
  debug hook (removed before commit): pushed a piece copied from the
  live rope with the ROPE gradient set to red/blue and the ENDCAP
  gradient independently set to green/yellow -- the rendered piece
  showed its stroke transitioning red-to-blue and its endcap
  transitioning green-to-yellow, two genuinely independent gradients on
  the same fallen piece, confirming both fixes land correctly together
  rather than one silently overriding the other.
- **Added right-click (`contextmenu`) as a second way to delete a
  gradient stop, alongside the existing double-click, per explicit
  request ("right click on a slider toggle deletes it... thats what i
  want").** Both handlers now call the same shared `deleteStop()`
  function (previously inlined only in the `dblclick` listener) --
  `e.preventDefault()` added so the browser's own native context menu
  doesn't pop up over the marker. Live-verified via dispatched
  `PointerEvent`/`MouseEvent`s against the real DOM (not just static
  analysis): added a 3rd stop by simulating a click on empty bar space
  (2 -> 3 markers), then dispatched a real `contextmenu` event at the
  middle marker and confirmed it was removed (3 -> 2 markers), same as
  the existing double-click path already does.
- **The dev panel's own Collapse button only ever hid the BODY -- the
  panel's OUTER box kept its full pre-collapse height, leaving a big
  empty gap below the title bar instead of actually shrinking.** The
  `#devPanel.dp-collapsed` CSS rule (`.dp-body, .dp-resize {
  display:none; }`) only ever hides those two CHILDREN; it never touched
  `#devPanel`'s own explicit inline `height` (set by dragging a resize
  handle, or restored from saved settings via `applyPanelGeometry()`).
  That explicit height persisted across the collapse toggle regardless,
  so the panel's own bounding box never actually shrank -- reported as
  "the collapse button simply collapses the setting options but not the
  panel". Fixed in the collapse button's own click handler: on
  collapsing, the panel's current `style.height` is saved to a
  `dataset.preCollapseHeight` attribute and then cleared (so the panel's
  box auto-sizes down to just its visible title bar); on expanding
  again, that saved value is restored. Width is deliberately left
  untouched in both directions -- only height collapses. Live-verified:
  clicking Collapse now visibly shrinks the panel to just its title bar
  (screenshot confirmed), and clicking it again restores the exact same
  height the panel had before collapsing (also screenshot-confirmed, not
  just assumed from the code).
- **Root-caused "the dark flash near the rope start... occurs when i do
  a long click and hold flick from the bottom" via direct frame-by-frame
  physics tracing (a temporary debug hook stepping `update()` manually,
  removed before commit), not guessing from the code alone.**
  `applyPunch()`'s displacement (`power = vh(1.0) * intensity`) is an
  ABSOLUTE value, entirely independent of the rope's own scale. For a
  short rope (small `segLen`), a strong hold (Click Intensity +
  Intensity Ceiling, e.g. 1.1+10=11.1 in the live settings) can displace
  a point several times its own segment's length in one shot -- and
  since the falloff spreads a real kick across several NEIGHBORING
  points too (not just the exact hit index), this can fling the tip
  clean PAST its own neighbor, or even past the anchor itself, into an
  inverted configuration. Traced exactly what that produces: point 0
  (the anchor -- excluded from the punch directly via `pinnedIndex`)
  still got dragged by the ordinary distance constraint through a wild
  multi-frame swing, its distance from `circleAnchor()` recorded at
  each of 15 manually-stepped ticks, at one point landing barely 46px
  from center against a normal resting ~206px-equivalent range --
  i.e. swinging through the circle's own interior and briefly PAST its
  center. `tipDirection()` (which `drawEndcap()` rotates the endcap by)
  genuinely flip-flopped tick to tick during that recovery (e.g.
  `{-0.336,-0.942}` at tick 0 to `{-0.01,1}` -- effectively 180 degrees
  -- one tick later), not a smooth rotation -- confirmed visually too:
  with the endcap gradient set to a stark green/black pair, this chaotic
  spin is what sweeps the gradient's dark end across the endcap for a
  few frames, reading as a flash. Fixed by capping `applyPunch()`'s
  power at `segLen * MAX_PUNCH_SEGMENTS` (4) -- added `segLen` as a new
  explicit param, threaded through both real call sites
  (`mainRope.segLen`). Re-ran the identical 15-tick trace after the fix:
  the anchor's distance from center now stays tightly bounded (63.9-79.8
  px, vs. swinging from ~46 to ~80 before) and `tipDirection()` changes
  smoothly and monotonically tick to tick instead of flip-flopping --
  still a real, visible kick (the rope genuinely swings), just no longer
  a physically-invalid teleport-and-chaotic-recovery. Confirmed via
  measured numbers from BOTH before and after the fix, not just a visual
  "looks better now".
- **"The panel resizing in mobile is still buggy" -- `.dp-resize` was
  the one draggable-handle class in the whole panel missing
  `touch-action:none`.** Every other draggable element already has it
  (`.dp-drag-handle`, the collapsible-group drag handle, the gradient
  marker, etc.) -- `.dp-resize` itself never did. Without it, a REAL
  finger-drag starting on a resize handle can get hijacked by the
  browser's own native scroll/pan touch-gesture recognition before JS
  ever sees a clean `pointermove` sequence. This is invisible to both
  desktop mouse testing (no competing native touch-gesture layer) AND
  to synthetic `PointerEvent`s dispatched directly in JS (which bypass
  the browser's own touch-gesture recognition entirely) -- confirmed
  directly: dispatching synthetic pointerdown/move/up sequences against
  all 3 handle types (E, S, SE) in a mobile-viewport tab resized the
  panel exactly as expected every time, including while the panel's own
  settings list was mid-scroll, with no bug reproducible that way at
  all. Only a genuine physical touch-drag on an actual mobile device
  would expose the gap. Fixed by adding `touch-action:none` to the
  shared `.dp-resize` rule, matching every other handle. Verified the
  fix landed correctly post-edit via `getComputedStyle()` on a live
  resize handle in a mobile-viewport tab.
