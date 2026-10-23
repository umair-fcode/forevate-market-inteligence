/* My Personas tab, ported from VIEWS.personas (original lines 1348-1372). */
import { DivRows } from '../components/feel'
import { FEEL_TIP } from '../lib/feel'
import { BarRows, Card, ChartNote, EvBtn, Info, InsMini, MeansBox, Pill, ScopeTag, SoWhat } from '../components/ui'
import { postsOfSignals, sigsWhere } from '../lib/evidence'
import { compact, dfmt, dshort, pct, signed } from '../lib/format'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'

const platName = (k: string) => (k === 'tiktok' ? 'TikTok' : k === 'facebook' ? 'Facebook' : k)

export function PersonasView() {
  const { data, L, f, persona } = useApp()
  if (!data || !L) return null
  const D = data.D
  const P: Json = D.my_personas
  const list: Json[] = P.personas || []
  const p = list.find((x) => x.id === persona) || list[0]
  if (!p) return <div className="empty">No personas yet. Create them in Settings › Personas.</div>

  const pg: Json = p.page || {}
  const trend = p.trend === 'growing' ? 'good' : p.trend === 'shrinking' ? 'risk' : 'neutral'
  const minds: Json[] = (pg.whats_on_their_mind || []).slice().sort((a: Json, b: Json) => b.engagement - a.engagement)
  const rising = minds.filter((m) => m.sentiment === 'Positive').length
  const falling = minds.filter((m) => m.sentiment === 'Negative').length
  const plat: Record<string, number> = pg.reaching_them?.platforms_of_their_posts || {}
  const lang: Record<string, number> = pg.reaching_them?.languages_of_their_posts || {}
  const sk: Json[] = (pg.how_they_see_us?.skus_in_their_conversation || []).filter((s: Json) => !f.sku || s.sku === f.sku)
  const sp: Json = pg.needs_and_spending || {}
  const setup = D.settings?.personas_setup || D.my_personas?.personas_setup || {}
  const facts: [string, string, string?][] = P.persona_fields || [
    ['Age', 'age'], ['Gender mix', 'gender_mix'], ['Household', 'household'], ['Lives', 'lives'], ['Shops through', 'shops_through'], ['Buys at', 'buys_at'],
  ]
  const pPosts = postsOfSignals(L, sigsWhere(data, (x) => (x.personas || []).includes(p.id)))
  const langs = Object.entries(lang).sort((a, b) => b[1] - a[1])
  const plats = Object.entries(plat).sort((a, b) => b[1] - a[1])
  const best = sk.slice().sort((a, b) => b.how_people_feel - a.how_people_feel)[0]
  const worst = sk.slice().sort((a, b) => a.how_people_feel - b.how_people_feel)[0]
  const driverKey = Object.keys(pg).find((x) => x.endsWith('_segment_interpretations') && (pg[x] || []).length)
  const spendKind = /cheaper/i.test(sp.spending_pressure) ? 'risk' : /up/i.test(sp.spending_pressure) ? 'good' : 'neutral'

  return (
    <>
      <SoWhat text={P.so_what} />
      <Card title="Who they are" right={<span className="tiny muted">Drafted by the AI session in Settings, approved {dfmt(setup.approved_on)}</span>}>
        <div className="facts">
          {facts.filter((x) => p[x[1]]).map((x) => (
            <div className="f" key={x[1]}><div className="k">{x[0]}</div><div className="v">{p[x[1]]}{x[2] || ''}</div></div>
          ))}
          <div className="f">
            <div className="k">Estimated size</div>
            <div className="v">{p.estimated_size} <Pill kind={trend}>{p.trend} {p.trend_pct != null ? pct(p.trend_pct, 1) : ''}</Pill></div>
          </div>
        </div>
        <div className="blk" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="sect-title">What matters to them</div>
          <div className="chips">{(p.what_matters || []).map((w: string) => <span key={w} className="chip static">{w}</span>)}</div>
        </div>
        <div className="blk" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="sect-title">Three things that changed this month</div>
          <div className="todo">
            {(pg.who_they_are?.changed_this_month || []).map((c: string, n: number) => <div className="it" key={n}><span className="n">{n + 1}</span><div>{c}</div></div>)}
          </div>
        </div>
      </Card>

      <div className="grid g2">
        <Card
          title="What's on their mind"
          takeaway={`${minds.length} topics in their conversations: ${rising} positive, ${falling} negative. ${minds[0] ? 'The loudest is "' + minds[0].topic + '".' : ''}`}
          sub="Topics rising or falling in this persona's posts, by engagement."
        >
          <div className="feed">
            {minds.map((m, n) => (
              <div className="it" key={n} style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto' }}>
                <div><Pill kind={m.sentiment} /></div>
                <div>
                  <div className="h">{m.topic}</div>
                  {L.plain() && L.sig(m.signal)?.what_we_see ? <div className="m">{L.sig(m.signal)!.what_we_see}</div> : null}
                  <MeansBox text={m.what_it_means} />
                  <div className="meta"><span className="muted small">{compact(m.engagement)} engagement · latest {dshort(m.latest)}</span><ScopeTag scope={m.evidence_scope} /></div>
                </div>
                <div><EvBtn ctx={{ title: m.topic, signals: [m.signal] }} label="Open" /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Needs & spending">
          <div className="blk" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="sect-title">What they want but can't find <Info tip="Unmet needs" /></div>
            <div className="feed">
              {(sp.want_but_cant_find || []).map((w: Json, n: number) => (
                <div className="it" key={n} style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                  <div className="h">{w.need}</div>
                  <div><EvBtn ctx={{ title: w.need, signals: w.signals || [] }} label="Why" /></div>
                </div>
              ))}
            </div>
            <div className="sect-title">Spending pressure <Info tip="Trading down = switching to cheaper options" /></div>
            <div><Pill kind={spendKind}>{sp.spending_pressure || '—'}</Pill> <span className="small muted">{sp.spending_note || ''}</span></div>
            <div className="sect-title">Household shifts</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>{(sp.household_shifts || []).map((h: string, n: number) => <li key={n}>{h}</li>)}</ul>
          </div>
        </Card>
      </div>

      <div className="grid g2">
        <Card
          title="How they see us"
          takeaway={sk.length ? `They feel best about ${L.skuShort(best.sku)} and least about ${L.skuShort(worst.sku)}.` : ''}
          sub={FEEL_TIP}
        >
          {sk.length ? (
            <>
              <DivRows
                rows={sk.map((s) => {
                  const r = sigsWhere(data, (x) => (x.skus || []).includes(s.sku) && (x.personas || []).includes(p.id))
                  return {
                    l: L.skuShort(s.sku),
                    v: s.how_people_feel,
                    tip: `${L.skuName(s.sku)}: ${s.signals} early signs, feeling ${signed(s.how_people_feel)}`,
                    ev: r.length ? { title: `${L.skuName(s.sku)} · ${p.name}`, subtitle: `${r.length} early signs where this persona talks about the SKU · feeling ${signed(s.how_people_feel)}`, signals: r } : null,
                  }
                })}
              />
              <ChartNote text="Click a SKU for the early signs behind the feeling." />
            </>
          ) : <div className="empty">No SKU in this persona's conversation matches the filter.</div>}
          <div className="sect-title" style={{ marginTop: 6 }}>What they consider instead</div>
          <div className="feed">
            {(pg.how_they_see_us?.consider_instead || []).map((c: Json, n: number) => (
              <div className="it" key={n} style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                <div className="m">{c.what}</div>
                <div><EvBtn ctx={{ title: c.what, signals: [c.signal] }} label="Open" /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card
          title="Reaching them"
          sub={pg.reaching_them?.note || ''}
          takeaway={langs.length && plats.length ? `Reach them in ${langs[0][0]} on ${platName(plats[0][0])} first: ${Math.round((langs[0][1] / langs.reduce((a, b) => a + b[1], 0)) * 100)}% of their posts are in ${langs[0][0]}.` : ''}
        >
          <div className="grid g2">
            <div>
              <div className="sect-title" style={{ marginBottom: 6 }}>Where they post</div>
              <BarRows
                rows={Object.entries(plat).map(([k, v]) => {
                  const ps = pPosts.filter((x) => x.platform === k)
                  return { l: platName(k), v, tip: `${v} posts on ${platName(k)}`, ev: ps.length ? { title: `${p.name} on ${platName(k)}`, subtitle: `${ps.length} posts in evidence from this persona's signals`, posts: ps, start: 'posts' as const } : undefined }
                })}
              />
            </div>
            <div>
              <div className="sect-title" style={{ marginBottom: 6 }}>Languages</div>
              <BarRows
                cls="alt"
                rows={langs.map(([k, v]) => {
                  const ps = pPosts.filter((x) => x.language === k)
                  return { l: k, v, tip: `${v} posts in ${k}`, ev: ps.length ? { title: `${p.name} in ${k}`, subtitle: `${ps.length} posts in evidence from this persona's signals`, posts: ps, start: 'posts' as const } : undefined }
                })}
              />
            </div>
          </div>
          <ChartNote text="Click a bar for the posts behind it." />
          <div className="sect-title">Shopping channels</div>
          <div>{p.shops_through || p.buys_at || '—'}</div>
        </Card>
      </div>

      {driverKey && (
        <Card title="What drives them" sub="Segment interpretation of each signal for this persona.">
          <div className="feed">
            {pg[driverKey].map((y: Json, n: number) => (
              <div className="it" key={n} style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto' }}>
                <div><span className="pill neutral">{y.driver || y.segment || 'Driver'}</span></div>
                <div className="m">{y.meaning}{y.segment && y.driver ? <div className="muted small">{y.segment}</div> : null}</div>
                <div><EvBtn ctx={{ title: y.driver || y.segment, signals: [y.signal] }} label="Open" /></div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card title="What it means" sub="Insights affecting this persona. Each opens the Insights tab.">
        <InsMini ids={pg.what_it_means || []} />
      </Card>
    </>
  )
}
