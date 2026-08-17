import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { cwd, env, exit } from 'node:process'

import {
  confirm,
  intro,
  isCancel,
  log,
  outro,
  spinner,
  text,
} from '@clack/prompts'

function isAlphanumeric(input: string): boolean {
  return /^[a-z0-9\-_\s]+$/i.test(input)
}
function normalizeScriptName(name: string): string {
  return name.replace(/\s+/g, ' ').replace(/(?:\.user)\.js$/, '')
}
function normalizeScriptId(name: string): string {
  return normalizeScriptName(name).replace(/\s/g, '-').toLowerCase()
}
function escapeSingleQuote(text?: string): string {
  return text?.replaceAll("'", "\\'") ?? ''
}

intro('create')

// スクリプト名
let scriptName = await text({
  message: 'スクリプト名',
  validate(val) {
    if (!val?.length) {
      return 'スクリプト名を入力してください'
    }
  },
})

if (isCancel(scriptName)) {
  log.error('操作がキャンセルされました')

  exit(0)
}

scriptName = normalizeScriptName(scriptName)

// スクリプトID
let scriptId = await text({
  message: 'スクリプトID',
  initialValue: isAlphanumeric(scriptName)
    ? normalizeScriptId(scriptName)
    : undefined,
  validate(val) {
    if (!val?.length) {
      return 'スクリプトIDを入力してください'
    }
    if (!isAlphanumeric(scriptName)) {
      return '英数字/ハイフン/アンダースコアのみ使用できます'
    }
  },
})

if (isCancel(scriptId)) {
  log.error('操作がキャンセルされました')

  exit(0)
}

scriptId = normalizeScriptId(scriptId)

// ファイル作成
const shouldProceed = await confirm({
  message: 'ファイルを作成しますか？',
})

if (isCancel(shouldProceed) || !shouldProceed) {
  log.error('ファイルの作成を中断しました')

  exit(0)
}

const s = spinner()

s.start('ファイルを作成中...')

// ファイルのパス
const outDirPath = resolve(__dirname, '../src/entrypoints', scriptId)
const outFilePath = relative(cwd(), resolve(outDirPath, 'index.ts'))

if (existsSync(outFilePath)) {
  s.error('同名のファイルが存在します')

  exit(0)
} else {
  const template = `
    export const metadata: UserScriptMetadata = {
      name: '${escapeSingleQuote(scriptName)}',
      description: '',
      namespace: '${escapeSingleQuote(env.USERJS_NAMESPACE)}',
      version: '0.0.0',
      author: '${escapeSingleQuote(env.USERJS_AUTHOR)}',
      license: '${escapeSingleQuote(env.USERJS_LICENSE)}',
      match: [],
      updateURL: '${escapeSingleQuote(env.USERJS_UPDATE_URL?.replaceAll('<id>', scriptId))}',
      downloadURL: '${escapeSingleQuote(env.USERJS_DOWNLOAD_URL?.replaceAll('<id>', scriptId))}',
    }

    export function main() {}
  `

  // ファイル作成
  mkdirSync(outDirPath, { recursive: true })
  writeFileSync(outFilePath, template)
  // フォーマット
  execSync(`biome format --write ${outFilePath}`)

  s.stop('ファイルを作成しました')

  log.message(outFilePath)

  outro('終了')
}
