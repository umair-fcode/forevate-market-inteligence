/* My Demand tab, ported from VIEWS.demand (original lines 1573-1632). */
import { LineChart, StackedBars } from '../components/charts'
import { BarRows, Card, ChartNote, DemoBanner, Delta, FactorList, Kpi, Legend, Pill, SignalList, SoWhat, SrcLink, Tag } from '../components/ui'
import { Icon } from '../components/Icon'
import { futureFactors, pastFactors } from '../lib/factors'
import { cap, compact, dfmt, dshort, fmt, pct } from '../lib/format'
import { salesOf } from '../lib/lookups'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'

function SalesAhead({ Dm }: { Dm: Json }) {
  const { data, L, f, demandWeek, patch, setFilter } = useApp()
  if (!data || !L) return null
  const sa: Json = Dm.sales_ahead || {}
  const wk: Json[] = sa.weekly_total || []
  const bySku: Json[] = (sa.by_sku || []).filter((s: Json) => !f.sku || s.sku === f.sku)
  const stock: Json[] = (sa.stock_alerts || []).filter((s: Json) => (!f.sku || s.sku === f.sku) && (!f.province || s.province === f.province))
  const bp: Json[] = sa.by_province || []
  const tot = wk.reduce((a, w) => a + w.expected, 0)
  const unit = L.unit()

  const facts = wk.map((w) => futureFactors(data, w.week_ending))
  const si = demandWeek == null || demandWeek >= wk.length ? 0 : demandWeek
  const w = wk[si]
  const F = facts[si] || []
  const dated = (i: number) => facts[i].filter((x) => x.kind !== 'Expectation')
  const mk = wk.map((_, i) => (dated(i).length ? { i, text: dated(i).map((x) => x.text).join('; ') } : null)).filter(Boolean) as { i: number; text: string }[]
  const ups = F.filter((x) => x.dir === 'up').length
  const downs = F.filter((x) => x.dir === 'down').length
  const tight = stock.slice().sort((a, b) => a.weeks_of_cover - b.weeks_of_cover)[0]

  return (
    <>
      {w && (
        <Card
          title="Sales expected ahead · next 12 weeks"
          right={<Tag kind="demo" />}
          sub="Expected sales are demo values; the events and deadlines that shape each week come from real evidence."
          takeaway={`About ${fmt(tot)} ${unit} expected over the next 12 weeks, between ${fmt(wk.reduce((a, x) => a + x.low, 0))} and ${fmt(wk.reduce((a, x) => a + x.high, 0))}. ${mk.length} of the 12 weeks carry a dated event from the market calendar or a decision deadline.`}
        >
          <LineChart
            series={[{ name: `Expected ${unit}`, v: wk.map((x) => x.expected), color: 'var(--c1)', dash: true }]}
            labels={wk.map((x) => dshort(x.week_ending))}
            band={{ low: wk.map((x) => x.low), high: wk.map((x) => x.high) }}
            h={230}
            yFmt={fmt}
            yLabel={`${cap(unit)} per week`}
            xEvery={2}
            points={false}
            markers={mk}
            sel={si}
            onSelect={(i) => patch({ demandWeek: i })}
          />
          <ChartNote text="Click any week to see what will shape it: festivals, fuel revisions, regulation deadlines and decisions due." />
          <Legend items={[{ name: 'Expected (dotted)', color: 'var(--c1)', kind: 'dotted' }, { name: 'Likely range', color: 'var(--accent)' }, { name: 'Dated event in the evidence', color: 'var(--canary)' }]} />
          <div className="selhead" style={{ marginTop: 8 }}>
            <h4>What will shape the week ending {dfmt(w.week_ending)}</h4>
            <div className="nums">
              <span>Expected <b>{fmt(w.expected)}</b> <Tag kind="demo" /></span>
              <span>Range <b>{fmt(w.low)} – {fmt(w.high)}</b></span>
              {ups || downs ? <span>{ups} lifting · {downs} lowering</span> : null}
            </div>
          </div>
          <FactorList F={F} />
        </Card>
      )}
      <div className="grid g2">
        <Card title="By SKU" right={<Tag kind="demo" />}>
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>SKU</th><th className="r">Next 12 weeks</th><th className="r">Range</th><th className="r">vs last 12</th><th>Note</th></tr></thead>
              <tbody>
                {bySku.map((s) => (
                  <tr key={s.sku}>
                    <td className="b">{L.skuShort(s.sku)}</td>
                    <td className="r num">{fmt(s.next_12_weeks_expected ?? s.next_12_weeks_expected_t)}</td>
                    <td className="r num muted">{fmt(s.low)} – {fmt(s.high)}</td>
                    <td className="r">{s.vs_last_12_weeks_pct != null ? <Delta v={s.vs_last_12_weeks_pct} /> : <span className="muted">—</span>}</td>
                    <td className="muted">{s.note || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Running out or too much stock" right={<Tag kind="demo" />} takeaway={stock.length ? `${stock.filter((s) => s.type === 'Running out').length} SKU–region pairs may run out; the tightest is ${L.skuShort(tight.sku)} in ${tight.province} at ${tight.weeks_of_cover} weeks.` : ''}>
          <div className="feed">
            {stock.length ? stock.map((s, n) => (
              <div className="it" key={n} style={{ gridTemplateColumns: 'auto minmax(0,1fr)' }}>
                <div><Pill kind={s.type === 'Running out' ? 'risk' : 'warn'}>{s.type}</Pill></div>
                <div>
                  <div className="h">{L.skuShort(s.sku)} · {s.province}</div>
                  <div className="m">{s.weeks_of_cover} weeks of cover · {s.note || ''}</div>
                </div>
              </div>
            )) : <div className="empty">No stock alert for this filter.</div>}
          </div>
        </Card>
      </div>
      <Card title="Where sales are rising or falling" right={<Tag kind="demo" />} sub={`${cap(unit)} last month by region, with the change and expected direction.`}>
        <BarRows
          onRow={(p) => setFilter('province', f.province === p ? '' : p)}
          rows={bp.map((p) => ({
            l: p.province,
            v: p.units_last_month ?? p.tonnes_last_month,
            key: p.province,
            hl: f.province === p.province,
            tip: `${p.province}: ${fmt(p.units_last_month ?? p.tonnes_last_month)} ${unit} last month (${pct(p.change_pct)})${p.expected_next_month ? ', expected ' + p.expected_next_month : ''}`,
          }))}
        />
        <div className="chips" style={{ marginTop: 6 }}>
          {bp.some((p) => p.expected_next_month)
            ? bp.map((p) => (
                <span key={p.province} className="chip static">
                  {p.province}{' '}
                  {p.expected_next_month === 'rising' ? <span style={{ color: 'var(--good)' }}><Icon name="up" size={11} /></span> : p.expected_next_month === 'falling' ? <span style={{ color: 'var(--risk)' }}><Icon name="down" size={11} /></span> : '→'}
                </span>
              ))
            : bp.map((p) => <span key={p.province} className="chip static">{p.province} <Delta v={p.change_pct} /></span>)}
        </div>
      </Card>
    </>
  )
}

function Channels({ Dm }: { Dm: Json }) {
  const ch: Json = Dm.channels || {}
  const colors = ['var(--c1)', 'var(--c2)', 'var(--c4)']
  const s: Json[] = ch.series || []
  const last = s.map((x) => x.share_pct[x.share_pct.length - 1])
  const first = s.map((x) => x.share_pct[0])
  const grow = s.map((x, i) => ({ n: x.channel, d: last[i] - first[i] })).sort((a, b) => b.d - a.d)[0]
  return (
    <>
      <SoWhat text={Dm.so_what} tag={<Tag kind="demo" />} />
      <div className="kpis">
        {ch.financed_share_pct != null && <Kpi label="Sales on finance" value={ch.financed_share_pct + '%'} d={<>{ch.financed_note || ''} <SrcLink id="R04" /></>} tag={<Tag kind="real" />} />}
        {s.map((x, i) => <Kpi key={x.channel} label={x.channel} value={last[i] + '%'} d={<Delta v={last[i] - first[i]} suffix=" pts" vs={`since ${dfmt(ch.months?.[0])}`} />} tag={<Tag kind="demo" />} />)}
      </div>
      <Card title="Channel mix" right={<Tag kind="demo" />} sub={ch.labels_note || ''} takeaway={grow ? `${grow.n} is gaining share (${grow.d > 0 ? '+' : ''}${grow.d} points in three months).` : ''}>
        <StackedBars groups={(ch.months || []).map(dfmt)} series={s.map((x, i) => ({ name: x.channel, v: x.share_pct, color: colors[i] }))} />
        <Legend items={s.map((x, i) => ({ name: x.channel, color: colors[i] }))} />
      </Card>
    </>
  )
}

function Overview({ Dm }: { Dm: Json }) {
  const { data, L, demandMonth, patch } = useApp()
  if (!data || !L) return null
  const ov: Json = Dm.overview || {}
  const sp: Json = ov.sales_pulse || {}
  const es: Json[] = ov.early_signs_vs_sales || []
  const unit = L.unit()
  const anchor = L.realAnchor()
  const labels = es.map((m) => dfmt(m.month))
  const realPts = es.filter((m) => m.real).length
  const beat = es.filter((m) => salesOf(m) >= m.expected).length
  const facts = es.map((m) => pastFactors(data, L, m.month))
  const si = demandMonth == null || demandMonth >= es.length ? es.length - 1 : demandMonth
  const m = es[si]
  const F = facts[si] || []
  const mk = es.map((_, i) => (facts[i].length ? { i, text: `${facts[i].length} factor${facts[i].length === 1 ? '' : 's'} identified` } : null)).filter(Boolean) as { i: number; text: string }[]
  const dp = m && m.expected ? Math.round(((salesOf(m) - m.expected) / m.expected) * 100) : null
  const monthsWithFactors = facts.filter((x) => x.length).length

  return (
    <>
      <div className="kpis">
        <Kpi label={`${cap(unit)} sold, ${sp.period || ''}`} value={fmt(salesOf(sp))} d={<Delta v={sp.vs_last_month_pct} vs="vs last month" />} tag={realPts ? <Tag kind="real" text="Real" tip={`Matches ${anchor}`} /> : <Tag kind="demo" />} />
        <Kpi label="Expected vs real" value={fmt(sp.expected)} unit="expected" d={<Delta v={sp.real_vs_expected_pct} vs="real above expectation" />} tag={<Tag kind="demo" />} tip="Forecast vs actual" />
        <Kpi label="Months where real beat expected" value={<>{beat}<small>of {es.length}</small></>} d={realPts ? `${realPts} months anchored on ${anchor}` : 'all months are demo values'} tag={<Tag kind="demo" />} />
        <Kpi label="Months with factors identified" value={<>{monthsWithFactors}<small>of {es.length}</small></>} d="from cost moves, competitor changes, campaigns and public data" tag={<Tag kind="real" />} />
      </div>
      {m && (
        <Card
          title="Early signs vs sales"
          right={realPts ? <Tag kind="demo" text={`Demo, anchored on ${anchor}`} /> : <Tag kind="demo" />}
          sub={Dm.data_note || ''}
          takeaway={`Sales beat expectation in ${beat} of ${es.length} months. ${monthsWithFactors} of the ${es.length} months have factors identified from real evidence: cost moves, competitor changes, campaigns, alerts${realPts ? ' and ' + anchor : ''}.`}
        >
          <LineChart
            series={[{ name: 'Sales', v: es.map((x) => salesOf(x)), color: 'var(--c1)' }, { name: 'Expected', v: es.map((x) => x.expected), color: 'var(--c5)', dash: true }]}
            labels={labels}
            markers={mk}
            h={240}
            yFmt={compact}
            yLabel={`${cap(unit)} per month`}
            hollow={(sr, i) => sr.name === 'Sales' && !es[i].real}
            sel={si}
            onSelect={(i) => patch({ demandMonth: i })}
          />
          <ChartNote text={realPts ? `Click any month to see the factors that shaped it. Filled points are ${anchor}; hollow points are demo values.` : 'Click any month to see the factors that shaped it. All sales points are demo values; the factors come from real evidence.'} />
          <Legend items={[{ name: realPts ? 'Sales (filled = published, hollow = demo)' : 'Sales (demo)', color: 'var(--c1)', kind: 'line' }, { name: 'Expected', color: 'var(--c5)', kind: 'dotted' }, { name: 'Factors identified in the evidence', color: 'var(--canary)' }]} />
          <div className="selhead" style={{ marginTop: 8 }}>
            <h4>What shaped {dfmt(m.month)}</h4>
            <div className="nums">
              <span>Sales <b>{fmt(salesOf(m))}</b> <small className="muted">{unit}</small> {m.real ? <Tag kind="real" text="Real" /> : <Tag kind="demo" />}</span>
              <span>Expected <b>{fmt(m.expected)}</b></span>
              <span><Delta v={dp} vs="vs expected" /></span>
            </div>
          </div>
          <FactorList F={F} />
        </Card>
      )}
      <div className="grid g2">
        <Card title="Did our past decisions work?" right={<Tag kind="demo" />} sub="Linked from the action tracker in Insights.">
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>Decision</th><th>Before</th><th>After</th><th className="r">Change</th><th>Verdict</th></tr></thead>
              <tbody>
                {(ov.decision_results || []).map((r: Json, n: number) => (
                  <tr key={n}>
                    <td className="b">{r.action}<div className="muted small">{r.sku}</div></td>
                    <td>{r.before}</td>
                    <td>{r.after}</td>
                    <td className="r num"><Delta v={r.change_pct} /></td>
                    <td><Pill kind={r.verdict === 'Worked' ? 'good' : r.verdict === 'Too early' ? 'neutral' : 'warn'}>{r.verdict}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Early signs to watch for sales" right={<Tag kind="real" text="Real signals" />}>
          <SignalList sigs={Dm.signals_to_watch || []} title="Demand early signs" />
        </Card>
      </div>
    </>
  )
}

export function DemandView() {
  const { data, L, sub, go } = useApp()
  if (!data || !L) return null
  const Dm: Json = data.D.my_demand || {}
  const anyReal = (Dm.overview?.early_signs_vs_sales || []).some((m: Json) => m.real)
  const banner = Dm.demo ? (
    <DemoBanner
      note={Dm.demo_note || ''}
      extra={
        <span className="muted">
          Connect sales data (Level 2) in <button className="linkbtn" onClick={() => go('settings', 4)}>Settings › Integrations</button>.
          {anyReal ? <> Points marked <Tag kind="real" /> match {L.realAnchor()}.</> : null}
        </span>
      }
    />
  ) : null

  if (sub === 2) return <>{banner}<Channels Dm={Dm} /></>
  if (sub === 1) return <>{banner}<SoWhat text={Dm.so_what} tag={<Tag kind="demo" />} /><SalesAhead Dm={Dm} /></>
  return <>{banner}<SoWhat text={Dm.so_what} tag={<Tag kind="demo" />} /><Overview Dm={Dm} /></>
}
