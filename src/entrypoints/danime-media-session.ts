export const metadata: UserScriptMetadata = {
  name: 'dアニメストア メディアセッション',
  description: 'dアニメストアでメディアセッションAPIを使うようにする',
  namespace: 'https://midra.me/',
  version: '1.0.0',
  author: 'Midra <me@midra.me> (https://github.com/Midra429)',
  license: 'MIT',
  icon: 'https://animestore.docomo.ne.jp/favicon.ico',
  match: ['*://animestore.docomo.ne.jp/animestore/sc_d_pc?*'],
  'run-at': 'document-end',
  noframes: true,
  grant: ['GM.xmlHttpRequest'],
  connect: ['animestore.docomo.ne.jp'],
  updateURL:
    'https://raw.githubusercontent.com/Midra429/userscripts/refs/heads/main/dist/danime-media-session.meta.js',
  downloadURL:
    'https://raw.githubusercontent.com/Midra429/userscripts/refs/heads/main/dist/danime-media-session.user.js',
}

async function getImageInfo(url: string) {
  try {
    const { response } = await GM.xmlHttpRequest({
      url,
      responseType: 'blob',
    })
    const blob = response as Blob

    const img = new Image()
    img.src = URL.createObjectURL(blob)

    await img.decode()

    URL.revokeObjectURL(img.src)

    return {
      type: blob.type,
      width: img.naturalWidth,
      height: img.naturalHeight,
    }
  } catch {}
}

async function updateMediaMetadata() {
  const pauseInfoIn = document.querySelector('#pauseInfo .pauseInfoIn')!
  const backThumb = document.getElementById('backThumb')!

  const title = [...pauseInfoIn.children]
    .map((v) => v.textContent.trim())
    .join(' ')
    .trim()
  const thumb = backThumb.style.backgroundImage.replace(
    /^url\(["']?|["']?\)$/g,
    ''
  )

  const imgInfo = await getImageInfo(thumb)

  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist: 'dアニメストア',
    artwork: [
      {
        src: thumb,
        sizes: imgInfo ? imgInfo.width + 'x' + imgInfo.height : undefined,
        type: imgInfo ? imgInfo.type : undefined,
      },
    ],
  })
}

export function main() {
  // メタデータ
  const video = document.body.querySelector<HTMLVideoElement>('video#video')!

  if (HTMLMediaElement.HAVE_METADATA <= video.readyState) {
    updateMediaMetadata()
  }

  video.addEventListener('loadedmetadata', updateMediaMetadata)

  // メディアセッションのアクション
  const playButton =
    document.querySelector<HTMLButtonElement>('button.playButton')!
  const prevButton =
    document.querySelector<HTMLButtonElement>('button.prevButton')!
  const nextButton =
    document.querySelector<HTMLButtonElement>('button.nextButton')!

  function actionHandler(details: MediaSessionActionDetails) {
    switch (details.action) {
      case 'play':
      case 'pause':
        playButton.click()
        break

      case 'previoustrack':
        prevButton.click()
        break

      case 'nexttrack':
        nextButton.click()
        break
    }
  }

  navigator.mediaSession.setActionHandler('play', actionHandler)
  navigator.mediaSession.setActionHandler('pause', actionHandler)
  navigator.mediaSession.setActionHandler('previoustrack', actionHandler)
  navigator.mediaSession.setActionHandler('nexttrack', actionHandler)
}
