/* Tab definitions, ported verbatim from the original (lines 866-880). */
import type { TabDef } from './types'

export const TABS: TabDef[] = [
  {id:'insights', name:'Insights', q:'How will the signals combine to affect my product, pricing, availability and promotion? Which decision area needs attention now, what to do and by when.', subs:['Overview','Detailed insights','Actions'], tips:['Decision scorecard, what is coming up and open insights by region','Every insight with its reasoning, evidence and what to do','What the team acted on, who owns it and what happened afterwards']},
  {id:'brand', name:'My Brand', q:'What are people saying about us? Is our perception improving or slipping, which SKUs are praised or criticised, is a promotion landing.', subs:['Overview','Conversations','Campaigns'], tips:['Brand pulse, talk over time and the SKU scorecard','Themes people link us with and the real post feed','Buzz before and after each campaign']},
  {id:'personas', name:'My Personas', q:'What do my future customers need, and how are they changing? One complete page per persona.', subs:[], tips:[]},
  {id:'customers', name:'My Customers', q:'What do my actual customers think? Why they stay or leave, top complaints by SKU and who is at risk of leaving.', subs:['Overview','Feedback','Customers we may lose'], tips:['Ratings, review volume, complaint rate and why they stay or leave','Complaints by issue and by region, with the review feed','Customer groups showing signs of leaving, and why']},
  {id:'competitors', name:'My Competitors', q:'What are competitors changing? Who is gaining and why, the price gap by SKU, launches that threaten our SKUs and open positioning space.', subs:['What changed this week','Head to head','Sentiments'], tips:['Price, launch, campaign and pack changes this week, each with what it means for us','Our brand against every competitor: the comparison grid, registrations, positioning map and what it means','How people feel about each brand, what drives it and how it is moving, with the evidence']},
  {id:'market', name:'My Market', q:'What outside forces will affect my product, pricing, availability and promotion? Events, cost pressures, regulation, seasons and spending power.', subs:[], tips:[]},
  {id:'demand', name:'My Demand', q:'Are the signals turning into sales? Expected vs real sales, the outlook by SKU and region, stock risks and channel shifts.', subs:['Overview','Sales ahead','Channels'], tips:['Sales pulse and the early-signs-vs-sales proof chart','Expected sales for the next 4–12 weeks, stock risks and regions','Share of showrooms, dealers and online over time']},
  {id:'research', name:'Deep Research', q:'What do I need to dig deeper on? Ask any question, run scenario tests, or brief a research partner.', subs:['AI Deep Research','Research partners'], tips:['Ask any question; every answer searches the web and Forevate data','Brief a research partner when the data is not enough, and track each request']},
]

export const EXTRA: TabDef[] = [
  {id:'settings', name:'Settings', q:'Brand and SKU setup, competitors, personas, keywords, integrations, users and roles.', subs:['Brand & SKUs','Competitors','Personas','Keywords','Integrations','Users & roles'], tips:['The brand, its market and every SKU with its price','Competitor brands and how their SKUs match ours','The AI-guided session that drafted the personas','Terms Forevate listens for and where it collects posts','Connected and not-yet-connected data sources','Who can see which brand, and their role']},
  {id:'sources', name:'Sources & data', q:'Every public source, feed and data method behind the numbers on screen.', subs:[], tips:[]},
]

export const ALL_TABS: TabDef[] = TABS.concat(EXTRA)
