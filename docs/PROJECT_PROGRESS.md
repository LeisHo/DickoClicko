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

Dev panel audited against CLAUDE.md's own §12 standard (per explicit
request) -- already ~fully compliant (full resize/move/hide/collapse,
Copy/Save/Reset with a real git-tracked-JSON write-through, group/row
drag-reordering, click-to-edit sliders with auto-expanding bounds, the
built-in appearance group, shared X/Y origin), all 111 existing
settings across 16 groups untouched. Only real gap (button labels
"Copy"/"Save" vs. the spec's "Copy Settings"/"Save Settings") fixed
directly; the one genuine design question (no per-tab desktop/mobile
override for individual settings, only for the panel's own chrome)
was surfaced and the user confirmed leaving it as-is.

Follow-up: ported the CONCRETE reference `J:\CLAUDE\PROJECTS\.claude\TEMPLATE_DEV_PANEL.html`'s
own styling/grouping capabilities (beyond what §12's text alone
specifies) -- 16 new "Dev Panel" appearance settings (accent/slider
color, font family, button height/text-border, scroll strength, 4x
capitalize toggles, 4x letter-spacing); a "+ Add Group" button; and
group nesting (drag a group into another group's own body) with
recursive order capture/restore that lets a nested arrangement, and a
purely custom group, both survive Reset/reload. **Nesting was
originally shipped capped at one level, but a later re-check against
an updated template found and fixed a real bug: the drag hit-test's
own candidate ordering meant a drop could never actually register as
"into a specific group" via drag at all (always resolved to the
top-level container instead) -- the one-level cap was never actually
reachable in practice.** Now fixed and extended to UNLIMITED nesting
depth, verified via a jsdom simulation of the actual hit-test
algorithm (not just data structures) at 3 levels deep -- see
CHANGELOG.txt for the full account.
**Corrected in a follow-up round** ("you didnt implement the
stylizing and visuals... also provide the Text Edit mode checkbox"):
the fields that genuinely come FROM the template (accent/slider
color, font, button text border, scroll strength, 3 of the 4
capitalize toggles) now default to the template's OWN actual look
(blue `#5b85c8` accent, Verdana, capitalized button/tab/group text)
-- this project's own PRE-EXISTING appearance fields (font sizes,
opacity, bg/title/text color) predate this task and stay untouched,
since those were never part of "the template's stylizing." Also added
Text Edit Mode (a checkbox enabling inline click-to-rename for any
group title or setting label, persisted alongside the rest of the
settings blob). Verified via 2 jsdom tests -- nesting/order (5/5) and
text-edit rename/persist/cancel (5/5) -- exercising the actual
function bodies verbatim; see CHANGELOG.txt for the full account,
including one test-setup mistake caught before trusting a result. NOT
drag/rename-tested live (Browser pane still down) -- this is now the
3rd consecutive dev-panel change awaiting the user's own live test.

**Corrected 2026-09-10 (new session): the Browser pane works again.**
The 0x0-viewport/navigate-failure state described below was specific
to the PRIOR session's own Browser pane instance -- a fresh session
gets a fresh pane, and it renders/navigates/screenshots normally now
(confirmed first thing this session). Don't assume it's still broken;
if a future session hits pane trouble again, check fresh rather than
trusting this note.

Still awaiting the user's own live GAMEPLAY confirmation (cutting a
real rope in the actual running game, not a scripted physics
scenario) on several fronts below -- this session verified some of
them directly via a temporary debug hook driving the real shipped
code (not Node.js simulation), which is stronger than before but
still not the same as the user actually playing it:

- FLICK ANIMATION 3's playback actually animating through its frames
  (loading, dev-panel UI, and click/hold interaction are all confirmed
  working via network/console logs; the live per-frame tick itself
  hasn't been watched ticking).
- The endcap collision model (see "Recently completed" below) -- now 3
  collision circles per endcap end (neck-radius body point, tip proxy,
  and a NEW midpoint proxy halfway between them) instead of just the
  tip. Syntax-checked and verified end-to-end via Node simulations of
  the actual collision code with realistic numbers (tip circle's
  offset/radius computation, the midpoint proxy's own position/radius
  math, the live tangent-following proxy's translation back onto the
  real physics point, and correct overlap detection against a
  neighboring piece's own body), but not watched running live in the
  actual game.
- Rope point density (`POINT_COUNT`) raised from 14 to 20 -- more
  verlet points per chain, same total rope length (`TARGET_SEG_LEN_VH`
  auto-derives from `POINT_COUNT`, so segments just get shorter/denser).
  Not yet watched live either, same Browser pane limitation.
- NEW: piece-vs-piece contact friction (`applyContactFriction()`,
  `PIECE_FRICTION = 0.4`) -- fixes the reported "2 pieces resting flush
  keep moving slightly, sometimes slowly slide apart" symptom. Root
  cause: `resolveChainCollision()`/`resolveSelfCollision()` run a
  single un-iterated sweep per frame (unlike the distance/bend/
  boundary solve, which deliberately iterates to convergence), so many
  simultaneous contact pairs leave an uncancelled tangential residual
  that had nothing damping it (collision was normal-only, zero
  friction) -- it became real carried velocity next frame and could
  drift in a consistent direction. `applyContactFriction()` damps the
  relative TANGENTIAL velocity between each contacting pair via an
  oldx/oldy shift (same mechanism the floor clamp already uses).
  Verified via Node simulation (exact fractional reduction confirmed,
  symmetric/momentum-conserving impulse, correct behavior through the
  endcap proxy's own rotating-tangent oldx/oldy passthrough -- new
  getters/setters added to `makeTipCollisionPoint()` for this). Not
  yet watched live -- same Browser pane limitation; this is the one
  most worth testing first, since it's a direct fix for a reported bug.
- Piece-collision drift fix, 4 rounds, CONSOLIDATED here to reflect
  current state (full history in CHANGELOG.txt): reported as a folded
  piece sliding once resting on the floor. Round 1
  (`applySelfCollisionNormalDamping()` in `resolveSelfCollision()`
  only, full cancellation) shipped low-confidence and did NOT fix it.
  Round 2 (removing `clampToFloor()`'s own horizontal-velocity damping
  entirely) was proven via simulation but the sliding was STILL
  occurring -- this time with evidence a falling piece landing on an
  unrelated resting piece made THAT piece jitter too, implicating
  piece-vs-piece collision. Round 3: found `resolveChainCollision()`
  never got the same normal-damping treatment self-collision did;
  renamed the function `applyContactNormalDamping()` and wired it into
  both, at full strength -- fixed piece-landing drift (~48px/1500
  frames -> a ~1px one-time settling nudge, flat for 6000+ frames).
  Round 4 (current), triggered by 2 NEW reports -- a piece folding
  onto itself midair "suddenly falls really slowly" until it
  straightens out, and "sometimes seems to have a weird fall path...
  as if being blown by wind": isolated the cause to
  `applyContactNormalDamping()`'s FULL cancellation specifically (not
  friction, which tracked a true free-fall baseline almost exactly) --
  a densely-folded 20-point piece (matching real `POINT_COUNT`) has
  many more simultaneous self-colliding pairs than a typical piece-vs-
  piece contact, so full per-pair cancellation compounds into a real,
  measurable group-velocity drain during the first ~1s after a tight
  fold forms (some points even showed momentary negative/upward
  velocity, matching "blown by wind"). A pure speed-gated threshold
  could NOT separate this from the piece-landing case the same
  function fixes (swept 60-3000px/s, no single value worked for both).
  Fix: `applyContactNormalDamping()` gained a `frac` parameter --
  `resolveChainCollision()` keeps `frac=1` (still needed at full
  strength), `resolveSelfCollision()` now uses a new, much weaker
  `SELF_COLLISION_NORMAL_DAMP_FRAC=0.05` -- verified this STILL fully
  eliminates the original fold-on-floor drift (a persistent overlap
  accumulates enough correction over thousands of frames even at a
  weak fraction) while no longer noticeably slowing a brief mid-air
  tumble (recovered to within ~5% of true free-fall speed, vs. being
  roughly halved before).

  **Round 5 (2026-09-10, found the actual root cause):** reported
  directly that this same drift "occurs at all [Floor Friction / Rope
  Friction] settings" -- with the Browser pane finally working, drove
  the REAL shipped collision code live (temporary debug hook, removed
  before finishing) instead of a Node.js copy, and isolated the true
  cause by sweeping one variable at a time. Self-collision's own
  `frac` (round 4's fix) turned out to be irrelevant to this specific
  drift -- a velocity-gated variant made zero measurable difference.
  The real driver: `integrateChain()`'s bending constraint moved ONLY
  the middle point toward its neighbors' midpoint, unlike the distance
  constraint beside it (which always splits its correction between
  both endpoints) -- no net-momentum guarantee at all. Invisible for
  ordinary gentle curves, but a sharp, persistent fold resting on the
  floor (floor clamp pins the vertical axis, removing gravity's usual
  dominant motion) turns that per-frame asymmetric nudge into a slow,
  coherent sideways translation of the whole piece -- independent of
  any friction setting, exactly matching the report. This is very
  likely the TRUE source the whole 4-round saga was chasing symptoms
  of. Fixed by redistributing the bend correction across all 3 points
  (the middle point still gets the full nudge, its two neighbors each
  absorb half with the opposite sign), making it properly
  momentum-conserving like the distance constraint. Verified: at Floor
  Friction=0 (the documented default), drift went from a small
  baseline-matching ~21px to EXACTLY 0px across repeated runs -- full
  elimination. At the user's own live Floor Friction=0.72, drift
  dropped from 476.8px to 46-53px over 3000 frames (~89-90%
  reduction), and didn't grow linearly with more frames (bounded
  one-time settling, not an unbounded slide) -- the small remainder at
  that setting is the SAME already-documented tradeoff of manually
  raising Floor Friction above 0, just far smaller now, not a new gap.
  Mid-air tumble regression re-checked (round 4's own concern) -- no
  slowdown, though self-collision code was left untouched this round
  so this carried limited additional risk anyway. Verified via direct
  numeric measurement (real production `update()` stepped thousands of
  frames) plus one visual screenshot; NOT yet confirmed via the user
  actually cutting a rope and folding a piece in real gameplay -- worth
  a real play-test to close this out. This is the 5th round on this
  bug class; unlike rounds 1-4, this one found and fixed the actual
  shared root cause rather than another symptom-level mitigation.
- NEW: `PIECE_SPAWN_GRACE_RADIUS_FRAC` reduced `2 -> 0.3` -- fixes 2
  reports: "the subsequent 2 rope pieces should still have collision
  detectors" (after cutting an already-cut piece) and, more
  concretely, "when i cut a rope piece lying on top of rope pieces,
  atleast one of the cut pieces will fall through the ropes they are
  resting on." Root cause (HIGH confidence, logically derived, not
  just hypothesized): the spawn-grace window doesn't just skip a
  one-time overlap check -- it disables ALL piece-vs-piece collision
  for a freshly-created piece, including the continuous every-frame
  counter-gravity correction a resting piece depends on, for the
  whole window. A piece that spawns already resting on other ropes
  (cutting a piece that was itself lying on top of others) has
  nothing holding it up until grace clears -- it falls straight
  through, unopposed. Real tradeoff: this mechanism exists because
  `COLLISION_MAX_PUSH_PER_S` alone was found insufficient for the
  ORIGINAL concern it protects against (a piece spawning violently
  deep inside an unrelated one, "shoots downward fast... floating") --
  so a shorter window is a mitigation, not a guarantee; verified via
  Node that it clears ~6.7x sooner (~3px of fall vs. ~20px, radius-10
  example) but an overly short window could theoretically let that
  older symptom back in. Worth testing BOTH directions live: does a
  piece cut while resting on others still sink through at all, and
  has "shoots down fast on a coincident double-cut" come back.
- NEW: 2 friction sliders in the FLOOR group, per explicit request.
  "Floor Friction" (`cfg.floorFriction`, def 0) reintroduces the
  per-point horizontal-velocity-removal the fold-on-floor fix above
  just deleted, but as a live slider gated on `>0` so the default is a
  true no-op. Real, disclosed tradeoff, not an oversight: turning it
  up AT ALL brings back meaningful fold-on-floor sliding (verified --
  even a mild 0.2 reproduced ~17px of drift over 1500 frames, not just
  the old hardcoded-equivalent 0.7). "Rope Friction"
  (`cfg.pieceFriction`, def 0.4) is the existing `PIECE_FRICTION`
  constant made live-tunable, no default-behavior change; applies to
  piece-vs-piece, mainRope-vs-piece, and self-collision alike (one
  shared slider, matching the existing single-constant architecture).
  Not yet watched live (Browser pane down).
- NEW: FLICK ANIMATION 3's frame-source data model rebuilt.
  "i updated animation 3's grames" turned out to mean the export-batch
  suffix convention itself had changed (source 1 "(7)"->"(1)" plus a
  dropped frame; source 2 now mixes 2 different suffixes within one
  source; source 3 dropped its suffix entirely, with stale duplicate
  files left behind in B) AND that 2 brand-new frame sets (4, 5) had
  been added needing full dropdown integration. Per direct
  clarification (2 AskUserQuestion rounds -- source 3/B's duplicate
  resolved by file mtime, set 4's known gaps -- missing frame 15, a
  frame-10 duplicate, unsorted loose root files -- accepted as-is, not
  bugs): `GENERATED_A_FRAME_NUMBERS_BY_SOURCE`/`GENERATED_SOURCE_SUFFIX`/
  `GENERATED_B_FRAME_NUMBERS` (number lists + a derived per-source
  suffix) replaced with `GENERATED_A_FILES_BY_SOURCE`/
  `GENERATED_B_FILES_BY_SOURCE` -- literal per-source filename arrays,
  generalizing the pattern the C-folder hold-preview already used
  rather than 2 different lookup strategies. `GENERATED_SOURCES`
  extended to `['1','2','3','4','5']`; both frame-loading loops already
  iterated it generically, so the 2 new sets needed no other code
  changes beyond the new data + a "Set 4"/"Set 5" dropdown option each.
  All 133 hardcoded filenames across A/B/C x 5 sources verified to
  actually exist on disk via a Node script before trusting them -- 0
  missing. Regenerated all 30 C-folder `.webp` files (A/B load PNG
  directly, confirmed via the existing code -- no conversion needed
  there). Frame counts now genuinely differ per source (20/21/21/20/21,
  previously a uniform 21) -- `flick3FrameCount()` already read this
  live, no change needed. Not yet watched live (Browser pane down) --
  worth testing all 5 dropdown entries specifically, especially 4/5
  (new) and 2 (the mixed-suffix case).

`ENABLE_ENDCAP_AND_MAINROPE_COLLISION` is `true` (attempt #6, now with
the added midpoint proxy -- see "Recently completed" for the full
history of why it was off and what changed). `sharp` is available in
this environment (`npm install sharp` works, ~5s) for any future
PNG->WebP regeneration need.

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
  already-fallen pieces, splitting one into two, and now also works while
  mainRope is mid-scripted-growth right after a boot or a full detach,
  not just once that growth finishes -- still gated by the existing
  Minimum Rope Length check). Double-clicking ANYWHERE inside the circle
  (no longer just near where the rope happens to pass) detaches the
  entire rope and replays the startup animation to regrow a fresh one --
  regrows to Default Rope Length, a dedicated config value separate from
  the live/current Rope Length control, so an earlier grow or cut never
  changes what a full detach regrows to (see CODE_SUMMARY gotchas). A
  press-and-hold that starts inside the circle during a detach's own
  regrowth ('growing' phase) can never arm the hold-to-charge-punch timer
  (tracked via `startedInCircle` on the rope-mode downInfo) -- releasing
  it no longer fires an unintended Flick; cutting during growth (a
  separate, still-wanted feature) is unaffected.
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
  appearing instantly). An endcap now renders overlapping 1.5px into the
  rope's own stroke end rather than meeting it at an exact boundary,
  closing a canvas anti-aliasing seam that was visible between the two
  independently-drawn shapes. Known unresolved issue: the `form1-01`
  design still has a flat-neck/seam geometry defect after 2 edit
  attempts (a separate, geometry-authoring issue, not the AA seam above).
  A still-emerging (small-scale) endcap now correctly renders BEHIND the
  rope's own plain round-cap end arc rather than in front of it -- a
  draw-order fix (`drawRopeEndArcs()` now runs after `drawEndcap()`), not
  a change to when either one shows. The hidden/mid-emerge endcap now
  also starts at a configurable WIDTH (Endcap Starting Scale (Width),
  0.6-1, def 1) rather than always full width -- previously only the
  height axis (Endcap Starting Scale) shrank at the start of emergence.
  Applies to both a boot/End-Emerge spawn and a detach-triggered spawn.
  An endcap's own rendered shape (which can extend well past its
  underlying physics point, especially with Endcap Height cranked up) is
  now included in floor collision too, via `endcapExtensionPx()` mirroring
  `drawEndcap()`'s own geometry to inflate that chain's collision radius
  -- approximated as a bigger circle centered on the same point rather
  than true polygon collision (a deliberate simplification for a
  decorative feature). Endcaps on fallen pieces no longer visibly overlap
  other pieces or their endcaps.
- **Rope styling**: optional Tip Segment Shape (a vase-like forked
  decorative shape near the endcap), Rope Top/End Curve Arc (half-ellipse,
  0 = flat to 1 = full semicircle), and a draggable-stop rope gradient
  editor (click a stop to open a native color picker, right-click or
  double-click to delete one). The plain round-cap end/start arc has its
  own independent gradient too (Rope End Arc Gradient), separate from
  both the rope-body gradient and Endcap Gradient -- a local gradient
  across just the arc's own small bump, not the whole rope's span. That
  arc also now overlaps into the rope's own stroke end (same fix as the
  endcap/rope seam) rather than meeting it at an exact boundary, closing
  the same class of canvas anti-aliasing seam -- the overlap amount is
  now a live dev-panel slider (Rope End Arc Seam Overlap, 0-5px, def 3)
  rather than a hardcoded constant. Fallen pieces have their own
  independent gradient too (Piece Gradient), separate from Rope
  Gradient -- previously a piece always matched whatever gradient the
  still-attached rope had.
- **Floor**: collision + piling; fallen pieces collide with each other
  (not with the still-attached main rope) and decay in thickness over
  their own lifetime down to a configurable floor. `pieceCollision()`'s
  per-pair separation distance now tracks each piece's own live (decaying)
  thickness rather than a frame-global value pinned to the undecayed
  default -- a piece resting on top of another no longer stays held up at
  the original separation once the piece beneath it has visibly thinned.
  That same separation formula now undershoots exact contact by a small
  margin -- a fixed FRACTION of the pair's own combined radius
  (`PIECE_SEAM_OVERLAP_FRAC`, 15%) rather than a fixed pixel amount, so
  the margin can never exceed and fully cancel out separation once both
  pieces decay near Piece Minimum Thickness (the old fixed-px version
  could, which was flattening a whole pile into a single visual layer
  once pieces got thin enough). Piece Endcap Emerge Speed is its own dev
  control, independent of mainRope's End Emerge Speed -- a fallen piece's
  tip/cut-edge emerge animation no longer shares a rate with the
  still-attached rope's tip. Each fallen piece also self-collides -- its
  own far-apart sections (at least 4 points apart by chain index,
  MIN_SELF_COLLISION_GAP) push off each other if a fold/coil brings them
  spatially close, using thickness-only radii, never the endcap-inflated
  radii cross-piece collision uses (a piece's own tip and cut edge are
  always far apart by index, so the gap exclusion can't protect that
  specific pair on its own). The index gap is what makes self-collision
  safe at all: it deliberately never touches adjacent-or-near points,
  which are always close by construction and would otherwise fight the
  chain's own normal bending -- the exact failure mode that got this
  project's earlier, adjacency-unaware self-collision system
  (pileRepulsion()) removed.
  `topplePiece()` (the random initial tilt every newly-cut/detached
  piece gets) had a genuine, independently-verified velocity bug: it
  measured a point's OLD position relative to the pivot's CURRENT
  position instead of the pivot's own OLD position, mixing 2 different
  instants into one frame of reference -- for a pivot that itself had
  real velocity, this produced an implied velocity in the WRONG
  DIRECTION for every other point in the piece, not just a wrong
  magnitude (confirmed by hand and via simulation). This is what
  actually caused 2 reported regressions that an earlier, incorrect
  self-collision fix didn't resolve: "the cut off rope gets flung to the
  floor, far faster than the normal falling speed" on a full detach
  (whose pivot is the OLD ANCHOR -- the one point in the whole chain
  most likely to carry real velocity from the circle's own boundary-
  clamp physics right at the cut moment) and cut segments "look like
  theyre floating" once piled (the same bug applies to every piece
  creation, not just full detaches). Fixed by using the pivot's own old
  position consistently; verified equivalent to the original formula
  whenever the pivot is stationary, so ordinary mid-rope cuts are
  unaffected -- only the moving-pivot case, where the bug actually
  lived, changed. A SECOND, distinct velocity bug in the same function
  survived that fix and was found via a fresh user-recorded video showing
  "shoots downward really fast" still happening on a full detach of a
  short, freshly-cut rope: `topplePiece()`'s rotation is only mathematically
  correct for points whose old/new position pair are both real,
  same-instant physics state -- but mainRope's own currently-growing tip
  (positionGrowingTip()) deliberately fakes its old position equal to its
  new one every frame (zero implied velocity, by design, so it never enters
  the solver). Rotating that fabricated "old" position through the SAME
  transform as a pivot with real velocity derives the tip's rotated-old
  state from a different reference instant than its rotated-new state,
  leaking a real fraction of the pivot's own velocity (~20-30% for a
  typical topple angle, confirmed via direct simulation) into a point that
  should have had none -- for a short piece cut off mid-growth, that tip
  IS most of the piece's visible extent, so the leak reads as the whole
  piece shooting off. `topplePiece()` now takes an optional
  `preserveTipZeroVelocity` flag (passed as `mainRope.tipGrowLen <
  mainRope.segLen`, i.e. "was this piece's own last point still mid-growth
  the instant it was cut") that re-zeros just that one point's implied
  velocity after the topple rotation, restoring the same "just created, no
  momentum yet" invariant the tip already had before toppling -- its
  position still gets the normal random tilt, only the fabricated
  non-velocity is prevented from leaking real motion into it. Does not
  apply to a piece splitting off an already-fallen piece (performPieceSplit)
  -- fallen pieces have no growing-tip concept, every one of their points is
  already a settled physics point. The SAME video also re-confirmed
  "floating" is still present, just less severe than before
  ENDCAP_COLLISION_RADIUS_FRAC shipped (a real, visible ~70-90px gap
  measured directly from this video's frames) -- left unresolved this
  round rather than adjusting that fraction again without new measurement
  of what value would actually be correct; needs its own dedicated look.

  Both symptoms persisted after the topplePiece() fix above. Per the
  user's own explicit redirect ("figure out what was changed right before
  i brought up these 2 issues" instead of another forward-guessing fix
  attempt), git-archaeology on the original regression commit
  (`a29da9c`, which first added piece-vs-piece endcap-inflated collision)
  found the real gap: mainRope-vs-piece collision got its own dedicated
  spawn-time exclusion (mainRopeExcluded) specifically because "a rope
  colliding with the piece it just split from" was reported and fixed --
  but piece-vs-piece collision (2 DIFFERENT fallen pieces pushing each
  other apart) never had any equivalent protection. A freshly-created
  piece spawning already spatially overlapping a different, unrelated
  existing piece (2 cuts landing close together, or a new piece falling
  through wherever an earlier one already is) gets shoved apart
  immediately by resolveChainCollision()'s own per-frame push, capped at
  COLLISION_MAX_PUSH_PER_S but still ~2952px/s for this project's own
  viewport -- easily read as "shoots downward really fast" for however
  many frames the real overlap takes to resolve, then "floating" once it
  settles at the (already-known-oversized) endcap-inflated minSep.
  Cross-checked directly against the user's own video: the newly-cut
  piece from a full detach visually and positionally overlapped a
  still-falling piece from an earlier mid-rope cut for the entire
  duration of its own reported "fast fall."

  Fixed by generalizing mainRopeExcluded's own grace pattern to every
  piece: setPieceSpawnGrace(piece), called right after all 3 piece-
  creation sites (detachEntireRopeAndRestartIntro, performMainRopeSplit,
  performPieceSplit), captures that piece's own points[0] position at
  creation; pieceSpawnGraceActive(piece, radius) — checked per-pair in
  the piece-vs-piece loop, using that piece's own already-computed
  maxRadius (self-contained, since piece-vs-piece can't know in advance
  which other piece it needs clearance from, unlike mainRopeExcluded
  which always pairs against mainRope specifically) — excludes a piece
  from every piece-vs-piece pair until its own reference point has moved
  a real distance (its own radius × 2, a judgment call, same kind as
  mainRopeExcluded's own × 1.5) from where it spawned, then clears
  permanently. Verified via Node simulation that the grace activates
  immediately at spawn and clears naturally within a handful of frames
  under normal gravity (not a permanent freeze). Reported "still
  persists" after this shipped -- see "Currently working on" above for
  the full status.

  Live interactive testing (first time this session the Browser pane
  actually worked end-to-end): dispatching synthetic PointerEvents
  directly at the canvas DOES reach the game's own input handling (hold-
  to-grow during the intro's own auto-growth phase, and double-click-to-
  cut both work) -- confirmed the currently-served page really does run
  the spawn-grace fix's own code (ruling out a stale build), but
  reliably reproducing the EXACT reported scenario (2 cuts landing close
  together in time, genuinely overlapping) through scripted events
  proved too unreliable to get a clean before/after measurement in the
  time available.

  Separately, floor rest position was fixed: mainRope/fallen pieces
  clamped their own CENTERLINE to the floor line, so a piece lying flat
  visually sank into the floor by half its own thickness (reported
  directly: "the floor line goes through the horizontal center of the
  rope when its lying flat"). Both clamps (mainRope's own live thickness,
  each piece's own current/decayed thickness via pieceThickness()) now
  stop at `floorY() - thickness/2` instead of `floorY()`, so the chain's
  real rendered underside rests on the floor line. Syntax-checked; not
  yet confirmed via a clean live screenshot (the intro's own auto-growth
  pace and this tooling's synthetic-cut reliability made a fast visual
  check impractical this same session -- code-reviewed correct against
  the existing, already-proven pattern used elsewhere for this exact
  kind of offset).

  mainRope itself now also collides with any piece pile
  on the floor (previously only the floor plane itself), using
  the same shared collision helpers as piece-vs-piece so an extended-long
  rope piles up on top of a pile rather than clipping through it. Every
  collision correction (piece-vs-piece included) is capped to a fixed
  px/s rate (COLLISION_MAX_PUSH_PER_S) so any overlap resolves gradually
  rather than snapping, and mainRope-vs-piece only engages when the tip
  is actually within 10%vh of the current pile's own topmost point,
  never during ordinary post-cut hanging/swinging. Both mainRope-vs-piece
  and piece-vs-piece scale the endcap's own collision-radius contribution
  down to half its full extension length (ENDCAP_COLLISION_RADIUS_FRAC) --
  found via direct video frame analysis (OpenCV connected-component
  centroid tracking, not just eyeballing) that a piece resting on a pile
  drifted only ~20-115px over 6+ real seconds instead of settling flush,
  because the FULL endcap length used as a collision-circle radius
  overestimates how "fat" the real, narrow/tapered endcap graphic
  actually is, leaving a real physics/visual gap between 2 touching
  endcaps that gravity alone took a very long time to close. A cut's own remaining
  chain also has its implied velocity (oldx/oldy) zeroed at the exact
  moment of the split -- otherwise it kept carrying momentum shaped by
  the now-removed trailing mass, a real recoil this project's own
  deliberately low damping let ring out visibly ("as if having been
  flicked"). A piece freshly split off mainRope carries a permanent-
  until-cleared `mainRopeExcluded` flag (plus the exact position it was
  created at): mainRope-vs-piece collision skips it entirely, and the
  proximity gate's own "how close is the nearest pile" check ignores it
  too, until its own cut edge has moved a real, comfortable distance
  away from that origin -- an absolute, distance-based guarantee (not a
  fixed time window, which couldn't guarantee real separation under weak
  gravity or a heavy endcap) that a rope and its own just-cut piece never
  collide with each other.

  **Superseded (attempt #6):** everything above describing the endcap's
  own collision contribution as "one circle centered on the physics
  point, radius = a fraction of the endcap's full length" is now
  historical -- per explicit request/correction ("instead of doing the
  radius thing you did previously... put a collision circle at the tip
  of the endcap, where it's narrower, and the diameter of that circle
  will be the dimension of that narrow end of my SVG"), replaced with a
  SMALL circle positioned at the endcap's own real narrow tip (offset
  past the physics point along its current tangent, via the new
  `makeTipCollisionPoint()`), sized by the design's own real measured
  tip width (`ENDCAP_TIP_WIDTH`/`endcapTipRadiusPx()`, computed from the
  actual SVG path the same way `ENDCAP_BOTTOM_Y` already was) rather
  than a judgment-call fraction of its length.
  `ENABLE_ENDCAP_AND_MAINROPE_COLLISION` is `true` again with this new
  model live -- the pileTopY settledness fix from attempt #5 stays in
  place regardless (a real, standalone correctness fix, independent of
  the radius question). Full mechanism details and verification in
  docs/CHANGELOG.txt; not yet confirmed via a live visual check (the
  Browser pane went into an unrecoverable 0x0/hidden state mid-task).
- **Startup animation**: a permanent, always-visible background rope
  (bgRope, clipped to the circle's shape) climbs on load, starting just
  out of sight below the circle (Rope Thickness + 1, not a full
  diameter). Once it clears Startup Rise Clear Offset (measured from the
  Circle Offset boundary's own bottom point, clamped to the circle's own
  drawn edge so an extreme Offset can't send it off-graphic), it HOLDS
  motionless there -- not mainRope, which doesn't exist yet -- for the
  whole Pause Duration (Startup Pause Duration at boot, Detach Pause
  Duration on a detach). If Background Rope Start Endcap is on, bgRope's
  own endcap scales from Background Rope Endcap Height (its climb
  height) DOWN TO Background Rope Endcap Pause Height over that same
  pause -- and mainRope's own boot-spawn endcap picks up at that exact
  same Pause Height, so the handoff has no size jump.

  Only once the pause ends does mainRope actually spawn: its WHOLE chain
  is rebuilt fresh from the spawn point (not just its anchor point --
  patching only the anchor left the rest of the chain hanging from the
  OLD position, which the distance constraint would violently whip back
  toward the instant a real Clear Offset placed the new spawn point far
  from it), and it immediately begins both falling and growing at once.
  Falling: Startup Rise Gravity governs the anchor until it genuinely
  arrives at its real rest point (the boundary's own bottom point --
  measuring distance from CENTER instead was tried and discarded, since
  a Clear Offset can place the spawn point closer to center than the
  boundary radius despite a real fall still ahead); the anchor's hard
  boundary clamp relaxes to the circle's own edge (not fully
  unconstrained) during this fall so it can never visibly leave the
  circle, then reasserts with its implied velocity zeroed on that exact
  transition frame so re-tightening the clamp doesn't bounce it. Growing:
  the same hold-to-grow mechanic normal play uses, paced by Startup/
  Detach Extension Speed. mainRope only becomes visible once it's
  actually spawned (start of 'growing') -- never during 'waiting',
  'rising', or the pause.

  mainRope's own endcap: a detach-triggered spawn scales it from Detach
  Endcap Start Scale up to full size over Detach Endcap Grow Duration
  (armed at the actual spawn moment, not the earlier detach trigger, so
  the grow-in isn't already finished by the time it's shown); a
  boot-triggered spawn instead starts at Background Rope Endcap Pause
  Height and grows to full size at Main Rope Endcap Growth Speed -- the
  two are mutually exclusive, never stacking.

  A double-click-in-circle detach reuses this entire state machine; the
  just-detached piece falls immediately (not frozen -- the wait belongs
  to the new rope's own endcap grow-in, not the falling piece's
  physics). See CODE_SUMMARY gotchas for the fuller history of bugs this
  mechanism went through to get here.
- **Dev panel**: fully §12-compliant (resize/move/hide/collapse,
  Desktop/Mobile tabs, drag-to-reorder groups and settings with collapse
  state persisted, built-in appearance group). Copy/Save/Reset use a
  3-tier fallback: Vercel/GitHub API (works from any device, needs
  `GITHUB_TOKEN`/`DEV_PANEL_SAVE_SECRET` env vars configured on the
  deployment) -> File System Access API (local git-tracked file write) ->
  session-only local fallback when neither is reachable. A visible
  click/hold/double-click diagnostic log lives inside the panel itself --
  now also logs FLICK animation presses/releases (down:flick[2],
  up:flick[2]-play, and an -ignored-playing variant when a press is
  ignored because that animation is already playing). Every standalone
  color-picker control (not the gradient editor's per-stop pickers) has
  Copy/Paste buttons -- a single shared in-memory value, so any color can
  be copied from one picker and pasted into any other.
- **Dev-only visuals**: the FLICK animation overlay and the "Debug: Show
  Rise Clear Offset Line" boundary visualization now both render only
  under DEV_MODE, per explicit request that neither should be visible to
  a real visitor -- previously both could render on the live deployment
  once the settings-loading fix (below) made their saved config values
  actually apply outside dev mode too.
- **Mobile/robustness**: `vh()`/`vw()`/`vmin()`/`resizeCanvas()` fall back
  safely instead of multiplying by zero when `window.innerWidth`/
  `innerHeight` read 0 (a real early-page-life quirk on mobile
  Safari/Chrome, confirmed on a live device) -- this was the root cause
  behind several previously-confusing "circle disappears" / "double-click
  does nothing" reports. `loop()` also wraps each frame in try/catch so
  one bad frame can't permanently freeze the app. Saved/tuned settings
  (`resetSettings()`) now load for every visitor, not just a `?dev=1`
  one -- previously nested entirely inside the DEV_MODE gate, so a real
  visitor silently ran on hardcoded code defaults while `?dev=1` on the
  exact same deployment showed the real tuned config -- see CODE_SUMMARY
  gotchas.
- **FLICK animations**: 3 small, independent overlays, each with its own
  X/Y/Scale/Speed dev-panel group. All 3 are hold-to-preview,
  click-to-trigger: press-and-hold cycles a shared preview
  (`data/FLICK/ANI/3/FRAMES-01/01A/01B/01c`) as a 6-step ping-pong
  (1,1a,1b,1c,1b,1a, loop -- `FLICK_HOLD_SEQUENCE` in index.html holds
  the index-into-`flickHoldFrames` for each step; NOT a plain 1..N
  numbered range despite `FLICK_HOLD_FRAME_COUNT`'s name -- that
  constant is the SEQUENCE's length now, 6, not the distinct-image
  count, 4) for as long as it's held, release plays exactly
  one sequence then stops until pressed again. Animation 1
  (`data/FLICK/ANI/`, 17 frames) plays one full ping-pong (1->17->1);
  animation 2 (loaded directly from `data/FLICK/ANI/1` in sequence then
  `data/FLICK/ANI/2` in reverse -- 20 frames as of this writing (11 + 9);
  no intermediate `ANI2` folder anymore, see CODE_SUMMARY gotchas for why
  that was removed -- check the `ANI1_FRAMES`/`ANI2_FRAMES` arrays in
  index.html for the current frame-number lists, and re-verify them by
  hand (`ls` both folders) any time either one's contents change --
  placed above animation 1 by default) plays one forward pass (1->N).
  Animation 3 (added this session, PNGs not WebP) is the SAME "folder A
  forward then folder B reversed" design as animation 2, but sourced
  from `data/FLICK/Genereated/<N>/A` and `.../B` where N is switchable
  at runtime via a new Flick3 Frame Set dropdown (values 1/2/3, per
  explicit request) -- `flickFrames3BySource` preloads all 3 sets'
  worth of Image objects up front so switching the dropdown never waits
  on a fresh fetch. All 3 sets share the same frame-number pattern
  (`GENERATED_A_FRAME_NUMBERS`/`GENERATED_B_FRAME_NUMBERS` in index.html,
  8 + 15 = 23 frames each) but differ in their filenames' own trailing
  `(7)`/`(6)`/`(5)` batch-number suffix (`GENERATED_SOURCE_SUFFIX`) --
  re-verify both by hand (`ls` each of the 6 folders) if any set's own
  contents ever change. All 3 animations' Anim Speed
  defaults are 3.2x (live values have since moved further via direct
  tuning). Hit-test rects are computed every frame independent of image
  load state, so a click works immediately on page load. A press while
  that animation is already playing is ignored (not re-armed into
  holding) so repeated impatient clicking can't interrupt/restart an
  in-progress sequence. The hold-preview cycle itself now speeds up the
  longer it's held, ramping linearly from 1x up to Flick Hold Max Speed
  as elapsed hold time approaches Flick Hold Max Duration, then holding
  flat at max past that point. A playing sequence pauses on whichever
  frame isn't loaded yet instead of racing past it on a real-time clock.
  Animation 3's own playback tick was NOT confirmed via live frame-by-
  frame observation -- the Browser pane was hidden at the host level for
  this whole task (`document.hidden`/`visibilityState` both confirmed
  `true` even after explicitly fronting the tab), which suspends
  requestAnimationFrame entirely regardless of which tab is selected;
  everything NOT gated on rAF (frame loading -- all 23x3 URLs confirmed
  200 OK; dev-panel rendering; click/hold state transitions, confirmed
  live via console click-logs) checked out fine, and the tick logic
  itself is structurally identical to animation 2's own already-proven
  code.
  All 42 frames across the 3 folders were originally 6870x6166px PNGs
  (up to 760KB each) despite rendering at only 50% vmin on screen --
  fine on the local dev server's cache but on the deployed Vercel site
  the ~40 concurrent oversized requests fired on every page load
  genuinely competed for the visitor's real bandwidth, so some frames
  arrived late or not at all, which is what "truncated playback" on the
  live site actually was (confirmed via a live probe against real
  frames: some took ~19s to resolve). Resized to 1400px wide and
  re-encoded as WebP -- 22.6MB -> 2.1MB total (90.7% smaller),
  measured zero failed/slow loads afterward. Old PNGs are still on disk,
  unreferenced by the game itself, not yet deleted -- kept as the actual
  source-of-truth for hand-drawn edits (the user edits these, not the
  WebP directly), so any future frame edit needs its WebP regenerated to
  match (resize to 1400px wide, re-encode) before it'll show up live --
  see CODE_SUMMARY gotchas.
- **Rope Attraction**: right-click-and-hold pins mainRope's own tip to a
  moving target (seeded from and eased from the endcap's own position at
  the moment the hold starts, toward the mouse, capped by Max Reach
  Distance -- measured from that same starting position, not the anchor
  -- plus the rope's own real physical length measured from the anchor,
  AND -- while the pin sits closer than the rope's real length -- a
  temporarily-shrunk effective rest length plus a small deterministic
  perpendicular nudge, both needed to stop the excess slack from folding
  into a sharp hook when the reach target lies near the same line
  gravity already pulls the chain along) exactly the way the anchor is
  already pinned to the circle boundary --
  the existing distance/bend relaxation then bends the WHOLE chain
  between these 2 fixed points on its own, so a short rope simply can't
  reach as far and a long rope bows between the 2 points instead of
  folding. The tip's own immediate neighbor point is ALSO directly
  placed each frame, exactly on the ray from the tip back toward the
  mouse, so `tipDirection()` (which reads the tangent between those 2
  points for the endcap's own rotation) points exactly at the mouse --
  without this, the neighbor's position was left to gravity/relaxation
  alone and could land up to ~25 degrees off the true mouse direction
  even with the anti-fold measures active. Several earlier designs (a
  single-point nudge, a weighted-span nudge, the pin alone with no
  anti-fold handling, the pin with anti-fold but no facing correction)
  were tried and replaced after real reported problems. New RIGHT CLICK
  dev-panel group (Intensity, Speed, Max Reach Distance). Verified via
  direct Node simulation of the actual constraint math, including with
  the user's
  own live settings dump reproducing the exact reported configuration --
  this environment's Browser pane reported itself hidden independent of
  tab-fronting for every task this session touched it (see CODE_SUMMARY
  gotchas).

Full session-by-session history (every bug report, root cause, and
verification) is in `CHANGELOG.txt`.

## What's next

Queued (deferred from a large bug-fixing round, per explicit request):
dev-panel support for both creating new custom collapsible groups
("allow me to create new groups") and dragging a setting OUT of its
current collapsible group and INTO a different group (only within-group
reordering exists today; confirmed via AskUserQuestion that both pieces
are wanted).

Also discussed but not approved: progressive cut-falling
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
