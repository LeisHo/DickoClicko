# Dicko Clicko — Project Conventions

Single-file HTML/canvas interactive toy. See `docs/PROJECT_SUMMARY.md` for
what it is, `docs/CODE_SUMMARY.md` for how `index.html` is structured.

## File map

Everything lives in `index.html` — markup, CSS, and JS all inline, no build
step, no dependencies. The `data/`, `datalog/`, `config/`, `models/`,
`deliverable/`, `logs/`, `results/`, `scripts/`, `src/`, `tests/` folders are
the workspace-standard scaffold (CLAUDE.md §11) and are not used by this
project — this is a deliberate single-file architecture exception, same as
Clicko / Quiz Game.

## Untouchable systems

None formally designated yet.

## Dev-panel prompt shorthand (how the user specs dev controls)

When the user writes a spec message for this project, this notation means:

- `*DEV*<label>*` — add one dev-panel control (slider or input) for that
  setting. E.g. `*DEV*Circle Size*` → a slider labeled "Circle Size".
- `*DEV*<label>*<note>*` — same, with a note overriding the default control
  type, e.g. `*DEV*Rope Color*Color Picker not sliders*` → a color-picker
  input, not a slider.
- `*COL*<title>*` — every `*DEV*` that follows belongs in one collapsible
  group in the dev panel titled `<title>`, until the next `*COL*`.

## Dev-panel behavior (standing conventions, apply to every control)

- Every slider's numeric readout is a clickable/editable textbox: typing a
  value beyond the slider's current min/max is accepted and applied for real
  — the slider handle itself stays visually clamped at its end, but the
  underlying value is the typed one (same pattern as Clicko's
  `applySliderValue()`/`makeDevValuesEditable()`).
- **Future-default-value rule:** if the user later gives new default settings
  and any number they provide exceeds a slider's current max, raise that
  slider's max to `provided value * 1.2` (not just to the provided value) —
  so the new default isn't sitting at the extreme end of its own range. This
  applies to *user-provided* defaults going forward, not a runtime feature of
  the page itself.
- Position/size dev values are expressed in **%/vmin of the viewport**, not
  px, so the layout stays proportionally correct on both desktop and mobile.
  Physics runs in pixel space each frame, re-derived from the %-based config
  (including on resize).

## Gotchas

- Dev mode gates on `location.hostname` being `localhost`/`127.0.0.1`,
  `location.protocol === 'file:'`, or `location.search` containing `dev=1` —
  don't gate on `NODE_ENV` or anything build-time, there is no build step.
- Double-click detection is custom (a `setTimeout` pairing on pointerup), not
  the native `dblclick` event — a native `click` would otherwise fire before
  a `dblclick` is recognized, contradicting the requirement that a double
  click must not trigger a single click in between. See `docs/CODE_SUMMARY.md`
  for the exact gesture state machine once it's built.
