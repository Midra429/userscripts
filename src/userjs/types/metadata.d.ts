import type { LanguageCode } from './locales'

type LocalizedType<T extends string | number | boolean> =
  | T
  | ({ $: T } & ({ [locale in LanguageCode]?: T } | { [locale in string]: T }))

type UserScriptGmFunctions =
  | 'addElement'
  | 'addStyle'
  | 'download'
  | 'getResourceText'
  | 'getResourceURL'
  | 'info'
  | 'log'
  | 'notification'
  | 'openInTab'
  | 'registerMenuCommand'
  | 'unregisterMenuCommand'
  | 'setClipboard'
  | 'getTab'
  | 'saveTab'
  | 'getTabs'
  | 'setValue'
  | 'getValue'
  | 'deleteValue'
  | 'listValues'
  | 'setValues'
  | 'getValues'
  | 'deleteValues'
  | 'addValueChangeListener'
  | 'removeValueChangeListener'
  | 'xmlhttpRequest'
  | 'webRequest'
  | 'cookie'
  | 'audio'

type UserScriptGrant =
  | 'unsafeWindow'
  | `GM_${UserScriptGmFunctions}`
  | `GM.${UserScriptGmFunctions}`
  | 'window.onurlchange'
  | 'window.close'
  | 'window.focus'

type UserScriptCompatibleBrowser =
  | 'firefox'
  | 'chrome'
  | 'opera'
  | 'safari'
  | 'edge'
  | 'brave'

type UserScriptCompatible = {
  [browser in UserScriptCompatibleBrowser]?: true | string
}

type UserScriptAntifeatureType =
  | 'ads'
  | 'membership'
  | 'miner'
  | 'payment'
  | 'referral-link'
  | 'tracking'

type UserScriptAntifeature = {
  [type in UserScriptAntifeatureType]?: LocalizedType<true | string>
}

type UserScriptResource = {
  [tag: string]: string
}

type UserScriptRunAt =
  | 'document-start'
  | 'document-body'
  | 'document-end'
  | 'document-idle'
  | 'context-menu'

type UserScriptRunIn =
  | 'normal-tabs'
  | 'incognito-tabs'
  | `container-id-${number}`

type UserScriptSandbox =
  | 'MAIN_WORLD'
  | 'ISOLATED_WORLD'
  | 'USERSCRIPT_WORLD'
  | 'raw'
  | 'JavaScript'
  | 'DOM'

declare global {
  interface UserScriptMetadata {
    /**
     * スクリプトの名前。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=name#meta:name|Tampermonkey}
     */
    name: LocalizedType<string>

    /**
     * スクリプトの簡潔な説明。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=description#meta:description|Tampermonkey}
     */
    description: LocalizedType<string>

    /**
     * スクリプトの名前空間。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=name#meta:namespace|Tampermonkey}
     */
    namespace: string

    /**
     * スクリプトのバージョン。更新チェックに使用され、更新するたびに増加させる必要があります。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=version#meta:version|Tampermonkey}
     */
    version: string

    /**
     * スクリプトの作成者。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=author#meta:author|Tampermonkey}
     */
    author?: string

    /**
     * スクリプトエディタのヘッダーに表示される著作権表記。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=name#meta:copyright|Tampermonkey}
     */
    copyright?: string

    /**
     * スクリプトのライセンス。Greasy Forkで他のユーザーが利用可能になります。
     * @see {@link https://greasyfork.org/help/meta-keys#meta-license|Greasy Fork}
     */
    license?: string

    /**
     * 作成者のホームページ。オプションページからスクリプト名でリンクされます。`@namespace` が `http://` で始まる場合もこれが使用されます。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=homepage#meta:homepage|Tampermonkey}
     */
    homepage?: string

    /**
     * ユーザーが問題報告やサポートを受けられるURL。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=update_url#meta:supportURL|Tampermonkey}
     */
    supportURL?: string

    /**
     * 作成者への寄付ページのURL。
     * @see {@link https://greasyfork.org/help/meta-keys#meta-contributionURL|Greasy Fork}
     */
    contributionURL?: string

    /**
     * 推奨寄付金額。`contributionURL` と組み合わせて使用されます。
     * @see {@link https://greasyfork.org/help/meta-keys#meta-contributionAmount|Greasy Fork}
     */
    contributionAmount?: string

    /**
     * スクリプトのアイコン（低解像度）。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=icon#meta:icon|Tampermonkey}
     */
    icon?: string

    /**
     * スクリプトのアイコン（64x64 ピクセル）。`@icon` が指定されている場合、オプションページのいくつかの場所でスケーリングされます。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=icon#meta:icon64|Tampermonkey}
     */
    icon64?: string

    /**
     * スクリプトのタグ。システムのタグリストに含まれている場合、スクリプトリストに表示されます。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=tag#meta:tag|Tampermonkey}
     */
    tag?: string[]

    /**
     * スクリプトが互換性のあるブラウザを指定します。
     * @see {@link https://greasyfork.org/help/meta-keys#meta-compatible|Greasy Fork}
     */
    compatible?: UserScriptCompatible

    /**
     * スクリプトが互換性のないブラウザを指定します。
     * @see {@link https://greasyfork.org/help/meta-keys#meta-incompatible|Greasy Fork}
     */
    incompatible?: UserScriptCompatible

    /**
     * スクリプトの問題や機能を明示できるタグ（広告、マイナー、有料機能など）。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=antifeature#meta:antifeature|Tampermonkey}
     * @see {@link https://greasyfork.org/help/antifeatures|Greasy Fork}
     */
    antifeature?: UserScriptAntifeature

    /**
     * スクリプトを実行するページを指定します。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=include#meta:include|Tampermonkey}
     */
    include?: string[]

    /**
     * スクリプトを実行するWebページを `@include` より詳細に指定します。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=include#meta:match|Tampermonkey}
     */
    match?: string[]

    /**
     * `@include` または `@match` で指定されていても、特定のURLを除外します。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=include#meta:exclude|Tampermonkey}
     */
    exclude?: string[]

    /**
     * スクリプトが注入される時点を指定します。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=run_at#meta:run_at|Tampermonkey}
     */
    'run-at'?: UserScriptRunAt

    /**
     * スクリプトが注入されるブラウザコンテキストのタイプを指定します。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=run_in#meta:run_in|Tampermonkey}
     */
    'run-in'?: UserScriptRunIn

    /**
     * true の場合、スクリプトはメインページで実行され、iframeでは実行されません。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=noframes#meta:noframes|Tampermonkey}
     */
    noframes?: boolean

    /**
     * ユーザースクリプトの実行環境（サンドボックス）を指定します。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=sandbox#meta:sandbox|Tampermonkey}
     */
    sandbox?: UserScriptSandbox

    /**
     * スクリプト実行前にロードして実行する JavaScript ファイル。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=externals#meta:require|Tampermonkey}
     */
    require?: string[]

    /**
     * スクリプトから `GM_getResourceURL` と `GM_getResourceText` でアクセスできるリソースを指定します。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=externals#meta:resource|Tampermonkey}
     */
    resource?: UserScriptResource

    /**
     * スクリプトに付与する権限。`GM_*` 関数、`unsafeWindow` など。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=grant#meta:grant|Tampermonkey}
     */
    grant?: UserScriptGrant[]

    /**
     * `GM_xmlhttpRequest` でアクセス可能なドメインを指定します。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=connect#meta:connect|Tampermonkey}
     */
    connect?: string[]

    /**
     * ユーザースクリプトの更新チェックURL。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=update_url#meta:updateURL|Tampermonkey}
     */
    updateURL?: string

    /**
     * 更新が検出された際にスクリプトをダウンロードするURL。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=update_url#meta:downloadURL|Tampermonkey}
     */
    downloadURL?: string

    /**
     * `true` の場合、ユーザースクリプトをラッパーやサンドボックスなしでページに注入します。
     * @see {@link https://www.tampermonkey.net/documentation.php?q=unwrap#meta:unwrap|Tampermonkey}
     */
    unwrap?: boolean
  }

  type UserScriptMetadataKey = keyof UserScriptMetadata
}
