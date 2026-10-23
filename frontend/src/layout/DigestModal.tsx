/* Email digest preview (original openDigest / saveDigest, lines 1144-1164). */
import { useMemo } from 'react'
import { Icon } from '../components/Icon'
import { downloadText, getDigest } from '../lib/digest'
import { dfmt } from '../lib/format'
import { useApp } from '../store/AppContext'
import { useUI } from '../store/UIContext'

export function DigestModal({ period }: { period: 'daily' | 'weekly' }) {
  const { data, dashboardUrl } = useApp()
  const { closeModal, toast } = useUI()

  const built = useMemo(() => {
    const api = getDigest()
    if (!api || !data) return null
    const asOf: string = data.D._readme?.as_of // the data's as-of date stands in for "today"; a mailer passes the real run date
    const model = api.build(data.D, { period, asOf, brand: data.brand, signals: Object.values(data.SIG), dashboardUrl, recipients: data.brand.recipients || [] })
    return { model, html: api.renderHtml(model), text: api.renderText(model), asOf, filename: `forevate-${data.brand.id}-${period}-digest-${asOf}.html` }
  }, [data, dashboardUrl, period])

  if (!built || !data) return <div className="empty">Digest module not loaded</div>
  const { model, html, text, asOf, filename } = built
  const to = (model.recipients || []).filter((r) => !r.digests || r.digests.includes(period))
  const body = html.replace(/^[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '')

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html)
      toast('Email HTML copied')
    } catch {
      toast('Could not copy on this device')
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h2>{period === 'daily' ? "Today's digest" : "Last week's digest"} · {data.brand.name}</h2>
          <div className="small muted" style={{ marginTop: 4 }}>Preview of the email the backend would send. Built from this brand's data as of {dfmt(asOf)}.</div>
        </div>
        <button className="iconbtn" onClick={closeModal} aria-label="Close"><Icon name="x" /></button>
      </div>
      <div className="mailmeta">
        <div>
          <span className="k">To</span>
          {to.length
            ? to.map((r) => <span key={r.email} className="chip static" data-tip={r.role || ''}>{r.name} · {r.email} </span>)
            : <span className="muted">No registered contacts yet — add them in the brand manifest</span>}
        </div>
        <div><span className="k">Subject</span><b>{model.subject}</b></div>
        <div><span className="k">Preview text</span><span className="muted">{model.preheader}</span></div>
      </div>
      <div className="mailframe" dangerouslySetInnerHTML={{ __html: body }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
        <button className="btn primary" onClick={() => { downloadText(filename, html, 'text/html'); toast('Saved ' + filename) }}><Icon name="download" /> Download .html</button>
        <button className="btn" onClick={() => { const n = filename.replace(/\.html$/, '.txt'); downloadText(n, text, 'text/plain'); toast('Saved ' + n) }}><Icon name="download" /> Download .txt</button>
        <button className="btn" onClick={copyHtml}>Copy HTML</button>
        <span className="sp" style={{ flex: 1 }} />
        <span className="tiny muted">In production this button calls the backend, which runs the same <code>digest.js</code> and sends to the registered contacts.</span>
      </div>
    </>
  )
}
