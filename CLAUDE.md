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

- **All 3 device tabs (Desktop/Mobile/Landscape, §12f) now exist** —
  Landscape was added 2026-09-13 (this project previously only had
  Desktop/Mobile, despite the workspace convention calling for all 3).
  `isLandscapeClass()` detects it as a TOUCH device (`pointer: coarse`) in
  landscape orientation specifically, checked before the portrait-only
  `isMobileClass()` (a landscape phone's own width can exceed
  `isMobileClass()`'s 767px threshold) — a resized DESKTOP window (mouse
  pointer) is never misread as Landscape.
- **Every setting can be made independently adjustable per Mobile/Landscape
  tab via its own checkbox, defaulting to shared with Desktop.** Corrected
  2026-09-13, REPLACING that same day's own earlier, narrower
  `DEVICE_SPECIFIC_KEYS` mechanism (a hardcoded 3-key array) — per a
  follow-up explicit request ("For all settings in Mobile and landscape,
  place a checkbox next to every setting and group..."), every single
  setting AND every group now gets its own "Independent from Desktop"
  checkbox (shown only on Mobile/Landscape) rather than a fixed short list.
  §12a's %/vmin-portability rationale only ever meant these settings COULD
  stay shared, not that they had to — being unit-portable across viewports
  doesn't mean a designer never wants a genuinely different value on a
  specific device. See `deviceIndependence`/`isKeyIndependent()`/
  `resolveValuesForTab()`/`buildValuesByDeviceForSave()` in `index.html`,
  and this file's own Gotchas entry, for the full mechanism (including why
  the group-level checkbox deliberately has NO persisted state of its own).
- Position/size dev values are expressed in **%/vmin of the viewport**, not
  px, so the layout stays proportionally correct across all 3 device tabs.
  Physics runs in pixel space each frame, re-derived from the %-based config
  (including on resize).
- Every X/Y position slider pair shares one global origin: `(0,0)` is the
  viewport's top-left corner, `100` is full width (X, `%vw`) / full height
  (Y, `%vh`) — matching `vw()`/`vh()` exactly (`circleX`/`circleY` already
  follow this). Any new position control must use the same scheme, so a raw
  value copied from one X slider and pasted into another X slider (same for
  Y) always lands on the identical screen point.
- The built-in "Dev Panel" settings group (§12i) is judged device-specific
  (independent per tab) by DEFAULT, for the same reason the panel's own
  size/position already is — it's the panel's own chrome, being rendered
  within differently-shaped viewports. Persisted alongside panel geometry
  (`panelStyle` in `getPanelGeometry()`/`applyPanelGeometry()`), not in
  `cfg` — it does NOT participate in the per-setting independence/
  visibility checkbox systems above at all (this whole group has its own,
  older, separate mechanism).
  **Corrected 2026-09-14 — one real exception to "always per-device":**
  `PANEL_STYLE_SHARED_KEYS` (`index.html`) lists the subset of fields
  (currently the 11 newest-ported ones — colors + bold/capitalize
  toggles) that are DESKTOP-authoritative and shared across all 3 tabs
  instead, matching `TEMPLATE_DEV_PANEL.html`'s own current convention
  (`DEV_PANEL_STYLE_SHARED_KEYS`) and the parent CLAUDE.md's general §12f
  principle (non-spatial/cosmetic settings default to shared; only
  size/position stays per-tab by default). The pre-existing 23 fields and
  the 8 newest per-tab fields (font sizes, letter-spacing, line-heights)
  are UNCHANGED — still fully per-tab, same mechanism as before. See
  `applyPanelStyleValues()`/`buildPanelGeometryForSave()`'s own comments
  for exactly how a shared key bypasses the normal per-tab snapshot
  restore (reads `panelStyle[key]` directly instead of the active tab's
  own saved `style`, and propagates a live edit into every OTHER tab's
  saved style at Save time) — this is intentionally a narrow, additive
  carve-out, not a rewrite of the whole group's persistence model.
- **The Dev Panel group now has real nested subgroups** (2026-09-14,
  ported from `TEMPLATE_DEV_PANEL.html`'s own `applyDefaultDevPanelSubgroupOrder()`,
  which itself ported THIS project's live organization back as the
  template's new standard): MECHANICS / PANEL UI / TEXT, with TEXT
  nesting 5 further subgroups (Dev Panel Title / Group Title / Setting
  Title / TABS / BUTTONS). Built once at boot
  (`applyDefaultDevPanelSubgroupOrder()` in `index.html`, called right
  after `buildPanelStyleGroup()`), idempotent, and — like every other
  group in this panel — fully drag-reorderable afterward via the
  existing generic group/row drag system (§12e; no special-casing
  needed, `createGroupElement(name, {noDeviceCheckboxes:true})` is the
  only difference from a normal group, and only skips the independence/
  visibility checkboxes, not drag capability).
- **A "Show On Mobile & Landscape" visibility system now exists alongside
  the per-setting independence checkboxes** (2026-09-14, `[JS-4b0]`-adjacent,
  adapted from `TEMPLATE_DEV_PANEL.html`'s own dynamic visibility feature)
  — scoped to `DEV_GROUPS` settings/groups only, same as independence
  (the Dev Panel chrome group is excluded from both). Shown ONLY on the
  Desktop tab (opposite gating from the independence checkbox, which
  shows only on Mobile/Landscape); default checked (visible everywhere).
  Unchecking hides that row's DOM entirely on Mobile/Landscape (a group
  hides itself once every current descendant is hidden — computed live,
  not a separate persisted per-group flag, same "no persisted group
  state, pure cascade" design as the independence group checkbox). This
  is purely a dev-panel DISPLAY decision — it never touches
  `cfg`/`resolveValuesForTab()`, so a hidden setting's independent (or
  mirrored) value keeps behaving exactly as configured in the actual
  running game. See `deviceVisibility`/`refreshVisibilityUI()`/
  `buildGroupVisibilityCheckbox()` in `index.html`.
- **Save Settings writes through to a git-tracked settings log (§12l):**
  `data/processed/dev-panel-settings.json`, holding `{valuesByDevice,
  independence, order, panelGeometry, textOverrides}` -- `valuesByDevice`
  (replacing the old flat `values`) and `independence` are both new
  2026-09-13 (see the per-setting-independence entry above for their own
  shapes); `panelGeometry`/`textOverrides` were already round-tripped
  through this same file before today, unaffected by this change. Panel
  geometry/style stay per-device chrome always, never checkbox-gated,
  same as before. A static page can't silently write an arbitrary
  disk path, so this uses the File System Access API
  (`showSaveFilePicker`) — the first Save on a given browser prompts a
  native dialog (navigate to `data/processed/`, keep the suggested
  filename); the resulting handle persists in IndexedDB so every later
  Save reuses it silently. Chromium-only (Firefox/Safari lack the API) and
  localStorage remains the full baseline regardless — the git-log write is
  a best-effort addition, never a blocker.
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
  duration up to Intensity Ceiling at Click Hold Max Duration). These 2
  were originally mutually exclusive per gesture by design, per explicit
  clarification from the user after the original spec read as ambiguous
  between them. **Corrected 2026-09-11:** a hold on the rope can now
  ALSO grow the rope at the same time (`cfg.ropeGrowthOnRopeHold`, ROPE
  GROWTH group, off by default) — per explicit request this is ADDITIVE
  to charging, not a replacement for the old exclusivity: with the
  checkbox on, a rope hold both charges intensity (fires on release,
  unchanged) AND grows the rope while held (`growthOnRopeHoldTimer`, a
  SEPARATE timer from `holdTimer` — that one's already used by the same
  branch for the charging-arm timer at a different delay, so don't
  reuse it for this too). The circle's own hold-to-grow is still
  mutually exclusive with charging (a hold that starts in the circle
  never charges, per `startedInCircle`'s own comment) — only the
  ROPE side of the exclusivity was relaxed, and only when this
  checkbox is explicitly turned on.
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
  ONLY — there is deliberately no parallel localStorage default.
  **Corrected 2026-09-12 — this project's own settings architecture has
  moved on from what this gotcha used to describe (File System Access
  as the sole mechanism); that description is now stale for reads and
  for a real deployment's writes.** Current shape, 3 tiers each for
  read (`resetSettings()`) and write (`saveSettings()`):
  - **Tier 1 — a real server-backed path, works on ANY device/origin**
    (local dev server or an actual Vercel deployment), no picker/
    permission dance needed. Reads (`readSettingsViaApi()`) are a plain
    `fetch('/data/processed/dev-panel-settings.json', {cache:'no-store'})`
    — the file is just a static, git-tracked asset once committed.
    Writes (`writeSettingsViaApi()`) go through a Vercel serverless
    endpoint that commits via the GitHub API (§12l's `GITHUB_TOKEN`/
    `DEV_PANEL_SAVE_SECRET` in the parent CLAUDE.md) — this is what
    actually lets a REAL, non-dev visitor's own Save (or a mobile
    device) persist to the shared settings file; it's not local-
    developer-only the way Tier 2 is.
  - **Tier 2 — this browser's own previously-granted File System
    Access handle** (`getGitSettingsFileHandle()`, `readGitSettingsLog()`/
    `writeGitSettingsLog()`), gated on `GIT_LOG_WRITABLE` (itself
    requiring `IS_LOCAL_CONTEXT` — `file:`/`localhost`/`127.0.0.1`
    only). This is the mechanism the OLD version of this gotcha
    described as the only one; it's now the fallback for local dev
    specifically, not the universal path. Boot-time/Reset reads still
    use `queryPermission()` only (never prompts); Save can still fall
    through to `requestPermission()`/`showSaveFilePicker()`. A
    `FileSystemFileHandle` is natively structured-clone-able, so it
    goes straight into `idbSet()` — don't serialize it to JSON first,
    that breaks it. (A test mock with plain function properties is NOT
    cloneable and will fail `idbSet()` — a mock limitation, not a bug.)
  - **Tier 3 — last resort**, only when neither above reached the log
    at all: read falls back to this tab's own `sessionStorage`; write
    hands the user a real downloadable file (`downloadSettingsAsFile()`)
    AND stashes it in `sessionStorage` (never a persistent default),
    honestly reporting "session only" rather than claiming a real save.
  `IS_LOCAL_CONTEXT` (not just protocol) is what gates whether a
  deployed page is ever allowed to fall through past Tier 1 into
  Tier 2/3's local-save mechanisms — added after a real reported bug
  (clicking Save on an actual configured Vercel deployment still
  triggered the native file-save picker, since the check that existed
  before didn't exclude a genuinely deployed `https:` origin). Don't
  reintroduce a bare `location.protocol !== 'file:'` check as the ONLY
  gate for this fallthrough; it's not sufficient on its own.
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
- The `#dpClickLog` panel's own rendered line (2026-09-12) is
  `HH:MM:SS.mmm  [<physics note>]  <event>  <data>` — a real wall-clock
  timestamp (`formatClickLogTime()`) plus a short note on what the
  event means for the ROPE'S OWN PHYSICS (`CLICK_LOG_PHYSICS_NOTE`,
  event string -> `flick`/`charge`/`cut`/`drag`/`drag (end)`/`attract
  (start)`/`attract (end)`/`none`), per explicit request — deliberately
  NOT FLICK MOUSE's own cosmetic `mfMode`/direction. **Any NEW
  `logClick()` call site that represents a real change to the rope's
  physical state (a new way to punch/cut/drag/grow/attract it) needs
  its own entry added to `CLICK_LOG_PHYSICS_NOTE`** — an event missing
  from that table silently falls back to `'none'`, which would be
  wrong (not just incomplete) for a genuine new physics trigger. An
  arm-only/failed-attempt/purely-informational event correctly wants
  `'none'` and needs no entry.
- The `#dpClickLog` panel also has its own **Copy** button
  (`copyClickLog()`, header row, next to Clear, 2026-09-12) — copies
  the panel's own already-rendered DOM lines directly (the DOM IS the
  log; no separate source of truth), same clipboard/flash mechanism
  `copySettings()` uses. And a **DEBUG** group (this project's first)
  holds "Log Rope Position Data" (`cfg.clickLogPositionDataEnabled`,
  default `true`), which filters `CLICK_LOG_POSITION_KEYS` (`x`, `y`,
  `hitDist`, `hitIndex`, `releaseDist`, `index`) out of the PANEL line
  when off — `console.log`'s own separate output is never filtered,
  regardless of this checkbox. **Any NEW `logClick()` data key that
  represents a raw screen/rope coordinate, distance, or point index**
  (as opposed to an outcome/state value like `intensity`/`willCut`/
  `target`) **needs adding to `CLICK_LOG_POSITION_KEYS` too** — a key
  missing from that set stays visible even with the checkbox off,
  silently defeating the point of turning it off.
- `GIT_LOG_WRITABLE` requires `DEV_MODE` (not just `protocol !== 'file:'`)
  — a deployed/hosted origin (e.g. a Vercel preview or production URL) is
  a normal `https:` origin that would otherwise pass the bare protocol
  check, but has no locally-tracked repo file for the native save-picker
  write to be meaningfully "tracked" through; per explicit report that
  clicking Save while viewing a Vercel deployment still triggered the
  native file-save prompt. `DEV_MODE` alone isn't sufficient either (it
  still allows `file:`), so both conditions stay layered together, not
  merged into one.
- **Removed 2026-09-12 (per explicit request, "remove the Tip Segment
  Shape feature completely"):** the Tip Segment Shape checkbox
  (`cfg.tipSegmentShapeEnabled`), `TIP_SEGMENT_SHAPE`, `drawTipSegmentShape()`,
  and `pointsExcludingTipSegmentShape()` no longer exist anywhere in
  `index.html` -- every call site (the tip-arc-mult computation, both
  `strokePoints`/`mainStrokePoints` derivations, the shape's own draw
  calls) was removed or inlined back to plain `points` array reads.
  The source SVG (`data/Rope/RopeEG.svg`) was deliberately LEFT on disk,
  unreferenced -- per this project's own "nothing gets deleted by
  default" convention (workspace `CLAUDE.md` §11), not an oversight.
  Don't reintroduce a feature keyed on this exact config name/asset
  without first confirming the user actually wants it rebuilt, not
  just re-added by habit because the file still exists.
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
- When a FLICK frame-set prefix gets renamed (a recurring event on this
  project), diff the new prefix against the OLD one for a CASE-ONLY
  difference before trusting a plain existence check. Windows is
  case-insensitive, so a rename like "BehindThumb" -> "BEHINDTHUMB"
  silently overwrites the old file in place on disk -- `git status`
  reports it as a same-path modification (not delete+add), which keeps
  the OLD-case path tracked in the repo. `fs.existsSync()`-based
  verification (used throughout this file's own asset-checking scripts)
  is ALSO case-insensitive on Windows and will NOT catch this -- it
  happily reports 0 missing even when the tracked path's case doesn't
  match what the code actually requests. This is invisible locally but
  a guaranteed 404 on Vercel's case-sensitive Linux filesystem. Real,
  found-in-the-wild bug (`BEHIND THUMB - SCISS`, 2026-09-10) -- before
  committing a prefix rename, diff old vs. new prefixes case-sensitively
  (e.g. `old.toLowerCase() === new.toLowerCase() && old !== new`) across
  every affected folder, and for any hit, `git rm --cached` the old-case
  path then re-`git add` so the tracked path matches the real filename.
- SNAP's freeze-at-42 mechanic (`mfSnapFrozen` in the update() mouse-flick
  block) used to hardcode `mfFrozenFrames.length > 41 && mfIdx >= 41` --
  a magic number derived from the SNAP frame set being 45 CONTIGUOUS
  frames at the time it was built, where index 41 meant "the 42nd frame"
  per the original spec's own wording ("stop the sequence at frame 42").
  A SNAP frame trim (45->38 frames, 2026-09-10) silently broke this:
  with `length` now 38, `length > 41` could never be true, so
  right-click-hold stopped freezing entirely, for any direction --
  confirmed via live testing (held `mfRightDown` for 300+ ticks,
  sequence ran straight to `idle`). Fixed the same day, per explicit
  user resolution ("count which number the frame with the number '41'
  in it is"): the guard now targets `SNAP_FREEZE_INDEX =
  mouseFlickNearestIndex(SNAP_A_FRAME_NUMBERS, 41)` -- frame NUMBER
  41's CURRENT position in the array (computed once at load, reusing
  the nearest-number helper already built for mid-sequence direction
  switching), not a hardcoded index. **If SNAP's frame set changes
  again, this now self-corrects automatically** (it re-resolves to
  wherever 41 sits, or the nearest surviving number if 41 itself gets
  removed) -- don't reintroduce a hardcoded index here even if a future
  trim seems to "just need one more number adjusted."
- The FLICK MOUSE cursor is anchored at the WRIST (`MOUSE_FLICK_
  VISIBLE_BOUNDS`, 2026-09-10, ported from DotFlicko's own
  `VISIBLE_BOUNDS_BY_DIRECTION`), not the raw PNG's geometric center --
  `render()`'s draw call offsets by `-drawW*vb.centerX, -drawH*vb.
  bottomY`, looked up per (direction, variant) via `mouseFlickVisible
  Bounds()`/`mouseFlickVariantKeyForMode()`. Values are PRECOMPUTED
  OFFLINE against each variant's own frame 1 PNG (Node + sharp,
  `ALPHA_HIT_THRESHOLD=10`), never scanned live -- DotFlicko's own
  history is the reason why (2 real rounds of bugs from a live scan:
  a freeze from running it during interaction, then an accuracy
  tradeoff from downscaling to fix that). **If ANY variant's frame 1
  art changes for ANY direction, regenerate that specific entry** --
  re-run the offline scan against the new `<prefix>_001.png` (same
  formula as DotFlicko's own documented one-liner: alpha>10 bounding
  box, `centerX=((minX+maxX)/2)/w`, `bottomY=(maxY+1)/h`) and update
  just that one `{centerX,bottomY}` pair in `MOUSE_FLICK_VISIBLE_
  BOUNDS` -- don't assume a stale entry is still close enough, the 4
  variants within one direction can differ meaningfully (e.g.
  front-pinky: base bottomY 0.9221 vs charge 0.9228 vs sciss/snap
  0.9228 with a different centerX again). This table depends on frame
  1 specifically always existing for every variant/direction -- if a
  future frame trim ever removes frame 1 itself (unlike the trims so
  far, which have all preserved it), the anchor would need to shift to
  whichever frame IS used as that variant's reference instead.
- Dev panel drag targets (`groupDragTargets()`/`rowDragTargets()`) MUST
  exclude any candidate that isn't actually visible
  (`gb.offsetParent !== null`) -- a collapsed group's own
  `.dp-group-body` reports `getBoundingClientRect()` as an all-zero
  rect at (0,0) (plain `display:none` behavior), which
  `makeReorderable()`'s own "nearest candidate" drop fallback (used
  whenever the pointer ends up outside every visible target's own
  bounds) can match as "very close" for a drag ending near the top of
  the screen -- silently nesting whatever's being dragged inside a
  hidden, collapsed group instead of leaving it at top-level. Real,
  reported, reproduced bug (2026-09-10: "when i drag a group out of
  the panel. It dissappears"). Don't drop this filter if either
  function is ever rewritten.
- The dev panel's group-level `makeReorderable` registration matches
  handles by the `dp-group-handle` class (NOT the older, shared
  `dp-drag-handle` class every handle -- row or group -- also carries
  for cursor/color/touch-action styling). This split is load-bearing:
  a row's own handle carries `dp-row-handle dp-drag-handle`, so if the
  group listener ever goes back to matching plain `.dp-drag-handle`,
  a row-handle pointerdown will ALSO satisfy it (resolving
  `handle.closest('.dp-group')` to the row's own CONTAINING group) and
  silently start a second, simultaneous drag of that entire group.
  Real, reported, reproduced bug (2026-09-10: "when I try [to drag a
  single setting between groups], it drags the whole group") --
  confirmed independently via a direct live test (dragging one row a
  small amount visibly reordered its own parent group). If a NEW
  draggable item type is ever added to this panel, give its handle its
  own distinct class the same way, don't just reuse the bare
  `dp-drag-handle` class for `makeReorderable`'s own `handleClass`
  argument.
- Row (setting) dragging is registered ONCE, delegated on `#dpBody`,
  with `rowDragTargets()` as its crossContainerFn -- NOT once per
  group body (the pre-2026-09-10 design, which was also part of why
  cross-group row dragging never worked at all). A newly created
  ("+ Add Group") or restored (`placeGroup()`) group needs NO row-
  listener registration of its own -- the single delegated listener
  already reaches it via `container.contains(handle)`. Don't
  reintroduce a per-group `makeReorderable(gb, 'dp-row', ...)` call;
  it's redundant with the delegated listener and reintroduces the
  "confined to one group" limitation.
- A setting row can now live in 2 different places: inside a group's
  own `.dp-group-body`, or directly in `#dpUngrouped` (outside every
  group). Anything that looks up a row by key across the whole panel
  (restoring saved order, Text Edit Mode's rename sweep) must search
  BOTH -- use the shared `findRowByKey()` helper rather than a
  `#dpGroups`-scoped query, which will silently miss a row currently
  sitting in `#dpUngrouped`.
- `getPanelOrder()`/`applyOrder()`'s `order` field changed shape from a
  bare array (just the groups) to `{ungrouped, groups}` (2026-09-10).
  `applyOrder()` still accepts the old bare-array shape for backward
  compat (`Array.isArray(order) ? order : (order.groups || [])`) --
  don't remove that fallback, an existing user's saved settings log
  predates this field.
- SNAP's trigger (mfMode='snap') has 2 separate input sources now: a
  real mouse right-click (`e.button===2`, sets `mfRightDown`) and a
  mobile triple-click-and-hold (a 3rd rapid touch tap's own
  pointerdown, sets `mfTripleHeld`) -- deliberately 2 SEPARATE flags,
  not one shared boolean, so a real right-click and a touch
  triple-tap-hold can't get conflated on a hybrid touch+mouse device.
  The SNAP freeze-at-frame-42 check in `update()` reads
  `(mfRightDown || mfTripleHeld)` -- any FUTURE input source added for
  triggering SNAP needs its own flag OR'd in here too, not a reused
  existing one.
- Touch tap-counting for the above (`mfTouchTapCount`/`Time`/`Timer`)
  is COMPLETELY SEPARATE from `mfPendingClick` (the mouse-only single/
  double-click pairing) -- touch input never touches `mfPendingClick`,
  and mouse input never touches the touch counters. This was
  deliberate: mouse's existing double-click(SCISS) resolution fires
  IMMEDIATELY on the 2nd click's release (unchanged, still does), but
  touch's 2nd tap DEFERS its SCISS resolution by one more
  `doubleClickThreshold` window instead, specifically so a 3rd tap's
  pointerdown (within that window) can preempt it and fire SNAP
  instead -- collapsing these two mechanisms back into one shared
  pairing would either break the deferral touch needs or add an
  unwanted, unrequested deferral to desktop's own click resolution.
- This sandbox's Browser pane clamps `setTimeout` to roughly 1 SECOND
  minimum regardless of the requested delay (measured directly:
  `await new Promise(r=>setTimeout(r,60))` took ~1000ms via
  `performance.now()` before/after) -- confirmed this is NOT the same
  issue as the already-documented requestAnimationFrame-suspended-pane
  quirk (fronting the tab via `tabs_select`, which fixes THAT one, did
  NOT fix this). Makes it impossible to test a real short (sub-
  ~1-second) inter-event gap via an actual `await setTimeout()` wait in
  this environment. Workaround used for the triple-tap-hold feature: a
  temporary debug-hook function that directly rewinds the relevant
  internal timestamp variable backward by a controlled amount,
  exercising the real `performance.now() - timestamp <= threshold`
  comparison logic against a precisely simulated elapsed time instead
  of depending on the environment's own throttled timers. Reach for
  this same technique for any future feature whose correctness depends
  on a short real-time gap between 2 dispatched events.
- **Corrected 2026-09-11 (see below for the full reversal) --** FLICK
  MOUSE's rotation target (`mfEntityAngleDeg`) and its direction-
  bucket/hand-pose selection (`mfDirectionKey`) were briefly kept as 2
  deliberately separate angle computations (2026-09-10, Cursor Target
  Mode's own initial build) on the theory that changing what the
  sprite points at shouldn't silently change which hand-pose frame-set
  gets shown. That theory turned out to be WRONG per explicit user
  clarification the very next day: "the image 'points' [from] the
  center of the bottom edge, to the center of the top edge. and the
  angle of that line will determine what animation type to be
  showing" -- i.e. direction-bucket selection was always SUPPOSED to
  track the sprite's own rendered pointing line, not an independent
  raw mouse-angle. Direction-bucket selection now reads
  `mfPointingAngle = mfEntityAngleDeg + 180` (matching render()'s own
  rotation formula exactly, so it's the literal on-screen pointing
  direction), for EVERY Cursor Target Mode including Center -- not
  `mfTargetAngle` (mouse-from-center) any more, which now feeds only
  the Center-mode branch of the rotation lerp's own target. A real,
  intended side effect: direction-bucket switching now inherits the
  rotation lerp's own smoothing lag (Mouse Flick Rotation Smoothing),
  instead of updating instantly/independently the way it used to for
  every mode. If a future report says direction-switching feels
  "laggy" compared to pre-2026-09-11 behavior, this is why -- it's the
  now-correct, explicitly-requested behavior, not a regression to
  silently revert.
- `mouseFlickEndcapTarget()`'s "fully cut" fallback (targets the most
  recently fallen piece's own tip once `mainRope.totalLength` is near
  `cfg.minRopeLength`) is a DELIBERATE simplification, not a precisely
  verified spec: "fully cut" can't mean literally zero rope remaining
  (`cutRopeAt` refuses any cut shorter than `minRopeLength`, so main
  rope can never actually reach 0), and which fallen piece carries the
  ORIGINAL rope's own inherited endcap after SEVERAL cuts isn't tracked
  -- this always uses the most recent one. If a future report says the
  wrong piece is being targeted after multiple cuts, this is the first
  place to look, not a sign of a new bug.
- `clampToWalls()`'s bounce reflection (`cfg.wallBounciness`) MUST
  capture the incoming velocity (`const vx = p.x - p.oldx;`) BEFORE
  `p.x` gets overwritten to the clamped boundary value -- a real bug
  in the first version, caught live: it computed
  `p.oldx = p.x + (p.x - p.oldx) * wallBounciness` AFTER `p.x = minX;`
  had already run, so `(p.x - p.oldx)` silently read the clamped
  position instead of the real approach speed, reflecting a near-zero,
  position-dependent value instead of the actual incoming velocity.
  Confirmed via an isolated Node extraction of the exact logic (0/37/74
  reflected velocity for bounciness 0/0.5/1 against an incoming -74)
  and live in the browser (bounciness=1 correctly bounced a free test
  piece away from the wall at high speed once fixed). Any FUTURE
  per-axis reflection/restitution logic added to this file's physics
  must capture the pre-mutation value first, the same way `clampToFloor`
  and this fix both do -- don't compute a "before" quantity from a
  variable that's already been reassigned to its "after" value on an
  earlier line of the same block.
- FLICK MOUSE (the cursor-follow hand overlay) has its OWN, completely
  SEPARATE pointerdown/pointerup listeners from the rope's own
  (`onPointerDown`/`onPointerUp`) -- its own hold-timer arms a charge
  after `cfg.doubleClickThreshold` on EVERY left-press with NO position
  gating at all (it doesn't check whether the press landed on the
  rope, the circle, or empty space). This means ANY rope-side hold
  gesture ALSO, completely independently, drives FLICK MOUSE's own
  charge/click state machine on the exact same press/release pair --
  a real, previously-unnoticed gap (2026-09-11): a hold that grows the
  rope (the circle's own hold-to-grow, or the "Grow Rope On Rope Hold"
  checkbox) was ALSO triggering FLICK's own click sequence on release,
  since `mouseFlickEndCharge()`'s own "always plays click on release"
  convention doesn't know or care what the SAME release meant for the
  rope. Fixed via `mfSuppressClickFromGrowth`, set true the moment
  `growing` becomes true in EITHER hold-to-grow timer callback and
  consumed at the top of FLICK's own pointerup handler -- a SEPARATE
  flag, not a direct read of `growing`, because the rope's own
  `onPointerUp` (registered earlier in the file, so it always runs
  FIRST for the same event) has already reset `growing` to false by
  the time FLICK's handler runs. **Any FUTURE rope-side gesture that
  should suppress FLICK MOUSE's own independent click/charge trigger
  needs to set this same flag** -- don't assume the 2 systems will
  naturally stay in sync just because they're triggered by the same
  physical click, they're wired through entirely separate listeners
  with no shared gating.
- Cut Splatter (`spawnCutSplatter()`, called from `performMainRopeSplit()`
  and `performPieceSplit()`) is gated on BOTH `cfg.cutSplatterEnabled`
  AND `DEV_MODE` directly at the spawn call site --
  `if (!cfg.cutSplatterEnabled || !DEV_MODE) return;` -- not just the
  checkbox's own default-off state. This is deliberate, not redundant:
  Save Settings writes to the git-tracked settings log
  (`data/processed/dev-panel-settings.json`), which EVERY visitor's
  `cfg` loads from equally, not per-user (see the Save/Reset gotcha
  above). A dev turning the checkbox on locally to test it, then
  hitting Save Settings, would otherwise ship it turned on for every
  real visitor too. Don't remove the `!DEV_MODE` half of this check
  thinking the checkbox default alone is sufficient protection.
- Drag Rope (`cfg.dragRopeEnabled`) reuses `integrateChain()`'s
  `pinnedIndex` parameter for an INTERIOR chain point, not just index 0
  or the last point -- it was already fully generic (both the distance
  and bend constraints already excluded ANY index passed in, not
  hardcoded to the anchor/tip), so this needed zero solver changes. If
  a future change to `integrateChain()` ever special-cases `pinnedIndex
  === 0` or assumes it's only ever the last index, it will silently
  break Drag Rope -- keep it index-agnostic.
- Drag Rope overrides Click-And-Hold via the SAME `holdTimer` callback
  charging already uses (`onPointerDown`'s rope branch) -- when
  `cfg.dragRopeEnabled` is on, that callback arms `downInfo.dragging`/
  `downInfo.dragIndex` instead of `downInfo.charging`, so the two are
  mutually exclusive per hold by construction (never both). A quick tap
  (no hold) still punches normally either way -- only the HOLD outcome
  is overridden, not `pendingClick`'s own tap/double-click resolution,
  which this feature doesn't touch at all. Also sets
  `mfSuppressClickFromGrowth` the moment dragging arms, reusing the
  same flag built for hold-to-grow -- without it, releasing a drag
  would ALSO trigger an unwanted FLICK MOUSE click/charge sequence, the
  identical bug already fixed twice for the circle's own hold-to-grow
  and the "Grow Rope On Rope Hold" checkbox (see that gotcha above).
  Any FUTURE rope-side hold gesture needs to set this same flag too.
- The dragged point's index is clamped to a minimum of 1
  (`Math.max(1, downInfo.hit.index)`) -- index 0 is the anchor itself,
  already confined by its own separate circle-boundary clamp
  (`boundaryConstraint`), and pinning it via `pinnedIndex` at the same
  time would fight that mechanism. In practice a press that lands
  exactly on/near the anchor position routes to the pre-existing
  `mode:'circle'` branch before ever reaching the rope hit-test at all
  (confirmed live), so this clamp is a defensive fallback for a narrow
  edge case (a press landing just outside the circle's own margin but
  still closest to point 0), not the primary gate.
- 2026-09-11: this file's own `index.html` saw a real cross-session
  commit-attribution mixup, not just a working-tree collision -- a
  concurrent FLICK MOUSE session's commit (`2b93c94`) ended up
  containing this same day's separately-developed "Drag Rope" feature
  (10 of that commit's own added lines match Drag Rope's markers),
  despite that commit's own message explicitly stating the two were
  kept separate via hunk inspection. Most likely mechanism: a blanket
  `git add`/commit against the shared working tree while Drag Rope's
  own edits were sitting there uncommitted, with the hunk-inspection
  check either run at the wrong moment or not actually excluding the
  overlap. No code was lost -- see `docs/CHANGELOG.txt`'s 2026-09-11
  10:25 PM entry for the full account. Take away: hunk-by-hunk
  inspection before staging (CLAUDE.md §9's own guidance) is necessary
  but not sufficient on its own if performed carelessly or against a
  stale diff -- re-run `git diff` immediately before the actual
  `git add`/`commit`, not earlier in the task, when checking for
  another session's concurrent work in this file.
- Drag Rope's own hand animation (`mfMode:'dragRelease'`, 2026-09-11)
  overrides charge's display while `downInfo.mode==='rope' &&
  downInfo.dragging` is true, the same "override charge's own draw"
  pattern Tickle already established -- `mfDragCyclePos` advances
  0..47 but CLAMPS at 47 instead of looping (per explicit spec: "pause
  on the last frame"), unlike Tickle's own repeating tail. On release,
  it counts back DOWN from WHEREVER it actually stopped (not always
  47) to 0 -- a quick drag-and-release well before reaching the last
  frame reverses from its own real stopping point, verified live.
  **Corrected 2026-09-12:** the 'front' direction's own "FRONT DRAG"
  folder was empty when this feature first shipped (2026-09-11) but
  real frames have since been added (48/48, contiguous) -- it now has
  its own `drag:{...}` entry like every other direction. `mouseFlick
  DragFrameIndex()` still returns `null` for any direction genuinely
  missing drag art, and both `onPointerUp`'s release check and
  render()'s own draw still gate on this before indexing into
  `mfFramesForDir.drag` -- that fallback path stays in the code as a
  real defensive guard (any FUTURE direction added without drag art
  degrades the same safe way), it's just no longer active for 'front'
  specifically now that its own gap is closed.
- **Corrected 2026-09-12:** only 1 of the 8 real Drag Rope frame
  folders still has an internal gap (behind-pinky missing 45-47) --
  given an explicit `nums:` array (not plain `count:48`), same
  `mouseFlickNearestIndex()` fallback Tickle/SNAP already rely on.
  behind-thumb's own earlier gap (frame 24) is now closed (re-supplied
  48/48 under yet another new prefix, `BehindThumb Drag`) -- simplified
  back to plain `count:48`. behind-pinky's gap MOVED rather than closed
  when ITS folder was re-supplied the same day (was 17-20,41; now
  45-47), also under a new prefix (`BehindPink Drag`) -- don't assume a
  re-supplied folder's old gap numbers still apply, re-enumerate fresh
  every time. **front-pinky's own earlier gap (missing 20-23,34) is now
  ALSO closed** (re-supplied 48/48, same day, under yet another new
  prefix -- `FrontPink Drag`, was `Front Pink Drag`, space before
  "Drag" dropped) -- also simplified back to plain `count:48`. If any
  of these folders' frames are ever replaced/re-supplied again, verify
  the gap is actually closed (or has moved) via direct enumeration
  (same "check
  again" discipline the Tickle SIDE THUMB saga already established)
  before simplifying back to a plain `count:48`. The other 7
  (behind, behind-thumb, front-thumb, side-thumb, side-pinky, front,
  front-pinky) are all gap-free, plain `count:48`.
- **A dev-panel checkbox that defaults to `false` stays off for
  EVERY visitor -- dev or real, mobile or desktop -- until someone
  actually checks it AND clicks Save Settings, since Save writes to
  the one shared, git-tracked settings file every session's `cfg`
  loads from.** Real, found, fixed bug (2026-09-12): `dragRopeEnabled`
  (def `false`) was also saved as `false` in `dev-panel-settings.json`,
  so the entire Drag Rope feature -- mechanic AND its own hand
  animation, both fully built and pushed since 2026-09-11 -- was
  switched off for literally everyone the whole time; reported as
  "drag interaction doesnt work... nor does the actual dragging work."
  The CODE was completely correct on every path tested (mouse and
  touch PointerEvents, direct physics ticks) -- the bug was purely
  that nobody had ever toggled this specific checkbox on AND saved it.
  Fixed with a one-field DATA change (`dragRopeEnabled: false -> true`
  in the settings file), not a code change. **When a shipped feature
  seems totally inert/invisible on every device and environment
  tested, check the actual saved value in `dev-panel-settings.json`
  before assuming the code itself is broken** -- especially for any
  control whose own default is `false`, since that's exactly the
  state a real visitor silently inherits until someone deliberately
  flips and saves it.
- Drag Rope's own arm condition (`onPointerDown`'s rope-branch
  holdTimer) is `cfg.dragRopeEnabled && downInfo.hit.dist <=
  vmin(cfg.dragRopeHoldDistance)` -- the distance check is NOT
  optional. The first version (2026-09-11) only checked the checkbox,
  and since `nearestPointOnRope()` always returns SOME point
  regardless of distance, that meant literally ANY hold anywhere on
  the canvas armed a drag, including a hold that narrowly missed the
  circle's own `isOnCircle()` hit-zone -- real, reported, reproduced
  bug (2026-09-12: "wherever in the browser i click and hold, it
  triggers a drag... Only when i click and hold ON the rope itself
  does it trigger. any other time, click and hold should trigger a
  charge, or a grow"). `isOnCircle()` itself is checked earlier and
  takes precedence regardless of this gate (a genuine circle hit
  never reaches the rope branch at all) -- don't reintroduce the
  unconditional version thinking the circle check alone is sufficient
  protection; it only protects an ACTUAL circle hit, not a near-miss.
- FLICK MOUSE's direction-lock (`update()`, right after `mfTargetDirKey`
  is computed) must distinguish SNAP's own HELD phase from its
  post-release completion tail -- they are NOT the same thing, even
  though both share `mfMode === 'snap'`. Unlike click/sciss (which fire
  once immediately with no hold phase at all), SNAP has a genuine held
  state (right-click-and-hold, or the mobile triple-tap-hold
  equivalent) before its own end sequence plays out. A version of this
  lock that excludes bare `mfMode === 'snap'` (lumping it in with
  click/sciss/dragRelease) incorrectly locks the HELD phase too -- real,
  reported, reproduced bug (2026-09-12: "when i do right click and
  hold, during the hold, [direction should] respond to the cursor
  position"), confirmed via a real dispatched right-click-hold + cursor
  move showing zero direction change across a full screen-width sweep
  while still held. Fixed via `mfSnapHeld = mfMode === 'snap' &&
  (mfRightDown || mfTripleHeld)`, used as `(mfMode !== 'snap' ||
  mfSnapHeld)` in the lock condition -- responsive while genuinely
  held, locked only once release starts playing out the remaining
  frames. Any FUTURE change to this lock must keep held-vs-tail as 2
  separate states for SNAP specifically; click/sciss/dragRelease have
  no hold phase at all and stay simple always-locked exclusions.
  **Corrected further, 2026-09-12 (same day, round 2) -- this fixed
  the LOCK's own SCOPE (when direction is allowed to update) but not
  its own ANGLE SOURCE, which had a separate, real bug -- see the next
  gotcha below.**
- Direction-bucket selection (`update()`, the `mfTargetDirKey`/
  `mfDirectionSourceAngle` computation) must use a genuinely FIXED
  origin -- the rope's own ANCHOR (`mainRope.points[0]`) -- not the
  sprite's own smoothed rotation angle. The OLD approach
  (`mfPointingAngle = mfEntityAngleDeg + 180`) derived direction from
  where the sprite visually points, which for Cursor Target Mode
  'rope' means the NEAREST POINT ON THE ROPE -- a genuinely moving
  reference once the rope isn't hanging straight down. A straight-
  hanging rope's nearest point to anything above/beside it happens to
  BE the anchor, which is why a simple at-rest test of this exact area
  can pass cleanly while the real bug survives untouched -- **any
  future testing of direction-bucket behavior must bend/swing the rope
  first (e.g. via Drag Rope) before trusting a passing result**, not
  just test against a rope at rest. Real, reported, reproduced bug
  (2026-09-12: "I think it may be because you are measuring angle
  based on the cursor and the rope's local origin... I want that
  rotation angle measurement to be measured according to a fixed angle
  origin. So IE, whenever the cursor is directly above the rope, the
  animation type should always be Behind"). Fixed via
  `mfDirectionSourceAngle = mouseFlickAngleFromCenter(mfX, mfY,
  mainRope.points[0].x, mainRope.points[0].y) + 180` -- RAW cursor
  position (`mfX`/`mfY`, NOT the smoothed `mfEntityX/Y`) relative to
  the anchor specifically, with the same "+180" convention the old
  formula used so the existing, already-tuned `mouseFlickAngleOffset`
  slider (live value 180) needed no recalibration -- verified by hand
  before touching any config: with offset=180, cursor directly above
  the anchor resolves to 'behind', directly right resolves to
  'side-thumb', matching the spec's own 2 worked examples exactly.
  `mfPointingAngle` no longer exists anywhere in this file -- don't
  reintroduce sprite-rotation-based direction selection without
  re-reading this entire gotcha and the 2026-09-11/2026-09-12 history
  it summarizes; this is the 3rd distinct design this exact mechanism
  has gone through this project, each one a real, explicit correction
  of the one before it, not an arbitrary preference.
- FLICK MOUSE queues a busy trigger instead of dropping it
  (`mfQueuedTrigger`, 2026-09-12, per explicit request: "when an
  animation sequence is running, and the user triggers another
  animation sequence, run the 2nd animation sequence AND triggered
  reaction after the 1st sequence is finished"). A single slot,
  latest-wins if a 3rd attempt arrives before the queued one gets its
  turn -- fired by `mouseFlickFireQueuedTrigger()` at the shared
  click/sciss/snap natural-completion point in `update()`. **The
  `mfLeftDown` guard on the 'charge' case is load-bearing, not
  redundant with `mfRightDown`/`mfTripleHeld`** -- those track a
  completely different button/gesture (SNAP's trigger). A queued
  'charge' that fires after the LEFT button/touch has already been
  released has no future `pointerup` left to ever end it
  (`mouseFlickEndCharge()` only runs from a real release), so it would
  sit stuck mid-charge permanently with no way out. `mouseFlickFire
  QueuedTrigger()` checks `mfLeftDown` specifically for the 'charge'
  case and drops it silently if false; 'play' triggers (click/sciss/
  snap) need no equivalent guard, since they're one-shot sequences
  that always complete on their own regardless of button state. Don't
  remove `mfLeftDown` thinking an existing flag already covers it.
- **FLICK MOUSE "interaction points" (2026-09-12) replace the literal
  cursor position with an annotated per-direction contact point for
  EVERY distance-gated interaction** -- Click Distance, Click And Hold
  Distance, Double Click Distance, Drag Rope Hold Distance. Per
  explicit spec: "instead of measuring the distance to the cursor
  location, we are measuring the distance to the point i have
  annotated for each type." `mouseFlickInteractionPointWorld(purpose)`
  (purpose ∈ 'click'/'hold'/'cut'/'drag') transforms
  `MOUSE_FLICK_INTERACTION_POINTS`'s own normalized (0-1) point through
  the SAME translate-rotate-wrist-anchor math `render()`'s own draw
  call uses for the wrist anchor itself -- generalized to an arbitrary
  point in that same normalized image space, not just the anchor.
  **Always call `mouseFlickInteractionPos(realX, realY, purpose)`, the
  fallback-safe wrapper, at a new call site -- never
  `mouseFlickInteractionPointWorld()` directly** -- it returns `null`
  whenever FLICK MOUSE isn't active/visible or the needed frame/point
  data isn't loaded yet, and every one of the 4 existing call sites
  relies on the wrapper's fallback to the real cursor position for
  that case; using the raw function directly would silently break
  interaction targeting the moment FLICK MOUSE is disabled.
  Recomputed FRESH at the actual decision moment at every call site
  (never reusing a frozen press-time hit) -- matches Click And Hold
  Distance's own pre-existing "sample at release, not press"
  precedent (see that gotcha above), now extended to all 4. The
  Drag Rope arm check computes its own NEW local hit rather than
  overwriting the shared `downInfo.hit` -- Rope Growth On Rope Hold's
  own, unrelated distance gate still reads that shared value
  unaffected; don't fold the 2 back together. `'tickle'` is NOT one of
  the 4 purposes -- Tickle's own annotated points are reused as the
  `'click'`/`'hold'` purposes' own data (`MOUSE_FLICK_INTERACTION_
  POINTS.default`), a deliberate remapping per the spec, not a typo.
- Drag's own frame-48 annotated point drives a SEPARATE feature,
  `mouseFlickDragAlignmentOffset(t)` (2026-09-12) -- NOT a distance
  gate, a render-time correction. Per explicit spec: "as the Drag
  animation sequence runs, the position of the actual frames itself
  will also be displaced. At the end of the sequence, the point of
  frame 48 will align with the point of frame 01." Computes the
  WORLD-SPACE difference between frame 1's and frame 48's own
  annotated point (both evaluated via the entity's CURRENT live
  transform) and returns a corrective offset growing from `{0,0}` at
  t=0 to exactly cancel that difference at t=1, applied as an
  ADDITIONAL translate on top of `mfEntityX/Y` specifically while
  `mfDragSequenceActive` is true (either half of the Drag sequence --
  forward play, or its `dragRelease` reverse). `t = mfDragCyclePos /
  47` -- if the Drag sequence's own frame count ever changes from 48,
  this divisor must change to match (`lastIndex`, not the frame
  count itself), or t=1 will never actually align at the real last
  frame. Verified bit-for-bit against an independent hand computation
  (both the transform itself and the t=1 convergence identity) -- see
  CHANGELOG.txt for the numbers.
- **A 4th, bidirectional occurrence of this project's cross-session
  commit-attribution mixup (2026-09-12):** the interaction-points
  feature above landed via a DIFFERENT concurrent session's own commit
  (`3682673`, titled as a debug-hook removal but actually containing
  175 insertions), while that SAME session's own SNAP held-phase fix
  landed via THIS session's own front-pinky-sync commit (`1c47871`) --
  confirmed both directions via `git show <hash> | grep` before
  trusting either, no content lost either way. Same root cause as
  every prior occurrence: `git add <file>` stages the whole file's
  CURRENT content, not a diff scoped to one session's own edits, so
  whichever of 2 concurrent sessions commits first sweeps in the
  other's uncommitted work too, regardless of that commit's own
  message. Before trusting a commit's message describes its full
  scope, check `git show <hash> --stat` against what the message
  claims -- a mismatch (as `3682673`'s "cleanup only, no functional
  changes" vs. its real 175 insertions) is the tell.
- **Circle hold-to-grow's own trigger zone (`isNearCircleCenterForGrow`,
  2026-09-12) is DELIBERATELY separate from `isOnCircle()`, not a
  rename of it.** Per explicit correction: "I think its currently some
  boundary based thing. Instead, i want you to do it as simply a
  proximity measurement from the cursor measurement point to the
  center of the circle. The Click and Hold distance will determine
  that threshold." `isOnCircle()`'s own radius
  (`circleExclusionRadius()`) is EXPLICITLY, intentionally shared with
  `cutRopeAt()`'s Circle Cut Distance floor (see that function's own
  comment: "whatever counts as 'on the circle' for growing must also
  always count as 'too close to cut'") -- redefining `isOnCircle()`
  itself to satisfy this request would have silently changed cut
  behavior too, which was never asked for. `isNearCircleCenterForGrow()`
  reuses the EXISTING `cfg.holdDistance` (Click And Hold Distance)
  slider as its threshold, per explicit instruction -- not a new
  slider, don't add one thinking it's missing. Used at BOTH
  `onPointerDown` call sites that used to call `isOnCircle()` for this
  purpose (the circle-branch gate, and `startedInCircle`) -- **"Grow
  always trumps Charge and Drag within this distance" requires NO
  separate priority-arbitration code**, since `startedInCircle`
  already unconditionally gates OUT both the charging and Drag Rope
  arm branches (see their own holdTimer callbacks); swapping the SAME
  underlying zone definition in both places is sufficient on its own.
  If a future change ever needs `isOnCircle()`'s own radius to
  diverge further from this zone (or vice versa), keep them as 2
  distinct functions -- don't collapse them back into one just because
  they happen to look similar.
- `dragOverridesGrowOnRopeHold` (2026-09-12, default `true`) governs
  ONLY the ROPE-hold-triggered "Grow Rope On Rope Hold" checkbox's own
  interaction with Drag Rope arming (both can qualify for the same
  hold outside the circle's own zone) -- it has NO effect on the
  circle's own hold-to-grow (`isNearCircleCenterForGrow`, the gotcha
  above), which always wins unconditionally per a separate, later
  explicit request. Checked via `wouldAlsoGrow` inside the SAME
  holdTimer callback that decides whether Drag Rope arms, reusing
  `hit` (the shared, press-time-frozen rope hit already used for
  charging/rope-growth's own gate) rather than the substitute-point
  `dragHit`, so both this check and Grow Rope On Rope Hold's own
  independent timer agree on the identical press-time data -- don't
  swap in `dragHit` here, that would let the 2 conditions disagree
  about whether "this same hold" actually qualifies for both.
- `cfg.dragMaxDistance` (2026-09-12, default = its own slider max, a
  deliberate no-op) is an ADDITIONAL cap layered on top of the
  pre-existing anchor-relative rest-length clamp
  (`mainRope.segLen * dragPinIndex`) via `Math.min(...)` in `update()`'s
  own drag-pin code -- never a replacement. That natural clamp is
  itself a previously-shipped, explicitly-requested design ("the
  distance the rope can be dragged is determined by the length of the
  rope between the drag point and the rope start") -- don't delete or
  bypass it when touching this slider; the 2 are meant to combine,
  with this slider only ever pulling the effective max distance IN,
  never letting it exceed what the rope's own real geometry allows.
- **A user report that a feature "can't be triggered at all" may be a
  STALE BROWSER CACHE, not a code bug** -- confirmed twice in one
  session (2026-09-12): a `?dev=1` reload against this project's own
  local dev server intermittently served a cached `index.html` missing
  a debug hook added moments earlier (`document.readyState:'complete'`
  immediately, with none of the just-added code present); only a
  cache-busting query param (`&cb=<anything>`) forced a genuinely fresh
  load. Before concluding a reported-broken interaction is a real code
  bug, especially one that was recently changed, verify via BOTH (a) a
  cache-busted reload (or an equivalent fresh fetch) and (b) if
  possible, the LIVE DEPLOYED site directly (check its served HTML for
  markers of the recent change, e.g. a new function/config-key name,
  to rule out a stale deployment too) before trusting a negative
  result as proof nothing is wrong on the user's end.
- **A real, shipped, silent bug class this project has now hit once:
  a feature's own draw/logic block gets accidentally left INSIDE
  another feature's `if (DEV_MODE){...}` braces after being written or
  edited nearby.** FLICK MOUSE's entire `render()` draw block sat
  nested inside the block opened for FLICK ANIMATION 1/2/3 (correctly,
  deliberately dev-only) -- so `mouseFlickActive()`'s own already-
  correct `cfg.mouseFlickEnabledLiveMode` check for a non-dev visitor
  could never even be REACHED, silently defeating Live Mode for every
  real player since the feature shipped (2026-09-12, reported directly
  against the live production URL: "still doesnt show the cursor
  animation frames, even when turned on. It shows up in .../?dev=1").
  The code inside was itself correct -- this was purely a BRACE-SCOPING
  mistake, invisible to a normal read-through since the logic "looked
  right" in isolation; only tracing the actual `{`/`}` nesting line by
  line (or testing the real non-dev URL directly) revealed it. **When
  adding new code physically near an existing `if (DEV_MODE)` block in
  `render()`/`update()`, always verify by brace-counting (or an
  editor's own bracket-match) whether the new code is actually INSIDE
  or OUTSIDE that block before assuming its own `if` conditions alone
  will govern its visibility** -- a block's own gate only applies if
  the code is actually inside its braces, and this file's `render()`
  is long and deeply nested enough that visual indentation alone isn't
  reliable evidence either way (the drift here was invisible in a
  normal scroll-through). Audited ALL 23 `DEV_MODE` occurrences in this
  file the same day and found no OTHER instance of this mistake -- see
  CHANGELOG.txt for the full account of what was checked.
- **`growing` is a single shared boolean flag used by BOTH the player's
  own hold-to-grow gesture AND the intro sequence's own scripted regrow
  (`updateIntro()`'s 'growing' phase, after boot or any full-rope
  detach) -- never reset it unconditionally on a release/cancel just
  because "it's harmless if never armed."** That assumption was wrong
  and caused a real, reported, PERMANENT stuck bug (2026-09-13: "Hold
  to grow within the circle doesnt work, neither does hold to grow on
  the rope itself... I am unable to cut the rope fully" -- flicks kept
  working, matching how this bug actually manifests). `onPointerUp`
  used to reset `growing = false` on every rope-mode or circle-mode
  release, including a plain tap/cut/drag that never armed anything --
  DURING the intro's own regrow, that stomped the flag mid-sequence,
  permanently freezing `mainRope.totalLength` short of
  `introTargetLengthPx` (introPhase can then never reach 'done', so
  everything gated on it -- hold-to-grow arming, the circle's own
  double-click-to-fully-cut -- silently fails forever). Fixed via
  `downInfo.armedGrowth`, set ONLY inside the 2 real hold-to-grow timer
  callbacks (both already gated on `introPhase === 'done'`, so this can
  never fire during a regrow) -- all 3 release sites (onPointerUp's
  circle branch, onPointerUp's unconditional rope-mode line,
  pointercancel) now only reset `growing` when THIS press is the one
  that armed it. Per explicit, separate follow-up request, an
  interrupting cut/flick/drag during the intro's own regrow must NOT
  stop it -- it should keep growing to the default length underneath
  the interruption -- which is exactly what this fix produces as a side
  effect (nothing resets the shared flag except a genuine hold-to-grow
  session's own release). **Any FUTURE code that reads or writes
  `growing` must account for the intro sequence potentially owning it
  concurrently** -- don't add a new unconditional reset site.
- **Drag Rope's arm-time code must use `hit` (the ORIGINAL press's own
  hit-test, frozen into `downInfo` at pointerdown) to decide WHICH rope
  point gets grabbed -- never `dragHit` (the FLICK MOUSE annotated
  'drag' interaction point's OWN separate hit-test), which exists
  ONLY to gate Drag Rope Hold Distance.** Real, reported bug
  (2026-09-13: "allow me to drag the rope by the end of the endcap as
  well. right now it seems to default to the last segment joint as the
  last draggable point") -- confirmed live that pressing exactly on the
  tip (`nearestPointOnRope` resolving index 36 of 37 points) still
  armed `dragIndex` 25, because the code read `dragHit.index` instead
  of `hit.index`. The annotated point sits at a fixed anatomical spot
  on the hand sprite's own artwork and rarely lines up with the rope's
  true tip -- fine for a distance gate, wrong for choosing the grabbed
  point. The comment directly above this code has said "anchored by
  the point on the rope that is clicked" since 2026-09-12; the code had
  silently stopped doing that when the interaction-points substitution
  landed the same day and this went unnoticed until now.
- **FLICK MOUSE ("Cursor Animation" going forward -- see below) has 2
  independent drag-time overrides, both keyed off the SAME live drag
  anchor (`mouseFlickDragAnchorWorld()`, 2026-09-13), and both must stay
  in sync if either changes:** the entity's own POSITION-lerp target
  (`mfEntityX/Y`'s target in `update()`) and `mouseFlickTargetPosition()`'s
  own ROTATION target (which overrides `cfg.mouseFlickTargetMode`,
  including 'center', while dragging). Per explicit request: "if i move
  the cursor too far away while dragging, the cursor animation will
  stay anchored to the drag point... Only when i release of the drag
  does the cursor animation return to the cursors real position" plus,
  separately, "while dragging, the cursor target mode should just point
  at the drag point on the rope." Deliberately the LIVE dragged-point
  position, NOT the FROZEN `downInfo.dragAngleRefX/Y` direction-bucket
  reference (a completely different mechanism, frozen for its own
  documented mathematical reason -- see that field's own gotcha) --
  both of these new overrides are about visually FOLLOWING the drag
  point as it swings, not about a stable angle reference.
- **Rope growth (the `growing` flag, whatever is driving it) is paused
  -- not stopped, not reset -- for the duration of an active Drag Rope
  hold** (2026-09-13, per explicit request: "while im dragging, the
  rope should not be growing"). Only `growRope()`'s own call is skipped
  while `downInfo.mode==='rope' && downInfo.dragging`; the `growing`
  flag itself is untouched, so whatever was growing (a hold-to-grow
  session, or the intro's own regrow -- see that gotcha above) resumes
  automatically the instant the drag ends, with no separate resume code
  needed anywhere.
- **The dev panel group formerly titled "FLICK MOUSE" is now titled
  "CURSOR ANIMATION"** (2026-09-13, per explicit request: "from now on
  dont call the cursor animations FLick mouse, call it 'Cursor
  Animation'"). Only the user-facing panel label was renamed --
  internal code identifiers (`mf*` variables, `MOUSE_FLICK_*`
  constants/functions, and every comment referencing "FLICK MOUSE")
  were deliberately left alone as a separate, much larger, purely
  cosmetic rename that wasn't part of this request's own scope. Use
  "Cursor Animation" in any NEW user-facing text or communication about
  this feature; existing internal naming is not itself wrong, just an
  intentionally out-of-scope cleanup for another time.
- **Superseded the same day (2026-09-13) by a fully general mechanism --
  see the "Dev-panel behavior" section above and this file's own later
  entry on the per-setting/per-group independence checkboxes.** This
  entry originally documented a hardcoded `DEVICE_SPECIFIC_KEYS` array
  (3 keys) and `splitValuesForSnapshot()`/`applyDeviceSpecificValues()`
  -- none of those identifiers exist in `index.html` anymore, replaced by
  `deviceIndependence`/`isKeyIndependent()`/`resolveValuesForTab()`/
  `buildValuesByDeviceForSave()`. Left here, corrected rather than
  deleted, since the original bug/request context (and the reasoning for
  why per-device values needed a real storage mechanism at all, mirroring
  panelGeometry) is still accurate background for the newer system.
- **Per-setting/per-group "Independent from Desktop" checkboxes
  (Mobile/Landscape only) -- see the "Dev-panel behavior" section above
  for the full mechanism; this covers implementation gotchas found while
  building it.** The group-level checkbox has NO persisted state of its
  own on purpose -- `isKeyIndependent()`/`resolveValuesForTab()` (which
  MUST also work correctly for a real, non-dev visitor with zero
  dev-panel DOM) only ever consult `deviceIndependence[tab].settings`,
  never a group map. The group checkbox is a live-DOM "master checkbox"
  instead (`buildGroupIndependenceCheckbox()`): checking/unchecking it
  walks its CURRENT `.dp-group-body` children (rows AND nested
  subgroups) and toggles each one's own individual checkbox to match,
  dispatching a real `change` event so each row's own handler still runs
  (writing `deviceIndependence[tab].settings[key]` itself) -- this is
  what makes it correct for a user-created custom group or a
  drag-reordered row, neither of which a STATIC group-membership lookup
  (DEV_GROUPS-based) could have handled. Its own checked/indeterminate
  display is likewise always COMPUTED from children
  (`refreshGroupIndependenceStates()`, standard tri-state convention:
  all children checked -> checked, all unchecked -> unchecked, mixed ->
  indeterminate), deepest groups resynced first so a parent reflects
  already-current children. **This recompute must run from 2 places, not
  just tab-switch/boot** -- a real bug caught during verification:
  unchecking ONE child of an otherwise-fully-checked group left the
  parent's own checkbox showing plain `checked` (should be
  `indeterminate`) until `refreshGroupIndependenceStates()` was also
  called from the individual row checkbox's own `change` handler, not
  only from `refreshIndependenceUI()` (tab-switch/boot). If a NEW way to
  toggle a row's own independence is ever added, it needs this same call
  too, or ancestor groups will show stale checked/indeterminate state
  until the next tab switch.
- **A live edit's SAVE destination (Desktop's own pool vs. the active
  tab's own pool) is decided ONCE, at Save/Copy time
  (`buildValuesByDeviceForSave()`), never at the point of the edit
  itself.** Every control type's own live-edit handler (slider
  input/change, color input, checkbox change, dropdown change, gradient
  stop drag/color-pick) still just does `cfg[key] = value` completely
  unchanged -- deliberately NOT rewired to be independence-aware, since
  there are ~6 scattered write sites across `buildRow()`/`buildRow()`'s
  gradient branch and touching all of them individually would be both
  more code and more risk for the identical net result. Don't add
  independence-awareness to any NEW control's own live-edit handler --
  route it through the existing single choke point instead.
- **`resetSettings()` must write a normalized `valuesByDevice` back onto
  `lastLoadedSnapshot` itself, not just use a local variable, when
  loading an old-format snapshot (flat `values`, no `valuesByDevice`
  yet).** Real bug, caught during verification, not just a theoretical
  edge case: without this, the very first Save/Copy after loading an
  old-format file would call `buildValuesByDeviceForSave()`, which reads
  `lastLoadedSnapshot.valuesByDevice` to preserve every tab's own prior
  values -- finding it `undefined` (the raw old-format snapshot has no
  such field), it would silently start Desktop's own pool from an EMPTY
  object, discarding every real Desktop setting that wasn't touched
  during that particular editing session. Confirmed live: before this
  fix, `valuesByDevice.desktop.ropeThickness` came back `undefined`
  after a save built from a freshly-loaded old-format file; after
  writing the normalized shape onto `lastLoadedSnapshot.valuesByDevice`
  at load time, it correctly preserved the real prior value.
- **A group's own title span (`createGroupElement()`) has its own
  dedicated class, `dp-group-title` -- never re-select it by DOM
  position (`:last-child`, `:first-child` etc.).** Real, reported,
  shipped regression (2026-09-13: "my settings groups in desktop got
  mressed up in terms of nesting and naming etc"): `applyDevTextOverrides()`
  used to find the title via `span:last-child`, which broke the INSTANT
  the independence checkbox (`buildGroupIndependenceCheckbox()`, this
  same session's own earlier feature) got appended to the header AFTER
  it -- every previously-renamed custom group (Text Edit Mode) silently
  reverted to displaying its own raw internal key instead, with no
  error and nothing to notice until actually comparing against what had
  been renamed. Root-caused by checking the actual last git-tracked
  settings save directly (per the user's own explicit instruction, "chec
  the lastgit save") rather than assuming -- the saved `order`/
  `textOverrides` data itself was fine; only the DISPLAY of it was
  broken. **Any FUTURE child appended to `.dp-group-header` must not
  assume the title span occupies any particular position** -- select it
  by `.dp-group-title` instead, same as this fix now does.
- **`cfg.holdDistance` (Click And Hold Distance) is dual-purposed —
  it's BOTH the circle's own hold-to-grow trigger radius
  (`isNearCircleCenterForGrow()`) AND the charged-punch release-
  distance gate — and the two can drift out of sync purely through
  normal tuning of one of them, silently shrinking the OTHER.** Real,
  reported bug (2026-09-14: "right now Drag seems to prioritize over
  Click to hold grow in the circle"). The CODE itself was correct and
  unchanged — `isNearCircleCenterForGrow()`'s dedicated circle branch
  in `onPointerDown` still unconditionally wins over Drag Rope/
  charging for any press that qualifies (see the `isNearCircleCenterForGrow`
  gotcha above; this coupling is deliberate, explicit-request design,
  not a bug to "fix" by decoupling). The bug was in the LIVE SAVED
  DATA: `data/processed/dev-panel-settings.json` had `holdDistance:
  7.5` against `circleSize: 20` -- meaning the actual programmatic
  grow-trigger zone covered only the innermost ~37% of the VISIBLE
  circle's radius (7.5 of 20). A press anywhere in the outer ~63% of
  the visible circle (by radius) fell through to the ordinary rope
  hit-test instead, where `dragRopeHoldDistance` (9, also from the
  live save) exceeded `holdDistance` (7.5) -- creating a real ring
  (roughly 7.5-9%vmin from center) where a press that LOOKED like it
  was safely inside the circle could arm Drag Rope instead of growing,
  exactly matching the report. `holdDistance` had almost certainly
  been independently tuned down at some point for charge-release feel
  (its other, unrelated purpose) without anyone noticing the side
  effect on the circle's own grow coverage -- the two code defaults
  (`circleSize` 21.5, `holdDistance` 22) are close enough that this
  gap never showed up in the DEFAULTS, only after independent live
  tuning drifted them apart. Fixed as a pure DATA change (`holdDistance:
  7.5 -> 20.5`, restoring the same "holdDistance slightly exceeds
  circleSize" relationship the code defaults already have, scaled to
  the live `circleSize` of 20) -- no code touched. **Before assuming a
  reported "X seems to override Y" priority bug is a code/logic
  problem, check whether the 2 features share a config value (or one's
  threshold is smaller than the other's) in the LIVE saved settings
  file first** -- same "check the actual saved value" precedent as the
  `dragRopeEnabled` gotcha above, now applied to a value that's
  nonzero and therefore easy to assume is "obviously fine" without
  actually comparing it against the other value it's implicitly
  supposed to stay larger than.
- **Dragging the rope by its own TIP (the last point, `dragIndex ===
  points.length - 1`) fights `positionGrowingTip()` for control of that
  same point whenever `mainRope.tipGrowLen < mainRope.segLen` --
  `positionGrowingTip()` runs unconditionally AFTER `integrateChain()`
  whenever `hasPartialTip` is true, with zero awareness of dragging, so
  it silently OVERWRITES whatever the drag code had just set the tip's
  position to, every single frame.** Real, reported bug (2026-09-14:
  "some specific cases where i try to drag the rope by the endcap, it
  fails and snaps me to the last segment end point... I am locked in
  position like before") -- `tipGrowLen` stays below `segLen` for a
  few frames after ANY growth session even though `growRope()` itself
  is correctly paused during a drag (see that gotcha above), so
  grabbing the tip specifically DURING or shortly after growth hits
  this every time, while grabbing an interior point, or grabbing the
  tip once growth has fully settled, never does -- exactly matching
  "some specific cases," not "every time." "Snaps to the last segment
  end point" is `positionGrowingTip()` placing the tip near `dir.prev`
  (the second-to-last point) while `tipGrowLen` is still small; "locked
  in position" is that override re-running every frame regardless of
  where the cursor moves, since it never reads the drag target at all.
  Fixed by extending the SAME exclusion `hasPartialTip` already applies
  for `ropeAttractionActive` (per that mechanism's own comment: "it
  re-enters the normal constraint solve... and positionGrowingTip() is
  skipped entirely... Reverts... the instant attraction ends") to cover
  dragging the tip too -- `draggingTip = downInfo && downInfo.mode ===
  'rope' && downInfo.dragging && downInfo.dragIndex === mainRope.points.length
  - 1`, folded into `hasPartialTip`'s own definition. While the tip is
  being dragged, the last segment re-enters the normal distance/bend
  solve (the tip itself stays pinned via the existing generic
  `pinnedIndex` mechanism, unaffected), and `positionGrowingTip()` is
  skipped -- reverting the instant the drag ends, so an in-progress
  hold-to-grow resumes exactly where it left off, same promise as the
  `ropeAttractionActive` case. Verified via a Node-level simulation of
  the exact boolean expression (not a live browser test -- this
  environment's page-boot stall recurred, unpredictably, across
  multiple fresh navigations the same session, including one that DID
  fully boot and then failed again on the very next reload) across 6
  scenarios (no drag, dragging an interior point, dragging the tip
  mid-growth, dragging the tip post-growth, `ropeAttractionActive`
  simultaneously true, and drag-just-ended) -- all 6 produced the
  intended `hasPartialTip`/`draggingTip` values. **If a FUTURE gesture
  ever kinematically pins the tip point directly (the same way Drag
  Rope and Rope Attraction both already do), it needs this same
  exclusion folded into `hasPartialTip` too** -- any code that sets
  `mainRope.points[points.length-1].x/y` directly on a given frame
  will silently lose that write to `positionGrowingTip()` if
  `hasPartialTip` isn't also made aware of it.
- **Cursor Animation's drag-anchor pinning (2026-09-14) is a dead-zone/
  "leash" clamp, not a rigid 1:1 pin -- per explicit follow-up request:
  "instead [of] exactly anchored directly to that point... a circular
  tolerance threshold around the drag point with the diameter of the
  rope thickness. So as i drag the rope around, the cursor animation
  frame can shift away from the drag point by the distance of half the
  rope thickness."** Built on top of `mouseFlickDragEntityOriginForAnchor()`
  without modifying that function at all -- it already solves "what
  origin puts the annotated point at an arbitrary world position," so
  the tolerance logic just computes a CLAMPED target position and feeds
  that in instead of the raw anchor. Each frame: read where the
  annotated point ACTUALLY is right now via `mouseFlickDragPointWorld()`
  (last frame's transform, read BEFORE this frame's own mfEntityX/Y
  reassignment); if that's already within `cfg.ropeThickness/2 *
  cursorAnimationDragToleranceMult` of the live anchor, hold still
  (don't re-snap); otherwise pull the target back to exactly the
  tolerance radius's own boundary along the line from anchor to current
  position (never snap all the way to the anchor -- the same clamp a
  follow-camera dead zone uses). `cursorAnimationDragToleranceMult` (def
  1, CURSOR ANIMATION group) scales the literal spec'd radius rather
  than replacing it with a free-standing constant, per SS12n. Verified
  via a Node-level simulation of the exact clamp math (4 cases: exactly
  at anchor, inside tolerance, outside tolerance -- confirmed clamped to
  precisely the radius along the correct line, and no-prior-data
  fallback) -- not a live browser test, same recurring page-boot-stall
  environment issue as the drag-tip fix above (confirmed still present
  on a fresh attempt the same session). **If this dead-zone target ever
  needs to feed anything OTHER than `mouseFlickDragEntityOriginForAnchor()`
  in the future, compute it once and reuse it -- don't re-derive the
  clamp twice; `mfDragTargetWorld` is already the single source of
  truth for "where the sprite should actually anchor this frame."**
- **Corrected 2026-09-14 (same day, round 2) -- the drag-anchor
  tolerance's own MECHANISM was wrong, not just its parameters.** Per
  direct follow-up: "you got the drag point anchor tolerance almost
  correct but not quite... the cursor animation frame should be the
  one that moves until it hits the drag point tolerance boundary" --
  i.e. NOT what the round-1 version built. The circle-centered-on-the-
  drag-point geometry was already right; the bug was that round 1 held
  the sprite PERFECTLY STILL while inside tolerance and, the instant it
  would exceed the radius, TELEPORTED it to the boundary in ONE frame
  (recomputed fresh from that frame's live anchor every frame, with no
  memory of the sprite's own prior position feeding into the new
  target's MAGNITUDE, only its direction) -- with a continuously-moving
  anchor during a real drag, this reads as the sprite rigidly welded at
  a fixed radius-sized offset the instant it first goes taut, never
  visibly "moving toward" anything, which is what read as backwards.
  Fixed by adding a genuine per-frame EASE (new `cursorAnimationDragCatchUpSmoothing`
  slider, def 0.3, via the same `mouseFlickExpSmoothFactor()` helper
  every other FLICK MOUSE smoothing control already uses) from the
  sprite's own current position toward the live anchor, THEN clamping
  that eased result to never exceed the tolerance radius -- deliberately
  a SEPARATE dedicated smoothing constant, not a reuse of
  `mouseFlickPositionSmoothing` (tuned to 1/instant specifically for
  the pre-existing "snap exactly to the anchor" behavior; reusing it
  here would silently make this whole feature a no-op at its own
  default). Verified via a Node-level simulation of a steady fast drag
  (300px/s anchor, 4px radius, 0.3 smoothing): the sprite continuously
  trails at exactly the boundary distance every sampled frame (genuine
  ongoing motion, never a static offset) and fully re-converges to 0
  distance within ~30 frames once the anchor stops -- confirming both
  "moves" and "hits the boundary" as continuous, not a snap.
- **Drag Rope by the endcap's own visual TIP (as opposed to the last
  real physics point, "the endcap start" per direct user wording) is a
  render-only extension problem, not something `nearestPointOnRope()`
  or the arm-time index-selection logic could ever solve on their own
  -- the endcap graphic is purely decorative, drawn a fixed
  `endcapExtensionPx()` distance PAST `mainRope.points[length-1]`, with
  no simulated point actually located there for a hit-test to find.**
  Real, reported, persistent request (2026-09-14, 2nd report after the
  first fix only addressed a DIFFERENT bug -- the tip-drag LOCKUP, not
  this): "i still cant drag the rope by the endcap tip... It still
  defaults to the endcap start, aka, the end point of the last
  segment." Fixed with an offset correction in the SAME spirit as
  `positionGrowingTip()`'s/`mouseFlickDragAlignmentOffset()`'s own
  "correct via an offset, don't add a new simulated point" pattern:
  only while `dragPinIndex` is exactly `mainRope.points.length - 1`,
  the raw cursor target is pulled BACKWARD by `endcapExtensionPx()`
  along the direction from the point's own upstream neighbor toward
  the cursor, BEFORE the existing anchor-relative hardLimit clamp runs
  -- so the underlying physics point ends up positioned such that the
  endcap's own fixed-length extension beyond it (drawn in whatever
  direction that segment currently points) reaches the cursor, not
  just the neck. Clamped so the pull can never invert past the
  neighbor point (`Math.min(extension, rdist - 1)`). `endcapExtensionPx()`
  itself already returns 0 for `endcapDesign: 'none'`, so this is a
  natural no-op with no endcap selected -- no separate guard needed.
  Verified via a Node-level simulation of the exact pull-back math (4
  cases: normal pull, a too-close target correctly clamped rather than
  inverting, a diagonal direction preserving proportional x/y, and the
  zero-extension no-op) plus a live integration check (armed a real
  drag on the tip via a temporary debug hook, confirmed the point moved
  a real, sensibly-directed distance with zero console errors) -- full
  live confirmation of the exact offset magnitude was blocked by the
  rope being only 2 points long on a fresh boot (maxDragDist's own
  pre-existing clamp dominated at that length) combined with this
  session's now-repeated rAF-tick-freeze environment issue (tick
  counter confirmed 0 new ticks even immediately after a wake-click).
- **Corrected 2026-09-14 (3rd pass on this feature) -- the "give" in
  Drag Anchor Tolerance belongs to the ROPE POINT, not the Cursor
  Animation sprite; rounds 1 and 2 both had this backwards.** Per
  direct clarification: "I actually dont want it to continuously chase
  the drag point... the frame interaction point cant ever reach the
  radius boundary since it always moves to aligning the 2 points. What
  i want is for the cursor frame to be able to freely move within the
  radius boundary. When it hits the boundary and further is when the
  rope gets triggered to get dragged." Both earlier designs (dead-zone-
  then-teleport, then an eased chase -- see the 2 entries directly
  below, both now superseded) put the tolerance logic on the SPRITE
  while letting the ROPE's own drag point move completely freely with
  the raw cursor every frame -- which is why the sprite could never
  actually separate by the full radius: any real anchor movement
  immediately pulled the sprite back toward it, so the gap never grew,
  it only ever shrank. The 3rd design inverts which side is "elastic":
  - **The ROPE's own per-frame drag target (Drag Anchor Leash,
    `update()`'s drag-pin block)** now stays FROZEN at wherever it
    already sits for as long as the raw cursor (`mouseX`/`mouseY`) is
    within `dragLeashRadius` (`vmin(cfg.ropeThickness) * 0.5 *
    cfg.cursorAnimationDragToleranceMult` -- same formula as before,
    just now gating the rope instead of the sprite) of it, and only
    starts moving once the cursor would exceed that radius -- pulled
    along just enough to hold the gap at EXACTLY the radius (a taut
    leash), never all the way to the cursor. This runs BEFORE the
    endcap pull-back and the pre-existing anchor-relative `hardLimit`
    clamp, both otherwise unchanged.
  - **The Cursor Animation sprite** no longer mirrors the rope point at
    all while dragging -- it now freely tracks the raw cursor directly
    (no easing, same "must SNAP, never lerp" rule as always), clamped
    to the SAME `hardLimit` the rope's own target uses (so it still
    can't fly arbitrarily far from the rope on a huge drag, preserving
    the original 2026-09-13 "don't visually separate" intent for THAT,
    much larger scale). This clamped-but-otherwise-raw cursor position
    is computed once in the drag-pin block and stashed on
    `mainRope.dragCursorClamped` for the FLICK MOUSE block (which runs
    later in the same `update()` call) to read.
  - Rotation is UNCHANGED by any of this -- still points from the raw
    cursor toward the rope's own actual drag point
    (`mouseFlickDragAnchorWorld()`), which is why that function call
    (renamed in intent but not in code -- `mfDragAnchor`) is still
    resolved in the FLICK MOUSE block even though position no longer
    reads its VALUE, only uses it as a "currently dragging" gate.
  The now-unused `cursorAnimationDragCatchUpSmoothing` slider (round
  2's own dedicated easing control) was removed outright rather than
  left dead -- an inert slider that visibly does nothing is worse than
  no slider. Verified via a Node-level simulation of the leash itself
  (3 same-frame small-wiggle cases confirmed zero movement; a 2-frame
  large-jump trace confirmed the rope lands and then stays at EXACTLY
  the radius distance behind a continuously-moving cursor) -- not a
  live browser test, blocked again by this session's own recurring
  dev-server page-boot stall.
- **Drag by the endcap's own visual TIP -- corrected 2026-09-14 (2nd
  pass), the original pull-back formula degenerated for realistic drag
  distances.** The 1st version (`pull = Math.min(extension, rdist -
  1)`) pulled the target to within 1px of the upstream neighbor
  (prevPt) for ANY cursor position under roughly `extension` px from
  it -- and `extension` is easily tens of px (measured live at
  ~68px for one real configuration), comparable to or larger than a
  typical short drag distance. Reported directly: "still snaps to the
  next segment's head, instead of the endcap." Replaced with a smooth
  blend, `pull = extension * rdist / (rdist + extension)` -- provably
  always `< rdist` (so a separate invert-guard is no longer needed at
  all), scales continuously rather than collapsing onto prevPt for a
  short drag (e.g. only 12.8% of the full extension pulled at `rdist =
  extension/6.8`, vs. an near-total collapse before), and approaches
  the full extension for a comfortably-long drag (~91% of it at `rdist
  = 10x extension`) -- so the endcap's own rendered tip lands
  close to the cursor for any realistic drag distance and degrades
  gracefully, rather than snapping, for a very short one. This remains
  a genuine geometric approximation, not an exact solve (the true
  tangent direction at the physics point's own eventual position isn't
  known in advance -- the formula uses the direction from prevPt to
  the RAW target as a stand-in, same simplification as the 1st
  version) -- if a future report says the endcap still visibly
  overshoots or undershoots the cursor by a wide margin on a normal
  (not especially short) drag, this approximation -- not the general
  approach -- is the first place to revisit.
- **Corrected 2026-09-14 (4th pass on this feature) -- Drag Pickup's
  own "which side eases" question needed a 2nd inversion, separate from
  the leash inversion directly above.** Real, reported bug: "my cursor
  frame jumps backwards about the length of itself, then the rope drag
  point moves towards the cursor frame. Thats incorrect. Firstly the
  jump shouldnt happen at all. 2ndly, the cursor frame should move
  towards the drag point to initiate the drag. The rope should not be
  moved until the cursor frame has reached the drag point." Two
  distinct bugs, fixed together:
  1. **The jump** -- the instant a drag armed, the sprite's position
     formula switched from "wrist tracks the raw cursor" (normal,
     non-drag logic) to "wrist positioned so the ANNOTATED point (a
     DIFFERENT spot on the artwork, offset from the wrist) lands on the
     cursor" -- an instant discontinuity equal to that wrist-to-
     annotated-point offset, roughly the sprite's own on-screen length,
     matching the report exactly. Root cause: the 3rd-pass leash
     redesign (directly above) made the sprite jump straight to
     `mainRope.dragCursorClamped` the moment dragging armed, with no
     transition from wherever it actually was a frame earlier.
  2. **Sequencing** -- even fixing the jump alone would still have left
     the ROPE moving immediately (following the cursor via the Leash)
     while the sprite was still easing toward the grab point, which
     is backwards from what was asked.
  Fixed by giving the SPRITE its own pickup ease (reusing the SAME
  `pickupEasedT`/`Drag Pickup Duration` timer the rope's OWN pickup
  used to use) and INVERTING what happens on the rope's side during
  that same window: instead of the rope easing from rest toward the
  target (the pre-2026-09-14-4th-pass design), the rope point now stays
  COMPLETELY FROZEN (dragPoint.x/y never reassigned at all -- not even
  a small step) for as long as `mainRope.dragPickupEasedT < 1`, while
  the sprite's own annotated point eases from
  `downInfo.dragSpritePickupStartX/Y` (captured in onPointerDown, the
  sprite's REAL world position at the exact instant dragging armed --
  continuous by construction, since that's literally where the sprite
  already was) toward the rope's own (frozen) point. Once
  `pickupEasedT` reaches 1, both switch to their round-3 behavior
  unchanged: rope follows the Leash, sprite freely tracks the raw
  cursor via `dragCursorClamped`. Verified via a Node-level simulation
  of the full sequence (8-frame trace: sprite interpolates continuously
  from its own start position at t=0 with zero jump, rope confirmed at
  the SAME frozen position through 4 consecutive frames during pickup,
  then -- combined with the Leash from the entry above -- the rope's
  post-pickup catch-up is itself bounded to the leash radius rather
  than snapping instantly to wherever the cursor ended up during the
  pickup window) -- not a live browser test, blocked again by the same
  recurring dev-server page-boot stall as every other fix in this
  feature's history. `downInfo.dragPickupStartX/Y` (the ROPE's own
  pre-drag position, captured for the old design's own easing) was
  removed outright from `onPointerDown` rather than left as dead data
  -- only `dragPickupStartTime` (the shared timer) and the NEW
  `dragSpritePickupStartX/Y` (the sprite's own start) are captured
  there now.
- **Cursor Animation's interaction-point/wrist-anchor data was
  substantially restructured 2026-09-14, per a fresh annotated data
  drop with explicit per-purpose mapping instructions.** Full account,
  since several pieces moved at once:
  - **Drag now has 2 distinct points doing 2 distinct jobs.** Frame 1's
    own point (`MOUSE_FLICK_INTERACTION_POINTS.drag`) is used ONLY for
    the arm-time DISTANCE gate (Click Hold (Drag)/Click Hold (Grow)
    triggering) -- unchanged in ROLE, just refreshed data. Frame 48's
    own point (`MOUSE_FLICK_DRAG_END_POINTS`) is now the LIVE dragging
    ANCHOR itself (`mouseFlickDragEntityOriginForAnchor()`/
    `mouseFlickDragPointWorld()`'s target, and `dragSpritePickupStartX/Y`'s
    own reference point in onPointerDown) -- previously frame 1 was the
    anchor and frame 48 was purely cosmetic. Per explicit spec: "Use
    Drag Frame 01 for:... distance measuring... Use Drag Frame 48
    for:... the actual dragging anchor point."
  - **`mouseFlickDragAlignmentOffset()` -- the OLD "frame 48 converges
    onto frame 1 by the end of the sequence" cosmetic correction --
    was REMOVED entirely**, along with its render()-time call site and
    the now-dead `mfDragSequenceActive` flag. Direct, necessary
    consequence of the anchor swap above: that correction's entire
    purpose was to compensate for frame 48 drifting away from frame 1
    while frame 1 was the anchor; with frame 48 now the anchor for the
    WHOLE drag sequence (not just its final frame), reapplying it would
    actively shove the sprite away from the point it was just solved to
    be at. If a FUTURE report says the drag sprite doesn't look quite
    right at some frame OTHER than 48 specifically, this removal (not a
    reintroduction of the old offset) is the first place to look --
    don't resurrect the old function without re-deriving whether it's
    still even meaningful under this anchor scheme.
  - **The 'default' interaction point (click/hold, plus a NEW 'attract'
    purpose) no longer sources from "tickle" data at all.** Per
    explicit correction ("Ignore Tickle" -- that data was relabeled for
    a completely different purpose, see the Base/Top Point entry
    below): now sourced from a "Flick" category (Click's own frame 1)
    instead. `MOUSE_FLICK_INTERACTION_REF_IMAGE`/`_VARIANT`/`_POINT_KEY`
    all updated to match, including a real key/data rename (REF_IMAGE
    'tickle' -> 'click', the actually-displayed, always-loaded category
    -- tickle is conditionally loaded per direction and no longer holds
    anything semantically relevant to this purpose anyway).
  - **'attract' (Rope Attraction) is now a registered purpose** in all
    3 mapping tables, per explicit instruction ("Use Flick Frame 01
    for:... Right-Click/Clickhold (Attract)'s interaction measuring
    point") -- but Rope Attraction's own arm code (onPointerDown's
    right-click branch) does NOT currently read this purpose anywhere;
    unlike click/hold/cut/drag, attraction has no proximity/distance
    gate at all to plug it into yet. Registered as available
    infrastructure per the explicit ask, not because an existing
    mechanism needed it -- don't assume a distance gate for Attraction
    exists just because this purpose is registered.
  - **The "tickle" data was itself relabeled mid-conversation to a
    completely different, unrelated purpose** -- direct correction:
    "I added points to Tickle. It is not for Tickle... there are 2
    points [per direction, frame 1]. They will define the main axis of
    the image. So the lower point is the Base Point and the higher
    point will be the Top Point... Anchor the cursor frame animations
    to the cursor by the base point." This replaces the 'base' variant's
    own `centerX`/`bottomY` in `MOUSE_FLICK_VISIBLE_BOUNDS` (previously
    alpha-scan-derived, per that table's own long-standing convention)
    with the real annotated Base Point, for all 8 directions --
    'charge'/'sciss'/'snap' variants are UNCHANGED (no new data was
    given for those). The Top Point half of each pair is stored in a
    NEW `MOUSE_FLICK_POINTING_TOP` table but is NOT YET wired into
    anything -- the axis concept ("when i say the hand 'points' at
    something, it will be along this axis") implies a possible future
    recalibration of the direction-bucket/rotation system to use this
    REAL annotated axis instead of assuming the artwork's own local
    "up" already is the neutral pointing direction, but that's a
    separate, materially riskier change to a system already 3 times
    corrected this project (see the direction-bucket history below) --
    deliberately NOT attempted without an explicit, separate request.
    **The "lower point is Base" rule sorts by Y VALUE, not by array
    position** -- the 2 points in each direction's own dump entry
    appear in inconsistent order (sometimes base first, sometimes top
    first); always take max-Y as base, min-Y as top per direction
    independently, never assume a fixed array index.
  All of the above verified via syntax check only (Node's `new
  Function()` extraction) -- this is a pure data/mapping-table change
  with well-understood, already-proven-correct surrounding math (the
  anchor-solve formula itself, `mouseFlickDragEntityOriginForAnchor()`,
  is unchanged from its last correction, just fed a different point
  table); live browser verification was attempted and blocked by the
  same recurring dev-server page-boot stall as several prior entries.
- **Corrected 2026-09-14 (5th pass on this feature) -- switching the
  live drag anchor to frame 48 (the entry directly above) fixed the
  ARM-TIME jump but introduced a NEW one at the opposite end: "once the
  [pickup] animation finishes, both the animation frame and the
  dragpoint suddenly shift backwards by the length of the image."**
  Root cause: `pickupEasedT` reaching 1 flipped 2 separate formulas
  from one TARGET VALUE to a completely different one, in a single
  frame, with no blending between them:
  - The ROPE's own target switched from "frozen at rest" to "the Drag
    Leash's own output, computed against the CURRENT raw cursor" --
    but the Leash's own reference point (`dragPoint.x/y`) had been
    FROZEN the whole ~200ms pickup window, so any real cursor movement
    during that window (very normal mid-drag) stayed fully "banked"
    and got released in ONE frame the instant pickup ended -- still
    bounded by the Leash radius from the cursor's OWN current
    position, but that alone can be a large single-frame correction
    relative to wherever the point had been sitting the whole time.
  - The SPRITE's own target switched from lerping toward the FROZEN
    `mfDragAnchor` to the LIVE `mainRope.dragCursorClamped` -- these 2
    values diverge by exactly however far the cursor moved during
    pickup, so the switch itself was the jump.
  Fixed with 2 coordinated changes, both reusing the SAME smoothstep
  shape the original pickup ease already established:
  1. **Rope catch-up ease** -- once `pickupEasedT` reaches 1, the rope
     no longer snaps straight to the Leash's own output. It eases there
     instead, over a 2nd phase (reusing `cfg.dragPickupDuration` again,
     a deliberate choice, not a new slider), from
     `downInfo.dragCatchupOriginX/Y` (recaptured every frame while
     still frozen, so it always holds the exact pre-catch-up position)
     toward the Leash's own per-frame-recomputed target -- continuous
     at the handoff by construction (catchupT=0 reproduces the origin
     exactly) and converges to the Leash's unmodified value once
     catchupT reaches 1, after which this behaves byte-for-byte like
     the pre-fix code.
  2. **Sprite target unified** -- no longer 2 separate formulas
     (lerp-toward-frozen-anchor, then a hard switch to live-cursor).
     Now a SINGLE lerp toward the LIVE `mainRope.dragCursorClamped`
     throughout the whole pickup window -- since that value updates
     every frame with the real cursor, and the cursor is normally very
     close to the drag point right as a hold arms, this still visually
     reads as "moving toward the drag point" for a normal drag start
     (satisfying the 4th-pass request unchanged), while making the
     pickup-to-active handoff mathematically seamless: the formula
     doesn't change at all at `pickupEasedT===1`, it just naturally
     evaluates to `dragCursorClamped` there, identical to what the
     post-pickup branch already used.
  Verified via a Node-level simulation of the full sequence (a 200ms
  freeze with the cursor moving 0.8px/ms the whole time, banking
  ~153px of unrealized movement): the rope stayed EXACTLY at its
  frozen position for the entire freeze, then moved smoothly and
  continuously from the very first catch-up frame (100.00 -> 100.75,
  not a snap) through to fully tracking the cursor ~200ms later, and
  the sprite's own target evaluated to WITHIN under 1px of
  `dragCursorClamped` right at the pickup boundary and EXACTLY equal to
  it one frame later -- confirming zero discontinuity in either case,
  even with substantial banked cursor movement. Not a live browser
  test -- blocked again by the same recurring dev-server page-boot
  stall as every other fix in this feature's long history. **If this
  feature is ever revisited again, the catch-up ease's own origin
  capture (`downInfo.dragCatchupOriginX/Y`, written every frame while
  `pickupEasedT < 1`) must keep being refreshed every such frame, not
  captured once at arm time** -- capturing it once would reintroduce a
  DIFFERENT staleness bug if the rope's frozen position were ever made
  to drift for any other reason in the future (it doesn't currently,
  but nothing enforces that invariant structurally).
- **`applyPunch()`'s own power cap scales MULTIPLICATIVELY with
  `segLen`, so a deliberately short Segment Length silently caps every
  punch/charged-flick down to a small fraction of its intended
  strength, regardless of Click Intensity or Intensity Ceiling.** Real,
  reported bug (2026-09-15, direct follow-up to the earlier "short
  Segment Length feels dampened/heavy" investigation): "with Segment
  length set at .9, even with Constraint Iteration at 20, the rope
  physics feels very dampened and heavy. even with a strong click hold
  charge flick, the rope still acts weird." That earlier investigation
  correctly diagnosed constraint-solver convergence as ONE real factor
  (confirmed AGAIN here via direct simulation at the live segLen/
  ropeLength: iterations=20 brings max rest-length error down to
  ~0.05%, i.e. genuinely fully resolved) -- but raising iterations to
  20 alone didn't fix the reported feel, because a SEPARATE, larger
  factor was still fully in effect: `applyPunch()`'s power is capped at
  `segLen * maxPunchSegments` (see that function's own comment for why
  the cap exists at all -- preventing a punch from flinging a point
  past its own neighbor into an inverted, chaotically-recovering
  configuration, "the dark flash near the rope start" bug this was
  originally built to fix). That cap was tuned against whatever segLen
  was in use at the time (the default, ~2.37%vh) -- at the live
  segLen of 0.9%vh (well under half that), the SAME multiplier (4)
  produces a MUCH tighter absolute cap. Confirmed via direct
  simulation: a full Intensity Ceiling (25x) charge that should push
  ~270px was being capped down to just ~39px -- 14.4% of its intended
  strength -- completely independent of how hard the flick was charged,
  which is exactly what "acts weird" describes (charge level stops
  mattering once it's already saturating a cap far below its own
  ceiling). Fixed by exposing the multiplier as `cfg.maxPunchSegments`
  (def 4, matching the old hardcoded value exactly -- a pure no-op for
  any project/save that's never touched Segment Length) instead of a
  fixed constant, so a project running a deliberately short segLen can
  compensate directly. **Raising this slider trades power-cap headroom
  against the ORIGINAL inversion risk it exists to prevent** -- at the
  live segLen, 8/10/15/20 give roughly 29%/36%/54%/72% of full intended
  power respectively (verified via the same simulation formula); raise
  gradually and watch for the "dark flash"/inverted-recovery symptom
  returning before pushing it further. Verified via Node-level
  simulation of the exact solver + punch formula (a settle-accuracy
  test, a same-absolute-punch-power comparison across point counts, and
  the cap-vs-multiplier table above) -- not a live browser test,
  blocked by the same recurring dev-server page-boot stall as several
  prior entries. **If a future report says a charged flick "feels weak"
  or "doesn't respond to intensity," check `cfg.maxPunchSegments *
  mainRope.segLen` against the theoretical uncapped power
  (`vh(1.0) * intensity`) before assuming the intensity/charge system
  itself is broken** -- this cap can silently dominate regardless of
  how correctly the charge-intensity math itself is implemented.
- **Drag Pickup's 5th-pass fix (see the entry above) silently undid the
  4th-pass fix it was built on top of -- 2 corrections that each solved
  a real, different problem can still conflict if the 2nd one's fix
  routes around the 1st one's target instead of preserving it.** Real,
  reported bug (2026-09-15): "when i trigger a drag function, the
  cursor animation frame displaces smoothly back to the true curser,
  then the dragpoint with rope displaces smoothly to the interaction
  point anchor. Tht is incorrect. The correct sequeunce is - 1. Click
  Hold to Drag is triggered 2. Cursor animation is smoothly displaced
  to the dragpoint... 3. When the frame interaction anchor point
  aligns with the drag points, then the dragging physic starts." This
  is EXACTLY the 4th-pass spec, still correct -- the 5th pass (fixing a
  real discontinuity at the pickup-to-active HANDOFF, by making the
  sprite's own pickup-phase target lerp toward the LIVE cursor instead
  of the frozen drag point throughout) accidentally reverted the
  sprite's actual PICKUP-PHASE TARGET back to the cursor, the precise
  behavior the 4th pass existed to fix. **6th pass, same day:** restores
  the 4th-pass target (sprite eases toward the frozen `mfDragAnchor`
  during pickup) and fixes the 5th pass's own handoff concern PROPERLY
  instead of routing around it -- the sprite now gets its own catch-up-
  ease phase, mirroring the rope's own (`update()`'s "Catch-up ease --
  5th correction" block), using the IDENTICAL `catchupEasedT` timing
  formula so sprite and rope move in lockstep during the handoff, not
  merely agree at its 2 endpoints. 3 phases, continuous at both
  boundaries BY CONSTRUCTION (not by coincidence or approximation):
  1. `pickupEasedT<1`: sprite eases from its own real pre-drag position
     toward the frozen drag point (`mfDragAnchor`) -- this is what
     visibly "initiates" the drag.
  2. `catchupEasedT<1` (pickup just completed): sprite eases from that
     SAME frozen point toward the live cursor. Reuses
     `downInfo.dragCatchupOriginX/Y` -- the ROPE's OWN already-captured
     freeze-origin -- as the sprite's catch-up origin too, rather than a
     separate capture, since the rope's point and the sprite's
     annotated point are PROVABLY the same world position at that exact
     instant (the rope was frozen the entire time phase 1 ran, and
     phase 1's own t=1 endpoint is defined as that exact frozen value).
  3. `catchupEasedT>=1`: freely tracks the live cursor, unchanged from
     the 5th pass's own post-handoff behavior.
  Verified via a Node-level simulation of the FULL sequence (not just
  the formula in isolation): the sprite reaches the frozen drag point
  EXACTLY the same frame the rope's own catch-up-ease begins moving
  (126.6 at the first post-pickup sample, up from a flat 100.0 for
  every prior frame) -- confirming "when the frame interaction anchor
  point aligns with the drag points, then the dragging physic starts"
  holds by construction, not by tuning. Not a live browser test --
  blocked by the same recurring dev-server page-boot stall as several
  prior entries. **If this feature needs a 7th pass, re-read this
  entry AND the 4th/5th-pass entries above in full first** -- this is
  now the 3rd time a fix to one symptom (jump, handoff discontinuity)
  has needed to be re-checked against an EARLIER, already-validated
  requirement (which point the sprite targets during which phase)
  rather than assumed independent of it.
- **Drag Pickup's 7th pass (2026-09-15) replaces the catch-up-ease
  phase (6th pass, see the entry above) with a one-time cursor
  REALIGNMENT instead -- a different mechanism entirely, not a tuning
  tweak of the same one.** Real, reported follow-up: the 6th pass's
  own fix technically worked (no discontinuity) but was still an
  unwanted SCRIPTED motion: "the both of them automatically smoothly
  displace backwards the same amount. I do not want that displacement.
  The moment they align, the[y] shouldnt be triggered to move. Any
  movement at that point is determined by the true browser... perhaps
  what you can do is immediately displace the true cursor to align
  with the frame basepoint" (the user's own suggested mechanism, and
  the one actually implemented). Instead of moving the ROPE/SPRITE to
  reconcile with wherever the real cursor drifted during the pickup
  freeze, this flips which side gets adjusted: the moment
  `pickupEasedT` first reaches 1, `mouseX`/`mouseY` (and FLICK MOUSE's
  own `mfX`/`mfY` mirror -- both normally identical, written by 2
  separate `pointermove` listeners on the same real browser events) are
  reset ONCE to exactly match the frozen drag point. Neither the rope
  nor the sprite has anything to "catch up" to -- they're already
  sitting exactly on the (newly-realigned) cursor -- so both the
  Leash's own direct assignment (rope) and the free-tracking assignment
  (sprite) are trivially continuous on the transition frame with NO
  easing needed at all. Any real mouse movement banked during the
  ~630ms(-live) pickup freeze is simply DISCARDED rather than
  reconciled -- the very next genuine `pointermove` event naturally
  starts measuring movement relative to this realigned position, so
  100% of subsequent motion is attributable to the browser's own
  cursor, matching the request exactly. Gated on a one-shot
  `downInfo.dragCursorRealigned` flag -- **if this ever needs touching
  again, that gate is load-bearing**: removing it would permanently pin
  the tracked cursor to the drag point every frame post-pickup,
  breaking normal tracking entirely, not just the transition. The 6th
  pass's own catch-up-ease code (both the rope's own phase and the
  sprite's mirrored phase, plus `downInfo.dragCatchupOriginX/Y`) is
  REMOVED entirely, not just bypassed -- verify no future change
  reintroduces it without re-reading why it was replaced (it fixed a
  real discontinuity but only by adding motion nobody asked for).
  Verified via a Node-level simulation of the full sequence WITH banked
  cursor movement during pickup (mouse drifting the whole time from
  x=100 to x=180 while the drag point stays visually frozen at x=100):
  confirmed zero displacement at the exact alignment frame (sprite
  reaches x=100.0 continuously, rope stays at x=100.0 unchanged), then
  the sprite immediately tracks the REAL current mouse position exactly
  (not an eased approach) every frame after, while the rope correctly
  leashes at a constant radius behind it. Not a live browser test --
  blocked by the same recurring dev-server page-boot stall as several
  prior entries.
- **CORRECTED 2026-09-14/15 -- the entry below (originally: "investigated
  but NOT changed, no code bug was found, likely just the pickup-
  duration window") turned out to be WRONG.** The user firmly rejected
  the pickup-duration hypothesis with a direct, dispositive counter-
  report: "no the leash mechanic i tested and which failed was far
  after i initially triggered the dragging function. I trigger the
  drag, then spent the next 5-10 seconds draggin the rope around. So
  its got nothing to do with mid interaction interruption." A real,
  deterministic bug WAS present -- see the dedicated entry below
  ("Cursor Animation's drag-anchor SPRITE target collapsed to a ZERO
  gap...") for the actual root cause and fix. Left here, corrected
  rather than deleted, as a reminder that a same-session "investigated,
  no bug found" conclusion is not itself proof -- when the user
  directly and specifically rejects the hypothesis behind it, re-open
  the investigation rather than defending the earlier conclusion.
- **Renaming a STATIC `DEV_GROUPS` title does not migrate any
  ALREADY-SAVED custom-group data that referenced the OLD title as its
  own key.** Real, shipped bug (2026-09-13, same investigation as
  above): renaming the "FLICK MOUSE" static group to "CURSOR ANIMATION"
  (734eb6e) left an earlier save's own `order` still keyed "FLICK
  MOUSE" (with a `textOverrides` entry independently making IT also
  display as "CURSOR ANIMATION") -- `placeGroup()` then created a
  genuine duplicate: the real static group ended up empty (all its
  settings relocated by key into the differently-keyed custom group)
  while a second, identically-labeled group held the real values.
  Fixed by hand-editing the saved `data/processed/dev-panel-settings.json`
  directly (a data repair, not a code change) to rename the stale key
  and drop its now-redundant text override. **If a static group's title
  is ever renamed again, check whether the OLD title survives anywhere
  in the live settings log's own `order` as a group key** (`grep` for
  the old title) and repair it the same way -- there is no automatic
  migration for this.
- **A stale flat saved `order` entry for a group can silently defeat a
  brand-new default NESTED structure for that same group.** Real,
  reproduced bug (2026-09-14): the moment `applyDefaultDevPanelSubgroupOrder()`
  (new this same day) reorganized the "DEV PANEL" group's flat rows into
  MECHANICS/PANEL UI/TEXT subgroups at boot, `resetSettings()`'s own
  `applyOrder(snap.order)` ran immediately afterward and used the OLD
  (pre-reorganization) saved `data/processed/dev-panel-settings.json`,
  whose "DEV PANEL" entry was still a flat `settings: [...23 keys...],
  subgroups: []` from before subgroups existed — `placeGroup()` then
  correctly did exactly what it's designed to do (restore the user's own
  saved arrangement) and yanked every one of those 23 pre-existing keys
  back out of the freshly-built subgroups into the flat top-level body,
  leaving MECHANICS/PANEL UI/TEXT's OWN direct-child rows empty (only
  the 19 BRAND-NEW fields, absent from the old save entirely, stayed
  correctly nested). This is not a code bug — `applyOrder()` restoring a
  user's own saved arrangement over a built-in default is the intended
  behavior (same "a later real reorganization is never clobbered"
  design the idempotency guard itself describes) — but a genuinely STALE
  save from before a structural change like this needs a one-time data
  fix, not a code change: removed the stale "DEV PANEL" entry from
  `order.groups` in `data/processed/dev-panel-settings.json` directly so
  the fresh default nesting is left alone until a real Save re-captures
  it (same "check the actual saved file, fix data not code" precedent as
  the CURSOR ANIMATION gotcha above). **If `applyDefaultDevPanelSubgroupOrder()`
  (or any future default-reorganization-at-boot function) is ever added
  for another group, check the live settings log for a stale flat entry
  under that exact group key before assuming the new nesting will
  actually show up** — it silently won't, for anyone with a save that
  predates the change, until either the stale entry is removed/repaired
  or the user's own Save/Reset naturally recaptures the new shape.
- **Mouse Log (2026-09-14, ported from `TEMPLATE_DEV_PANEL.html`'s own
  `[JS-13c]`) is a RAW pointer/gesture diagnostic, deliberately separate
  from CLICK LOG** (the pre-existing `logClick()`/`#dpClickLog` widget):
  CLICK LOG records semantic APPLICATION events tied to the rope's own
  physics (flick/charge/cut/grow/drag/attract, via explicit `logClick()`
  call sites inside `onPointerDown`/`onPointerUp`); Mouse Log records
  what the user's actual finger/mouse did (tap/click/dblclick/
  tripleclick/hold/drag-release/rightclick/swipe/pinch/scroll), via its
  own independent `window`-level pointer/wheel listeners
  (`initMouseLog()`), completely unaware of what the game does with any
  of it. Don't merge the two or assume one supersedes the other — they
  answer different questions when reading a log back ("what did the
  rope do" vs. "what did the input hardware actually register"). Reuses
  `formatClickLogTime()` and the `.dp-click-log*` CSS classes rather than
  duplicating either.
- **FLICK MOUSE's cursor-animation SPRITE position must SNAP directly to
  the live Drag Rope anchor while dragging, never ease/lerp toward it.**
  Corrected 2026-09-14, refining the 2026-09-13 "stay anchored to the
  drag point" feature: the original version ran `mfEntityX`/`mfEntityY`
  through the SAME `mouseFlickPositionSmoothing` lerp toward the drag
  anchor as it uses for normal cursor-following, which could still show
  a frame or more of visible lag/separation behind a fast-moving or
  newly-clamped drag point. Per explicit clarification ("I meant
  visually... the cursor animation should not visually separate away
  from the drag point, even if the real cursor is moved beyond how far i
  can drag the rope") — the ROPE's own drag mechanic (dragging the real
  rope point) is completely unaffected either way; this is purely about
  the sprite's own rendered position. `update()`'s own FLICK MOUSE block
  now branches: whenever `mouseFlickDragAnchorWorld()` returns non-null
  (actively dragging), `mfEntityX`/`mfEntityY` are set DIRECTLY to the
  anchor's current position (zero lag, bypassing `mfPosFactor` entirely);
  otherwise the normal smoothed lerp toward the raw cursor still applies
  unchanged. Verified live via a temporary debug hook (forced a fake
  dragging `downInfo`, moved the pinned rope point twice, confirmed
  `mfEntityX/Y` matched the anchor's position EXACTLY on both samples,
  not just closer to it) — removed before commit, per this project's own
  debug-hook convention. Rotation is NOT touched by this fix and
  continues to smoothly lerp/animate while dragging, per the original
  request's own wording ("it will continue to rotate and change
  animation types, but it will stay anchored to the drag point") — only
  POSITION needed to become rigid.
- **`PANEL_STYLE_CONTROLS`' `bodyFontSize` field ("Body Text Font
  Size") is REMOVED (2026-09-14), not just re-homed into a subgroup.**
  Real, reported bug: the user asked for the built-in "Dev Panel"
  group's nesting/naming to match `TEMPLATE_DEV_PANEL.html` exactly
  ("I see a lot of floating settings in the Dev panel group"). Live
  inspection (`#dpGroups > .dp-group[data-key="DEV PANEL"]`'s own
  direct `.dp-row` children, i.e. rows NOT relocated into MECHANICS/
  PANEL UI/TEXT by `applyDefaultDevPanelSubgroupOrder()`) found exactly
  ONE floating row: `bodyFontSize`. It was one of this project's own
  9 pre-existing, independently-tuned fields from BEFORE the
  2026-09-14 template port (see `PANEL_STYLE_CONTROLS`' own comment)
  — never part of what got ported FROM the template, so
  `applyDefaultDevPanelSubgroupOrder()`'s subgroup key lists never
  mentioned it, and the workspace `CLAUDE.md` §12i's own standing rule
  ("No separate 'Body Text Font Size' — ... redundant duplicate of
  Settings Title Font Size ... don't reintroduce it") had never
  actually been applied to THIS project's copy of the field. Fixed by
  deleting the `PANEL_STYLE_CONTROLS` entry outright (not moving it
  into a subgroup) — `#devPanel`'s own base font-size (`--dp-body-
  size`, used by the `#devPanel` CSS rule's `font-size`) is now a
  plain hardcoded `12px` in CSS instead of a dedicated control,
  matching its own default value exactly (confirmed via the live saved
  `data/processed/dev-panel-settings.json`: `bodyFontSize` was `12` —
  its own unchanged default — on both Desktop and Mobile, so this is a
  zero-visual-change removal, not a behavior change). Also gave the
  top-level "Dev Panel" group's own hand-built title span (in
  `buildPanelStyleGroup()`, which does NOT call `createGroupElement()`
  the way every other group does) the `dp-group-title` class it was
  missing — without it, `applyDevTextOverrides()`'s own `.dp-group-
  title` selector (see that gotcha above) could never find this ONE
  group's title, so Text Edit Mode would have silently failed to
  rename it even though every other group already worked. **If any
  future field is added to `PANEL_STYLE_CONTROLS`, it must also be
  added to one of `applyDefaultDevPanelSubgroupOrder()`'s
  `makeSubgroup()` key lists (or a new subgroup) — a field left out
  doesn't error, it just silently floats at the top of the "Dev
  Panel" group exactly like this one did**, invisible until someone
  compares the panel directly against `TEMPLATE_DEV_PANEL.html`.
- **Rope Overstretch (2026-09-14) is Drag Rope's own elastic "give"
  zone beyond the pre-existing hard clamp, plus progressive thinning
  and a release bounce — all 3 pieces are rendering/scripted-motion
  ADDITIONS layered on top of the existing Drag Rope mechanism, never
  touching `mainRope.segLen`, rest lengths, or the constraint solver
  itself.** `cfg.overstretchEnabled` (def `false`) gates the WHOLE
  feature — with it off, `update()`'s drag-pin clamp resolves to
  exactly the pre-existing `maxDragDist` hard limit (`overstretchTol`
  computes to `0`, so `hardLimit === maxDragDist` bit-for-bit), so this
  feature is fully backward-compatible by construction, not just by
  convention. `cfg.overstretchThinningEnabled` is a SEPARATE checkbox
  (def `true`) that only gates the RENDER-time thinning effect, per
  explicit spec ("lets the whole effect be turned off without zeroing
  the tolerance itself") — tolerance/bounce still function with
  thinning off.
  - **Thinning can't reuse `strokeRopeCurve()`** — Canvas2D's
    `ctx.lineWidth` is one value per `stroke()` call, so genuine
    mid-path width variation needs a NEW function
    (`strokeRopeCurveVariableWidth()`) that strokes each segment of the
    affected anchor→drag-point sub-chain separately with its own
    interpolated width, straight lines rather than the curve-through-
    midpoint technique `strokeRopeCurve()` uses elsewhere (an accepted
    simplification — this only ever renders while actively
    overstretched, where some extra faceting reads as "taut/stressed,"
    not as a bug). `render()`'s main-rope stroke call branches: the
    unmodified `strokeRopeCurve()` call is still what runs for EVERY
    other case (feature off, not dragging, dragging but not
    overstretched) — only `mainRope.overstretchActive` true replaces it
    with 2 calls (the thinned sub-chain via the new function, then the
    unmodified rest of the rope via the normal one).
  - **Thickness profile:** `thickness(t) = base * (1 - depth *
    sin(pi*t)^sharpness)`, `t` = 0 at the anchor, 1 at the drag point —
    full thickness at both ends, thinnest at the sub-chain's own
    midpoint. `depth` itself ramps LINEARLY from `0` (right at the rest
    limit) to `overstretchMaxThinDepth` (fully at the tolerance limit)
    as a continuous function of the actual clamped drag distance
    (`mainRope.overstretchPx`/`overstretchTolerance`), so thinning
    visibly eases in rather than popping on — verified live (Browser
    pane, with `mouseFlickEnabled` temporarily forced off so raw
    `mouseX`/`mouseY` drives the drag target directly — see the next
    gotcha for why that matters for testing) at an intermediate drag
    distance: `depth` read a genuine in-between value (`0.173`, neither
    `0` nor the saturated `0.6`), and `overstretchThicknessMultiplier()`
    at that depth gave IDENTICAL values at `t=0.25`/`t=0.75`
    (0.877741 both) with `t=0.5` strictly lower (0.8271) and `t=0`/`t=1`
    exactly `1` — symmetric, midpoint-thinnest, full at both ends, as
    specified.
  - **Testing a live drag via direct `mouseX`/`mouseY` assignment
    doesn't work while FLICK MOUSE is active/visible** — `update()`'s
    drag-pin block reads the target via `mouseFlickInteractionPos(mouseX,
    mouseY, 'drag')`, which returns `mouseFlickInteractionPointWorld('drag')`
    when FLICK MOUSE can resolve one, falling back to raw `mouseX`/`mouseY`
    only when it can't. Combined with the 2026-09-14 drag-anchor-snap fix
    (FLICK MOUSE's own sprite position, `mfEntityX`/`mfEntityY`, now
    SNAPS to the live drag point with zero lag while dragging — see that
    gotcha), this creates a closed loop while actively dragging: the
    drag point's position feeds the sprite's position, which feeds the
    'drag' interaction point, which feeds the drag point's position
    again — directly poking `mouseX`/`mouseY` has no effect on this loop
    at all, since the interaction point never bottoms out at the
    fallback. A temporary debug hook driving `mouseX`/`mouseY` directly
    (this feature's own live-test method, per this project's established
    convention) must set `cfg.mouseFlickEnabled = false` first to break
    the loop and force the plain fallback — confirmed directly: the
    SAME test that read back stale/unchanged values with FLICK MOUSE on
    produced correct, responsive values the instant it was turned off.
    This isn't specific to Overstretch — it applies to any FUTURE test
    that needs to drive `mainRope`'s drag target directly rather than
    reading it back.
  - **Release bounce is a SCRIPTED damped harmonic oscillator
    (`amplitude * e^(-damping*t) * cos(stiffness*t)`), applied as a
    radial position nudge on top of whatever `integrateChain()`'s own
    normal solve already computed that frame — deliberately NOT
    touching `oldx`/`oldy`, so it genuinely injects a one-frame Verlet
    "velocity" contribution rather than reading as a disconnected
    overlay.** Armed in `onPointerUp`'s Drag Rope release branch, ONLY
    when `mainRope.overstretchPx > 0` at release (so a release right at
    the rest limit produces ~zero bounce, per spec) — amplitude IS that
    exact px overstretch amount directly, no separate "base amplitude"
    slider needed. Terminates once its own decaying envelope drops
    below `cfg.overstretchBounceMinAmplitude` (the real, user-facing
    termination control — `OVERSTRETCH_BOUNCE_MAX_DURATION` is a plain
    3-second safety backstop, not a slider) rather than a fixed
    duration. Verified live (30ms-interval sampling over ~1.8s real
    time, low damping): a clean multi-cycle trace — 211.9 (trough) →
    224.02 (crest #1) → 221.38 (near-trough) → 224.4 (crest #2) — at
    least 2 distinct overshoots before the sandbox's own background-tab
    rAF suspension interrupted the trace (a real environment limitation
    also documented elsewhere in this file, not a bug in the bounce
    itself — a `computer` click on the canvas reliably "wakes" a
    suspended tab's rAF loop back up, used repeatedly during this
    feature's own live verification). High-damping and near-zero-
    amplitude termination behavior were verified via an independent
    Node.js simulation of the exact same envelope/crossing-count math
    (15 sign-crossings at damping=1, 1 crossing at damping=15, 0 at
    amplitude below the min-amplitude threshold) rather than live, for
    speed — the live trace above already confirms the SAME formula
    genuinely perturbs real rope points end-to-end through the actual
    render()/update() code path, which is what a pure Node simulation
    of the formula alone could never confirm on its own.
- **All 39 `PANEL_STYLE_CONTROLS` defaults (not just the 19 newest ones)
  now match `TEMPLATE_DEV_PANEL.html`'s own live `devPanelStyle` object
  exactly** (2026-09-14, 2nd pass, direct request: "reread the Dev
  Panel Template Dev Panel group's exact values... Port those"),
  superseding the first pass's "preserve this project's current
  look" choice for the 19 newest fields specifically. The template's
  own values had ALSO drifted since the first pass (tabBold/buttonBold
  false->true, groupLetterSpacing 0->0.8, titleLetterSpacing/
  valueFontSize/buttonFontSize all changed, every color and the font
  family changed) — always re-read the template fresh when asked to
  re-sync, never assume the first pass's captured values are still
  current. Updated in 2 places, not just code: `PANEL_STYLE_CONTROLS`'
  own `def:` fallbacks, AND `data/processed/dev-panel-settings.json`'s
  own `panelGeometry.desktop/mobile.style` (a `def:` change alone does
  nothing for a key that's already present in the saved file — the
  saved value always wins over the code default once anything's been
  saved). `bodyFontSize`/`textEditMode` have no template equivalent
  and were left untouched, per the array's own comment.
- **"Saved Dev Settings" (Named Setting States) is now collapsible**
  (2026-09-14, matching the template's own wrapper), implemented as a
  plain hand-rolled `.dp-group`/`.dp-group-header`/`.dp-group-body`
  structure (reusing the existing collapse CSS) rather than
  `createGroupElement()` — deliberately NO drag-handle and NO
  independence/visibility checkboxes, since (like the template's own
  version) this is a single panel-level section outside the per-tab
  reorderable group system, not one of the 3 device tabs' own
  settings. Sitting outside `#dpGroups` entirely already keeps it out
  of `makeReorderable()`'s own delegated group-drag listener with no
  extra exclusion code needed.
- **Drag Rope's own continuous per-frame drag TARGET must always be the
  raw live cursor (`mouseX`/`mouseY`), never `mouseFlickInteractionPos(...,
  'drag')` (FLICK MOUSE's own annotated point, transformed through the
  sprite's CURRENT position/rotation).** Real, reported, root-caused
  regression (2026-09-14: "i currently still cant drag the rope. its
  stuck to where the drag point is originally"), introduced by combining
  2 previously-fine pieces: (1) the 2026-09-12 "interaction points"
  feature substituted the annotated 'drag' point for the raw cursor at
  `update()`'s own per-frame drag-pin block (not just the 3 genuine
  DISTANCE gates it was built for, nor Drag Rope's own ARM-TIME distance
  check -- both of those are one-shot measurements and stay correct);
  (2) the SAME day's "cursor animation stays anchored to the drag point"
  fix made the sprite's own position (`mfEntityX/Y`) SNAP exactly to the
  live drag point every frame. Combined, this closes a real feedback
  loop: drag point -> sprite position (via the snap) -> annotated point's
  world-space transform -> NEW drag point target -> ... -- which
  converges to a fixed point almost immediately and stops responding to
  the real cursor AT ALL, regardless of how far the mouse actually moves.
  This loop existed in LATENT form even before the snap fix (the
  original lerp-based "stay anchored" version would eventually converge
  to the same stuck state too, just gradually enough that a normal short
  press-drag-release rarely if ever reached it) -- the snap fix just made
  it instant and therefore always visible. Fixed by using
  `{x: mouseX, y: mouseY}` directly as the per-frame drag target, which
  is structurally incapable of depending on the sprite's own rendered
  position (only a real `pointermove` listener ever writes `mouseX`/
  `mouseY`). Verified live via a temporary debug hook (forced a drag,
  drove the mouse through 3+ distinct positions, confirmed the dragged
  point's own position differed and moved in the correct direction each
  time -- removed before commit). **Any FUTURE per-frame position TARGET
  (as opposed to a one-shot distance measurement) must never be derived
  from FLICK MOUSE's own current rendered transform if that same
  target also feeds back into what the sprite's own position/rotation
  overrides use as THEIR target** -- that's the exact shape of loop that
  caused this bug, and the same shape could recur anywhere a future
  cursor-animation override and a game-state target end up pointing at
  each other.
- **Corrected 2026-09-14 (3rd pass on this feature) -- "anchor the
  cursor animation to the drag point" means the ANNOTATED 'drag'
  interaction point (the green dot -- `MOUSE_FLICK_INTERACTION_POINTS.drag`),
  never the sprite's own WRIST origin (`mfEntityX/Y` directly).** Per
  explicit clarification: "I meant the cursor image's Interaction
  Points that I had provided previously. For Drag, it would be the
  green interaction point, or the point provided at frame 48."
  `mouseFlickDragEntityOriginForAnchor(anchorWorld)` (new) is the
  INVERSE of the existing `mouseFlickDragPointWorld()` transform --
  given a desired WORLD position for the annotated point, it solves for
  what `mfEntityX/Y` needs to be so that point (not the wrist) actually
  lands there. Deliberately anchors against FRAME 1's own point only
  (`MOUSE_FLICK_INTERACTION_POINTS.drag`), never frame 48's
  (`MOUSE_FLICK_DRAG_END_POINTS`) -- the PRE-EXISTING (2026-09-12)
  `mouseFlickDragAlignmentOffset()` already keeps frame 48's point
  visually converged onto frame 1's throughout the whole sequence (its
  own, already-shipped purpose), so anchoring against frame 1 alone is
  sufficient to keep EVERY frame's point pinned, with zero new offset-
  tracking logic layered on top. Verified live: `mouseFlickInteractionPointWorld('drag')`
  (the green point's own live world position) matched the actual
  dragged rope point's position to 5 decimal places once the game loop
  was confirmed genuinely ticking (see the tick-counter gotcha below).
- **Corrected 2026-09-14 (same pass) -- rotation while dragging must
  point along the axis from the RAW/TRUE cursor to the drag point, not
  from the sprite's own current position to the drag point.** Per
  explicit clarification: "the rotation of the cursor frame should
  always point at the drag point. So if you draw a line from the true
  cursor to the drag point, the cursor animation frame will be aligned
  along that axis." Every OTHER Cursor Target Mode computes its
  rotation target as the angle FROM the entity's own live position
  (`mfEntityX/Y`) TOWARD the resolved world target
  (`mouseFlickAngleFromCenter(target.x, target.y, mfEntityX, mfEntityY)`)
  -- the drag case is the one deliberate exception, using
  `mouseFlickAngleFromCenter(dragAnchor.x, dragAnchor.y, mfX, mfY)`
  instead (the RAW tracked cursor, not the entity's own position, as
  the origin of the angle). Gated on the same `mfDragAnchor` already
  resolved for the position override just above, so it takes priority
  the same way.
- **Corrected 2026-09-14 (same pass) -- Drag Pickup: the grabbed rope
  point eases from its own pre-drag resting position toward the live
  cursor-derived target over `cfg.dragPickupDuration` (def 200ms, a
  smoothstep curve), instead of snapping there on the drag's very first
  frame.** Per explicit report: "when i start a drag, the cursor frame
  jumps to the drag point... and the rope gets physically affected by
  this jump. I want it to look like a smooth and naturally picking up
  of a dangling rope without any jittering or jumping." The INSTANT
  snap wasn't just visually jarring -- it gave the REST of the rope
  (every point other than the one being dragged) a real, unwanted
  constraint-solver jolt as the solver yanked them toward the newly-
  relocated point in one step, rather than the small per-frame
  correction a gradual approach produces. Captured ONCE at arm time
  (`downInfo.dragPickupStartX/Y/Time`, alongside the pre-existing
  `dragAngleRefX/Y` capture in the SAME onPointerDown block) --
  deliberately NOT re-captured per frame, or the point would never
  actually finish easing in. The cursor-animation sprite needs NO
  separate easing of its own: since `mouseFlickDragEntityOriginForAnchor()`
  solves against the drag point's own CURRENT (possibly still-easing)
  position every frame, the sprite naturally eases in right alongside
  it. `mainRope.overstretchPx` (Rope Overstretch, above) is measured
  from the point's own FINAL post-pickup-easing position, not the raw
  clamped cursor target, so overstretch correctly reads as inactive
  during the pickup window even if the ultimate target would have been
  past the rest limit.
- **This environment's Browser pane can go long stretches with ZERO
  `requestAnimationFrame` ticks even after the documented "click to
  wake a suspended tab" workaround, with no error and no visible sign
  anything is wrong** -- discovered while verifying the 3 fixes above:
  a debug-hook test read back a completely frozen `mfEntityX/Y` (bit-
  for-bit identical across multiple, differently-parameterized test
  runs) and a hand-rolled per-tick counter confirmed 0 ticks over a
  1.3-second real-time window, despite an immediately-preceding
  `computer` click and despite the SAME test methodology working
  correctly in a prior task this same session. The fix that actually
  worked: wait for the rope to visibly finish growing (confirms the
  intro sequence, and therefore the whole boot sequence, has genuinely
  completed) AND issue a fresh click IMMEDIATELY before the test, in
  back-to-back tool calls with nothing in between (not several calls
  earlier). **Before trusting a "frozen"/unresponsive live-test result
  in this project again, add a one-line tick counter
  (`if (DEV_MODE && window.__mfTickCounter !== undefined) window.__mfTickCounter++`
  at the very top of `update()`, or equivalent) and confirm it's
  actually incrementing before concluding the CODE itself is broken** --
  this cost real time chasing what looked like a position/rotation bug
  before the tick counter revealed the loop simply wasn't running at
  all during those specific test windows.
- **Endcap SVGs were reorganized (2026-09-14): the OLD `End_Form1-01`
  through `End_Form3-02.svg` family (plus `End Alignment.svg`/
  `RopeEG.svg`) are archived to `data/Rope/ARCHIVED/`, and the live
  "Form 1" variant set now ships as `Form 1--01/02/03/04/15/20.svg`
  (double-dash naming, an Illustrator export quirk, not a typo) plus a
  new standalone `End_Form10.svg`.** `ENDCAP_DESIGNS`/the Endcap
  Design dropdown were synced to match exactly what's on disk per this
  gotcha's own established convention (sync to the filename-derived
  key, don't infer renumbering intent): `form1-01`/`form1-15` are
  BYTE-IDENTICAL to their old `d` values (confirmed before syncing --
  re-exported unchanged), `form1-02`/`03`/`04` are genuinely redesigned
  shapes, `form1-20` is new (and happens to reuse `form6`'s exact path
  data -- confirmed intentional-as-provided, not a bug, per this
  project's own "match what's on disk, don't second-guess intent"
  rule), and `form10` is a new standalone design. The entire old
  Form 2/Form 3 variant family (`form2-07` through `form2-c`,
  `form3-01`/`02`) has NO current replacement on disk and was removed
  from the dropdown -- if it's ever re-added under new files, treat it
  as a fresh addition, not a restoration (their old archived content
  may not match whatever eventually replaces them). **`*-Curves.svg`
  files** (`Form 1-Curves-01/02/03/04/15.svg`, `End_Form10-Curves.svg`)
  are the OUTLINE/reference versions of these same shapes, tracked as
  assets but deliberately EXCLUDED from `ENDCAP_DESIGNS`/the dropdown
  -- they're reference material for a separate, not-yet-started
  deformable-endcap effort (skinning Form 1-01 to bend/stretch instead
  of rendering as one rigid `Path2D`), not selectable designs. Don't
  add a `-curves` key to `ENDCAP_DESIGNS` without a fresh, explicit
  request to do so.
- **Deformable Endcap (2026-09-14, implemented) -- an opt-in
  ALTERNATIVE to `drawEndcap()`'s rigid single-transform stamp, gated
  behind `cfg.endcapDeformableEnabled` (default `false`, so the
  existing rigid rendering stays the untouched default per explicit
  instruction: "keep our current viz as is").** Scoped narrowly on
  purpose: mainRope only (never fallen pieces), and `form1-01` only
  (the one shape actually parsed) -- any other design silently falls
  back to the normal `drawEndcap()` call, see that branch's own comment
  at its render() call site.
  - **Technique**: `parseSvgPathD()` (a small, generic M/L/H/V/C/Z SVG
    path parser -- this file had no general one) turns Form 1-01's own
    `d` string into an ordered segment list; `FORM1_01_SKIN` (computed
    once at load) tags every anchor point AND every cubic-bezier
    control-point handle with `(t, lx)` -- `t` = normalized position
    along the shape's own local axis (0 at the neck, 1 at its far/
    pointed end), `lx` = sideways offset from centerline. At render
    time, `drawEndcapDeformable()` places each tagged point by walking
    `t * worldLength` world px PAST the rope's own last physics point,
    along a short curvature-extrapolated "spine" (`endcapSpineSample()`)
    instead of one rigid rotate/scale -- the spine's own curvature is
    read directly from the signed angle between the rope's last 2 real
    segments (`points[length-3..length-1]`), so the shape genuinely
    bends when those segments are currently angled (e.g. resting on the
    floor) without touching physics at all -- purely a rendering-layer
    addition, same "additive on top of the existing mechanism" pattern
    as Rope Overstretch.
  - **Verified algebraically that this reduces to BYTE-IDENTICAL output
    vs. the rigid `drawEndcap()`** whenever the spine is straight (zero
    curvature) and `stretchMult=1` -- both express the exact same world
    point as `origin + s*dir + lx*xScale*normal` (worked through
    `drawEndcap()`'s own full transform chain by hand: translate(tip) ->
    rotate(angle) -> translate(0,-SEAM) -> scale -> translate(-topCenterX,
    -anchorY), applied to a raw path coordinate in REVERSE of call order
    per Canvas2D's own compose semantics). **Confirmed live, not just on
    paper**: a straight-hanging rope with the checkbox on screenshotted
    PIXEL-IDENTICAL to the checkbox off, satisfying "should look exactly
    the same in a static position" per the original request.
  - **Bend and stretch confirmed live via synthetic test draws** (a
    temporary debug hook calling `drawEndcapDeformable()`/`drawEndcap()`
    directly against hand-built point arrays, bypassing the live
    physics/rAF timing entirely -- this environment's own recurring
    "can go long stretches with zero rAF ticks" issue, documented
    elsewhere in this file, made testing against REAL dragged/settled
    physics state impractical this session): a sharp synthetic ~90°
    kink showed the rigid version staying a straight rotated stamp
    while the deformable version visibly curved along the bend;
    `stretchMult` 1 vs. 1.8 on an identical straight spine showed the
    1.8 version visibly longer. Hook removed before finishing
    (grep-confirmed zero `__endcapTest` references remaining).
  - **Stretch-on-drag signal (`mainRope.endcapPullPx`/
    `endcapStretchMult`, set in `update()`'s drag-pin block) is
    deliberately NOT the same as `mainRope.overstretchPx`** (Rope
    Overstretch's own field) -- that field only ever becomes nonzero
    when Rope Overstretch's own tolerance is enabled (the drag point is
    hard-clamped to `maxDragDist` otherwise, so `actualDist-maxDragDist`
    is always ~0). This feature needed a stretch cue regardless of
    whether that separate subsystem is on, so `endcapPullPx` is measured
    from the RAW pre-clamp target distance (`ddist - maxDragDist`,
    captured right before the `hardLimit` clamp applies) instead --
    genuine pull intent even while the point itself is hard-capped. Only
    armed while `dragPinIndex === mainRope.points.length-1` (dragging
    the tip specifically). Gated by its own checkbox
    (`endcapStretchEnabled`, default `true`) separate from the master
    toggle, so bend and stretch can be tested/tuned independently --
    same "each piece of a feature gets its own on/off" convention as
    Rope Overstretch's own Thinning/master split.
  - **New dev sliders** (ROPE group, right after Endcap Height):
    Deformable Endcap Enabled, Bend Strength (x), Stretch Enabled,
    Stretch Range (%vmin), Max Stretch (x) -- all per §12n's own
    decomposition philosophy (bend/stretch tunable independently, no
    bundled "deform amount" dial).
  - **A concurrent session's own commit (`07f9520`, "Fix pickup-
    completion jump...") ended up containing this entire feature** --
    the Nth occurrence of this project's own recurring cross-session
    commit-attribution mixup (see the 2026-09-11/09-12 entries above
    for the earlier occurrences and the root cause: a blanket `git add`
    against the shared working tree sweeps in whatever's uncommitted at
    that moment, regardless of the committing session's own intent).
    Confirmed via `git show 07f9520:index.html | grep drawEndcapDeformable`
    that no content was lost -- not corrected further, per this
    project's own established precedent for this exact situation.
- **`bgRope.points[0]`'s own PHYSICS position (the eased/capped value
  driven by Background Rope Anchor Max Speed, see that slider's own
  comment) and its RENDERED position are now deliberately 2 different
  things (2026-09-15).** Real, reported bug: "Background rope start
  should never NEVER separate from main rope start... when i flick
  main rope really hard, I see the 2 separate as if the background rope
  is catching up." Root cause was a genuine, previously-undetected
  TENSION between 2 requirements solved via the SAME point: the
  2026-09-12 Anchor Max Speed fix deliberately caps how fast
  `bgRope.points[0]` can move toward `mainRope.points[0]` (a real,
  measured fix for a DIFFERENT bug -- an instant snap there used to
  inject a huge velocity into the REST of bgRope's own chain via the
  distance constraint, making it fly up far higher than mainRope on a
  strong punch) -- but capping that same point's speed is EXACTLY what
  now reads as visible lag/separation on a hard flick, since a strong
  punch can swing mainRope's own anchor by 130+px (measured, see that
  slider's own comment) faster than any reasonable cap allows it to
  follow. Fixed by splitting the 2 uses apart rather than picking one
  side: `render()` now builds `bgRenderPoints` (a shallow copy of
  `bgRope.points` with ONLY index 0 substituted for mainRope's own
  CURRENT anchor -- same object reference, not a value copy) and uses
  THAT for every draw call (`strokeRopeCurve`/`drawRopeEndArcs`/
  `drawEndcap`'s start-cap/the gradient's `worldTop`) instead of
  `bgRope.points` directly. The RENDERED start point is therefore
  bit-for-bit identical to mainRope's own anchor on literally every
  frame (guaranteed by construction -- same object, not a converging
  value), while `bgRope.points[0]` itself (and therefore the distance/
  bend constraint solve in `update()`) is completely untouched, so the
  2026-09-12 anti-overshoot fix for the REST of the chain
  (points[1] onward) is fully preserved. **One deliberate, much
  smaller visible tradeoff**: during the brief window where the eased
  physics point[0] hasn't caught up yet, the FIRST rendered segment
  (`bgRenderPoints[0]` -> `[1]`) can visibly stretch/compress rather
  than the whole rope staying perfectly taut -- reads as "a little give
  right at the anchor," not as the anchor itself detaching, which is
  what was actually reported and is now structurally impossible.
  **Any FUTURE code that reads `bgRope.points` for DRAWING must use
  `bgRenderPoints` instead** (built once per frame, right before the
  `if (introPhase !== 'waiting')` render block) -- reading the raw
  array again would silently reopen this exact bug for whatever new
  draw call did it. Physics/update()-side code (intro sequence,
  `maintainBgRopeEnd()`, the anchor-sync block itself) correctly keeps
  reading/writing `bgRope.points` directly, unchanged -- this split is
  render-only.
  **Corrected the SAME DAY (2026-09-15, ~10min later) -- the
  `bgRenderPoints[0] = mainRope.points[0]` substitution above must be
  GATED to skip 'waiting'/'rising'/'pausing', not unconditional.**
  Real, reported bug via a screen recording
  (`datalog/Recording 2026-09-15 023336.mp4`): on hard refresh, the
  background rope's start popped into view "above the circle" then
  appeared to "fall" to its offset, instead of climbing from
  just-out-of-sight below the circle as designed; after each full-rope
  cut, the fresh background rope's endcap appeared "aligned with the
  circle centroid" instead. Root cause: during those 3 phases,
  mainRope hasn't spawned yet -- it's a hidden, unpinned, gravity-driven
  1-segment rope whose own anchor wanders within `circleR` (see
  `introUnsettled`'s own boundary-radius comment in `update()`),
  completely unrelated to bgRope's own scripted climb. The
  unconditional substitution silently overwrote that ENTIRE scripted
  visual, every frame, with wherever mainRope's hidden anchor happened
  to be. `update()`'s own physics-side "pin to main rope" block (right
  above its own `integrateChain(bgRope.points...)` call) already
  excludes exactly these 3 phases for the identical reason -- the
  render-side version above was simply missing that same guard. Fixed
  by wrapping it in the identical `introPhase !== 'waiting' &&
  introPhase !== 'rising' && introPhase !== 'pausing'` check, so
  bgRope's own real `points[0]` (the scripted climb/hold value) renders
  during the intro sequence, and the anti-separation fix above still
  applies unchanged once mainRope has actually spawned ('growing'/
  'done'). **Any FUTURE render-time substitution/override of
  `bgRenderPoints[0]` (or any other bgRope render field driven by
  mainRope) must carry this same phase guard** -- the intro sequence
  drives bgRope's own values directly and any live-mainRope-linked
  override will silently fight it otherwise, exactly as this one did.
- **Cursor Animation's drag-anchor SPRITE target (`mainRope.
  dragSpriteTarget`) collapsed to a ZERO gap with the rope whenever the
  cursor sat beyond `hardLimit` -- fixed 2026-09-15, in 2 attempts, the
  first of which was itself wrong and caught before commit.** Per
  direct, dispositive report rejecting the earlier "investigated, no
  bug found / just the pickup window" conclusion (see that entry
  above): "no the leash mechanic i tested and which failed was far
  after i initially triggered the dragging function. I trigger the
  drag, then spent the next 5-10 seconds draggin the rope around. So
  its got nothing to do with mid interaction interruption." Root cause:
  the sprite's OLD target, `mainRope.dragCursorClamped`, was the raw
  cursor independently clamped ONLY by the rope's own large-scale
  `hardLimit` reach boundary -- the exact same clamp the rope's own
  Drag Anchor Leash target ALSO gets subjected to once the cursor
  exceeds it. Whenever the cursor sat beyond `hardLimit` (easy during
  any real multi-second drag), BOTH sprite and rope collapsed onto the
  IDENTICAL boundary point -- a Node simulation confirmed a steady 35px
  leash gap dropped to EXACTLY 0.0px the instant the cursor crossed
  `hardLimit`, for the entire remainder of the sweep beyond it,
  perfectly deterministic (not "sometimes"). **1st fix attempt (WRONG,
  caught by re-simulating before commit, never shipped):** made the
  sprite track `dragTargetPos` -- the Leash's own OUTPUT, captured
  BEFORE the endcap pull-back and BEFORE the `hardLimit` clamp. This
  traded the 0px-collapse bug for a WORSE, opposite one: `dragTargetPos`
  is itself unbounded (it only ever trails the raw cursor by
  `dragLeashRadius`, with zero `hardLimit` awareness), so once the
  cursor moved past `hardLimit`, the gap between sprite and the rope's
  now-clamped actual position GREW WITHOUT BOUND -- 696px in one
  simulated case (cursor at 1000 vs. hardLimit 300) -- a direct
  violation of the pre-existing 2026-09-13 "don't visually separate on
  a huge drag" requirement. **Correct fix:** compute the sprite target
  relative to `dragPoint`'s own FINAL position -- i.e. AFTER the
  endcap pull-back and the `hardLimit` clamp have both already been
  applied and assigned onto `dragPoint.x/y` -- as `dragPoint + unit(mouse
  - dragPoint) * min(dist, dragLeashRadius)`: free to coincide with the
  mouse when within `dragLeashRadius` of the rope's real position,
  clamped to exactly that radius (pointing toward the, possibly
  far-off-screen, cursor) once it isn't. Verified via a Node simulation
  sweeping cursor distance from 20px to 3000px against a representative
  `hardLimit`/`dragLeashRadius` pair, for BOTH an interior drag point
  and the tip (with the endcap pull-back's own extra offset folded in):
  the gap held at EXACTLY `dragLeashRadius` at every single sampled
  distance, on both sides of `hardLimit` -- never 0, never unbounded.
  **Any FUTURE change to this sprite-target stash must compute it from
  `dragPoint`'s own FINAL (post-hardLimit, post-endcap-offset)
  position, never from an intermediate pre-clamp value** -- the 1st
  attempt's failure mode (an unbounded-growing gap) is easy to miss in
  a quick visual check near `hardLimit` and only shows up clearly once
  the cursor is dragged much further out, which is exactly the
  "5-10 second drag session" scenario the user's own report described.
- **Drag by the endcap's own visual TIP uses an EXACT pull-back now
  (2026-09-15, 3rd pass on this mechanism) -- `pull = Math.min(extension,
  rdist)`, not the previous smooth blend `pull = extension * rdist /
  (rdist + extension)`.** Real, reported bug: "I line [the interaction
  point] to the tip of the end cap... but... it makes me drag it by the
  base of the end cap... same thing as before." The 2nd-pass blend was
  documented in its OWN comment as a known approximation, and it's a
  significantly lossy one at exactly the drag distances a user actually
  performs -- at `rdist === extension` (a drag roughly as long as the
  endcap itself, easily 100+px at default settings) it only ever
  compensates 50% of the true extension; even at `rdist = 3x extension`
  it's still only 75%. **The exact fix is simpler than the blend it
  replaces**: `prevPt`, the eventual physics point, and `dragTargetPos`
  are meant to be COLLINEAR, with the physics point sitting exactly
  `extension` px back from `dragTargetPos` along that line -- so
  `pull = extension` outright (not a fraction) makes `physicsPoint +
  direction*extension` land EXACTLY on `dragTargetPos`, algebraically,
  by construction. `Math.min(extension, rdist)` is the one guard needed
  on top, for when the cursor sits closer to `prevPt` than the endcap's
  own fixed length allows -- there is no position that makes a rigid
  `extension`-long tip reach it exactly in that case (the near end
  would have to sit BEHIND `prevPt`), so clamping `pull` to `rdist`
  collapses the physics point onto `prevPt` exactly as `rdist ->
  extension` from above (continuous, not a snap) and keeps it there for
  anything closer -- the correct "as close as achievable" answer for a
  genuinely-unreachable target, not a bug to smooth away. **Verified via
  a Node-level simulation** sweeping `rdist` from below `extension` to
  10x `extension`: the rendered tip (`target + direction*extension`)
  landed EXACTLY on the cursor at every sampled distance `>= extension`,
  and correctly collapsed to `prevPt` (with the tip geometrically
  overshooting the unreachable cursor, as expected) below it.
  `extension` is also now multiplied by `mainRope.endcapStretchMult`
  (def 1, only ever `!=1` while Deformable Endcap's own stretch is
  active -- see that feature's own gotcha) -- the deformable renderer's
  ACTUAL rendered length is `extension * stretchMult`, not the static
  rigid `extension` alone, so leaving this out would let the visual tip
  creep away from the cursor again as stretch grows during a hard pull.
  Read from LAST frame's value (this frame's own `stretchMult` is
  computed later in the same block, from the `ddist` this pull-back is
  about to produce -- a genuine circular dependency) -- same one-frame-
  lag convention already used elsewhere in this file for equivalent
  cases, not visually distinguishable from same-frame at 60fps.
- **Drag Rope's arm-time point selection now has an endcap-tip proximity
  qualifier (2026-09-15), per direct request/spec: "add a qualifier
  that when the click drag is triggered a certain distance from the
  endcap base or end, you compare that with the closest rope point,
  then whichever is closer you make that the drag point."**
  `nearestPointOnRope()` has no knowledge of the endcap's own rendered
  TIP (a purely decorative point `endcapExtensionPx()` world-px PAST
  `points[length-1]`, along the last segment's tangent) -- it only ever
  walks real physics segments, so a press that's visually closer to the
  drawn endcap tip than to any real rope point could still resolve
  `hit.index` to an EARLIER point, reported as "still making me drag
  from the end of the last non endcap segment." Fixed in `onPointerDown`'s
  drag-arm callback (right before `downInfo.dragIndex` is set): computes
  the same virtual tip point (reusing `tipDirection()`/`endcapExtensionPx()`,
  the exact helpers the per-frame pull-back below already uses) and
  compares its distance to the press against `hit.dist` -- whichever is
  closer decides. Only ever forces `dragGrabIndex = points.length-1`
  when the tip is genuinely closer; never overrides a press that's
  actually closest to some other real point. Verified via a Node
  simulation of the exact hit-test+qualifier math across 5 click-
  position cases (at the tip, halfway to the tip, off-axis near the
  tip, on the 2nd-to-last segment itself, near an unrelated interior
  point) -- not live-browser-verified (this environment's recurring
  dev-server page-boot stall, documented above).
  **This qualifier makes grabbing the tip succeed far more reliably
  than before, which in turn newly exposes a real, pre-existing, 100%-
  reproducible discontinuity in the pickup-to-active handoff specifically
  for tip drags -- DIAGNOSED but NOT YET FIXED as of this entry.** Root
  cause: the 7th-pass cursor realignment (`mouseX = dragPoint.x`, see
  that gotcha above) aligns the tracked cursor to the RAW physics
  joint's own position, but the endcap pull-back a few lines later
  assumes the (pre-pull-back) target represents where the cursor/
  rendered-tip wants to be, and unconditionally subtracts up to
  `min(extension, segLen)` from it -- so the instant pickup ends, the
  joint jumps backward by that amount even with ZERO cursor movement
  (confirmed via simulation: a representative segLen=20/extension=30
  case produced a 20px jump with no cursor movement at all). Since
  adjacent joints sit at ~segLen apart by construction, this fires on
  effectively every tip-drag, not intermittently. **If/when this is
  fixed, the realignment step needs to account for the endcap offset
  when `dragPinIndex === points.length-1`** (align to joint+extension,
  not just the joint) -- don't just retune the pull-back's own math,
  the mismatch is between these 2 separate blocks agreeing on what
  "the drag point" means.
- **Interaction-point data sync (2026-09-15)** -- a fresh annotated
  data drop covering drag/sciss/flick/tickle again. Diffed against the
  live table values before editing anything: Drag→48
  (`MOUSE_FLICK_DRAG_END_POINTS`), Flick→01
  (`MOUSE_FLICK_INTERACTION_POINTS.default`), and Tickle→01 (sorted by
  Y into Base/Top per the established convention -- feeds
  `MOUSE_FLICK_VISIBLE_BOUNDS.base`/`MOUSE_FLICK_POINTING_TOP`) were
  ALL byte-identical to what was already in the code for all 8
  directions -- left untouched. Only Drag→01
  (`MOUSE_FLICK_INTERACTION_POINTS.drag`, the arm-time distance-gate
  point) and Sciss→01 (`MOUSE_FLICK_INTERACTION_POINTS.cut`) genuinely
  changed -- updated to the new values. **Before syncing a future data
  drop, diff every category against the live table first** (as done
  here) rather than assuming a full re-paste means every category
  changed -- this one didn't, and rewriting identical data would just
  be unnecessary diff noise.
- **`cfg.minRopeLength` must always stay ABOVE `cfg.segmentLength`, or
  the full-rope-detach trigger becomes mathematically unreachable from
  any click position -- this is a real relationship between 2
  independently-tunable sliders, not just "pick reasonable individual
  values."** Real, reported bug (2026-09-15): "right now when i try to
  cut the rope beyond the min length, it doesnt trigger a full cut."
  `cutRopeAt()`'s full-detach check is `remainingLen < vh(cfg.
  minRopeLength)`, where `remainingLen = idx * mainRope.segLen` and
  `idx` is always clamped to `Math.max(1, ...)` -- so the SMALLEST
  possible `remainingLen` from any partial cut is exactly
  `1 * segLen = cfg.segmentLength` (in %vh terms). If `minRopeLength <=
  segmentLength`, that check can never be satisfied, REGARDLESS of
  where the click lands -- not intermittent, structurally impossible.
  Found via diffing the live `data/processed/dev-panel-settings.json`
  directly (`minRopeLength: 0.8` vs `segmentLength: 0.9`) -- same "check
  the actual saved value" precedent as every prior data-drift bug in
  this file. Fixed as a pure DATA change (`minRopeLength: 0.8 -> 1`) --
  no code touched, the check itself was always correct. **If
  `segmentLength` is ever retuned upward again, re-verify
  `minRopeLength` still exceeds it** -- there's no code-level guard
  enforcing this relationship, only this gotcha.
- **`bendStiffness`, `damping`, and `maxPunchSegments` had ALL
  independently drifted well outside their own previously-measured-safe
  ranges in the live settings file (2026-09-15), reported as "the new
  endcap mode is causing some physis issues... jittering / flashing /
  sudden physics when growing... cut rope segments collide... the rope
  is falling."** Not an endcap bug at all -- pure live tuning-data
  drift, most likely from experimentation happening in the same
  session as an endcap-settings reorganization (hence the mistaken
  attribution). `bendStiffness` was down to `0.05` (vs. the
  extensively-measured-safe `0.15` from this file's own earlier
  bend-stiffness gotcha -- below that threshold, a strong dynamic event
  left a chain permanently kinked); `maxPunchSegments` was at `100`
  (vs. slider-declared max `20`, code default `4` -- someone had typed
  directly into the numeric readout, which the dev panel's own
  click-to-type convention allows even outside the slider's own
  bounds) -- this is the exact safety cap `applyPunch()` exists to
  enforce, effectively disabled at 100x; `damping` had crept to
  `0.988`, back toward the pre-fix `0.99` zone this project already
  measured as leaving a punch visibly swinging for ~3.65s. Restored all
  3 to their previously-tested-safe values (`0.15`/`0.85`/`4`) as a
  pure data change. **When a physics-feel complaint arrives after ANY
  unrelated feature work, check these 3 values (plus `minRopeLength`
  above) in the live settings file before assuming the new feature
  itself is the cause** -- none of this project's own physics constants
  have a code-level floor/ceiling beyond the dev panel's own slider
  bounds, and the click-to-type mechanism can push a value arbitrarily
  far outside even those.
- **`hitTestRope()`'s `isOnCircle()` exclusion gate must always check
  the REAL press/release position, never a FLICK MOUSE-substituted
  interaction point -- fixed 2026-09-15, following directly from the
  `minRopeLength` fix above.** After that fix made the full-detach
  condition mathematically reachable again, the user reported it still
  didn't trigger from a rope double-click outside the circle -- then
  gave the decisive diagnostic clue: "rope full cut works when i do
  double click with my true cursor" (i.e. only fails when FLICK MOUSE
  is active and its own substitution is in play). Root cause:
  `hitTestAny()`'s 2 real callers (double-click cut, single-tap punch
  arm) both pass the FLICK MOUSE-substituted interaction point (the
  2026-09-12 "measure distance to the annotated point, not the true
  cursor" feature) as the same `x, y` used for BOTH the distance-to-
  rope measurement AND the `isOnCircle()` circle-exclusion check --
  correct for the former, never intended for the latter. The
  substituted point sits at a real, pose/direction-dependent offset
  from the true cursor; close enough to the anchor under common poses
  to trip `isOnCircle()` even when the actual click was genuinely
  outside the circle, silently rejecting the hit-test before
  `cutRopeAt()`'s own `remainingLen < minRopeLength` check was ever
  reached. Fixed by adding optional `circleCheckX/Y` params to
  `hitTestRope()`/`hitTestAny()` (defaulting to `x, y` so nothing else
  changes), with both call sites now passing the REAL press/release
  position (`e.clientX/Y` for cut, `info.x/y` for the click arm) for
  the circle check specifically, while the substituted point still
  drives the actual distance measurement, unchanged. Verified via a
  Node simulation: a true click at distance 15.03 from the anchor
  (outside a 13.25-radius circle) with a substituted point at distance
  2.19 (inside it) -- OLD code returned `null` (rejected), NEW code
  correctly resolves the target. **The single-tap punch arm check
  (`onPointerUp`'s `nearAny` gate) had the exact same latent bug** --
  fixed alongside the reported cut case since it's the same underlying
  mechanism in the same shared function, not a separate investigation.
  Note in passing: `circleExclusionRadius()`'s own comment (and
  `isNearCircleCenterForGrow()`'s) still references "cutRopeAt()'s own
  Circle Cut Distance floor" -- that mechanism (`cfg.circleCutDistance`)
  no longer exists anywhere in this file (confirmed via grep) and this
  fix doesn't revive it; the comment is stale and should be corrected
  whenever that area is next touched, not urgent enough on its own to
  justify a separate pass right now.
- **Deformable Endcap's own curvature formula (`endcapSpineSample()`)
  divided by the rope's LAST segment length with no floor -- fixed
  2026-09-15.** Real, reported bug: "the physics of the new endcap
  model looks nice, but sometimes it bends and bounces all over the
  place." `angleRate = atan2(cross,dot) / len2 * bendStrength` used
  `len2` (the last segment's own length) as the divisor -- during ANY
  growth session, `points[length-1]` is the actively growing tip, whose
  distance from `points[length-2]` IS `mainRope.tipGrowLen`, which
  ramps up from near-zero on EVERY growth (initial spawn, every
  post-cut regrow, every hold-to-grow -- see that mechanism's own
  gotcha). A perfectly ordinary ~20deg bend between segments, combined
  with a near-zero `len2`, blew `angleRate` up by 2 orders of
  magnitude -- confirmed via Node simulation: a 0.3px last segment at a
  20deg bend produced a 100deg total spine turn over a mere 15px walk,
  vs. 0.37deg for the same angle at a normal ~20px segment length.
  Fixed by flooring the divisor at `len1 * 0.5` (`len1` = the SECOND-
  to-last segment, the more stable of the two since it's never the
  actively-growing one) -- verified via simulation this degrades
  smoothly as `len2` grows back toward `len1` (no discontinuity
  anywhere in the sweep) and leaves the settled-rope case unchanged
  (same `angleRate` as before whenever `len2 >= len1`, which is the
  normal at-rest case). **If a future report says the deformable
  endcap still whips/bounces, check whether some OTHER path can also
  produce a very short last segment** (a near-anchor cut leaving a
  2-point rope, an extreme drag, etc.) before assuming this exact fix
  is insufficient -- the floor is relative to `len1`, so it only helps
  when `len1` itself is a normal, stable length.
- **Circle Grow's own trigger measurement (`isNearCircleCenterForGrow()`)
  was using the raw press position directly at both its call sites,
  never any FLICK MOUSE-substituted interaction point -- fixed
  2026-09-15.** Real, reported bug: "double check if click to grow in
  the circle uses the write [right] interaction point. It should not
  be using the true cursor nor the base point of the frames... right
  now its acting as if its using the true curser." The `'hold'` purpose
  was already registered in the 2026-09-12 interaction-points tables
  (`MOUSE_FLICK_INTERACTION_POINT_KEY.hold = 'default'`, sourced from
  the "Flick" annotated category per that feature's own comment --
  matching the user's own recollection, "the Flick one") specifically
  for Click And Hold Distance -- the SAME `cfg.holdDistance` slider
  `isNearCircleCenterForGrow()` already reuses per its own gotcha --
  but neither of `onPointerDown`'s 2 call sites (the circle-branch gate,
  and `startedInCircle`) ever actually routed through it. Fixed by
  computing `mouseFlickInteractionPos(x, y, 'hold')` ONCE at the top of
  `onPointerDown` (both call sites must agree on the identical
  substituted point for the same press) and passing that into both
  calls instead of the raw `x, y`.
- **Background rope now tangent-matches the main rope at their shared
  seam every frame (2026-09-15)** -- per direct request: "I want the
  background ropes physics to act exactly the same as the main rope.
  such that if i flick the main rope from below really hard and it
  causes the background rope to lift, it should look like 1 continuous
  rope without a jog or sharp bend in the middle." Root cause: `bgRope`
  is a completely separate physics chain from `mainRope` -- only its
  own ANCHOR (`bgRope.points[0]`) was ever driven toward `mainRope`'s
  anchor (capped at Background Rope Anchor Max Speed); everything past
  that swings on its own independent gravity, with zero awareness of
  `mainRope`'s own shape (this was explicit prior design -- see that
  slider's own gotcha: "so it swings on its own rather than mirroring
  mainRope's body shape... per explicit request"). A hard flick can
  swing `mainRope`'s own anchor 130+px (measured elsewhere in this
  file); `bgRope`'s anchor chases it at a bounded speed while its own
  body is still hanging from where it used to be, visibly kinking the
  seam. **Of 2 possible fixes presented (lighter kinematic tangent-
  matching vs. fuller anchor-velocity coupling), the user chose the
  lighter one.** Implemented by rotating ONLY `bgRope.points[1]` around
  the (already anchor-updated) `bgRope.points[0]` so bgRope's own
  first-segment tangent always exactly matches `mainRope`'s current
  first-segment tangent -- `points[2]` onward are left to the normal
  constraint solve immediately after (`integrateChain()`), so the
  correction ripples down the rest of the chain the same way any rope
  reacts to its own anchor moving, rather than rigidly rotating the
  whole tail at once every frame. Rotates `p.oldx/oldy` by the SAME
  angle as `p.x/y` -- the identical "preserve momentum, don't zero or
  spike it" pattern `topplePiece()` already uses (see that function's
  own comment for the full derivation of why mismatched old/current
  reference frames produce a real, wrong-direction velocity artifact).
  Verified via a Node simulation (a simulated 60deg sudden tangent
  swing): post-correction, bgRope's tangent matched mainRope's exactly,
  the point's distance from the anchor was preserved bit-for-bit, and
  the implied per-frame velocity was a rotated version of its own prior
  relative velocity -- never zeroed, never spiked. Gated inside the
  SAME `introPhase !== 'waiting'/'rising'/'pausing'` block as the
  anchor-follow code just above it, for the identical reason (during
  those phases bgRope's own position is driven by the intro's own
  scripted climb instead, and this correction would fight it). Not
  live-browser-verified (this environment's recurring dev-server
  page-boot stall, documented elsewhere in this file).
- **SUPERSEDED the SAME DAY, 2026-09-16 -- the tangent-matching entry
  directly above only fixed the visible ANGLE at the bgRope/mainRope
  seam; the underlying position+velocity coupling was still capped and
  independent.** Per direct follow-up: "actually make background rope
  match main rope behaviour exactly." Replaced BOTH the capped-speed
  anchor chase (`Background Rope Anchor Max Speed`, since REMOVED --
  see its own now-corrected comment) AND the tangent-matching rotation
  above with a single, simpler mechanism: every frame,
  `bgRope.points[0].x/y` AND `.oldx/.oldy` are copied DIRECTLY from
  `mainRope.points[0]`, uncapped -- not just position. This is the
  critical difference from the ORIGINAL pre-2026-09-12 bug ("the
  background rope seems to fly up far higher than... the main rope
  start anchor"): that version snapped ONLY position while leaving
  bgRope's own stale, independently-drifting old-position in place --
  pairing a NEW position with an UNRELATED old reference frame, the
  exact "mismatched reference frame produces a wrong-direction/
  wrong-magnitude velocity artifact" bug class this project already
  diagnosed and fixed once in `topplePiece()`. Copying BOTH values
  together makes bgRope's anchor's own IMPLIED velocity bit-for-bit
  IDENTICAL to mainRope's, every frame -- the two anchors become
  kinematically indistinguishable, not merely position- or angle-
  matched. **Verified via a Node simulation reproducing the ORIGINAL
  bug's exact scenario** (a mainRope anchor drifting slowly, then
  swinging 130px/-20px in one frame from a strong punch, per that
  slider's own prior measurement): the OLD snap-position-only approach
  produced an implied bgRope velocity of `(180.2, -120.1)` -- roughly
  DOUBLE the real `(130, -20)`, matching "flies higher than mainRope"
  exactly -- while this matched-pair copy produced `(130, -20)`, an
  EXACT match. This project's own prior investigation of the original
  bug (see `Background Rope Anchor Max Speed`'s own former comment,
  preserved in the CHANGELOG) had ALREADY measured that capping speed
  barely helped the core symptom (under a 7% reduction even at the
  most aggressive clamp tested) and explicitly named this exact fix as
  the more complete one, deferred at the time as a follow-up decision
  -- this entry is that follow-up. Any subsequent whip/overshoot
  through bgRope's own chain is now genuine, correctly-scaled rope
  physics reacting to the SAME real anchor motion mainRope itself
  experiences (both use the same globally-shared damping/bendStiffness/
  constraintIterations already) -- not an artificially bounded or
  amplified substitute. `Background Rope Anchor Max Speed` had no
  mechanism left to control and was removed outright, per this
  project's own "an inert slider that visibly does nothing is worse
  than no slider" convention. **If a future report says bgRope's own
  reaction to a hard flick now feels TOO strong, the right fix is a
  NEW, honestly-named coupling-strength control on this exact
  mechanism (e.g. a multiplier on the copied velocity before it's
  applied) -- not reintroducing the old capped-chase slider**, which
  this entry's own simulation shows barely worked anyway. Not
  live-browser-verified (same recurring dev-server page-boot stall).
- **`cfg.maxPunchSegments` (a segLen-MULTIPLE slider) is REPLACED by
  `cfg.punchPowerAbsolute` (an ABSOLUTE, segLen-INDEPENDENT %vh target)
  -- 2026-09-16.** Per direct follow-up, after being shown exactly
  which of this file's own segLen-dependent formulas are genuinely
  structural (the rope's own rest-length, total-length bookkeeping,
  reach limits, growth-completion tracking -- these can't be
  "decoupled" without changing what a rope even IS) vs. this one
  specific policy tradeoff (a safety multiplier that could instead
  auto-scale): "yeah tahts right" to auto-scaling the dependent
  slider's own effective value inversely with segLen, so the delivered
  punch power stays constant as Segment Length is retuned, without
  manually re-touching the punch slider every time. **The underlying
  safety property is completely UNCHANGED** -- a punch must still never
  displace a point by more than `PUNCH_SEGMENTS_SAFE_RANGE.max` (20,
  a new internal, non-user-facing constant, same value the old
  slider's own max already was) times the CURRENT segLen, preventing
  the exact "dark flash" chain-inversion bug this whole mechanism
  exists to prevent (see `applyPunch()`'s own header comment for that
  bug's full account) -- what changed is only HOW the effective
  multiplier gets chosen each call: `effectiveMaxPunchSegments =
  clamp(vh(cfg.punchPowerAbsolute) / segLen, 1, 20)`, then
  `power = min(vh(1.0)*intensity, segLen * effectiveMaxPunchSegments)`
  exactly as before. Default (`180/19`, i.e. `45/19 * 4`) is chosen so
  this reproduces the OLD behavior bit-for-bit at `cfg.segmentLength`'s
  own CODE default (`45/19`%vh) -- verified via a Node simulation
  across 4 segLen values: exact match at the old default segLen
  (`effective=4, powerCap=9.4737`), full compensation at the live short
  segLen (`effective=10.53, powerCap` still exactly `9.4737` -- the
  SAME absolute power, not degraded), correct clamping to the safe
  ceiling at an extreme-short segLen (`effective=20` exactly, never
  higher), and correct clamping to the safe floor at a long segLen
  (`effective=1` exactly, never lower). **If `cfg.segmentLength` is
  ever retuned, this now needs NO companion retune of the punch power
  setting** -- the whole point of this change -- **unless segLen moves
  so far that even the established-safe 1x-20x range can't reach the
  desired absolute power, in which case it degrades gracefully to
  whichever end of that range is closer, exactly as intended, not a
  bug to chase.** `cfg.maxPunchSegments` no longer exists anywhere in
  this file (the key is gone from `DEV_GROUPS`/the controls array;
  any live saved settings file's own stray `maxPunchSegments` value or
  group-order reference is harmless and will self-clean on the next
  real Save -- same precedent as `bgRopeAnchorMaxSpeed`'s own removal
  above).
- **Drag Rope by the endcap's own visual TIP now targets an artist-
  ANNOTATED point (`data/Rope/Form 1--01-Dot.svg`), not the shape's own
  literal geometric bottom-most pixel -- 2026-09-16.** Per direct
  data drop: "i exported an svg with the word dot or point in it. its
  for End 1 Form 1. Its the same endcap shape, but theres a circle as
  well. the centroid of that circle is where the drag point should be
  if dragging by the endcap." Confirmed the new file's own `<path>` `d`
  is BYTE-IDENTICAL to `ENDCAP_DESIGNS['form1-01'].d` before trusting
  its coordinate space -- the circle's centroid (`cx=69.09, cy=134.34`)
  is therefore directly usable in the SAME raw coordinate system
  `ENDCAP_ALIGNMENT`/`FORM1_01_SKIN` already use, no separate alignment
  needed. `ENDCAP_BOTTOM_Y['form1-01']` (the browser's own `getBBox()`-
  derived shape bottom, used to normalize every other annotated point
  in this file) isn't available outside a live browser, so it was
  independently recomputed via exact cubic-bezier extrema math (not
  just anchor/control-point bounds, which would be inexact for a
  curved shape) -- `135.99375726547783` -- cross-checked against
  `ENDCAP_ALIGNMENT`'s own already-hand-measured `topY`/width, which
  matched to within 0.01 units, giving high confidence in the
  computation. The dot resolves to `t ≈ 0.9703` (97% of the way down
  the shape's own local axis, NOT `t=1.0` -- the true grabbable spot
  sits noticeably short of the shape's absolute tip) and
  `lx ≈ 0.275` (a small, ~0.5%-of-width lateral offset from
  centerline, DELIBERATELY DROPPED when feeding the drag pull-back math
  -- that math has always been 1-dimensional, along-tangent only, and
  this lateral component is too small relative to the existing
  precision to justify extending it to 2D). New `dragPointExtensionPx()`
  wraps the existing `endcapExtensionPx()`, multiplying by
  `FORM1_01_DRAG_POINT_T` ONLY when the live endcap design IS
  `form1-01` (the sole shape with this annotation) -- every other
  design falls through to the unmodified full-extension behavior,
  exactly as before this feature existed. Wired into BOTH of Drag
  Rope's own endcap-tip mechanisms so they agree on the identical
  target: the arm-time qualifier (deciding whether a press is close
  enough to the endcap tip to grab it) and the per-frame pull-back
  (positioning the underlying physics point so the endcap's own
  rendered extension reaches the cursor). `FORM1_01_DRAG_POINT_T` is
  computed from the live `ENDCAP_BOTTOM_Y['form1-01']` at load time
  (not a hardcoded precomputed fraction), so it stays correct
  automatically if `form1-01`'s own source SVG shape is ever replaced
  again -- same "computed from real path data, not hand-measured"
  convention `ENDCAP_BOTTOM_Y`/`ENDCAP_TIP_WIDTH` already established.
  Verified via Node: the raw constants as actually written in the file
  were extracted and independently recomputed, matching the original
  derivation to full floating-point precision. Not live-browser-
  verified (this environment's recurring dev-server page-boot stall).
  **This is a SEPARATE fix from the still-UNFIXED Drag Pickup jump
  bug** (see that dedicated entry above,
  "endcap-tip qualifier... makes grabbing the tip succeed far more
  reliably... newly exposes a real, pre-existing, 100%-reproducible
  discontinuity") -- this entry changes WHERE the drag target sits;
  that entry is about a timing/handoff discontinuity in reaching it.
  Both may need to be addressed for "dragging the endcap" to feel
  fully correct.
- **`data/Rope/Form 1--01-Dot.svg` is a NEW, currently-UNTRACKED asset
  file as of this entry** -- the source of the annotation above. Should
  be `git add`ed alongside the code change that consumes it (its own
  raw data is now hardcoded into `index.html` as
  `FORM1_01_DRAG_POINT_RAW`, but the source file itself is worth
  tracking as provenance, same "nothing gets deleted by default"/asset-
  tracking convention already applied to the `*-Curves.svg` reference
  files). **UPDATE, same day:** tracked and pushed shortly after this
  entry (commit `9c83b62`) -- this note is left as-is (append-only)
  rather than rewritten, since it accurately describes the state at the
  moment it was written.
- **6 drag/physics feature requests landed together, 2026-09-16** --
  per a single direct multi-item request. Each briefly:
  1. **Pickup-realignment jump (tip drags), FIXED.** Real, reported bug:
     "the Drag Pickup Duration is working as i intended... The problem
     is that once that duration is over, the app uses my (now moved)
     true cursor position. so the cursor frame and the rope suddenly
     snap to the moved location." This is the SAME root cause diagnosed
     (but not yet fixed) in the still-standing "Drag Pickup jump" entry
     above -- the 7th-pass realignment targets the RAW physics joint,
     but the endcap pull-back assumes the tracked cursor represents the
     endcap's own rendered drag point (extension included), pulling the
     joint backward by up to that extension the instant pickup ends,
     even with zero real cursor movement. Fixed by realigning to
     `dragPoint + tipDirection * dragPointExtensionPx(...)` when
     dragging the tip with an active endcap, matching exactly what the
     pull-back itself targets. Verified via a Node simulation
     reproducing the exact pickup->leash->pull-back sequence with ZERO
     real cursor movement: residual displacement dropped from the full
     extension (30px in the simulated case) to exactly the leash radius
     (4px) -- the leash's own normal, always-present "give," not a
     pickup-specific discontinuity.
  2. **No thinning on a short rope, FIXED.** Real, reported: "when the
     rope is short, a drag causes no thinning... i want atleast some
     thinning." Root cause: `mainRope.overstretchActive`/`overstretchDepth`
     were 100% gated on `overstretchFrac > 0` (i.e. on actually
     EXCEEDING `maxDragDist`) -- for a short rope, `maxDragDist` is
     itself small, so an ordinary drag well within it produced zero
     thinning. New `cfg.dragMinThinDepth` slider (def `0.15`) floors
     the thinning depth to a constant baseline whenever ANY drag is
     active, with the existing progressive overstretch-based depth
     still able to ramp PAST that floor exactly as before
     (`Math.max(dragMinThinDepth, overstretchFrac * overstretchMaxThinDepth)`).
     Still gated by the existing `Overstretch Thinning Enabled`
     checkbox, whose own scope now broadens slightly from "thinning
     caused by overstretch" to "rope thinning while dragging" in
     general.
  3. **Drag Mouse Sensitivity slider, ADDED.** New
     `cfg.dragMouseSensitivity` (def `1`, pure no-op at default).
     Rather than remapping the leash target to an absolute scaled
     position, `update()`'s drag-pin block now tracks a SEPARATE,
     persistent state pair (`downInfo.dragSensCursorX/Y`,
     `downInfo.dragSensLastRawX/Y`), advanced each frame by the REAL
     cursor's own frame-to-frame DELTA times this multiplier -- so
     "0.5" genuinely means "the rope moves half as far for a given
     mouse movement" at ANY point mid-drag, not "the rope tracks a
     point halfway between the anchor and the cursor" (a different,
     less useful effect this approach avoids). Initialized at the SAME
     instant as the (now endcap-aware) pickup realignment, so it starts
     exactly continuous with the realigned cursor rather than banking
     whatever the raw mouse did during the pickup freeze. The Drag Anchor
     Leash now targets this scaled cursor instead of raw `mouseX/mouseY`
     -- the Cursor Animation sprite's own position automatically
     inherits the same reduced sensitivity as a side effect, since it's
     derived FROM the rope's own resulting position, not from the raw
     cursor directly; no separate change needed there. Verified via
     simulation across a 5-frame drag sequence: sensitivity=1 exactly
     reproduces raw mouse tracking (byte-for-byte), sensitivity=0.5
     produces exactly half the total displacement for the same mouse
     movement.
  4. **Overstretch -> sensitivity, with an interactive draggable curve
     graph, ADDED -- the largest single item.** Per direct request, and
     an explicit choice between 3 offered UI-scope options ("just a
     Min Sensitivity slider" / "slider + static preview graph" / "a
     real interactive draggable curve editor") -- the user chose the
     full interactive editor. New `cfg.dragOverstretchMinSensitivity`
     (def `1`, pure no-op) defines the sensitivity multiplier at FULL
     (100%) overstretch; at 0% overstretch the multiplier is always
     1.0, linearly interpolating between the two. Composes
     MULTIPLICATIVELY with item 3's own `dragMouseSensitivity` -- 2
     independent reductions, not a replacement for one another. Reads
     `mainRope.overstretchPx` from LAST FRAME to compute this frame's
     multiplier -- a genuine circular dependency otherwise (this
     frame's own overstretch amount can only be known AFTER the
     sensitivity-scaled leash has already decided where the drag point
     ends up) -- same one-frame-lag convention this file already
     established for the identical problem
     (`mainRope.endcapStretchMult`'s own comment). Verified via
     simulation across 5 cases including the composed (item 3 x item 4)
     scenario, all matching hand-computed expected values exactly.
     **The interactive widget itself** (`buildOverstretchSensitivityCurveWidget()`)
     is a hand-built SVG, following this project's OWN established
     "Mouse Log" pattern for a custom dev-panel widget that doesn't fit
     the generic slider/checkbox/dropdown system -- injected directly
     after the paired slider's own row via `findRowByKey()` +
     `insertAdjacentElement`, NOT registered as its own `DEV_GROUPS`
     control (the slider stays the single source of truth; the widget
     is purely an additional view/edit surface, 2-way synced). A
     straight line from a FIXED left point (0% overstretch, sensitivity
     always 1.0, deliberately non-draggable) to a DRAGGABLE right point
     (100% overstretch, sensitivity = the slider's own live value) --
     dragging the handle updates the slider via the existing
     `syncControlDisplay()` helper; moving the slider updates the
     widget via a plain `'input'` listener. **Honest limitations,
     stated plainly rather than glossed over:** (a) the widget can go
     briefly stale if the underlying value changes through a path that
     doesn't fire the slider's own `'input'` event (e.g. a Reset/Load
     calling `syncControlDisplay()` directly) -- acceptable since the
     slider remains authoritative and the widget re-syncs on its own
     next interaction; (b) NOT reorder-aware -- if the paired row is
     ever drag-reordered elsewhere in the panel, the widget stays a
     plain DOM sibling of wherever that row USED to be; (c) **the
     actual live pointer-drag GESTURE has not been exercised in a real
     browser** (this environment's recurring dev-server page-boot
     stall, same limitation as nearly every fix in this project's
     history) -- only the pure coordinate math (`valueToY`/`yToValue`)
     was verified, via Node, to round-trip exactly and orient correctly
     (sensitivity=1 renders at the TOP of the graph). The drag-handling
     code itself follows the SAME `tryCapture()`/pointer-capture
     pattern every other draggable element in this panel already uses
     (group/row drag-reorder, the 8 resize handles), which is the
     strongest available evidence of correctness short of an actual
     live test.
  5. **Direction/animation-type lock during drag, EXTENDED.** Real,
     reported: "WHen i initiate a drag, during the drag animation
     sequeunce as well as the drag pickup duration, dont transition to
     a different animation type." The existing direction-lock condition
     already excluded `'click'`/`'sciss'`/`'dragRelease'` `mfMode`
     values, but NOT the active forward-drag window -- because (a real,
     slightly surprising finding) there is no `mfMode === 'drag'`
     STRING value anywhere in this file at all; the active-drag window
     is tracked via the SEPARATE boolean `downInfo.dragging`, already
     exposed as `mfDragActiveForAngle` a few lines above this exact
     lock (for the angle-reference override). Added `!mfDragActiveForAngle`
     to the lock condition, reusing that exact existing flag rather
     than introducing a new one -- covers BOTH the pickup-easing window
     AND the active-dragging window in one change, since
     `downInfo.dragging` is true for the entire span of both, only
     going false once a real release starts (`'dragRelease'`'s own
     pre-existing exclusion takes over from there).
  6. **Ceiling Bounciness, ADDED, separate from Wall Bounciness.** Real,
     reported: "Provide a slider for ceiling and wall bounciness. as in
     when the rope collides with the browser top edge or side edges,
     what level of bounce there will be." `clampToWalls()` previously
     used the SAME `cfg.wallBounciness` value for all 3 edges it
     handles (left/right/top) -- new `cfg.ceilingBounciness` (def `0`,
     same range as `wallBounciness`, pure no-op) now governs the TOP
     edge specifically, leaving `wallBounciness` scoped to left/right
     only. Wall Friction (the tangential component) stays shared/
     unchanged -- only the normal-axis bounce was asked to be split
     out.
  Items 1/2/3/5/6 verified via Node simulation exactly as every other
  fix in this project's history has been (this environment's recurring
  dev-server page-boot stall still applies) -- item 4's FUNCTIONAL
  formula is equally well-verified; only its NEW interactive-widget UI
  layer carries the honest, stated live-testing gap described above.
  Landed unusually fast relative to their combined initial estimate (a
  6-item, ~50-78 minute plan completed in well under 10 minutes) --
  the smaller items (1/2/5/6) were simpler in practice than their
  estimates assumed once the underlying mechanisms were already
  understood from investigation; item 4, genuinely novel work, still
  landed far faster than its own independent estimate, which is worth
  noting as a possible signal for recalibrating similarly-scoped
  "new dev-panel widget" work in the future, though this is a single
  data point, not yet a pattern.
- **Dev Panel search bar (2026-09-17)** -- a Ctrl+F-style finder for
  group/setting names, sitting above the "Saved Dev Settings" group.
  Went through 4 direct rounds of clarification before landing on its
  final shape, each one changing a real behavioral assumption, not just
  wording:
  1. Original ask: highlight every match live, expanding groups as
     needed, "until next click."
  2. "dont do the expanding and scroll thing if i havent hit enter yet"
     -- typing alone (`input` event) only recomputes
     `devPanelSearchMatches` and shows a plain `N found` count; nothing
     expands, scrolls, or highlights until Enter.
  3. "also, like ctrl F ... if i hit enter, it will auto scroll me to
     the first instance, then if i hit enter again, it goes to the next
     one" -- Enter navigates (first press = index 0, since
     `devPanelSearchActiveIndex` starts at `-1` and `+1` wraps to `0`);
     Shift+Enter goes backward, both wrapping via
     `((index % n) + n) % n`.
  4. "when i hit enter agian ... it un highlights and unexpands the
     instances from before" -- ONLY the current match is ever expanded/
     highlighted; navigating to a new one first undoes the previous
     match's own effect (`dpSearchUndoCurrentMatch()`), not just adds a
     new highlight on top.
  **`devPanelSearchExpandedGroups` tracks only the groups THIS
  mechanism actually had to expand** (i.e. were genuinely collapsed at
  the moment of navigation) -- re-collapsing walks that list, not the
  full ancestor chain, so a group the user had already left open on
  their own is never wrongly re-collapsed by the search moving past it.
  Matches are collected via a single combined query,
  `'#dpGroups .dp-group-title, #dpGroups .dp-row, #dpUngrouped .dp-row'`
  -- `querySelectorAll` with a comma-separated selector returns nodes in
  real document order regardless of which branch matched, so no
  separate sort is needed to make Enter-cycling visit matches
  top-to-bottom. A `.dp-row` with no `<label>` (the Saved Dev Settings
  group's own hand-built row, just a `<select>`) is silently skipped,
  not an error -- only `buildRow()`-produced rows have a label to
  text-match against. The "until next click" clear (any document click
  that isn't on the search input itself) reuses the exact same
  undo-current-match function as Enter-cycling, so there's only one
  code path for "stop showing this match," not two that could drift.
  Verified via a Node-level DOM-stub simulation of the full sequence
  (2 matches, one nested 2 levels inside 2 initially-collapsed groups,
  one already-expanded) -- confirmed correct document-order collection,
  correct expand-only-what-was-collapsed bookkeeping, correct
  re-collapse-only-what-this-mechanism-touched on moving to the next
  match, and correct forward/backward wrap-around at both list
  boundaries. Not live-browser-verified (this environment's recurring
  dev-server page-boot stall, same limitation as most fixes in this
  project's history) -- `scrollIntoView`/real click-event propagation
  specifically are unverified beyond the stub's own faithful mirroring
  of the DOM APIs actually called.
- **8 real, reported bugs/requests landed together, 2026-09-17.** Each
  briefly:
  1. **Drag cursor "jump on first move," FIXED.** Real report: "say i
     didnt move the cursor at all from the moment i click and holded,
     then the moment i move the cursor, the cursor frame and dragpoint
     immediatly jumps to the true cursors location." Root cause: the
     7th-pass cursor realignment (`mouseX = realignX` etc.) synthetically
     overwrote the GLOBAL, real-`pointermove`-driven `mouseX`/`mouseY`/
     `mfX`/`mfY` variables -- a browser can't actually move the OS
     cursor, so the very next genuine `pointermove` event unconditionally
     overwrote them straight back to the TRUE absolute screen position,
     discarding the synthetic realignment in one frame and reading as a
     huge jump for even a tiny real hand movement (confirmed via
     simulation: a 150px spurious jump with ZERO real cursor movement).
     Fixed per the user's own suggested resolution ("do whatever
     translation math you need"): `mouseX`/`mfX` are never touched at
     all now -- only `downInfo.dragSensCursorX/Y` (the drag's own
     virtual cursor) starts at the realigned position, seeded against
     the REAL current `mouseX`/`mouseY` (not the synthetic one), making
     every subsequent frame a pure translation with nothing to jump to.
     The sprite-target stash was also switched from raw `mouseX/mouseY`
     to this same virtual cursor, for the identical reason.
  2. **Animation type changing mid-drag with the cursor stationary --
     NOT a separate bug, resolved as a side effect of #1.** The
     direction-bucket lock (`!mfDragActiveForAngle`, 2026-09-16) already
     covers the ENTIRE drag session unconditionally (armed the instant
     `downInfo.dragging` becomes true, released only at genuine
     release) -- confirmed by inspection, no gap found. What actually
     looked like "the animation type changing" was almost certainly the
     SPRITE'S ROTATION visibly snapping (rotation is never locked, by
     design, and reads raw `mfX/mfY`) in reaction to #1's own spurious
     jump -- fixing #1 removes the false-jump input rotation was
     reacting to. No separate code change made for this item.
  3. **mainRope had NO self-collision at all, FIXED.** Real report:
     "If i grow a rope so much that it reaches the floor, when it comes
     into contact with other rope segments, they all react in a crazy
     way and flash and jump around." Confirmed via code inspection: the
     existing self-collision loop only ever iterates `fallenPieces`,
     never `mainRope`, and the pre-existing mainRope-vs-piece block
     requires `fallenPieces.length > 0` to run at all -- so a rope grown
     long enough to coil against the floor with ZERO pieces ever cut had
     nothing preventing its own far-apart-by-index points from
     overlapping, leaving the bend/distance solver to fight an
     increasingly degenerate self-overlapping geometry every iteration
     with no repulsion term at all. Fixed by adding a new mainRope
     self-collision call (`resolveSelfCollision`, thickness-only radii,
     same reasoning as piece self-collision's own endcap exclusion),
     gated on the tip being near the floor (`cfg.floorEnabled` +
     proximity to `floorY()`) rather than `fallenPieces.length > 0`, so
     it engages regardless of whether anything has ever been cut.
  4. **Endcap-tip drag/click targeting, FIXED -- root cause was
     Deformable Endcap's own curvature, not the qualifier logic.**
     Real report: "I still cant drag by the endcap endpoint... Its
     still showing the closest point as the other rope segments...
     the endcap endpoint... should also be used to calculate the click
     funciton distances as well." Checked the live saved settings
     directly (same "check the actual value" precedent as prior
     data-drift bugs) and confirmed `endcapDeformableEnabled: true`,
     `endcapBendStrength: 0.3` -- every existing consumer of "where is
     the endcap's drag point" (the arm-time qualifier, the per-frame
     pull-back, the cursor realignment) computed it as a plain
     STRAIGHT-LINE walk from the tip along `tipDirection()`, correct
     ONLY for the rigid `drawEndcap()` renderer. `drawEndcapDeformable()`
     instead walks a CURVED spine (`endcapSpineSample()`) -- a Node
     simulation of a representative bend confirmed a 26px divergence
     between the 2 formulas at the annotated drag point's own `t≈0.97`,
     easily enough to make a real on-screen click miss. Fixed by adding
     one shared `endcapDragPointWorld()` helper (curved-aware when
     Deformable Endcap is active on form1-01, straight-line fallback
     otherwise) and routing all 4 consumers through it, including a
     brand-new 5th one: `hitTestRope()` now ALSO checks this same point
     (gated on `cfg.endcapDesign !== 'none'`), extending the same
     qualifier to ordinary click/cut targeting, not just Drag Rope,
     directly answering the 2nd half of the report. Also fixed a
     separate, latent thickness mismatch found while consolidating these
     call sites: every one of them was passing the un-multiplied
     `vmin(cfg.ropeThickness)` instead of the LIVE
     `vmin(cfg.ropeThickness) * ropeThicknessMultiplier` render() itself
     uses -- harmless at the default multiplier of 1, increasingly wrong
     after any full detach compounds Detach Thickness Multiplier.
     **A real editing mistake was caught and fixed during this pass**:
     an early edit to the cursor-realignment block accidentally deleted
     the `let realignX = dragPoint.x...` declaration entirely, which
     would have thrown a ReferenceError the instant a drag pickup
     completed -- caught via a full syntax check immediately after,
     before any other work continued; flagging here as a reminder that
     `new Function()` syntax checks catch parse errors, not this class
     of logic mistake, so re-reading the actual diff after a large
     `old_string`/`new_string` replacement matters even when the syntax
     check passes clean.
  5. **Cut piece "getting shorter" during decay, FIXED.** Real report:
     "Cut piece decay should only be in thickness but not length. Its
     still getting shorter as it decays right now." `pieceThickness()`
     itself was always thickness-only (confirmed by inspection), and the
     endcap's own LENGTH was already correctly decoupled from decay
     (`piece.baseThickness` passed as `heightThicknessPx`) -- but
     `drawRopeEndArcs()`'s own rounded end-cap arcs (the plain "no
     endcap selected" rounded-rope-end look) protrude PAST the true
     physics endpoint by `thicknessPx/2 * arcMult`, and were passed the
     piece's DECAYING `pieceThickness()` value for this protrusion too
     -- shrinking that outward reach (and therefore the piece's whole
     visible silhouette length) as it thins, even though not a single
     physics point ever moves. Fixed with the exact same fix SHAPE
     already applied to the endcap's own length: a new
     `protrusionThicknessPx` param on `drawEndArc()`/`drawRopeEndArcs()`
     (defaulting to `thicknessPx`, a no-op for mainRope/bgRope, which
     have no baseThickness/decay concept), with the piece's own render
     call site passing `piece.baseThickness` for it specifically -- the
     arc's own WIDTH still tracks live thickness (matching the
     rope body's own currently-thinning stroke), only its protrusion
     LENGTH is pinned.
  6. **Decay color/brightness, ADDED.** Real report: "Provide me a
     color brightness and color tint that occurs with the decay. So it
     gradually changes to that brightness and color as it decays." New
     `pieceDecayTintColor` (color, def `#2a1810`), `pieceDecayTintAmount`
     (0-1x, def 0.5), `pieceDecayBrightness` (0-2x, def 1) -- 2
     independently-tunable controls per §12n, not one bundled "decay
     amount" dial. `pieceDecayedColor(piece)` derives progress (0-1)
     from the SAME thickness-decay math `pieceThickness()` already
     tracks (0 at fall time, 1 exactly once thickness bottoms out at
     Piece Minimum Thickness) rather than a separate timer, so tint/
     brightness and thinning always finish together by construction.
     Wired into all 3 downstream consumers of a piece's own color (rope
     body stroke, endcap, end arcs -- the last 2 already derive from the
     first). Verified via Node: exact `ropeColor` at fall time, a real
     intermediate blend mid-decay, and correct fallback for any
     non-decaying entity (mainRope, bgRope).
  7. **Rope growth jitter at short Segment Length, IMPROVED (not fully
     eliminated) -- 2 diagnoses attempted, the first proved to be a
     no-op before shipping.** Real report: "Rope growth is jittery
     especially with shorter segment lengths." **1st attempt (caught as
     ineffective via simulation before finalizing, corrected in the same
     pass):** flooring `tipGrowDirection()`'s own `dlen` divisor at half
     of `segLen`, on the theory it was shrinking abnormally short. A
     Node simulation disproved this: `dlen` stays close to the REAL
     segLen under ordinary conditions (the distance constraint keeps
     prev/beforePrev within a fraction of a percent of it at all times),
     so the floor never actually engages -- kept only as a harmless,
     honestly-relabeled defensive guard against a genuinely-degenerate
     transient, not claimed as the fix. **Real mechanism, confirmed via
     simulation:** the SAME absolute per-frame solver "breathing" noise
     (already documented elsewhere in this file) produces an angular
     deviation in the tip's own growth direction that scales as
     `1/segLen` -- an inherent property of a shorter lever arm reading
     the same wobble as a bigger angle, not a bug in the geometry. A
     2000-frame simulated comparison measured this at 2.60x more
     angular noise stdev at a short 0.9%vh segLen vs. the code's own
     2.368%vh default (1.0951deg vs 0.4212deg). Fixed by scaling
     `mainRope.growDir`'s own low-pass filter rate (`s`, previously a
     flat `0.15`) DOWN proportionally to `segLen` relative to that same
     default -- stronger filtering at a shorter segLen, since the raw
     noise it's filtering is itself proportionally larger. The same
     simulation measured a real ~44% reduction at the short segLen
     (0.6166deg, down from 1.0951deg) -- NOT a full return to the
     default's own noise floor (a stronger reduction trades away more
     real-swing responsiveness; the exact tradeoff point is a judgment
     call, not a derived "correct" value) -- capped so this is a pure
     no-op at/above the default segLen, never a change for a
     longer-than-default rope.
  8. **Deformable Endcap curling away from the cursor during Rope
     Attraction, FIXED.** Real report: "on double click-attract, the
     new endcap seems to curl away from the cursor direction for some
     reason. the rest of the rope is acting normally, its just the new
     endcap." Root cause: `update()`'s own Rope Attraction block
     kinematically forces `points[length-2]` so the LAST segment points
     exactly at the mouse -- correct for the rigid renderer (whose
     rotation reads exactly that segment via `tipDirection()`), but
     `endcapSpineSample()`'s own curvature reads the angle between BOTH
     of the last 2 segments, and the FIRST of those 2 is whatever the
     rope's natural physics settled it to, unrelated to the mouse --
     Attraction's own override therefore creates a real, artificial kink
     exactly where the deformable curvature measures from, curling the
     endcap according to that fake kink instead of pointing straight at
     the cursor. Fixed by forcing the deformable renderer's own bend
     strength to 0 for this one render call while
     `ropeAttractionActive` is true -- the tip's direction is being
     deliberately, externally controlled during attraction, not
     genuinely curving, matching what the (already-correct, per the
     report's own "rest of the rope is acting normally") rigid renderer
     shows.
  Items 1/3/5/6/8 verified via Node-level simulation of the exact
  production formulas, same established convention as every other fix
  in this project's history; item 4 additionally caught and fixed a
  real self-introduced ReferenceError bug before it shipped, via a
  full-file syntax check. Item 7 is the one item shipped with an
  explicitly PARTIAL fix, honestly labeled as such rather than claimed
  complete. Not live-browser-verified (this environment's own
  recurring dev-server page-boot stall, documented extensively
  elsewhere in this file, still applies). A concurrent session's own
  commit (`87dccee`, its own dev-panel search-bar feature) ended up
  containing items 1/3/4/5/6 of this same batch -- the Nth occurrence
  of this project's own recurring cross-session commit-attribution
  mixup; confirmed via `git show 87dccee:index.html | grep` that all
  markers of this work are present, no content lost -- not corrected
  further, per this project's own established precedent for this exact
  situation.
- **`applyPunch()`'s own falloff was sigma=3 POINT-INDICES, a fixed
  NEIGHBOR COUNT regardless of physical spacing -- fixed 2026-09-17,
  direct follow-up to the SAME DAY's own `punchPowerAbsolute` fix.**
  Real, reported bug: "i still dont get why the click and click hold
  flick functions are so much weaker when segment length is short. The
  overstretch bounce back looks right so why cant the click?"
  `punchPowerAbsolute` already keeps the PEAK power segLen-independent
  (see that fix's own gotcha entry, directly above) -- but the peak
  alone isn't what makes a flick feel strong. At a short segLen, more
  points exist per unit of ACTUAL ROPE LENGTH, so the same fixed
  3-point-index falloff radius covers a proportionally SMALLER physical
  span of rope -- anything outside that span never gets a direct kick
  at all, only an indirect pull from the distance/bend solver over
  several frames, which is exactly why it reads as "weaker" overall
  even though the exact hit point still moves the full, correctly-
  segLen-independent distance. Confirmed via simulation: at this
  project's own recently-reported short segLen (0.9%vh) vs. its default
  (2.368%vh), the OLD fixed-sigma falloff's physical half-max reach
  shrank to 38% of the default's. **Overstretch's own bounce "looks
  right" for a genuinely different reason, not because it does anything
  more clever** -- it's a scripted, position-based radial nudge
  (amplitude/damping/stiffness, all real px values) with no point-index
  falloff involved at all, so it was never exposed to this exact bug
  class in the first place; this is why the user's own comparison
  ("overstretch... looks right so why cant the click") was a correct
  and useful diagnostic clue, not a coincidence. Fixed by scaling sigma
  by `defaultSegLen/segLen` (the SAME `45/19` code-default reference
  the growth-jitter fix above already established as this file's own
  convention for this exact kind of scaling) -- verified via simulation
  this restores an IDENTICAL physical half-max reach at any segLen
  (exactly 1.000x match), a pure no-op at the default segLen (sigma
  stays exactly 3), and correctly INCREASES total delivered impulse at
  a shorter segLen (measured ~2.6x more, matching how much MORE of the
  rope's own length is now receiving a direct kick) rather than merely
  redistributing the same fixed total. Not live-browser-verified (this
  environment's own recurring dev-server page-boot stall, documented
  extensively elsewhere in this file, still applies).
- **3 dev-panel features ported from `.claude/TEMPLATE_DEV_PANEL.html`
  (2026-09-17), per direct request to sync forward.** All 3 needed real
  adaptation, not a literal copy-paste, since this project's dev panel
  keeps ONE shared `#dpGroups`/`#dpUngrouped` tree across all 3 device
  tabs (unlike the template's own 3 separate per-tab `TabContent`
  roots) -- see this file's own "Dev-panel behavior" section for that
  established architectural difference.
  1. **Header icon buttons for Text Edit Mode / Add Group / Collapse
     All**, replacing a standalone checkbox (Text Edit Mode) and a
     per-tab "+ Add Group" text button below the tabs. Reused the
     EXISTING `.dp-icon-btn` class (this project's own established
     header-icon-button style, already used by the Collapse button)
     rather than introducing the template's separate `.dev-header-
     icon-btn` class -- same visual system, no new CSS variable
     plumbing needed. **Text Edit Mode's own persistence changed as a
     direct, deliberate consequence**: it used to be a real
     `PANEL_STYLE_CONTROLS` checkbox (persisted per-device like every
     other Dev Panel chrome setting); it's now a plain, NON-persisted
     runtime variable (`textEditModeEnabled`), matching the template's
     own current design exactly (its own comment: "no backing checkbox
     any more"). Since Text Edit Mode was never really "developer
     preference to remember," this is a fitting simplification. Add
     Group's OWN click handler is now wired centrally from
     `setupDevHeaderIconButtons()` (removed the old, separate
     `document.getElementById('dpAddGroupBtn').addEventListener('click',
     addDevGroup)` boot-time line -- leaving both would have double-
     fired `addDevGroup()` on every click).
  2. **Shift+click, or a right-click-armed plain click, selects one or
     more settings/groups; "+ Add Group" then folds the selection into
     the new group instead of leaving it empty.** Ported
     `devPanelSelectedItems`/`setupDevGroupSelection()`/
     `toggleDevSelection()`/`clearDevSelection()`/
     `disarmDevGroupSelection()` near-verbatim, swapping only class
     names (`.dp-group-title`/`.dp-group`/`.dp-row` for the template's
     `.dev-section-title`/`.dev-section`/`.dev-row`). Since this
     project has no per-tab DOM split, there's no "cross-tab selection"
     edge case to guard against either -- every selected item is
     always in the one tree `addDevGroup()` itself operates on, unlike
     the template's own `selectedInTab` filter. A capturing click
     listener on `#devPanel` with `stopPropagation()` is what makes
     Shift/armed-clicking a group's title SELECT it instead of also
     toggling collapse -- verified this reasoning holds for this
     project's own DOM shape (the group header's own collapse-toggle
     listener sits on the header element itself, a descendant of
     `#devPanel`, so a capture-phase `stopPropagation()` higher up
     never lets the event reach it).
  3. **A new group is now created at the TOP of the project-specific
     group list** (right after the built-in Dev Panel/Debug groups),
     not the bottom -- `addDevGroup()` now resolves an anchor via
     `container.querySelector(':scope > .dp-group[data-key="DEBUG"]')`
     falling back to `data-key="DEV PANEL"`, falling back to position 0
     if neither is found as a direct child (the same 3-tier fallback
     the template's own history already needed, after an earlier
     Debug-only version misplaced a subsequent new group once Debug
     itself had been legally reorganized into a subgroup). Verified via
     a Node-level DOM-stub simulation of all 3 fallback tiers -- correct
     insertion point in every case.
  **Deliberately NOT ported this pass**: the group drag-handle's own
  `position:absolute` + `calc()`-based vertical-centering fix (template
  `[CSS-8]`) -- this project's own `.dp-group-header` is `display:flex;
  align-items:center`, with the handle as a normal in-flow flex child,
  not an absolutely-positioned overlay next to the title. The bug that
  fix solves (a handle overlapping/misaligned against the title at
  different nesting depths/font-sizes) is specific to the template's
  OWN absolute-positioning approach; this project's flexbox layout
  centers the handle automatically and was confirmed to have no
  equivalent bug to fix. The Search bar (Ctrl+F-style group/setting
  finder) was NOT ported either -- it's the other direction: this
  project's OWN `dpSearchInput` mechanism (built 2026-09-17, earlier
  the same day) was the SOURCE the template's own search feature was
  generalized FROM, confirmed by reading the template's own comment
  crediting "DickoClicko's own dpSearchInput mechanism."
  Syntax-checked after every edit; the anchor-fallback logic verified
  via a dedicated Node simulation (3 scenarios: normal order, Debug
  reorganized elsewhere falling back to Dev Panel, neither present
  falling back to position 0 -- all 3 produced the correct insertion
  point). Not live-browser-verified (this environment's recurring
  dev-server page-boot stall) -- the Shift+click/right-click selection
  gesture and the header buttons' own click/contextmenu wiring haven't
  been exercised in a real browser, though the mechanism is a
  near-verbatim port of the template's own already-live, already-
  working code, adapted only in class names and the (simpler, single-
  tree) group-lookup logic.
- **Drag by the endcap's own visual TIP -- ROOT CAUSE FOUND AND FIXED,
  2026-09-17 (9th and, per the numeric evidence below, actually
  conclusive pass on this mechanism).** Every prior pass (2026-09-14
  through 2026-09-17) correctly fixed the DOWNSTREAM index-selection
  logic (which point gets grabbed once a hold is confirmed to be a
  Drag Rope hold) but never touched the UPSTREAM GATE that decides
  whether Drag Rope arms at all -- `onPointerDown`'s holdTimer
  callback: `if (cfg.dragRopeEnabled && dragHit.dist <=
  vmin(cfg.dragRopeHoldDistance) && ...)`. `dragHit` was computed via
  a bare `nearestPointOnRope()` call with ZERO endcap awareness, so a
  press near the endcap's own visual tip -- but further than Drag Rope
  Hold Distance from any REAL physics segment, which is exactly what
  pressing near a decorative extension past the last point produces --
  was silently rejected at this gate, every time, regardless of how
  correct the downstream qualifier was. Confirmed via a Node
  simulation using the live saved geometry (segmentLength=4.75,
  ropeThickness=6.4, dragRopeHoldDistance=6.5, at an assumed 1000px
  vmin): a press at the EXACT pixel-perfect tip barely squeaked past
  the old gate (63.5px measured vs. a 65px threshold -- essentially no
  margin for error), but a press just 30px further out (a thoroughly
  realistic amount of click imprecision) measured 93.5px under the old
  gate and was rejected outright, while resolving correctly (30px,
  well under threshold) once the gate itself became endcap-aware --
  concretely explaining why the bug felt "always broken" rather than
  "occasionally works."
  New shared helper `nearestMainRopePointWithEndcap(x, y)` is now the
  ONE place this "nearestPointOnRope(), then let the endcap's own true
  (possibly Deformable-Endcap-curved) drag point win if it's closer"
  comparison lives -- replacing 2 separately hand-duplicated copies
  (`hitTestRope()`'s own qualifier, and the Drag Rope arm-time
  `dragGrabIndex` qualifier) AND fixing the 3rd, previously-untouched,
  load-bearing call site (`dragHit`) that was the actual root cause.
  All 3 real callers (the click-distance gate behind punch/cut, the
  Drag Rope arming gate, and the point-selection logic) now agree by
  CONSTRUCTION, not by 3 independently-maintained copies staying in
  sync through luck.
  **Item 1 from the same report ("the endcap drag point should also
  move if the endcap height is changed") was investigated and found to
  already be mathematically correct** -- every consumer of
  `endcapDragPointWorld()` already reads `cfg.endcapHeight` live
  (confirmed: the underlying extension formula is linear in
  `heightMult`, verified via a direct numeric check), including the
  PER-FRAME pull-back during an active drag. This was very likely
  simply unobservable while dragging itself could essentially never
  reliably arm near the tip -- expected to resolve as a natural
  consequence of the gate fix above; flagged for the user to re-test
  rather than assumed fixed, since it was never independently
  reproduced as a separate defect.
  Syntax-checked; both the gate-fix numeric scenario and the
  linear-in-heightMult claim verified via dedicated Node checks. Not
  live-browser-verified (this environment's recurring dev-server
  page-boot stall, the same limitation as every prior pass on this
  mechanism) -- unlike those prior passes, though, this fix is backed
  by a concrete numeric reproduction of the actual failure mode, not
  just corrected reasoning about the code.
- **Overstretch Sensitivity Curve widget could never actually be
  reordered/moved (2026-09-17), real reported bug.** Root cause: the
  hand-built `wrap` row (`buildOverstretchSensitivityCurveWidget()`)
  had NO drag-handle element inside it at all -- every OTHER row gets
  one from `buildRow()`, but this one, built by hand, never did.
  `makeReorderable()`'s delegated pointerdown listener only ever starts
  a reorder-drag when the event target is inside a real
  `.dp-row-handle` element (this project's own established "reordering
  starts only from a dedicated drag-handle icon" convention) -- with no
  such element anywhere in `wrap`, that check failed on every single
  pointerdown inside it, so this row could never be grabbed for
  reordering at all, not merely "doesn't move with its slider" (the
  ALREADY-documented, narrower limitation from when this widget was
  first built). Fixed by adding the same `<span class="dp-row-handle
  dp-drag-handle">⠿</span>` structure every other row already has, plus
  a stable `data-key` (`'dragOverstretchMinSensitivityCurve'`) it never
  had either -- `getPanelOrder()`/`captureGroup()` read `.dataset.key`
  generically off EVERY `.dp-row` in a group (this widget's own extra
  `dp-curve-widget-row` class doesn't exempt it), so a future Save now
  genuinely remembers this row's position the same way every other row
  already does, via `findRowByKey()` on restore -- no special-casing
  needed anywhere else in the reorder/persistence system.
- **Overstretch thinning timing corrected, 2026-09-17 -- 2 related but
  distinct fixes, both direct corrections of the SAME mechanism's OWN
  earlier design.**
  1. **No more instant thinning the moment a drag starts.** Real,
     reported bug: "When i click and hold to initate drag, even if i
     dont move the cursor, I see a sudden thinning of the rope segment.
     That should not happen." Root cause: `dragMinThinDepth` (added
     2026-09-16, see that control's OWN now-removed comment) floored
     `overstretchDepth` to a constant baseline the INSTANT any drag
     started, regardless of `overstretchFrac` -- exactly what produced
     visible thinning with zero cursor movement. That floor's ORIGINAL
     purpose (a short rope showing no thinning at all) has since been
     solved on its own separate merits: `overstretchTolerance` used to
     be a fixed `vmin()` absolute, disproportionately generous relative
     to a small `maxDragDist` near the anchor (see that control's own
     2026-09-17 correction) -- now that it's proportional, a short rope
     genuinely overstretches (and starts thinning) on an ordinary drag
     almost immediately, with no floor needed. Keeping the floor after
     THAT fix landed made it actively wrong, not just redundant --
     removed the control entirely (`overstretchDepth` is now purely
     `overstretchFrac * overstretchMaxThinDepth`, exactly 0 at 0
     overstretch) rather than leaving an inert slider around, per this
     project's own "an inert slider that visibly does nothing is worse
     than no slider" convention.
  2. **Thinning now eases back to full thickness on release instead of
     snapping instantly.** Real, reported bug: "on release of the drag,
     the thinning should also not bounce back sddenly, but transition
     back to normal thickenss depending on the overstretch length."
     `update()`'s own per-frame reset (`mainRope.overstretchDepth = 0`,
     runs unconditionally every frame regardless of drag state) is what
     produced the instant snap -- nothing overrode it once dragging
     ended. New `mainRope.overstretchReleaseTransition`, armed in
     `onPointerUp`'s Drag Rope release branch alongside the EXISTING
     release bounce (same "only when genuinely overstretched" gate),
     captures the depth at release and eases it linearly down to 0 --
     the reset block now checks for an active transition FIRST and
     overrides its own hard-zero with the eased value when one's
     running. Duration scales with how deep the thinning actually was
     at release (`startDepth / overstretchMaxThinDepth`, against a new
     `cfg.overstretchThinningReleaseDuration` BASE duration in ms) --
     a shallow release eases back quickly, a release from deep
     overstretch takes the full duration, matching "depending on the
     overstretch length" directly rather than one fixed duration
     regardless of how stretched the rope was. Verified via a Node
     simulation of both the no-floor depth formula (exactly 0 at
     frac=0, confirmed) and the release-ease curve (monotonically
     decreasing to 0, duration scaling correctly with starting depth --
     a full-depth release took the full base duration, a
     quarter-depth release took exactly a quarter of it). Not
     live-browser-verified (this environment's recurring dev-server
     page-boot stall).
- **Drag by the endcap's own visual TIP -- INVESTIGATED FURTHER,
  2026-09-17, per explicit instruction NOT to fix yet, only diagnose.
  A DEEPER, more structural cause found beyond the arm-time gate fixed
  earlier the same day.** The 2026-09-17 `dragHit` fix made the ARM-TIME
  DISTANCE COMPARISON endcap-aware, but never questioned WHAT POSITION
  that comparison is actually measured FROM -- and that position turns
  out to be the real remaining problem. `onPointerDown`'s holdTimer
  callback computes `const dragPos = mouseFlickInteractionPos(x, y,
  'drag');` before ever reaching `dragHit` -- and
  `mouseFlickInteractionPointWorld('drag')` (what this actually calls,
  whenever Cursor Animation is active -- confirmed live in the saved
  settings: `mouseFlickEnabled: true`, `mouseFlickEnabledLiveMode:
  true`) returns a point derived ENTIRELY from `mfEntityX/Y` (the
  Cursor Animation SPRITE's own current rendered position) plus a
  fixed local offset (a specific spot on the hand artwork) rotated by
  `mfEntityAngleDeg` (the sprite's own current rotation) -- the REAL
  press position `x, y` is used ONLY as a fallback when the sprite/
  frame data isn't loaded yet, never when Cursor Animation is
  genuinely active. This substitution is DELIBERATE, ORIGINAL design
  from 2026-09-12 ("Drag Rope Hold Distance is measured against FLICK
  MOUSE's own annotated 'drag' interaction point... not the literal
  press position"), not something introduced by any of the 9 endcap-
  drag passes -- but it means the entire Drag Rope Hold Distance gate
  is measured from WHEREVER THE SPRITE CURRENTLY IS, not from where the
  user is actually pressing. If the sprite's own annotated 'drag' point
  (a fixed spot on specific hand artwork) doesn't happen to land near
  the endcap's own extended position -- plausible for a long endcap
  extension, or whenever the sprite's current pose/rotation puts that
  specific point somewhere else on screen -- then NO amount of endcap-
  awareness in the DISTANCE COMPARISON helps, because the reference
  point the comparison starts FROM is already untethered from the
  endcap's real screen location. Every endcap-awareness fix so far
  (this one included) treated "which distance formula" as the problem;
  this is evidence the deeper issue may be "which POINT that formula is
  measured from" for this one purpose specifically.
  **Why this explains "still can't drag, even after the gate fix":**
  the PER-FRAME, ALREADY-ARMED drag-follow code was fixed back in
  2026-09-14 to use the RAW cursor (`mouseX`/`mouseY`), never this
  substituted point (see that gotcha: "Drag Rope's own continuous
  per-frame drag TARGET must always be the raw live cursor... never
  mouseFlickInteractionPos(...)") -- so ONLY the ARM-TIME gate still
  reads the sprite-relative point. This means the failure is isolated
  to GETTING a drag to START at all near the endcap, never to
  continuing one already in progress -- which matches the report
  exactly ("i still cant drag by the endcap," not "dragging near the
  endcap feels wrong once started").
  **Not fixed, per direct instruction ("Dont fix this yet").** The
  2 most likely directions, if/when a fix is authorized: (a) measure
  `dragHit` against the REAL press position instead of the substituted
  one (mirrors the exact precedent already set for `isOnCircle()`'s own
  exclusion gate, corrected 2026-09-15 for the identical reason: "must
  always check the REAL press/release position, never a FLICK
  MOUSE-substituted interaction point") -- the simpler change, but
  would quietly narrow the scope of the ORIGINAL 2026-09-12 spec for
  every OTHER (non-endcap) drag target too, not just this one case; or
  (b) keep the substitution for the general case but ALSO compare
  against the raw press position specifically for the endcap-tip
  qualifier, taking whichever measurement is closer -- preserves the
  original spec's intent everywhere else, more surgical, but adds a 2nd
  parallel measurement path to reason about. Neither has been
  attempted or verified -- this entry documents the DIAGNOSIS only.
- **Pointer Lock for Drag Rope (2026-09-17), per direct request: "when
  my true cursor hits the edge of the browser, i can no longer further
  drag the rope even though there is more space... I want to be able
  to continue dragging without hitting a boundary threshold."** Real,
  well-understood limitation of absolute cursor tracking: the OS
  cursor physically cannot move past the browser window's edge, so its
  `clientX/clientY` stops changing there -- `dragSensCursorX/Y` (the
  drag's own virtual cursor) only ever advances by REAL per-frame
  deltas, so it stalled too, even with the real mouse still being
  pushed against the edge. Presented 2 fix directions to the user
  (Pointer Lock, the standard/correct technical solution but hides the
  OS cursor while dragging; or a lighter "keep advancing while pinned
  at the edge" heuristic) -- **Pointer Lock was explicitly chosen.**
  **Mechanism:** both of this file's own cursor-tracking `pointermove`
  listeners (`mouseX/mouseY` for the rope's own drag math, `mfX/mfY`
  for Cursor Animation's drag-time rotation target) now branch on
  `document.pointerLockElement === canvas`, checked FRESH on every
  single event, never cached: while locked, `e.movementX/movementY`
  (raw OS-reported relative motion, never clamped by the screen edge)
  ACCUMULATE onto the tracked position instead of `e.clientX/clientY`
  overwriting it outright. `canvas.requestPointerLock()` is called
  exactly once, at the precise instant Drag Rope genuinely arms
  (`downInfo.dragging = true`, inside the holdTimer callback -- still
  within its own transient-activation window from the original press);
  `document.exitPointerLock()` is called unconditionally at the top of
  `onPointerUp`'s own Drag Rope release branch. **Both calls are
  wrapped to degrade silently on failure** (permission denied,
  unsupported browser, focus stolen, `requestPointerLock()`'s own
  Promise rejecting) -- falls back to the pre-existing, bounded-by-the-
  screen-edge behavior rather than throwing or blocking the drag
  itself; `exitPointerLock()` is a documented no-op when nothing is
  currently locked, so it's always safe to call unconditionally on
  release regardless of whether the lock was ever actually granted.
  **No manual resync-on-unlock code needed** -- the instant the lock
  ends (a clean release, or the browser/OS forcibly revoking it, e.g.
  Esc, alt-tab), both listeners' own `document.pointerLockElement ===
  canvas` check simply stops being true, and the VERY NEXT real
  `pointermove` event naturally resets `mouseX/mfX`/`mouseY/mfY` back
  to an absolute, on-screen position via the existing else-branch --
  confirmed via a Node simulation of the exact accumulation logic:
  10 simulated locked moves of +15px each correctly pushed a
  screen-edge-pinned virtual cursor to 2069px (well past any realistic
  screen width), and the very next unlocked event snapped it straight
  back to the real absolute position with zero special-cased resync
  logic. Scoped narrowly to Drag Rope specifically (only engaged/
  released at that gesture's own arm/release points) -- no other
  interaction in this file requests or depends on a lock, so nothing
  else changes behavior. Syntax-checked; the core accumulation/resync
  math verified via Node simulation as above. **Not live-browser-
  verified** (this environment's recurring dev-server page-boot
  stall) -- this is also the FIRST use of the Pointer Lock API
  anywhere in this file, so unlike most fixes here, there's no prior
  precedent in this codebase to lean on for confidence beyond the
  spec's own documented behavior and the isolated logic simulation
  above; worth a deliberate real-browser test of the actual UX (cursor
  disappearing while dragging, the browser's own lock-acquired
  indicator if any, and an Esc-mid-drag scenario) before trusting this
  fully.
