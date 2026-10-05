import type { ChipProps } from "tscircuit"

// Generic 3D bodies from the tscircuit model CDN (absolute URLs: a local ./models import resolves in `tsci build` but 404s in the `tsci dev` viewer)
const soic8Model = "https://modelcdn.tscircuit.com/jscad_models/soic8.glb"
const led0603Model = "https://modelcdn.tscircuit.com/jscad_models/led0603.glb"

const pinLabels = {
  pin1: "GND",
  pin2: "TRIG",
  pin3: "OUT",
  pin4: "RESET",
  pin5: "CTRL",
  pin6: "THRES",
  pin7: "DISCH",
  pin8: "VCC",
} as const

// Local SOIC-8 geometry copied from JLCPCB C7593 (avoids the runtime EasyEDA fetch of "jlcpcb:" footprints)
const soic8Footprint = (
  <footprint>
    <smtpad shape="rect" width="1.8mm" height="0.6mm" pcbX="-2.6mm" pcbY="1.905mm" portHints={["pin1"]} />
    <smtpad shape="rect" width="1.8mm" height="0.6mm" pcbX="-2.6mm" pcbY="0.635mm" portHints={["pin2"]} />
    <smtpad shape="rect" width="1.8mm" height="0.6mm" pcbX="-2.6mm" pcbY="-0.635mm" portHints={["pin3"]} />
    <smtpad shape="rect" width="1.8mm" height="0.6mm" pcbX="-2.6mm" pcbY="-1.905mm" portHints={["pin4"]} />
    <smtpad shape="rect" width="1.8mm" height="0.6mm" pcbX="2.6mm" pcbY="-1.905mm" portHints={["pin5"]} />
    <smtpad shape="rect" width="1.8mm" height="0.6mm" pcbX="2.6mm" pcbY="-0.635mm" portHints={["pin6"]} />
    <smtpad shape="rect" width="1.8mm" height="0.6mm" pcbX="2.6mm" pcbY="0.635mm" portHints={["pin7"]} />
    <smtpad shape="rect" width="1.8mm" height="0.6mm" pcbX="2.6mm" pcbY="1.905mm" portHints={["pin8"]} />
    <courtyardrect pcbX="0mm" pcbY="0mm" width="7.4mm" height="4.8mm" strokeWidth="0.05mm" />
  </footprint>
)

// Local 0603 LED footprint copied from JLCPCB C965799 (XL-1608SURC-06); pin 1 is the cathode (K) on this part
const ledFootprint = (
  <footprint>
    <smtpad shape="rect" width="0.8mm" height="0.8mm" pcbX="-0.75mm" pcbY="0mm" portHints={["pin1", "cathode"]} />
    <smtpad shape="rect" width="0.8mm" height="0.8mm" pcbX="0.75mm" pcbY="0mm" portHints={["pin2", "anode"]} />
    <silkscreenline x1="-1.5mm" y1="-0.8mm" x2="-1.5mm" y2="0.8mm" strokeWidth="0.15mm" />
    <courtyardrect pcbX="0mm" pcbY="0mm" width="3.4mm" height="1.8mm" strokeWidth="0.05mm" />
  </footprint>
)

const NE555 = (props: ChipProps<typeof pinLabels>) => (
  <chip
    {...props}
    manufacturerPartNumber="NE555DR"
    supplierPartNumbers={{ jlcpcb: ["C7593"] }}
    pinLabels={pinLabels}
    pinAttributes={{
      VCC: { requiresPower: true },
      GND: { requiresGround: true },
      RESET: { mustBeConnected: true },
    }}
    schPinArrangement={{
      leftSide: { direction: "top-to-bottom", pins: ["RESET", "CTRL", "TRIG", "THRES"] },
      rightSide: { direction: "top-to-bottom", pins: ["OUT", "DISCH"] },
      topSide: { direction: "left-to-right", pins: ["VCC"] },
      bottomSide: { direction: "left-to-right", pins: ["GND"] },
    }}
    footprint={soic8Footprint}
    cadModel={<cadmodel modelUrl={soic8Model} />}
  />
)

// 5V NE555 astable flasher. LED sinks through OUT, so it is ON while OUT is low:
// ON = 0.693*R2*C1 = 0.3s, OFF = 0.693*(R1+R2)*C1 = 0.6s (R1 = R2).
// PCB: 20 x 20 mm, 1.27 mm grid. Two rows of 0603 parts at y = +-3.81 (x = -3.81 / 0 / +3.81), J1 and D1 mirrored at x = -+6.35,
// holes 7.62 mm from the centre. C3 sits above U1 pin 8 (VCC) for DESIGN.md rule 24. Designators sit 1.1 mm above their part (pcbSx).
const above = { "& silkscreentext": { pcbX: 0, pcbY: 1.1 } }

// DESIGN.md rule 17: pcbPath for a hand-routed trace. pts is the route from pad to pad in board coordinates (rectilinear corners are fine); every 90 degree corner is cut into two 45 degree bends, d mm before and after it, other turns pass through.
// pcbPath is relative to the centre of the `from` part (rotated with it), so `from` is a part at 0 degrees and `at` is its pcbX/pcbY; the pad ends are dropped (tscircuit adds them).
const route = (at: [number, number], pts: [number, number][], d = 0.9) =>
  pts
    .flatMap(([x, y], i) => {
      const [a, b] = [pts[i - 1], pts[i + 1]]
      if (!a || !b) return [{ x, y }]
      const [u, v] = [[x - a[0], y - a[1]], [b[0] - x, b[1] - y]]
      if (Math.abs(u[0] * v[0] + u[1] * v[1]) > 1e-9) return [{ x, y }]
      const [lu, lv] = [Math.hypot(...u), Math.hypot(...v)]
      return [{ x: x - (u[0] / lu) * d, y: y - (u[1] / lu) * d }, { x: x + (v[0] / lv) * d, y: y + (v[1] / lv) * d }]
    })
    .slice(1, -1)
    .map(({ x, y }) => ({ x: x - at[0], y: y - at[1] }))

export default () => (
  <board width="20mm" height="20mm" borderRadius={2} thickness="1.6mm" pcbStyle={{ silkscreenFontSize: 0.4 }} schTraceAutoLabelEnabled schMaxTraceDistance={5}>

    <schematicsheet name="Flasher" displayName="NE555 LED flasher" sheetIndex={0} sheetWidth="170mm" sheetHeight="90mm" />
    <schematicsection name="Power" displayName="Power input" />
    <schematicsection name="Core" displayName="Timer core" />
    <schematicsection name="Timing" displayName="Timing network" />
    <schematicsection name="Output" displayName="LED output" />

    <hole diameter="3.2mm" pcbX={-7.62} pcbY={7.62} />
    <hole diameter="3.2mm" pcbX={7.62} pcbY={7.62} />
    <hole diameter="3.2mm" pcbX={-7.62} pcbY={-7.62} />
    <hole diameter="3.2mm" pcbX={7.62} pcbY={-7.62} />

    <pinheader name="J1" schSheetName="Flasher" schSectionName="Power" schX={-8} schY={0} pinCount={2} pitch="2.54mm" pinLabels={["V5", "GND"]} pcbX={-6.35} pcbY={0} pcbRotation="90deg" pcbSx={{ "& silkscreentext": { visibility: "hidden" } }} doNotPlace />
    <silkscreentext text="J1" pcbX={-6.35} pcbY={2.9} fontSize={0.4} />
    <silkscreentext text="V5" pcbX={-7.7} pcbY={-1.27} pcbRotation="270deg" fontSize={0.5} />
    <silkscreentext text="GND" pcbX={-7.7} pcbY={1.27} pcbRotation="270deg" fontSize={0.5} />

    <NE555 name="U1" schSheetName="Flasher" schSectionName="Core" schX={0} schY={0} pcbX={0} pcbY={0} />
    <capacitor name="C2" schSheetName="Flasher" schSectionName="Core" schX={-2.5} schY={-1.5} schRotation="270deg" capacitance="10nF" footprint="0603" supplierPartNumbers={{ jlcpcb: ["C57112"] }} pcbX={3.81} pcbY={-3.81} pcbSx={above} />
    <capacitor name="C3" schSheetName="Flasher" schSectionName="Core" schX={2.5} schY={2.5} schRotation="90deg" capacitance="100nF" maxDecouplingTraceLength={3} footprint="0603" supplierPartNumbers={{ jlcpcb: ["C14663"] }} pcbX={0} pcbY={3.81} pcbSx={above} />

    <resistor name="R1" schSheetName="Flasher" schSectionName="Timing" schX={-4.5} schY={1.2} schRotation="270deg" resistance="43k" footprint="0603" supplierPartNumbers={{ jlcpcb: ["C2907038"] }} pcbX={-3.81} pcbY={3.81} pcbSx={above} />
    <resistor name="R2" schSheetName="Flasher" schSectionName="Timing" schX={-4.5} schY={-0.8} schRotation="270deg" resistance="43k" footprint="0603" supplierPartNumbers={{ jlcpcb: ["C2907038"] }} pcbX={-3.81} pcbY={-3.81} pcbSx={above} />
    <capacitor name="C1" schSheetName="Flasher" schSectionName="Timing" schX={-4.5} schY={-2.8} schRotation="270deg" capacitance="10uF" footprint="0603" supplierPartNumbers={{ jlcpcb: ["C19702"] }} pcbX={0} pcbY={-3.81} pcbSx={above} />

    <resistor name="R3" schSheetName="Flasher" schSectionName="Output" schX={5} schY={1} schRotation="270deg" resistance="330" footprint="0603" supplierPartNumbers={{ jlcpcb: ["C23138"] }} pcbX={3.81} pcbY={3.81} pcbSx={above} />
    <led name="D1" schSheetName="Flasher" schSectionName="Output" schX={5} schY={-1} schRotation="270deg" color="red" footprint={ledFootprint} cadModel={<cadmodel modelUrl={led0603Model} />} supplierPartNumbers={{ jlcpcb: ["C965799"] }} pcbX={6.35} pcbY={0} pcbRotation="90deg" pcbSx={{ "& silkscreentext": { pcbX: 0, pcbY: 1.1 } }} />

    <trace name="T1" from="R1.pin1" to="J1.V5" thickness="0.3mm" schDisplayLabel="V5" pcbPath={route([-3.81, 3.81], [[-4.635, 3.81], [-8, 3.81], [-8, -1.27], [-6.35, -1.27]], 1)} />
    <trace name="T2" from="J1.GND" to="net.GND" thickness="0.3mm" />

    <trace name="T3" from="C3.pin2" to="U1.VCC" thickness="0.3mm" schDisplayLabel="V5" pcbPath={route([0, 3.81], [[0.825, 3.81], [2.6, 2.035], [2.6, 1.905]])} />
    <trace name="T4" from="U1.RESET" to="J1.V5" thickness="0.3mm" schDisplayLabel="V5" pcbPath={route([0, 0], [[-2.6, -1.905], [-3.76, -1.905], [-4.4, -1.27], [-6.35, -1.27]])} />
    <trace name="T5" from="U1.GND" to="net.GND" thickness="0.3mm" />
    <trace name="T6" from="R1.pin1" to="R3.pin1" thickness="0.3mm" schDisplayLabel="V5" pcbPath={route([-3.81, 3.81], [[-4.635, 3.81], [-4.635, 5.2], [2.985, 5.2], [2.985, 3.81]])} />
    <trace name="T7" from="C3.pin1" to="net.GND" thickness="0.3mm" />

    <trace name="T8" from="U1.CTRL" to="C2.pin1" />
    <trace name="T9" from="C2.pin2" to="net.GND" thickness="0.3mm" />

    <trace name="T10" from="R1.pin1" to="net.V5" thickness="0.3mm" />
    <trace name="T11" from="R1.pin2" to="R2.pin1" />
    <trace name="DISCH" from="R2.pin1" to="U1.DISCH" />
    <trace name="T12" from="R2.pin2" to="C1.pin1" />
    <trace name="T13" from="U1.THRES" to="R2.pin2" />
    <trace name="T14" from="U1.TRIG" to="U1.THRES" />
    <trace name="T17" from="C1.pin2" to="net.GND" thickness="0.3mm" />

    <trace name="T18" from="R3.pin1" to="U1.VCC" thickness="0.3mm" schDisplayLabel="V5" pcbPath={route([3.81, 3.81], [[2.985, 3.81], [2.985, 1.905], [2.6, 1.905]], 0.2)} />
    <trace name="T19" from="R3.pin2" to="D1.anode" />
    <trace name="T20" from="D1.cathode" to="U1.OUT" />

    <copperpour connectsTo="net.GND" layer="bottom" clearance="0.2mm" boardEdgeMargin="1.27mm" />
  </board>
)
