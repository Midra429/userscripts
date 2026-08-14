import { globSync, readFileSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { cwd, exit } from 'node:process'

import { intro, isCancel, log, outro, select, spinner } from '@clack/prompts'
import { rolldown } from 'rolldown'
import semver from 'semver'
import { generateMetadata } from 'userjs/libs/generateMetadata'

intro('build')

// ファイル一覧を取得
const inputFilePaths = globSync([
  resolve(__dirname, '../src/entrypoints/*.ts'),
  resolve(__dirname, '../src/entrypoints/*/index.ts'),
]).sort()
const scriptIds = inputFilePaths.map(
  (v) => v.match(/(?<=\/entrypoints\/)[^\/]+(?=(?:\/index)?\.ts$)/)![0]
)

// スクリプトを選択
const scriptIdx = await select({
  message: 'ビルドするスクリプトを選択',
  options: scriptIds.map((id, idx) => ({
    label: id,
    value: idx,
  })),
  showInstructions: false,
})

if (isCancel(scriptIdx)) {
  log.error('操作がキャンセルされました')

  exit(0)
}

// スクリプトの詳細
const scriptId = scriptIds[scriptIdx]
const inputFilePath = inputFilePaths[scriptIdx]
const { metadata } = (await import(inputFilePath)) as {
  metadata: UserScriptMetadata
}

// バージョン
const currentVersion = semver.valid(metadata.version) ?? '0.0.0'

log.message(`現在のバージョン\nv${currentVersion}`)

// バージョン更新
const RELEASE_TYPES: ('none' | semver.ReleaseType)[] = [
  'none',
  'patch',
  'minor',
  'major',
]

const newVersion = await select({
  message: 'バージョン更新',
  options: RELEASE_TYPES.map((release) => {
    const version =
      release === 'none' ? currentVersion : semver.inc(currentVersion, release)!

    return {
      label: release,
      value: version,
      hint: `v${version}`,
    }
  }),
  showInstructions: false,
})

if (isCancel(newVersion)) {
  log.error('操作がキャンセルされました')

  exit(0)
}

// `metadata.version`を上書き
if (newVersion !== currentVersion) {
  metadata.version = newVersion

  writeFileSync(
    inputFilePath,
    readFileSync(inputFilePath, { encoding: 'utf8' }).replace(
      /(export\s+const\s+metadata(?:\s*:\s*[\w$]+)?\s*=\s*\{[\s\S]*?\bversion\s*:\s*['"])[^'"]*(['"])/,
      `$1${newVersion}$2`
    )
  )

  log.success(`更新後のバージョン\nv${newVersion}`)
}

// ビルド開始
const s = spinner()

s.start('スクリプトをビルド中...')

// UserScriptのヘッダー
const header = generateMetadata(metadata)

// rolldown
const bundle = await rolldown({
  input: 'virtual:main',
  plugins: [
    {
      name: 'virtual',
      resolveId(id) {
        if (id === 'virtual:main') {
          return id
        }
      },
      load(id) {
        if (id === 'virtual:main') {
          return `import { main } from "${inputFilePath}"; main();`
        }
      },
    },
  ],
  experimental: {
    attachDebugInfo: 'none',
  },
})

// 出力先
const outFilePath = relative(
  cwd(),
  resolve(__dirname, '../dist', `${scriptId}.user.js`)
)

try {
  // 出力
  await bundle.write({
    file: outFilePath,
    format: 'iife',
    codeSplitting: false,
    banner: header,
    comments: false,
    strict: true,
  })

  s.stop('スクリプトをビルドしました')

  outro(outFilePath)
} catch (err) {
  console.error(err)

  s.error('スクリプトのビルドに失敗しました')

  exit(0)
}
