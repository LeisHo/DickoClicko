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
  everything looking jumpy (physics now runs a fixed 1/60s timestep), and
  vertical dev-panel resize going unresponsive or pushing the panel
  off-screen (JS's requested height wasn't clamped to match the CSS
  max-height it renders against). Also baked in a user-provided settings
  dump as the new hardcoded defaults.

## What's next

Nothing queued. Possible future directions the user mentioned but didn't
commit to: a Three.js-based physics/collision upgrade, and restyling the
rope's geometry to something more illustrative while keeping the same
smooth animation (the physics/render split already makes this a rendering-
only change — see CODE_SUMMARY's `strokeRopeCurve()` note).

## Open questions / blockers

None currently open.
