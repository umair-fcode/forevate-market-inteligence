/* TEMPORARY: exercises the shared components against real brand data. Open with ?showcase. Removed in step 10. */
import { BarRows, Card, ChartNote, Delta, Dir, EvBtn, InsMini, Kpi, Legend, Meter, Pill, SignalList, SoWhat, SrcLinks, Tag } from '../components/ui'
import { GroupedBars, LineChart, StackedBars } from '../components/charts'
import { compact } from '../lib/format'
import { useApp } from '../store/AppContext'
import { useUI } from '../store/UIContext'

export function Showcase() {
  const { data, L } = useApp()
  const { toast } = useUI()
  if (!data || !L) return null
  const D = data.D
  const ranks: number[] = (D.signal_index || []).slice(0, 12).map((s: { rank: number }) => s.rank)
  const skus: { id: string }[] = (D.settings?.skus || []).slice(0, 6)
  const labels = ranks.map((r) => '#' + r)
  const eng = ranks.map((r) => L.sig(r)?.engagement || L.sig(r)?.total_evidence_engagement || 0)
  const sure = ranks.map((r) => L.sig(r)?.how_sure_we_are || 0)
  const insights: string[] = (D.insights?.detailed_insights || []).slice(0, 2).map((i: { id: string }) => i.id)
  const srcIds: string[] = (D.sources || []).slice(0, 3).map((s: { id: string }) => s.id)
  const colors = ['var(--accent)', 'var(--canary)', 'var(--good)']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SoWhat text="Showcase of shared components rendered from this brand's real data." tag={<Tag kind="real" />} />
      <div className="kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <Kpi label="Signals" value={ranks.length} tip="Number of signals shown" d={<Delta v={4.2} vs="vs last week" />} />
        <Kpi label="Engagement" value={compact(eng.reduce((a, b) => a + b, 0))} d={<Delta v={-2.5} bad />} />
        <Kpi label="Direction" value={<Dir d="up" />} d={<Dir d="mixed" />} />
        <Kpi label="Sure" value={<Meter v={sure[0] || 60} />} unit="" d={<Pill kind="Risk">Risk</Pill>} />
      </div>
      <Card title="Engagement by signal (line)" sub="Hover a point for details; click opens the evidence panel." takeaway="Real engagement from the first signals." right={<EvBtn ctx={{ title: 'All shown signals', signals: ranks }} />}>
        <LineChart labels={labels} series={[{ name: 'Engagement', v: eng, color: colors[0] }]} pointEv={(i) => ({ title: labels[i], signals: [ranks[i]] })} markers={[{ i: 3, text: 'Marker' }]} />
        <Legend items={[{ name: 'Engagement', color: colors[0] }]} />
        <ChartNote text="Each point links to the signal behind it." />
      </Card>
      <Card title="Grouped and stacked bars">
        <GroupedBars groups={labels.slice(0, 5)} series={[{ name: 'Engagement', v: eng.slice(0, 5), color: colors[0] }, { name: 'Sure', v: sure.slice(0, 5), color: colors[1] }]} barEv={(g) => ({ signals: [ranks[g]], title: labels[g] })} />
        <StackedBars groups={['A', 'B', 'C']} series={[{ name: 'Pos', v: [50, 30, 20], color: colors[2] }, { name: 'Mixed', v: [30, 40, 30], color: colors[1] }, { name: 'Neg', v: [20, 30, 50], color: 'var(--risk)' }]} />
      </Card>
      <Card title="Bar rows (click for evidence)">
        <BarRows rows={skus.map((s, i) => ({ l: L.skuShort(s.id), v: 100 - i * 14, tip: L.skuName(s.id), ev: { title: L.skuName(s.id), signals: ranks.slice(i, i + 2) } }))} />
      </Card>
      <Card title="Signals, insights and sources">
        <SignalList sigs={ranks} limit={3} />
        <InsMini ids={insights} />
        <div><SrcLinks ids={srcIds} /> <button className="btn sm" onClick={() => toast('Toast works')}>Toast</button></div>
      </Card>
    </div>
  )
}
