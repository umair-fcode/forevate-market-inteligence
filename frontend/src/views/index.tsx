import type { ComponentType } from 'react'
import { BrandView } from './Brand'
import { CompetitorsView } from './Competitors'
import { CustomersView } from './Customers'
import { InsightsView } from './Insights'
import { PersonasView } from './Personas'

/** Tab id -> view. Tabs not listed yet render the "coming soon" placeholder. */
export const VIEWS: Record<string, ComponentType> = {
  insights: InsightsView,
  brand: BrandView,
  personas: PersonasView,
  customers: CustomersView,
  competitors: CompetitorsView,
}
