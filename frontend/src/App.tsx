import { useApp } from './store/AppContext'
import { ICONS } from './components/icons'
import { compact, dfmt } from './lib/format'

/* Temporary foundation check; replaced by the real shell in step 3. */
export default function App() {
  const { brands, data, L, booting, loading, error, selectBrand } = useApp()

  if (booting || loading) return <div className="loading"><div className="spin" /><div>Loading brand data…</div></div>
  if (error) return <div className="empty">Could not load brand: {error}</div>
  if (!data || !L) return <div className="empty">No brand is onboarded yet.</div>

  const D = data.D
  return (
    <main style={{ padding: 24 }}>
      <h1>Forevate Market Intelligence</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {brands.map((b) => (
          <button key={b.id} className="btn sm" onClick={() => selectBrand(b)} aria-pressed={b.id === data.brand.id}>
            {b.name}
          </button>
        ))}
      </div>
      <ul>
        <li>Brand: {data.brand.name} · {data.brand.market} · as of {dfmt(data.brand.as_of)}</li>
        <li>Data sections: {Object.keys(D).length}</li>
        <li>Signals: {Object.keys(data.SIGID).length} · Posts: {compact(Object.keys(data.POSTS).length)}</li>
        <li>SKUs: {(D.settings?.skus || []).length} (first: {L.skuShort(D.settings?.skus?.[0]?.id)})</li>
        <li>Sample money: {L.money(125000)}</li>
        <li>Icons loaded: {Object.keys(ICONS).length} <span dangerouslySetInnerHTML={{ __html: ICONS.insights }} style={{ display: 'inline-block', width: 18 }} /></li>
      </ul>
    </main>
  )
}
