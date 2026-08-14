export const GMInfo =
  (typeof GM !== 'undefined' && GM.info) ||
  (typeof GM_info !== 'undefined' && GM_info) ||
  null

export async function GMGetValue<T>(name: string, defaultValue?: T) {
  if (typeof GM !== 'undefined') {
    return GM.getValue?.(name, defaultValue)
  }
  if (typeof GM_getValue !== 'undefined') {
    return GM_getValue(name, defaultValue)
  }
  return defaultValue ?? null
}

export async function GMSetValue(name: string, value: any) {
  if (typeof GM !== 'undefined') {
    return GM.setValue?.(name, value)
  }
  if (typeof GM_setValue !== 'undefined') {
    return GM_setValue(name, value)
  }
}

export async function GMDeleteValue(name: string) {
  if (typeof GM !== 'undefined') {
    return GM.deleteValue?.(name)
  }
  if (typeof GM_deleteValue !== 'undefined') {
    return GM_deleteValue(name)
  }
}

export async function GMXmlhttpRequest(details: Tampermonkey.Request<any>) {
  if (typeof GM !== 'undefined') {
    return GM.xmlHttpRequest?.(details)
  }
  if (typeof GM_xmlhttpRequest !== 'undefined') {
    return GM_xmlhttpRequest(details)
  }
}
