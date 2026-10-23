import type { ComponentType } from 'react'
import { BrandView } from './Brand'
import { CompetitorsView } from './Competitors'
import { CustomersView } from './Customers'
import { DemandView } from './Demand'
import { InsightsView } from './Insights'
import { MarketView } from './Market'
import { PersonasView } from './Personas'
import { ResearchView } from './Research'
import { SettingsView } from './Settings'
import { SourcesView } from './Sources'

/** Tab id -> view. Tabs not listed yet render the "coming soon" placeholder. */
export const VIEWS: Record<string, ComponentType> = {
  insights: InsightsView,
  brand: BrandView,
  personas: PersonasView,
  customers: CustomersView,
  competitors: CompetitorsView,
  market: MarketView,
  demand: DemandView,
  research: ResearchView,
  settings: SettingsView,
  sources: SourcesView,
}
