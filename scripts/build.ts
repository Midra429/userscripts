import type { SelectOptions } from '@clack/prompts'

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import { intro, isCancel, log, outro, select, spinner } from '@clack/prompts'
import semver from 'semver'
import { buildUserJS } from 'userjs/build'

const SCRIPT_ID_REGEXP = /(?<=\/entrypoints\/)[^\/]+(?=(?:\/index)?\.ts$)/

intro('build')

// ファイル一覧を取得
const entryPath = path.resolve(__dirname, '../src/entrypoints')
const entryPattern = [
  path.join(entryPath, '*.ts'),
  path.join(entryPath, '*/index.ts'),
]

const selectOptions: SelectOptions<[string, string]>['options'] = []

for await (const entry of fs.glob(entryPattern)) {
  const id = entry.match(SCRIPT_ID_REGEXP)![0]

  selectOptions.push({
    label: id,
    value: [id, entry],
  })
}

// スクリプトを選択
const selectedScript = await select({
  message: 'ビルドするスクリプトを選択',
  options: selectOptions,
  showInstructions: false,
})

if (isCancel(selectedScript)) {
  log.error('操作がキャンセルされました')

  process.exit(0)
}

// スクリプトの詳細
const [scriptId, scriptPath] = selectedScript

const { metadata } = (await import(scriptPath)) as {
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

  process.exit(0)
}

// `metadata.version`を上書き
if (newVersion !== currentVersion) {
  metadata.version = newVersion

  await fs.writeFile(
    scriptPath,
    (await fs.readFile(scriptPath, { encoding: 'utf8' })).replace(
      /(export\s+const\s+metadata(?:\s*:\s*[\w$]+)?\s*=\s*\{[\s\S]*?\bversion\s*:\s*['"])[^'"]*(['"])/,
      `$1${newVersion}$2`
    )
  )

  log.success(`更新後のバージョン\nv${newVersion}`)
}

// ビルド開始
const s = spinner()

s.start('スクリプトをビルド中...')

try {
  // ビルド
  await buildUserJS({ scriptId, scriptPath, metadata })

  s.stop('スクリプトをビルドしました')

  outro('終了')
} catch (err) {
  console.error(err)

  s.error('スクリプトのビルドに失敗しました')

  process.exit(0)
}
