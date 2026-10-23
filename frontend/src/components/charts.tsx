/* Inline-SVG charts, ported from lineChart / groupedBars / stackedBars (original lines 997-1025). */
import { compact, fmt } from '../lib/format'
import { useEvidence, type EvidenceCtx } from '../store/EvidenceContext'

export interface Series { name: string; v: (number | null)[]; color: string; dash?: boolean }

interface LineProps {
  series: Series[]
  labels: string[]
  markers?: { i: number | null; text: string }[]
  band?: { low: number[]; high: number[] } | null
  h?: number
  yFmt?: (n: number) => string
  yLabel?: string
  xEvery?: number
  points?: boolean
  hollow?: ((s: Series, i: number) => boolean) | null
  /** Evidence to open when the point at index i is clicked. */
  pointEv?: ((i: number) => EvidenceCtx | null) | null
  /** Index of the highlighted column, and a callback when a column is picked. */
  sel?: number | null
  onSelect?: ((i: number) => void) | null
}

export function LineChart({ series, labels, markers = [], band = null, h = 240, yFmt = compact, yLabel = '', xEvery = 1, points = true, hollow = null, pointEv = null, sel = null, onSelect = null }: LineProps) {
  const { openEvidence } = useEvidence()
  const w = 720, pl = 46, pr = 14, pt = 18, pb = 34
  const iw = w - pl - pr, ih = h - pt - pb
  const all = series.flatMap((s) => s.v).concat(band ? band.low.concat(band.high) : []).filter((v): v is number => v != null)
  const lo = Math.min(0, ...all)
  let hi = Math.max(...all)
  if (hi === lo) hi = lo + 1
  hi = hi * 1.08
  const n = labels.length
  const x = (i: number) => pl + (n > 1 ? i / (n - 1) : 0.5) * iw
  const y = (v: number) => pt + ih - ((v - lo) / (hi - lo)) * ih
  const ticks = [0, 1, 2, 3, 4].map((t) => lo + ((hi - lo) * t) / 4)
  const ww = n > 1 ? iw / (n - 1) : iw

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={series.map((s) => s.name).join(', ')}>
        <g className="grid">
          {ticks.map((v, t) => (
            <g key={t}>
              <line x1={pl} x2={w - pr} y1={y(v)} y2={y(v)} />
              <text x={pl - 6} y={y(v) + 4} textAnchor="end">{yFmt(Math.round(v))}</text>
            </g>
          ))}
        </g>
        {band && (
          <polygon className="band" points={band.low.map((v, i) => `${x(i)},${y(v)}`).concat(band.high.map((v, i) => `${x(i)},${y(v)}`).reverse()).join(' ')} />
        )}
        {sel != null && n > 0 && <rect className="selband" x={x(sel) - ww / 2} y={pt} width={ww} height={ih} />}
        {markers.map((m, k) =>
          m.i == null ? null : (
            <g key={k}>
              <line className="mk" x1={x(m.i)} x2={x(m.i)} y1={pt} y2={pt + ih} />
              <circle cx={x(m.i)} cy={pt - 6} r={4} fill="var(--canary)" stroke="var(--navy)" strokeWidth={1} />
            </g>
          ),
        )}
        {series.map((s, si) => {
          const d = s.v
            .map((v, i) => (v == null ? null : `${i && s.v[i - 1] != null ? 'L' : 'M'}${x(i)},${y(v)}`))
            .filter(Boolean)
            .join(' ')
          return (
            <g key={si}>
              <path className="ln" d={d} stroke={s.color} strokeDasharray={s.dash ? '4 4' : undefined} />
              {points && s.v.map((v, i) => {
                if (v == null) return null
                const hol = !!(hollow && hollow(s, i))
                return <circle key={i} className={`pt ${hol ? 'hollow' : ''}`} cx={x(i)} cy={y(v)} r={hol ? 3.5 : 3} fill={s.color} stroke={hol ? s.color : undefined} />
              })}
            </g>
          )
        })}
        {labels.map((l, i) => {
          const x0 = n > 1 ? x(i) - iw / (n - 1) / 2 : pl
          const lines = series
            .map((s) => `${s.name}: ${s.v[i] == null ? '—' : yFmt(s.v[i] as number)}`)
            .concat(band ? [`Range: ${yFmt(band.low[i])} – ${yFmt(band.high[i])}`] : [])
            .concat(markers.filter((m) => m.i === i).map((m) => '• ' + m.text))
          const ctx = pointEv ? pointEv(i) : null
          const act = ctx ? () => openEvidence(ctx) : onSelect ? () => onSelect(i) : undefined
          return (
            <rect
              key={i}
              className={`hit ${act ? 'ev' : ''}`}
              x={x0}
              y={pt}
              width={ww}
              height={ih}
              onClick={act}
              data-tip={l + ' — ' + lines.join(' | ') + (ctx ? ' · click for evidence' : onSelect ? ' · click to see what shaped it' : '')}
            />
          )
        })}
        <g className="axis">
          {labels.map((l, i) => (i % xEvery === 0 || i === n - 1 ? <text key={i} x={x(i)} y={h - 10} textAnchor="middle">{l}</text> : null))}
        </g>
        {yLabel && <text className="axisl" x={pl} y={10}>{yLabel}</text>}
      </svg>
    </div>
  )
}

export function GroupedBars({ groups, series, h = 220, yFmt = compact, barEv = null }: { groups: string[]; series: Series[]; h?: number; yFmt?: (n: number) => string; barEv?: ((gi: number, si: number) => EvidenceCtx | null) | null }) {
  const { openEvidence } = useEvidence()
  const w = 720, pl = 46, pr = 10, pt = 16, pb = 30
  const iw = w - pl - pr, ih = h - pt - pb
  const hi = Math.max(...series.flatMap((s) => s.v as number[])) * 1.1 || 1
  const y = (v: number) => pt + ih - (v / hi) * ih
  const gw = iw / groups.length
  const bw = Math.min(26, (gw - 16) / series.length - 2)
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} role="img">
        <g className="grid">
          {[0, 1, 2, 3, 4].map((t) => {
            const v = (hi * t) / 4
            return (
              <g key={t}>
                <line x1={pl} x2={w - pr} y1={y(v)} y2={y(v)} />
                <text x={pl - 6} y={y(v) + 4} textAnchor="end">{yFmt(Math.round(v))}</text>
              </g>
            )
          })}
        </g>
        {groups.map((gname, gi) => {
          const cx = pl + gw * gi + gw / 2
          const total = series.length * (bw + 2) - 2
          return (
            <g key={gi}>
              {series.map((s, si) => {
                const v = s.v[gi] as number
                const ctx = barEv ? barEv(gi, si) : null
                return (
                  <rect
                    key={si}
                    className={`bar ${ctx ? 'ev' : ''}`}
                    x={cx - total / 2 + si * (bw + 2)}
                    y={y(v)}
                    width={bw}
                    height={Math.max(0, pt + ih - y(v))}
                    fill={s.color}
                    onClick={ctx ? () => openEvidence(ctx) : undefined}
                    data-tip={`${gname} · ${s.name}: ${fmt(v)}${ctx ? ' · click for the source' : ''}`}
                  />
                )
              })}
              <text x={cx} y={h - 10} textAnchor="middle">{gname}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function StackedBars({ groups, series, h = 200 }: { groups: string[]; series: Series[]; h?: number }) {
  const w = 720, pl = 40, pr = 10, pt = 16, pb = 30
  const iw = w - pl - pr, ih = h - pt - pb
  const y = (v: number) => pt + ih - (v / 100) * ih
  const gw = iw / groups.length
  const bw = Math.min(90, gw * 0.55)
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} role="img">
        <g className="grid">
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={pl} x2={w - pr} y1={y(v)} y2={y(v)} />
              <text x={pl - 6} y={y(v) + 4} textAnchor="end">{v}%</text>
            </g>
          ))}
        </g>
        {groups.map((gname, gi) => {
          const cx = pl + gw * gi + gw / 2
          let acc = 0
          return (
            <g key={gi}>
              {series.map((s, si) => {
                const v = s.v[gi] as number
                const y1 = y(acc + v)
                const y0 = y(acc)
                acc += v
                return (
                  <g key={si}>
                    <rect className="bar" x={cx - bw / 2} y={y1} width={bw} height={Math.max(0, y0 - y1 - 2)} fill={s.color} data-tip={`${gname} · ${s.name}: ${v}%`} />
                    {v >= 10 && <text x={cx} y={(y0 + y1) / 2 + 4} textAnchor="middle" fill="#fff" style={{ fill: '#fff', fontWeight: 600 }}>{v}%</text>}
                  </g>
                )
              })}
              <text x={cx} y={h - 10} textAnchor="middle">{gname}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
