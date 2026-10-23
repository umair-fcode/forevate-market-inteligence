import type { ReactNode } from 'react'
import { cls } from '../lib/format'

/** Status pill: <span class="pill good">…</span> */
export function Pill({ kind, children }: { kind: unknown; children?: ReactNode }) {
  return <span className={`pill ${cls(kind)}`}>{children ?? String(kind)}</span>
}

/** Real / Demo data tag. */
export function Tag({ kind, text, tip }: { kind: string; text?: string; tip?: string }) {
  return (
    <span className={`tag ${kind}`} data-tip={tip}>
      {text || (kind === 'demo' ? 'Demo data' : 'Real')}
    </span>
  )
}
