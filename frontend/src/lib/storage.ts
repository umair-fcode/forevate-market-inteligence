/* Per-viewer conveniences only (tab, brand); everything is wrapped in try/catch because storage can be unavailable. */
export const store = {
  get<T = unknown>(k: string): T | null {
    try {
      return JSON.parse(localStorage.getItem('fv.' + k) as string)
    } catch {
      return null
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem('fv.' + k, JSON.stringify(v))
    } catch {
      /* storage unavailable */
    }
  },
}

