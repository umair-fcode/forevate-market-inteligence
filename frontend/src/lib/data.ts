/* Brand loading, ported from boot()/loadBrand() in the original (lines 893-930).
   The build ships one brand, in the fixed folder /brand/. */
import type { BrandData, Json, Manifest, Post, Signal } from './types'

const BRAND_DIR = '/brand'
const getJson = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`Could not load ${url} (${r.status})`)
  return r.json()
})

export async function loadBrand(): Promise<BrandData> {
  const manifest: Manifest = await getJson(`${BRAND_DIR}/manifest.json`)
  const f = manifest.files || {}
  const [data, sigs, postsTxt]: [Json, Json[], string] = await Promise.all([
    getJson(`${BRAND_DIR}/${f.data || 'data.json'}`),
    f.signals ? getJson(`${BRAND_DIR}/${f.signals}`).then((j) => j.signals || j).catch(() => []) : [],
    f.posts ? fetch(`${BRAND_DIR}/${f.posts}`).then((r) => r.text()).catch(() => '') : '',
  ])

  const SIG: BrandData['SIG'] = {}
  const SIGID: BrandData['SIGID'] = {}
  const POSTS: Record<string, Post> = {}
  const POSTID: Record<string, Post> = {}

  ;(data.signal_index || []).forEach((s: Signal) => {
    SIG[s.rank] = { ...s }
    SIGID[s.signal_id!] = SIG[s.rank]
  })
  ;(sigs || []).forEach((s: Signal) => {
    SIG[s.rank] = Object.assign(SIG[s.rank] || {}, s, { full: true })
    SIGID[(s.id || s.signal_id)!] = SIG[s.rank]
  })
  postsTxt.split('\n').forEach((l) => {
    l = l.trim()
    if (!l) return
    try {
      const p = JSON.parse(l) as Post
      POSTS[p.url] = p
      if (p.id) POSTID[p.id] = p
    } catch {
      /* skip malformed line */
    }
  })

  const name = manifest.name || data.global?.brand || data.settings?.brand?.name || 'Brand'
  return { brand: { ...manifest, id: manifest.id || 'brand', name }, D: data, SIG, SIGID, POSTS, POSTID }
}
