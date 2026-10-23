/* Brand loading, ported from boot()/loadBrand() in the original (lines 893-930). */
import type { BrandData, BrandEntry, Json, Manifest, Post, Signal } from './types'

const getJson = (url: string) => fetch(url).then((r) => r.json())

export async function fetchBrandIndex(): Promise<{ brands: BrandEntry[]; dashboardUrl: string }> {
  try {
    const idx = await getJson('/brands/index.json')
    return { brands: idx.brands || [], dashboardUrl: idx.dashboard_url || location.href.split('#')[0] }
  } catch {
    return { brands: [], dashboardUrl: location.href.split('#')[0] }
  }
}

export async function loadBrand(b: BrandEntry): Promise<BrandData> {
  let data: Json
  let sigs: Json[] = []
  let postsTxt = ''
  let manifest: Manifest = {}

  if (b.inline) {
    data = b.inline.data
    sigs = b.inline.signals || []
    postsTxt = b.inline.posts || ''
    manifest = b.inline.manifest || {}
  } else {
    const base = '/' + b.folder
    manifest = await getJson(`${base}/manifest.json`)
    const f = manifest.files || {}
    ;[data, sigs, postsTxt] = await Promise.all([
      getJson(`${base}/${f.data || 'data.json'}`),
      f.signals ? getJson(`${base}/${f.signals}`).then((j) => j.signals || j).catch(() => []) : [],
      f.posts ? fetch(`${base}/${f.posts}`).then((r) => r.text()).catch(() => '') : '',
    ])
  }

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

  return { brand: Object.assign({}, b, manifest), D: data, SIG, SIGID, POSTS, POSTID }
}
