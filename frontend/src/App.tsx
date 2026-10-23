import { useEffect } from 'react'
import { EvidencePanel } from './components/EvidencePanel'
import { ViewBoundary } from './components/ViewBoundary'
import { Tooltip } from './components/Tooltip'
import { VIEWS } from './views'
import { Rail } from './layout/Rail'
import { Topbar } from './layout/Topbar'
import { ALL_TABS } from './lib/tabs'
import { useApp } from './store/AppContext'

export default function App() {
  const { tab, sub, booting, loading, error, data, go } = useApp()

  /* Deep links such as #insights or #market (used by the email digests). */
  useEffect(() => {
    const onHash = () => {
      const h = location.hash.replace('#', '')
      if (ALL_TABS.some((t) => t.id === h)) go(h, 0, { openIns: null })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [go])

  /* The original scrolls to the top on every view change. */
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab, sub, data?.brand.id])

  const t = ALL_TABS.find((x) => x.id === tab)!

  let content
  if (booting || loading) content = <div className="loading"><div className="spin" /><div>Loading brand data…</div></div>
  else if (error) content = <div className="empty">Could not load the brand: {error}</div>
  else if (!data) content = <div className="empty">No brand is onboarded yet. Use the brand menu to add one.</div>
  else if (VIEWS[tab]) { const View = VIEWS[tab]; content = <ViewBoundary key={`${data.brand.id}-${tab}`}><View /></ViewBoundary> }
  else content = <div className="empty">{t.name}{t.subs[sub] ? ` · ${t.subs[sub]}` : ''} — coming in a later step.</div>

  return (
    <>
      <div className="app" id="app">
        <Rail />
        <div className="main">
          <Topbar />
          <main className="content" id="content">{content}</main>
        </div>
      </div>
      <EvidencePanel />
      <Tooltip />
    </>
  )
}
