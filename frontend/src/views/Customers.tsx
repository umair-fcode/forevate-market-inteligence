/* My Customers tab, ported from VIEWS.customers (original lines 1375-1405). */
import { BarRows, Card, DemoBanner, Delta, Kpi, Pill, SoWhat, SrcLink, Tag } from '../components/ui'
import { Icon } from '../components/Icon'
import { dfmt, fmt, pct } from '../lib/format'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'

const Stars = ({ n }: { n: number }) => (
  <span style={{ color: 'var(--canary)', display: 'inline-flex' }} aria-label={`${n} of 5`}>
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ width: 13, height: 13, display: 'inline-block', opacity: i < n ? undefined : 0.25 }}><Icon name="star" /></span>
    ))}
  </span>
)

function Feedback({ C }: { C: Json }) {
  const { L, f, setFilter } = useApp()
  if (!L) return null
  const ct: Json[] = (C.feedback?.complaint_tracker || []).filter((c: Json) => !f.sku || c.sku === f.sku)
  const cbp: Json[] = C.feedback?.complaints_by_province || []
  const rf: Json[] = (C.feedback?.review_feed || []).filter((r: Json) => (!f.sku || r.sku === f.sku) && (!f.province || r.province === f.province))
  const top = ct.slice().sort((a, b) => b.count_30d - a.count_30d)[0]
  const topP = cbp.slice().sort((a, b) => b.complaints - a.complaints)[0]
  const sentKind = (se: string) => (se === 'positive' ? 'Positive' : se === 'negative' ? 'Negative' : 'Mixed')
  return (
    <>
      <div className="grid g2">
        <Card title="Complaint tracker" right={<Tag kind="demo" />} sub="Issues by type with their trend." takeaway={top ? `"${top.issue}" is the biggest complaint (${fmt(top.count_30d)} in 30 days, ${pct(top.change_pct)}).` : ''}>
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>Issue</th><th className="r">Last 30 days</th><th className="r">Change</th><th>SKU</th></tr></thead>
              <tbody>
                {ct.map((c, n) => (
                  <tr key={n}>
                    <td className="b">{c.issue}</td>
                    <td className="r num">{fmt(c.count_30d)}</td>
                    <td className="r"><Delta v={c.change_pct} bad /></td>
                    <td>{c.sku ? <span className="tag area">{L.skuShort(c.sku)}</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Complaints by region" right={<Tag kind="demo" />} takeaway={topP ? `${topP.province} has the most complaints; its top issue is "${topP.top_issue}". A cluster in one region often points to a batch or distribution problem.` : ''}>
          <BarRows
            onRow={(p) => setFilter('province', f.province === p ? '' : p)}
            rows={cbp.map((p) => ({ l: p.province, v: p.complaints, key: p.province, hl: f.province === p.province, tip: `${p.province}: ${fmt(p.complaints)} complaints · top issue ${p.top_issue}` }))}
          />
        </Card>
      </div>
      <Card title="Review feed" right={<Tag kind="demo" text="Demo reviews" tip="Illustrative reviews; links go to demo.forevate.ai" />} sub="Reviews with their source. Real reviews appear here once a review portal is connected.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rf.length ? rf.map((r, n) => {
            const se = r.sentiment || (r.rating >= 4 ? 'positive' : r.rating <= 2 ? 'negative' : 'mixed')
            return (
              <article className="post" key={n}>
                <div className="ph2">
                  <span className="plat">{r.source}</span>
                  {r.place ? <span className="au">{r.place}</span> : null}
                  <Stars n={r.rating} />
                  <span className="muted">· {dfmt(r.date)}</span>
                  {r.language ? <span className="muted">· {r.language}</span> : null}
                  {r.demo ? <Tag kind="demo" /> : null}
                </div>
                <div className="tx">{r.text}</div>
                {r.translation ? <div className="md">Translation: {r.translation}</div> : null}
                <div className="st">
                  <Pill kind={sentKind(se)}>{se}</Pill>
                  {r.sku ? <span className="tag area">{L.skuShort(r.sku)}</span> : null}
                  <span>{r.province || ''}</span>
                  <a className="btn sm open" href={r.url} target="_blank" rel="noopener">Open review <Icon name="ext" /></a>
                </div>
              </article>
            )
          }) : <div className="empty">No review matches the current filter.</div>}
        </div>
      </Card>
    </>
  )
}

export function CustomersView() {
  const { data, sub, go } = useApp()
  if (!data) return null
  const C: Json = data.D.my_customers || {}
  const cp: Json = C.overview?.customer_pulse || {}
  const banner = C.demo ? (
    <DemoBanner
      note={C.demo_note || 'No CRM or review source is connected yet.'}
      extra={<span className="muted">Connect a CRM, review portal or call-centre feed in <button className="linkbtn" onClick={() => go('settings', 4)}>Settings › Integrations</button> and these screens fill with your real customers.</span>}
    />
  ) : null
  const demoTag = <Tag kind="demo" />

  if (sub === 1) {
    return <>{banner}<SoWhat text={C.so_what} tag={demoTag} /><Feedback C={C} /></>
  }
  if (sub === 2) {
    const ar: Json = C.customers_we_may_lose || {}
    const list: Json[] = ar.at_risk || []
    const largest = list.slice().sort((a, b) => b.customers - a.customers)[0]
    return (
      <>
        {banner}
        <SoWhat text={C.so_what} tag={demoTag} />
        <div className="banner note">
          <Icon name="info" />
          <div><b>What this unlocks.</b> With a connected CRM, Forevate matches customer records to early signs (lease end dates, service gaps, competitor page views) and lists the groups most likely to leave, with a suggested action for each. Shown here with illustrative groups from the demo CRM (<SrcLink id={ar.source || 'S02'} />).</div>
        </div>
        <Card title="Customers we may lose" right={demoTag} sub="Opens by persona. Needs a connected CRM." takeaway={list.length ? `${fmt(list.reduce((a, b) => a + b.customers, 0))} customers across ${list.length} groups show signs of leaving; the largest is "${largest.group}".` : ''}>
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>Group</th><th className="r">Customers</th><th>Why</th><th>Suggested action</th></tr></thead>
              <tbody>
                {list.map((a, n) => <tr key={n}><td className="b">{a.group}</td><td className="r num">{fmt(a.customers)}</td><td>{a.why}</td><td>{a.suggested_action}</td></tr>)}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    )
  }

  const love: Json[] = C.overview?.why_they_love_us || []
  const leave: Json[] = C.overview?.why_they_leave || []
  return (
    <>
      {banner}
      <SoWhat text={C.so_what} tag={demoTag} />
      <div className="kpis">
        <Kpi label="Average rating" value={cp.average_rating ?? '—'} unit="of 5" d={<Delta v={+(cp.average_rating - cp.average_rating_prev).toFixed(1)} suffix="" vs="vs last month" />} tag={demoTag} />
        <Kpi label="Reviews in 30 days" value={fmt(cp.reviews_30d)} d={<Delta v={cp.reviews_change_pct} vs="vs previous 30 days" />} tag={demoTag} />
        <Kpi label="Complaint rate" value={cp.complaint_rate_pct + '%'} d={<Delta v={+(cp.complaint_rate_pct - cp.complaint_rate_prev_pct).toFixed(1)} bad suffix=" pts" vs="vs last month" />} tag={demoTag} />
        <Kpi label="Satisfaction" value={cp.satisfaction_pct + '%'} d={<Delta v={cp.satisfaction_pct - cp.satisfaction_prev_pct} suffix=" pts" vs="vs last month" />} tag={demoTag} />
      </div>
      <div className="grid g2">
        <Card title="Why they love us" right={demoTag} takeaway={love[0] ? `"${love[0].reason}" is the top reason to stay (${love[0].share_pct}% of positive reviews).` : ''}>
          <BarRows max={100} rows={love.map((l) => ({ l: l.reason, v: l.share_pct, vl: l.share_pct + '%', cls: 'pos' }))} />
        </Card>
        <Card title="Why they leave" right={demoTag} takeaway={leave[0] ? `"${leave[0].reason}" is the top reason to leave (${leave[0].share_pct}% of complaints).` : ''}>
          <BarRows max={100} rows={leave.map((l) => ({ l: l.reason, v: l.share_pct, vl: l.share_pct + '%', cls: 'neg' }))} />
        </Card>
      </div>
    </>
  )
}
