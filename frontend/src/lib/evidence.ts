/* Evidence helpers over the loaded brand (original lines 982-986). */
import type { Lookups } from './lookups'
import type { BrandData, Json, Post } from './types'

export const allPosts = (b: BrandData): Post[] => Object.values(b.POSTS)

export function postsInWeek(b: BrandData, we: string): Post[] {
  const end = new Date(we + 'T23:59:59')
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)
  return allPosts(b).filter((p) => {
    const d = new Date(p.date)
    return d >= start && d <= end
  })
}

export const sigsWhere = (b: BrandData, fn: (s: Json) => boolean): number[] =>
  Object.values(b.SIG).filter((s) => s.rank != null && fn(s)).map((s) => s.rank)

export function postsOfSignals(L: Lookups, ranks: number[]): Post[] {
  const seen = new Set<string>()
  const out: Post[] = []
  ranks.forEach((r) => {
    const s = L.sig(r)
    ;(Array.isArray(s?.evidence_posts) ? s!.evidence_posts : []).forEach((p: Json) => {
      if (p.url && !seen.has(p.url)) {
        seen.add(p.url)
        out.push(L.resolvePost(p))
      }
    })
  })
  return out
}

export const srcsOfType = (b: BrandData, type: string): string[] =>
  (b.D.sources || []).filter((s: Json) => s.type === type).map((s: Json) => s.id)
