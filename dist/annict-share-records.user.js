// ==UserScript==
// @name        Annict Share Records
// @description 記録をFediverse(Misskey, Mastodon, Bluesky)へ投稿
// @namespace   https://midra.me
// @version     2.5.6
// @author      Midra
// @license     MIT
// @icon        https://annict.com/favicon.ico
// @match       https://*.annict.com/*
// @match       https://midra.me/empty/oauth/asr/*
// @run-at      document-end
// @noframes
// @grant       unsafeWindow
// @grant       GM.info
// @grant       GM.setValue
// @grant       GM.getValue
// @connect     annict.com
// @updateURL   https://raw.githubusercontent.com/Midra429/userscripts/refs/heads/main/dist/annict-share-records.meta.js
// @downloadURL https://raw.githubusercontent.com/Midra429/userscripts/refs/heads/main/dist/annict-share-records.user.js
// ==/UserScript==
"use strict";
(function() {
	const Annict = {
		API: {
			BASE_URL: "https://api.annict.com/",
			CLIENT_ID: "sDz7ln_BRu4_JEyJW6sLDmGPyCmgCESkUaKRxxuT_2Q",
			CLIENT_SECRET: "CUYwC_JJ6wtz0jxd9xGD4GyIo3tf1Mxd3VsreOZyBtI",
			OAUTH_REDIRECT_URI: "https://midra.me/empty/oauth/asr/annict",
			getToken: () => GM.getValue("annictToken", ""),
			oauthAuthorize() {
				const url = new URL("/oauth/authorize", Annict.API.BASE_URL);
				url.searchParams.set("client_id", Annict.API.CLIENT_ID);
				url.searchParams.set("response_type", "code");
				url.searchParams.set("redirect_uri", Annict.API.OAUTH_REDIRECT_URI);
				url.searchParams.set("scope", "read");
				window.open(url.href);
			},
			async oauthToken(code) {
				if (!code) return null;
				try {
					const url = new URL("/oauth/token", Annict.API.BASE_URL);
					url.searchParams.set("client_id", Annict.API.CLIENT_ID);
					url.searchParams.set("client_secret", Annict.API.CLIENT_SECRET);
					url.searchParams.set("grant_type", "authorization_code");
					url.searchParams.set("redirect_uri", Annict.API.OAUTH_REDIRECT_URI);
					url.searchParams.set("code", code);
					const { access_token } = await (await fetch(url, { method: "POST" })).json();
					if (typeof access_token === "string") return access_token;
				} catch (e) {
					console.error(`[${GM.info.script.name}]`, e);
				}
				return null;
			},
			async me() {
				try {
					const url = new URL("/v1/me", Annict.API.BASE_URL);
					url.searchParams.set("access_token", await Annict.API.getToken());
					return await (await fetch(url)).json();
				} catch (e) {
					console.error(`[${GM.info.script.name}]`, e);
				}
				return null;
			},
			async work(workId) {
				try {
					const url = new URL("/v1/works", Annict.API.BASE_URL);
					url.searchParams.set("filter_ids", workId.toString());
					url.searchParams.set("access_token", await Annict.API.getToken());
					const { works } = await (await fetch(url)).json();
					return works[0];
				} catch (e) {
					console.error(`[${GM.info.script.name}]`, e);
				}
				return null;
			},
			async episode(episodeId) {
				try {
					const url = new URL("/v1/episodes", Annict.API.BASE_URL);
					url.searchParams.set("filter_ids", episodeId.toString());
					url.searchParams.set("access_token", await Annict.API.getToken());
					const { episodes } = await (await fetch(url)).json();
					return episodes[0];
				} catch (e) {
					console.error(`[${GM.info.script.name}]`, e);
				}
				return null;
			}
		},
		isLoggedin: () => !!document.querySelector("a[href=\"/sign_out\"]")
	};
	var objectToString = Object.prototype.toString;
	var isArray = Array.isArray || function isArrayPolyfill(object) {
		return objectToString.call(object) === "[object Array]";
	};
	function isFunction(object) {
		return typeof object === "function";
	}
	function typeStr(obj) {
		return isArray(obj) ? "array" : typeof obj;
	}
	function escapeRegExp(string) {
		return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
	}
	function hasProperty(obj, propName) {
		return obj != null && typeof obj === "object" && propName in obj;
	}
	function primitiveHasOwnProperty(primitive, propName) {
		return primitive != null && typeof primitive !== "object" && primitive.hasOwnProperty && primitive.hasOwnProperty(propName);
	}
	var regExpTest = RegExp.prototype.test;
	function testRegExp(re, string) {
		return regExpTest.call(re, string);
	}
	var nonSpaceRe = /\S/;
	function isWhitespace(string) {
		return !testRegExp(nonSpaceRe, string);
	}
	var entityMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;",
		"/": "&#x2F;",
		"`": "&#x60;",
		"=": "&#x3D;"
	};
	function escapeHtml(string) {
		return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
			return entityMap[s];
		});
	}
	var whiteRe = /\s*/;
	var spaceRe = /\s+/;
	var equalsRe = /\s*=/;
	var curlyRe = /\s*\}/;
	var tagRe = /#|\^|\/|>|\{|&|=|!/;
	function parseTemplate(template, tags) {
		if (!template) return [];
		var lineHasNonSpace = false;
		var sections = [];
		var tokens = [];
		var spaces = [];
		var hasTag = false;
		var nonSpace = false;
		var indentation = "";
		var tagIndex = 0;
		function stripSpace() {
			if (hasTag && !nonSpace) while (spaces.length) delete tokens[spaces.pop()];
			else spaces = [];
			hasTag = false;
			nonSpace = false;
		}
		var openingTagRe, closingTagRe, closingCurlyRe;
		function compileTags(tagsToCompile) {
			if (typeof tagsToCompile === "string") tagsToCompile = tagsToCompile.split(spaceRe, 2);
			if (!isArray(tagsToCompile) || tagsToCompile.length !== 2) throw new Error("Invalid tags: " + tagsToCompile);
			openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + "\\s*");
			closingTagRe = new RegExp("\\s*" + escapeRegExp(tagsToCompile[1]));
			closingCurlyRe = new RegExp("\\s*" + escapeRegExp("}" + tagsToCompile[1]));
		}
		compileTags(tags || mustache.tags);
		var scanner = new Scanner(template);
		var start, type, value, chr, token, openSection;
		while (!scanner.eos()) {
			start = scanner.pos;
			value = scanner.scanUntil(openingTagRe);
			if (value) for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
				chr = value.charAt(i);
				if (isWhitespace(chr)) {
					spaces.push(tokens.length);
					indentation += chr;
				} else {
					nonSpace = true;
					lineHasNonSpace = true;
					indentation += " ";
				}
				tokens.push([
					"text",
					chr,
					start,
					start + 1
				]);
				start += 1;
				if (chr === "\n") {
					stripSpace();
					indentation = "";
					tagIndex = 0;
					lineHasNonSpace = false;
				}
			}
			if (!scanner.scan(openingTagRe)) break;
			hasTag = true;
			type = scanner.scan(tagRe) || "name";
			scanner.scan(whiteRe);
			if (type === "=") {
				value = scanner.scanUntil(equalsRe);
				scanner.scan(equalsRe);
				scanner.scanUntil(closingTagRe);
			} else if (type === "{") {
				value = scanner.scanUntil(closingCurlyRe);
				scanner.scan(curlyRe);
				scanner.scanUntil(closingTagRe);
				type = "&";
			} else value = scanner.scanUntil(closingTagRe);
			if (!scanner.scan(closingTagRe)) throw new Error("Unclosed tag at " + scanner.pos);
			if (type == ">") token = [
				type,
				value,
				start,
				scanner.pos,
				indentation,
				tagIndex,
				lineHasNonSpace
			];
			else token = [
				type,
				value,
				start,
				scanner.pos
			];
			tagIndex++;
			tokens.push(token);
			if (type === "#" || type === "^") sections.push(token);
			else if (type === "/") {
				openSection = sections.pop();
				if (!openSection) throw new Error("Unopened section \"" + value + "\" at " + start);
				if (openSection[1] !== value) throw new Error("Unclosed section \"" + openSection[1] + "\" at " + start);
			} else if (type === "name" || type === "{" || type === "&") nonSpace = true;
			else if (type === "=") compileTags(value);
		}
		stripSpace();
		openSection = sections.pop();
		if (openSection) throw new Error("Unclosed section \"" + openSection[1] + "\" at " + scanner.pos);
		return nestTokens(squashTokens(tokens));
	}
	function squashTokens(tokens) {
		var squashedTokens = [];
		var token, lastToken;
		for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
			token = tokens[i];
			if (token) {
				if (token[0] === "text" && lastToken && lastToken[0] === "text") {
					lastToken[1] += token[1];
					lastToken[3] = token[3];
				} else {
					squashedTokens.push(token);
					lastToken = token;
				}
			}
		}
		return squashedTokens;
	}
	function nestTokens(tokens) {
		var nestedTokens = [];
		var collector = nestedTokens;
		var sections = [];
		var token, section;
		for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
			token = tokens[i];
			switch (token[0]) {
				case "#":
				case "^":
					collector.push(token);
					sections.push(token);
					collector = token[4] = [];
					break;
				case "/":
					section = sections.pop();
					section[5] = token[2];
					collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
					break;
				default: collector.push(token);
			}
		}
		return nestedTokens;
	}
	function Scanner(string) {
		this.string = string;
		this.tail = string;
		this.pos = 0;
	}
	Scanner.prototype.eos = function eos() {
		return this.tail === "";
	};
	Scanner.prototype.scan = function scan(re) {
		var match = this.tail.match(re);
		if (!match || match.index !== 0) return "";
		var string = match[0];
		this.tail = this.tail.substring(string.length);
		this.pos += string.length;
		return string;
	};
	Scanner.prototype.scanUntil = function scanUntil(re) {
		var index = this.tail.search(re), match;
		switch (index) {
			case -1:
				match = this.tail;
				this.tail = "";
				break;
			case 0:
				match = "";
				break;
			default:
				match = this.tail.substring(0, index);
				this.tail = this.tail.substring(index);
		}
		this.pos += match.length;
		return match;
	};
	function Context(view, parentContext) {
		this.view = view;
		this.cache = { ".": this.view };
		this.parent = parentContext;
	}
	Context.prototype.push = function push(view) {
		return new Context(view, this);
	};
	Context.prototype.lookup = function lookup(name) {
		var cache = this.cache;
		var value;
		if (cache.hasOwnProperty(name)) value = cache[name];
		else {
			var context = this, intermediateValue, names, index, lookupHit = false;
			while (context) {
				if (name.indexOf(".") > 0) {
					intermediateValue = context.view;
					names = name.split(".");
					index = 0;
					while (intermediateValue != null && index < names.length) {
						if (index === names.length - 1) lookupHit = hasProperty(intermediateValue, names[index]) || primitiveHasOwnProperty(intermediateValue, names[index]);
						intermediateValue = intermediateValue[names[index++]];
					}
				} else {
					intermediateValue = context.view[name];
					lookupHit = hasProperty(context.view, name);
				}
				if (lookupHit) {
					value = intermediateValue;
					break;
				}
				context = context.parent;
			}
			cache[name] = value;
		}
		if (isFunction(value)) value = value.call(this.view);
		return value;
	};
	function Writer() {
		this.templateCache = {
			_cache: {},
			set: function set(key, value) {
				this._cache[key] = value;
			},
			get: function get(key) {
				return this._cache[key];
			},
			clear: function clear() {
				this._cache = {};
			}
		};
	}
	Writer.prototype.clearCache = function clearCache() {
		if (typeof this.templateCache !== "undefined") this.templateCache.clear();
	};
	Writer.prototype.parse = function parse(template, tags) {
		var cache = this.templateCache;
		var cacheKey = template + ":" + (tags || mustache.tags).join(":");
		var isCacheEnabled = typeof cache !== "undefined";
		var tokens = isCacheEnabled ? cache.get(cacheKey) : void 0;
		if (tokens == void 0) {
			tokens = parseTemplate(template, tags);
			isCacheEnabled && cache.set(cacheKey, tokens);
		}
		return tokens;
	};
	Writer.prototype.render = function render(template, view, partials, config) {
		var tags = this.getConfigTags(config);
		var tokens = this.parse(template, tags);
		var context = view instanceof Context ? view : new Context(view, void 0);
		return this.renderTokens(tokens, context, partials, template, config);
	};
	Writer.prototype.renderTokens = function renderTokens(tokens, context, partials, originalTemplate, config) {
		var buffer = "";
		var token, symbol, value;
		for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
			value = void 0;
			token = tokens[i];
			symbol = token[0];
			if (symbol === "#") value = this.renderSection(token, context, partials, originalTemplate, config);
			else if (symbol === "^") value = this.renderInverted(token, context, partials, originalTemplate, config);
			else if (symbol === ">") value = this.renderPartial(token, context, partials, config);
			else if (symbol === "&") value = this.unescapedValue(token, context);
			else if (symbol === "name") value = this.escapedValue(token, context, config);
			else if (symbol === "text") value = this.rawValue(token);
			if (value !== void 0) buffer += value;
		}
		return buffer;
	};
	Writer.prototype.renderSection = function renderSection(token, context, partials, originalTemplate, config) {
		var self = this;
		var buffer = "";
		var value = context.lookup(token[1]);
		function subRender(template) {
			return self.render(template, context, partials, config);
		}
		if (!value) return;
		if (isArray(value)) for (var j = 0, valueLength = value.length; j < valueLength; ++j) buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate, config);
		else if (typeof value === "object" || typeof value === "string" || typeof value === "number") buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate, config);
		else if (isFunction(value)) {
			if (typeof originalTemplate !== "string") throw new Error("Cannot use higher-order sections without the original template");
			value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);
			if (value != null) buffer += value;
		} else buffer += this.renderTokens(token[4], context, partials, originalTemplate, config);
		return buffer;
	};
	Writer.prototype.renderInverted = function renderInverted(token, context, partials, originalTemplate, config) {
		var value = context.lookup(token[1]);
		if (!value || isArray(value) && value.length === 0) return this.renderTokens(token[4], context, partials, originalTemplate, config);
	};
	Writer.prototype.indentPartial = function indentPartial(partial, indentation, lineHasNonSpace) {
		var filteredIndentation = indentation.replace(/[^ \t]/g, "");
		var partialByNl = partial.split("\n");
		for (var i = 0; i < partialByNl.length; i++) if (partialByNl[i].length && (i > 0 || !lineHasNonSpace)) partialByNl[i] = filteredIndentation + partialByNl[i];
		return partialByNl.join("\n");
	};
	Writer.prototype.renderPartial = function renderPartial(token, context, partials, config) {
		if (!partials) return;
		var tags = this.getConfigTags(config);
		var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
		if (value != null) {
			var lineHasNonSpace = token[6];
			var tagIndex = token[5];
			var indentation = token[4];
			var indentedValue = value;
			if (tagIndex == 0 && indentation) indentedValue = this.indentPartial(value, indentation, lineHasNonSpace);
			var tokens = this.parse(indentedValue, tags);
			return this.renderTokens(tokens, context, partials, indentedValue, config);
		}
	};
	Writer.prototype.unescapedValue = function unescapedValue(token, context) {
		var value = context.lookup(token[1]);
		if (value != null) return value;
	};
	Writer.prototype.escapedValue = function escapedValue(token, context, config) {
		var escape = this.getConfigEscape(config) || mustache.escape;
		var value = context.lookup(token[1]);
		if (value != null) return typeof value === "number" && escape === mustache.escape ? String(value) : escape(value);
	};
	Writer.prototype.rawValue = function rawValue(token) {
		return token[1];
	};
	Writer.prototype.getConfigTags = function getConfigTags(config) {
		if (isArray(config)) return config;
		else if (config && typeof config === "object") return config.tags;
		else return;
	};
	Writer.prototype.getConfigEscape = function getConfigEscape(config) {
		if (config && typeof config === "object" && !isArray(config)) return config.escape;
		else return;
	};
	var mustache = {
		name: "mustache.js",
		version: "4.2.0",
		tags: ["{{", "}}"],
		clearCache: void 0,
		escape: void 0,
		parse: void 0,
		render: void 0,
		Scanner: void 0,
		Context: void 0,
		Writer: void 0,
		set templateCache(cache) {
			defaultWriter.templateCache = cache;
		},
		get templateCache() {
			return defaultWriter.templateCache;
		}
	};
	var defaultWriter = new Writer();
	mustache.clearCache = function clearCache() {
		return defaultWriter.clearCache();
	};
	mustache.parse = function parse(template, tags) {
		return defaultWriter.parse(template, tags);
	};
	mustache.render = function render(template, view, partials, config) {
		if (typeof template !== "string") throw new TypeError("Invalid template! Template should be a \"string\" but \"" + typeStr(template) + "\" was given as the first argument for mustache#render(template, view, partials)");
		return defaultWriter.render(template, view, partials, config);
	};
	mustache.escape = escapeHtml;
	mustache.Scanner = Scanner;
	mustache.Context = Context;
	mustache.Writer = Writer;
	const Misskey = { API: {
		REDIRECT_URL: "https://midra.me/empty/oauth/asr/misskey",
		getToken: () => GM.getValue("misskeyToken", ""),
		async authorize() {
			const instance = Utils.getInstance(await Utils.getSetting("misskey_instance"));
			if (instance) {
				const session = crypto.randomUUID();
				const url = new URL(`/miauth/${session}`, `https://${instance}`);
				url.searchParams.set("name", "Annict Share Records");
				url.searchParams.set("icon", "https://midra.me/assets/images/midra.png");
				url.searchParams.set("callback", Misskey.API.REDIRECT_URL);
				url.searchParams.set("permission", "write:notes");
				window.open(url.href);
			}
		},
		async requestToken(session) {
			if (!session) return;
			const instance = Utils.getInstance(await Utils.getSetting("misskey_instance"));
			if (instance) try {
				const url = new URL(`/api/miauth/${session}/check`, `https://${instance}`);
				return (await (await fetch(url, { method: "POST" })).json()).token;
			} catch (e) {
				console.error(`[${GM.info.script.name}]`, e);
			}
		},
		async notesCreate(text) {
			text = text.trim();
			const instance = Utils.getInstance(await Utils.getSetting("misskey_instance"));
			const token = await Misskey.API.getToken();
			if (text && instance && token) try {
				const url = new URL("/api/notes/create", `https://${instance}`);
				return await (await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						i: token,
						text,
						visibility: await Utils.getSetting("misskey_visibility") || "home"
					})
				})).json();
			} catch (e) {
				console.error(`[${GM.info.script.name}]`, e);
			}
		}
	} };
	const SETTINGS_KEYS = [
		"post_to",
		"misskey_instance",
		"misskey_visibility",
		"mastodon_instance",
		"mastodon_visibility",
		"mastodon_token",
		"watch_status_template",
		"episode_record_template"
	];
	const SETTINGS_INIT_DATA = {
		post_to: {
			type: "select",
			label: "投稿先",
			default: "all",
			options: {
				all: "すべて (サーバー未入力を除く)",
				misskey: "Misskey",
				mastodon: "Mastodon",
				x: "X (Twitter)"
			}
		},
		divider_1: { type: "divider" },
		misskey_instance: {
			type: "text",
			label: "Misskey サーバー",
			description: "例: https://misskey.io/, submarin.online",
			default: ""
		},
		misskey_visibility: {
			type: "select",
			label: "Misskey 公開範囲",
			default: "home",
			options: {
				public: "パブリック",
				home: "ホーム",
				followers: "フォロワー"
			}
		},
		button_misskey_auth: {
			type: "button",
			label: "Misskeyで認証",
			async onClick() {
				if (!await Misskey.API.getToken() || confirm("認証済みです。\n再認証しますか？")) await Misskey.API.authorize();
			}
		},
		divider_2: { type: "divider" },
		mastodon_instance: {
			type: "text",
			label: "Mastodon サーバー",
			description: "例: https://mstdn.jp/, fedibird.com",
			default: ""
		},
		mastodon_visibility: {
			type: "select",
			label: "Mastodon 公開範囲",
			default: "unlisted",
			options: {
				public: "公開",
				unlisted: "未収載",
				private: "フォロワー限定"
			}
		},
		mastodon_token: {
			type: "password",
			label: "Mastodon アクセストークン",
			description: `
1. Mastodonの設定 > 開発 > 新規アプリ
2. アプリの名前に「Annict Share Records」と入力し、「write」か「write:statuses」にチェック
3. 「送信」をクリック
4. アプリ一覧から先程作成したアプリをクリックし、表示されているアクセストークンをこの欄に入力
    `.trim(),
			default: ""
		},
		divider_4: { type: "divider" },
		watch_status_template: {
			type: "textarea",
			label: "視聴ステータス テンプレート (Mustache記法)",
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
			default: "アニメ「[{{work.title}}](https://annict.com/works/{{work.id}})」の視聴ステータスを「{{status.text}}」にしました #Annict"
		},
		episode_record_template: {
			type: "textarea",
			label: "エピソード テンプレート (Mustache記法)",
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
			default: "{{work.title}} [{{episode.number_text}}{{#episode.title}} {{episode.title}}{{/episode.title}}](https://annict.com/works/{{work.id}}/episodes/{{episode.id}}) を見ました{{#work.twitter_hashtag}} #{{work.twitter_hashtag}}{{/work.twitter_hashtag}} #Annict"
		}
	};
	const Utils = {
		async getSetting(key) {
			return GM.getValue(`setting_${key}`, SETTINGS_INIT_DATA[key].default);
		},
		async getSettings() {
			const settings = {};
			for (const key of SETTINGS_KEYS) settings[key] = await this.getSetting(key);
			return settings;
		},
		getInstance(str) {
			str = str?.trim() ?? "";
			if (/^https?:\/\//.test(str)) try {
				return new URL(str).hostname;
			} catch {}
			else if (/[^\.]+\.[^\.]{2,}/.test(str)) return str;
		},
		filterObject(obj) {
			if (obj !== null && typeof obj === "object") {
				if (Array.isArray(obj)) {
					const ary = obj.map(this.filterObject).filter(Boolean);
					if (0 < ary.length) return ary;
					else return null;
				} else {
					const keys = Object.keys(obj);
					if (0 < keys.length) {
						for (const key of keys) obj[key] = this.filterObject(obj[key]);
						return obj;
					} else return null;
				}
			} else if (typeof obj === "number" || typeof obj === "boolean") return obj;
			else return obj || null;
		},
		mustache(...args) {
			args[1] = this.filterObject(args[1]);
			return mustache.render(args[0], args[1], args[2], { escape: (str) => str });
		}
	};
	const Mastodon = { API: { async statuses(text) {
		text = text.trim();
		const instance = Utils.getInstance(await Utils.getSetting("mastodon_instance") ?? "");
		const token = await Utils.getSetting("mastodon_token");
		if (text && instance && token) try {
			const url = new URL("/api/v1/statuses", `https://${instance}`);
			return await (await fetch(url, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					status: text,
					visibility: await Utils.getSetting("mastodon_visibility") || "unlisted"
				})
			})).json();
		} catch (e) {
			console.error(`[${GM.info.script.name}]`, e);
		}
	} } };
	var Settings = class Settings {
		static ID = "AnnictShareRecords-Settings";
		#element;
		#items = {};
		async getElement() {
			document.getElementById(Settings.ID)?.remove();
			this.#element = document.createElement("div");
			this.#element.id = Settings.ID;
			const title = document.createElement("h2");
			title.className = "fw-bold h3 mb-0 mt-3";
			title.textContent = `${GM.info.script.name} v${GM.info.script.version}`;
			this.#element.appendChild(title);
			const card = document.createElement("div");
			card.className = "card mt-3 u-card-flat";
			this.#element.appendChild(card);
			const cardBody = document.createElement("div");
			cardBody.className = "card-body";
			card.appendChild(cardBody);
			const settings = await Utils.getSettings();
			for (const key in SETTINGS_INIT_DATA) {
				const data = SETTINGS_INIT_DATA[key];
				const value = settings[key];
				const id = `${Settings.ID}-${key}`;
				const div = document.createElement("div");
				div.className = "mb-3";
				let item = null;
				let noValue = false;
				if (data.type === "text" && typeof value !== "undefined") item = this.#generate.input(id, value);
				if (data.type === "password" && typeof value !== "undefined") item = this.#generate.input(id, value, true);
				if (data.type === "textarea" && typeof value !== "undefined") item = this.#generate.textarea(id, value);
				if (data.type === "select" && data.options) item = this.#generate.select(id, Object.keys(data.options).map((val) => ({
					text: data.options?.[val] ?? val,
					value: val,
					selected: val === value
				})));
				if (data.type === "divider") {
					noValue = true;
					item = document.createElement("hr");
				}
				if (data.type === "button" && data.label && data.onClick) {
					noValue = true;
					item = this.#generate.button(data.label, async (e) => {
						await this.save();
						data.onClick(e);
					});
				}
				if (item) {
					if (!noValue) {
						this.#items[key] = item;
						if (data.label) div.appendChild(this.#generate.label(id, data.label));
						if (data.description) div.appendChild(this.#generate.description(data.description));
					}
					div.appendChild(item);
				}
				cardBody.appendChild(div);
			}
			const buttonContainer = document.createElement("div");
			buttonContainer.className = "form-submit text-center";
			buttonContainer.appendChild(this.#generate.button("保存", async () => {
				await this.save();
				alert(`[${GM.info.script.name}]\n設定を保存しました`);
				location.reload();
			}, true));
			cardBody.appendChild(buttonContainer);
			return this.#element;
		}
		async save() {
			for (const key in this.#items) {
				const item = this.#items[key];
				let value = null;
				if (item instanceof HTMLInputElement || item instanceof HTMLTextAreaElement || item instanceof HTMLSelectElement) value = item.value.trim();
				if (value != null) await GM.setValue(`setting_${key}`, value);
			}
		}
		#generate = {
			label(id, text) {
				const label = document.createElement("label");
				label.className = "form-label";
				label.htmlFor = id;
				label.textContent = text;
				return label;
			},
			input(id, value, password) {
				const input = document.createElement("input");
				input.type = password ? "password" : "text";
				input.className = "form-control";
				input.id = id;
				input.value = value ?? "";
				input.autocomplete = password ? "new-password" : "off";
				return input;
			},
			textarea(id, value) {
				const textarea = document.createElement("textarea");
				textarea.className = "form-control";
				textarea.rows = 5;
				textarea.id = id;
				textarea.value = value ?? "";
				return textarea;
			},
			select(id, options) {
				const select = document.createElement("select");
				select.className = "form-select";
				select.id = id;
				for (const data of options) select.appendChild(new Option(data.text, data.value, data.selected, data.selected));
				return select;
			},
			button(text, onclick, isPrimary) {
				const button = document.createElement("button");
				button.classList.add("btn");
				if (isPrimary) button.classList.add("btn-primary");
				else button.classList.add("btn-secondary");
				button.textContent = text;
				button.addEventListener("click", onclick);
				return button;
			},
			description(text) {
				const div = document.createElement("div");
				div.className = "mb-2 small text-muted";
				div.style.whiteSpace = "pre-wrap";
				div.textContent = text;
				return div;
			}
		};
	};
	async function main() {
		const postToFediverse = async (text) => {
			const postTo = await Utils.getSetting("post_to");
			if (postTo === "misskey" || postTo === "all") await Misskey.API.notesCreate(text);
			if (postTo === "mastodon" || postTo === "all") await Mastodon.API.statuses(text);
		};
		const initSettings = async () => {
			if (location.pathname === "/settings/options" && !document.getElementById(Settings.ID)) {
				const settingsElem = await new Settings().getElement();
				document.querySelector(".c-nav + .u-container-narrow")?.appendChild(settingsElem);
			}
		};
		if (location.href.startsWith(Annict.API.OAUTH_REDIRECT_URI)) {
			const code = new URLSearchParams(location.search).get("code");
			const token = await Annict.API.oauthToken(code);
			if (token) {
				await GM.setValue("annictToken", token);
				window.close();
			} else alert(`[${GM.info.script.name}] Annictの認証に失敗しました`);
		} else if (location.href.startsWith(Misskey.API.REDIRECT_URL)) {
			const session = new URLSearchParams(location.search).get("session");
			const token = session && await Misskey.API.requestToken(session);
			if (token) {
				await GM.setValue("misskeyToken", token);
				window.close();
			} else alert(`[${GM.info.script.name}] Misskeyの認証に失敗しました`);
		} else if (location.hostname === "annict.com") {
			if (Annict.isLoggedin() && !await Annict.API.getToken()) {
				Annict.API.oauthAuthorize();
				setTimeout(() => location.reload(), 2e3);
			} else {
				console.log(`[${GM.info.script.name}] v${GM.info.script.version}`);
				const settings = await Utils.getSettings();
				const user = await Annict.API.me();
				const getEpisodeRecordPostText = async ({ episodeId, recordId, comment }) => {
					if (!settings.episode_record_template) return null;
					const episode = await Annict.API.episode(episodeId);
					const work = episode?.work;
					if (work && episode) return Utils.mustache(settings.episode_record_template, {
						user,
						work,
						episode,
						record: {
							id: recordId,
							comment
						}
					}).trim();
					return null;
				};
				unsafeWindow.fetch = new Proxy(unsafeWindow.fetch, { apply: async function(target, thisArg, argArray) {
					const promise = Reflect.apply(target, thisArg, argArray);
					const url = argArray[0].toString();
					const matchStatusSelect = url.match(new RegExp("/api/internal/works/(\\d+)/status_select$"));
					const matchEpisodeRecord = url.endsWith("/api/internal/episode_records");
					const matchCommentedRecords = url.match(new RegExp("/api/internal/episodes/(\\d+)/commented_records$"));
					if (matchStatusSelect || matchEpisodeRecord || matchCommentedRecords) {
						let postText = null;
						const response = await promise;
						if (response.ok) {
							const { body: reqBody } = argArray[1] ?? {};
							if (matchStatusSelect && settings.watch_status_template) {
								const workId = matchStatusSelect[1];
								const status = {
									no_status: ["未選択"],
									plan_to_watch: ["見たい", "wanna_watch"],
									watching: ["見てる", "watching"],
									completed: ["見た", "watched"],
									on_hold: ["一時中断", "on_hold"],
									dropped: ["視聴中止", "stop_watching"]
								}[JSON.parse(reqBody?.toString() || "{}")["status_kind"] ?? ""];
								if (status?.[1]) {
									const work = await Annict.API.work(workId);
									if (work) postText = Utils.mustache(settings.watch_status_template, {
										user,
										work,
										status: {
											id: status[1],
											text: status[0]
										}
									}).trim();
								}
							}
							if (matchEpisodeRecord && settings.episode_record_template) {
								const episodeId = JSON.parse(reqBody?.toString() || "{}")["episode_id"];
								const recordId = (await response.clone().json())["record_id"];
								if (episodeId) postText = await getEpisodeRecordPostText({
									episodeId,
									recordId
								});
							}
							if (matchCommentedRecords && settings.episode_record_template) {
								const episodeId = matchCommentedRecords[1];
								if (reqBody instanceof URLSearchParams) {
									const comment = reqBody.get("forms_episode_record_form[comment]")?.trim();
									postText = await getEpisodeRecordPostText({
										episodeId,
										comment
									});
								}
							}
						}
						if (postText) await postToFediverse(postText);
						return response;
					}
					return promise;
				} });
				await initSettings();
				document.addEventListener("turbo:load", initSettings);
			}
		}
	}
	main();
})();
