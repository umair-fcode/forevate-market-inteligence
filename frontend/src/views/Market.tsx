/* My Market tab, ported from VIEWS.market (original lines 1519-1546). */
import { LineChart } from '../components/charts'
import { BarRows, Card, ChartNote, Delta, Dir, EvBtn, Info, InsLink, InsMini, Kpi, Meter, MeansBox, Pill, ScopeTag, SignalList, SoWhat, SrcLink, Tag } from '../components/ui'
import { Icon } from '../components/Icon'
import { sigsWhere, srcsOfType } from '../lib/evidence'
import { cls, dfmt, dshort } from '../lib/format'
import { knDate, knMeta } from '../lib/lookups'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'

export function MarketView() {
  const { data, L, f, marketTag: tagF, patch } = useApp()
  if (!data || !L) return null
  const D = data.D
  const M: Json = D.my_market || {}
  const toggleTag = (t: string) => patch({ marketTag: tagF === t ? '' : t })

  const cond: Json[] = M.conditions || []
  const up: Json[] = (M.coming_up || []).filter((u: Json) => !tagF || u.tag === tagF).slice().sort((a: Json, b: Json) => (a.date || '').localeCompare(b.date || ''))
  const feed: Json[] = (M.market_feed || [])
    .filter((x: Json) => (!tagF || x.tag === tagF) && (!f.area || x.decision_area === f.area))
    .slice()
    .sort((a: Json, b: Json) => (b.date || '').localeCompare(a.date || ''))
  const kn: Json = M.key_numbers || {}
  const knSeries = Object.entries(kn).filter(([, v]) => Array.isArray(v) && (v as Json[]).length) as [string, Json[]][]
  const pk = knSeries[0]?.[0] as string | undefined
  const petrol: Json[] = knSeries[0]?.[1] || []
  const pm = pk ? knMeta(pk) : ['', '', '']
  const infl: Json[] = kn.headline_inflation_pct || []
  const pr: Json[] = kn.policy_rate_pct || []
  const pLast = petrol[petrol.length - 1] || {}
  const pPrev = petrol[petrol.length - 2] || {}
  const iLast = infl[infl.length - 1] || {}
  const iPrev = infl[infl.length - 2] || {}
  const knEv = (k: string, pt: Json) => ({
    title: `${knMeta(k)[0]} · ${dfmt(knDate(pt))}`,
    subtitle: `${L.knFmt(k, pt.value)}${knMeta(k)[1] !== '%' ? ' ' + knMeta(k)[1] : ''} · published figure`,
    sources: pt.source ? [pt.source] : srcsOfType(data, knMeta(k)[2]),
    signals: k === pk ? sigsWhere(data, (x) => x.market_tag === 'Costs').slice(0, 6) : [],
    start: 'sources' as const,
  })
  const asOf: string = D._readme?.as_of || '2026-10-21'
  const next = up.find((u) => u.date >= asOf)
  const days = next ? Math.round((new Date(next.date).getTime() - new Date(asOf).getTime()) / 864e5) : null
  const lastFood = kn.food_inflation_pct?.[kn.food_inflation_pct.length - 1]

  return (
    <>
      <SoWhat text={M.so_what} />
      <div className="kpis">
        {pk && (
          <Kpi
            label={pm[0]}
            value={L.knFmt(pk, pLast.value)}
            unit={pm[1] === '%' ? '' : pm[1]}
            d={<Delta v={pPrev.value != null ? +(pLast.value - pPrev.value).toFixed(2) : null} bad suffix={pm[1] === '%' ? ' pts' : ''} vs={pPrev.value != null ? `since ${dshort(knDate(pPrev))}` : `set ${dshort(knDate(pLast))}`} />}
            tag={<Tag kind="real" />}
          />
        )}
        <Kpi
          label="Inflation"
          value={(iLast.value ?? '—') + '%'}
          d={iPrev.value != null ? <Delta v={+(iLast.value - iPrev.value).toFixed(1)} bad suffix=" pts" vs={`${dfmt(iLast.month)} vs ${dfmt(iPrev.month)}`} /> : `${dfmt(iLast.month)}${lastFood ? ' · food ' + lastFood.value + '%' : ''}`}
          tag={<Tag kind="real" />}
        />
        <Kpi label="Policy rate" value={(pr[pr.length - 1]?.value ?? '—') + '%'} d={`set ${dfmt(pr[pr.length - 1]?.date)}`} tag={<Tag kind="real" />} />
        <Kpi label="Next event" value={next ? (days === 0 ? 'Today' : <>{days}<small>days</small></>) : '—'} d={next ? `${next.event} · ${dshort(next.date)}` : ''} />
      </div>

      <div className="sect-title">
        Conditions <Info tip="One tile per outside factor. Tap a tile to filter everything below to that factor." />
        <span className="sp" />
        {tagF ? <button className="btn sm" onClick={() => patch({ marketTag: '' })}><Icon name="x" /> Show all factors</button> : null}
      </div>
      <div className="score">
        {cond.map((c) => (
          <div key={c.factor} className={`tile ${cls(c.status)}`} style={{ cursor: 'default', ...(tagF === c.factor ? { borderColor: 'var(--accent)' } : {}) }}>
            <div className="a">
              <button className="linkbtn" style={{ fontSize: 15, color: tagF === c.factor ? 'var(--accent)' : 'var(--ink)' }} data-tip={tagF === c.factor ? 'Show all factors' : 'Filter this page to ' + c.factor} onClick={() => toggleTag(c.factor)}>{c.factor}</button>
              <Pill kind={c.status} />
            </div>
            <div className="why">{c.headline}</div>
            <div className="ft"><span>{c.detail}</span></div>
            <div className="ft"><span>{(c.signals || []).length} early signs</span><EvBtn ctx={{ title: c.factor, subtitle: c.headline, signals: c.signals || [] }} label="Evidence" /></div>
          </div>
        ))}
      </div>

      <div className="grid g2">
        <Card
          title="Coming up · next 90 days"
          sub="Festivals, school terms, seasons, weather outlook and regulation deadlines, with the expected effect on sales."
          takeaway={up.length ? `${up.length} dated events ahead; ${up.filter((u) => u.direction === 'up').length} expected to lift sales and ${up.filter((u) => u.direction === 'down').length} to lower them.` : ''}
        >
          <div className="timeline">
            {up.length ? up.map((u, n) => (
              <div className="ev" key={n}>
                <div className="d">{dshort(u.date)}</div>
                <div className="n"><i /></div>
                <div className="b">
                  <div className="t">{u.event}<span className="tag area">{u.tag}</span><Dir d={u.direction} /></div>
                  <div className="e">{u.expected_effect}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {u.insight ? <InsLink id={u.insight} /> : null}
                    {(u.signals || []).length ? <EvBtn ctx={{ title: u.event, signals: u.signals }} label="Early signs" /> : null}
                  </div>
                </div>
              </div>
            )) : <div className="empty">Nothing coming up for this factor.</div>}
          </div>
        </Card>
        <Card
          title="Key numbers"
          right={<Tag kind="real" />}
          takeaway={pk ? `${pm[0]} has moved ${Math.max(0, petrol.length - 1)} time${petrol.length - 1 === 1 ? '' : 's'} in the period and sits at ${L.knFmt(pk, pLast.value)}${pm[1] && pm[1] !== '%' ? ' ' + pm[1] : ''}; every revision lands as a public verdict on the cost of living.` : ''}
        >
          {pk && petrol.length >= 2 && (
            <>
              <LineChart
                series={[{ name: `${pm[0]}${pm[1] && pm[1] !== '%' ? ' (Rs. ' + pm[1] + ')' : ''}`, v: petrol.map((p) => p.value), color: 'var(--c1)' }]}
                labels={petrol.map((p) => dshort(knDate(p)))}
                h={180}
                yFmt={(v) => L.knFmt(pk, v)}
                yLabel={`${pm[0]}${pm[1] === '%' ? ', %' : ', Rs. ' + pm[1]}`}
                pointEv={(i) => knEv(pk, petrol[i])}
              />
              <ChartNote text="Click a point for the published source." />
            </>
          )}
          <div className="grid g2" style={{ gap: 10 }}>
            {knSeries.filter(([k]) => k !== pk || petrol.length < 2).map(([k, arr]) => (
              <div key={k}>
                <div className="sect-title" style={{ marginBottom: 6 }}>
                  {knMeta(k)[0]}
                  {knMeta(k)[1] && knMeta(k)[1] !== '%' ? <> <span className="muted" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>Rs. {knMeta(k)[1]}</span></> : null}
                </div>
                <BarRows
                  rows={arr.map((i) => ({ l: dfmt(knDate(i)), v: i.value, vl: L.knFmt(k, i.value), cls: 'alt', tip: `${knMeta(k)[0]} ${dfmt(knDate(i))}: ${L.knFmt(k, i.value)}${i.note ? ' · ' + i.note : ''}`, ev: knEv(k, i) }))}
                />
              </div>
            ))}
          </div>
          <div className="muted small">{kn.note || ''}</div>
        </Card>
      </div>

      <Card title="Market feed" sub="Changes in key numbers, weather against normal, cost changes, regulation updates and relevant news. Each item shows its factor, the decision area it affects and what it means for us.">
        <div className="chips" style={{ alignItems: 'center' }}>
          <span className="muted small">Factor</span>
          {(M.factor_tags || []).map((t: string) => <button key={t} className={`chip ${tagF === t ? 'on' : ''}`} onClick={() => toggleTag(t)}>{t}</button>)}
          <span className="sp" style={{ flex: 1 }} />
          <span className="muted small">{feed.length} items, newest first</span>
        </div>
        <div className="feed">
          {feed.length ? feed.map((x, n) => (
            <div className="it" key={n}>
              <div className="dt">{dshort(x.date)}</div>
              <div>
                <div className="h">{x.item}</div>
                {L.plain() ? <>{x.what_we_see ? <div className="m">{x.what_we_see}</div> : null}<MeansBox text={x.means} /></> : <div className="m">{x.means}</div>}
                <div className="meta">
                  <span className="tag area">{x.tag}</span>
                  <span className="tag area">{x.decision_area}</span>
                  {x.signal ? <Meter v={x.signal.how_sure_we_are} /> : null}
                  {x.source ? <SrcLink id={x.source} /> : null}
                  <ScopeTag scope={x.evidence_scope} />
                </div>
              </div>
              <div><EvBtn ctx={{ title: x.item, subtitle: `${x.tag} · ${x.decision_area}`, signals: x.signal ? [x.signal.rank] : [], posts: x.evidence_posts || [], sources: x.sources || x.evidence || [] }} label="Evidence" /></div>
            </div>
          )) : <div className="empty">Nothing in the feed for this filter.</div>}
        </div>
      </Card>
      <Card title="What it means" sub="Insights driven by outside factors. Each opens the Insights tab."><InsMini ids={M.what_it_means || []} /></Card>
      <Card title="Early signs on this tab"><SignalList sigs={M.signals || []} title="Market early signs" /></Card>
    </>
  )
}
