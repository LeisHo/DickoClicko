DICKO CLICKO -- PROJECT SUMMARY
================================================================================

Status: initial build in progress, as of 2026-09-01. See PROJECT_PROGRESS.md
for what's actively being worked on right now, and CHANGELOG.txt for the
full historical log -- this file stays a mid-altitude snapshot, not a
duplicate of either.

--------------------------------------------------------------------------------
OBJECTIVE

A single-file HTML/canvas interactive toy. A circle sits center-screen with a
rope hanging from it. The rope reacts to clicks (punch/deform), click-and-hold
(grows longer), and double-click (cuts at that point -- the lower piece falls
with real physics and, if a floor is enabled, piles naturally on prior cut
pieces). Built for both desktop and mobile browsers. A dev panel (hidden in
production) exposes nearly every visual/physics parameter as a slider, color
picker, or checkbox, and is gated behind local/`?dev=1` access. This is NOT a
production data app -- no backend, no accounts, no persistence beyond the dev
panel's own settings.

--------------------------------------------------------------------------------
SCOPE

In scope: the circle + rope animation, its physics (punch, hold-to-grow,
cut-and-fall, floor collision/piling), and the dev panel that tunes it.

Out of scope / dormant: a possible future Three.js-based physics/collision
upgrade was mentioned by the user as a maybe-later direction, not part of
this build.

Audience / how it's used: single-user interactive toy/demo, deployed as a
static page.

--------------------------------------------------------------------------------
CURRENT STATE

Initial build complete and functionally verified (2026-09-01): circle +
rope rendering, verlet rope physics (punch/deform in both directions, hold
to grow, double-click to cut), floor collision, and multi-piece piling all
confirmed working via direct physics-state inspection (see
docs/CODE_SUMMARY.md's Gotchas for how, given this session's headless
testing environment). Not yet verified: real touch input on an actual
mobile device (only viewport-size emulation was tested), and the
`?dev=1`/production-hostname branch of the dev-mode gate (only the
localhost branch was exercised).

--------------------------------------------------------------------------------
DECISIONS

- Verlet-integration point-chain physics for the rope (not a rigid-body or
  spring-based model) -- gives natural deformation (punch bends the rope,
  doesn't just swing it as a rigid stick) and cut pieces can become their own
  independent falling chains cheaply.
- All dev-panel position/size sliders are expressed in %/vmin of the viewport,
  not px, per explicit requirement -- so the layout stays proportionally
  correct on both desktop and mobile. Physics itself runs in pixel space each
  frame, re-derived from the %-based config on resize.
- Single HTML file, no build step, no dependencies -- matches this
  workspace's convention for small interactive-toy projects (Clicko, Quiz
  Game, Sticko).

--------------------------------------------------------------------------------
DATA SOURCES

None -- no external data or APIs.

--------------------------------------------------------------------------------
KNOWN LIMITATIONS

- Piling between cut rope pieces is an approximation (pairwise point
  repulsion), not a rigid-body physics system -- looks natural for a
  handful of pieces, not an exact simulation.
- Real touch input on an actual mobile device hasn't been tested, only
  viewport-size emulation (which confirmed the %-based layout scales
  correctly, but not real-device touch-event quirks).
- No automated test suite -- validation so far is manual (direct physics-
  state inspection during the initial build).

--------------------------------------------------------------------------------
NEXT ACTION

See PROJECT_PROGRESS.md's "What's next" section.
