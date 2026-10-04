// The parts engine fetches every pinned JLCPCB part from EasyEDA only to compare footprints; EasyEDA rate-limits (HTTP 403)
export default {
  mainEntrypoint: 'index.circuit.tsx',
  ignoredFiles: ['docs', 'dist'],
  platformConfig: { partsEngineDisabled: true },
}
