/* Feeling-score wording shared by the gauges (original lines 1216-1219). */
export const FEEL_TIP =
  'How people feel: the balance of positive and negative talk, from −100 (all negative) to +100 (all positive). 0 means evenly mixed. Measured from the early signs, weighted by engagement.'

export const feelWord = (v: number | null | undefined): string =>
  v == null ? '—' : v >= 60 ? 'Very positive' : v >= 20 ? 'Positive' : v > -20 ? 'Mixed' : v > -60 ? 'Negative' : 'Very negative'
export const feelCls = (v: number | null | undefined): string => (v == null ? 'mix' : v >= 20 ? 'pos' : v <= -20 ? 'neg' : 'mix')
