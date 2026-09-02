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

Nothing in progress — everything below is done, verified, and pushed.

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

## What's next

Nothing queued. Possible future directions the user mentioned but didn't
commit to: a Three.js-based physics/collision upgrade, and restyling the
rope's geometry to something more illustrative while keeping the same
smooth animation (the physics/render split already makes this a rendering-
only change — see CODE_SUMMARY's `strokeRopeCurve()` note).

## Open questions / blockers

None currently open.
