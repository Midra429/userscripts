export function escapeHTML(str: string): string {
  let html = ''
  let lastIndex = 0

  for (let i = 0; i < str.length; i++) {
    let escaped: string | undefined

    switch (str.charCodeAt(i)) {
      case 34: // "
        escaped = '&quot;'
        break
      case 38: // &
        escaped = '&amp;'
        break
      case 39: // '
        escaped = '&#39;'
        break
      case 60: // <
        escaped = '&lt;'
        break
      case 62: // >
        escaped = '&gt;'
        break
    }

    if (escaped) {
      if (lastIndex !== i) {
        html += str.slice(lastIndex, i)
      }

      html += escaped
      lastIndex = i + 1
    }
  }

  return lastIndex ? html + str.slice(lastIndex) : str
}
