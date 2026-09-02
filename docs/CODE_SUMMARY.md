DICKO CLICKO -- CODE SUMMARY
================================================================================

Status: see ../README.md for the project-structure layout and how to run it;
this file is a quick orientation pointer into the actual code, not a
duplicate of the README's tree.

--------------------------------------------------------------------------------
FILE MAP

- `index.html` -- the entire app. One `<canvas>` for the animation, one
  `<div id="devPanel">` (built dynamically from a config array, with
  Desktop/Mobile tabs, Copy/Save/Reset, and drag-to-reorder groups/settings
  per the workspace's §12 dev-panel standard) for the dev panel, one inline
  `<script>` for everything else. No build step, no dependencies.

--------------------------------------------------------------------------------
ARCHITECTURE

```
DEV_GROUPS (config array: one entry per *D*/*DC* from the spec)
    -> cfg{} (live values, seeded from DEV_GROUPS defaults)
    -> buildDevPanel() generates the panel DOM from DEV_GROUPS
    -> every render/physics read of a tunable value reads cfg[key] directly,
       each frame -- so most sliders are "live" with zero extra wiring.
       The two exceptions are ropeLength and ropeGrowthRate, which don't
       drive the rope's segment length directly every frame (see Gotchas).

circleAnchor() / vw() / vh() / vmin()
    -> convert cfg's %-based position/size values to CSS pixels each frame,
       so resizing the window/rotating a mobile device is handled for free.

mainRope (module state, point[0] pinned to circleAnchor())
fallenPieces[] (module state, one entry per cut-off rope segment)
    -> both are arrays of {x,y,oldx,oldy} verlet points, advanced each frame
       by integrateChain() (gravity + distance constraints) in update() --
       except a piece still mid-cut-sweep (piece.frozen), which is skipped
       by integration/floor-collision/pile-repulsion entirely (see below).

update(rawDt) each animation frame:
    1. re-pin mainRope's anchor point to the (possibly-moved) circle
    2. grow mainRope if a hold-to-grow gesture is active
    3. advance any frozen piece's cutProgress; releasePiece() it once done
    4. integrateChain() for mainRope, then for every non-frozen fallenPieces
       entry (its own gravity scale)
    5. floor collision (clamp to floorY) + pileRepulsion() across all
       non-frozen fallen-piece points, if the floor is enabled; otherwise
       cull pieces (frozen ones exempted) once fallen well below the viewport

render() each frame: background -> floor -> fallen pieces -> main rope ->
cut-sweep mark for any still-frozen piece -> circle (circle drawn last so
the rope visually emerges from behind it).
```

Input (click/hold/double-click) never touches rendering directly -- it only
ever mutates `cfg`, `mainRope`, or `fallenPieces`, which the next `update()`/
`render()` picks up. Rope pieces once cut into `fallenPieces` are never
reattached to `mainRope`.

Dev panel persistence (`saveSettings()`/`resetSettings()`/`copySettings()`):
setting *values* and the *group/row order* are one shared blob
(`localStorage['dickoClicko.devSettings']`) since every control in this
project is judged non-device-specific (see project CLAUDE.md); the panel's
own size/position is two independent blobs keyed by `activeDeviceTab`
(`'dickoClicko.devPanelGeom.desktop'` / `'...mobile'`), switched by clicking
the Desktop/Mobile tab buttons -- independent of the actual live viewport
width, so the panel's mobile layout can be previewed without resizing the
real browser window. The built-in "Dev Panel" group (§12i: font sizes,
opacity, colors for the panel's own chrome) is judged device-specific the
same way, so `panelStyle{}` rides inside that same per-tab geometry blob
(`getPanelGeometry()`'s `.style` field) rather than living in `cfg`; applied
live via CSS custom properties (`--dp-title-size`, `--dp-bg`, etc.) set on
`#devPanel` by `applyPanelStyle()`.

--------------------------------------------------------------------------------
UNTOUCHABLE SYSTEMS

None formally designated yet -- this is the initial build.

--------------------------------------------------------------------------------
GOTCHAS

- Double-click is hand-rolled (a `setTimeout` pairing keyed off
  `doubleClickThreshold` in `onPointerUp`), not the native `dblclick` event --
  a native `click` would otherwise fire before `dblclick` is recognized,
  which the spec explicitly rules out ("a double click should not trigger a
  single click"). This also means every single click has a deliberate delay
  (up to `doubleClickThreshold` ms) before the punch visibly applies, since
  the code can't yet know a second click won't follow. That delay is the
  intended tradeoff of this disambiguation approach, not a bug.
- `ropeLength`'s slider does NOT drive the rope's current segment length on
  its own every frame -- `mainRope.segLen` is deliberately decoupled from
  `cfg.ropeLength` after the rope is created, because hold-to-grow and
  cutting both need to change the *effective* length/point-count without a
  manually-dragged slider snapping it back to the full default. Dragging the
  `Rope Length` slider calls its `onChange` hook, which rescales
  `mainRope.segLen` using the rope's *current* point count (so it still
  works correctly on an already-cut remainder, without regenerating the
  chain). Any new dev control whose value needs to affect an in-flight
  simulation state (not just a per-frame render/physics read) needs the same
  `onChange`-hook treatment -- see `ropeLength`'s entry in `DEV_GROUPS` for
  the pattern.
- A perfectly vertical cut piece has no asymmetry to fall over on, so
  `releasePiece()` applies a small random initial tilt (rotated around the
  piece's own cut-point end) -- without this, a piece cut from an undisturbed
  hanging rope stands on the floor as a rigid straight column instead of
  settling into a heap. Applied at *release* time (when `cutProgress` reaches
  1), not at the moment of cutting -- applying it earlier would make the
  piece visibly snap into a tilted pose before the cut-sweep animation even
  finishes, contradicting the "still looks attached while cutting" effect.
- `applyPanelGeometry(null)` deliberately resets panel position/size/style to
  their defaults rather than being a no-op -- needed so switching to a
  Desktop/Mobile tab with nothing saved yet doesn't silently keep showing
  whatever the other tab's live (possibly unsaved) geometry/style was.
- Every `el.setPointerCapture(pointerId)` call is wrapped in `tryCapture()`
  (try/catch) and every drag/resize/reorder handler attaches its move/up
  listeners to `window`, not the captured element -- `setPointerCapture`
  throws `NotFoundError` for a pointerId the browser doesn't consider
  "active" (hit directly during this build: synthetic `PointerEvent`s
  dispatched via `javascript_tool` for testing all triggered it), and an
  uncaught throw there would otherwise abort the rest of the handler before
  the move/up listeners are ever attached, silently breaking the feature.
- Piling between fallen pieces is a plain pairwise point-repulsion pass
  (`pileRepulsion()`), not a rigid-body/polygon collision system -- a cheap
  approximation that reads as natural stacking for a handful of pieces, not
  an exact physical simulation. `MAX_FALLEN_PIECES` (60) silently drops the
  oldest piece once exceeded, to bound the O(n^2) repulsion cost.
- This headless testing environment doesn't composite frames for the
  Browser-pane tab, which throttles/pauses `requestAnimationFrame` entirely
  -- physics verification during this build was done by calling the
  (temporarily exposed) `update()` function directly in a loop via
  `javascript_tool`, not by watching the live animation. A real browser tab
  (visible, foregrounded) runs the `requestAnimationFrame` loop normally;
  this only affects how this specific environment was used to test it.
