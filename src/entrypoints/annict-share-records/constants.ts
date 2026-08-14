import type { InitData } from './type'

import { Misskey } from './services/misskey'

export const SETTINGS_KEYS = [
  'post_to',

  'misskey_instance',
  'misskey_visibility',
  // 'misskey_token',

  'mastodon_instance',
  'mastodon_visibility',
  'mastodon_token',

  // 'x_token',

  // 'bluesky_service',
  // 'bluesky_username',
  // 'bluesky_password',

  'watch_status_template',
  'episode_record_template',
] as const

export const SETTINGS_INIT_DATA: {
  [key in
    | (typeof SETTINGS_KEYS)[number]
    | `button_${string}`
    | `divider_${string}`]: InitData
} = {
  /** 投稿先 */
  post_to: {
    type: 'select',
    label: '投稿先',
    default: 'all',
    options: {
      all: 'すべて (サーバー未入力を除く)',
      misskey: 'Misskey',
      mastodon: 'Mastodon',
      x: 'X (Twitter)',
      // bluesky: 'Bluesky',
    },
  },

  divider_1: { type: 'divider' },

  /** Misskey サーバー */
  misskey_instance: {
    type: 'text',
    label: 'Misskey サーバー',
    description: '例: https://misskey.io/, submarin.online',
    default: '',
  },
  /** Misskey 公開範囲 */
  misskey_visibility: {
    type: 'select',
    label: 'Misskey 公開範囲',
    default: 'home',
    options: {
      public: 'パブリック',
      home: 'ホーム',
      followers: 'フォロワー',
    },
  },
  /** Misskey アクセストークン */
  //   misskey_token: {
  //     label: 'Misskey アクセストークン',
  //     description: `
  // 1. Misskeyの設定 > API > アクセストークンの発行
  // 2. 名前に「Annict Share Records」と入力し、「ノートを作成・削除する」にチェック
  // 3. 右上の ✓ を押した後に表示される確認コード(アクセストークン)をこの欄に入力
  //     `.trim(),
  //     type: 'password',
  //     default: '',
  //   },
  /** Misskey 認証ボタン */
  button_misskey_auth: {
    type: 'button',
    label: 'Misskeyで認証',
    async onClick() {
      const token = await Misskey.API.getToken()

      if (!token || confirm('認証済みです。\n再認証しますか？')) {
        await Misskey.API.authorize()
      }
    },
  },

  divider_2: { type: 'divider' },

  /** Mastodon サーバー */
  mastodon_instance: {
    type: 'text',
    label: 'Mastodon サーバー',
    description: '例: https://mstdn.jp/, fedibird.com',
    default: '',
  },
  /** Mastodon 公開範囲 */
  mastodon_visibility: {
    type: 'select',
    label: 'Mastodon 公開範囲',
    default: 'unlisted',
    options: {
      public: '公開',
      unlisted: '未収載',
      private: 'フォロワー限定',
    },
  },
  /** Mastodon アクセストークン */
  mastodon_token: {
    type: 'password',
    label: 'Mastodon アクセストークン',
    description: `
1. Mastodonの設定 > 開発 > 新規アプリ
2. アプリの名前に「Annict Share Records」と入力し、「write」か「write:statuses」にチェック
3. 「送信」をクリック
4. アプリ一覧から先程作成したアプリをクリックし、表示されているアクセストークンをこの欄に入力
    `.trim(),
    default: '',
  },

  // divider_3: { type: 'divider' },

  // /** X (Twitter) */
  // x_token: {
  //   type: 'password',
  //   label: 'X Access Token',
  //   default: '',
  // },

  //   /** Bluesky サーバー */
  //   bluesky_service: {
  //     type: 'text',
  //     label: 'Bluesky サーバー',
  //     description: '例: https://bsky.social/, bsky.social',
  //     default: '',
  //   },
  //   /** Bluesky ユーザー名 */
  //   bluesky_username: {
  //     type: 'text',
  //     label: 'Bluesky ユーザー名',
  //     description: '例: xxxxx.bsky.social, midra.jp',
  //     default: '',
  //   },
  //   /** Bluesky パスワード */
  //   bluesky_password: {
  //     type: 'password',
  //     label: 'Bluesky アプリパスワード',
  //     description: `
  // 1. Blueskyの設定 > アプリパスワード > アプリパスワードを追加
  // 2. 名前に「Annict Share Records」と入力し、アプリパスワードを作成
  // 3. 表示されたアプリパスワードをこの欄に入力
  //     `.trim(),
  //     default: '',
  //   },

  divider_4: { type: 'divider' },

  /** 視聴ステータス テンプレート */
  watch_status_template: {
    type: 'textarea',
    label: '視聴ステータス テンプレート (Mustache記法)',
    description: `
[変数]
user: ユーザ (GET /v1/me)
→ https://developers.annict.com/docs/rest-api/v1/users#フィールド-1

work: 作品 (GET /v1/works)
→ https://developers.annict.com/docs/rest-api/v1/works#フィールド

status.id: wanna_watch, watching, watched, on_hold, stop_watching
status.text: 見たい, 見てる, 見た, 一時中断, 視聴中止

[例]
作品URL
→ https://annict.com/works/{{work.id}}

各視聴ステータスのURL
→ https://annict.com/@{{user.username}}/{{status.id}}

[初期値]
アニメ「[{{work.title}}](https://annict.com/works/{{work.id}})」の視聴ステータスを「{{status.text}}」にしました #Annict
    `.trim(),
    default:
      'アニメ「[{{work.title}}](https://annict.com/works/{{work.id}})」の視聴ステータスを「{{status.text}}」にしました #Annict',
  },
  /** エピソード テンプレート */
  episode_record_template: {
    type: 'textarea',
    label: 'エピソード テンプレート (Mustache記法)',
    description: `
[変数]
user: ユーザ | GET /v1/me
→ https://developers.annict.com/docs/rest-api/v1/users#フィールド-1

work: 作品 | GET /v1/works
→ https://developers.annict.com/docs/rest-api/v1/works#フィールド

episode: エピソード | GET /v1/episodes
→ https://developers.annict.com/docs/rest-api/v1/episodes#フィールド

record.comment: 感想

[例]
エピソードのURL
→ https://annict.com/works/{{work.id}}/episodes/{{episode.id}}

[初期値]
{{work.title}} [{{episode.number_text}}{{#episode.title}} {{episode.title}}{{/episode.title}}](https://annict.com/works/{{work.id}}/episodes/{{episode.id}}) を見ました{{#work.twitter_hashtag}} #{{work.twitter_hashtag}}{{/work.twitter_hashtag}} #Annict
    `.trim(),
    default:
      '{{work.title}} [{{episode.number_text}}{{#episode.title}} {{episode.title}}{{/episode.title}}](https://annict.com/works/{{work.id}}/episodes/{{episode.id}}) を見ました{{#work.twitter_hashtag}} #{{work.twitter_hashtag}}{{/work.twitter_hashtag}} #Annict',
  },
}

// {{work.title}} {{episode.number_text}}{{#episode.title}} {{episode.title}}{{/episode.title}} を見ました https://annict.com/works/{{work.id}}/episodes/{{episode.id}}{{#work.twitter_hashtag}} #{{work.twitter_hashtag}}{{/work.twitter_hashtag}} #Annict

/*
{{#record.comment}}
{{work.title}} ?[{{episode.number_text}}{{#episode.title}} {{episode.title}}{{/episode.title}}](https://annict.com/works/{{work.id}}/episodes/{{episode.id}}) の感想

{{record.comment}}

{{#work.twitter_hashtag}}#{{work.twitter_hashtag}}{{/work.twitter_hashtag}} #Annict
{{/record.comment}}
{{^record.comment}}
{{work.title}} ?[{{episode.number_text}}{{#episode.title}} {{episode.title}}{{/episode.title}}](https://annict.com/works/{{work.id}}/episodes/{{episode.id}}) を見ました {{#work.twitter_hashtag}}#{{work.twitter_hashtag}}{{/work.twitter_hashtag}} #Annict
{{/record.comment}}
*/
