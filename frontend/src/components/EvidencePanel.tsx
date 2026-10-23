/* Right-hand evidence overlay (original openEvidence / postCard / sigCard / renderPanelBody, lines 1068-1107). */
import { useEffect, useMemo, useState } from 'react'
import { compact, dfmt, fmt } from '../lib/format'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'
import { useEvidence } from '../store/EvidenceContext'
import { Icon } from './Icon'
import { Meter, MeansBox, Pill, ScopeTag, Tag } from './ui'

const DEMO_HOST = /demo\.forevate\.ai/

export function PostCard({ p }: { p: Json }) {
  const { L } = useApp()
  const [full, setFull] = useState(false)
  if (!L) return null
  const u: string = p.url || ''
  const demo = DEMO_HOST.test(u)
  const plat = p.platform === 'tiktok' ? 'TikTok' : p.platform === 'facebook' ? 'Facebook' : p.platform || (u.includes('tiktok') ? 'TikTok' : u.includes('facebook') ? 'Facebook' : 'Web')
  const plain = L.plain()
  return (
    <article className="post">
      <div className="ph2">
        <span className="plat">{plat}</span>
        <span className="au">{p.author || 'Unknown'}</span>
        <span className="muted">{L.authorType(p.author_type)}</span>
        <span className="muted">· {dfmt(p.date)}</span>
        {p.language && <span className="muted">· {p.language}</span>}
        {p.province && <span className="muted">· {p.province}</span>}
        {demo && <Tag kind="demo" />}
      </div>
      <div className={`tx ${plain || full ? 'full' : ''}`} onClick={plain ? undefined : () => setFull((v) => !v)}>
        {p.text || '(no text)'}
      </div>
      {p.media && <div className="md">Video/image: {p.media}</div>}
      {p.sri_lanka_context && <div className="md">Context: {p.sri_lanka_context}</div>}
      <div className="st">
        {p.likes != null && <span><b>{fmt(p.likes)}</b> likes</span>}
        {p.comments != null && <span><b>{fmt(p.comments)}</b> comments</span>}
        {p.shares != null && <span><b>{fmt(p.shares)}</b> shares</span>}
        {p.engagement != null && <span><b>{fmt(p.engagement)}</b> engagement</span>}
        {(p.skus || []).length > 0 && (
          <span>{p.skus.map((s: string) => <span key={s} className="tag area">{L.skuShort(s)}</span>)}</span>
        )}
        <a className="btn sm open" href={p.url} target="_blank" rel="noopener">Open post <Icon name="ext" /></a>
      </div>
    </article>
  )
}

export function SigCard({ s }: { s: Json }) {
  const { L } = useApp()
  if (!L) return null
  const posts: Json[] = Array.isArray(s.evidence_posts) ? s.evidence_posts : []
  const o = s.original
  const kf: string[] = s.key_findings || []
  return (
    <article className="sig">
      <div className="h">
        <span className="rk">#{s.rank}</span>
        <b>{s.title}</b>
        <Pill kind={s.sentiment} />
        <ScopeTag scope={s.evidence_scope} />
      </div>
      <div className="w">{s.what_we_see}</div>
      <MeansBox text={s.what_it_means_for_brand} />
      <div className="st">
        <Meter v={s.how_sure_we_are} />
        <span>{fmt(typeof s.evidence_posts === 'number' ? s.evidence_posts : posts.length)} posts</span>
        <span>{compact(s.engagement || s.total_evidence_engagement)} engagement</span>
        {s.tab && <span>{s.tab}</span>}
        {s.decision_area && <span className="tag area">{s.decision_area}</span>}
        {(s.skus || []).map((k: string) => <span key={k} className="tag area">{L.skuShort(k)}</span>)}
      </div>
      {o ? (
        <details className="srcword">
          <summary>Source wording</summary>
          <div className="orig">
            {o.title && <div><div className="k">Original title</div>{o.title}</div>}
            {o.what_we_see && <div><div className="k">What the export saw</div>{o.what_we_see}</div>}
            {o.why_it_matters && <div><div className="k">Why it matters (export)</div>{o.why_it_matters}</div>}
            {kf.length > 0 && <div><div className="k">Key findings (export)</div><ul style={{ margin: '4px 0 0' }}>{kf.map((k, i) => <li key={i}>{k}</li>)}</ul></div>}
            {s.export_file && <div className="muted tiny" style={{ fontFamily: 'var(--mono)' }}>{s.export_file}</div>}
          </div>
        </details>
      ) : s.full && (s.why_it_matters || kf.length) ? (
        <details>
          <summary>Why it matters and key findings</summary>
          {s.why_it_matters && <p style={{ marginTop: 6, fontSize: 13 }}>{s.why_it_matters}</p>}
          {kf.length > 0 && <ul>{kf.map((k, i) => <li key={i}>{k}</li>)}</ul>}
          {s.latest_evidence_date && <div className="muted small" style={{ marginTop: 6 }}>Latest evidence {dfmt(s.latest_evidence_date)} · {fmt(posts.length)} posts linked below</div>}
        </details>
      ) : null}
      {posts.length > 0 && (
        <details>
          <summary>Show the {posts.length} posts behind this signal</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {posts.map((p, i) => <PostCard key={p.url || i} p={L.resolvePost(p)} />)}
          </div>
        </details>
      )}
    </article>
  )
}

export function EvidencePanel() {
  const { ctx, closeEvidence } = useEvidence()
  const { L } = useApp()
  const [tab, setTab] = useState<string>('signals')

  const built = useMemo(() => {
    if (!ctx || !L) return null
    const sigs = (ctx.signals || []).map((r) => (typeof r === 'object' ? L.sig(r.rank) || r : L.sig(r))).filter(Boolean) as Json[]
    const posts: Json[] = []
    const seen = new Set<string>()
    const add = (p: Json) => {
      const rp = L.resolvePost(p)
      if (rp.url && !seen.has(rp.url)) { seen.add(rp.url); posts.push(rp) }
    }
    ;(ctx.posts || []).forEach(add)
    if (ctx.includeSignalPosts !== false) sigs.forEach((s) => (s.evidence_posts_list || (Array.isArray(s.evidence_posts) ? s.evidence_posts : [])).forEach(add))
    posts.sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
    const srcs = (ctx.sources || []).map((s) => (typeof s === 'string' ? { ...(L.source(s) || { id: s }) } : { ...(L.source(s.source_id) || {}), ...s })) as Json[]
    const tabs: [string, string][] = []
    if (sigs.length) tabs.push(['signals', `Early signs · ${sigs.length}`])
    if (posts.length) tabs.push(['posts', `Posts · ${posts.length}`])
    if (srcs.length) tabs.push(['sources', `Public sources · ${srcs.length}`])
    return { sigs, posts, srcs, tabs }
  }, [ctx, L])

  useEffect(() => {
    if (!ctx || !built) return
    setTab(ctx.start && built.tabs.some((t) => t[0] === ctx.start) ? ctx.start : built.tabs[0]?.[0] || 'signals')
  }, [ctx, built])

  const on = !!ctx
  return (
    <>
      <div className={`backdrop ${on ? 'on' : ''}`} onClick={closeEvidence} />
      <aside className={`panel ${on ? 'on' : ''}`} aria-label="Evidence" aria-hidden={!on}>
        <div className="ph">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{ctx?.title || 'Evidence'}</h2>
            <div className="s">
              {ctx?.subtitle || 'The posts, signals and public sources behind this'}
              {ctx?.actions && <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>{ctx.actions}</div>}
            </div>
          </div>
          <button className="iconbtn" aria-label="Close evidence" onClick={closeEvidence}><Icon name="x" /></button>
        </div>
        <div className="ptabs">
          {built?.tabs.map((t) => (
            <button key={t[0]} className="subtab" aria-selected={tab === t[0]} onClick={() => setTab(t[0])}>{t[1]}</button>
          ))}
        </div>
        <div className="pb" key={`${ctx?.title}-${tab}`}>
          {built && tab === 'signals' && (
            <>
              <div className="muted small">Early signs are patterns Forevate found across many posts. Each one links to the real posts behind it.</div>
              {built.sigs.map((s, i) => <SigCard key={s.rank ?? i} s={s} />)}
            </>
          )}
          {built && tab === 'posts' && (
            <>
              <div className="muted small">Real posts, newest-first by engagement. Every link opens the original.</div>
              {built.posts.map((p, i) => <PostCard key={p.url || i} p={p} />)}
            </>
          )}
          {built && tab === 'sources' && (
            <div>
              {built.srcs.map((s, i) => (
                <div className="srcrow" key={i}>
                  <span className="id">{s.id || s.source_id || ''}</span>
                  <div>
                    <div>
                      <a href={s.url} target="_blank" rel="noopener"><b>{s.title || s.label || s.publisher}</b></a>{' '}
                      {s.real === false ? <Tag kind="demo" /> : <Tag kind="real" />}
                    </div>
                    <div className="muted small">{s.publisher || ''}{s.type ? ' · ' + s.type : ''}{s.date ? ' · ' + dfmt(s.date) : ''}</div>
                    {s.note && <div className="note">{s.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
