import {
  looksLikeBatch, hitsExclusion, buildMagnet, parseSize, pickTag, pickItems,
  httpGet, checkFeed, buildQueries, searchContext, finalize, collectFeed,
  withEpisodeCandidates, withShowFacts, nativeKeys
} from './lib/shared.js'

const SOURCE_DEFAULT = 'medium'

const SUKEBEI_BASE = 'https://sukebei.nyaa.si'
// Sukebei categories: 1_0 Art (all), 1_1 Art - Anime, 1_2 Doujinshi,
// 1_3 Games, 1_4 Manga, 1_5 Pictures, 2_0 Real Life. Only 1_1 holds video
// anime, the rest would only ever be noise in a video picker.
const ANIME_CATEGORY = '1_1'

const RETRY_DELAYS = [1200, 3000, 6000]

async function rssSearch (query) {
  const url = SUKEBEI_BASE + '/?page=rss&q=' + encodeURIComponent(query) +
    '&c=' + ANIME_CATEGORY + '&s=id&o=desc'
  let res
  try {
    res = await httpGet(url)
  } catch (err) {
    throw new Error('Cannot reach sukebei.nyaa.si. Check your internet connection or try again later.')
  }
  if (res.status === 429) {
    const err = new Error('429')
    err.rateLimited = true
    const ra = parseInt(res.headers && res.headers.get ? res.headers.get('retry-after') : '', 10)
    if (Number.isInteger(ra) && ra > 0 && ra <= 60) err.retryAfter = ra * 1000
    throw err
  }
  if (!res.ok) {
    throw new Error('Sukebei returned HTTP ' + res.status + '. The site may be down or blocked on your network.')
  }
  const text = await res.text()
  if (!text.includes('<rss') && !text.includes('<item>')) {
    throw new Error('Sukebei returned an unexpected response. The site layout may have changed.')
  }
  return pickItems(text)
}

async function rssSearchWithRetry (query) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await rssSearch(query)
    } catch (err) {
      if (!err.rateLimited || attempt >= RETRY_DELAYS.length) {
        if (err.rateLimited) {
          const fatal = new Error('Sukebei is rate limiting requests. Wait a moment and try again.')
          fatal.rateLimited = true
          throw fatal
        }
        throw err
      }
      const base = err.retryAfter != null ? err.retryAfter : RETRY_DELAYS[attempt]
      await new Promise(r => setTimeout(r, base + Math.floor(Math.random() * 400)))
    }
  }
}

function itemToResult (raw, opts) {
  const title = pickTag(raw, 'title')
  const hash = pickTag(raw, 'nyaa:infoHash').toLowerCase()
  if (!title || !hash) return null

  if (hitsExclusion(title, opts.exclusions)) return null

  const seeders = parseInt(pickTag(raw, 'nyaa:seeders'), 10) || 0
  const leechers = parseInt(pickTag(raw, 'nyaa:leechers'), 10) || 0
  const downloads = parseInt(pickTag(raw, 'nyaa:downloads'), 10) || 0
  const size = parseSize(pickTag(raw, 'nyaa:size'))
  const pubDate = pickTag(raw, 'pubDate')
  const parsed = pubDate ? new Date(pubDate) : new Date()
  const date = Number.isFinite(parsed.getTime()) ? parsed : new Date(0)
  const trusted = /^yes$/i.test(pickTag(raw, 'nyaa:trusted'))
  const remake = /^yes$/i.test(pickTag(raw, 'nyaa:remake'))

  return {
    title,
    link: buildMagnet(hash, title),
    hash,
    seeders,
    leechers,
    downloads,
    size,
    date,
    _trusted: trusted,
    _remake: remake,
    accuracy: 'medium',
    type: opts.batch ? 'batch' : undefined
  }
}

// Latin titles find the fansubbed and English releases. Most raws on sukebei
// are named in Japanese only, which no Latin query reaches, so the show's
// native title (its longest kana/kanji run) is searched as well.
function sukebeiQueries (query, opts) {
  const queries = buildQueries(query.titles, {
    limit: 2,
    episode: opts.episode,
    anilistId: query.anilistId,
    episodeCandidates: query.episodeCandidates
  })
  const native = [...nativeKeys(query.titles)][0]
  if (native && !queries.bases.includes(native)) queries.bases.push(native)
  return queries
}

async function runSearch (query, opts) {
  if (!query.titles || !query.titles.length) return []

  const mode = opts.batch ? 'batch' : (opts.movie ? 'movie' : 'single')
  const ctx = searchContext(query, mode)
  const shaped = await collectFeed(
    sukebeiQueries(query, opts),
    rssSearchWithRetry,
    raw => itemToResult(raw, { exclusions: ctx.exclusions, batch: opts.batch }),
    ctx,
    SOURCE_DEFAULT
  )
  return finalize(shaped, ctx)
}

export default new class Sukebei {
  async single (query) {
    // 1-episode entries on AniList are movies or single-episode OVAs. Release
    // filenames for these rarely carry an episode marker, so applying the
    // episode filter would drop every real release. Treat them as movie mode.
    if (query.episodeCount === 1) return runSearch(await withShowFacts(query), { movie: true })
    return runSearch(await withEpisodeCandidates(query), { episode: query.episode })
  }

  async batch (query) {
    const results = await runSearch(query, { batch: true })
    return results
      .filter(r => looksLikeBatch(r.title))
      .map(r => ({ ...r, type: 'batch', accuracy: 'low' }))
  }

  async movie (query) {
    return runSearch(query, { movie: true })
  }

  async test () {
    return checkFeed(SUKEBEI_BASE + '/?page=rss&c=' + ANIME_CATEGORY, 'sukebei.nyaa.si')
  }
}()
