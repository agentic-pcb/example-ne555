# example-ne555

![Schematic](__snapshots__/index.circuit-schematic.snap.svg)

![PCB layout](docs/images/pcb.png)

![3D view](docs/images/3d.png)

PCB design written in [tscircuit](https://tscircuit.com) (React/TSX, compiled by the `tsci` CLI). This file is the project doc: requirements, design decisions and status go here and should be kept current as the design evolves.

## Status

First complete draft: 5V NE555 LED flasher, builds cleanly (`tsci build`), `tsci check shorts` and placement DRC are clean. Not yet fabricated or tested on hardware.

## Requirements

- **Purpose:** flash a red SMD LED, 0.3 s ON / 0.6 s OFF, using an NE555.
- **Board size / form factor:** 20 x 20 mm, all parts on the top side (8 x 8 mm was considered but cannot hold the SOIC-8 plus header and passives).
- **Power sources and rails:** single 5 V input on a 2-pin 2.54 mm header (J1: `V5`, `GND`). NE555 minimum supply is 4.5 V, so 5 V is fine.
- **I/O (connectors, headers, mounting holes):** J1 power header, 4x 3.2 mm (M3) mounting holes, one near each corner (7.62 mm from the centre on both axes); the area within 3 mm of each hole centre is kept free of parts, pads and silkscreen (DESIGN.md rule 18).
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
- **Routing:** V5 is hand-routed on the top layer (`pcbPath` via the `route()` helper, which cuts every 90 degree corner into two 45 degree bends, DESIGN.md rule 17; no vias); GND and the signals are autorouted. Two vias remain on the GND tree (rule 15 covers supply nets other than GND, so they are fine). Hand-routed traces anchor their `pcbPath` to the `from` part's centre, and C3 has `maxDecouplingTraceLength={3}` (the 1 mm default would stop the autorouter, since its V5 pad is 2.60 mm from U1 VCC). Sensible to review in `tsci dev` before fabrication.
- **Layout:** see the published [DESIGN.md](https://github.com/agentic-pcb/example-base/blob/main/DESIGN.md); the "Design rule audit" table below audits all 28 rules. The board corners are rounded with a 2 mm radius (rule 28). Parts sit on a 1.27 mm grid in two rows of three 0603 parts (top y = +3.81: R1, C3, R3; bottom y = -3.81: R2, C1, C2; 3.81 mm pitch), with J1 and D1 mirrored at x = ±6.35. The rows are pulled in from the former ±5.08 so every pad stays at least 4.2 mm from a hole centre (screw head area, rule 18).
- **Decoupling (rule 24, a must):** C3 (100 nF) sits directly above U1 pin 8 (VCC), 2.60 mm centre to centre. Its V5 pad is pin 2 (a capacitor is non-polar, so pin 1/pin 2 are swapped in the TSX) so the V5 pad is the one nearer VCC. C2 (CTRL bypass) sits below pin 5.
- **Silkscreen:** designators 0.4 mm, 1.1 mm above their part (`pcbSx`); J1's V5/GND labels are 0.5 mm. J1 and the labels are explicit `<silkscreentext>` elements because `pcbSx` cannot tell a designator from a pin label.
- **Schematic:** four `<schematicsection>`s (Power input, Timer core, Timing network, LED output) read left to right; U1 has supply on top and GND at the bottom.

## Design rule audit

Audit of the layout against the 28 rules of the published [DESIGN.md](https://github.com/agentic-pcb/example-base/blob/main/DESIGN.md) (the single source of truth: it is referenced by URL, not copied into this project, so re-check the numbers below whenever it changes). Board 20 x 20 mm; grid origin = board centre, step 1.27 mm; numbers measured from `dist/index/circuit.json`. One row per rule; keep it current after layout changes.

| # | Status | How |
| --- | --- | --- |
| 1 | pass | R1/C3/R3 share the baseline y = +3.81, R2/C1/C2 share y = -3.81; J1 and D1 pin rows share the centre line y = 0 |
| 2 | pass | everything is symmetric about the centre (parts at x = -3.81 / 0 / +3.81, J1/D1 at x = -+6.35, holes at +-7.62) |
| 3 | pass | all part origins are multiples of 1.27 mm; J1 pins sit on the 2.54 mm pitch |
| 4 | pass | all 0603 parts horizontal (0°), J1 and D1 at 90° |
| 5 | pass | constant 3.81 mm pitch in both part rows |
| 6 | pass | one pad size per footprint type, one hole diameter (3.2 mm) |
| 7 | pass | designators 0.4 mm (`pcbStyle.silkscreenFontSize`), pad labels V5/GND 0.5 mm on one vertical line (x = -7.7) |
| 8 | exception | designators sit 1.1 mm above their part for all 0603 parts, clear of pads and vias; D1 has no designator (its local footprint has no silkscreen text) |
| 9 | exception | only J1 has pad labels (V5, GND); the 0603 parts are 2-pad and labelled on the schematic |
| 10 | pass | one 3.81 mm column pitch and one 7.62 mm row spacing; no other gaps between blocks |
| 11 | pass | parts spread evenly; free space balanced about both axes |
| 12 | pass | all four holes 2.38 mm from the corners (7.62 from the centre on both axes) |
| 13 | pass | J1 and D1 mirrored 3.65 mm from the left/right edge (centre to edge) |
| 14 | pass | the only supply net (V5) and GND are 0.3 mm, signals 0.15 mm (2x) |
| 15 | pass | V5 (the only supply net) is hand-routed on the top layer with no vias; the 2 vias on the GND tree are outside this rule (every supply net other than GND) |
| 16 | pass | bottom-layer GND pour only (0.2 mm clearance), no pour on the top layer; top GND pads reach it through J1.GND (through-hole) and the 2 GND vias (beside U1 pin 1, at C1 pin 2); `boardEdgeMargin="1.27mm"` keeps the pour 1.27 mm clear of the board edge (ring at ±8.73 mm) and it is cut around the mounting holes |
| 17 | pass | no 90 degree corner left in the copper (largest turn 45°, measured from `dist/index/circuit.json`). The whole V5 net (T1, T3, T4, T6, T18) is hand-routed with `pcbPath` through the `route()` helper in `index.circuit.tsx`; GND and the signals stay autorouted, and their original 90 degree corners (J1/R1 jog, DISCH jog) disappeared once V5 was fixed. One 0.05 mm wobble on the bottom GND trace is under the 0.3 mm allowance |
| 18 | pass | closest pad is 4.22 mm from a hole centre (free radius 3 mm); designators 4.33 mm; the holes are 3.2 mm (README requirement), the free circle is the rule's 6 mm |
| 19 | pass | `<schematicsection>` Power input (J1), Timer core (U1, C2, C3), Timing network (R1, R2, C1), LED output (R3, D1) on one sheet |
| 20 | pass | power input left, core and timing in the middle, LED output right; U1 has inputs left, OUT/DISCH right, VCC top, GND below |
| 21 | pass | J1 and D1 (case-driven edge parts) were placed first, then U1, then the 0603 parts |
| 22 | pass | C3 beside U1 VCC, C2 beside CTRL, R3 beside D1; the timing network is split between the two rows only because the pin positions force it |
| 23 | n/a | single 5 V flasher: no analog signal, sensor or high-current line |
| 24 | pass | C3 pad 2 (V5) is 2.60 mm from U1 VCC (pin 8), centre to centre; V5 trace 0.3 mm; its GND pad goes through the GND net |
| 25 | n/a | no crystal |
| 26 | pass | closest pad is 2.90 mm and closest silkscreen text 2.05 mm from the edge; the GND pour stops 1.27 mm from the edge; no panel is used, so the 1.27 mm clearance applies (measured from the curve at the corners); the mounting holes (0.78 mm edge to board edge) are deliberate edge parts |
| 27 | n/a | no heat-producing parts (LED about 8 mA, NE555 a few mA) |
| 28 | pass | `<board borderRadius={2}>` rounds all four outer corners with a 2 mm radius; the mounting holes sit about 0.94 mm inside the curve and no other part, pad or text is near a corner |

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

- **Stitching vias:** none. The published rule 16 pours the bottom layer only and joins top-layer GND pads to it with GND vias; there is no top pour to stitch to. The top GND pads reach the pour through J1.GND (through-hole) and the two GND vias of the routed GND tree, which is enough for a 20 x 20 mm, low-speed 5 V board.
- **Fabrication export:** `npm run check:full` is clean (no shorts) and `npm run export:gerbers` produces `dist/gerbers.zip` (Gerbers, drills, `bom.csv`, `pick_and_place.csv`).
