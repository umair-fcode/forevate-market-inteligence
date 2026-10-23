/* Lookups over the loaded brand, ported from the original dashboard (lines 932-962).
   The original read a global `state`; here they are built once per loaded brand. */
import { cap, fmt } from './format'
import type { BrandData, Json, Post, Signal } from './types'

/* Generic economic series; brand-specific labels come from D.my_market.key_number_labels. */
const KN_LABELS: Record<string, [string, string, string]> = {
  headline_inflation_pct: ['Inflation', '%', 'Economic data'],
  food_inflation_pct: ['Food inflation', '%', 'Economic data'],
  policy_rate_pct: ['Policy rate', '%', 'Economic data'],
}

const VOICE_DEFAULT: Record<string, string> = {
  organic: 'Public (organic)',
  dealer_or_brand: 'Dealers and brand pages',
  brand_or_seller: 'Brand and sellers',
  news: 'News',
  recipe_or_creator_page: 'Recipe and creator pages',
}

const norm = (s: unknown) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

export function knMetaFor(labels: Record<string, [string, string, string]> = {}) {
  return (k: string): [string, string, string] =>
    labels[k] ||
    KN_LABELS[k] || [
      cap(k.replace(/_(lkr|pct)\b/g, '').replace(/_/g, ' ')),
      /pct$/.test(k) ? '%' : '',
      'Economic data',
    ]
}

export const salesOf = (m: Json) => m.total ?? m.tonnes ?? m.units
export const knDate = (pt: Json) => pt.date || pt.month || ''

export function createLookups(b: BrandData) {
  const { D, brand } = b
  const knMeta = knMetaFor(D?.my_market?.key_number_labels)
  const brandName = (): string => D?.global?.brand || brand?.name || ''

  const money = (n: number | null | undefined) => (n == null ? '—' : (brand?.currency_prefix ?? (brand?.currency ? brand.currency + ' ' : '')) + fmt(n))
  const skuName = (id: string): string => (D.settings?.skus || []).find((s: Json) => s.id === id)?.name || id
  const BK = () => norm(brandName())
  const brandKey = (obj: Json, suffix: string): string | null => {
    if (!obj) return null
    const ks = Object.keys(obj).filter((k) => k.endsWith(suffix))
    return ks.find((k) => k.slice(0, -suffix.length) === BK()) || ks[0] || null
  }
  const brandVal = (obj: Json, suffix: string): Json => {
    const k = brandKey(obj, suffix)
    return k ? obj[k] : undefined
  }
  const compName = (key: string): string => {
    const c = (D.settings?.competitors || []).find((x: Json) => norm(x.brand).startsWith(key))
    return c ? String(c.brand).replace(/\s*\(.*\)$/, '') : key.charAt(0).toUpperCase() + key.slice(1)
  }
  const voiceLabel = (t: string): string => (brand?.voice_labels || {})[t] || VOICE_DEFAULT[t] || String(t || '').replace(/_/g, ' ')
  const authorType = (t: string): string => (brand?.post_voice_labels || {})[t] || voiceLabel(t)
  const skuShort = (id: string): string =>
    brandName() ? skuName(id).replace(new RegExp('^' + norm(brandName()).split('').join('[^a-z0-9]*') + '\\s+', 'i'), '') : skuName(id)
  const personaName = (id: string): string => (D.my_personas?.personas || []).find((p: Json) => p.id === id)?.name || id
  const insight = (id: string): Json => (D.insights?.detailed_insights || []).find((i: Json) => i.id === id)
  const source = (id: string): Json => (D.sources || []).find((s: Json) => s.id === id)
  const sig = (r: string | number): Signal | null => b.SIG[r] || b.SIGID[r] || null
  const postByUrl = (u: string): Post | null => b.POSTS[u] || null
  const resolvePost = (p: Json): Post => Object.assign({}, postByUrl(p.url) || {}, p)

  return {
    money,
    skuName,
    skuShort,
    brandKey,
    brandVal,
    compName,
    voiceLabel,
    authorType,
    personaName,
    insight,
    source,
    sig,
    postByUrl,
    resolvePost,
    unit: () => brand?.sales_unit || 'units',
    realAnchor: () => brand?.real_anchor || 'published figures',
    plain: () => !!D?._readme?.plain_language,
    meansLabel: () => `What it means for ${brandName() || 'us'}`,
    knMeta,
    knFmt: (k: string, v: number) => (knMeta(k)[1] === '%' ? v + '%' : money(v)),
  }
}

export type Lookups = ReturnType<typeof createLookups>
