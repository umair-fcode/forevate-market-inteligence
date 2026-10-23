import { useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { Pill, Tag } from '../components/bits'
import { pct } from '../lib/format'
import { activeFilters } from '../lib/filters'
import { ALL_TABS } from '../lib/tabs'
import type { Filters, Json } from '../lib/types'
import { useApp } from '../store/AppContext'
import { AlertsMenu, ProfileMenu } from './Menus'

export function Topbar() {
  const { tab, sub, f, filtersOpen, persona, data, L, patch, go, setFilter, clearFilters } = useApp()
  const [menu, setMenu] = useState<'bell' | 'profile' | null>(null)
  const bellRef = useRef<HTMLButtonElement>(null)
  const profRef = useRef<HTMLButtonElement>(null)

  const t = ALL_TABS.find((x) => x.id === tab)!
  const D = data?.D
  const ptabs: Json[] = tab === 'personas' ? D?.my_personas?.personas || [] : []
  const hasSubs = t.subs.length > 0 || ptabs.length > 0
  const active = activeFilters(f)
  const hasRisk = ((D?.global?.alerts || []) as Json[]).some((a) => a.level === 'Risk')

  const lbl = (x: { k: keyof Filters; v: string }) =>
    !L ? x.v : x.k === 'sku' ? L.skuShort(x.v) : x.k === 'persona' ? L.personaName(x.v) : x.v

  const skus: Json[] = D?.settings?.skus || []
  const personas: Json[] = D?.my_personas?.personas || []
  const provs: string[] = D?.global?.provinces || []
  const areas: string[] = D?.global?.decision_areas || []

  const sel = (k: keyof Filters, label: string, opts: { v: string; l: string }[]) => (
    <select className={`sel ${f[k] ? 'on' : ''}`} id={`f-${k}`} aria-label={label} value={f[k]} onChange={(e) => setFilter(k, e.target.value)}>
      <option value="">{label}: all</option>
      {opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  )

  const toggleMenu = (m: 'bell' | 'profile') => setMenu((cur) => (cur === m ? null : m))

  return (
    <header className={`topbar ${hasSubs ? '' : 'nosubs'}`} id="topbar">
      <div className="row1">
        <h1 id="pgtitle">{t.name}</h1>
        <div className="sp" />
        <div className="activef" id="activef">
          {!filtersOpen && active.map((x) => (
            <button key={x.k} className="chip on" data-tip="Remove this filter" onClick={() => setFilter(x.k, '')}>
              {lbl(x)} <Icon name="x" size={11} />
            </button>
          ))}
        </div>
        {D && (
          <button className={`fbtn ${filtersOpen || active.length ? 'on' : ''}`} aria-expanded={filtersOpen} aria-controls="filters" onClick={() => patch({ filtersOpen: !filtersOpen })}>
            <Icon name="filter" />
            <span>Filter</span>
            {active.length ? <span className="n">{active.length}</span> : null}
          </button>
        )}
        <button ref={bellRef} className="iconbtn" id="bell" aria-label="Alerts" aria-haspopup="menu" aria-expanded={menu === 'bell'} data-tip="Alerts: urgent changes such as a competitor price drop or a sentiment spike" onClick={() => toggleMenu('bell')}>
          <Icon name="bell" />
          {hasRisk && <span className="dot" />}
        </button>
        <button ref={profRef} className="profile" id="profile" aria-haspopup="menu" aria-expanded={menu === 'profile'} data-tip="Your account and brands" onClick={() => toggleMenu('profile')}>
          <span className="av">FA</span>
          <span className="t">
            <b>Fcode Labs Admin</b>
            <span id="profbrand">{data ? `Owner · ${data.brand.name}${data.brand.market ? ' · ' + data.brand.market : ''}` : 'Owner'}</span>
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </div>

      {hasSubs && (
        <div className={`subtabs ${ptabs.length ? 'cards' : ''}`} id="subtabs" role="tablist">
          {ptabs.length
            ? ptabs.map((p) => (
                <button key={p.id} className="ptab" role="tab" data-tip={`Open the full page for ${p.name}`} aria-selected={persona === p.id} onClick={() => patch({ persona: p.id })}>
                  <div className="row">
                    <span className="av">{(p.name || '?').slice(0, 1)}</span>
                    <Pill kind={p.trend === 'growing' ? 'good' : p.trend === 'shrinking' ? 'risk' : 'neutral'}>
                      {p.trend} {p.trend_pct != null ? pct(p.trend_pct, 1) : ''}
                    </Pill>
                  </div>
                  <b>{p.name}</b>
                </button>
              ))
            : t.subs.map((s, i) => (
                <button key={s} className="subtab" role="tab" data-tip={t.tips[i] || s} aria-selected={sub === i} onClick={() => go(tab, i, { openIns: null })}>
                  {s}
                </button>
              ))}
          <span className="tiny muted legend-rd">
            <Tag kind="real" text="Real" /> with a source · <Tag kind="demo" text="Demo" /> illustrative
          </span>
        </div>
      )}

      {D && (
        <div className="filters" id="filters" hidden={!filtersOpen}>
          <span className="lbl">Show</span>
          {sel('sku', 'SKU', skus.map((s) => ({ v: s.id, l: L!.skuShort(s.id) })))}
          {sel('persona', 'Persona', personas.map((p) => ({ v: p.id, l: p.name })))}
          {sel('province', 'Region', provs.map((p) => ({ v: p, l: p })))}
          {sel('area', 'Decision area', areas.map((a) => ({ v: a, l: a })))}
          {active.length ? <button className="btn sm" onClick={clearFilters}><Icon name="x" /> Clear all</button> : null}
          <span className="sp" style={{ flex: 1 }} />
          <span className="tiny muted">Filters apply to every tab</span>
        </div>
      )}

      {menu === 'bell' && <AlertsMenu anchor={bellRef} onClose={() => setMenu(null)} />}
      {menu === 'profile' && <ProfileMenu anchor={profRef} onClose={() => setMenu(null)} />}
    </header>
  )
}
