/* Shared building blocks, ported from the original string helpers (lines 972-992). */
import type { KeyboardEvent, ReactNode } from 'react'
import { activeFilters, matchSig } from '../lib/filters'
import { compact, dfmt, fmt } from '../lib/format'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'
import { useEvidence, type EvidenceCtx } from '../store/EvidenceContext'
import { Icon } from './Icon'
import { Pill, Tag } from './bits'

export { Pill, Tag }

export const Info = ({ tip }: { tip: string }) => (
  <span className="info" data-tip={tip} tabIndex={0}>i</span>
)

export function Meter({ v, label }: { v: number; label?: string }) {
  return (
    <span className="meter" data-tip={`${label || 'How sure we are'}: ${v}%`}>
      <span className="bar"><i style={{ width: `${Math.max(0, Math.min(100, v))}%` }} /></span>
      <span className="num">{v}%</span>
    </span>
  )
}

/** Up / down / mixed direction badge. */
export function Dir({ d }: { d: string }) {
  const k = d === 'up' ? 'up' : d === 'down' ? 'down' : 'mixed'
  const t = { up: 'Likely to lift sales', down: 'Likely to lower sales', mixed: 'Mixed effect' }[k]
  return (
    <span className={`dir ${k}`} data-tip={t}>
      <Icon name={k} />
      <span>{k}</span>
    </span>
  )
}

export function Delta({ v, bad = false, suffix = '%', vs = '' }: { v: number | null | undefined; bad?: boolean; suffix?: string; vs?: string }) {
  if (v == null || isNaN(v)) return null
  const k = v > 0 ? 'up' : v < 0 ? 'down' : 'flat'
  const s = (v > 0 ? '+' : '') + (Number.isInteger(v) ? v : Number(v).toFixed(1)) + suffix
  return (
    <>
      <span className={`delta ${k} ${bad ? 'bad' : ''}`}>
        {k === 'up' && <Icon name="up" />}
        {k === 'down' && <Icon name="down" />}
        {s}
      </span>
      {vs && <span className="muted">{vs}</span>}
    </>
  )
}

export function Kpi({ label, value, unit = '', d, tip = '', tag }: { label: string; value: ReactNode; unit?: string; d?: ReactNode; tip?: string; tag?: ReactNode }) {
  return (
    <div className="kpi">
      <div className="l">{label}{tip ? <Info tip={tip} /> : null}{tag}</div>
      <div className="v num">{value}{unit ? <small>{unit}</small> : null}</div>
      <div className="d">{d}</div>
    </div>
  )
}

/** Plain text of an HTML-ish string, for tooltips (original `strip`). */
const strip = (s: unknown) =>
  String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()

export function Card({ title, sub = '', takeaway = '', right, className = '', children }: { title: ReactNode; sub?: string; takeaway?: string; right?: ReactNode; className?: string; children?: ReactNode }) {
  const tip = strip(sub)
  return (
    <section className={`card ${className}`}>
      <div className="hd">
        <h3>{title}{tip ? <> <Info tip={tip} /></> : null}</h3>
        <div className="sp" />
        {right}
      </div>
      {takeaway ? <div className="takeaway">{takeaway}</div> : null}
      {children}
    </section>
  )
}

/** "Filtered: …" note shown when any filter is on. */
export function FilterNote() {
  const { f, L } = useApp()
  const a = activeFilters(f)
  if (!a.length || !L) return null
  const name = (x: { k: string; v: string }) => (x.k === 'sku' ? L.skuShort(x.v) : x.k === 'persona' ? L.personaName(x.v) : x.v)
  return <span className="pill neutral">Filtered: {a.map(name).join(' · ')}</span>
}

export function SoWhat({ text, tag }: { text: string; tag?: ReactNode }) {
  return (
    <section className="sowhat">
      <div className="ai"><Icon name="spark" /></div>
      <div>
        <div className="k">What matters now {tag}<FilterNote /></div>
        <p className="txt">{text}</p>
      </div>
    </section>
  )
}

export function ScopeTag({ scope }: { scope?: string }) {
  if (!scope || scope === 'Sri Lanka') return null
  return (
    <span className="tag area" data-tip={'Evidence scope: ' + scope}>
      {/global/i.test(scope) ? 'Pattern seen elsewhere' : 'Mixed evidence'}
    </span>
  )
}

export function MeansBox({ text }: { text?: string | null }) {
  const { L } = useApp()
  if (!text || !L) return null
  return (
    <div className="means">
      <div className="k">{L.meansLabel()}</div>
      <div className="b">{text}</div>
    </div>
  )
}

export const ChartNote = ({ text }: { text: string }) => (
  <div className="chart-note"><Icon name="ev" />{text}</div>
)

export function Legend({ items }: { items: { name: string; color: string; kind?: string }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.name}>
          <i className={i.kind || ''} style={i.kind === 'dotted' ? { borderColor: i.color } : { background: i.color }} />
          {i.name}
        </span>
      ))}
    </div>
  )
}

/** Opens the evidence panel (original evBtn). */
export function EvBtn({ ctx, label }: { ctx: EvidenceCtx; label?: string }) {
  const { openEvidence } = useEvidence()
  const n = (ctx.signals || []).length + (ctx.posts || []).length + (ctx.sources || []).length
  return (
    <button className="evbtn" onClick={() => openEvidence(ctx)}>
      <Icon name="ev" />
      {label || 'Evidence'}
      {n ? ` · ${n}` : ''}
    </button>
  )
}

/** Link to a public source (original srcLink). */
export function SrcLink({ id, label }: { id: string; label?: string }) {
  const { L } = useApp()
  const s = L?.source(id)
  if (!s) return <span className="src">{id}</span>
  return (
    <a className="src" href={s.url} target="_blank" rel="noopener" data-tip={`${s.publisher || ''} · ${s.title || ''}${s.date ? ' · ' + dfmt(s.date) : ''}`}>
      {label || s.publisher || id}
      {!s.real ? ' (demo)' : ''}
      <Icon name="ext" />
    </a>
  )
}

export const SrcLinks = ({ ids }: { ids?: string[] }) => (
  <>{(ids || []).map((id, i) => <span key={id + i}><SrcLink id={id} />{' '}</span>)}</>
)

export function InsLink({ id }: { id: string }) {
  const { L, goInsight } = useApp()
  const i = L?.insight(id)
  if (!i) return null
  return <button className="linkbtn" data-tip={i.headline} onClick={() => goInsight(id)}>{id}</button>
}

/** Compact list of insights (original insMini). */
export function InsMini({ ids }: { ids?: string[] }) {
  const { L, goInsight } = useApp()
  return (
    <div className="feed">
      {(ids || []).map((id) => {
        const i = L?.insight(id)
        if (!i) return null
        return (
          <div key={id} className="it" style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto' }}>
            <div><Pill kind={i.status} /></div>
            <div>
              <div className="h">{i.headline}</div>
              <div className="meta">
                <span className="tag area">{i.decision_area}</span>
                <span className="muted small">{i.time_window}</span>
                <Meter v={i.how_sure_we_are} />
              </div>
            </div>
            <div><button className="btn sm" onClick={() => goInsight(i.id)}>Open <Icon name="arrow" /></button></div>
          </div>
        )
      })}
    </div>
  )
}

export interface BarRow { l: string; v: number; vl?: ReactNode; hl?: boolean; cls?: string; tip?: string; key?: string; ev?: EvidenceCtx }

/** Horizontal bars; rows may open evidence or call `onRow` (original barRows `click`). */
export function BarRows({ rows, max, cls: c2 = '', onRow }: { rows: BarRow[]; max?: number; cls?: string; onRow?: (key: string) => void }) {
  const { openEvidence } = useEvidence()
  const m = max || Math.max(1, ...rows.map((r) => r.v || 0))
  const anyEv = rows.some((r) => r.ev)
  const onKey = (e: KeyboardEvent, fn: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() }
  }
  return (
    <div className={`bars ${onRow || anyEv ? 'clickable' : ''}`}>
      {rows.map((r, i) => {
        const act = r.ev ? () => openEvidence(r.ev!) : onRow ? () => onRow(r.key ?? r.l) : undefined
        return (
          <div
            key={i}
            className={`row ${r.hl ? 'hl' : ''} ${r.ev ? 'ev' : ''}`}
            {...(act ? { role: 'button', tabIndex: 0, onClick: act, onKeyDown: (e: KeyboardEvent) => onKey(e, act) } : {})}
            data-tip={r.tip ? r.tip + (r.ev ? ' · click for evidence' : '') : undefined}
          >
            <span className="lb">{r.l}</span>
            <span className="tr"><i className={r.cls || c2} style={{ width: `${Math.max(0, ((r.v || 0) / m) * 100)}%` }} /></span>
            <span className="vl">{r.vl ?? fmt(r.v)}</span>
          </div>
        )
      })}
    </div>
  )
}

/** List of early signs with an "Open" evidence button each (original signalList). */
export function SignalList({ sigs, title = 'Early signs', limit = 8 }: { sigs?: (number | Json)[]; title?: string; limit?: number }) {
  const { L, f } = useApp()
  if (!L) return null
  const list = (sigs || [])
    .map((s) => (typeof s === 'number' ? L.sig(s) : L.sig(s.rank) || s))
    .filter(Boolean)
    .filter((s) => matchSig(f, L, s as Json)) as Json[]
  if (!list.length) return <div className="empty">No early signs match the current filter.</div>
  return (
    <div className="feed">
      {list.slice(0, limit).map((s) => {
        const posts = typeof s.evidence_posts === 'number' ? s.evidence_posts : (s.evidence_posts || []).length
        return (
          <div key={s.rank} className="it" style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto' }}>
            <div><Pill kind={s.sentiment} /></div>
            <div>
              {L.plain() ? <div className="sigline"><span className="rk">#{s.rank}</span><b>{s.title}</b></div> : <div className="h">{s.title}</div>}
              <div className="m">{s.what_we_see}</div>
              <MeansBox text={s.what_it_means_for_brand} />
              <div className="meta">
                <Meter v={s.how_sure_we_are} />
                <span className="muted small">{fmt(posts)} posts · {compact(s.engagement || s.total_evidence_engagement)} engagement</span>
                <ScopeTag scope={s.evidence_scope} />
              </div>
            </div>
            <div><EvBtn ctx={{ title: s.title, subtitle: 'Signal #' + s.rank, signals: [s.rank] }} label="Open" /></div>
          </div>
        )
      })}
      {list.length > limit && (
        <div className="muted small" style={{ paddingTop: 8 }}>
          {list.length - limit} more early signs on this tab · <EvBtn ctx={{ title, signals: list.map((s) => s.rank) }} label="See all" />
        </div>
      )}
    </div>
  )
}

