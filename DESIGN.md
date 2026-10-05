# Design rules

Schematic and PCB rules for the board (`index.circuit.tsx`): alignment (1-13), routing (14-15), mounting (16), schematic (17-18) and placement (19-25). A board whose geometry is fixed by its parts (e.g. an LED matrix) may be exempt; say so in the README. Where two rules pull against each other the electrical one wins (decoupling, rule 22, over via avoidance, rule 15, and over equal spacing, rules 10 and 11); the status table at the end records every such exception.

## Alignment rules

1. **Share baselines:** Put pin rows of neighboring modules, headers, and connectors on one common top, bottom, or center line.
2. **Keep margins equal:** Give the left and right edges the same margin, and the top and bottom edges the same margin.
3. **Place on a grid:** Put every part on one grid, such as 1.27 mm or 2.54 mm.
4. **Use one orientation per part type:** Face all resistors, caps, and ICs the same way, and rotate parts only by 0° and 90°.
5. **Keep pitch constant:** Space equal parts and pads evenly, and use one pitch per connector row.
6. **Use one pad size per function:** Give all connector pads one diameter and one drill, and all header pads one diameter and one drill.
7. **Print labels on one baseline:** Use one text size and one baseline for pad labels, and one smaller size for designators.
8. **Place labels next to their parts:** Put each label directly beside its part, on the same side for every part, clear of pads, outlines, and vias.
9. **Label every pad:** Give each pad and connector a short, unambiguous label.
10. **Space blocks equally:** Keep the same gap between modules and between groups of parts.
11. **Distribute space evenly:** Spread the parts across the board, or shrink the board until the free space is balanced.
12. **Inset mounting holes equally:** Place all four the same distance from the corners, with clearance from pads.
13. **Align edge parts to one line:** Place parts near an edge at one shared distance from it, and put edge connectors flush with the edge on purpose.

## Routing rules

14. **Double width for power lines:** Draw the power lines (5V, GND) at least twice as wide as the standard (signal) trace.
15. **Avoid vias on power lines:** Try not to use vias on the power lines (5V, GND); route them on one layer where possible. A via at the GND pad of a decoupling capacitor or of a regulator is accepted when the alternative is a longer path (rule 22 wins).

## Mounting rules

16. **Keep the screw head area free:** Around every mounting hole keep a free circle of twice the screw head width: 3.5 mm hole, 3 mm screw (5.5 mm head), 6 mm free diameter, concentric with the hole. Place no component, pad or silkscreen text inside it, as far as the board allows. Traces and the copper pour may run through it.

## Schematic rules

17. **Group by function:** Give every functional block (e.g. MCU, power, outputs, input) its own `<schematicsection>` (`schSectionName`) on the one sheet and keep its parts clustered by `schX`/`schY`, with a clear gap between blocks. Add a second sheet only when a block no longer fits on one.
18. **Draw the signal path left to right:** Put the inputs (power in, buttons) on the left, the core (MCU, IC) in the middle and the outputs (drivers, connectors) on the right, so the circuit reads from left to right. Keep the pins of one function on one side of a symbol (inputs left, outputs right, supply on top, GND below).

## Placement rules

19. **Place the fixed parts first:** Connectors, module headers and the power input (their positions come from the case and the pin rows) go first; then the power parts, then the small parts around them.
20. **Keep a function block together:** Put the parts of one block next to each other (the whole power supply, the whole level shifter section). A block may only split when a pin position forces it.
21. **Separate analog, digital and power:** Keep analog parts (audio, sensors, lines with current peaks), the digital side (MCU, logic, data lines) and the power parts in their own areas; no digital line runs alongside a sensitive or high-current analog line, and the supply parts sit on the supply path.
22. **Decouple at the pin:** Put the decoupling capacitor of every IC within 3 mm (pad centre to pad centre) of its power pin, or as close as physically possible, joined by a short, wide trace (at least the width of rule 14 for 5V and GND). This rule is a must. Modules that carry their own capacitors are exempt.
23. **Keep crystals close:** A crystal sits within 5 mm of the MCU or clock chip, and its clock traces are short, straight and of equal length.
24. **Keep the board edge free:** Keep every part body, pad and silkscreen text at least 1.27 mm (0.05 in) from the board edge, so nothing is damaged when the board is separated from a panel (5 mm if the board is cut from a panel by routed tabs; say in the README if a panel is used). Deliberate edge parts (rule 13) are the exception.
25. **Handle heat:** Put high-heat parts (regulators, MOSFETs, power resistors) in the airflow and give them copper to spread the heat: a dedicated pour on their tab, thermal vias, and wide traces.

## Project status

Audit of the NE555 flasher (20 x 20 mm; grid origin = board centre, step 1.27 mm), measured from `dist/index/circuit.json`.

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
| 14 | pass | V5/GND traces 0.3 mm, signals 0.15 mm (2x) |
| 15 | exception | the autorouter puts 2 vias on the GND tree (near U1); V5 has none. Not solved by decision |
| 16 | pass | closest pad is 4.22 mm from a hole centre (free radius 3 mm); designators 4.33 mm; the holes are 3.2 mm (README requirement), the free circle is the rule's 6 mm |
| 17 | pass | `<schematicsection>` Power input (J1), Timer core (U1, C2, C3), Timing network (R1, R2, C1), LED output (R3, D1) on one sheet |
| 18 | pass | power input left, core and timing in the middle, LED output right; U1 has inputs left, OUT/DISCH right, VCC top, GND below |
| 19 | pass | J1 and D1 (case-driven edge parts) were placed first, then U1, then the 0603 parts |
| 20 | pass | C3 beside U1 VCC, C2 beside CTRL, R3 beside D1; the timing network is split between the two rows only because the pin positions force it |
| 21 | n/a | single 5 V flasher: no analog signal, sensor or high-current line |
| 22 | pass | C3 pad 2 (V5) is 2.60 mm from U1 VCC (pin 8), centre to centre; V5 trace 0.3 mm; its GND pad goes through the GND net |
| 23 | n/a | no crystal |
| 24 | pass | closest pad is 2.90 mm and closest silkscreen text 2.05 mm from the edge; the mounting holes (0.78 mm edge to board edge) are deliberate edge parts |
| 25 | n/a | no heat-producing parts (LED about 8 mA, NE555 a few mA) |
