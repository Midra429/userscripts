import { GMGetValue, GMInfo } from 'userjs/gm'

type AnnictMe = {
  id: number
  username: string
  name: string
  description: string
  url: string
  avatar_url: string
  background_image_url: string
  records_count: number
  followings_count: number
  followers_count: number
  wanna_watch_count: number
  watching_count: number
  watched_count: number
  on_hold_count: number
  stop_watching_count: number
  created_at: string
  email: string
  notifications_count: number
}

type AnnictWork = {
  id: number
  title: string
  title_kana: string
  media: string
  media_text: string
  season_name: string
  season_name_text: string
  released_on: string
  released_on_about: string
  official_site_url: string
  wikipedia_url: string
  twitter_username: string
  twitter_hashtag: string
  syobocal_tid: string
  mal_anime_id: string
  episodes_count: number
  watchers_count: number
  reviews_count: number
  no_episodes: boolean
}

type AnnictEpisode = {
  id: number
  number: null
  number_text: string
  sort_number: number
  title: string
  records_count: number
  record_comments_count: number
  work: AnnictWork
  prev_episode: Omit<AnnictEpisode, 'work' | 'prev_episode' | 'next_episode'>
  next_episode: Omit<AnnictEpisode, 'work' | 'prev_episode' | 'next_episode'>
}

// type AnnictRecord = {
//   id: number
//   comment: string
//   rating_state: 'bad' | 'average' | 'good' | 'great'
//   is_modified: boolean
//   likes_count: number
//   comments_count: number
//   created_at: string
//   user: AnnictMe
//   work: AnnictWork
//   episode: AnnictEpisode
// }

export const Annict = {
  API: {
    BASE_URL: 'https://api.annict.com/',
    CLIENT_ID: 'sDz7ln_BRu4_JEyJW6sLDmGPyCmgCESkUaKRxxuT_2Q',
    CLIENT_SECRET: 'CUYwC_JJ6wtz0jxd9xGD4GyIo3tf1Mxd3VsreOZyBtI',
    OAUTH_REDIRECT_URI: 'https://midra.me/empty/oauth/asr/annict',

    getToken: async () => (await GMGetValue('annictToken', '')) ?? '',

    oauthAuthorize() {
      const url = new URL('/oauth/authorize', Annict.API.BASE_URL)

      url.searchParams.set('client_id', Annict.API.CLIENT_ID)
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('redirect_uri', Annict.API.OAUTH_REDIRECT_URI)
      url.searchParams.set('scope', 'read')

      window.open(url.href)
    },

    async oauthToken(code: string | null) {
      if (!code) return null

      try {
        const url = new URL('/oauth/token', Annict.API.BASE_URL)

        url.searchParams.set('client_id', Annict.API.CLIENT_ID)
        url.searchParams.set('client_secret', Annict.API.CLIENT_SECRET)
        url.searchParams.set('grant_type', 'authorization_code')
        url.searchParams.set('redirect_uri', Annict.API.OAUTH_REDIRECT_URI)
        url.searchParams.set('code', code)

        const res = await fetch(url, { method: 'POST' })

        const { access_token } = await res.json()

        if (typeof access_token === 'string') {
          return access_token
        }
      } catch (e) {
        console.error(`[${GMInfo?.script.name}]`, e)
      }

      return null
    },

    async me(): Promise<AnnictMe | null> {
      try {
        const url = new URL('/v1/me', Annict.API.BASE_URL)

        url.searchParams.set('access_token', await Annict.API.getToken())

        const res = await fetch(url)

        return await res.json()
      } catch (e) {
        console.error(`[${GMInfo?.script.name}]`, e)
      }

      return null
    },

    async work(workId: string | number): Promise<AnnictWork | null> {
      try {
        const url = new URL('/v1/works', Annict.API.BASE_URL)

        url.searchParams.set('filter_ids', workId.toString())
        url.searchParams.set('access_token', await Annict.API.getToken())

        const res = await fetch(url)
        const { works } = await res.json()

        return works[0]
      } catch (e) {
        console.error(`[${GMInfo?.script.name}]`, e)
      }

      return null
    },

    async episode(episodeId: string | number): Promise<AnnictEpisode | null> {
      try {
        const url = new URL('/v1/episodes', Annict.API.BASE_URL)

        url.searchParams.set('filter_ids', episodeId.toString())
        url.searchParams.set('access_token', await Annict.API.getToken())

        const res = await fetch(url)
        const { episodes } = await res.json()

        return episodes[0]
      } catch (e) {
        console.error(`[${GMInfo?.script.name}]`, e)
      }

      return null
    },

    // async record({
    //   recordId,
    //   hasComment,
    // }: {
    //   recordId: string | number
    //   hasComment?: boolean
    // }): Promise<AnnictRecord | null> {
    //   try {
    //     const url = new URL('/v1/records', Annict.API.BASE_URL)

    //     if (recordId) {
    //       url.searchParams.set('filter_ids', recordId.toString())
    //     }
    //     if (hasComment) {
    //       url.searchParams.set('filter_has_record_comment', 'true')
    //     }
    //     url.searchParams.set('access_token', await Annict.API.getToken())

    //     const res = await fetch(url)
    //     const { records } = await res.json()

    //     return records[0]
    //   } catch (e) {
    //     console.error(`[${GMInfo?.script.name}]`, e)
    //   }

    //   return null
    // },
  },

  isLoggedin: () => !!document.querySelector('a[href="/sign_out"]'),
} as const
