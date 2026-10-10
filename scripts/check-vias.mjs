// Fails when a drilled hole of the built board falls in a JLCPCB extra-charge tier (LAYOUT_RULES 66).
// Usage: node scripts/check-vias.mjs dist/<board>/circuit.json [...]
import { readFileSync } from 'node:fs'

const MIN_HOLE = 0.3
const MIN_VIA_PAD = 0.45
const EPS = 1e-6

const files = process.argv.slice(2)
if (!files.length) {
  console.error('check-vias: pass at least one circuit.json (run tsci build first)')
  process.exit(1)
}

const at = e => `(${e.x?.toFixed(2)}, ${e.y?.toFixed(2)})`
const holeOf = e => e.hole_diameter ?? Math.min(e.hole_width ?? Infinity, e.hole_height ?? Infinity)

let failed = false
for (const file of files) {
  const json = JSON.parse(readFileSync(file, 'utf8'))
  const vias = json.filter(e => e.type === 'pcb_via')
  const platedHoles = json.filter(e => e.type === 'pcb_plated_hole')

  const errors = [
    ...vias.filter(v => !(v.hole_diameter >= MIN_HOLE - EPS) || !(v.outer_diameter >= MIN_VIA_PAD - EPS)).map(v => `via ${v.outer_diameter} mm pad / ${v.hole_diameter} mm hole at ${at(v)}`),
    ...platedHoles.filter(h => holeOf(h) < MIN_HOLE - EPS).map(h => `plated hole ${holeOf(h)} mm at ${at(h)}`)
  ]
  const sizes = [...new Set(vias.map(v => `${v.outer_diameter}/${v.hole_diameter}`))]

  console.log(`${file}: ${vias.length} via(s)${sizes.length ? `, pad/hole ${sizes.join(', ')} mm` : ''}, ${platedHoles.length} plated hole(s)`)
  if (sizes.length > 1) console.warn(`  warning: ${sizes.length} via sizes, rule 66 asks for one`)
  for (const error of errors) console.error(`  extra charge: ${error}`)
  failed ||= errors.length > 0
}

if (failed) {
  console.error(`check-vias: holes under ${MIN_HOLE} mm (or via pads under ${MIN_VIA_PAD} mm) cost extra at JLCPCB; set pcbStyle={{ viaPadDiameter: 0.6, viaHoleDiameter: 0.3 }} on the <board>`)
  process.exit(1)
}
