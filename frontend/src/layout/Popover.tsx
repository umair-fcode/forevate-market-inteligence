import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

/** Menu anchored under a button; closes on outside click (original showPop/closePops, line 1110-1115). */
export function Popover({ anchor, onClose, children }: { anchor: RefObject<HTMLElement | null>; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: -9999, top: 0 })

  useLayoutEffect(() => {
    const a = anchor.current
    const p = ref.current
    if (!a || !p) return
    const r = a.getBoundingClientRect()
    const left = Math.min(r.left, window.innerWidth - p.offsetWidth - 16)
    setPos({ left: Math.max(8, left + window.scrollX), top: r.bottom + 6 + window.scrollY })
  }, [anchor])

  useLayoutEffect(() => {
    const down = (e: MouseEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || anchor.current?.contains(t)) return
      onClose()
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
  }, [anchor, onClose])

  return createPortal(
    <div className="pop" role="menu" ref={ref} style={{ left: pos.left, top: pos.top }}>
      {children}
    </div>,
    document.body,
  )
}
