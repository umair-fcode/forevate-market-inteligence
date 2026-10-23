/* Settings tab, ported from VIEWS.settings (original lines 1669-1681). */
import { Fragment } from 'react'
import { Card, Pill, SrcLink, Tag } from '../components/ui'
import { Icon } from '../components/Icon'
import { cap, dfmt } from '../lib/format'
import type { Json } from '../lib/types'
import { useApp } from '../store/AppContext'

const BL: Record<string, string> = { distributor: 'Distributor / organisation', company: 'Company', touchpoints: 'Touchpoints', share_note: 'Market position' }

export function SettingsView() {
  const { data, L, sub, brands, go } = useApp()
  if (!data || !L) return null
  const D = data.D
  const S: Json = D.settings || {}

  if (sub === 1) {
    const map: Json[] = S.competitor_sku_mapping || []
    return (
      <>
        <Card title="Competitors" sub="Brands we track against ours.">
          <div className="chips">
            {(S.competitors || []).map((c: Json) => (
              <span key={c.brand} className={`chip static ${c.configured ? 'on' : ''}`} data-tip={c.note || undefined}>{c.brand}{c.configured ? '' : ' · suggested'}</span>
            ))}
          </div>
          <div className="muted small">Three to five competitors are picked here; Forevate will detect emerging competitors automatically and suggest adding them.</div>
        </Card>
        <Card title="SKU matching" sub="Each of our SKUs matched to its closest rival, used by the head-to-head grid.">
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>Our SKU</th><th>Closest competitor SKUs</th></tr></thead>
              <tbody>
                {map.map((m, i) => (
                  <tr key={i}>
                    <td className="b">{L.skuName(m.our_sku)}</td>
                    <td>
                      {m.competitor_skus
                        ? m.competitor_skus.map((c: Json, n: number) => <Fragment key={n}>{n > 0 ? ' ' : null}<span className="chip static">{c.brand} {c.model}</span></Fragment>)
                        : <span className="chip static">{m.competitor || '—'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    )
  }

  if (sub === 2) {
    const ps: Json = S.personas_setup || D.my_personas?.personas_setup || {}
    return (
      <Card title="Persona setup" sub="The AI-guided question-and-answer session that drafted the personas. You can edit and rerun it any time.">
        <p>{ps.description || ''}</p>
        <div className="feed">
          {(ps.session || []).map((s: Json, n: number) => (
            <div className="it" key={n} style={{ gridTemplateColumns: 'auto minmax(0,1fr)' }}>
              <span className="n" style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-tint)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 700 }}>{n + 1}</span>
              <div><div className="h">{s.q}</div><div className="m">{s.a}</div></div>
            </div>
          ))}
        </div>
        <div className="muted small">Approved by {ps.approved_by || '—'} on {dfmt(ps.approved_on)}. <button className="linkbtn" onClick={() => go('personas', 0)}>See the personas</button></div>
        <div><button className="btn">Rerun the AI session</button></div>
      </Card>
    )
  }

  if (sub === 3) {
    return (
      <>
        <Card title="Keywords" sub="Terms Forevate listens for.">
          <div className="chips">{(S.keywords || []).map((k: string) => <span key={k} className="chip static">{k}</span>)}</div>
        </Card>
        <Card title="Listening profiles" sub="Where and how posts are collected.">
          <div className="feed">
            {(S.scraping_profiles || []).map((p: Json) => (
              <div className="it" key={p.id} style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                <div className="h">{p.title}</div>
                <div className="tiny muted" style={{ fontFamily: 'var(--mono)' }}>{p.id}</div>
              </div>
            ))}
          </div>
        </Card>
      </>
    )
  }

  if (sub === 4) {
    const ints: Json[] = S.integrations || []
    const connected = ints.filter((i) => i.status === 'connected').length
    return (
      <Card
        title="Integrations"
        sub="Connected sources feed real numbers; demo sources show illustrative values until connected."
        takeaway={`${connected} of ${ints.length} sources are connected. Connecting dealer sales and the CRM turns My Demand and My Customers into real data.`}
      >
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Source</th><th>Status</th><th /></tr></thead>
            <tbody>
              {ints.map((i, n) => (
                <tr key={n}>
                  <td className="b">{i.name}</td>
                  <td>{i.status === 'connected' ? <Pill kind="good">Connected</Pill> : <Pill kind="neutral">Demo values</Pill>} {i.real ? <Tag kind="real" /> : <Tag kind="demo" />}</td>
                  <td>{i.status === 'connected' ? null : <button className="btn sm">Connect</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )
  }

  if (sub === 5) {
    const roles: [string, string][] = [
      ['Owner', 'Everything, including brand setup, integrations and inviting users.'],
      ['Analyst', 'All tabs, can act on insights and run deep research.'],
      ['Viewer', 'Read-only across the brands they are given.'],
    ]
    return (
      <Card title="Users & roles" sub="Who can see which brand. A user switches brands from the account menu at the top right.">
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>User</th><th>Role</th><th>Brands</th></tr></thead>
            <tbody>
              <tr>
                <td className="b">Fcode Labs Administration<div className="muted small">admin@fcodelabs.com</div></td>
                <td><Pill kind="good">Owner</Pill></td>
                <td>{brands.map((b, n) => <Fragment key={b.id}>{n > 0 ? ' ' : null}<span className="chip static">{b.name}</span></Fragment>)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="sect-title" style={{ marginTop: 4 }}>Roles</div>
        <div className="feed">
          {roles.map(([r, d]) => <div className="it" key={r} style={{ gridTemplateColumns: '120px minmax(0,1fr)' }}><b>{r}</b><span className="m">{d}</span></div>)}
        </div>
        <div><button className="btn primary"><Icon name="plus" /> Invite a user</button></div>
      </Card>
    )
  }

  const b: Json = S.brand || {}
  const skus: Json[] = S.skus || []
  const rm: Json = D._readme || {}
  const bkeys = Object.keys(b).filter((k) => !['name', 'market', 'evidence'].includes(k) && typeof b[k] === 'string')
  const skuTerm: string | undefined = rm.category_adaptations?.SKU
  return (
    <>
      <Card title="Brand" sub={data.brand.data_basis || ''}>
        <div className="facts">
          <div className="f"><div className="k">Brand</div><div className="v">{b.name}</div></div>
          <div className="f"><div className="k">Market</div><div className="v">{b.market}</div></div>
          {bkeys.map((k, i) => (
            <div className="f" key={k}>
              <div className="k">{BL[k] || cap(k.replace(/_/g, ' '))}</div>
              <div className="v">{b[k]}{i === bkeys.length - 1 ? <> {(b.evidence || []).map((id: string) => <span key={id}><SrcLink id={id} />{' '}</span>)}</> : null}</div>
            </div>
          ))}
          <div className="f"><div className="k">Data as of</div><div className="v">{dfmt(rm.as_of)}</div></div>
          <div className="f"><div className="k">Currency</div><div className="v">{rm.currency || ''}</div></div>
        </div>
      </Card>
      <Card title="SKUs" sub={`${skus.length} SKUs. ${skuTerm ? 'In this category a SKU is ' + skuTerm.charAt(0).toLowerCase() + skuTerm.slice(1) + '.' : rm.category_note || ''}`}>
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Id</th><th>SKU</th><th className="r">Price</th><th>Price source</th></tr></thead>
            <tbody>
              {skus.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{s.id}</td>
                  <td className="b">{s.name}</td>
                  <td className="r num">{L.money(s.price_lkr)}</td>
                  <td>{s.price_real ? <><Tag kind="real" /> <SrcLink id={s.price_source} /></> : <><Tag kind="demo" text="Estimate" /> <span className="muted small">not in the price list</span></>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {rm.category_adaptations ? (
        <Card title="How this category maps to Forevate">
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>Forevate term</th><th>Here it means</th></tr></thead>
              <tbody>{Object.entries(rm.category_adaptations).map(([k, v]) => <tr key={k}><td className="b">{k}</td><td>{v as string}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      ) : rm.category_note ? (
        <Card title="How this category maps to Forevate"><p>{rm.category_note}</p></Card>
      ) : null}
    </>
  )
}
