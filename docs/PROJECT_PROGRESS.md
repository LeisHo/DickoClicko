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

- Full build: circle + rope verlet physics, floor collision + piling, full
  dev panel compliant with the workspace's §12 standard.
- A run of real-usage bug reports from the user, fixed and verified: cut
  intermittently stopping working (stale holdTimer race), a freeze cutting
  mid-swing, the rope rendering behind the circle, the rope acting
  stick-stiff once extended and its extended portion not being cuttable
  (both traced to a fixed point count that just stretched thinner instead
  of gaining points), the main rope not colliding with/piling on the floor.
  Added a Minimum Rope Length slider (refuses a cut that would leave the
  remainder shorter than it).
- Hold-gesture split, per explicit clarification: a hold starting on the
  circle grows the rope (as before); a hold starting on the rope now
  charges punch intensity instead, firing immediately on release, scaled
  by hold duration up to a new Intensity Ceiling at Click Hold Max
  Duration. A quick tap on the rope is unaffected (still the existing
  punch/double-click-to-cut path).

## What's next

Nothing queued. Possible future directions the user mentioned but didn't
commit to: a Three.js-based physics/collision upgrade, and restyling the
rope's geometry to something more illustrative while keeping the same
smooth animation (the physics/render split already makes this a rendering-
only change — see CODE_SUMMARY's `strokeRopeCurve()` note).

## Open questions / blockers

None currently open.

## Open questions / blockers

None currently open.
