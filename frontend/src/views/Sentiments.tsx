/* Sentiments sub-tab of My Competitors (original sentimentsView, lines 1460-1516). */
import { useState } from 'react'
import { LineChart } from '../components/charts'
import { DivRows, FEEL_TIP, FeelCell, FeelGauge, feelCls, feelWord } from '../components/feel'
import { Card, ChartNote, EvBtn, Info, Kpi, Legend, MeansBox, ScopeTag, SoWhat } from '../components/ui'
import { activeFilters, matchSig } from '../lib/filters'
import { compact, dfmt, signed } from '../lib/format'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'
import { useEvidence } from '../store/EvidenceContext'

const engagementOf = (x: Json) => x.total_evidence_engagement || x.engagement || 0

function feelScore(rs: Json[]): number | null {
  if (!rs.length) return null
  const w = rs.reduce((a, x) => a + engagementOf(x), 0)
  if (!w) return Math.round((100 * rs.reduce((a, x) => a + (x.sentiment_score || 0), 0)) / rs.length)
  return Math.round((100 * rs.reduce((a, x) => a + (x.sentiment_score || 0) * engagementOf(x), 0)) / w)
}
const sentSplit = (rs: Json[]) => ({
  pos: rs.filter((x) => x.sentiment === 'Positive').length,
  neu: rs.filter((x) => x.sentiment !== 'Positive' && x.sentiment !== 'Negative').length,
  neg: rs.filter((x) => x.sentiment === 'Negative').length,
})
const joinNames = (l: string[]) => (l.length > 1 ? l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1] : l[0])

export function SentimentsView({ cols, me }: { cols: Json[]; me: string }) {
  const { data, L, f } = useApp()
  const { openEvidence } = useEvidence()
  const [sentBrand, setSentBrand] = useState('')
  if (!data || !L) return null
  const filtered = activeFilters(f).length > 0

  const brands = cols.map((c, i) => {
    const all = (c.signals || []).map((r: number) => L.sig(r)).filter(Boolean) as Json[]
    const rs = all.filter((s) => matchSig(f, L, s))
    return {
      name: c.brand as string,
      me: c.brand === me,
      rs,
      score: !rs.length ? null : !filtered && c.how_people_feel != null ? (c.how_people_feel as number) : feelScore(rs),
      color: c.brand === me ? 'var(--c1)' : `var(--c${Math.min(i + 1, 5)})`,
    }
  })
  const scored = brands.filter((b) => b.score != null)
  const mine = brands.find((b) => b.me) || brands[0]
  if (!mine) return <div className="empty">No competitor columns in this brand's data.</div>
  const pick = brands.find((b) => b.name === sentBrand) || mine
  const thin = (b: { rs: Json[] }) => b.rs.length < 5
  const warm = scored.slice().sort((a, b) => b.score! - a.score!)[0]
  const nNeg = scored.reduce((a, b) => a + sentSplit(b.rs).neg, 0)
  const rivals = scored.filter((b) => !b.me)
  const lead = rivals.filter((b) => b.score! > (mine.score ?? -999))
  const mineSplit = sentSplit(mine.rs)

  const so =
    mine.score == null
      ? 'Not enough early signs about our brand match the current filter to read the feeling.'
      : `People feel ${feelWord(mine.score).toLowerCase()} about ${me} (${signed(mine.score)}) across ${mine.rs.length} early signs. ` +
        (lead.length
          ? `${joinNames(lead.map((b) => `${b.name} (${signed(b.score)}${thin(b) ? ', ' + b.rs.length + ' sign' + (b.rs.length === 1 ? '' : 's') : ''})`))} ${lead.length === 1 ? 'scores' : 'score'} warmer` + (lead.every(thin) ? ', but on thin evidence, so read it as direction rather than a measured gap.' : '.')
          : 'No tracked competitor scores warmer.') +
        (nNeg ? ` ${nNeg} early sign${nNeg === 1 ? ' is' : 's are'} negative.` : ' None of the early signs is negative.')

  /* Feeling by brand */
  const divided = rivals.filter((b) => sentSplit(b.rs).neg).sort((a, b) => sentSplit(b.rs).neg / b.rs.length - sentSplit(a.rs).neg / a.rs.length)[0]
  const byBrandTakeaway =
    `${mineSplit.pos} of our ${mine.rs.length} early signs are positive, ${mineSplit.neu} neutral and ${mineSplit.neg} negative.` +
    (divided ? ` ${divided.name} is the most divided: ${sentSplit(divided.rs).neg} of its ${divided.rs.length} signs ${sentSplit(divided.rs).neg === 1 ? 'is' : 'are'} negative.` : '')

  /* What drives the feeling: brand x decision area */
  const areas: string[] = data.D.global?.decision_areas || ['Product', 'Pricing', 'Availability', 'Promotion']
  const shown = brands.filter((b) => b.rs.length)
  const ourAreas: { a: string; v: number }[] = []
  areas.forEach((a) => {
    const rs = mine.rs.filter((x) => x.decision_area === a)
    if (rs.length) ourAreas.push({ a, v: feelScore(rs)! })
  })
  ourAreas.sort((a, b) => a.v - b.v)

  /* Deep dive */
  const ranked = pick.rs.slice().sort((a, b) => (b.sentiment_score || 0) - (a.sentiment_score || 0))
  const lifts = ranked.filter((x) => (x.sentiment_score || 0) >= 0.35).slice(0, 4)
  const drags = ranked.slice().reverse().filter((x) => (x.sentiment_score || 0) < 0.35 && !lifts.includes(x)).slice(0, 4)
  const sigRow = (x: Json) => (
    <div className="it" key={x.rank} style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto' }}>
      <div><FeelCell v={Math.round((x.sentiment_score || 0) * 100)} /></div>
      <div>
        <div className="sigline"><span className="rk">#{x.rank}</span><b>{x.title}</b></div>
        <div className="m">{x.what_we_see}</div>
        <MeansBox text={x.what_it_means_for_brand} />
        <div className="meta">
          <span className="tag area">{x.type || ''}</span>
          <span className="tag area">{x.decision_area || ''}</span>
          <span className="muted small">{compact(engagementOf(x))} engagement</span>
          <ScopeTag scope={x.evidence_scope} />
        </div>
      </div>
      <div><EvBtn ctx={{ title: x.title, subtitle: `Signal #${x.rank} · ${x.sentiment}`, signals: [x.rank] }} label="Evidence" /></div>
    </div>
  )
  const types: Record<string, Json[]> = {}
  pick.rs.forEach((x) => (types[x.type || 'Other'] = types[x.type || 'Other'] || []).push(x))
  const typeRows = Object.entries(types)
    .map(([t, rs]) => ({ l: `${t} (${rs.length})`, v: feelScore(rs)!, tip: `${t}: ${rs.length} early sign${rs.length === 1 ? '' : 's'}`, ev: { title: `${pick.name} · ${t}`, subtitle: `${rs.length} early signs of this kind`, signals: rs.map((x) => x.rank) } }))
    .sort((a, b) => b.v - a.v)

  /* Over time */
  const months = Array.from(new Set(shown.flatMap((b) => b.rs.map((x) => (x.latest_evidence_date || '').slice(0, 7))).filter(Boolean))).sort()
  const series = shown.filter((b) => b.rs.length >= 2).map((b) => ({
    name: b.name,
    color: b.color,
    v: months.map((m) => {
      const rs = b.rs.filter((x) => (x.latest_evidence_date || '').startsWith(m))
      return rs.length ? feelScore(rs) : null
    }),
  }))

  return (
    <>
      <SoWhat text={so} />
      <div className="kpis">
        <div className="kpi">
          <div className="l">How people feel about us <Info tip={FEEL_TIP} /></div>
          <div className="v"><span className={`fword ${feelCls(mine.score)}`}>{feelWord(mine.score)}</span><small>{signed(mine.score)} net</small></div>
          <FeelGauge v={mine.score as number} rivals={rivals.map((b) => ({ name: b.name, v: b.score as number }))} />
          <div className="d">from {mine.rs.length} early signs</div>
        </div>
        <Kpi label="Warmest brand" value={warm ? warm.name : '—'} d={warm ? `${feelWord(warm.score)} · ${signed(warm.score)} · ${warm.rs.length} early sign${warm.rs.length === 1 ? '' : 's'}` : ''} tip="The brand whose conversation is most positive, weighted by engagement" />
        <Kpi label="Negative early signs" value={nNeg} unit={`of ${scored.reduce((a, b) => a + b.rs.length, 0)}`} d={`${mineSplit.neg} about us · ${nNeg - mineSplit.neg} about competitors`} tip="Early signs whose overall tone is negative" />
        <Kpi label="Evidence depth" value={<>{mine.rs.length}<small>signs on us</small></>} d={rivals.length ? rivals.map((b) => `${b.name} ${b.rs.length}`).join(' · ') : ''} tip="How many early signs each score rests on. Fewer than 5 is thin evidence." />
      </div>

      <Card title="Feeling by brand" takeaway={byBrandTakeaway} sub={FEEL_TIP + ' Brands with fewer than 5 early signs are marked thin.'}>
        <div className="sentrows">
          {brands.map((b) => {
            const sp = sentSplit(b.rs)
            const n = b.rs.length || 1
            const act = b.rs.length
              ? () => openEvidence({ title: `${b.name} · how people feel`, subtitle: `${feelWord(b.score)} (${signed(b.score)}) · ${b.rs.length} early signs · ${sp.pos} positive, ${sp.neu} neutral, ${sp.neg} negative`, signals: b.rs.map((x) => x.rank) })
              : undefined
            return (
              <div
                key={b.name}
                className={`srow ${b.rs.length ? 'ev' : ''} ${b.me ? 'me' : ''}`}
                {...(act ? { role: 'button', tabIndex: 0, onClick: act, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act() } }, 'data-tip': `Click for the early signs and posts behind ${b.name}'s score` } : {})}
              >
                <span className="nm">{b.name}{b.me ? <> <span className="tag real">Us</span></> : null}</span>
                {b.score == null ? (
                  <span className="muted small" style={{ gridColumn: 'span 3' }}>No early signs in the monitored conversation{filtered ? ' for this filter' : ''}</span>
                ) : (
                  <>
                    <span className="tr"><b className={b.score >= 0 ? 'pos' : 'neg'} style={{ width: `${Math.min(50, Math.abs(b.score) / 2)}%` }} /></span>
                    <span className="fcell"><span className={`w ${feelCls(b.score)}`}>{feelWord(b.score)}</span><span className="n">{signed(b.score)}</span></span>
                    <span className="mix">
                      <span className="splitbar" style={{ height: 8 }}>
                        {sp.pos ? <i style={{ width: `${(sp.pos / n) * 100}%`, background: 'var(--good)' }} /> : null}
                        {sp.neu ? <i style={{ width: `${(sp.neu / n) * 100}%`, background: 'var(--c5)' }} /> : null}
                        {sp.neg ? <i style={{ width: `${(sp.neg / n) * 100}%`, background: 'var(--risk)' }} /> : null}
                      </span>
                      <span className="muted small">{b.rs.length} sign{b.rs.length === 1 ? '' : 's'}{thin(b) ? ' · thin' : ''}</span>
                    </span>
                  </>
                )}
              </div>
            )
          })}
          <div className="daxis srow-axis">
            <span />
            <span><span>−100</span><span>0</span><span>+100</span></span>
            <span />
            <span className="muted"><Legend items={[{ name: 'Positive', color: 'var(--good)' }, { name: 'Neutral', color: 'var(--c5)' }, { name: 'Negative', color: 'var(--risk)' }]} /></span>
          </div>
        </div>
        <ChartNote text="Click a brand for the early signs and posts behind its score." />
      </Card>

      <Card
        title="What drives the feeling"
        sub="The same feeling score, split by the decision area each early sign is about."
        takeaway={ourAreas.length ? `Our warmest area is ${ourAreas[ourAreas.length - 1].a.toLowerCase()} (${signed(ourAreas[ourAreas.length - 1].v)}); our coolest is ${ourAreas[0].a.toLowerCase()} (${signed(ourAreas[0].v)}).` : ''}
      >
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Decision area</th>{shown.map((b) => <th key={b.name} style={b.me ? { color: 'var(--accent)' } : undefined}>{b.name}</th>)}</tr></thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a}>
                  <td className="b">{a}</td>
                  {shown.map((b) => {
                    const rs = b.rs.filter((x) => x.decision_area === a)
                    if (!rs.length) return <td key={b.name} className="muted">—</td>
                    const v = feelScore(rs)!
                    return (
                      <td key={b.name}>
                        <button
                          className="mcell"
                          onClick={() => openEvidence({ title: `${b.name} · ${a}`, subtitle: `${feelWord(v)} (${signed(v)}) from ${rs.length} early sign${rs.length === 1 ? '' : 's'} about ${a.toLowerCase()}`, signals: rs.map((x) => x.rank) })}
                          data-tip={`${b.name} · ${a}: ${feelWord(v)} (${signed(v)}), ${rs.length} sign${rs.length === 1 ? '' : 's'} · click for evidence`}
                        >
                          <FeelCell v={v} /><span className="muted tiny">{rs.length}</span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ChartNote text="Click any cell for the early signs behind it. The small number is how many signs the cell rests on." />
      </Card>

      <Card
        title={`Inside ${pick.name}'s feeling`}
        sub="The early signs that raise and lower this brand's score, and how the feeling differs by kind of conversation (identity, frustration, rituals and so on)."
        takeaway={lifts[0] ? `The strongest lift is "${lifts[0].title}"${drags[0] && drags[0] !== lifts[0] ? `; the weakest note is "${drags[0].title}"` : ''}.` : ''}
      >
        <div className="chips" style={{ alignItems: 'center' }}>
          <span className="muted small">Brand</span>
          {shown.map((b) => <button key={b.name} className={`chip ${b.name === pick.name ? 'on' : ''}`} onClick={() => setSentBrand(b.name)}>{b.name}</button>)}
        </div>
        <div className="grid g2">
          <div><div className="sect-title" style={{ marginBottom: 4 }}>What lifts it</div><div className="feed">{lifts.length ? lifts.map(sigRow) : <div className="empty">No positive early signs.</div>}</div></div>
          <div><div className="sect-title" style={{ marginBottom: 4 }}>What holds it back</div><div className="feed">{drags.length ? drags.map(sigRow) : <div className="empty">No negative or lukewarm early signs. Everything said about this brand leans clearly positive.</div>}</div></div>
        </div>
        <div className="sect-title" style={{ marginTop: 6 }}>Feeling by kind of conversation</div>
        {typeRows.length ? <DivRows rows={typeRows} /> : <div className="empty">No early signs.</div>}
      </Card>

      {months.length >= 2 && series.length > 0 && (
        <Card title="Feeling over time" sub="Each early sign is placed in the month of its latest evidence post; the score per month is engagement-weighted. Brands with fewer than 2 signs are left off.">
          <LineChart
            series={series}
            labels={months.map(dfmt)}
            h={220}
            yFmt={(v) => signed(Math.round(v))}
            yLabel="How people feel, by month of latest evidence"
            pointEv={(i) => {
              const rs = shown.flatMap((b) => b.rs.filter((x) => (x.latest_evidence_date || '').startsWith(months[i])))
              return rs.length ? { title: `Early signs · ${dfmt(months[i])}`, subtitle: `${rs.length} early signs whose latest evidence is from this month`, signals: rs.map((x) => x.rank) } : null
            }}
          />
          <ChartNote text="Click a month for the early signs dated to it. Gaps mean no early sign for that brand that month." />
          <Legend items={series.map((x) => ({ name: x.name, color: x.color, kind: 'line' }))} />
        </Card>
      )}
    </>
  )
}
