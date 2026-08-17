import type { RolldownOutput } from 'rolldown'

import { build } from 'rolldown'

import { generateMetadata } from './libs/generateMetadata'

const VIRTUAL_ID = '\0virtual:userjs'

interface BuildOptions {
  scriptId: string
  scriptPath: string
  metadata: UserScriptMetadata
  outDir?: string
}

export async function buildUserJS({
  scriptId,
  scriptPath,
  metadata,
  outDir,
}: BuildOptions): Promise<RolldownOutput> {
  const banner = generateMetadata(metadata)

  return build({
    input: VIRTUAL_ID,
    output: {
      dir: outDir,
      entryFileNames: `${scriptId}.user.js`,
      format: 'iife',
      codeSplitting: false,
      banner,
      comments: false,
      strict: true,
    },
    experimental: {
      attachDebugInfo: 'none',
    },
    plugins: [
      {
        name: 'userjs',
        resolveId(id: string) {
          if (id === VIRTUAL_ID) {
            return VIRTUAL_ID
          }
        },
        load(id: string) {
          if (id === VIRTUAL_ID) {
            return `import { main } from "${scriptPath}"; main();`
          }
        },
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: `${scriptId}.meta.js`,
            source: banner + '\n',
          })
        },
      },
    ],
  })
}
