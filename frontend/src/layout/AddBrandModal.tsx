import { useState } from 'react'
import { Icon } from '../components/Icon'
import { filesToBrand } from '../lib/data'
import { useApp } from '../store/AppContext'
import { useUI } from '../store/UIContext'

export function AddBrandModal() {
  const { addBrand } = useApp()
  const { closeModal, toast } = useUI()
  const [msg, setMsg] = useState('')

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    try {
      const b = await filesToBrand(Array.from(files))
      setMsg(`Loaded ${b.name}. Opening…`)
      closeModal()
      await addBrand(b)
      toast(`${b.name} added for this visit`)
    } catch (err) {
      setMsg('Could not read those files: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Add a brand</h2>
        <button className="iconbtn" onClick={closeModal} aria-label="Close"><Icon name="x" /></button>
      </div>
      <p>Each brand is a folder of files. The dashboard reads the folder and every screen fills itself, so onboarding a second brand needs no code changes.</p>
      <pre className="code">{`brands/
  index.json              ← add one entry for the new brand
  <brand-id>/
    manifest.json         ← name, organisation, market, currency, file names
    data.json             ← one key per tab (insights, my_brand, my_personas, …)
    posts.jsonl           ← one real post per line, with its URL
    signals.json          ← the signals in full, with their evidence posts`}</pre>
      <p className="small muted">
        Use <code>brands/bajaj/</code> as the template: its <code>GUIDE.md</code> explains every field, which numbers are real and how ids link. Mark anything illustrative with <code>"demo": true</code> and it will be labelled on screen automatically.
      </p>
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <b>Try it now with your own files</b>
        <p className="small muted">Pick a <code>data.json</code> (and optionally <code>manifest.json</code>, <code>posts.jsonl</code>, <code>signals.json</code>). They stay in your browser for this visit only.</p>
        <input type="file" multiple accept=".json,.jsonl" onChange={(e) => onFiles(e.target.files)} />
        <div className="small muted">{msg}</div>
      </div>
    </>
  )
}
