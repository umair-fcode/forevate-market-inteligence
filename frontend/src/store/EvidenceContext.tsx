/* Evidence panel state. Replaces the original EV registry + openEvidence()/closePanel() (lines 981-987, 1068-1084). */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Json } from '../lib/types'

export interface EvidenceCtx {
  title?: string
  subtitle?: string
  /** Signal ranks, or signal objects carrying a `rank`. */
  signals?: (number | Json)[]
  posts?: Json[]
  /** Source ids, or objects carrying `source_id`. */
  sources?: (string | Json)[]
  includeSignalPosts?: boolean
  start?: 'signals' | 'posts' | 'sources'
  actions?: ReactNode
}

interface EvidenceApi {
  ctx: EvidenceCtx | null
  openEvidence: (c: EvidenceCtx) => void
  closeEvidence: () => void
}

const EvCtx = createContext<EvidenceApi | null>(null)

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<EvidenceCtx | null>(null)
  const openEvidence = useCallback((c: EvidenceCtx) => setCtx(c), [])
  const closeEvidence = useCallback(() => setCtx(null), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCtx(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return <EvCtx.Provider value={{ ctx, openEvidence, closeEvidence }}>{children}</EvCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEvidence(): EvidenceApi {
  const c = useContext(EvCtx)
  if (!c) throw new Error('useEvidence must be used inside <EvidenceProvider>')
  return c
}
