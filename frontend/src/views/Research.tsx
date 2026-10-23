/* Deep Research tab, ported from VIEWS.research / askResearch / reportHtml (original lines 1635-1666). */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { Card, EvBtn, MeansBox, Meter, Pill, SoWhat, Tag } from '../components/ui'
import { dfmt } from '../lib/format'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'
import { useUI } from '../store/UIContext'

function Report({ r, q }: { r: Json; q?: string }) {
  const { L } = useApp()
  const { toast } = useUI()
  const share = async () => {
    const txt = location.href.split('#')[0] + '#research'
    try { await navigator.clipboard.writeText(txt); toast('Link copied') } catch { toast('Copy this link: ' + txt) }
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(r.summary); toast('Copied') } catch { toast('Could not copy on this device') }
  }
  return (
    <div className="report" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="chips">
        <Tag kind="demo" text="Demo answer" tip="In the live product every question searches the web and your Forevate data. This demo shows one prepared report." />
        <span className="muted small">Searched: {r.sources_searched}</span>
      </div>
      {q && q !== r.question ? <div className="muted small">Showing the prepared report for a related question: <b>{r.question}</b></div> : null}
      <h4>Summary</h4>
      <p>{r.summary}</p>
      {(r.key_findings || []).length > 0 && <><h4>Key findings</h4><ul>{r.key_findings.map((k: string, i: number) => <li key={i}>{k}</li>)}</ul></>}
      <h4>Scenarios</h4>
      <div className="scroll">
        <table className="tbl">
          <thead><tr><th>Scenario</th><th>Expected</th><th>Risk</th></tr></thead>
          <tbody>
            {(r.scenarios || []).map((s: Json, i: number) => (
              <tr key={i}><td className="b">{s.name}</td><td>{s.expected}</td><td><Pill kind={s.risk === 'Low' ? 'good' : s.risk === 'High' ? 'risk' : 'warn'}>{s.risk}</Pill></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <h4>Linked sources</h4>
      <div className="feed">
        {(r.sources || []).map((s: Json) => (
          <div className="it" key={s.rank} style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto', padding: '8px 0' }}>
            <div><Pill kind={s.sentiment} /></div>
            <div>
              <div className="sigline"><span className="rk">#{s.rank}</span><b>{s.title}</b></div>
              {L?.plain() ? <div className="m">{s.what_we_see}</div> : null}
              <MeansBox text={s.what_it_means_for_brand} />
              <div className="meta"><Meter v={s.how_sure_we_are} /><span className="muted small">{s.evidence_posts} posts</span></div>
            </div>
            <div><EvBtn ctx={{ title: s.title, signals: [s.rank] }} label="Open" /></div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn sm" onClick={copy}>Copy summary</button>
        <button className="btn sm" onClick={share}>Share link</button>
        <span className="muted small" style={{ alignSelf: 'center' }}>Export to PDF or Word is available in the live product.</span>
      </div>
    </div>
  )
}

function Partners({ R }: { R: Json }) {
  const { partnerReqs, patch } = useApp()
  const { toast } = useUI()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('2026-12-15')
  const rp: Json = R.research_partners || {}
  const reqs: Json[] = (rp.requests || []).concat(partnerReqs)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    patch({ partnerReqs: [...partnerReqs, { title: t, partner: 'To be matched', status: 'Draft (this session)', due }] })
    setTitle('')
    toast('Brief saved for this session')
  }
  return (
    <>
      <SoWhat text="When the data is not enough, brief a research partner from here and track each request. Requests shown are illustrative." tag={<Tag kind="demo" />} />
      <Card title="Partner requests" right={<Tag kind="demo" />} sub="Briefs sent to research partners and where each one stands.">
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Request</th><th>Partner</th><th>Status</th><th>Due</th></tr></thead>
            <tbody>
              {reqs.map((r, i) => (
                <tr key={i}>
                  <td className="b">{r.title}</td>
                  <td>{r.partner}</td>
                  <td><Pill kind={/field|progress/i.test(r.status) ? 'warn' : /done|deliver/i.test(r.status) ? 'good' : 'neutral'}>{r.status}</Pill></td>
                  <td className="num">{dfmt(r.due)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Brief a research partner" sub="A partner is matched to the brief; the request then appears in the table above.">
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label className="small muted" htmlFor="brief-title">What do you need to learn?</label>
          <textarea id="brief-title" className="ask" style={{ minHeight: 72, width: '100%' }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Why do first-time scooter buyers in Kandy pick Honda over Chetak?" />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="small muted" htmlFor="brief-due">Needed by</label>
            <input id="brief-due" type="date" className="sel" value={due} onChange={(e) => setDue(e.target.value)} />
            <span className="sp" style={{ flex: 1 }} />
            <button className="btn primary" type="submit">Send brief</button>
          </div>
        </form>
      </Card>
    </>
  )
}

function Ask({ ai }: { ai: Json }) {
  const { chat, draft, patch, updateChat } = useApp()
  const rep: Json = ai.sample_report || {}
  const [question, setQuestion] = useState(draft)
  const endRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  /* "Research deeper" on an insight pre-fills the question. */
  useEffect(() => { if (draft) setQuestion(draft) }, [draft])
  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const ask = () => {
    const q = question.trim()
    if (!q) return
    updateChat((c) => [...c, { role: 'user', text: q }, { role: 'ai', typing: true }])
    setQuestion('')
    patch({ draft: '' })
    timers.current.push(window.setTimeout(() => {
      updateChat((c) => {
        const i = c.findIndex((m) => m.typing)
        if (i < 0) return c
        const next = c.slice()
        next[i] = { role: 'ai', report: true, q }
        return next
      })
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50)
    }, 1100))
  }
  const ta = useRef<HTMLTextAreaElement>(null)
  const pickTemplate = (t: string) => { setQuestion(t); ta.current?.focus() }
  const avatar = <div className="av"><Icon name="spark" size={16} /></div>

  return (
    <div className="chatwrap">
      <div className="chat">
        {chat.length === 0 && (
          <>
            <div className="muted small">Try a template:</div>
            <div className="chips">
              {(ai.templates || []).map((t: Json) => <button key={t.name} className="chip" onClick={() => pickTemplate(t.example)}><b>{t.name}</b>&nbsp;· {t.example}</button>)}
            </div>
          </>
        )}
        {chat.map((m, i) =>
          m.role === 'user' ? (
            <div className="msg user" key={i}><div className="av">You</div><div className="bub">{m.text}</div></div>
          ) : m.typing ? (
            <div className="msg ai" key={i}>{avatar}<div className="bub"><span className="typing"><i /><i /><i /></span><span className="muted small">Searching the web and Forevate data…</span></div></div>
          ) : (
            <div className="msg ai" key={i}>{avatar}<div className="bub"><Report r={rep} q={m.q} /></div></div>
          ),
        )}
        <div ref={endRef} />
        <div className="ask">
          <textarea
            ref={ta}
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask() }}
            placeholder="Ask a question, e.g. What if we raise the CT 100 price by 5%?"
            aria-label="Your question"
          />
          <button className="btn primary" onClick={ask}>Ask</button>
        </div>
        <div className="muted tiny">Enter a question and press Ask (or Ctrl/⌘ + Enter). Filters at the top narrow the answer by SKU, persona or region.</div>
      </div>
      <aside className="side">
        <section className="card" style={{ gap: 6 }}>
          <div className="sect-title">Past research</div>
          {(ai.past_research || []).map((p: Json, i: number) => (
            <button key={i} className="it" onClick={() => pickTemplate(p.title)}>
              <b>{p.title}</b>
              <span>{dfmt(p.date)} · {p.author} · {p.status} {p.demo ? <Tag kind="demo" /> : null}</span>
            </button>
          ))}
          <div className="sect-title" style={{ marginTop: 8 }}>Sample report</div>
          <button className="it" onClick={() => pickTemplate(rep.question)}><b>{rep.question}</b><span>Asked {dfmt(rep.asked_on)}</span></button>
        </section>
      </aside>
    </div>
  )
}

export function ResearchView() {
  const { data, sub } = useApp()
  if (!data) return null
  const R: Json = data.D.deep_research || {}
  if (sub === 1) return <Partners R={R} />
  return <Ask ai={R.ai_deep_research || {}} />
}
