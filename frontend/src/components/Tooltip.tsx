import { useEffect, useRef } from 'react'

/** One delegated tooltip for every `[data-tip]` element (original showTip, lines 1224-1230). */
export function Tooltip() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tip = ref.current!
    const hide = () => tip.classList.remove('on')
    const show = (el: Element) => {
      const txt = el.getAttribute('data-tip')
      if (!txt) return
      tip.textContent = txt
      tip.classList.add('on')
      const r = el.getBoundingClientRect()
      const tw = tip.offsetWidth
      const th = tip.offsetHeight
      let x = r.left + r.width / 2 - tw / 2
      let y = r.top - th - 8
      const rail = el.closest('.rail')
      if (rail && window.innerWidth > 980) {
        const rr = rail.getBoundingClientRect()
        x = rr.right + 10
        y = Math.max(8, Math.min(r.top + r.height / 2 - th / 2, window.innerHeight - th - 8))
        tip.classList.add('side')
      } else {
        tip.classList.remove('side')
        if (y < 8) y = r.bottom + 8
      }
      x = Math.max(8, Math.min(x, window.innerWidth - tw - 8))
      tip.style.left = x + 'px'
      tip.style.top = y + 'px'
    }
    const over = (e: MouseEvent) => {
      const el = (e.target as Element).closest?.('[data-tip]')
      if (el) show(el)
      else hide()
    }
    const out = (e: MouseEvent) => {
      if ((e.target as Element).closest?.('[data-tip]')) hide()
    }
    const focusin = (e: FocusEvent) => {
      const el = (e.target as Element).closest?.('[data-tip]')
      if (el) show(el)
    }
    document.addEventListener('mouseover', over)
    document.addEventListener('mouseout', out)
    document.addEventListener('focusin', focusin)
    document.addEventListener('focusout', hide)
    document.addEventListener('click', hide)
    window.addEventListener('scroll', hide, { passive: true })
    return () => {
      document.removeEventListener('mouseover', over)
      document.removeEventListener('mouseout', out)
      document.removeEventListener('focusin', focusin)
      document.removeEventListener('focusout', hide)
      document.removeEventListener('click', hide)
      window.removeEventListener('scroll', hide)
    }
  }, [])

  return <div className="tip" id="tip" role="tooltip" ref={ref} />
}
