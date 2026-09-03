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
- **Save Settings writes through to a git-tracked settings log (§12l):**
  `data/processed/dev-panel-settings.json`, holding `{values, order}` only
  (not panel geometry/style — those stay per-device chrome, not a
  cross-session default worth tracking in git). A static page can't
  silently write an arbitrary disk path, so this uses the File System
  Access API (`showSaveFilePicker`) — the first Save on a given browser
  prompts a native dialog (navigate to `data/processed/`, keep the
  suggested filename); the resulting handle persists in IndexedDB so every
  later Save reuses it silently. Chromium-only (Firefox/Safari lack the
  API) and localStorage remains the full baseline regardless — the git-log
  write is a best-effort addition, never a blocker.
- **The "set defaults" workflow (§12m):** when the user pastes a Copy
  Settings dump and asks to "set defaults," merge it against
  `data/processed/dev-panel-settings.json` per-field exactly as §12m
  specifies (O = value on record before merge, G = current git-log value,
  P = pasted value — P wins whenever it differs from O, otherwise adopt G).
  This is a *behavior* to follow when that request comes in, not something
  coded into the page.

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
- `ENDCAP_DESIGNS`' scale/anchor geometry comes from ONE shared
  `ENDCAP_ALIGNMENT` reference (`data/Rope/End Alignment.svg`'s own
  `<line>`), not each design's individual `getBBox()` — per explicit
  request once a 3rd design (End3.svg) arrived authored specifically to
  align with that shared line. Don't revert to per-design bbox
  measurement; a new design gets only a `path` entry. See
  `docs/CODE_SUMMARY.md` Gotchas for the full transform math and how it
  was verified. It's filled with
  `cfg.ropeColor`, not the SVGs' own authored white — don't hardcode a
  color there again. `cfg.endcapHeight` stretches only the local Y axis;
  the anchor-shift translate must stay the LAST call in the transform
  chain (so it's applied first to the raw path coordinates) or the top
  edge will drift off the tip when height ≠ 1.
- The dev panel's minimum resize size must come from
  `computeMinPanelSize()` (derived live from the header's actual rendered
  content), never a hardcoded number in either the JS resize math or CSS
  `min-width`/`min-height` — per workspace `CLAUDE.md` §12c. Recompute it
  at the start of every resize-drag, not once at boot; the title's
  rendered width depends on the Dev Panel Title Font Size slider, a live
  setting, so a cached value can go stale.
- `tipGrowDirection()` must fall back to a real direction (not `(0,0)`)
  whenever `prev`/`beforePrev` coincide — a 2-point rope (right after a
  near-anchor cut) hits this every time, and a degenerate `(0,0)`
  direction collapses new chain points onto the anchor's exact position,
  which the constraint solver then flings apart in an effectively random
  direction the next frame. This was a real, reported bug (a tangled knot
  right at the circle after cutting short and regrowing) — see
  `docs/CODE_SUMMARY.md` Gotchas for the full mechanism and reproduction.
- `cutRopeAt()` refuses a cut whose TARGET point (not the press position)
  falls within `cfg.circleCutDistance` of the anchor — a double-click can
  register as a normal rope click (press itself outside the circle) while
  still targeting a rope point well within the circle's zone. This was a
  real, reported bug, reported TWICE ("double click within the bounds of
  the circle... cut at the shortest length possible") — the first fix
  reused `isOnCircle()`'s own margin, which wasn't generous enough; now an
  independent, directly user-tunable slider. Don't go back to reusing
  `isOnCircle()` here. See `docs/CODE_SUMMARY.md` Gotchas for the
  reproduction.
- `DAMPING`/`CONSTRAINT_ITERATIONS` are `cfg.damping`/
  `cfg.constraintIterations` dev sliders now (default `0.85`/`10`), not
  hardcoded constants — changed after extensive testing showed the OLD
  defaults (`0.99`/`6`) were mathematically stable (zero jitter measured
  at true rest) but left a punch visibly swinging for ~3.65s, which is
  the likely real cause behind repeated "rope physics is erratic" reports.
  See `docs/CODE_SUMMARY.md` Gotchas for the full sweep of tested values.
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
- Save/Reset (§12d/§12l) write and read the git-tracked settings log
  ONLY — there is deliberately no parallel localStorage default. An
  earlier version of this project dual-wrote to both; that was corrected
  after an explicit §12d/§12l wording change made clear the git-tracked
  log is the *only* place Save Settings writes to. `getGitSettingsFileHandle()`
  takes a `mode` ('read' | 'readwrite'): boot-time/Reset reads use
  `queryPermission()` only (never prompts — there's no user gesture at
  boot to back a native permission dialog) and silently fall back to
  hardcoded defaults if permission isn't already granted; Save always
  runs from a real click/keydown, so it can fall through to
  `requestPermission()`/`showSaveFilePicker()` when needed. A
  `FileSystemFileHandle` is natively structured-clone-able (a documented
  File System Access API guarantee), so it can go straight into
  `idbSet()` — don't "simplify" this by trying to serialize the handle to
  JSON first, that would break it. (A test mock standing in for a real
  handle, with plain function properties, is NOT cloneable and will fail
  `idbSet()` — that's a limitation of the mock, not a bug in this code;
  the real API's handle objects work fine.)
- `logClick()` (DEV_MODE-gated `console.log('[click]', event, data)`) is the
  standing click/hold/double-click diagnostic — one call at every real
  state transition in `onPointerDown`/`onPointerUp` (down on circle/rope,
  hold-eligible, charging-start, grow-start, every release branch). Added
  per explicit request for a permanent diagnostic, not a temporary debug
  hook — don't strip it out or gate it behind anything narrower than
  `DEV_MODE`. Add a new `logClick()` call at any NEW state transition
  rather than leaving it silent.
- The growing tip's rendered position (`positionGrowingTip()`) is
  SMOOTHED toward its raw target (`smoothing = 0.25`, a simple per-frame
  lerp), not snapped to it — confirmed via frame-by-frame tracing that
  snapping straight to `dir.prev.y + dir.y*tipGrowLen` every frame showed
  through two real, measured sources of noise: the ordinary "breathing" of
  a fixed-iteration-count constraint solver on the real physics point
  right behind the tip, and `dir.prev`'s IDENTITY switching to a
  newly-committed point every time a segment completes. Reported as
  "rope extension isn't smooth, still jittery" after the damping/iteration
  fix above had already resolved the separate, larger "erratic swinging"
  complaint. Measured effect: max single-frame backward step during a
  continuous hold-to-grow went from -2.94px (no smoothing) to -0.67px
  (smoothing=0.25) over an identical 180-frame trace. `growRope()`'s own
  commit code additionally has the newly-finalized point (and the fresh
  tip started right after it) inherit `dir.prev`'s CURRENT velocity
  instead of starting from rest, for the same reason. Don't revert either
  change without re-measuring — see `docs/CODE_SUMMARY.md` Gotchas for the
  full investigation and the numbers behind the chosen smoothing factor.
- The double-click-cut sweep-mark belongs to whichever entity KEEPS ITS
  OWN IDENTITY through a cut, not whatever falls/splits away — `cutSweep`
  is a property on `mainRope` (after `cutRopeAt`) or on the piece that
  keeps `points` after `cutPieceAt` splits it, never on the newly-created
  falling/split-off piece. `renderCutSweep(entity)` reads `entity.points`
  and `entity.cutSweep` generically now (was hardcoded to `mainRope`
  and, before that, to the piece — reported backwards by the user: "the
  white line... should stay with the rope instead of the cut segment").
  `update()`/`render()` must advance/draw BOTH `mainRope.cutSweep` and
  every `fallenPieces[i].cutSweep` independently — don't special-case only
  one of them again.
- Cut-sweep color/thickness are `cfg.cutSweepColor`/`cfg.cutSweepThickness`
  dev sliders now, not the old hardcoded `'#ffffff'` / `Math.max(2,
  vmin(cfg.ropeThickness)*0.35)`.
- Fallen pieces are double-click-cuttable (`cutPieceAt`), splitting one
  piece into two — same geometry/toppling as `cutRopeAt`'s own piece
  split (factored into shared `topplePiece()`), but with no anchor/growth
  bookkeeping since a piece has neither. `hitTestAny()` checks the main
  rope AND every fallen piece and returns whichever is closer, tagged
  `target: 'rope' | 'piece'` — used ONLY for double-click-cut targeting.
  Punching and hold-charging stay rope-only by design (the user asked only
  for double-click-to-cut on pieces) — `hitTestAny()`/`hitTestPieces()`
  must never be wired into `applyPunch()`'s call sites without a fresh,
  explicit request to do so.
- **`integrateChain()` has a bending constraint (`cfg.bendStiffness`,
  default `0.15`) in addition to the distance constraints — do not remove
  it.** Pure distance constraints have ZERO resistance to folding (any
  angle between two segments, including a full 180° fold-back, satisfies
  them equally well). A strong-enough punch left the chain PERMANENTLY
  kinked — confirmed both by 2 user-recorded videos ("crazy movement on a
  single click" and, separately, a still-visible "extension jitter" after
  the damping/iterations fix) and by direct reproduction: a single punch
  left a 2-point span stuck at ~42% of its straight-line length,
  unrecovered after 3 full simulated seconds. The SAME root cause was also
  the real source of the endcap-rotation instability during growth
  (`tipDirection()`'s angle was flipping by up to 180° between frames) —
  fixing the fold fixed both symptoms at once (verified: max angle delta
  dropped from 180° to 0.014° on the same reproduction). Every interior,
  non-pinned point (`1..points.length-2`, naturally excluding the
  kinematically-positioned growing tip) is pulled toward the midpoint of
  its two neighbors each constraint iteration, same cadence as the
  distance constraints. Tuned low deliberately so ordinary swinging still
  looks floppy/rope-like — don't raise it reflexively if a NEW instability
  shows up; measure first, the way the previous damping/iteration tuning
  was measured. See `docs/CODE_SUMMARY.md` Gotchas for the full
  reproduction numbers.
- The double-click-cut sweep-mark's perpendicular direction (`nx,ny`) is
  computed FRESH every render frame from the entity's CURRENT tangent
  (`tipDirection()`), never stored/frozen on the `cutSweep` object at cut
  time — an earlier version snapshotted `nx,ny` once at the moment of the
  cut, so the mark visibly stopped tracking the entity's rotation as it
  kept swinging afterward (reported: "should follow the rotation and
  position of the end it was cut from instead of staying static"; also
  read initially as "cut line max length is [wrong versus] the width of
  the rope" — same root cause, since a stale normal makes the mark's
  world-space projection look mismatched against the rope's actual current
  edges even though its own length is still exactly `ropeThickness`).
- `logClick()` writes to BOTH `console.log` and a visible, scrollable log
  inside the dev panel itself (`#dpClickLog`, below the settings groups,
  capped at 200 entries, a Clear button next to it) — not console-only.
  The console-only version was the wrong interpretation of the original
  "add a click diagnostic log" request; the user clarified it needs to be
  visible in the panel. Don't revert to console-only.
- `GIT_LOG_WRITABLE` requires `DEV_MODE` (not just `protocol !== 'file:'`)
  — a deployed/hosted origin (e.g. a Vercel preview or production URL) is
  a normal `https:` origin that would otherwise pass the bare protocol
  check, but has no locally-tracked repo file for the native save-picker
  write to be meaningfully "tracked" through; per explicit report that
  clicking Save while viewing a Vercel deployment still triggered the
  native file-save prompt. `DEV_MODE` alone isn't sufficient either (it
  still allows `file:`), so both conditions stay layered together, not
  merged into one.
- **Tip Segment Shape** (`cfg.tipSegmentShapeEnabled`, ROPE group) draws a
  user-supplied shape (`TIP_SEGMENT_SHAPE`, from `data/Rope/RopeEG.svg`)
  anchored bottom-up at the tip, same convention as the endcap. It is
  **scaled uniformly from rope thickness alone** (`drawTipSegmentShape()`),
  never stretched to fit exactly one physics segment's length — an earlier
  version did that and it squashed the shape (natural aspect ratio ~2.5:1
  tall, one segment only ~9% of its natural height) into an unrecognizable
  flat blob. Don't revert to segment-length-matched scaling without
  re-measuring; see `docs/CODE_SUMMARY.md` Gotchas for the numbers.
- Because the shape isn't segment-length-matched, it usually reaches
  further back up the chain than just the last segment. **The plain rope
  stroke must stop short of the shape's own scaled height**
  (`pointsExcludingTipSegmentShape()`, called before every
  `strokeRopeCurve()` for mainRope/pieces) — both render in the exact same
  `cfg.ropeColor`, so without this, the full-width stroke underneath fills
  in exactly where the shape's own narrower silhouette (waist, fork)
  should show as a visible cutout, making the shape invisible against its
  own backdrop. Don't add a new stroke call for mainRope/a piece without
  routing it through this helper first when Tip Segment Shape might be on.
- `ENDCAP_DESIGNS` keys track their SOURCE FILENAME (`data/Rope/
  End_Form<N>-<M>.svg` → key `form<N>-<M>`), not a fixed "this shape always
  lives at this key" assumption — the user has re-numbered/replaced
  designs at existing keys before (e.g. form1-02's content became what
  form1-05 used to be, and a NEW form1-02 shape took its place) without
  changing the SVG's own file naming convention. When asked to
  "incorporate" new/edited SVGs, sync each file's CURRENT content to its
  filename-derived key directly — don't try to infer or preserve any
  renumbering intent, just make the code match what's on disk. `Path2D`
  objects and the dropdown's `options` list both need updating together;
  `ENDCAP_BOTTOM_Y` needs no manual update, it iterates `ENDCAP_DESIGNS`
  automatically.
