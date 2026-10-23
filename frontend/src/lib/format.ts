/* Formatting helpers, ported from the original dashboard. */

export const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export const fmt = (n: number | null | undefined): string =>
  n == null || isNaN(n) ? '—' : Number(n).toLocaleString('en-US')

export const compact = (n: number | null | undefined): string =>
  n == null
    ? '—'
    : Math.abs(n) >= 1e6
      ? (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M'
      : Math.abs(n) >= 1e4
        ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k'
        : fmt(n)

export const pct = (n: number | null | undefined, d = 0): string =>
  n == null ? '—' : (n > 0 ? '+' : '') + Number(n).toFixed(d) + '%'

export const signed = (n: number | null | undefined): string =>
  n == null ? '—' : (n > 0 ? '+' : '') + fmt(n)

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const dfmt = (s?: string | null): string => {
  if (!s) return '—'
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(s)
  if (!m) return s
  return m[3] ? `${+m[3]} ${MON[+m[2] - 1]} ${m[1]}` : `${MON[+m[2] - 1]} ${m[1]}`
}

export const dshort = (s?: string | null): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '')
  return m ? `${+m[3]} ${MON[+m[2] - 1]}` : s || '—'
}

export const cls = (s: unknown): string => String(s || '').replace(/[^A-Za-z]/g, '')

export const cap = (s?: string | null): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
