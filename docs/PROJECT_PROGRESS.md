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

Nothing in progress — dev-panel §12 retrofit + directional cut animation are
done, verified, and ready to push.

## Recently completed

- Initial build: circle + rope rendering, verlet rope physics (punch, hold-
  to-grow, double-click-to-cut), floor collision + piling, full dev panel
  with all spec'd controls, dev-mode gating.
- Dev panel brought in line with the workspace-wide §12 standard (added
  after the initial build): all-4-edge/corner resize, D-key hide + separate
  collapse button, Copy/Save/Reset (+R key), drag-to-reorder groups/settings
  with persisted order, Desktop/Mobile tabs (panel geometry independent per
  tab; every setting judged shared since all are already %/vmin-based), and
  a real both-directions auto-expanding slider range on typed input.
- Directional cut animation: cutting now freezes the lower piece and plays a
  sweep mark across the rope's thickness in the direction the click came
  from (right-of-rope click -> sweeps right-to-left, and vice versa) before
  releasing it to fall, at a rate set by the new Cut Speed dev control.
- Found and fixed a real robustness bug while testing the above:
  `setPointerCapture` can throw (`NotFoundError`) for a pointerId the
  browser doesn't consider active, which would silently abort a drag/resize/
  reorder handler before its move/up listeners even attach — now guarded
  everywhere via `tryCapture()`, with listeners on `window` rather than the
  captured element so capture failing doesn't break the feature.

## What's next

Nothing queued. Possible future direction the user mentioned but didn't
commit to: a Three.js-based physics/collision upgrade.

## Open questions / blockers

None currently open.
