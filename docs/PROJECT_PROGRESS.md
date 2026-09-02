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

Deciding, with the user, exactly what the new "Click Hold Max Duration" /
"Intensity Ceiling" charged-punch-on-release mechanic should do to the
existing click-hold-to-grow behavior before implementing it — as literally
described the two seem to conflict (both are triggered by the same
click-and-hold gesture).

## Recently completed

- Full build: circle + rope verlet physics (punch, hold-to-grow,
  double-click-to-cut with a directional cut-sweep animation and a Cut Speed
  control), floor collision + piling, full dev panel compliant with the
  workspace's §12 standard.
- Real-usage bug reports from the user, fixed and verified: double-click-
  to-cut intermittently stopping working (stale holdTimer race), a visible
  freeze when cutting the rope mid-swing (the cut-sweep animation was
  pausing the piece's physics), and the rope rendering behind the circle.
- More real-usage reports, fixed and verified: the rope acting stick-stiff
  once extended, and its extended portion not being cuttable — both traced
  to the same root cause (a fixed 14-point count just got stretched thinner
  as the rope grew, instead of gaining points to hold a constant segment
  density); the main rope now also collides with and piles on the floor
  (previously only cut-off pieces did); added a Minimum Rope Length slider
  that refuses a cut that would leave the remainder shorter than it.

## What's next

Land on the hold-charge-punch design with the user, implement it. Beyond
that, nothing queued — possible future direction the user mentioned but
didn't commit to: a Three.js-based physics/collision upgrade.

## Open questions / blockers

None currently open.
