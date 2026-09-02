# Dicko Clicko — Project Progress

**This is a live document, not a log.** It holds only the current picture —
what's being worked on right now, what's recently done, and what's next. It
does **not** accumulate a running history of every past session; that
history already lives in `CHANGELOG.txt` (the append-only, authoritative
record — see CLAUDE.md §4a/§4). When something here is finished and no
longer relevant to understand what's current, remove it from this file
rather than leaving it to pile up. Rewrite the sections below in place at
each real update — don't append a new dated block underneath the old one.

This doc functionally doubles as a handoff document (CLAUDE.md §4c): a
brand-new AI chat with no prior context should be able to read this file
alone and know exactly where the project currently stands, and pick up the
work seamlessly from there.

--------------------------------------------------------------------------------

## Currently working on

Nothing in progress — everything below is done and pushed. (The
"rope physics is erratic" thread from the last update is resolved for
now — see below — but if the user reports it again after trying the new
Damping/Constraint Iterations sliders, that's the next place to look.)

## Recently completed

- Full build: circle + rope verlet physics (punch, hold-to-grow-on-circle,
  hold-to-charge-punch-on-rope, double-click-to-cut with a directional
  sweep animation), floor collision + piling (including the main rope, not
  just cut pieces), full dev panel compliant with the workspace's §12
  standard (resize/hide/collapse, Copy/Save/Reset, drag-to-reorder,
  Desktop/Mobile tabs, built-in appearance group).
- A long run of real-usage bug reports from the user, all fixed and
  verified: cut intermittently stopping working, a freeze cutting
  mid-swing, wrong render order (rope/circle), a fixed point count making
  extended rope stiff/uncuttable, hold gestures bouncing like a punch
  (charging's eligibility timer could overlap a real double-click),
  everything looking jumpy (physics now runs a fixed 1/60s timestep),
  vertical dev-panel resize going unresponsive or pushing the panel
  off-screen, hold-to-grow missing the (small) circle and firing a punch
  instead, and growth itself jittering slightly even on a still rope.
  Fixing that last one surfaced a second bug in the fix itself (growth
  silently stalling between point-insertion thresholds), caught and fixed
  before shipping, not left for the user to find. Added a Click And Hold
  Distance slider gating the charge-punch specifically. Baked in 2 rounds
  of user-provided settings dumps as the new hardcoded defaults, including
  a refactor of the built-in "Dev Panel" appearance group so its rows can
  be freely reordered (previously split across two arrays that couldn't
  represent an interleaved order).
- Dev panel could be dragged partially off-screen (clamp used a fixed 40px
  stub instead of the panel's real width/height), which could push its own
  resize corners out of frame. Fixed by clamping `left`/`top` against the
  panel's actual measured dimensions; verified with 2000px/3000px-overshoot
  drags landing exactly flush with the viewport edge in every direction.
- Documented (CLAUDE.md + a source comment above `DEV_GROUPS`) that every
  X/Y position slider pair shares one global origin — `(0,0)` at the
  viewport's top-left, `100` = full width/height, matching `vw()`/`vh()`
  exactly. `circleX`/`circleY` (currently the only X/Y pair in the app)
  already conform; this pins the convention so any future position slider
  follows it too, keeping raw values paste-compatible between same-axis
  sliders.
- Fixed a real bug: setting Rope Length shorter caused a visible bounce
  live, and reloading after Save Settings made the rope glitch right at
  boot. Root cause: `resetMainRope()` built the initial chain with its own
  segLen formula, which only matched the pinned `TARGET_SEG_LEN_VH`
  constant back when Rope Length's default was still 45; a later
  defaults-bake changed the default without updating that constant, so
  the two silently diverged. Any call to `setMainRopeTotalLength()`
  (slider drag, or a saved-settings reload at boot) then snapped every
  point's rest length to the mismatched constant at once, which the
  constraint solver had to violently correct — the bounce. Fixed by
  having `resetMainRope()` build from the same `targetSeg` constant
  everything else already uses. Verified via direct reproduction: after
  the fix, a real boot with a saved shorter `ropeLength` already has
  `segLen`/point count matching what `setMainRopeTotalLength()`
  independently computes, and reapplying it is a true 0-displacement
  no-op.
- Fixed rope-extension animation "stepping" (growth only advanced in
  whole-segment jumps — around 25px at defaults — with nothing visibly
  moving in between), and then fixed a MORE serious regression the first
  attempt at that fix introduced: over a real multi-second hold, the rope
  would violently whip/tangle before self-correcting (confirmed via a
  user-supplied screen recording and a 900-frame/15s direct reproduction).
  Root cause: feeding the growing tip's rising target length into the
  ordinary iterative constraint solver acted as a sustained forcing
  function that a 6-iteration, lightly-damped solver couldn't fully
  dissipate — residual error compounded over hundreds of frames into a
  real tangle (segment lengths measured up to 2.93x rest length, points
  folding back on themselves instead of hanging straight down). Fixed by
  excluding the growing tip from the constraint solve entirely and
  positioning it directly each frame instead (from the settled chain's own
  local direction, zero implied velocity) — smoothness is unaffected (an
  exact sawtooth matching the per-frame growth amount, same as before) but
  the tangling is gone: the same 900-frame stress test now shows 0
  non-monotonic points throughout, verified via both direct physics calls
  and a real dispatched pointerdown/pointerup gesture held 15s.
- Fixed click-and-hold not firing when the user pressed away from the rope
  and moved toward it before releasing ("click and hold anywhere, then
  release within the tolerance distance"). The Click-And-Hold-Distance
  gate was checking the press-time position (frozen at `onPointerDown`),
  never the release position — moving the pointer during the hold had no
  effect at all. Fixed by recomputing the nearest-rope-point check from the
  actual release coordinates. Verified via dispatched pointer events with
  real hold timing: press-far/release-near now fires, press-far/release-far
  still correctly doesn't, and press-near/release-near (regression) still
  fires.
- Baked in another user-provided Copy Settings dump as new hardcoded
  defaults (Rope Length, Click And Hold Distance, Rope Animation Speed,
  Minimum Rope Length, Cut Speed) — every value already fit its slider's
  existing range, no expansion needed.
- Added optional rope endcaps: 2 user-supplied SVG designs
  (data/Rope/End1.svg, End2.svg), selectable via a new "Endcap Design"
  dropdown (ROPE group) — the first dropdown control this project has
  needed, so dropdown support was added to the dev-panel framework itself
  (buildDevPanel(), applyValues()), alongside the existing slider/color/
  checkbox types. The selected cap renders at the free/tip end of the main
  rope and every fallen piece (replacing the plain round cap, not stacked
  with it), scaled so its width matches the rope's current thickness and
  rotated to continue in whatever direction the rope tip currently points
  — verified correct via direct pixel inspection of the rendered canvas,
  both hanging straight down and forced sideways.
- Dev panel: fixed the minimum resize size to be derived from the header's
  actual rendered content (`computeMinPanelSize()`) instead of a hardcoded
  `220x140` (in both JS and CSS — removed both), per a workspace `CLAUDE.md`
  §12c requirement added after this project's panel already shipped. Real
  measured floor is 81x34px.
- Endcap follow-ups from live testing: colored to match `cfg.ropeColor`
  instead of the SVGs' authored white; added an "Endcap Height" slider
  that stretches the cap vertically while its top edge stays exactly
  pinned at the rope's tip (verified: 2x height produced exactly 2x the
  measured pixel extent, and the tip pixel stayed cap-colored at every
  tested multiplier).
- Charged-punch intensity now stacks Intensity Ceiling ON TOP of Click
  Intensity (`clickIntensity + t*intensityCeiling`, reaching that sum
  exactly at Click Hold Max Duration) rather than replacing it — a hold
  released immediately now punches at the same intensity a quick tap
  would, instead of at 0.
- Baked in another user-provided Copy Settings dump (Rope Length, Endcap
  Design → End 2, Click Distance, Click Intensity, Click And Hold
  Distance, Rope Animation Speed, Double Click Threshold, Cut Speed), plus
  reordering the ROPE group (Endcap Design + Endcap Height moved to the
  front). Minimum Rope Length was deliberately left at 0.5 rather than the
  dump's 1 — the dump appears to predate the explicit "make min rope
  length .5" request earlier in the same conversation; flagged to the user
  rather than silently overridden either way.
- Fixed: double-clicking near (but not literally on) the circle could
  still target a rope point within the circle's own margin and cut there
  — reported three times total ("double click within the bounds of the
  circle... cut at the shortest length possible"). Round 1's diagnosis
  ("just Minimum Rope Length reacting correctly") was real but incomplete;
  round 2 fixed it by reusing `isOnCircle()`'s margin in `cutRopeAt()`,
  which still wasn't generous enough for the user's actual clicks. Round 3
  replaced that reuse with a dedicated, independently-tunable "Circle Cut
  Distance" dev slider (default 10 %vmin) per explicit request — verified
  a click offset sideways from the circle whose nearest rope point still
  lands within that distance now correctly gets rejected, while a normal
  cut well clear of the circle still succeeds.
- Fixed a real tangling bug: cutting the rope down to just 2 points (a
  near-anchor cut) and then repeatedly using hold-to-grow produced a
  tight, physically-wrong knot right at the circle — confirmed via a
  user-supplied screen recording. Root cause: `tipGrowDirection()`
  returned a degenerate `(0,0)` direction whenever the chain was this
  short (its `prev` and `beforePrev` reference collapse to the same
  anchor point), which placed new points exactly on top of the anchor;
  the physics solver then flung them apart in an effectively arbitrary
  direction the next frame. Fixed with a proper fallback to straight
  down. Verified via a direct reproduction (forced a 2-point rope, ran 5
  real hold-to-grow cycles): 0 non-monotonic points and no near-zero
  point spacing throughout, vs. immediate collapse before the fix.
- Clarified (not a bug): Copy Settings and Save Settings capturing each
  group's collapsed/expanded state is the workspace `CLAUDE.md` §12e
  standard, not a bug — "whichever groups were open or collapsed at Save
  time come back in that same state," by design.
- Implemented §12l/§12m, added to the workspace `CLAUDE.md` since this
  project's dev panel last caught up with it: Save Settings writes
  `{values, order, panelGeometry}` through to a git-tracked
  `data/processed/dev-panel-settings.json` (File System Access API, one
  native-picker prompt on the first save per browser, silent thereafter
  via a handle persisted in IndexedDB; Chromium-only). §12m's
  paste-and-"set defaults" merge rule is a behavioral convention
  documented in this project's `CLAUDE.md`, not page code. Corrected
  2026-09-02: an explicit revision to §12d/§12l made clear the git-tracked
  log is the *only* place Save writes to — the original implementation's
  parallel localStorage write was removed, and Reset now reads from the
  git log only. Boot-time/Reset reads use only the non-prompting
  `queryPermission()` (no user gesture exists at boot) and fall back to
  hardcoded defaults if nothing is reachable yet; Save (always
  gesture-backed) can prompt via `requestPermission()`/
  `showSaveFilePicker()`. Verified via a temporary debug hook against a
  standalone static server: graceful cold-boot fallback, graceful Save
  failure with zero localStorage writes, and Copy/tab-switch working off
  an in-memory `lastLoadedSnapshot`. A real picker-backed round trip
  remains untestable headlessly (same documented mock-cloneability
  limitation as before).
- Minimum Rope Length's slider range widened to 0.1-15 %vh (was 0.4-30),
  default unchanged at 0.5, per explicit request.
- Moved Floor Enabled/Color/Thickness/Height out of ROPE CUT into their
  own new "FLOOR" group, per explicit request.
- Removed the "Click And Hold Flick Distance Threshold" slider (added,
  then removed one message later, per explicit request — no longer
  present in CLICK or anywhere else).
- Reorganized the dev panel further, per explicit request: the MECHANICS
  group is gone (had exactly 3 controls, all relocated). ROPE CUT now
  holds every double-click-related control together (Minimum Rope Length,
  Circle Cut Distance, Click Distance, Double Click Threshold, Rope Fall
  Speed, Cut Speed); ROPE GROWTH now also holds Click Hold Max Duration
  and Intensity Ceiling (the charge-and-flick timing controls); CLICK is
  down to just Click Intensity and Click And Hold Distance. Purely a
  DEV_GROUPS reorganization — every control's own `cfg` key and wiring is
  unchanged, verified via a live DOM query of every group's rows.
- Added a 3rd endcap design (End3.svg) and switched ALL 3 designs to one
  shared scale/anchor reference (`ENDCAP_ALIGNMENT`, from a new
  `data/Rope/End Alignment.svg`) instead of each design measuring its own
  bounding box independently — per explicit request, since End3 was
  authored specifically to align with that shared reference. Verified
  End3 renders at a reasonable scale/extent with 0 console errors; the
  shared-reference change is correct by construction (one `scale`/
  `translate` computed outside any per-design branch).
- Added a 4th endcap design (End4.svg), same shared-alignment pattern as
  End3 — mechanical addition, not re-verified in the browser per explicit
  request ("don't verify"); `node --check` stayed clean.
- Resolved the "rope physics is erratic" thread (4th round): an
  exhaustive reproduction sweep found the rope mathematically stable at
  the OLD damping/iteration defaults (a fully-settled rope showed EXACTLY
  0 movement over 120 traced frames — no "jitter at rest" bug in the
  solver), but a single punch took ~3.65s of real, visible swinging to
  settle — the likely actual source of "erratic"/"swings wildly"
  perception, especially under frequent interaction. `DAMPING`/
  `CONSTRAINT_ITERATIONS` were hardcoded constants (`0.99`/`6`); made them
  `cfg.damping`/`cfg.constraintIterations` dev sliders (ROPE ANIMATION
  group) with new defaults `0.85`/`10`, chosen by sweeping several
  combinations and picking one that improved BOTH settle time (~1.77s,
  vs 3.65s) AND worst-case stretch (~1.07x, vs ~1.15x) together, never
  trading one for the other. Exposed as sliders (not just a new hardcoded
  value) specifically so the user can tune further without another
  round-trip if this default still isn't quite right. Re-verified no
  regression in the 2-point-rope-tangling fix from 2 rounds ago under the
  new tuning.
- Added "Endcap At Cut End" checkbox (ROPE CUT group, default off): when
  on, each fallen rope segment also gets the selected endcap shape at its
  severed/cut edge, not just its original tip end. Implemented by reusing
  `drawEndcap()` unchanged with the fallen piece's points array reversed,
  so no new drawing code was needed; mainRope needed no change since its
  own tip already is the cut point right after a cut. Verified via a
  temporary debug hook: a synthetic fallen piece's cut-end pixel coverage
  rose from 666 (bare line-cap) to 855 (line-cap + SVG endcap) with the
  checkbox on, its unaffected tip end stayed flat (847 vs 850), and a
  real checkbox `change` event correctly toggled `cfg.endcapAtCutEnd`.
- Implemented §12l's newly-added "no server, opened directly as a local
  file" exception: a `GIT_LOG_WRITABLE` capability check
  (`'showSaveFilePicker' in window`) now gates Save/Reset between the
  git-log path and a new session-scoped `sessionStorage` fallback for
  browsers that lack the File System Access API entirely — deliberately
  `sessionStorage`, not `localStorage`, since it can't outlive the tab
  and so can never become the persistent local default §12d/§12l bans.
  Verified both branches: a throwaway test copy with the API deleted
  confirmed the fallback round-trips a saved value correctly and flashes
  "Saved (session only)"; the real, unmodified file confirmed zero
  change to the normal-capability path (sessionStorage untouched, same
  git-log behavior as before).

## What's next

Nothing queued. Possible future directions the user mentioned but didn't
commit to: a Three.js-based physics/collision upgrade, and restyling the
rope's geometry to something more illustrative while keeping the same
smooth animation (the physics/render split already makes this a rendering-
only change — see CODE_SUMMARY's `strokeRopeCurve()` note).

## Open questions / blockers

None currently open.
