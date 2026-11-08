// Extra search strings for shows whose releases are named after something none
// of their AniList titles trim to. Keyed by AniList ID.
// Example: 12345: ['some alternate release name']
export const TITLE_ALIASES = {}

export function aliasTitles (anilistId) {
  const n = Number(anilistId)
  if (!Number.isInteger(n)) return []
  const list = TITLE_ALIASES[n]
  return Array.isArray(list) ? list.slice() : []
}
