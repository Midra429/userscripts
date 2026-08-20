import type { SyoboCalResponse } from '@midra/nco-utils/types/api/syobocal/json'

import { logger, setLoggerName } from '@midra/nco-utils/common/logger'

import { escapeHTML } from '@/utils/escapeHTML'

export const metadata: UserScriptMetadata = {
  name: 'Annict Music Info',
  description: 'Annictの作品ページに関連曲の情報を追加するスクリプト',
  namespace: 'https://midra.me/',
  version: '1.1.2',
  author: 'Midra <me@midra.me> (https://github.com/Midra429)',
  license: 'MIT',
  icon: 'https://annict.com/favicon.ico',
  match: ['https://annict.com/*'],
  'run-at': 'document-start',
  noframes: true,
  grant: ['GM.info', 'GM.setValue', 'GM.getValue', 'GM.xmlHttpRequest'],
  connect: ['cal.syoboi.jp'],
  updateURL:
    'https://raw.githubusercontent.com/Midra429/userscripts/refs/heads/main/dist/annict-music-info.meta.js',
  downloadURL:
    'https://raw.githubusercontent.com/Midra429/userscripts/refs/heads/main/dist/annict-music-info.user.js',
}

interface SyoboCalCache {
  comment: string
  lastModified: number
}

interface SongData {
  type: string
  title: string
  credits: [string, string][]
}

const CACHE_TTL = 86400000
const SYOBOCAL_JSON_URL = 'http://cal.syoboi.jp/json.php'
const SEARCH_URLS = [
  {
    label: 'Spotify',
    baseUrl: 'https://open.spotify.com/search/',
  },
  {
    label: 'Apple Music',
    baseUrl: 'https://music.apple.com/jp/search?term=',
  },
  {
    label: 'YouTube Music',
    baseUrl: 'https://music.youtube.com/search?q=',
  },
  {
    label: 'Google',
    baseUrl: 'https://www.google.com/search?q=',
  },
]

function getSearchURL(baseUrl: string, data: SongData): string {
  const artist = data.credits.find(
    ([v]) => v.includes('歌') || v.includes('アーティスト')
  )
  const keyword = `${data.title} ${artist?.[1] ?? ''}`.trim()

  return baseUrl + encodeURIComponent(keyword)
}

export async function main() {
  setLoggerName(GM.info.script.name)

  logger.log(`v${GM.info.script.version}`)

  const userAgent = `${GM.info.script.name}/${GM.info.script.version}`

  document.addEventListener('turbo:load', async () => {
    if (
      !location.pathname.startsWith('/works/') ||
      !location.pathname.endsWith('/info')
    ) {
      return
    }

    // Annict 作品ID
    const annictId = location.pathname.match(/\d+/)?.[0]
    if (!annictId) {
      logger.error('Annictの作品IDの取得に失敗しました')
      return
    }

    // しょぼいカレンダー TID
    const syobocalId = document
      .querySelector<HTMLAnchorElement>(
        '.card-body a[href*="cal.syoboi.jp/tid/"]'
      )
      ?.href.split('/')
      .at(-1)
    if (!syobocalId) {
      logger.error('しょぼいカレンダーのTIDの取得に失敗しました')
      return
    }

    // キャッシュ
    const scCacheKey = `sc:${syobocalId}`
    const scCache = await GM.getValue<SyoboCalCache | null>(scCacheKey, null)

    let scComment = scCache?.comment

    // キャッシュ更新
    if (
      !scCache ||
      !scComment ||
      CACHE_TTL < Date.now() - scCache.lastModified
    ) {
      // しょぼいカレンダー json.php
      const scJsonUrl = `${SYOBOCAL_JSON_URL}?${new URLSearchParams({
        Req: 'TitleFull',
        TID: syobocalId,
      })}`

      try {
        const { response } = await GM.xmlHttpRequest({
          method: 'GET',
          url: scJsonUrl,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent,
          },
          responseType: 'json',
        })

        // TitleFull.Comment
        const {
          Titles: {
            [syobocalId]: { Comment: comment },
          },
        } = response as SyoboCalResponse<'TitleFull'>

        scComment = comment

        await GM.setValue(scCacheKey, {
          comment,
          lastModified: Date.now(),
        } satisfies SyoboCalCache)
      } catch (err) {
        logger.error('しょぼいカレンダーの作品情報の取得に失敗しました', err)
        return
      }
    } else {
      logger.log('scCache', scCache)
    }

    const sections = scComment.split(/(?:\r\n|\r|\n)+(?=^\*[^\*])/m)

    const songs: SongData[] = []

    for (const section of sections) {
      const [header, ...rows] = section.split(/(?:\r\n|\r|\n)+/)

      const headerMatched = header.match(
        /^\*((?:(?:オープニング|エンディング)テーマ|(?:挿入|主題)歌)\d*)「(.+)」/
      )
      if (!headerMatched) continue

      const artists: SongData['credits'] = []
      const others: SongData['credits'] = []

      for (const row of rows) {
        const rowMatched = row.match(/^:([^:]+):(.+)$/)
        if (!rowMatched) continue

        if (
          rowMatched[1].includes('歌') ||
          rowMatched[1].includes('アーティスト')
        ) {
          artists.push([rowMatched[1], rowMatched[2]])
        } else {
          others.push([rowMatched[1], rowMatched[2]])
        }
      }

      songs.push({
        type: headerMatched[1],
        title: headerMatched[2],
        credits: [...artists, ...others],
      })
    }

    logger.log('songs', songs)

    if (!songs.length) return

    // 要素を追加
    const content = document.querySelector<HTMLElement>(
      '.l-default__main .l-default__content'
    )
    if (!content) return

    const html = songs
      .flatMap((song) => [
        // header
        /**/ '<div class="container mt-5">',
        /****/ `<h2 class="fw-bold h3 mb-3">${escapeHTML(song.type)}</h2>`,
        /**/ '</div>',

        // content
        /**/ '<div class="container u-container-flat">',
        /****/ '<div class="card u-card-flat">',
        /******/ '<div class="card-body">',

        /********/ '<div class="g-3 row">',
        // タイトル
        /**********/ '<div class="col-12">',
        /************/ '<div class="g-3 row">',
        /**************/ '<div class="col-4 text-end">タイトル</div>',
        /**************/ `<div class="col-8 fw-bold">${escapeHTML(song.title)}</div>`,
        /************/ '</div>',
        /**********/ '</div>',

        // 作詞/作曲/その他
        ...song.credits.flatMap(([head, data]) => [
          /********/ '<div class="col-12">',
          /**********/ '<div class="g-3 row">',
          /************/ `<div class="col-4 text-end">${escapeHTML(head)}</div>`,
          /************/ `<div class="col-8">${escapeHTML(data)}</div>`,
          /**********/ '</div>',
          /********/ '</div>',
        ]),

        // 検索
        /**********/ '<div class="col-12">',
        /************/ '<div class="g-3 row">',
        /**************/ '<div class="col-4 text-end">検索</div>',
        /**************/ '<div class="col-8">',
        SEARCH_URLS.map(({ label, baseUrl }) =>
          [
            /************/ `<a href="${getSearchURL(baseUrl, song)}" target="_blank" rel="noreferrer" style="white-space: nowrap;">`,
            /**************/ label,
            /************/ '</a>',
          ].join('')
        ).join('<span>&ensp;/&ensp;</span>'),
        /**************/ '</div>',
        /************/ '</div>',
        /**********/ '</div>',
        /********/ '</div>',

        // 引用元
        /********/ '<div class="text-end text-muted u-very-small">',
        /**********/ '引用元: しょぼいカレンダー',
        /********/ '</div>',

        /******/ '</div>',
        /****/ '</div>',
        /**/ '</div>',
      ])
      .join('')

    content.insertAdjacentHTML('beforeend', html)
  })
}
