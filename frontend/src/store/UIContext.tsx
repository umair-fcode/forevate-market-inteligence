/* Toast and modal, replacing the original toast()/modal()/closeModal() helpers. */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface UI {
  toast: (msg: string) => void
  openModal: (node: ReactNode) => void
  closeModal: () => void
}

const UICtx = createContext<UI | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('')
  const [on, setOn] = useState(false)
  const [modal, setModal] = useState<ReactNode>(null)
  const timer = useRef<number>(0)

  const toast = useCallback((m: string) => {
    setMsg(m)
    setOn(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOn(false), 2600)
  }, [])
  const openModal = useCallback((node: ReactNode) => setModal(node), [])
  const closeModal = useCallback(() => setModal(null), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <UICtx.Provider value={{ toast, openModal, closeModal }}>
      {children}
      <div className={`toast ${on ? 'on' : ''}`} role="status" aria-live="polite">
        {msg}
      </div>
      {modal && (
        <div className="modal" id="modal" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="box" role="dialog" aria-modal="true">
            {modal}
          </div>
        </div>
      )}
    </UICtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI(): UI {
  const c = useContext(UICtx)
  if (!c) throw new Error('useUI must be used inside <UIProvider>')
  return c
}
