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

/** Build an in-browser brand from picked files (original filesToBrand, line 1136). */
export async function filesToBrand(files: File[]): Promise<BrandEntry> {
  const got: { manifest?: Manifest; posts?: string; signals?: Json; data?: Json } = {}
  for (const f of files) {
    const t = await f.text()
    if (/manifest\.json$/i.test(f.name)) got.manifest = JSON.parse(t)
    else if (/\.jsonl$/i.test(f.name)) got.posts = t
    else if (/signal/i.test(f.name)) got.signals = JSON.parse(t)
    else got.data = JSON.parse(t)
  }
  if (!got.data) throw new Error('A data.json with one key per tab is required.')
  const m = got.manifest || {}
  const name = m.name || got.data.global?.brand || got.data.settings?.brand?.name || 'New brand'
  return {
    id: 'local-' + Date.now(),
    name,
    organisation: m.organisation || got.data.settings?.brand?.distributor || '',
    market: m.market || got.data.global?.market || '',
    status: 'local',
    inline: { data: got.data, posts: got.posts || '', signals: got.signals?.signals || got.signals || [], manifest: m },
  }
}
