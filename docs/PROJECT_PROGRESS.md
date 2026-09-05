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

Nothing in progress — everything below is done and pushed.

Note: this project has had multiple Claude sessions actively editing
`index.html` concurrently for an extended stretch (settings-persistence
work, anchor physics, End Emerge, and this session's Tip Segment Shape
feature all landed in overlapping windows). Several commits ended up
bundling more than one session's own changes together because the file
kept changing between read and write — always disclosed in the commit
message when it happened, never silently. Nothing has been lost; each
session verified its own feature worked correctly regardless of which
commit it ended up landing in. If something looks like it's missing or
reverted, check `git log -p` for the actual commit that touched it before
assuming it never shipped.

## Recently completed

The initial build (verlet rope physics + circle interaction) is long since
done and has gone through many rounds of user-reported bug fixes and feature
additions. Current state of each subsystem:

- **Core interactions**: click/punch (deforms the rope), hold-to-grow
  (starting on/near the circle), hold-to-charge-punch (starting on the
  rope; intensity stacks Click Intensity + Intensity Ceiling over Click
  Hold Max Duration), double-click-to-cut (works on the main rope and on
  already-fallen pieces, splitting one into two). Double-clicking ANYWHERE
  inside the circle (no longer just near where the rope happens to pass)
  detaches the entire rope and replays the startup animation to regrow a
  fresh one.
- **Physics**: fixed 1/60s timestep verlet integration; distance
  constraints (`constraintIterations`, default 10) plus a bending
  constraint (`bendStiffness`) that stops the rope folding into a knot
  under a strong punch; damping default 0.85. The rope's anchor is no
  longer rigidly pinned to the circle's center -- it's a free point
  confined inside the circle by its own boundary collision (tunable via
  Circle Offset / ANCHOR PHYSICS group). The growing tip is positioned
  directly each frame (never fed into the constraint solver) to avoid a
  documented long-hold tangling instability. Circle Offset is now
  hard-clamped so the anchor's confinement radius can never exceed the
  circle's own edge -- the circle is the master boundary, with Startup
  Rise Clear Offset nested inside it in turn (see CODE_SUMMARY gotchas).
- **Endcaps**: 24 swappable SVG designs (Form1/Form2/Form3 families)
  sharing one alignment reference so size/anchor stay consistent across
  designs; Endcap Height, an independent Endcap Gradient, and "End Emerge"
  (a freshly-cut edge's cap slides into place then scales up instead of
  appearing instantly). Known unresolved issue: the `form1-01` design
  still has a flat-neck/seam geometry defect after 2 edit attempts.
- **Rope styling**: optional Tip Segment Shape (a vase-like forked
  decorative shape near the endcap), Rope Top/End Curve Arc (half-ellipse,
  0 = flat to 1 = full semicircle), and a draggable-stop rope gradient
  editor (click a stop to open a native color picker, right-click or
  double-click to delete one).
- **Floor**: collision + piling; fallen pieces collide with each other
  (not with the still-attached main rope) and decay in thickness over
  their own lifetime down to a configurable floor.
- **Startup animation**: a permanent, always-visible background rope
  (clipped to the circle's shape) climbs on load, hands off to a
  freshly-spawned main rope at the exact handoff point (no jump), pauses,
  then grows via the same hold-to-grow mechanic used during normal play.
  A double-click-in-circle detach reuses this whole state machine with its
  own Detach Wait/Pause Duration sliders; the just-detached piece falls
  immediately, same as any other cut (an earlier version held it frozen
  until the fresh main rope spawned -- corrected per explicit follow-up:
  the wait belongs to the new rope's own endcap grow-in, not the falling
  piece's physics). bgRope's whole chain (not just its start point)
  rebuilds hanging from the real spawn point both when the climb begins
  AND at the handoff when mainRope spawns, so it's always already
  consistent with gravity's direction at both transitions -- no more
  reaction/jump at either one. bgRope's own climb now starts just out of
  sight below the circle (Rope Thickness + 1, not a full diameter).
  Startup Rise Clear Offset is a straight horizontal line again (briefly a
  circle earlier this session), measured from the Circle Offset
  boundary's own bottom point. A separate Startup Rise Gravity slider
  (independent of gameplay's own Gravity Strength) controls how fast the
  anchor settles from its offset spawn point down to its real resting
  boundary right after spawning -- stays in effect until the anchor
  actually reaches that boundary (not just until the startup sequence
  finishes), so there's no abrupt gravity-switch jolt even at extreme
  slider values -- see CODE_SUMMARY gotchas.
- **Dev panel**: fully §12-compliant (resize/move/hide/collapse,
  Desktop/Mobile tabs, drag-to-reorder groups and settings with collapse
  state persisted, built-in appearance group). Copy/Save/Reset use a
  3-tier fallback: Vercel/GitHub API (works from any device, needs
  `GITHUB_TOKEN`/`DEV_PANEL_SAVE_SECRET` env vars configured on the
  deployment) -> File System Access API (local git-tracked file write) ->
  session-only local fallback when neither is reachable. A visible
  click/hold/double-click diagnostic log lives inside the panel itself.
- **Mobile/robustness**: `vh()`/`vw()`/`vmin()`/`resizeCanvas()` fall back
  safely instead of multiplying by zero when `window.innerWidth`/
  `innerHeight` read 0 (a real early-page-life quirk on mobile
  Safari/Chrome, confirmed on a live device) -- this was the root cause
  behind several previously-confusing "circle disappears" / "double-click
  does nothing" reports. `loop()` also wraps each frame in try/catch so
  one bad frame can't permanently freeze the app.
- **FLICK animations**: two small, independent PNG overlays, each with its
  own X/Y/Scale/Speed dev-panel group. Both are hold-to-preview,
  click-to-trigger: press-and-hold cycles 4 preview frames
  (`data/FLICK/ANI/3/`) for as long as it's held, release plays exactly
  one sequence then stops until pressed again. Animation 1
  (`data/FLICK/ANI/`, 17 frames) plays one full ping-pong (1->17->1);
  animation 2 (`data/FLICK/ANI2/`, 21 frames as of this writing -- another
  session has been actively revising this frame set, check
  `FLICK2_FRAME_COUNT` in index.html for the current count -- placed above
  animation 1 by default) plays one forward pass (1->N). Both Anim Speed
  defaults are 3.2x (live values have since moved further via direct
  tuning). Hit-test rects are computed every frame independent of image
  load state, so a click works immediately on page load. A press while
  that animation is already playing is ignored (not re-armed into
  holding) so repeated impatient clicking can't interrupt/restart an
  in-progress sequence. The hold-preview cycle itself now speeds up the
  longer it's held, ramping linearly from 1x up to Flick Hold Max Speed
  as elapsed hold time approaches Flick Hold Max Duration, then holding
  flat at max past that point. A playing sequence now pauses on whichever
  frame isn't loaded yet instead of racing past it on a real-time clock
  -- fixes a real bug where a hard refresh (bypassing the browser cache
  for all ~40+ frame images) made a sequence look truncated, showing
  progressively more frames on each later click as more images finished
  downloading in the background -- see CODE_SUMMARY gotchas.

Full session-by-session history (every bug report, root cause, and
verification) is in `CHANGELOG.txt`.

## What's next

Queued (deferred from a large bug-fixing round, per explicit request):
dev-panel support for dragging a setting OUT of its current collapsible
group and INTO a different group (only within-group reordering exists
today). Also discussed but not approved: progressive cut-falling
(the cut-off segment starts sagging/falling from the cut side while still
attached by a thinning uncut strip, snapping fully free only once the cut
sweep completes) — assessed as medium difficulty (weaken, not remove, the
distance constraint at the cut segment as `cutSweep.progress` advances),
waiting on the user's go-ahead before building it. Also, longer-standing:
a Three.js-based physics/collision upgrade, and restyling the rope's
geometry to something more illustrative while keeping the same smooth
animation (the physics/render split already makes this a rendering-only
change — see CODE_SUMMARY's `strokeRopeCurve()` note).

## Open questions / blockers

- Tier 1 (Vercel/GitHub API Save) itself is confirmed working end-to-end
  — many real "Update dev-panel-settings.json via Save Settings" commits
  have landed on the remote from the live deployment throughout this
  project's history (most recently 5 more during the exact session where
  a new report came in: "when i click Save and refresh my settings dont
  stay"). Read the full save/load pipeline end to end looking for a real
  bug and found none — the fetch path in `readSettingsViaApi()` is
  correct (`/data/processed/dev-panel-settings.json`, verified against
  raw file bytes via `cat -A`, not just the Read tool's own display,
  which briefly rendered it with misleading backslashes). **Not yet
  confirmed, no access to the live Vercel deployment's own dashboard
  from this environment:** the most likely explanation is a real
  build/deploy propagation delay -- Vercel needs to rebuild after each
  GitHub commit before the new file content is actually served, so
  refreshing immediately after "Saved to repo!" could catch the
  PREVIOUS deployment. If the user confirms waiting ~30-60s before
  refreshing resolves it, this closes as expected Vercel behavior, not
  a bug; if it does NOT resolve it even after waiting, that's a real
  signal something else is wrong and needs a fresh look.
