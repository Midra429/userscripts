export const metadata: UserScriptMetadata = {
  name: 'Annict Music Links',
  description: 'Annictの作品ページに関連曲の情報を追加するスクリプトです。',
  namespace: 'https://midra.me/',
  version: '0.0.0',
  author: 'Midra <me@midra.me> (https://github.com/Midra429)',
  license: 'MIT',
  match: ['https://annict.com/*'],
  'run-at': 'document-end',
  noframes: true,
}

export function main() {
  alert('test')
}
