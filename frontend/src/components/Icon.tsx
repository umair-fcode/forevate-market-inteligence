import { ICONS } from './icons'

/** Renders one of the original inline SVG icons. `display: contents` keeps layout identical to the raw <svg>. */
export function Icon({ name, size }: { name: string; size?: number }) {
  let svg = ICONS[name] || ''
  if (size) svg = svg.replace('<svg', `<svg width="${size}" height="${size}"`)
  return <span style={{ display: 'contents' }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
}
