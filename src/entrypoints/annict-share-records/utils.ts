import Mustache from 'mustache'
import { GMGetValue } from 'userjs/gm'

import { SETTINGS_INIT_DATA, SETTINGS_KEYS } from './constants'

export const Utils = {
  async getSetting(key: (typeof SETTINGS_KEYS)[number]) {
    return GMGetValue(`setting_${key}`, SETTINGS_INIT_DATA[key].default)
  },

  async getSettings() {
    const settings: {
      [key in (typeof SETTINGS_KEYS)[number]]?: string
    } = {}

    for (const key of SETTINGS_KEYS) {
      settings[key] =
        (await GMGetValue(`setting_${key}`, SETTINGS_INIT_DATA[key].default)) ??
        undefined
    }

    return settings
  },

  getInstance(str: string) {
    str = str.trim()

    let hostname = ''

    if (/^https?:\/\//.test(str)) {
      try {
        hostname = new URL(str).hostname
      } catch {}
    } else if (/[^\.]+\.[^\.]{2,}/.test(str)) {
      hostname = str
    }

    return hostname || null
  },

  filterObject<T>(obj: T): T | null {
    if (obj !== null && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        const ary = obj.map(this.filterObject).filter(Boolean)

        if (0 < ary.length) {
          return ary as T
        } else {
          return null
        }
      } else {
        const keys = Object.keys(obj) as (keyof typeof obj)[]

        if (0 < keys.length) {
          for (const key of keys) {
            // @ts-ignore
            obj[key] = this.filterObject(obj[key])
          }
          return obj
        } else {
          return null
        }
      }
    } else {
      if (typeof obj === 'number' || typeof obj === 'boolean') {
        return obj
      } else {
        return obj || null
      }
    }
  },

  mustache(...args: Parameters<typeof Mustache.render>) {
    args[1] = this.filterObject(args[1])
    return Mustache.render(args[0], args[1], args[2], {
      escape: (str) => str,
    })
  },
}
