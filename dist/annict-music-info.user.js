// ==UserScript==
// @name        Annict Music Info
// @description Annictの作品ページに関連曲の情報を追加するスクリプト
// @namespace   https://midra.me/
// @version     1.1.0
// @author      Midra <me@midra.me> (https://github.com/Midra429)
// @license     MIT
// @icon        https://annict.com/favicon.ico
// @match       https://annict.com/*
// @run-at      document-start
// @noframes
// @grant       GM.info
// @grant       GM.setValue
// @grant       GM.getValue
// @grant       GM.xmlHttpRequest
// @connect     cal.syoboi.jp
// @updateURL   https://raw.githubusercontent.com/Midra429/userscripts/refs/heads/main/dist/annict-music-info.meta.js
// @downloadURL https://raw.githubusercontent.com/Midra429/userscripts/refs/heads/main/dist/annict-music-info.user.js
// ==/UserScript==
"use strict";
(function() {
	let $name = "[nco-utils]";
	let $levels = {
		verbose: true,
		info: true,
		warnings: true,
		errors: true
	};
	function setLoggerName(name) {
		$name = `[${name}]`;
	}
	const logger = {
		...console,
		debug(label, ...data) {
			if ($levels.verbose) {
				if (data.length) data.unshift(`${$name} ${label}:`);
				else {
					data.unshift($name);
					data.push(label);
				}
				console.log(...data);
			}
		},
		info(label, ...data) {
			if ($levels.info) {
				if (data.length) data.unshift(`${$name} ${label}:`);
				else {
					data.unshift($name);
					data.push(label);
				}
				console.log(...data);
			}
		},
		log(label, ...data) {
			this.info(label, ...data);
		},
		warn(label, ...data) {
			if ($levels.warnings) {
				if (data.length) data.unshift(`${$name} ${label}:`);
				else {
					data.unshift($name);
					data.push(label);
				}
				console.warn(...data);
			}
		},
		error(label, ...data) {
			if ($levels.errors) {
				if (data.length) data.unshift(`${$name} ${label}:`);
				else {
					data.unshift($name);
					data.push(label);
				}
				console.error(...data);
			}
		}
	};
	function escapeHTML(str) {
		let html = "";
		let lastIndex = 0;
		for (let i = 0; i < str.length; i++) {
			let escaped;
			switch (str.charCodeAt(i)) {
				case 34:
					escaped = "&quot;";
					break;
				case 38:
					escaped = "&amp;";
					break;
				case 39:
					escaped = "&#39;";
					break;
				case 60:
					escaped = "&lt;";
					break;
				case 62: escaped = "&gt;";
			}
			if (escaped) {
				if (lastIndex !== i) html += str.slice(lastIndex, i);
				html += escaped;
				lastIndex = i + 1;
			}
		}
		return lastIndex ? html + str.slice(lastIndex) : str;
	}
	const CACHE_TTL = 864e5;
	const SYOBOCAL_JSON_URL = "http://cal.syoboi.jp/json.php";
	const SEARCH_URLS = [
		{
			label: "Spotify",
			baseUrl: "https://open.spotify.com/search/"
		},
		{
			label: "Apple Music",
			baseUrl: "https://music.apple.com/jp/search?term="
		},
		{
			label: "YouTube Music",
			baseUrl: "https://music.youtube.com/search?q="
		},
		{
			label: "Amazon Music",
			baseUrl: "https://www.amazon.co.jp/music/player/search/"
		},
		{
			label: "LINE MUSIC",
			baseUrl: "https://music.line.me/webapp/search?query="
		}
	];
	function getSearchURL(baseUrl, data) {
		const artist = data.credits.find(([v]) => v.includes("歌"));
		const keyword = `${data.title} ${artist?.[1] ?? ""}`.trim();
		return baseUrl + encodeURIComponent(keyword);
	}
	async function main() {
		setLoggerName(GM.info.script.name);
		logger.log(`v${GM.info.script.version}`);
		const userAgent = `${GM.info.script.name}/${GM.info.script.version}`;
		document.addEventListener("turbo:load", async () => {
			if (!location.pathname.startsWith("/works/") || !location.pathname.endsWith("/info")) return;
			if (!location.pathname.match(/\d+/)?.[0]) {
				logger.error("Annictの作品IDの取得に失敗しました");
				return;
			}
			const syobocalId = document.querySelector(".card-body a[href*=\"cal.syoboi.jp/tid/\"]")?.href.split("/").at(-1);
			if (!syobocalId) {
				logger.error("しょぼいカレンダーのTIDの取得に失敗しました");
				return;
			}
			const scCacheKey = `sc:${syobocalId}`;
			const scCache = await GM.getValue(scCacheKey, null);
			let scComment = scCache?.comment;
			if (!scCache || !scComment || CACHE_TTL < Date.now() - scCache.lastModified) {
				const scJsonUrl = `${SYOBOCAL_JSON_URL}?${new URLSearchParams({
					Req: "TitleFull",
					TID: syobocalId
				})}`;
				try {
					const { response } = await GM.xmlHttpRequest({
						method: "GET",
						url: scJsonUrl,
						headers: {
							"Content-Type": "application/json",
							"User-Agent": userAgent
						},
						responseType: "json"
					});
					const { Titles: { [syobocalId]: { Comment: comment } } } = response;
					scComment = comment;
					await GM.setValue(scCacheKey, {
						comment,
						lastModified: Date.now()
					});
				} catch (err) {
					logger.error("しょぼいカレンダーの作品情報の取得に失敗しました", err);
					return;
				}
			} else logger.log("scCache", scCache);
			const sections = scComment.split(/(?:\r\n|\r|\n)+(?=^\*[^\*])/m);
			const songs = [];
			for (const section of sections) {
				const [header, ...rows] = section.split(/(?:\r\n|\r|\n)+/);
				const headerMatched = header.match(/^\*((?:(?:オープニング|エンディング)テーマ|(?:挿入|主題)歌)\d*)「(.+)」/);
				if (!headerMatched) continue;
				const artists = [];
				const others = [];
				for (const row of rows) {
					const rowMatched = row.match(/^:([^:]+):(.+)$/);
					if (!rowMatched) continue;
					if (rowMatched[1].includes("歌")) artists.push([rowMatched[1], rowMatched[2]]);
					else others.push([rowMatched[1], rowMatched[2]]);
				}
				songs.push({
					type: headerMatched[1],
					title: headerMatched[2],
					credits: [...artists, ...others]
				});
			}
			logger.log("songs", songs);
			if (!songs.length) return;
			const content = document.querySelector(".l-default__main .l-default__content");
			if (!content) return;
			const html = songs.flatMap((song) => [
				"<div class=\"container mt-5\">",
				`<h2 class="fw-bold h3 mb-3">${escapeHTML(song.type)}</h2>`,
				"</div>",
				"<div class=\"container u-container-flat\">",
				"<div class=\"card u-card-flat\">",
				"<div class=\"card-body\">",
				"<div class=\"g-3 row\">",
				"<div class=\"col-12\">",
				"<div class=\"g-3 row\">",
				"<div class=\"col-4 text-end\">タイトル</div>",
				`<div class="col-8 fw-bold">${escapeHTML(song.title)}</div>`,
				"</div>",
				"</div>",
				...song.credits.flatMap(([head, data]) => [
					"<div class=\"col-12\">",
					"<div class=\"g-3 row\">",
					`<div class="col-4 text-end">${escapeHTML(head)}</div>`,
					`<div class="col-8">${escapeHTML(data)}</div>`,
					"</div>",
					"</div>"
				]),
				"<div class=\"col-12\">",
				"<div class=\"g-3 row\">",
				"<div class=\"col-4 text-end\">検索</div>",
				"<div class=\"col-8\">",
				SEARCH_URLS.map(({ label, baseUrl }) => [
					`<a href="${getSearchURL(baseUrl, song)}" target="_blank" rel="noreferrer" style="white-space: nowrap;">`,
					label,
					"</a>"
				].join("")).join("<span>&ensp;/&ensp;</span>"),
				"</div>",
				"</div>",
				"</div>",
				"</div>",
				"<div class=\"text-end text-muted u-very-small\">",
				"引用元: しょぼいカレンダー",
				"</div>",
				"</div>",
				"</div>",
				"</div>"
			]).join("");
			content.insertAdjacentHTML("beforeend", html);
		});
	}
	main();
})();
