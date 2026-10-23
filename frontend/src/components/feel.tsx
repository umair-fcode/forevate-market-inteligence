/* "How people feel" gauges, ported from original lines 1216-1222. */
import type { KeyboardEvent } from 'react'
import { feelCls, feelWord } from '../lib/feel'
import { signed } from '../lib/format'
import { useEvidence, type EvidenceCtx } from '../store/EvidenceContext'

const feelPos = (v: number) => Math.max(0, Math.min(100, (Number(v) + 100) / 2))

export function FeelGauge({ v, rivals = [] }: { v: number; rivals?: { name: string; v: number }[] }) {
  return (
    <div className="feel" role="img" aria-label={`${feelWord(v)}, ${signed(v)} on a scale from minus 100 to plus 100`}>
      <div className="track">
        <i /><i /><i />
        <span className="zero" />
        {rivals.map((r) => (
          <span key={r.name} className="rv" style={{ left: `${feelPos(r.v)}%` }} data-tip={`${r.name}: ${feelWord(r.v)} (${signed(r.v)})`} />
        ))}
        <span className="me" style={{ left: `${feelPos(v)}%` }} data-tip={`Us: ${feelWord(v)} (${signed(v)})`} />
      </div>
      <div className="ends"><span>Negative</span><span>Mixed</span><span>Positive</span></div>
    </div>
  )
}

export function FeelCell({ v }: { v: number | null | undefined }) {
  if (v == null) return <span className="muted">—</span>
  const w = Math.abs(v) / 2
  const style = v >= 0 ? { left: '50%', width: `${w}%`, background: 'var(--good)' } : { right: '50%', width: `${w}%`, background: 'var(--risk)' }
  return (
    <span className="fcell" data-tip={`${feelWord(v)}: ${signed(v)} on a scale from −100 to +100`}>
      <span className="mini"><b style={style} /></span>
      <span className="n">{signed(v)}</span>
    </span>
  )
}

export interface DivRow { l: string; v: number; tip?: string; ev?: EvidenceCtx | null }

export function DivRows({ rows }: { rows: DivRow[] }) {
  const { openEvidence } = useEvidence()
  return (
    <div className="drows">
      {rows.map((r, i) => {
        const act = r.ev ? () => openEvidence(r.ev!) : undefined
        return (
          <div
            key={i}
            className={`drow ${r.ev ? 'ev' : ''}`}
            {...(act ? { role: 'button', tabIndex: 0, onClick: act, onKeyDown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act() } } } : {})}
            data-tip={r.tip ? r.tip + (r.ev ? ' · click for evidence' : '') : undefined}
          >
            <span className="lb">{r.l}</span>
            <span className="tr"><b className={r.v >= 0 ? 'pos' : 'neg'} style={{ width: `${Math.min(50, Math.abs(r.v) / 2)}%` }} /></span>
            <span className="fcell"><span className={`w ${feelCls(r.v)}`}>{feelWord(r.v)}</span><span className="n">{signed(r.v)}</span></span>
          </div>
        )
      })}
      <div className="daxis"><span /><span><span>−100</span><span>0</span><span>+100</span></span><span /></div>
    </div>
  )
}
