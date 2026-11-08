// Relevance test harness. Runs adult anime with realistic AniList title sets
// (romaji, english, native, synonyms) against the live sukebei source.
// Asserts: non-zero results AND zero off-show contamination. Run: npm test
//
// Network test (hits sukebei.nyaa.si). Exits non-zero on any failure.
// If your network resets Node's connection to sukebei, run with SUKEBEI_CURL=1.

import './curl-fetch.mjs'
import sukebei from '../dist/sukebei.js'

const CASES = [
  { name: 'Harem Camp!', ep: 8, want: /harem camp|ハーレムきゃんぷ/i,
    titles: ['Harem Camp!', 'Harem Camp!', 'ハーレムきゃんぷっ！'] },
  { name: 'Mujikaku na Osananajimi', ep: 3, want: /mujikaku|無自覚な幼馴染/i,
    titles: ['Mujikaku na Osananajimi to Kyoumi Honi de Yatte Mitara THE ANIMATION', '無自覚な幼馴染と興味本位でヤってみたら THE ANIMATION'] },
  { name: 'Sister Breeder', ep: 5, want: /sister breeder|シスターブリーダー/i,
    titles: ['Sister Breeder', 'シスターブリーダー'] },
  { name: 'Overflow', ep: 1, want: /overflow|おーばーふろぉ/i,
    titles: ['Overflow', 'Overflow', 'おーばーふろぉ', '오버플로우', 'Overflow: Desbordándose', 'Accident Dans Le Bain'] },
  { name: 'Bible Black', ep: 1, want: /bible black|バイブルブラック/i,
    titles: ['Bible Black', 'バイブルブラック', 'Bible Black: Night of the Walpulgiss'] },
  { name: 'Imaizumin-chi', ep: 1, want: /imaizumi|今泉ん家/i,
    titles: ['Imaizumin-chi wa Douyara Gal no Tamariba ni Natteru Rashii', "Imaizumi's house seems to be a gathering place for gals", '今泉ん家はどうやらギャルの溜まり場になってるらしい', 'Imaizumi Brings All The Gyarus To His House'] }
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

let failures = 0
for (const c of CASES) {
  let r = []
  try {
    r = await sukebei.single({ titles: c.titles, episode: c.ep, resolution: '1080', exclusions: [] })
  } catch (e) {
    console.log('FAIL  ' + c.name + '  threw: ' + e.message)
    failures++
    await sleep(500)
    continue
  }
  const garbage = r.filter(x => !c.want.test(x.title))
  const ok = r.length > 0 && garbage.length === 0
  if (!ok) failures++
  console.log((ok ? 'PASS  ' : 'FAIL  ') + c.name.padEnd(26) + r.length + ' results, ' + garbage.length + ' off-show'
    + (r.length === 0 ? '  <-- ZERO RESULTS' : '')
    + (garbage.length ? '  <-- e.g. ' + garbage[0].title.slice(0, 60) : ''))
  for (const x of r.slice(0, 3)) console.log('        ' + x.accuracy.padEnd(7) + x.title.slice(0, 100))
  await sleep(500)
}

const ok = await sukebei.test().then(() => true, e => { console.log('FAIL  test(): ' + e.message); return false })
if (!ok) failures++

console.log('\n' + (CASES.length + 1 - failures) + '/' + (CASES.length + 1) + ' passed')
process.exit(failures ? 1 : 0)
