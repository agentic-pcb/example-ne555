# example-ne555

![Schematic](__snapshots__/index.circuit-schematic.snap.svg)

![PCB layout](docs/images/pcb.png)

![3D view](docs/images/3d.png)

PCB design written in [tscircuit](https://tscircuit.com) (React/TSX, compiled by the `tsci` CLI). This file is the project doc: requirements, design decisions and status go here and should be kept current as the design evolves.

## Status

First complete draft: 5V NE555 LED flasher, builds cleanly (`tsci build`), `tsci check shorts` and placement DRC are clean. Not yet fabricated or tested on hardware.

## Requirements

- **Purpose:** flash a red SMD LED, 0.3 s ON / 0.6 s OFF, using an NE555.
- **Board size / form factor:** 25 x 20 mm, all parts on the top side. It was 20 x 20 mm until DESIGN.md grew to 43 rules: at 20 mm wide J1 was 0.04 mm from R1/R2 and 0.88 mm from U1 (rule 37 needs 0.5 / 1 mm) and its `Power` group label (rule 43) would have sat inside the 1.27 mm edge clearance of rule 26. Widening to 25 mm fixes all three (8 x 8 mm was considered earlier but cannot hold the SOIC-8 plus header and passives).
- **Power sources and rails:** single 5 V input on a 2-pin 2.54 mm header (J1: `V5`, `GND`). NE555 minimum supply is 4.5 V, so 5 V is fine.
- **I/O (connectors, headers, mounting holes):** J1 power header, 4x 3.2 mm (M3) mounting holes, one near each corner (10.12 mm from the centre in x, 7.62 mm in y, 2.38 mm from both edges of the corner); the area within 3 mm of each hole centre is kept free of parts, pads and silkscreen (DESIGN.md rule 18).
- **Mechanical constraints:** none beyond the above.
- **Manufacturer and constraints:** JLCPCB; all resistors/capacitors 0603; basic parts where one exists; Economic assembly (only parts marked "PCBA Type: Economic and Standard", never "Standard Only").

## Design notes

- **Timing:** a normal 555 astable has HIGH longer than LOW, so the LED is wired from V5 through R3 to the LED and sunk into OUT (pin 3). It is ON while OUT is LOW: ON = 0.693*R2*C1, OFF = 0.693*(R1+R2)*C1. Equal ON/OFF ratio 1:2 means R1 = R2. With R1 = R2 = 43 k and C1 = 10 uF: ON = 0.298 s, OFF = 0.596 s (period ~0.9 s).
- **Capacitor accuracy (decision: keep C1 as is):** C1 is a 10 uF X5R 0603 ceramic (C19702, 10 V, +-10 %). DC bias (5 V on a 10 V part) is the dominant error: it can cut the effective capacitance by a large fraction, so the real period will be longer than the nominal ~0.9 s, by tens of percent. The 1:2 ON/OFF ratio is unaffected, because ON and OFF both scale with C1 and the ratio depends only on R1/R2, and a visual LED flasher needs no accurate period. Alternatives rejected: film/C0G caps do not exist at 10 uF in 0603; tantalum/electrolytic are bigger, polarised and mostly extended or "Standard Only" (breaks Economic assembly); 1 uF 50 V (C15849) would need R1 = R2 = 430 k, where the bipolar NE555's TRIGGER/THRESHOLD bias currents add their own error and 430 k is another extended part. If the period ever matters, measure the assembled board and trim R1/R2 (keep R1 = R2).
- **LED current:** (5 V - ~2.3 V - ~0.2 V OUT low) / 330 ohm ~= 7.6 mA (XL-1608SURC-06, Vf 2.3 V typ).
- **555 housekeeping:** RESET tied to V5, CTRL decoupled by C2 (10 nF), C3 (100 nF) decouples the supply at U1.
- **Footprints:** U1 (SOIC-8) and D1 (0603 LED) use local `<footprint>` definitions with the pad geometry copied from the JLCPCB parts. `footprint="jlcpcb:..."` fetches from the EasyEDA API at build time and fails when it rate-limits (HTTP 403), so avoid it. D1 pin 1 is the cathode (K) on C965799 and is mapped that way. Their 3D bodies are the generic tscircuit models `jscad_models/soic8.glb` and `led0603.glb` from modelcdn.tscircuit.com (via `cadModel`), because custom footprints get no 3D body otherwise.
- **Part numbers:** `supplierPartNumbers={{ jlcpcb: [...] }}` is set on every assembled part with the chosen LCSC numbers (`index.circuit.tsx` is the single source of truth for the BOM). The BOM export only lists parts that carry a supplier part number: without it U1 (custom-footprint chip) and D1 were missing from the fab export, and the parts engine auto-picked other LCSC parts for the passives. The parts engine is disabled (`tscircuit.config.ts` `partsEngineDisabled`, plus `--disable-parts-engine` in the npm scripts): otherwise tscircuit fetches every pinned part from EasyEDA only to cross-check its footprint, which floods the build with warnings when EasyEDA rate-limits (HTTP 403). **Economic assembly:** every part must show "PCBA Type: Economic and Standard" on its jlcpcb.com part page (never "Standard Only"); all current parts do. D1 (C965799, the basic red LED is only 0805; the old C84263 is Standard Only), U1 and R1/R2 (no basic 43 k) are extended parts, the rest are basic.
- **Assembly:** J1 is `doNotPlace` (through-hole header, hand-soldered) so it stays out of the JLCPCB BOM/CPL; everything else is SMD on the top side.
- **Ground pour:** solid copper pour on the bottom layer only, tied to GND (0.2 mm clearance, `boardEdgeMargin="1.27mm"`; DESIGN.md rule 16 says no top pour). The top-layer GND traces are still routed; the pour is tied in through J1.GND and the GND traces' layer-change vias and adds return-path area/shielding.
- **Trace width:** V5 and GND traces are 0.3 mm (`thickness="0.3mm"` on every trace that touches those nets); signal traces keep the 0.15 mm default.
- **Routing:** V5 is hand-routed on the top layer (`pcbPath` via the `route()` helper, which cuts every 90 degree corner into two 45 degree bends, DESIGN.md rule 17; no vias); GND and the signals are autorouted. The autorouter adds 7 vias: 3 on GND and 4 on the DISCH and THRES signals (rule 15 covers supply nets other than GND, so they are fine); the GND via beside J1 is 0.5 mm from the V5 vertical (T1 runs at x = -6.45, between J1 and the rest of the board, so the labels on J1's left stay clear of copper). Hand-routed traces anchor their `pcbPath` to the `from` part's centre, and C3 has `maxDecouplingTraceLength={3}` (the 1 mm default would stop the autorouter, since its V5 pad is 2.60 mm from U1 VCC). Sensible to review in `tsci dev` before fabrication.
- **Layout:** see the published [DESIGN.md](https://github.com/agentic-pcb/example-base/blob/main/DESIGN.md); the "Design rule audit" table below audits all 43 rules. The board corners are rounded with a 2 mm radius (rule 28). Parts sit on a 1.27 mm grid in two rows of three 0603 parts (top y = +3.81: R1, C3, R3; bottom y = -3.81: R2, C1, C2; 3.81 mm pitch), with J1 and D1 mirrored at x = ±7.62 (2.54 mm grid). The rows stay at ±3.81 (not the former ±5.08) so every pad is at least 5.8 mm from a hole centre (screw head area, rule 18). Courtyard gaps (rule 37): J1 to R1/R2 0.56 mm, J1 to U1 2.15 mm, U1 to the 0603 parts 0.68 mm.
- **Decoupling (rule 24, a must):** C3 (100 nF) sits directly above U1 pin 8 (VCC), 2.60 mm centre to centre. Its V5 pad is pin 2 (a capacitor is non-polar, so pin 1/pin 2 are swapped in the TSX) so the V5 pad is the one nearer VCC. C2 (CTRL bypass) sits below pin 5.
- **Silkscreen:** designators 0.4 mm, 1.1 mm above their part (`pcbSx`); U1 and D1 have no text in their local footprints, so their designators are explicit `<silkscreentext>` elements above the part. J1's V5/GND labels (0.5 mm, x = -8.97) and the `Power` group label (rule 43: 0.6 mm, x = -10.47, 1.5 mm further out) with its `<silkscreenline>` along the pins (x = -9.7) are explicit elements too, because `pcbSx` cannot tell a designator from a pin label. U1 pin 1 is marked with a `<silkscreencircle>` in its footprint (rule 42); D1 has its cathode bar.
- **Schematic:** four `<schematicsection>`s (Power input, Timer core, Timing network, LED output) read left to right on a 220 x 95 mm sheet; U1 sits in the middle with CTRL/TRIG/THRES on the left, OUT/DISCH on the right, RESET + VCC on top and GND at the bottom (only the symbol changes, the netlist does not), J1 at the lower left. C3 sits straight above VCC (its V5 pin faces down to the pin, so `tsci check schematic-placement` prints an informational `InvertedRails` hint for it; the straight wire is kept on purpose) and its GND pin is more than 5 units from the other GND pins so it gets a label stub instead of a long wire. C2 sits left of U1 with one bend to CTRL and one to GND. Trace names that tscircuit draws are meaningful: `DISCH`, `THRES` (flags), `CTRL`, `LED_A`, `OUT` (small net names beside two-pin wires/stubs).

## Design rule audit

Audit of the layout against the 43 rules of the published [DESIGN.md](https://github.com/agentic-pcb/example-base/blob/main/DESIGN.md) (the single source of truth: it is referenced by URL, not copied into this project, so re-check the numbers below whenever it changes). Board 25 x 20 mm; grid origin = board centre, step 1.27 mm; numbers measured from `dist/index/circuit.json`. One row per rule; keep it current after layout changes.

| # | Status | How |
| --- | --- | --- |
| 1 | pass | R1/C3/R3 share the baseline y = +3.81, R2/C1/C2 share y = -3.81; J1 and D1 pin rows share the centre line y = 0 |
| 2 | pass | parts are symmetric about the centre (parts at x = -3.81 / 0 / +3.81, J1/D1 at x = -+7.62, holes at +-10.12 / +-7.62); only J1's silkscreen group label (rule 43) extends further left |
| 3 | pass | all part origins are multiples of 1.27 mm; J1 pins sit on the 2.54 mm pitch (J1/D1 at 7.62 = 3 x 2.54) |
| 4 | pass | all 0603 parts horizontal (0°), J1 and D1 at 90° |
| 5 | pass | constant 3.81 mm pitch in both part rows |
| 6 | pass | one pad size per footprint type, one hole diameter (3.2 mm) |
| 7 | pass | designators 0.4 mm (`pcbStyle.silkscreenFontSize`) horizontal; pad labels V5/GND 0.5 mm on one vertical line (x = -8.97), all turned the same way (270°); group label 0.6 mm |
| 8 | pass | every designator (R, C, U1, D1, J1) sits above its part, clear of pads and vias; the 0603 ones 1.1 mm above, U1 and D1 as explicit texts |
| 9 | exception | only J1 has pad labels (V5, GND); the 0603 parts are 2-pad and labelled on the schematic, U1's pins are labelled on the schematic only (0.6 mm tall pads at 1.27 mm pitch) |
| 10 | pass | one 3.81 mm column pitch and one 7.62 mm row spacing; no other gaps between blocks |
| 11 | pass | parts spread evenly; free space balanced about both axes |
| 12 | pass | all four holes 2.38 mm from both edges of their corner (10.12 / 7.62 from the centre) |
| 13 | pass | J1 and D1 mirrored 4.88 mm from the left/right edge (centre to edge) |
| 14 | pass | the only supply net (V5) and GND are 0.3 mm, signals 0.15 mm (2x) |
| 15 | pass | V5 (the only supply net) is hand-routed on the top layer with no vias; the 7 vias (3 GND, 4 signal) are outside this rule |
| 16 | pass | bottom-layer GND pour only (0.2 mm clearance), no pour on the top layer; top GND pads reach it through J1.GND (through-hole) and the GND vias; `boardEdgeMargin="1.27mm"` keeps the pour 1.27 mm clear of the board edge and it is cut around the mounting holes |
| 17 | pass | no 90 degree corner left in the copper (largest turn 45°, measured from `dist/index/circuit.json`). The whole V5 net (T1, T3, T4, T6, T18) is hand-routed with `pcbPath` through the `route()` helper in `index.circuit.tsx`; GND and the signals stay autorouted |
| 18 | pass | closest pad is 5.9 mm and closest silkscreen text (J1 designator) 5.0 mm from a hole centre (free radius 3 mm); the holes are 3.2 mm (README requirement), the free circle is the rule's 6 mm |
| 19 | pass | `<schematicsection>` Power input (J1), Timer core (U1, C2, C3), Timing network (R1, R2, C1), LED output (R3, D1) on one sheet |
| 20 | pass | power input left, timing and core in the middle, LED output right; U1 has inputs left, OUT/DISCH right, RESET/VCC top, GND below |
| 21 | pass | J1 and D1 (case-driven edge parts) were placed first, then U1, then the 0603 parts |
| 22 | pass | C3 beside U1 VCC, C2 beside CTRL, R3 beside D1; the timing network is split between the two rows only because the pin positions force it |
| 23 | n/a | single 5 V flasher: no analog signal, sensor or high-current line |
| 24 | pass | C3 pad 2 (V5) is 2.60 mm from U1 VCC (pin 8), centre to centre; V5 trace 0.3 mm; its GND pad goes through the GND net |
| 25 | n/a | no crystal |
| 26 | pass | closest pad (J1) 4.13 mm from the edge, closest silkscreen text (`Power`) 1.73 mm; the GND pour stops 1.27 mm from the edge; no panel is used, so the 1.27 mm clearance applies (measured from the curve at the corners); the mounting holes (0.78 mm edge to board edge) are deliberate edge parts |
| 27 | n/a | no heat-producing parts (LED about 8 mA, NE555 a few mA) |
| 28 | pass | `<board borderRadius={2}>` rounds all four outer corners with a 2 mm radius; the mounting holes sit about 0.94 mm inside the curve and no other part, pad or text is near a corner |
| 29 | pass | U1 has no unused pins; the used ones are grouped by side: CTRL/TRIG/THRES left, OUT/DISCH right, RESET/VCC top, GND bottom |
| 30 | pass | C3 straight above VCC, C2 left of CTRL, R3 above D1, timing parts in one stack; no part floats |
| 31 | pass | all `schX`/`schY` on a 0.5 grid (U1 at -0.1 so its VCC pin lines up with C3), every wire at most one bend; one exception: the label stub of C3's GND pin has a small jog (tscircuit draws it) |
| 32 | pass | V5 and GND use one style per net (wired inside a cluster, labelled `V5`/`GND` stubs between blocks, never mixed on one pin), signals pin to pin or flagged (`DISCH`, `THRES`); no default `T8` style names are drawn; tscircuit prints the net name `CTRL`, `LED_A`, `OUT` next to two-pin wires, which cannot be switched off |
| 33 | pass | supply pins top/bottom, signal pins left/right, text horizontal; passives at 90/270 on vertical paths, J1 and U1 at 0° |
| 34 | pass | J1 at the left edge with its pins on its right side, one row, pin 1 on top |
| 35 | pass | gaps between blocks are 6 to 6.5 units centre to centre (limited by the 5 unit auto-wire distance between J1 and the timing block), sheet 220 x 95 mm, content centred on it; wires of different nets side by side are 0.2 units apart only at the U1 left pins, where they leave in different directions |
| 36 | pass | U1 in the middle, power block (J1) lower left, timing left, LED output right |
| 37 | pass | smallest courtyard gap 0.56 mm (J1 to R1/R2), 0.68 mm U1 to the 0603 parts, 2.15 mm from J1 to U1 (the header outline needs 1 mm); `tsci check placement` reports 0 errors |
| 38 | pass | the 0603 parts sit in two rows on one center line each with one pitch, designators on one side, rotations 0 only |
| 39 | n/a | no signal pairs |
| 40 | pass | every trace starts and ends on a pad or via; the bottom pour has no island (it connects through J1.GND and the GND vias) |
| 41 | pass | no regulator or bulk cap; C3 (100 nF) is 7.62 mm from J1, within the 10 mm limit. V5 runs J1 -> R1 -> R3 -> U1 VCC along the top and never crosses back over the board |
| 42 | pass | U1 pin 1 marked by a silkscreen dot beside pad 1; D1 cathode bar; J1 pin 1 is the square pad |
| 43 | pass | J1 (V5, GND) has the group label `Power` (0.6 mm, 1.5 mm outside the 0.5 mm pin labels) and a `<silkscreenline>` along its two pads; D1 is a single part, not a pad group |

## Finding JLCPCB parts

Query the [jlcsearch](https://jlcsearch.tscircuit.com/) JSON API. Prefer basic parts (`is_basic=true`) and pick the highest stock. Example for 22k 0603 resistors:

`https://jlcsearch.tscircuit.com/resistors/list.json?package=0603&is_basic=true&is_preferred=&resistance=22000`

Then open the part page (`https://jlcpcb.com/partdetail/C<number>`) and confirm it says `PCBA Type: Economic and Standard`; jlcsearch does not expose this flag. Record the chosen part as `supplierPartNumbers={{ jlcpcb: ["C..."] }}` in `index.circuit.tsx`. Only fall back to non-basic (extended) parts if no basic one fits.

Also browse [tscircuit datasheets](https://tscircuit.com/datasheets) to discover elements.

## Setup

Requires Node and [Bun](https://bun.sh) (`tsci` runs under Bun; make sure `~/.bun/bin` is on PATH).

```bash
npm install
npm start           # tsci dev: interactive preview
npx tsci build      # compile and validate, output in dist/
npx tsci snapshot -u   # regenerate the schematic SVG snapshot (__snapshots__/index.circuit-schematic.snap.svg, embedded at the top of this README)
npm run export:images    # rebuild and refresh docs/images/{pcb,3d}.png (embedded at the top of this README)
npm run update:skill   # re-install the latest tscircuit AI skill into .claude/skills/tscircuit/ (review with git diff, commit with skills-lock.json)
```

Before sharing or fabricating, work through the checks in order: `tsci check netlist`, `schematic-placement`, `placement`, `routing-difficulty`, then `tsci build`, then `tsci check shorts`. See `.claude/skills/tscircuit/CHECKLIST.md` for the pre-fab checklist.

## References

- [tscircuit docs](https://docs.tscircuit.com/); the full docs are also available as one text file at https://docs.tscircuit.com/llms.txt
- [DESIGN.md](https://github.com/agentic-pcb/example-base/blob/main/DESIGN.md): the published PCB alignment, routing, mounting, schematic and placement rules (single source of truth)
- [tscircuit datasheets](https://tscircuit.com/datasheets)
- [jlcsearch](https://jlcsearch.tscircuit.com/)
- AI skill: [tscircuit/skill](https://github.com/tscircuit/skill), installed in `.claude/skills/tscircuit/`

## Open questions / TODO

- **Before ordering:** review routing/silkscreen in `tsci dev` (human check) and confirm the component rotations in JLCPCB's assembly preview. `tsci export` warns "cannot verify jlcpcb pick-and-place rotation" for every SMD part (R1-R3, C1-C3, D1; no supplier pin-1 data is available), so the rotations in `dist/gerbers.zip` (`pick_and_place.csv`) are unverified.
## Decisions

- **Stitching vias:** none. The published rule 16 pours the bottom layer only and joins top-layer GND pads to it with GND vias; there is no top pour to stitch to. The top GND pads reach the pour through J1.GND (through-hole) and the three GND vias of the routed GND tree, which is enough for a 25 x 20 mm, low-speed 5 V board.
- **Fabrication export:** `npm run check:full` is clean (no shorts) and `npm run export:gerbers` produces `dist/gerbers.zip` (Gerbers, drills, `bom.csv`, `pick_and_place.csv`).
