/* Email digest builder. digest/digest.js is a UMD module shared with the Node mailer (digest/send-digest.example.js);
   in the browser it registers itself as window.ForevateDigest when imported for its side effect. */
import '../../digest/digest.js'
import type { Json } from './types'

export interface DigestModel {
  subject: string
  preheader: string
  recipients?: { name: string; email: string; role?: string; digests?: string[] }[]
  [k: string]: Json
}

interface ForevateDigestApi {
  build: (data: Json, opts: Json) => DigestModel
  renderHtml: (model: DigestModel) => string
  renderText: (model: DigestModel) => string
}

declare global {
  interface Window {
    ForevateDigest?: ForevateDigestApi
  }
}

export const getDigest = (): ForevateDigestApi | undefined => window.ForevateDigest

/** Trigger a browser download of `data` as `filename`. */
export function downloadText(filename: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
