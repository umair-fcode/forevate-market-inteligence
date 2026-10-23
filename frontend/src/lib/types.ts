/* Core shapes. data.json is large and irregular, so its sections stay loosely typed (any) and are tightened as each view is ported. */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json = any

export interface BrandEntry {
  id: string
  name: string
  organisation?: string
  market?: string
  category?: string
  folder?: string
  status?: string
  /** Brands added in-browser carry their files inline instead of a folder. */
  inline?: { data: Json; signals?: Json[]; posts?: string; manifest?: Json }
}

export interface Manifest {
  id?: string
  name?: string
  organisation?: string
  market?: string
  currency?: string
  currency_prefix?: string
  as_of?: string
  research_example?: string
  research_due_default?: string
  integrations_hint?: string
  files?: { data?: string; posts?: string; signals?: string }
  sales_unit?: string
  real_anchor?: string
  voice_labels?: Record<string, string>
  post_voice_labels?: Record<string, string>
  organic_noun?: string
  data_basis?: string
  guide?: string
  recipients?: { name: string; email: string; role?: string; digests?: string[] }[]
  [k: string]: Json
}

export type Signal = Record<string, Json> & { rank: number; id?: string; signal_id?: string; full?: boolean }
export type Post = Record<string, Json> & { url: string; id?: string }

/** Everything loaded for the selected brand. */
export interface BrandData {
  brand: BrandEntry & Manifest
  D: Json
  SIG: Record<string | number, Signal>
  SIGID: Record<string, Signal>
  POSTS: Record<string, Post>
  POSTID: Record<string, Post>
}

export interface Filters {
  sku: string
  persona: string
  province: string
  area: string
}

export interface TabDef {
  id: string
  name: string
  q: string
  subs: string[]
  tips: string[]
}
