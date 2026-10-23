/* Filter predicates, ported from the original (lines 964-969). */
import type { Filters, Json } from './types'
import type { Lookups } from './lookups'

export const EMPTY_FILTERS: Filters = { sku: '', persona: '', province: '', area: '' }

export const activeFilters = (f: Filters) =>
  (Object.entries(f) as [keyof Filters, string][]).filter(([, v]) => v).map(([k, v]) => ({ k, v }))

export function matchIns(f: Filters, i: Json): boolean {
  if (f.area && i.decision_area !== f.area) return false
  if (f.sku && !(i.affected?.skus || []).includes(f.sku)) return false
  if (f.persona && !(i.affected?.personas || []).includes(f.persona)) return false
  if (f.province && !(i.affected?.provinces || []).includes(f.province)) return false
  return true
}

export function matchSig(f: Filters, L: Lookups, s: Json): boolean {
  const x = L.sig(s.rank) || s
  if (f.area && x.decision_area && x.decision_area !== f.area) return false
  if (f.sku && !(x.skus || []).includes(f.sku)) return false
  if (f.persona && !(x.personas || []).includes(f.persona)) return false
  if (f.province && (x.provinces || []).length && !(x.provinces || []).includes(f.province)) return false
  return true
}

export function matchPost(f: Filters, p: Json): boolean {
  if (f.sku && !(p.skus || []).includes(f.sku)) return false
  if (f.province && p.province && p.province !== f.province) return false
  if (f.province && !p.province) return false
  return true
}
