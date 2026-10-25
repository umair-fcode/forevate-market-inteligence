import type { RefObject } from 'react'
import { Icon } from '../components/Icon'
import { Pill } from '../components/bits'
import { dfmt } from '../lib/format'
import { useApp } from '../store/AppContext'
import { useUI } from '../store/UIContext'
import { DigestModal } from './DigestModal'
import { Popover } from './Popover'

type MenuProps = { anchor: RefObject<HTMLElement | null>; onClose: () => void }

export function ProfileMenu({ anchor, onClose }: MenuProps) {
  const { data, go } = useApp()
  return (
    <Popover anchor={anchor} onClose={onClose}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 10px 10px' }}>
        <span className="av" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 700, display: 'grid', placeItems: 'center' }}>FA</span>
        <div>
          <b style={{ display: 'block', fontSize: 14 }}>Fcode Labs Administration</b>
          <span className="small muted">admin@fcodelabs.com · <Pill kind="good">Owner</Pill></span>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--line)' }} />
      <div className="hd">Brand</div>
      {data && (
        <div className="it" style={{ cursor: 'default' }}>
          <span className="av">{(data.brand.name || '?').slice(0, 1).toUpperCase()}</span>
          <span className="t">
            <b>{data.brand.name}{data.brand.market ? ' · ' + data.brand.market : ''}</b>
            <span>{data.brand.organisation || ''}</span>
          </span>
        </div>
      )}
      <div style={{ borderTop: '1px solid var(--line)' }} />
      <button className="it" role="menuitem" onClick={() => { onClose(); go('settings', 5) }}>
        <span className="t"><b>Users &amp; roles</b><span>Manage who can see which brand</span></span>
      </button>
    </Popover>
  )
}

export function AlertsMenu({ anchor, onClose }: MenuProps) {
  const { data, goInsight } = useApp()
  const { openModal } = useUI()
  const alerts = ((data?.D?.global?.alerts || []) as Record<string, string>[])
    .slice()
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const n = (data?.brand.recipients || []).length

  return (
    <Popover anchor={anchor} onClose={onClose}>
      <div className="hd">Alerts · urgent changes</div>
      {alerts.length ? (
        alerts.map((a, i) =>
          a.insight ? (
            <button key={i} className="al" onClick={() => { onClose(); goInsight(a.insight) }}>
              <div><Pill kind={a.level} /></div>
              <div><div className="t">{a.text}</div><div className="d">{dfmt(a.date)} · opens {a.insight}</div></div>
            </button>
          ) : (
            <div key={i} className="al" style={{ cursor: 'default' }}>
              <div><Pill kind={a.level} /></div>
              <div><div className="t">{a.text}</div><div className="d">{dfmt(a.date)}</div></div>
            </div>
          ),
        )
      ) : (
        <div className="empty">No alerts</div>
      )}
      <div className="popfoot">
        <div className="hd" style={{ paddingTop: 10 }}>Email digests</div>
        <div className="popbtns">
          <button className="btn sm" onClick={() => { onClose(); openModal(<DigestModal period="daily" />, { maxWidth: 760 }) }}><Icon name="mail" /> Send today's digest</button>
          <button className="btn sm" onClick={() => { onClose(); openModal(<DigestModal period="weekly" />, { maxWidth: 760 }) }}><Icon name="mail" /> Send last week's digest</button>
        </div>
        <div className="tiny muted" style={{ padding: '4px 10px 6px' }}>
          Compiles the email from this brand's data for {n} registered contact{n === 1 ? '' : 's'}.
        </div>
      </div>
    </Popover>
  )
}
