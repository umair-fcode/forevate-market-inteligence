import type { ComponentType } from 'react'
import { InsightsView } from './Insights'

/** Tab id -> view. Tabs not listed yet render the "coming soon" placeholder. */
export const VIEWS: Record<string, ComponentType> = {
  insights: InsightsView,
}
