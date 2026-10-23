/* My Competitors tab, ported from VIEWS.competitors (original lines 1408-1457). Sentiments lives in Sentiments.tsx. */
import type { ReactNode } from 'react'
import { GroupedBars } from '../components/charts'
import { FEEL_TIP, FeelCell, FeelGauge, feelCls, feelWord } from '../components/feel'
import { Card, ChartNote, EvBtn, Info, InsMini, Kpi, Legend, MeansBox, Pill, SoWhat, SrcLink, SrcLinks, Tag } from '../components/ui'
import { compact, dfmt, dshort, fmt, pct, signed } from '../lib/format'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'
import { useEvidence } from '../store/EvidenceContext'
import { SentimentsView } from './Sentiments'

type Better = 'same' | 'worse' | 'better'
type Row = { key: string; k: string; f: (c: Json) => ReactNode; cls: (c: Json) => Better }
const better = (v: number | null | undefined, mv: number | null | undefined, higherIsBetter = true): Better =>
  v == null || mv == null || v === mv ? 'same' : (v < mv) === higherIsBetter ? 'worse' : 'better'

function HeadToHead({ K, me }: { K: Json; me: string }) {
  const { data, L, f, compSku, patch } = useApp()
  const { openEvidence } = useEvidence()
  if (!data || !L) return null
  const D = data.D
  const reg: Json[] = K.registrations_2w_monthly || []
  const last: Json = reg[reg.length - 1] || {}
  const brands = Object.keys(last).filter((k) => !['month', 'real', 'source'].includes(k))
  const h2h: Json = K.head_to_head || {}
  const cols: Json[] = h2h.columns || []
  const mine: Json = cols.find((c) => c.brand === me) || {}
  const mapB: Json = K.where_each_brand_stands || {}
  const svs: Json[] = K.sku_vs_sku || []
  const cur = compSku || f.sku
  const pick = svs.find((s) => s.our_sku === cur)
  const rank2w = brands.slice().sort((a, b) => last[b] - last[a])
  const shareNote = D.settings?.brand?.share_note
  const has = (key: string) => cols.some((c) => c[key] != null)
  const ourCls = (c: Json, key: string): Better => (c.brand === me ? 'same' : better(mine[key], c[key]))

  const allRows: Row[] = [
    { key: 'entry_price_lkr', k: 'Entry price (real where known)', f: (c) => (c.entry_price_lkr != null ? L.money(c.entry_price_lkr) : <span className="muted">not published in posts</span>), cls: () => 'same' },
    { key: 'observed_price_lkr', k: 'Observed price (from posts)', f: (c) => c.observed_price_lkr || 'not observed', cls: () => 'same' },
    { key: 'upfront_observed', k: 'Upfront cost seen in posts', f: (c) => c.upfront_observed || '—', cls: () => 'same' },
    { key: 'posts_26w', k: 'Posts in 26 weeks', f: (c) => fmt(c.posts_26w), cls: (c) => ourCls(c, 'posts_26w') },
    { key: 'engagement_26w', k: 'Engagement', f: (c) => compact(c.engagement_26w), cls: (c) => ourCls(c, 'engagement_26w') },
    { key: 'share_pct', k: 'Share of conversation', f: (c) => (c.share_pct != null ? c.share_pct + '%' : '—'), cls: (c) => ourCls(c, 'share_pct') },
    { key: 'how_people_feel', k: 'How people feel', f: (c) => <FeelCell v={c.how_people_feel} />, cls: (c) => ourCls(c, 'how_people_feel') },
    { key: 'signals', k: 'Early signs', f: (c) => ((c.signals || []).length ? <EvBtn ctx={{ title: c.brand, subtitle: 'Early signs about this brand', signals: c.signals }} label={`${c.signals.length}`} /> : '—'), cls: () => 'same' },
    { key: 'known_offer', k: 'Known offer', f: (c) => c.known_offer || '—', cls: () => 'same' },
    { key: 'known_activity', k: 'Known activity', f: (c) => c.known_activity || '—', cls: () => 'same' },
    { key: 'touchpoints', k: 'Sales and service touchpoints', f: (c) => c.touchpoints || '—', cls: () => 'same' },
    { key: 'distribution', k: 'Distribution', f: (c) => c.distribution || '—', cls: () => 'same' },
  ]
  const rows = allRows.filter((r) => has(r.key))

  const regSources = reg.map((r) => r.source).filter((v, i, a) => a.indexOf(v) === i)
  const regSub = `Published registrations (${regSources.map((s) => L.source(s)?.publisher || s).join(', ')}).`
  const colors = (i: number) => `var(--c${Math.min(i + 1, 5)})`

  let table: ReactNode
  if (pick && !pick.competitors) {
    table = (
      <>
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Ours</th><th>Closest competitor SKU</th><th>What we know</th></tr></thead>
            <tbody><tr><td className="b">{L.skuName(pick.our_sku)}</td><td>{pick.competitor || '—'}</td><td className="muted">{pick.note || ''}</td></tr></tbody>
          </table>
        </div>
        <div className="muted small">Prices are shown only when they appeared in the monitored posts; nothing is estimated.</div>
      </>
    )
  } else if (pick) {
    const comps: Json[] = pick.competitors || []
    table = (
      <>
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Ours</th><th className="r">Our price</th><th>Closest competitor SKU</th><th className="r">Their price</th></tr></thead>
            <tbody>
              {comps.map((c, i) => (
                <tr key={i}>
                  {i === 0 && <td className="b" rowSpan={comps.length}>{pick.our_name}</td>}
                  {i === 0 && <td className="r num" rowSpan={comps.length}>{L.money(pick.our_price_lkr)}<div>{pick.our_price_real ? <Tag kind="real" /> : <Tag kind="demo" text="est." />}</div></td>}
                  <td><span className="pill neutral">{c.brand}</span> {c.model}</td>
                  <td className="r num">{c.price_lkr != null ? L.money(c.price_lkr) : <span className="muted small">{c.price_note || 'not observed'}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="muted small">Competitor prices are shown only when they appeared in the monitored posts; nothing is estimated.</div>
      </>
    )
  } else {
    table = (
      <>
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr><th />{cols.map((c) => <th key={c.brand} className={c.brand === me ? 'b' : ''} style={c.brand === me ? { color: 'var(--accent)' } : undefined}>{c.brand}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <th style={{ textAlign: 'left', textTransform: 'none', letterSpacing: 0, fontSize: 12.5, color: 'var(--ink-2)' }}>{r.k}</th>
                  {cols.map((c) => <td key={c.brand} className={`${r.cls(c)} num ${c.brand === me ? 'b' : ''}`} style={{ minWidth: 140 }}>{r.f(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Legend items={[{ name: 'Better than us', color: 'var(--good-tint)' }, { name: 'Worse than us', color: 'var(--risk-tint)' }]} />
        <div className="muted small">{h2h.note || ''}</div>
      </>
    )
  }

  return (
    <>
      <SoWhat text={K.so_what} />
      <Card title="Head-to-head" sub="Our brand against each competitor on every dimension at once. Pick a SKU to compare it with its closest rival.">
        <div className="chips" style={{ alignItems: 'center' }}>
          <span className="muted small">Compare</span>
          <button className={`chip ${!cur ? 'on' : ''}`} onClick={() => patch({ compSku: '' })}>Whole brand</button>
          {svs.map((s) => <button key={s.our_sku} className={`chip ${cur === s.our_sku ? 'on' : ''}`} onClick={() => patch({ compSku: s.our_sku })}>{L.skuShort(s.our_sku)}</button>)}
        </div>
        {table}
      </Card>
      <div className="grid g2">
        {reg.length ? (
          <Card
            title="New two-wheeler registrations"
            right={<Tag kind="real" />}
            sub={regSub}
            takeaway={`${rank2w[0]} passed ${me} in two-wheelers in ${dfmt(last.month)} (${fmt(last[rank2w[0]])} vs ${fmt(last[me])}); ${me} still leads motorcycles, Honda and TVS take scooters.`}
          >
            <GroupedBars
              groups={reg.map((r) => dfmt(r.month))}
              series={brands.map((b, i) => ({ name: b, v: reg.map((r) => r[b]), color: colors(i) }))}
              yFmt={compact}
              barEv={(gi, si) => ({ title: `${brands[si]} · ${dfmt(reg[gi].month)}`, subtitle: `${fmt(reg[gi][brands[si]])} new two-wheelers registered · published figure`, sources: [reg[gi].source].filter(Boolean), start: 'sources' })}
            />
            <ChartNote text="Click a bar for the published source." />
            <Legend items={brands.map((b, i) => ({ name: b, color: colors(i) }))} />
          </Card>
        ) : (
          <Card title="Where we stand in the market" right={<Tag kind="real" />} sub="Published market position and the sources behind it.">
            <p style={{ fontSize: 15, lineHeight: 1.6 }}>{shareNote || "No published market-share figure in this brand's sources yet."}</p>
            <div className="chips">{(D.settings?.brand?.evidence || []).map((id: string) => <span key={id} className="chip static"><SrcLink id={id} /></span>)}</div>
            {h2h.note ? <div className="muted small">{h2h.note}</div> : null}
          </Card>
        )}
        <Card
          title="Where each brand stands"
          sub={mapB.note || ''}
          takeaway={mapB.open_space ? `Open space: ${mapB.open_space}` : ''}
          right={<span className="tiny muted">{mapB.axes?.x || ''} · {mapB.axes?.y || ''}</span>}
        >
          <div className="quad">
            <span className="ax" style={{ left: 8, bottom: 6 }}>← Value</span>
            <span className="ax" style={{ right: 8, bottom: 6 }}>Premium →</span>
            <span className="ax" style={{ left: 8, top: 6 }}>↑ Emotional</span>
            <span className="ax" style={{ left: 8, bottom: 26 }}>↓ Functional</span>
            {(mapB.brands || []).map((b: Json) => {
              const r = (String(b.basis || '').match(/\d+/g) || []).map(Number).filter((n) => L.sig(n))
              return (
                <button
                  key={b.brand}
                  className={`dot ${r.length ? 'ev' : ''}`}
                  style={{ left: `${b.value_to_premium}%`, top: `${100 - b.functional_to_emotional}%` }}
                  onClick={r.length ? () => openEvidence({ title: b.brand, subtitle: 'Why it sits here: ' + b.basis, signals: r }) : undefined}
                  data-tip={`${b.brand}: ${b.basis}${r.length ? ' · click for the signals' : ''}`}
                >
                  <i style={{ background: b.brand === me ? 'var(--cobalt)' : 'var(--c2)' }} />
                  <b>{b.brand}</b>
                </button>
              )
            })}
          </div>
          <ChartNote text="Click a brand for the signals that place it." />
        </Card>
      </div>
      <Card title="What it means" sub="Insights involving competitors. Each opens the Insights tab.">
        <InsMini ids={K.what_it_means || []} />
      </Card>
    </>
  )
}

function Changes({ K, me }: { K: Json; me: string }) {
  const { data, L, f } = useApp()
  if (!data || !L) return null
  const D = data.D
  const reg: Json[] = K.registrations_2w_monthly || []
  const last: Json = reg[reg.length - 1] || {}
  const first: Json = reg[0] || {}
  const brands = Object.keys(last).filter((k) => !['month', 'real', 'source'].includes(k))
  const p3: Json = K.passenger_3w_sep_2026 || {}
  const cols: Json[] = K.head_to_head?.columns || []
  const mine: Json = cols.find((c) => c.brand === me) || {}
  const changed: Json[] = (K.what_changed_this_week || []).filter((c: Json) => !f.area || (c.signal?.decision_area || L.sig(c.signal?.rank)?.decision_area) === f.area)
  const rank2w = brands.slice().sort((a, b) => last[b] - last[a])
  const myRank = rank2w.indexOf(me) + 1
  const shareNote: string | undefined = D.settings?.brand?.share_note
  const growth = (b: string) => (first[b] ? Math.round(((last[b] - first[b]) / first[b]) * 100) : null)
  const v = mine.how_people_feel
  const rv = cols.filter((c) => c.brand !== me && c.how_people_feel != null).map((c) => ({ name: c.brand as string, v: c.how_people_feel as number }))

  return (
    <>
      <SoWhat text={K.so_what} />
      <div className="kpis">
        {reg.length ? (
          <>
            <Kpi label={`Two-wheeler registrations, ${dfmt(last.month)}`} value={fmt(last[me])} unit={`#${myRank} of ${brands.length}`} d={<>{rank2w[0]} leads with {fmt(last[rank2w[0]])} · <SrcLink id={last.source} /></>} tag={<Tag kind="real" />} />
            <Kpi label={`Our registrations since ${dfmt(first.month)}`} value={pct(growth(me))} d={brands.filter((b) => b !== me).map((b) => `${b} ${pct(growth(b))}`).join(' · ')} tag={<Tag kind="real" />} />
            <Kpi label="Passenger three-wheelers, Sep 2026" value={(p3.Bajaj_share_pct ?? '—') + '%'} unit="our share" d={<>{fmt(p3.Bajaj)} vs TVS {fmt(p3.TVS)} · Piaggio {fmt(p3.Piaggio)} · <SrcLink id={p3.source} /></>} tag={<Tag kind="real" />} />
          </>
        ) : (
          <>
            <Kpi label="Our share of the conversation" value={(mine.share_pct ?? '—') + '%'} d={`next: ${cols.filter((c) => c.brand !== me).sort((a, b) => (b.share_pct || 0) - (a.share_pct || 0)).slice(0, 2).map((c) => `${c.brand} ${c.share_pct}%`).join(' · ')}`} tip="Share of voice within the monitored conversation; watch the trend, not the level" />
            <div className="kpi">
              <div className="l">How people feel <Info tip={FEEL_TIP} /></div>
              <div className="v"><span className={`fword ${feelCls(v)}`}>{feelWord(v)}</span><small>{signed(v)} net</small></div>
              <FeelGauge v={v} rivals={rv} />
              <div className="d">{rv.map((r) => `${r.name} ${signed(r.v)}`).join(' · ')}</div>
            </div>
            {shareNote ? <Kpi label="Market position (public)" value={shareNote.split(';')[0].replace(/\s*\([^)]*\)/g, '').replace(/^About\s+/i, '≈ ')} d={<SrcLinks ids={D.settings?.brand?.evidence || []} />} tag={<Tag kind="real" />} /> : null}
          </>
        )}
        <Kpi label="Competitors tracked" value={(D.settings?.competitors || []).filter((c: Json) => c.configured).length} d={`${changed.length} changes this week`} tip="Set up in Settings › Competitors" />
      </div>
      <Card title="What changed this week" right={<Tag kind="real" text="Real posts" />} sub="Price, launch, campaign and pack changes, each with a line on what it means for us.">
        <div className="feed">
          {changed.length ? changed.map((c, n) => (
            <div className="it" key={n}>
              <div className="dt">{dshort(c.date)}</div>
              <div>
                <div className="h"><span className="pill neutral">{c.brand}</span> <span className="tag area">{c.type}</span> {c.change}</div>
                <div className="m">{c.what_we_see}</div>
                {L.plain() ? <MeansBox text={c.what_it_means_for_us} /> : <div className="m" style={{ marginTop: 4 }}><b>For us:</b> {c.what_it_means_for_us}</div>}
              </div>
              <div><EvBtn ctx={{ title: c.change, subtitle: `${c.brand} · ${c.type}`, signals: c.signal ? [c.signal.rank] : [], posts: c.evidence_posts || [] }} label="Evidence" /></div>
            </div>
          )) : <div className="empty">No change matches the current filter.</div>}
        </div>
      </Card>
      {(K.early_topics || []).length > 0 && (
        <Card title="Competitor topics we are watching" sub="Forevate will suggest adding a competitor when a topic like this grows.">
          <div className="feed">
            {K.early_topics.map((t: Json, n: number) => (
              <div className="it" key={n} style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto' }}>
                <div><Pill kind={t.outcome === 'no_signal' ? 'neutral' : 'warn'}>{t.outcome === 'no_signal' ? 'No signal yet' : 'Signal, no insight'}</Pill></div>
                <div>
                  <div className="h">{t.label}</div>
                  <div className="m">{t.what_we_see || t.why_it_stopped || 'Too few posts so far to form a signal.'}</div>
                  <div className="meta"><span className="muted small">{t.posts} posts</span></div>
                </div>
                <div><EvBtn ctx={{ title: t.label, posts: t.evidence_posts || [], start: 'posts' }} label="Posts" /></div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

export function CompetitorsView() {
  const { data, sub } = useApp()
  if (!data) return null
  const K: Json = data.D.my_competitors || {}
  const me: string = data.D.global?.brand || data.brand.name
  if (sub === 2) return <SentimentsView cols={K.head_to_head?.columns || []} me={me} />
  if (sub === 1) return <HeadToHead K={K} me={me} />
  return <Changes K={K} me={me} />
}
