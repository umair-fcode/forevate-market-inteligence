/* App state, replacing the original global `state` object. Per-viewer conveniences persist in localStorage under 'fv.*'. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadBrand } from '../lib/data'
import { store } from '../lib/storage'
import { EMPTY_FILTERS } from '../lib/filters'
import { createLookups, type Lookups } from '../lib/lookups'
import { ALL_TABS } from '../lib/tabs'
import type { BrandData, Filters, Json } from '../lib/types'

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
  /** Prefilled question for Deep Research (set by "Research deeper"). */
  draft: string
  /** Selected column of the two Demand charts (null = default). */
  demandMonth: number | null
  demandWeek: number | null
  /** Research-partner briefs drafted this session. */
  partnerReqs: Json[]
}

const freshBrandView = (D: Json): Partial<ViewState> => ({
  persona: D?.my_personas?.personas?.[0]?.id || null,
  f: { ...EMPTY_FILTERS },
  compSku: '',
  marketTag: '',
  openIns: null,
  sub: 0,
  chat: [],
  demandMonth: null,
  demandWeek: null,
})

function initialTab(): string {
  const h = (location.hash || '').replace('#', '')
  const saved = store.get<string>('tab')
  if (ALL_TABS.some((t) => t.id === h)) return h
  if (ALL_TABS.some((t) => t.id === saved)) return saved!
  return 'insights'
}

interface Ctx extends ViewState {
  dashboardUrl: string
  /** The brand this build ships, or null while loading / if its files are missing. */
  data: BrandData | null
  /** Lookups for the loaded brand (null with `data`). */
  L: Lookups | null
  booting: boolean
  error: string | null
  patch: (p: Partial<ViewState>) => void
  go: (tab: string, sub?: number, extra?: Partial<ViewState>) => void
  /** Functional update for the Deep Research conversation. */
  updateChat: (fn: (c: Json[]) => Json[]) => void
  goInsight: (id: string) => void
  setFilter: (k: keyof Filters, v: string) => void
  clearFilters: () => void
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [dashboardUrl, setDashboardUrl] = useState('')
  const [data, setData] = useState<BrandData | null>(null)
  const [booting, setBooting] = useState(true)
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
    draft: '',
    demandMonth: null,
    demandWeek: null,
    partnerReqs: [],
  }))

  const patch = useCallback((p: Partial<ViewState>) => setView((v) => ({ ...v, ...p })), [])

  useEffect(() => {
    let alive = true
    loadBrand()
      .then((loaded) => {
        if (!alive) return
        setData(loaded)
        setDashboardUrl(loaded.brand.dashboard_url || location.href.split('#')[0])
        setView((v) => ({ ...v, ...freshBrandView(loaded.D) }))
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setBooting(false))
    return () => {
      alive = false
    }
  }, [])

  const go = useCallback((tab: string, sub = 0, extra: Partial<ViewState> = {}) => {
    store.set('tab', tab)
    setView((v) => ({ ...v, tab, sub, ...extra }))
  }, [])

  const updateChat = useCallback((fn: (c: Json[]) => Json[]) => setView((v) => ({ ...v, chat: fn(v.chat) })), [])

  const goInsight = useCallback((id: string) => {
    store.set("tab", "insights")
    setView((v) => ({ ...v, tab: "insights", sub: 1, openIns: id, openInsights: new Set(v.openInsights).add(id) }))
  }, [])

  const setFilter = useCallback((k: keyof Filters, v: string) => setView((s) => ({ ...s, f: { ...s.f, [k]: v } })), [])
  const clearFilters = useCallback(() => setView((s) => ({ ...s, f: { ...EMPTY_FILTERS } })), [])

  const L = useMemo(() => (data ? createLookups(data) : null), [data])

  const value: Ctx = {
    ...view,
    dashboardUrl,
    data,
    L,
    booting,
    error,
    patch,
    go,
    updateChat,
    goInsight,
    setFilter,
    clearFilters,
  }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): Ctx {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp must be used inside <AppProvider>')
  return c
}
