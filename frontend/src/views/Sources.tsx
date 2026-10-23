/* Sources & data tab, ported from VIEWS.sources (original lines 1684-1692). */
import { Icon } from '../components/Icon'
import { Card, Kpi, Tag } from '../components/ui'
import { dfmt, fmt } from '../lib/format'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'

export function SourcesView() {
  const { data } = useApp()
  if (!data) return null
  const D = data.D
  const src: Json[] = D.sources || []
  const rm: Json = D._readme || {}
  const real = src.filter((s) => s.real)
  const demo = src.filter((s) => !s.real)
  const groups: Record<string, Json[]> = {}
  real.forEach((s) => (groups[s.type] = groups[s.type] || []).push(s))
  const methods: [string, string | undefined][] = [
    ['Purpose', rm.purpose],
    ['Real vs demo', rm.real_vs_demo],
    ['Signal ids', rm.signal_ids],
    ['Excluded signals', rm.excluded_signals],
    ['How people feel', rm.plain_labels?.how_people_feel + ' · ' + (D.my_brand?.data_basis?.how_people_feel_method || '')],
    ['Who is speaking', D.my_brand?.data_basis?.voice_method],
    ['Region', D.my_brand?.conversations?.location_note],
    ['Share of conversation', D.my_brand?.overview?.brand_pulse?.share_note],
  ]
  const mono = { fontFamily: 'var(--mono)', fontSize: 12 }

  return (
    <>
      <div className="banner note">
        <Icon name="info" />
        <div><b>How to read the labels.</b> <Tag kind="real" text="Real" /> numbers come from the monitored posts or a public source you can open. <Tag kind="demo" text="Demo" /> numbers are illustrative, used only where no source is connected yet, and every one is labelled on screen.</div>
      </div>
      <div className="kpis">
        <Kpi label="Public sources cited" value={real.length} d={`${Object.keys(groups).length} types, each with a link`} />
        <Kpi label="Posts with a link" value={fmt(Object.keys(data.POSTS).length)} d="referenced across the tabs" />
        <Kpi label="Signals kept" value={fmt((D.signal_index || []).length)} d={rm.excluded_signals ? String(rm.excluded_signals).split(':')[0] : ''} />
        <Kpi label="Demo feeds" value={demo.length} d="replace by connecting the source" />
      </div>
      <Card title="Public sources" right={<Tag kind="real" />} sub="Cited inline as R-ids wherever a public fact appears.">
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Id</th><th>Type</th><th>Publisher</th><th>Title</th><th>Date</th></tr></thead>
            <tbody>
              {real.map((s) => (
                <tr key={s.id}>
                  <td style={mono}>{s.id}</td>
                  <td>{s.type}</td>
                  <td>{s.publisher}</td>
                  <td><a href={s.url} target="_blank" rel="noopener">{s.title} <span style={{ verticalAlign: -1 }}><Icon name="ext" size={11} /></span></a></td>
                  <td className="num" style={{ whiteSpace: 'nowrap' }}>{dfmt(s.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Demo feeds (not connected yet)" right={<Tag kind="demo" />}>
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Id</th><th>Type</th><th>Feed</th><th>Used by</th></tr></thead>
            <tbody>
              {demo.map((s) => <tr key={s.id}><td style={mono}>{s.id}</td><td>{s.type}</td><td>{s.publisher}</td><td className="muted">{s.title || ''}</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="How the numbers are made" sub="Methods and caveats, stated plainly.">
        <div className="feed">
          {methods.filter((x) => x[1]).map(([k, v]) => (
            <div className="it" key={k} style={{ gridTemplateColumns: '160px minmax(0,1fr)' }}><b>{k}</b><span className="m">{v}</span></div>
          ))}
        </div>
      </Card>
    </>
  )
}
