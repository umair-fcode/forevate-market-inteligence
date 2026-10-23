/* App state, replacing the original global `state` object. Per-viewer conveniences persist in localStorage under 'fv.*'. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchBrandIndex, loadBrand } from '../lib/data'
import { EMPTY_FILTERS } from '../lib/filters'
import { createLookups, type Lookups } from '../lib/lookups'
import { ALL_TABS } from '../lib/tabs'
import type { BrandData, BrandEntry, Filters, Json } from '../lib/types'

export const store = {
  get<T = Json>(k: string): T | null {
    try {
      return JSON.parse(localStorage.getItem('fv.' + k) as string)
    } catch {
      return null
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem('fv.' + k, JSON.stringify(v))
    } catch {
      /* storage unavailable */
    }
  },
}

interface ViewState {
  tab: string
  sub: number
  f: Filters
  filtersOpen: boolean
  persona: string | null
  compSku: string
  marketTag: string
  openIns: string | null
  openInsights: Set<string>
  snoozed: Set<string>
  acted: Json[]
  chat: Json[]
  feedLang: string
  feedSort: string
}

const freshBrandView = (D: Json): Partial<ViewState> => ({
  persona: D?.my_personas?.personas?.[0]?.id || null,
  f: { ...EMPTY_FILTERS },
  compSku: '',
  marketTag: '',
  openIns: null,
  sub: 0,
  chat: [],
})

function initialTab(): string {
  const h = (location.hash || '').replace('#', '')
  const saved = store.get<string>('tab')
  if (ALL_TABS.some((t) => t.id === h)) return h
  if (ALL_TABS.some((t) => t.id === saved)) return saved!
  return 'insights'
}

interface Ctx extends ViewState {
  brands: BrandEntry[]
  dashboardUrl: string
  /** Loaded brand, or null while loading / when no brand is onboarded. */
  data: BrandData | null
  /** Lookups for the loaded brand (null with `data`). */
  L: Lookups | null
  booting: boolean
  loading: boolean
  error: string | null
  patch: (p: Partial<ViewState>) => void
  go: (tab: string, sub?: number, extra?: Partial<ViewState>) => void
  goInsight: (id: string) => void
  setFilter: (k: keyof Filters, v: string) => void
  clearFilters: () => void
  selectBrand: (b: BrandEntry) => Promise<void>
  addBrand: (b: BrandEntry) => Promise<void>
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<BrandEntry[]>([])
  const [dashboardUrl, setDashboardUrl] = useState('')
  const [data, setData] = useState<BrandData | null>(null)
  const [booting, setBooting] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<ViewState>(() => ({
    tab: initialTab(),
    sub: 0,
    f: { ...EMPTY_FILTERS },
    filtersOpen: false,
    persona: null,
    compSku: '',
    marketTag: '',
    openIns: null,
    openInsights: new Set(),
    snoozed: new Set(),
    acted: [],
    chat: [],
    feedLang: '',
    feedSort: 'engagement',
  }))

  const patch = useCallback((p: Partial<ViewState>) => setView((v) => ({ ...v, ...p })), [])

  const selectBrand = useCallback(async (b: BrandEntry) => {
    setLoading(true)
    setError(null)
    try {
      const loaded = await loadBrand(b)
      setData(loaded)
      setView((v) => ({ ...v, ...freshBrandView(loaded.D) }))
      store.set('brand', b.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const addBrand = useCallback(
    async (b: BrandEntry) => {
      setBrands((bs) => [...bs.filter((x) => x.id !== b.id), b])
      await selectBrand(b)
    },
    [selectBrand],
  )

  useEffect(() => {
    let alive = true
    ;(async () => {
      const idx = await fetchBrandIndex()
      if (!alive) return
      setBrands(idx.brands)
      setDashboardUrl(idx.dashboardUrl)
      const savedBrand = store.get<string>('brand')
      const b = idx.brands.find((x) => x.id === savedBrand) || idx.brands[0]
      if (b) await selectBrand(b)
      if (alive) setBooting(false)
    })()
    return () => {
      alive = false
    }
  }, [selectBrand])

  const go = useCallback((tab: string, sub = 0, extra: Partial<ViewState> = {}) => {
    store.set('tab', tab)
    setView((v) => ({ ...v, tab, sub, ...extra }))
  }, [])

  const goInsight = useCallback((id: string) => {
    store.set("tab", "insights")
    setView((v) => ({ ...v, tab: "insights", sub: 1, openIns: id, openInsights: new Set(v.openInsights).add(id) }))
  }, [])

  const setFilter = useCallback((k: keyof Filters, v: string) => setView((s) => ({ ...s, f: { ...s.f, [k]: v } })), [])
  const clearFilters = useCallback(() => setView((s) => ({ ...s, f: { ...EMPTY_FILTERS } })), [])

  const L = useMemo(() => (data ? createLookups(data) : null), [data])

  const value: Ctx = {
    ...view,
    brands,
    dashboardUrl,
    data,
    L,
    booting,
    loading,
    error,
    patch,
    go,
    goInsight,
    setFilter,
    clearFilters,
    selectBrand,
    addBrand,
  }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): Ctx {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp must be used inside <AppProvider>')
  return c
}
