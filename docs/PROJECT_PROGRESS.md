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

- Full build: circle + rope verlet physics (punch, hold-to-grow,
  double-click-to-cut with a directional cut-sweep animation and a Cut Speed
  control), floor collision + piling, full dev panel compliant with the
  workspace's §12 standard (resize/hide/collapse, Copy/Save/Reset,
  drag-to-reorder, Desktop/Mobile tabs, the built-in "Dev Panel"
  appearance-settings group, both-direction auto-expanding sliders).
- Real-usage bug reports from the user, fixed and verified:
  - Double-click-to-cut intermittently "just stopped working" — root cause
    was a stale `holdTimer` race in the pointer gesture state machine (see
    CODE_SUMMARY Gotchas); fixed by always clearing it at the start of a new
    pointerdown.
  - Cutting the rope while it was already mid-swing caused a visible freeze
    before the swing continued — the cut-sweep animation was pausing the cut
    piece's physics for its own duration; fixed so the sweep is purely
    cosmetic and the piece keeps moving continuously (inheriting its swing
    velocity) from the moment of the cut.
  - The rope now renders on top of the circle (was behind it).

## What's next

Nothing queued. Possible future direction the user mentioned but didn't
commit to: a Three.js-based physics/collision upgrade.

## Open questions / blockers

None currently open.
