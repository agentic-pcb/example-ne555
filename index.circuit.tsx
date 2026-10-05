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
      leftSide: { direction: "top-to-bottom", pins: ["RESET", "CTRL", "GND"] },
      rightSide: { direction: "top-to-bottom", pins: ["OUT", "VCC", "DISCH", "THRES", "TRIG"] },
    }}
    footprint={soic8Footprint}
    cadModel={<cadmodel modelUrl={soic8Model} />}
  />
)

// 5V NE555 astable flasher. LED sinks through OUT, so it is ON while OUT is low:
// ON = 0.693*R2*C1 = 0.3s, OFF = 0.693*(R1+R2)*C1 = 0.6s (R1 = R2).
export default () => (
  <board width="20mm" height="20mm" thickness="1.6mm" schTraceAutoLabelEnabled schMaxTraceDistance={5}>

    <schematicsheet name="Flasher" displayName="NE555 LED flasher" sheetIndex={0} sheetWidth="110mm" sheetHeight="145mm" />

    <hole diameter="3.2mm" pcbX={-7.62} pcbY={7.62} />
    <hole diameter="3.2mm" pcbX={7.62} pcbY={7.62} />
    <hole diameter="3.2mm" pcbX={-7.62} pcbY={-7.62} />
    <hole diameter="3.2mm" pcbX={7.62} pcbY={-7.62} />

    <pinheader name="J1" schSheetName="Flasher" schX={-3.5} schY={-6.2} pinCount={2} pitch="2.54mm" pinLabels={["V5", "GND"]} showSilkscreenPinLabels pcbX={-7.62} pcbY={0} pcbRotation="90deg" doNotPlace />

    <NE555 name="U1" schSheetName="Flasher" schX={0} schY={0} pcbX={0} pcbY={0} />

    <resistor name="R1" schSheetName="Flasher" schX={3} schY={1.2} schRotation="270deg" resistance="43k" footprint="0603" supplierPartNumbers={{ jlcpcb: ["C2907038"] }} pcbX={-5.08} pcbY={5.08} />
    <resistor name="R2" schSheetName="Flasher" schX={3} schY={-0.8} schRotation="270deg" resistance="43k" footprint="0603" supplierPartNumbers={{ jlcpcb: ["C2907038"] }} pcbX={0} pcbY={5.08} />
    <capacitor name="C1" schSheetName="Flasher" schX={3} schY={-2.8} schRotation="270deg" capacitance="10uF" footprint="0603" supplierPartNumbers={{ jlcpcb: ["C19702"] }} pcbX={0} pcbY={-5.08} />
    <capacitor name="C2" schSheetName="Flasher" schX={-3} schY={-1.1} schRotation="270deg" capacitance="10nF" footprint="0603" supplierPartNumbers={{ jlcpcb: ["C57112"] }} pcbX={5.08} pcbY={-5.08} />
    <capacitor name="C3" schSheetName="Flasher" schX={-1} schY={-6.6} schRotation="270deg" capacitance="100nF" footprint="0603" supplierPartNumbers={{ jlcpcb: ["C14663"] }} pcbX={-5.08} pcbY={-5.08} />
    <resistor name="R3" schSheetName="Flasher" schX={1.5} schY={3.6} schRotation="270deg" resistance="330" footprint="0603" supplierPartNumbers={{ jlcpcb: ["C23138"] }} pcbX={5.08} pcbY={5.08} />
    <led name="D1" schSheetName="Flasher" schX={1.5} schY={2.2} schRotation="270deg" color="red" footprint={ledFootprint} cadModel={<cadmodel modelUrl={led0603Model} />} supplierPartNumbers={{ jlcpcb: ["C965799"] }} pcbX={7.62} pcbY={0} pcbRotation="90deg" />

    <trace name="T1" from="J1.V5" to="net.V5" thickness="0.3mm" />
    <trace name="T2" from="J1.GND" to="net.GND" thickness="0.3mm" />

    <trace name="T3" from="U1.VCC" to="net.V5" thickness="0.3mm" />
    <trace name="T4" from="U1.RESET" to="net.V5" thickness="0.3mm" />
    <trace name="T5" from="U1.GND" to="net.GND" thickness="0.3mm" />
    <trace name="T6" from="C3.pin1" to="net.V5" thickness="0.3mm" />
    <trace name="T7" from="C3.pin2" to="net.GND" thickness="0.3mm" />

    <trace name="T8" from="U1.CTRL" to="C2.pin1" />
    <trace name="T9" from="C2.pin2" to="net.GND" thickness="0.3mm" />

    <trace name="T10" from="R1.pin1" to="net.V5" thickness="0.3mm" />
    <trace name="T11" from="R1.pin2" to="R2.pin1" />
    <trace name="DISCH" from="R2.pin1" to="U1.DISCH" />
    <trace name="T12" from="R2.pin2" to="C1.pin1" />
    <trace name="T13" from="U1.THRES" to="R2.pin2" />
    <trace name="T14" from="U1.TRIG" to="U1.THRES" />
    <trace name="T17" from="C1.pin2" to="net.GND" thickness="0.3mm" />

    <trace name="T18" from="R3.pin1" to="net.V5" thickness="0.3mm" />
    <trace name="T19" from="R3.pin2" to="D1.anode" />
    <trace name="T20" from="D1.cathode" to="U1.OUT" />

    <copperpour connectsTo="net.GND" layer="bottom" clearance="0.2mm" />
  </board>
)
