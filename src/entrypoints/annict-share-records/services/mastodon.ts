import { GMInfo } from 'userjs/gm'

import { Utils } from '../utils'

export const Mastodon = {
  API: {
    async statuses(text: string) {
      text = text.trim()

      const instance = Utils.getInstance(
        (await Utils.getSetting('mastodon_instance')) ?? ''
      )
      const token = await Utils.getSetting('mastodon_token')

      if (text && instance && token) {
        try {
          const url = new URL('/api/v1/statuses', `https://${instance}`)

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: text,
              visibility:
                (await Utils.getSetting('mastodon_visibility')) || 'unlisted',
            }),
          })
          return await res.json()
        } catch (e) {
          console.error(`[${GMInfo?.script.name}]`, e)
        }
      }
    },
  },
}
