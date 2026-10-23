/* Factors shaping a past month / a coming week on My Demand (original pastFactors / futureFactors, lines 1550-1571). */
import { cap, compact, dfmt, dshort, fmt } from './format'
import { sigsWhere, srcsOfType } from './evidence'
import { knDate, knMeta, type Lookups } from './lookups'
import type { BrandData, Json } from './types'
import type { EvidenceCtx } from '../store/EvidenceContext'

export interface Factor {
  kind: string
  text: string
  m?: string
  dir?: string
  ins?: string
  ev?: EvidenceCtx | null
  w?: number
}

export function pastFactors(b: BrandData, L: Lookups, monthKey: string): Factor[] {
  const d = b.D
  const F: Factor[] = []
  const inMonth = (s?: string) => (s || '').slice(0, 7) === monthKey
  const row = (d.my_demand?.overview?.early_signs_vs_sales || []).find((m: Json) => m.month === monthKey)
  if (row?.real)
    F.push({ kind: 'Registrations', text: `${cap(L.realAnchor())} for this month match the sales figure`, m: 'The only months whose sales are real; every other month is a demo value', ev: { title: `${dfmt(monthKey)} · ${L.realAnchor()}`, subtitle: 'Published figures behind this month', sources: srcsOfType(b, 'Registration data'), start: 'sources' }, w: 100 })
  if (row?.interpretation)
    F.push(typeof row.interpretation === 'string' ? { kind: 'Early sign', text: row.interpretation, w: 90 } : { kind: 'Early sign', text: row.interpretation.early_sign, m: row.interpretation.why, w: 90 })

  Object.entries(d.my_market?.key_numbers || {})
    .filter(([, arr]) => Array.isArray(arr) && arr.length > 1)
    .forEach(([k, arr]) =>
      (arr as Json[]).forEach((pp, i) => {
        if (i && inMonth(knDate(pp)) && pp.value !== (arr as Json[])[i - 1].value) {
          const dv = pp.value - (arr as Json[])[i - 1].value
          const meta = knMeta(k)
          F.push({
            kind: 'Costs',
            text: `${meta[0]} ${dv > 0 ? 'up' : 'down'} ${meta[1] === '%' ? Math.abs(dv).toFixed(1) + ' pts' : 'Rs. ' + fmt(Math.abs(dv))} to ${L.knFmt(k, pp.value)} (${dfmt(knDate(pp))})`,
            m: dv > 0 ? 'Cost pressure rises; price-sensitive SKUs and small-pack demand usually react first' : 'Relief on cost; watch whether buyers read it as enough',
            ev: { title: `${meta[0]} · ${dfmt(knDate(pp))}`, subtitle: `${L.knFmt(k, pp.value)} · published figure`, sources: pp.source ? [pp.source] : srcsOfType(b, meta[2]), signals: sigsWhere(b, (x) => x.market_tag === 'Costs').slice(0, 6), start: 'sources' },
            w: 80,
          })
        }
      }),
    )
  ;(d.my_market?.market_feed || []).filter((f: Json) => inMonth(f.date)).forEach((f: Json) =>
    F.push({ kind: f.tag, text: f.item, m: f.means, ev: { title: f.item, subtitle: `${f.tag} · ${f.decision_area}`, signals: f.signal ? [f.signal.rank] : [], posts: f.evidence_posts || [], sources: f.sources || [] }, w: 40 + Math.min(35, Math.log10((f.signal?.engagement || 1) + 1) * 7) }),
  )
  ;(d.my_competitors?.what_changed_this_week || []).filter((c: Json) => inMonth(c.date)).forEach((c: Json) =>
    F.push({ kind: 'Competitor', text: `${c.brand}: ${c.change}`, m: c.what_it_means_for_us, ev: { title: c.change, subtitle: `${c.brand} · ${c.type}`, signals: c.signal ? [c.signal.rank] : [], posts: c.evidence_posts || [] }, w: 60 }),
  )
  ;(d.my_brand?.campaigns || []).filter((c: Json) => inMonth(c.first_seen)).forEach((c: Json) =>
    F.push({ kind: 'Campaign', text: `${c.name} launched ${dshort(c.first_seen)}`, m: `${c.posts_found} posts, ${compact(c.engagement)} engagement${c.organic_response ? ', organic response: ' + c.organic_response : ''}`, ev: { title: c.name, subtitle: 'Posts behind this campaign', posts: c.evidence_posts || [], start: 'posts' }, w: 70 }),
  )
  ;(d.global?.alerts || []).filter((a: Json) => inMonth(a.date)).forEach((a: Json) =>
    F.push({ kind: a.level, text: a.text, m: `Alert raised ${dshort(a.date)}`, ins: a.insight, w: 75 }),
  )
  return F.sort((a, b) => (b.w || 0) - (a.w || 0))
}

export function futureFactors(b: BrandData, weekEnding: string): Factor[] {
  const d = b.D
  const end = new Date(weekEnding + 'T23:59:59')
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)
  const inWeek = (s?: string) => {
    if (!s) return false
    const x = new Date(s)
    return x >= start && x <= end
  }
  const F: Factor[] = []
  const seen = new Set<string>()
  ;(d.my_market?.coming_up || []).concat(d.insights?.overview?.coming_up || []).forEach((u: Json) => {
    if (!inWeek(u.date) || seen.has(u.event)) return
    seen.add(u.event)
    F.push({ kind: u.tag, text: `${u.event} · ${dshort(u.date)}`, m: u.expected_effect, dir: u.direction, ins: u.insight, ev: (u.signals || []).length ? { title: u.event, subtitle: 'Early signs behind this event', signals: u.signals } : null })
  })
  ;(d.insights?.detailed_insights || []).forEach((i: Json) =>
    (i.what_to_do || []).forEach((a: Json) => {
      if (inWeek(a.by_when)) F.push({ kind: 'Decision due', text: a.action, m: `By ${dshort(a.by_when)} · ${a.owner} · from ${i.id}`, ins: i.id })
    }),
  )
  const wk = (d.my_demand?.sales_ahead?.weekly_total || []).find((w: Json) => w.week_ending === weekEnding)
  if (wk?.interpretation) F.unshift({ kind: 'Expectation', text: wk.interpretation, m: 'Why the expected line sits where it does this week' })
  return F
}
