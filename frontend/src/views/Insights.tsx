/* Insights tab, ported from VIEWS.insights / insCard (original lines 1234-1296). */
import { Fragment, useEffect } from 'react'
import { BarRows, Card, ChartNote, Delta, Dir, EvBtn, FilterNote, Info, InsLink, Kpi, MeansBox, Meter, Pill, ScopeTag, SoWhat, Tag } from '../components/ui'
import { Icon } from '../components/Icon'
import { allPosts, sigsWhere } from '../lib/evidence'
import { cls, dfmt, dshort, fmt } from '../lib/format'
import { matchIns } from '../lib/filters'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'
import { useEvidence } from '../store/EvidenceContext'
import { useUI } from '../store/UIContext'

function InsCard({ i, open }: { i: Json; open: boolean }) {
  const { L, f, acted, snoozed, openInsights, patch, setFilter, go } = useApp()
  const { toast } = useUI()
  if (!L) return null
  const sn = snoozed.has(i.id)
  const nS = (i.evidence?.signals || []).length
  const nP = (i.evidence?.posts || []).length
  const nR = (i.evidence?.public_sources || []).length
  const isActed = acted.includes(i.id)
  const toggle = () => {
    const next = new Set(openInsights)
    if (next.has(i.id)) next.delete(i.id)
    else next.add(i.id)
    patch({ openInsights: next, openIns: null })
  }
  const toggleSnooze = () => {
    const next = new Set(snoozed)
    if (next.has(i.id)) next.delete(i.id)
    else next.add(i.id)
    patch({ snoozed: next })
  }
  const share = async () => {
    const txt = location.href.split('#')[0] + '#insights'
    try {
      await navigator.clipboard.writeText(txt)
      toast('Link copied')
    } catch {
      toast('Copy this link: ' + txt)
    }
  }

  const head = (
    <button className="ins-head" onClick={toggle} aria-expanded={open}>
      <div className="ins-meta">
        <Pill kind={i.status} />
        <span className="tag area">{i.decision_area}</span>
        <span className="muted small">{i.time_window}</span>
        <span className="sp" />
        <span className="tiny muted" style={{ fontFamily: 'var(--mono)' }}>{i.id}</span>
      </div>
      <h3>{i.headline}</h3>
      <div className="ins-sub">
        <Meter v={i.how_sure_we_are} label="How sure we are" />
        <span>Impact {i.impact}</span>
        <span>{nS} early signs · {nP} posts · {nR} public sources</span>
        {(i.affected?.skus || []).slice(0, 3).map((k: string) => <span key={k} className="tag area">{L.skuShort(k)}</span>)}
        <span className="chev"><Icon name="down" /></span>
      </div>
    </button>
  )
  if (!open) return <article className={`ins ${sn ? 'snoozed' : ''}`} id={`ins-${i.id}`}>{head}</article>

  const ev = {
    title: i.headline,
    subtitle: `${i.id} · ${i.decision_area} · ${i.status}`,
    signals: (i.evidence?.signals || []).map((s: Json) => s.rank),
    posts: i.evidence?.posts || [],
    sources: i.evidence?.public_sources || [],
  }
  const steps: string[] = i.how_we_got_to_this || []
  const chip = (k: 'sku' | 'persona' | 'province', v: string, label: string, tip: string) => (
    <button key={k + v} className={`chip ${f[k] === v ? 'on' : ''}`} data-tip={tip} onClick={() => setFilter(k, f[k] === v ? '' : v)}>{label}</button>
  )

  return (
    <article className={`ins open ${sn ? 'snoozed' : ''}`} id={`ins-${i.id}`}>
      {head}
      <div className="ins-body">
        <div className="grid g2">
          <div className="blk"><div className="k">What's happening</div><div className="b">{i.whats_happening}</div></div>
          <div className="blk"><div className="k">Why it matters</div><div className="b">{i.why_it_matters}</div></div>
        </div>
        <div className="callout risk"><div className="k">If we don't act</div><div className="b">{i.if_you_dont_act}</div></div>
        <div className="blk box">
          <div className="k">What to do</div>
          <div className="todo">
            {(i.what_to_do || []).map((a: Json, n: number) => (
              <div className="it" key={n}>
                <span className="n">{n + 1}</span>
                <div><div className="t">{a.action}</div><div className="meta">By {dfmt(a.by_when)} · {a.owner}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid g2">
          <div className="blk">
            <div className="k">Early signs <Info tip="Signals: patterns found across many posts, registrations and public data" /></div>
            <div className="signs">{(i.early_signs || []).map((s: Json, n: number) => <span className="s" key={n}><b>{s.type}</b>{s.text}</span>)}</div>
          </div>
          <div className="blk">
            <div className="k">How we got to this <Info tip="Signal chain: from early signs to the effect to the decision area" /></div>
            <div className="chain">
              {steps.map((s, n) => (
                <Fragment key={n}>
                  <span className="st">{s}</span>
                  {n < steps.length - 1 && <Icon name="arrow" />}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
        {L.plain() && (i.evidence?.signals || []).length > 0 && (
          <div className="blk">
            <div className="k">Signals behind this</div>
            <div className="feed">
              {i.evidence.signals.map((es: Json) => {
                const x = { ...(L.sig(es.rank) || {}), ...es }
                return (
                  <div className="it" key={x.rank} style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                    <div>
                      <div className="sigline"><span className="rk">#{x.rank}</span><b>{x.title}</b><Pill kind={x.sentiment} /><ScopeTag scope={x.evidence_scope} /></div>
                      <div className="m">{x.what_we_see}</div>
                      <MeansBox text={x.what_it_means_for_brand} />
                    </div>
                    <div><EvBtn ctx={{ title: x.title, subtitle: 'Signal #' + x.rank, signals: [x.rank] }} label="Evidence" /></div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <div className="blk">
          <div className="k">Who and what is affected</div>
          <div className="chips">
            {(i.affected?.skus || []).map((s: string) => chip('sku', s, L.skuShort(s), 'Filter everything to this SKU'))}
            {(i.affected?.personas || []).map((p: string) => chip('persona', p, L.personaName(p), 'Filter everything to this persona'))}
            {(i.affected?.provinces || []).map((p: string) => chip('province', p, p, 'Filter everything to this region'))}
          </div>
        </div>
        <div className="foot">
          <EvBtn ctx={ev} label="Evidence" />
          <span className="sp" />
          <button className={`btn sm ${isActed ? '' : 'primary'}`} onClick={() => { if (!isActed) patch({ acted: [...acted, i.id] }); toast('Added to the action tracker') }}>
            {isActed ? <><Icon name="check" /> In tracker</> : 'Act'}
          </button>
          <button className="btn sm" onClick={toggleSnooze}>{sn ? 'Unsnooze' : 'Snooze'}</button>
          <button className="btn sm" onClick={share}>Share</button>
          <button className="btn sm" onClick={() => { patch({ draft: 'Dig deeper: ' + i.headline }); go('research', 0) }}>Research deeper</button>
        </div>
      </div>
    </article>
  )
}

function Detailed({ cards }: { cards: Json[] }) {
  const { f, openInsights, openIns, patch } = useApp()
  const list = cards.filter((c) => matchIns(f, c))
  const n = (s: string) => list.filter((c) => c.status === s).length
  const allOpen = list.length > 0 && list.every((c) => openInsights.has(c.id))

  useEffect(() => {
    if (!openIns) return
    const t = setTimeout(() => document.getElementById('ins-' + openIns)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    return () => clearTimeout(t)
  }, [openIns])

  const expandAll = () => {
    const next = new Set(openInsights)
    list.forEach((c) => (allOpen ? next.delete(c.id) : next.add(c.id)))
    patch({ openInsights: next, openIns: null })
  }
  return (
    <>
      <div className="sect-title">
        {list.length} insight{list.length === 1 ? '' : 's'} · {n('Risk')} Risk · {n('Watch')} Watch · {n('Opportunity')} Opportunity
        <span className="sp" />
        <FilterNote />
        <button className="linkbtn" onClick={expandAll}>{allOpen ? 'Collapse all' : 'Expand all'}</button>
      </div>
      {list.length ? list.map((c) => <InsCard key={c.id} i={c} open={openInsights.has(c.id)} />) : <div className="empty">No insight matches the current filter. Clear a filter to see more.</div>}
    </>
  )
}

function Actions({ I }: { I: Json }) {
  const { data, L, f, acted } = useApp()
  if (!data || !L) return null
  const acts = (I.actions || []).filter((a: Json) => !f.sku || a.sku === f.sku)
  const added = acted.map((id) => L.insight(id)).filter(Boolean) as Json[]
  const dr: Json[] = data.D.my_demand?.overview?.decision_results || []
  const statusKind = (s: string) => (s === 'Live' ? 'good' : s === 'Planned' ? 'neutral' : s === 'Done' ? 'good' : 'warn')
  const verdictKind = (v: string) => (v === 'Worked' ? 'good' : v === 'Too early' ? 'neutral' : 'warn')
  return (
    <>
      <Card title="Action tracker" sub="What the team acted on, who owns it, and what happened afterwards.">
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Action</th><th>From insight</th><th>Owner</th><th>Started</th><th>Status</th><th>What happened</th><th>SKU</th></tr></thead>
            <tbody>
              {acts.map((a: Json, n: number) => (
                <tr key={n}>
                  <td className="b">{a.action}<div className="muted small">{a.evidence || ''}</div></td>
                  <td><InsLink id={a.from_insight} /></td>
                  <td>{a.owner}</td>
                  <td className="num">{dfmt(a.started)}</td>
                  <td><Pill kind={statusKind(a.status)}>{a.status}</Pill></td>
                  <td>{a.result}</td>
                  <td>{a.sku ? <span className="tag area">{L.skuShort(a.sku)}</span> : null}</td>
                </tr>
              ))}
              {added.map((i) => (
                <tr key={i.id}>
                  <td className="b">{(i.what_to_do || [])[0]?.action || i.headline}<div className="muted small">Added from this session</div></td>
                  <td><InsLink id={i.id} /></td>
                  <td>{(i.what_to_do || [])[0]?.owner || '—'}</td>
                  <td>Today</td>
                  <td><Pill kind="neutral">Planned</Pill></td>
                  <td className="muted">Not started</td>
                  <td>{(i.affected?.skus || []).slice(0, 1).map((s: string) => <span key={s} className="tag area">{L.skuShort(s)}</span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card
        title="Did our past decisions work?"
        right={<Tag kind="demo" text="Demo data" tip="Sales results come from My Demand, which is illustrative until dealer sales are connected" />}
        sub="Linked to My Demand. Open My Demand"
      >
        {dr.length ? (
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>Decision</th><th>SKU</th><th>Before</th><th>After</th><th className="r">Change</th><th>Verdict</th></tr></thead>
              <tbody>
                {dr.map((r, n) => (
                  <tr key={n}>
                    <td className="b">{r.action}</td>
                    <td>{r.sku}</td>
                    <td>{r.before}</td>
                    <td>{r.after}</td>
                    <td className="r num"><Delta v={r.change_pct} /></td>
                    <td><Pill kind={verdictKind(r.verdict)}>{r.verdict}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty">No results yet.</div>}
      </Card>
    </>
  )
}

function Overview({ I, cards }: { I: Json; cards: Json[] }) {
  const { data, L, f, setFilter, go, goInsight } = useApp()
  const { closeEvidence } = useEvidence()
  if (!data || !L) return null
  const D = data.D
  const sc: Json[] = I.overview.decision_scorecard || []
  const up: Json[] = I.overview.coming_up || []
  const bp: Json[] = I.overview.by_province || []
  const alerts: Json[] = D.global?.alerts || []
  const cnt = (s: string) => cards.filter((c) => c.status === s).length
  const attention = sc.filter((s) => s.status !== 'Opportunity').length
  const upSorted = up.slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const nUp = upSorted.filter((u) => u.direction === 'up').length
  const nDown = upSorted.filter((u) => u.direction === 'down').length
  const topProv = bp.slice().sort((a, b) => b.open_insights - a.open_insights)[0]
  const latest = alerts.map((a) => a.date).sort().pop()

  return (
    <>
      <SoWhat text={I.so_what} />
      <div className="kpis">
        <Kpi label="Decision areas needing attention" value={<>{attention}<small>of {sc.length}</small></>} d={`${sc.filter((s) => s.status === 'Risk').length} at risk · ${sc.filter((s) => s.status === 'Watch').length} to watch`} />
        <Kpi label="Open insights" value={cards.length} d={`${cnt('Risk')} Risk · ${cnt('Watch')} Watch · ${cnt('Opportunity')} Opportunity`} />
        <Kpi label="Early signs behind them" value={sc.reduce((a, b) => a + (b.early_signs || 0), 0)} d={`from ${fmt((D.signal_index || []).length)} signals kept this period`} tip="Signals: patterns Forevate found across posts, registrations and public data" />
        <Kpi label="Alerts" value={alerts.length} d={`${alerts.filter((a) => a.level === 'Risk').length} risk · latest ${dshort(latest)}`} />
      </div>
      <div className="sect-title">Our Key Intelligent Insights <Info tip="One tile per decision area. Open the top insight to see the reasoning and the evidence." /></div>
      <div className="score">
        {sc.map((s) => (
          <button key={s.area} className={`tile ${cls(s.status)}`} onClick={() => goInsight(s.top_insight)}>
            <div className="a"><span>{s.area}</span><Pill kind={s.status} /></div>
            <div className="why">{s.reason}</div>
            <div className="ft"><span>{fmt(s.early_signs)} early signs</span><span>Open {s.top_insight} <span style={{ verticalAlign: '-2px' }}><Icon name="arrow" size={12} /></span></span></div>
          </button>
        ))}
      </div>
      <div>
        <button className="linkbtn" onClick={() => go('insights', 1)}>See all {cards.length} detailed insights <span style={{ verticalAlign: '-2px' }}><Icon name="arrow" size={13} /></span></button>
      </div>
      <div className="grid g2">
        <Card
          title="Coming up"
          takeaway={`${upSorted.length} events in the next 12 weeks: ${nUp} likely to lift sales, ${nDown} likely to lower them, ${upSorted.length - nUp - nDown} mixed.`}
          sub="Expected effects over the next 4–12 weeks."
        >
          <div className="timeline">
            {upSorted.map((u, n) => (
              <div className="ev" key={n}>
                <div className="d">{dshort(u.date)}</div>
                <div className="n"><i /></div>
                <div className="b">
                  <div className="t">{u.event}<span className="tag area">{u.tag}</span><Dir d={u.direction} /></div>
                  <div className="e">{u.expected_effect}</div>
                  <div className="meta" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
                    {u.insight ? <InsLink id={u.insight} /> : null}
                    {(u.signals || []).length ? <EvBtn ctx={{ title: u.event, subtitle: 'Early signs behind this event', signals: u.signals }} label="Early signs" /> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card
          title="Open insights by region"
          takeaway={topProv ? `${topProv.province} has the most open insights (${topProv.open_insights}).` : ''}
          sub="Region comes from towns named in posts, so it covers part of the conversation."
        >
          <BarRows
            rows={bp.map((p) => {
              const n = L.brandVal(p, '_posts_with_location')
              return {
                l: p.province,
                v: p.open_insights,
                key: p.province,
                hl: f.province === p.province,
                tip: `${p.province}: ${p.open_insights} open insights · ${fmt(n)} posts name a place here`,
                ev: {
                  title: p.province,
                  subtitle: `${p.open_insights} open insights · ${fmt(n)} posts name a place in this region`,
                  signals: sigsWhere(data, (s) => (s.provinces || []).includes(p.province)),
                  posts: allPosts(data).filter((x) => x.province === p.province),
                  actions: (
                    <button className="btn sm" onClick={() => { setFilter('province', f.province === p.province ? '' : p.province); closeEvidence() }}>
                      {f.province === p.province ? 'Remove the region filter' : 'Filter every tab to ' + p.province}
                    </button>
                  ),
                },
              }
            })}
          />
          <ChartNote text="Click a region for the early signs and posts behind it." />
        </Card>
      </div>
    </>
  )
}

export function InsightsView() {
  const { data, sub } = useApp()
  if (!data) return null
  const I = data.D.insights
  const cards: Json[] = I.detailed_insights || []
  if (sub === 1) return <Detailed cards={cards} />
  if (sub === 2) return <Actions I={I} />
  return <Overview I={I} cards={cards} />
}
