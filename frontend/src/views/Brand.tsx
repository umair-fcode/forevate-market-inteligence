/* My Brand tab, ported from VIEWS.brand (original lines 1299-1345). */
import { PostCard } from '../components/EvidencePanel'
import { LineChart } from '../components/charts'
import { FeelCell, FeelGauge } from '../components/feel'
import { FEEL_TIP, feelCls, feelWord } from '../lib/feel'
import { BarRows, Card, ChartNote, Delta, EvBtn, Info, Kpi, Legend, Pill, SignalList, SoWhat, SrcLink, Tag } from '../components/ui'
import { allPosts, postsInWeek } from '../lib/evidence'
import { matchPost } from '../lib/filters'
import { compact, dfmt, dshort, fmt, signed } from '../lib/format'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'
import { useEvidence } from '../store/EvidenceContext'

const regionAction = (province: string, current: string, apply: () => void) => (
  <button className="btn sm" onClick={apply}>{current === province ? 'Remove the region filter' : 'Filter every tab to ' + province}</button>
)

function Conversations({ B }: { B: Json }) {
  const { data, L, f, feedSort, feedLang, patch, setFilter } = useApp()
  const { closeEvidence } = useEvidence()
  if (!data || !L) return null
  const me = data.D.global?.brand || data.brand.name
  const themes: Json[] = (B.conversations?.what_people_link_us_with || []).filter((t: Json) => !f.area || t.decision_area === f.area)
  const all: Json[] = B.conversations?.post_feed || []
  let feed = all.filter((p) => matchPost(f, p))
  if (feedLang) feed = feed.filter((p) => p.language === feedLang)
  feed = feed.slice().sort((a, b) => (feedSort === 'date' ? (b.date || '').localeCompare(a.date || '') : (b.engagement || 0) - (a.engagement || 0)))
  const langs = Array.from(new Set(all.map((p) => p.language))).filter(Boolean) as string[]
  const prov: Json[] = B.conversations?.by_province || []
  const top = themes.slice().sort((a, b) => b.engagement - a.engagement)[0]
  const pl = (p: Json) => L.brandVal(p, '_posts_with_location')
  const lead = prov.slice().sort((a, b) => pl(b) - pl(a))[0]?.province || ''
  const toggleProv = (p: string) => { setFilter('province', f.province === p ? '' : p); closeEvidence() }

  return (
    <>
      <SoWhat text={B.so_what} />
      <div className="grid g2">
        <Card
          title="What people link us with"
          takeaway={top ? `${top.theme} is the biggest theme, with ${compact(top.engagement)} engagement, and it points at ${top.decision_area.toLowerCase()} decisions.` : ''}
          sub="Themes by engagement across the monitored posts."
        >
          <BarRows rows={themes.map((t) => ({ l: t.theme, v: t.engagement, vl: compact(t.engagement), tip: `${t.theme} · ${t.decision_area}${t.what_it_is ? ': ' + t.what_it_is : ''}` }))} />
          <div className="feed">
            {themes.map((t) => (
              <div className="it" key={t.theme} style={{ gridTemplateColumns: 'auto minmax(0,1fr)' }}>
                <span className="tag area">{t.decision_area}</span>
                <div><span className="b">{t.theme}</span> {t.what_it_is ? <span className="muted">— {t.what_it_is}</span> : null}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card
          title="Where the conversation is"
          takeaway={`${B.conversations?.location_coverage_pct ?? '—'}% of ${me} posts name a place. ${lead} leads.`}
          sub={B.conversations?.location_note || ''}
        >
          <BarRows
            rows={prov.map((p) => ({
              l: p.province,
              v: pl(p),
              key: p.province,
              hl: f.province === p.province,
              tip: `${p.province}: ${pl(p)} posts · ${compact(p.engagement)} engagement`,
              ev: {
                title: p.province,
                subtitle: `${pl(p)} posts name a place in this region · ${compact(p.engagement)} engagement`,
                posts: allPosts(data).filter((x) => x.province === p.province),
                signals: p.top_signals || [],
                start: 'posts' as const,
                actions: regionAction(p.province, f.province, () => toggleProv(p.province)),
              },
            }))}
          />
          <ChartNote text="Click a region for the posts behind it." />
        </Card>
      </div>
      <Card title="Post feed" sub="Real posts, with their original links. Sorted by influence (likes, comments and shares)." right={<Tag kind="real" text="Real posts" />}>
        <div className="chips" style={{ alignItems: 'center' }}>
          <span className="muted small">Sort</span>
          <button className={`chip ${feedSort === 'engagement' ? 'on' : ''}`} onClick={() => patch({ feedSort: 'engagement' })}>Most influence</button>
          <button className={`chip ${feedSort === 'date' ? 'on' : ''}`} onClick={() => patch({ feedSort: 'date' })}>Newest</button>
          <span className="muted small" style={{ marginLeft: 8 }}>Language</span>
          {langs.map((l) => <button key={l} className={`chip ${feedLang === l ? 'on' : ''}`} onClick={() => patch({ feedLang: feedLang === l ? '' : l })}>{l}</button>)}
          <span className="sp" style={{ flex: 1 }} />
          <span className="muted small">{feed.length} posts</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {feed.length ? feed.slice(0, 30).map((p, i) => <PostCard key={p.url || i} p={L.resolvePost(p)} />) : <div className="empty">No post matches the current filter.</div>}
        </div>
      </Card>
    </>
  )
}

function Campaigns({ B }: { B: Json }) {
  const camps: Json[] = B.campaigns || []
  const et: Json[] = B.early_topics || []
  const c0 = camps[0]
  const respKind = (r: string) => (/none/i.test(r) ? 'risk' : /strong|yes/i.test(r) ? 'good' : 'warn')
  return (
    <>
      <SoWhat text={B.so_what} />
      <Card
        title="Campaign tracker"
        takeaway={c0 ? `${c0.name.split(' (')[0]} reached ${compact(c0.engagement)} engagement from ${c0.posts_found} posts${c0.organic_response ? ', with ' + (/none/i.test(c0.organic_response) ? 'no visible organic response' : 'organic response: ' + c0.organic_response) : ''}.` : ''}
        sub="Buzz before and after each campaign, measured in the monitored posts. Personas reached are shown on each persona page."
      >
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Campaign</th><th className="r">Posts found</th><th className="r">Engagement</th><th>Seen</th><th>Organic response</th><th>What we saw</th><th /></tr></thead>
            <tbody>
              {camps.map((c, n) => (
                <tr key={n}>
                  <td className="b">{c.name}</td>
                  <td className="r num">{fmt(c.posts_found)}</td>
                  <td className="r num">{fmt(c.engagement)}</td>
                  <td className="num" style={{ whiteSpace: 'nowrap' }}>{dshort(c.first_seen)} – {dshort(c.last_seen)}</td>
                  <td>{c.organic_response ? <Pill kind={respKind(c.organic_response)}>{c.organic_response}</Pill> : <span className="muted">—</span>}</td>
                  <td style={{ minWidth: 240 }}>{c.note}</td>
                  <td><EvBtn ctx={{ title: c.name, subtitle: 'Posts behind this campaign', posts: c.evidence_posts || [], start: 'posts' }} label="Posts" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Topics we watched that did not grow" sub="Topics Forevate tracked that stopped before becoming an insight, and why.">
        <div className="feed">
          {et.map((t, n) => (
            <div className="it" key={n} style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto' }}>
              <div><Pill kind={t.outcome === 'no_signal' ? 'neutral' : 'warn'}>{t.outcome === 'no_signal' ? 'No signal' : 'Signal, no insight'}</Pill></div>
              <div>
                <div className="h">{t.label}</div>
                <div className="m">{t.what_we_see || t.why_it_stopped || 'Too few posts to form a signal.'}</div>
                <div className="meta"><span className="muted small">{t.posts} posts · topic score {t.ranking_score}</span></div>
              </div>
              <div><EvBtn ctx={{ title: t.label, posts: t.evidence_posts || [], start: 'posts' }} label="Posts" /></div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

const VOICE_COLORS = ['var(--c1)', 'var(--c2)', 'var(--c5)', 'var(--c4)', 'var(--c3)']

function Overview({ B }: { B: Json }) {
  const { data, L, f, setFilter } = useApp()
  const { openEvidence } = useEvidence()
  if (!data || !L) return null
  const D = data.D
  const bp: Json = B.overview?.brand_pulse || {}
  const fot: Json[] = B.overview?.feeling_over_time || []
  const db: Json = B.data_basis || {}
  const h2h: Json[] = D.my_competitors?.head_to_head?.columns || []
  const me: string = D.global?.brand || data.brand.name

  const BP = L.brandKey(fot[0] || {}, '_posts') || 'posts'
  const compKeys = Object.keys(fot[0] || {}).filter((k) => k.endsWith('_posts') && k !== BP)
  const last4 = fot.slice(-4).reduce((a, w) => a + (w[BP] || 0), 0)
  const prev4 = fot.slice(-8, -4).reduce((a, w) => a + (w[BP] || 0), 0)
  const chg = prev4 ? Math.round(((last4 - prev4) / prev4) * 100) : null
  const share: Json[] = (bp.share_of_conversation || []).slice().sort((a: Json, b: Json) => b.share_pct - a.share_pct)
  const wis: Json = bp.who_is_speaking || {}
  const wp: Json = wis.posts || {}
  const we: Json = wis.engagement || {}
  const labels = fot.map((w) => dshort(w.week_ending))
  const markers = fot.map((w, i) => (w.marker ? { i, text: w.marker as string } : null)).filter(Boolean) as { i: number; text: string }[]
  const peak = fot.reduce((m, w) => ((w[BP] || 0) > (m[BP] || 0) ? w : m), fot[0] || {})
  const voiceKeys = Object.keys(wp).sort((a, b) => (a === 'organic' ? -1 : b === 'organic' ? 1 : 0))
  const brandish = voiceKeys.find((k) => /brand|dealer|seller/.test(k)) || voiceKeys[1]
  const sc: Json[] = (B.overview?.sku_scorecard || [])
    .filter((s: Json) => !f.sku || s.sku === f.sku)
    .slice()
    .sort((a: Json, b: Json) => b.engagement_26w - a.engagement_26w)

  const v = bp.how_people_feel_net
  const rv = h2h.filter((c) => c.brand !== me && c.how_people_feel != null).map((c) => ({ name: c.brand as string, v: c.how_people_feel as number }))
  const higher = rv.filter((r) => r.v > v)
  const myShare = share[0]?.brand === me ? share[0].share_pct : share.find((s) => s.brand === me)?.share_pct ?? '—'
  const lineColors = (i: number) => `var(--c${Math.min(i + 2, 5)})`
  const lineSeries = [{ name: me, v: fot.map((w) => w[BP]), color: 'var(--c1)' }].concat(
    compKeys.map((k, i) => ({ name: L.compName(k.slice(0, -6)), v: fot.map((w) => w[k]), color: lineColors(i) })),
  )

  const seg = (obj: Json, tot: number, fmtv: (n: number) => string) =>
    voiceKeys.map((k, i) => (
      <i
        key={k}
        className="ev"
        style={{ width: `${((obj[k] || 0) / (tot || 1)) * 100}%`, background: VOICE_COLORS[i] }}
        data-tip={`${L.voiceLabel(k)}: ${fmtv(obj[k])} · click for posts`}
        onClick={() => openEvidence({ title: L.voiceLabel(k), subtitle: 'Posts in evidence from this voice that mention our SKUs', posts: allPosts(data).filter((p) => p.author_type === k && (p.skus || []).length), start: 'posts' })}
      />
    ))
  const worst = sc.filter((x) => x.how_people_feel != null).sort((a, b) => a.how_people_feel - b.how_people_feel)[0]

  return (
    <>
      <SoWhat text={B.so_what} />
      <div className="muted small">
        {db.period || ''} · {fmt(L.brandVal(db, '_posts'))} posts about {me} out of {fmt(db.all_sri_lanka_posts_in_window)} monitored · Facebook {fmt(db.platforms?.facebook)} · TikTok {fmt(db.platforms?.tiktok)} ·{' '}
        {Object.entries(db.languages || {}).map(([k, n]) => `${k} ${fmt(n as number)}`).join(' · ')} <Tag kind="real" text="Real" tip="Every post has its original link" />
      </div>
      <div className="kpis">
        <Kpi label="People talking about us" value={fmt(bp.people_talking_about_us)} unit="posts" d={chg == null ? 'in the last 26 weeks' : <Delta v={chg} vs="last 4 weeks vs the 4 before" />} tip="Mentions: posts about the brand in the monitored Facebook and TikTok set" />
        <Kpi label="Engagement" value={compact(bp.total_engagement)} d="likes, comments and shares on those posts" />
        <div className="kpi">
          <div className="l">How people feel <Info tip={FEEL_TIP + (db.how_people_feel_method ? ' ' + db.how_people_feel_method + '.' : '')} /></div>
          <div className="v"><span className={`fword ${feelCls(v)}`}>{feelWord(v)}</span><small>{signed(v)} net</small></div>
          <FeelGauge v={v} rivals={rv} />
          <div className="d">{rv.length ? (higher.length ? `${higher.map((r) => r.name).join(', ')} ${higher.length === 1 ? 'scores' : 'score'} higher` : 'Highest among the brands we track') : ''}</div>
        </div>
        <Kpi label="Our share of the conversation" value={myShare + '%'} d={`of ${share.length} brands monitored`} tip={bp.share_note || 'Share of voice'} />
      </div>
      <div className="grid g2">
        <Card
          title="Our share of the conversation"
          takeaway={`${share[0]?.brand} leads the monitored conversation; the next brand is ${share[1]?.brand} at ${share[1]?.share_pct}%. Watch the trend rather than the level.`}
          sub={bp.share_note || ''}
        >
          <BarRows
            rows={share.map((s) => {
              const r: number[] = h2h.find((c) => c.brand === s.brand)?.signals || []
              return {
                l: s.brand,
                v: s.share_pct,
                vl: s.share_pct + '%',
                hl: s.brand === me,
                cls: s.brand === me ? 'me' : 'alt',
                tip: `${s.brand}: ${fmt(s.posts)} posts · ${compact(s.engagement)} engagement`,
                ev: r.length ? { title: s.brand, subtitle: `${fmt(s.posts)} posts · ${s.share_pct}% of the monitored conversation · ${r.length} early signs`, signals: r } : undefined,
              }
            })}
          />
          <ChartNote text="Click a brand for the early signs and posts about it." />
        </Card>
        <Card
          title="Who is speaking"
          takeaway={`${Math.round(((wp[brandish] || 0) / (bp.people_talking_about_us || 1)) * 100)}% of posts come from ${L.voiceLabel(brandish).toLowerCase()}, and ${data.brand.organic_noun || 'an organic'} post earns ${wis.organic_engagement_multiple}× the engagement of one of theirs.`}
          sub={db.voice_method || ''}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><div className="small muted" style={{ marginBottom: 4 }}>Posts</div><div className="splitbar">{seg(wp, bp.people_talking_about_us, (n) => fmt(n) + ' posts')}</div></div>
            <div><div className="small muted" style={{ marginBottom: 4 }}>Engagement</div><div className="splitbar">{seg(we, bp.total_engagement, compact)}</div></div>
            <Legend items={voiceKeys.map((k, i) => ({ name: `${L.voiceLabel(k)} · ${fmt(wp[k])} posts`, color: VOICE_COLORS[i] }))} />
          </div>
        </Card>
      </div>
      <Card
        title="Talk about us, week by week"
        takeaway={`Posts about ${me} peaked in the week of ${dshort(peak.week_ending)} at ${fmt(peak[BP])}${chg != null ? `, and the last 4 weeks are ${chg >= 0 ? 'up' : 'down'} ${Math.abs(chg)}% on the 4 before` : ''}. Marked weeks show campaign launches and market events.`}
        sub="Weekly post counts; hover a week for the numbers and the event. Feeling per post is not in this data, so the line shows volume."
      >
        <LineChart
          series={lineSeries}
          labels={labels}
          markers={markers}
          xEvery={3}
          yLabel="Posts per week"
          yFmt={fmt}
          pointEv={(i) => {
            const ps = postsInWeek(data, fot[i].week_ending)
            return ps.length ? { title: `Week ending ${dfmt(fot[i].week_ending)}`, subtitle: `${fmt(fot[i][BP])} posts about ${me} that week${fot[i].marker ? ' · ' + fot[i].marker : ''} · ${ps.length} posts in evidence`, posts: ps, start: 'posts' } : null
          }}
        />
        <ChartNote text="Click a week for the posts behind it." />
        <Legend items={lineSeries.map((s) => ({ name: s.name, color: s.color, kind: 'line' })).concat([{ name: 'Campaign or market event (hover a week)', color: 'var(--canary)', kind: '' }])} />
        <div className="feed" style={{ marginTop: 4 }}>
          {markers.slice(-4).map((m) => (
            <div className="it" key={m.i} style={{ gridTemplateColumns: 'auto minmax(0,1fr)', padding: '6px 0' }}>
              <div className="dt">{labels[m.i]}</div>
              <div className="m">{m.text}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card
        title="SKU scorecard"
        takeaway={sc.length ? `${L.skuShort(sc[0].sku)} draws the most engagement (${compact(sc[0].engagement_26w)}); ${worst ? `${L.skuShort(worst.sku)} has the weakest feeling (${feelWord(worst.how_people_feel).toLowerCase()}, ${signed(worst.how_people_feel)}).` : ''}` : ''}
        sub="Each SKU over the last 26 weeks. Click a SKU to filter every tab to it."
      >
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>SKU</th><th className="r">Price</th><th className="r">Posts</th><th className="r">Engagement</th>
                <th className="r">Rider share <Info tip="Share of posts from riders and the public rather than dealers" /></th>
                <th>How people feel <Info tip={FEEL_TIP} /></th><th>Early signs</th><th>Top post</th>
              </tr>
            </thead>
            <tbody>
              {sc.map((s) => (
                <tr key={s.sku} className={f.sku === s.sku ? 'better' : ''}>
                  <td className="b"><button className="linkbtn" data-tip="Filter everything to this SKU" onClick={() => setFilter('sku', f.sku === s.sku ? '' : s.sku)}>{L.skuShort(s.sku)}</button></td>
                  <td className="r num" style={{ whiteSpace: 'nowrap' }}>{L.money(s.price_lkr)}<div>{s.price_real ? <SrcLink id={s.price_source} label="price list" /> : <Tag kind="demo" text="est." />}</div></td>
                  <td className="r num">{fmt(s.posts_26w)}</td>
                  <td className="r num">{fmt(s.engagement_26w)}</td>
                  <td className="r num">{s.organic_share_pct}%</td>
                  <td><FeelCell v={s.how_people_feel} /></td>
                  <td>{(s.linked_signals || []).length ? <EvBtn ctx={{ title: L.skuName(s.sku), subtitle: 'Early signs linked to this SKU', signals: s.linked_signals }} label={`${s.linked_signals.length} signs`} /> : <span className="muted">—</span>}</td>
                  <td>{(s.top_posts || []).length ? <EvBtn ctx={{ title: L.skuName(s.sku), subtitle: 'Top posts', posts: s.top_posts, start: 'posts', includeSignalPosts: false }} label="Posts" /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Early signs on this tab" sub="Patterns Forevate found in brand conversation, strongest first. Open one to see the posts behind it.">
        <SignalList sigs={B.signals || []} title="Brand early signs" />
      </Card>
    </>
  )
}

export function BrandView() {
  const { data, sub } = useApp()
  if (!data) return null
  const B = data.D.my_brand
  if (sub === 1) return <Conversations B={B} />
  if (sub === 2) return <Campaigns B={B} />
  return <Overview B={B} />
}
