// Offline checks for the sukebei-specific matching: Japanese episode markers,
// native-title matching and the season/sequel guards. No network.
// Run: npm run test:matching

import {
  normalizeMatchTitle, titleHasEpisode, looksLikeBatch, classifyResult,
  searchContext, nativeKeys, matchesNative
} from '../src/lib/shared.js'

let failures = 0
const check = (label, got, want) => {
  const ok = got === want
  if (!ok) failures++
  console.log((ok ? 'PASS  ' : 'FAIL  ') + label + (ok ? '' : '  got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want)))
}

// Episode markers
check('第3巻 is ep 3', titleHasEpisode('[261030][ピンクパイナップル] 無自覚な幼馴染と興味本位でヤってみたら THE ANIMATION 第3巻【RAW】', 3), true)
check('第3巻 is not ep 2', titleHasEpisode('[261030][ピンクパイナップル] 無自覚な幼馴染と興味本位でヤってみたら THE ANIMATION 第3巻【RAW】', 2), false)
check('第2話 is ep 2', titleHasEpisode('[261030][Collaboration Works] ハーレム島へようこそ！ 第2話 ヤればデキる!？', 2), true)
check('trailing #2 is ep 2', titleHasEpisode('[荻原沙优][ピンクパイナップル]無自覚な幼馴染と興味本位でヤってみたら#2', 2), true)
check('full-width ＃３ is ep 3', titleHasEpisode('(同人アニメ)[260905][Suppai] なぜかクラスのギャル達から熱烈な求愛を受け続けているのだが＃３', 3), true)
check('mid-title #2 is not an episode', titleHasEpisode('[Doomdos] - Huge Tits BOMB #2 Beautiful Wife - S01E01 [404p OV WEB-DL]', 2), false)
check('Vol.5 is ep 5', titleHasEpisode('(同人アニメ)[261105][Peh-koi] 五等分のセフレAFTER Vol.5', 5), true)
check('[04] is ep 4', titleHasEpisode('[桜都字幕组] Mouse Cursor de Genjitsu [04][1080P][简繁内封]', 4), true)
check('S01E08 is ep 8', titleHasEpisode('[HentaiHub] Harem Camp S01E08 1080p UNCENSORED', 8), true)
check('第1-2巻 range is a batch', looksLikeBatch('[Emotion] Mujikaku - 01-02 (無自覚な幼馴染と興味本位でヤってみたら THE ANIMATION 第1-2巻) - English Softsubs'), true)
check('＃５-６ range is a batch', looksLikeBatch('[Emotion] Sister Breeder - 05-06 (OVA シスターブリーダー ＃５-６) - English Softsubs'), true)
check('第3巻 alone is not a batch', looksLikeBatch('無自覚な幼馴染と興味本位でヤってみたら THE ANIMATION 第3巻【RAW】'), false)
check('normalize is idempotent', normalizeMatchTitle(normalizeMatchTitle('foo 第3話 #4)')), normalizeMatchTitle('foo 第3話 #4)'))

// Native title matching
const mujikaku = ['Mujikaku na Osananajimi to Kyoumi Honi de Yatte Mitara THE ANIMATION', '無自覚な幼馴染と興味本位でヤってみたら THE ANIMATION']
check('native key is the kanji/kana run', [...nativeKeys(mujikaku)][0], '無自覚な幼馴染と興味本位でヤってみたら')
check('Japanese-only raw matches native', matchesNative('[荻原沙优][ピンクパイナップル]無自覚な幼馴染と興味本位でヤってみたら#2', nativeKeys(mujikaku)), true)

const ctx = (titles, ep) => searchContext({ titles, episode: ep }, 'single')
check('Japanese-only raw classifies as exact', classifyResult('[261030][ピンクパイナップル] 無自覚な幼馴染と興味本位でヤってみたら THE ANIMATION 第3巻【RAW】', ctx(mujikaku, 3)), 'A')
check('other "THE ANIMATION" OVA is rejected', classifyResult('[Emotion] Kuroinu II THE ANIMATION - 01', ctx(mujikaku, 1)), null)
check('Latin release still matches', classifyResult('[Doomdos] - Harem Camp! - S01E08 [Uncensored] [Dub] [1080p OV WEB-DL]', ctx(['Harem Camp!', 'ハーレムきゃんぷっ！'], 8)), 'A')

console.log('\n' + (failures ? failures + ' failed' : 'all passed'))
process.exit(failures ? 1 : 0)
