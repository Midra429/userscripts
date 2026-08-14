// import type { Records } from '@externdefs/bluesky-client/atp-schema'

// import { BskyAgent, RichText } from '@atproto/api'
// import { GMInfo } from '../GM'
// import { Utils } from '../utils'

// type PostRecords = Records['app.bsky.feed.post'] & {
//   $type: 'app.bsky.feed.post'
// }

// const convert = (src: string) => {
//   const mdLinkRegex = /\??\[([^\]]+)\]\(([^)]+)\)/
//   const facets: PostRecords['facets'] = []

//   while (true) {
//     const links = src.match(mdLinkRegex)
//     if (!links) {
//       return { text: src, facets }
//     }

//     const [matched, anchor, uri] = links
//     src = src.replace(matched, anchor)

//     const byteStart = new TextEncoder().encode(
//       src.substring(0, links.index)
//     ).byteLength
//     const byteEnd = byteStart + new TextEncoder().encode(anchor).byteLength

//     facets.push({
//       index: { byteStart, byteEnd },
//       features: [{ $type: 'app.bsky.richtext.facet#link', uri }],
//     })
//   }
// }

// export const Bluesky = {
//   API: {
//     async createPost(text: string) {
//       const service = await Utils.getSetting('bluesky_service')
//       const identifier = await Utils.getSetting('bluesky_username')
//       const password = await Utils.getSetting('bluesky_password')

//       if (text && service && identifier && password) {
//         try {
//           const agent = new BskyAgent({
//             service: `https://${Utils.getInstance(service)}`,
//           })

//           await agent.login({ identifier, password })

//           const converted = convert(text)
//           const rt = new RichText({ text: converted.text })
//           await rt.detectFacets(agent)

//           return await agent.post({
//             text: rt.text,
//             facets: [...converted.facets, ...(rt.facets ?? [])],
//             langs: ['ja'],
//           })
//         } catch (e) {
//           console.error(`[${GMInfo?.script.name}]`, e)
//         }
//       }

//       return null
//     },

//     // async getCard(cardUrl: string): Promise<{
//     //   title: string
//     //   description: string
//     //   image: string
//     //   url: string
//     // } | null> {
//     //   try {
//     //     const url = new URL('https://cardyb.bsky.app/v1/extract')
//     //     url.searchParams.set('url', cardUrl)

//     //     const res = await fetch(url, {
//     //       headers: {
//     //         'Content-Type': 'application/json',
//     //       },
//     //     })

//     //     return await res.json()
//     //   } catch (e) {}

//     //   return null
//     // },
//   },
// } as const
