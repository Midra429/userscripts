import type {
  LocalizedType,
  UserScriptAntifeature,
  UserScriptCompatible,
  UserScriptResource,
} from '../types/metadata'

const METADATA_SORTED_KEYS: UserScriptMetadataKey[] = [
  'name',
  'description',
  'namespace',
  'version',
  'author',
  'copyright',
  'license',
  'homepage',
  'supportURL',
  'contributionURL',
  'contributionAmount',
  'icon',
  'icon64',
  'tag',
  'compatible',
  'incompatible',
  'antifeature',
  'include',
  'match',
  'exclude',
  'run-at',
  'run-in',
  'noframes',
  'sandbox',
  'require',
  'resource',
  'grant',
  'connect',
  'updateURL',
  'downloadURL',
  'unwrap',
]

function isLocalizedString(
  key: UserScriptMetadataKey,
  _value: unknown
): _value is LocalizedType<string> {
  return key === 'name' || key === 'description'
}
function isCompatible(
  key: UserScriptMetadataKey,
  _value: unknown
): _value is UserScriptCompatible {
  return key === 'compatible' || key === 'incompatible'
}
function isAntifeature(
  key: UserScriptMetadataKey,
  _value: unknown
): _value is UserScriptAntifeature {
  return key === 'antifeature'
}
function isResource(
  key: UserScriptMetadataKey,
  _value: unknown
): _value is UserScriptResource {
  return key === 'resource'
}

export function generateMetadata(metadata: UserScriptMetadata): string {
  const chunks: [string, string | null, string | null][] = []

  for (const key of METADATA_SORTED_KEYS) {
    if (!(key in metadata)) continue

    const value = metadata[key]

    if (typeof value === 'string' || typeof value === 'number') {
      chunks.push([key, null, value])
    } else if (typeof value === 'boolean') {
      if (value) {
        chunks.push([key, null, null])
      }
    } else if (Array.isArray(value)) {
      for (const val of value) {
        chunks.push([key, null, val])
      }
    }
    // @name, @description
    else if (isLocalizedString(key, value)) {
      for (const lang in value) {
        const val = value[lang as keyof typeof value]

        if (!val) continue

        const keyWithLang = lang === '$' ? key : `${key}:${lang}`

        chunks.push([keyWithLang, null, typeof val === 'string' ? val : null])
      }
    }
    // @compatible, @incompatible
    else if (isCompatible(key, value)) {
      for (const [browser, comment] of Object.entries(value)) {
        chunks.push([
          key,
          browser,
          typeof comment === 'string' ? comment : null,
        ])
      }
    }
    // @antifeature
    else if (isAntifeature(key, value)) {
      for (const [type, description] of Object.entries(value)) {
        if (typeof description === 'boolean') {
          chunks.push([key, type, null])
        } else if (typeof description === 'string') {
          chunks.push([key, type, description])
        } else {
          for (const lang in description) {
            const desc = description[lang as keyof typeof description]

            if (!desc) continue

            const keyWithLang = lang === '$' ? key : `${key}:${lang}`

            chunks.push([
              keyWithLang,
              type,
              typeof desc === 'string' ? desc : null,
            ])
          }
        }
      }
    }
    // @resource
    else if (isResource(key, value)) {
      for (const [tag, val] of Object.entries(value)) {
        chunks.push([key, tag, val])
      }
    }
  }

  const lines: string[] = []

  lines.push('==UserScript==')

  const maxKeyLength = Math.max(...chunks.map(([k]) => k.length))
  const maxTypeLength = Math.max(...chunks.map(([_, t]) => t?.length ?? 0))

  for (const [key, type, val] of chunks) {
    let line = ''

    line += `@${key}`

    if (type || val) {
      line += ' '.repeat(maxKeyLength - key.length + 1)
    }

    if (type) {
      line += type
    }
    if (val) {
      if (type) {
        line += ' '.repeat(maxTypeLength - type.length + 1)
      }

      line += val
    }

    lines.push(line)
  }

  lines.push('==/UserScript==')

  return lines.map((v) => `// ${v}`).join('\n')
}
