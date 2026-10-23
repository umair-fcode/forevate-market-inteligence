import { Icon } from '../components/Icon'
import { EXTRA, TABS } from '../lib/tabs'
import type { TabDef } from '../lib/types'
import { useApp } from '../store/AppContext'

export function Rail() {
  const { tab, go, data } = useApp()
  const counts: Record<string, number> = { insights: (data?.D.insights?.detailed_insights || []).length }

  const item = (t: TabDef, showCount: boolean) => (
    <button
      key={t.id}
      className="navitem"
      data-tip={t.q}
      aria-current={tab === t.id ? 'page' : undefined}
      onClick={() => go(t.id, 0, { openIns: null })}
    >
      <Icon name={t.id} />
      <span>{t.name}</span>
      {showCount && counts[t.id] ? <span className="cnt">{counts[t.id]}</span> : null}
    </button>
  )

  return (
    <aside className="rail" aria-label="Main">
      <button className="logo" data-tip="Back to Insights, the home page" aria-label="Forevate home" onClick={() => go('insights', 0, { openIns: null })}>
        <img src="/logo.png" alt="Forevate" />
      </button>
      <nav className="nav" aria-label="Tabs">
        <div className="lbl">Workspace</div>
        {TABS.map((t) => item(t, true))}
      </nav>
      <div className="foot">{EXTRA.map((t) => item(t, false))}</div>
    </aside>
  )
}
