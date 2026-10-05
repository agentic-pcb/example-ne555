# Design rules

PCB alignment and routing rules for the board layout (`index.circuit.tsx`). A board whose geometry is fixed by its parts (e.g. an LED matrix) may be exempt; say so in the README.

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

14. **Double width for power lines:** Draw the power lines (5V, GND) twice as wide as the standard (signal) trace.
15. **Avoid vias on power lines:** Try not to use vias on the power lines (5V, GND); route them on one layer where possible.

## Project status

Layout of the NE555 flasher (20 x 20 mm), checked against the rules above:

- **Met:** 1 (R1-R3 share one baseline at y = +5.08, C1-C3 at y = -5.08), 2 (symmetric about the centre, parts and holes at +-7.62 / +-5.08), 3 (all part origins on a 1.27 mm grid; J1 pins sit on the 2.54 mm grid), 4 (resistors, caps and the header each keep one orientation, rotations are 0 deg or 90 deg only), 5 (R1-R3 and C1-C3 at a constant 5.08 mm pitch), 6 (one pad size per footprint type, one hole diameter), 8 (designators on the same side, above each part), 10/11 (equal row spacing, parts spread evenly), 12 (all four holes inset 2.38 mm from the corners), 13 (J1 and D1 are mirrored at 2.38 mm from the left/right edge, measured to the part centre), 14 (V5/GND traces are 0.3 mm, signals 0.15 mm).
- **Deviations (accepted):** 7 (designators use tscircuit's default text size, by decision), 9 (only J1 has pad labels; the other parts are 2-pad or labelled on the schematic), 15 (the autorouter adds vias on V5 and one on GND; by decision not solved). The SOIC-8 pads sit at 0.635 mm offsets from the U1 origin because of the 1.27 mm pin pitch.
