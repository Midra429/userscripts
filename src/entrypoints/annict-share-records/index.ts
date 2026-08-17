import { GMInfo, GMSetValue } from 'userjs/gm'

import { Annict } from './services/annict'
// import { Bluesky } from './services/bluesky'
import { Mastodon } from './services/mastodon'
import { Misskey } from './services/misskey'
// import { X } from './services/x'
import { Settings } from './settings'
import { Utils } from './utils'

export const metadata: UserScriptMetadata = {
  name: 'Annict Share Records',
  description: '記録をFediverse(Misskey, Mastodon, Bluesky)へ投稿',
  namespace: 'https://midra.me',
  version: '2.5.4',
  author: 'Midra',
  license: 'MIT',
  icon: 'https://annict.com/favicon.ico',
  match: ['https://*.annict.com/*', 'https://midra.me/empty/oauth/asr/*'],
  'run-at': 'document-end',
  noframes: true,
  grant: [
    'unsafeWindow',
    'GM_info',
    'GM.info',
    'GM_setValue',
    'GM.setValue',
    'GM_getValue',
    'GM.getValue',
  ],
  connect: ['annict.com'],
  updateURL:
    'https://raw.githubusercontent.com/Midra429/userscripts/refs/heads/main/dist/annict-share-records.meta.js',
  downloadURL:
    'https://raw.githubusercontent.com/Midra429/userscripts/refs/heads/main/dist/annict-share-records.user.js',
}

export async function main() {
  const postToFediverse = async (text: string) => {
    const postTo = await Utils.getSetting('post_to')

    if (postTo === 'misskey' || postTo === 'all') {
      await Misskey.API.notesCreate(text)
    }

    if (postTo === 'mastodon' || postTo === 'all') {
      await Mastodon.API.statuses(text)
    }

    // if (postTo === 'x' || postTo === 'all') {
    //   await X.API.tweets(text)
    // }

    // if (postTo === 'bluesky' || postTo === 'all') {
    //   await Bluesky.API.createPost(text)
    // }
  }

  const initSettings = async () => {
    if (
      location.pathname === '/settings/options' &&
      !document.getElementById(Settings.ID)
    ) {
      const settings = new Settings()
      const settingsElem = await settings.getElement()

      document
        .querySelector('.c-nav + .u-container-narrow')
        ?.appendChild(settingsElem)
    }
  }

  // Annict 認証コード
  if (location.href.startsWith(Annict.API.OAUTH_REDIRECT_URI)) {
    const code = new URLSearchParams(location.search).get('code')
    const token = await Annict.API.oauthToken(code)

    if (token) {
      await GMSetValue('annictToken', token)
      window.close()
    } else {
      alert(`[${GMInfo?.script.name}] Annictの認証に失敗しました`)
    }
  }
  // MiAuth リダイレクト
  else if (location.href.startsWith(Misskey.API.REDIRECT_URL)) {
    const session = new URLSearchParams(location.search).get('session')
    const token = session && (await Misskey.API.requestToken(session))

    if (token) {
      await GMSetValue('misskeyToken', token)
      window.close()
    } else {
      alert(`[${GMInfo?.script.name}] Misskeyの認証に失敗しました`)
    }
  }
  // Annict
  else if (location.hostname === 'annict.com') {
    // 認証
    if (Annict.isLoggedin() && !(await Annict.API.getToken())) {
      Annict.API.oauthAuthorize()

      setTimeout(() => location.reload(), 2000)
    } else {
      console.log(`[${GMInfo?.script.name}] v${GMInfo?.script.version}`)

      const settings = await Utils.getSettings()
      const user = await Annict.API.me()

      const getEpisodeRecordPostText = async ({
        episodeId,
        recordId,
        comment,
      }: {
        episodeId: string | number
        recordId?: string | number
        comment?: string
      }) => {
        if (!settings.episode_record_template) {
          return null
        }

        // const record = recordId ? await Annict.API.record({ recordId }) : null
        const episode = await Annict.API.episode(episodeId)
        const work = episode?.work

        if (work && episode) {
          return Utils.mustache(settings.episode_record_template!, {
            user,
            work,
            episode,
            record: {
              id: recordId,
              comment,
            },
          }).trim()
        }

        return null
      }

      // fetch
      unsafeWindow.fetch = new Proxy(unsafeWindow.fetch, {
        apply: async function (
          target,
          thisArg,
          argArray: Parameters<typeof fetch>
        ) {
          const promise = Reflect.apply(target, thisArg, argArray)

          const url = argArray[0].toString()

          const matchStatusSelect = url.match(
            new RegExp('/api/internal/works/(\\d+)/status_select$')
          )
          const matchEpisodeRecord = url.endsWith(
            '/api/internal/episode_records'
          )
          const matchCommentedRecords = url.match(
            new RegExp('/api/internal/episodes/(\\d+)/commented_records$')
          )

          if (
            matchStatusSelect ||
            matchEpisodeRecord ||
            matchCommentedRecords
          ) {
            let postText: string | null = null

            const response: Response = await promise

            if (response.ok) {
              const { body: reqBody } = argArray[1] ?? {}

              // 視聴ステータス 変更
              if (matchStatusSelect && settings.watch_status_template) {
                const workId = matchStatusSelect[1]

                const body = JSON.parse(reqBody?.toString() || '{}')
                const status = {
                  no_status: ['未選択'],
                  plan_to_watch: ['見たい', 'wanna_watch'],
                  watching: ['見てる', 'watching'],
                  completed: ['見た', 'watched'],
                  on_hold: ['一時中断', 'on_hold'],
                  dropped: ['視聴中止', 'stop_watching'],
                }[(body['status_kind'] as string) ?? '']

                if (status?.[1]) {
                  const work = await Annict.API.work(workId)

                  if (work) {
                    postText = Utils.mustache(settings.watch_status_template, {
                      user,
                      work,
                      status: {
                        id: status[1],
                        text: status[0],
                      },
                    }).trim()
                  }
                }
              }

              // エピソード 記録
              if (matchEpisodeRecord && settings.episode_record_template) {
                const body = JSON.parse(reqBody?.toString() || '{}')
                const episodeId = body['episode_id']
                const recordId = (await response.clone().json())['record_id']

                if (episodeId) {
                  postText = await getEpisodeRecordPostText({
                    episodeId,
                    recordId,
                  })
                }
              }

              // エピソード 記録 (感想あり)
              if (matchCommentedRecords && settings.episode_record_template) {
                const episodeId = matchCommentedRecords[1]

                if (reqBody instanceof URLSearchParams) {
                  const comment = reqBody
                    .get('forms_episode_record_form[comment]')
                    ?.trim()

                  postText = await getEpisodeRecordPostText({
                    episodeId,
                    comment,
                  })
                }
              }
            }

            if (postText) {
              await postToFediverse(postText)
            }

            return response
          }

          return promise
        },
      })

      // 設定 初期化
      await initSettings()

      const obs_options: MutationObserverInit = {
        childList: true,
        subtree: true,
      }
      const obs = new MutationObserver(async () => {
        obs.disconnect()

        await initSettings()

        obs.observe(document, obs_options)
      })

      obs.observe(document, obs_options)
    }
  }
}
