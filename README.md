# sukebeitorrent

**Sukebei torrent source for Hayase.** Searches [sukebei.nyaa.si](https://sukebei.nyaa.si) (category *Art - Anime*) directly for adult anime releases. Built on the matching engine of [anitorrent](https://github.com/anh9000/anitorrent), adapted for how sukebei releases are named.

> 18+ only. The extension is marked `nsfw: true`; Hayase only shows it when adult content is enabled.

## Install in Hayase

Settings > Extensions > Repositories > paste > Import Extensions:

```
https://raw.githubusercontent.com/Luna0005/sukebeitorrent/main/hayase/index.json
```

Hayase polls the manifest on every launch, so new versions arrive automatically.

### Shiru (untested)

```
https://raw.githubusercontent.com/Luna0005/sukebeitorrent/main/shiru/index.json
```

## What is different from the Nyaa source

Sukebei has the same RSS feed as nyaa.si, so the fetch, retry, rate-limit and result handling are the same. The matching has three additions for sukebei's naming:

```text
┌──────────────────────────┬───────────────────────────────────────────────┐
│ ADDITION                 │ WHY                                           │
├──────────────────────────┼───────────────────────────────────────────────┤
│ Japanese title search    │ most raws are named in Japanese only, e.g.    │
│                          │ "[ピンクパイナップル] 無自覚な幼馴染と… 第3巻"     │
│                          │ the native AniList title is searched and      │
│                          │ matched as well as the romaji/english ones    │
│ Japanese episode markers │ 第3話, 第3巻, 第1-2巻, ＃３, #2, Vol.5, 前編/後編 │
│                          │ are read as episode numbers / ranges          │
│ Extra stopwords          │ "THE ANIMATION", "hentai", "uncensored", "raw"│
│                          │ no longer count as show-identifying words     │
└──────────────────────────┴───────────────────────────────────────────────┘
```

Everything else (AniList prequel-chain episode offsets, season/year guards, batch detection, not-yet-aired filtering, ranking) is inherited from anitorrent's `shared.js`.

Only category `1_1` (Art - Anime) is searched. Doujinshi, games, manga, pictures and real-life categories are never queried.

## Develop

```
npm install
npm run build
npm run test:matching   # offline, no network
npm test                # live, hits sukebei.nyaa.si
```

If your network resets Node's TLS connection to sukebei but `curl` gets through, run the live test with `SUKEBEI_CURL=1 npm test`.

`src/sukebei.js` is the source, `src/lib/shared.js` the matching logic, bundled into `dist/sukebei.js` by tsup. The GitHub workflow rebuilds `dist/` on every push that touches `src/`.

## Releasing a new version

1. Change the code under `src/`.
2. Bump `version` in **both** `hayase/index.json` and `shiru/index.json`.
3. Push. CI rebuilds `dist/sukebei.js`; Hayase picks up the new version on next launch.

## License

GPL-3.0, same as anitorrent. See [LICENSE](./LICENSE).
