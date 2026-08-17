import { Utils } from '../utils'

export const Misskey = {
  API: {
    REDIRECT_URL: 'https://midra.me/empty/oauth/asr/misskey',

    getToken: () => GM.getValue<string>('misskeyToken', ''),

    async authorize() {
      const instance = Utils.getInstance(
        await Utils.getSetting('misskey_instance')
      )

      if (instance) {
        const session = crypto.randomUUID()

        const url = new URL(`/miauth/${session}`, `https://${instance}`)
        url.searchParams.set('name', 'Annict Share Records')
        url.searchParams.set('icon', 'https://midra.me/assets/images/midra.png')
        url.searchParams.set('callback', Misskey.API.REDIRECT_URL)
        url.searchParams.set('permission', 'write:notes')

        window.open(url.href)
      }
    },

    async requestToken(session: string) {
      if (!session) return

      const instance = Utils.getInstance(
        await Utils.getSetting('misskey_instance')
      )

      if (instance) {
        try {
          const url = new URL(
            `/api/miauth/${session}/check`,
            `https://${instance}`
          )

          const res = await fetch(url, { method: 'POST' })
          const json: { token: string; user: any } = await res.json()

          return json.token
        } catch (e) {
          console.error(`[${GM.info.script.name}]`, e)
        }
      }
    },

    async notesCreate(text: string) {
      text = text.trim()

      const instance = Utils.getInstance(
        await Utils.getSetting('misskey_instance')
      )
      const token = await Misskey.API.getToken()

      if (text && instance && token) {
        try {
          const url = new URL('/api/notes/create', `https://${instance}`)

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              i: token,
              text: text,
              visibility:
                (await Utils.getSetting('misskey_visibility')) || 'home',
            }),
          })
          return await res.json()
        } catch (e) {
          console.error(`[${GM.info.script.name}]`, e)
        }
      }
    },
  },
} as const
