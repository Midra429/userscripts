import child_process from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import util from 'node:util'

import {
  intro,
  isCancel,
  log,
  outro,
  select,
  spinner,
  text,
} from '@clack/prompts'

const exec = util.promisify(child_process.exec)

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

  process.exit(0)
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

  process.exit(0)
}

scriptId = normalizeScriptId(scriptId)

// ディレクトリ構成
const dirStruct = await select<[string, string]>({
  message: 'ディレクトリ構成',
  options: [
    {
      label: `${scriptId}/index.ts`,
      value: [scriptId, 'index.ts'],
    },
    {
      label: `${scriptId}.ts`,
      value: ['', `${scriptId}.ts`],
    },
  ],
  showInstructions: false,
})

if (isCancel(dirStruct)) {
  log.error('操作がキャンセルされました')

  process.exit(0)
}

const s = spinner()

s.start('ファイルを作成中...')

// ファイルのパス
const [dirPath, filePath] = dirStruct
const outDirPath = path.resolve(__dirname, '../src/entrypoints', dirPath)
const outFilePath = path.relative(
  process.cwd(),
  path.resolve(outDirPath, filePath)
)

try {
  // ディレクトリ作成
  await fs.mkdir(outDirPath, { recursive: true })

  // ファイル作成
  await fs.writeFile(
    outFilePath,
    `
    export const metadata: UserScriptMetadata = {
      name: '${escapeSingleQuote(scriptName)}',
      description: '',
      namespace: '${escapeSingleQuote(process.env.USERJS_NAMESPACE)}',
      version: '0.0.0',
      author: '${escapeSingleQuote(process.env.USERJS_AUTHOR)}',
      license: '${escapeSingleQuote(process.env.USERJS_LICENSE)}',
      match: [],
      updateURL: '${escapeSingleQuote(process.env.USERJS_UPDATE_URL?.replaceAll('<id>', scriptId))}',
      downloadURL: '${escapeSingleQuote(process.env.USERJS_DOWNLOAD_URL?.replaceAll('<id>', scriptId))}',
    }

    export function main() {}
    `,
    { flag: 'wx' }
  )

  // フォーマット
  await exec(`biome format --write ${outFilePath}`).catch(() => {
    log.error('ファイルのフォーマットに失敗しました')
  })

  s.stop('ファイルを作成しました')

  log.message(outFilePath)

  outro('終了')
} catch {
  s.error('同名のファイルが存在します')

  process.exit(0)
}
