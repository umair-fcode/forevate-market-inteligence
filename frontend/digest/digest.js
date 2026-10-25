/*
 * Forevate digest builder — shared by the dashboard (browser) and the mailer (Node).
 *
 *   const { build, renderHtml, renderText } = ForevateDigest;   // browser: window.ForevateDigest
 *   const { build, renderHtml, renderText } = require('./digest.js'); // Node
 *
 *   const model = build(data, { period: 'daily' | 'weekly', asOf: 'YYYY-MM-DD', brand, signals, dashboardUrl, recipients });
 *   const html  = renderHtml(model);   // complete HTML email (tables + inline styles)
 *   const text  = renderText(model);   // plain-text alternative
 *   model.subject, model.preheader, model.recipients
 *
 * `data` is a brand's data.json (one key per tab); `signals` is signals.json's `signals` array (needed for the
 * date of each signal's latest evidence); `brand` is the brand's manifest.json.
 * Every number, date and link in the output comes from those two files; nothing is invented.
 * build() is pure and deterministic: the same inputs always give the same digest.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ForevateDigest = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- small helpers ---------- */
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString('en-US');
  const compact = n => n == null ? '—' : Math.abs(n) >= 1e6 ? (n/1e6).toFixed(2).replace(/\.?0+$/,'') + 'M' : Math.abs(n) >= 1e4 ? (n/1e3).toFixed(1).replace(/\.0$/,'') + 'k' : fmt(n);
  const signed = n => n == null ? '—' : (n > 0 ? '+' : '') + fmt(n);
  const pct = n => n == null ? '—' : (n > 0 ? '+' : '') + n + '%';
  const toDate = s => { if (!s) return null; const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(s)); return m ? new Date(Date.UTC(+m[1], +m[2]-1, m[3] ? +m[3] : 1)) : null; };
  const iso = d => d.toISOString().slice(0, 10);
  const addDays = (s, n) => { const d = toDate(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
  const dfmt = s => { const d = toDate(s); if (!d) return s || '—'; return /^\d{4}-\d{2}$/.test(String(s)) ? `${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}` : `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const dshort = s => { const d = toDate(s); return d ? `${d.getUTCDate()} ${MON[d.getUTCMonth()]}` : (s || '—'); };
  const dlong = s => { const d = toDate(s); return d ? `${DAY[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}` : s; };
  const within = (s, start, end) => { const d = (s || '').slice(0, 10); return !!d && d >= start && d <= end; };
  const feelWord = v => v == null ? '—' : v >= 60 ? 'Very positive' : v >= 20 ? 'Positive' : v > -20 ? 'Mixed' : v > -60 ? 'Negative' : 'Very negative';
  const STATUS_W = { Risk: 3, Watch: 2, Opportunity: 1.6 };
  const IMPACT_W = { High: 3, Medium: 2, Low: 1 };
  const TAB_HASH = { 'Insights': 'insights', 'My Brand': 'brand', 'My Personas': 'personas', 'My Customers': 'customers', 'My Competitors': 'competitors', 'My Market': 'market', 'My Demand': 'demand', 'Deep Research': 'research' };

  /* ---------- build ---------- */
  function build(data, opts) {
    opts = opts || {};
    const period = opts.period === 'weekly' ? 'weekly' : 'daily';
    const asOf = (opts.asOf || (data._readme && data._readme.as_of) || iso(new Date())).slice(0, 10);
    const brand = opts.brand || {};
    const name = (data.global && data.global.brand) || brand.name || 'Your brand';
    const market = (data.global && data.global.market) || brand.market || '';
    const url = (opts.dashboardUrl || '').replace(/#.*$/, '');
    const link = tab => url ? `${url}#${tab}` : '';
    const sigs = {}; (data.signal_index || []).forEach(s => { sigs[s.rank] = s; });
    (opts.signals || []).forEach(s => { if (s.rank == null) return; sigs[s.rank] = Object.assign({}, sigs[s.rank] || {}, s, { engagement: s.engagement || s.total_evidence_engagement || 0, evidence_posts: typeof s.evidence_posts === 'number' ? s.evidence_posts : (s.evidence_posts || []).length }); });
    const insights = (data.insights && data.insights.detailed_insights) || [];
    const insightById = {}; insights.forEach(i => { insightById[i.id] = i; });
    const means = s => s && s.what_it_means_for_brand ? s.what_it_means_for_brand : '';

    // ---- window: daily = since yesterday (extended up to 3 days back if quiet); weekly = last 7 days
    let lookback = period === 'weekly' ? 6 : Math.max(1, opts.lookbackDays || 1);
    const gather = (start, end) => {
      const items = [];
      (data.global && data.global.alerts || []).forEach(a => { if (within(a.date, start, end)) items.push({ kind: 'Alert', status: a.level, title: a.text, date: a.date, score: a.level === 'Risk' ? 100 : a.level === 'Watch' ? 70 : 60, link: link('insights'), insight: a.insight }); });
      Object.values(sigs).forEach(s => { if (!within(s.latest_evidence_date || '', start, end)) return; const eng = s.engagement || 0; items.push({ kind: 'Signal', status: s.sentiment, title: s.title, body: s.what_we_see, means: means(s), date: s.latest_evidence_date, meta: `${s.how_sure_we_are}% sure · ${fmt(s.evidence_posts)} posts · ${compact(eng)} engagement`, area: s.decision_area, scope: s.evidence_scope, rank: s.rank, link: link(TAB_HASH[s.tab] || 'insights'), score: 20 + (s.how_sure_we_are || 0) / 100 * 25 + Math.log10(eng + 10) * 6 + (s.sentiment === 'Negative' ? 10 : 0) }); });
      (data.my_competitors && data.my_competitors.what_changed_this_week || []).forEach(c => { if (!within(c.date, start, end)) return; const s = c.signal || {}; items.push({ kind: 'Competitor', status: c.brand, title: c.change, body: c.what_we_see, means: c.what_it_means_for_us, date: c.date, meta: s.how_sure_we_are != null ? `${s.how_sure_we_are}% sure · ${compact(s.engagement)} engagement` : '', link: link('competitors'), rank: s.rank, score: 55 + Math.log10((s.engagement || 0) + 10) * 4 }); });
      (data.my_market && data.my_market.market_feed || []).forEach(f => { if (!within(f.date, start, end)) return; const s = f.signal || {}; items.push({ kind: f.tag || 'Market', status: f.decision_area, title: f.item, body: f.what_we_see || '', means: f.means, date: f.date, meta: s.how_sure_we_are != null ? `${s.how_sure_we_are}% sure · ${compact(s.engagement)} engagement` : '', link: link('market'), rank: s.rank, score: 50 + Math.log10((s.engagement || 0) + 10) * 4 }); });
      const kn = (data.my_market && data.my_market.key_numbers) || {};
      Object.keys(kn).forEach(k => { const arr = kn[k]; if (!Array.isArray(arr)) return; arr.forEach((pt, i) => { if (!i) return; const d = pt.date || pt.month; if (!within(d, start, end) || pt.value === arr[i-1].value) return; const label = k.replace(/_(lkr|pct)\b/g, '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()); const isPct = /pct$/.test(k); const dv = pt.value - arr[i-1].value; items.push({ kind: 'Number', status: dv > 0 ? 'Up' : 'Down', title: `${label} ${dv > 0 ? 'up' : 'down'} to ${isPct ? pt.value + '%' : 'Rs. ' + fmt(pt.value)}`, body: `${isPct ? (dv > 0 ? '+' : '') + dv.toFixed(1) + ' pts' : (dv > 0 ? '+' : '−') + 'Rs. ' + fmt(Math.abs(dv))} since ${dfmt(arr[i-1].date || arr[i-1].month)}.`, date: d, link: link('market'), score: 45 }); }); });
      // remove duplicates (same signal surfaced via feed/competitor and the index)
      const seen = new Set(); return items.filter(it => { const key = it.rank ? 'r' + it.rank : 't' + it.title; if (seen.has(key)) return false; seen.add(key); return true; }).sort((a, b) => b.score - a.score);
    };
    let start = addDays(asOf, -lookback), items = gather(start, asOf);
    if (period === 'daily') { while (items.length < 4 && lookback < 3) { lookback++; start = addDays(asOf, -lookback); items = gather(start, asOf); } }
    const windowLabel = period === 'weekly' ? `${dshort(start)} – ${dshort(asOf)} ${toDate(asOf).getUTCFullYear()}` : (lookback === 1 ? `since ${dshort(start)}` : `${dshort(start)} – ${dshort(asOf)}`);

    // ---- what lies ahead
    const ahead = period === 'weekly' ? 14 : 7; const aheadEnd = addDays(asOf, ahead);
    const seenEv = new Set();
    const upcoming = ((data.my_market && data.my_market.coming_up) || []).concat((data.insights && data.insights.overview && data.insights.overview.coming_up) || [])
      .filter(u => within(u.date, addDays(asOf, 1), aheadEnd) && !seenEv.has(u.event) && seenEv.add(u.event))
      .sort((a, b) => a.date.localeCompare(b.date)).map(u => ({ date: u.date, title: u.event, tag: u.tag, body: u.expected_effect, direction: u.direction, insight: u.insight, link: link('market') }));
    const due = []; insights.forEach(i => (i.what_to_do || []).forEach(a => { if (within(a.by_when, asOf, aheadEnd)) due.push({ date: a.by_when, title: a.action, owner: a.owner, insight: i.id, status: i.status, link: link('insights') }); })); due.sort((a, b) => a.date.localeCompare(b.date));

    // ---- insights touched by this window (daily) / top insights (weekly)
    const windowRanks = new Set(items.filter(it => it.rank).map(it => it.rank));
    const insightScore = i => (STATUS_W[i.status] || 1) * (IMPACT_W[i.impact] || 1) * ((i.how_sure_we_are || 50) / 100);
    const insightCard = i => ({ id: i.id, status: i.status, area: i.decision_area, impact: i.impact, sure: i.how_sure_we_are, title: i.headline, body: i.why_it_matters, when: i.time_window, action: (i.what_to_do || [])[0] || null, ifNot: i.if_you_dont_act, evidence: `${((i.evidence || {}).signals || []).length} early signs · ${((i.evidence || {}).posts || []).length} posts · ${((i.evidence || {}).public_sources || []).length} public sources`, link: link('insights') });
    const touched = insights.filter(i => ((i.evidence || {}).signals || []).some(s => windowRanks.has(s.rank)) || items.some(it => it.insight === i.id)).sort((a, b) => insightScore(b) - insightScore(a));
    const topInsights = insights.slice().sort((a, b) => insightScore(b) - insightScore(a));

    // ---- weekly numbers
    const bp = (data.my_brand && data.my_brand.overview && data.my_brand.overview.brand_pulse) || {};
    const fot = (data.my_brand && data.my_brand.overview && data.my_brand.overview.feeling_over_time) || [];
    const bk = fot.length ? Object.keys(fot[0]).find(k => k.endsWith('_posts') && k.slice(0, -6) === name.toLowerCase().replace(/[^a-z0-9]/g, '')) || Object.keys(fot[0]).find(k => k.endsWith('_posts')) : null;
    const weeks = fot.filter(w => w.week_ending <= addDays(asOf, 6)); const wk = weeks[weeks.length - 1], pw = weeks[weeks.length - 2];
    const numbers = [];
    if (wk && bk) numbers.push({ label: 'Posts about us this week', value: fmt(wk[bk]), change: pw && pw[bk] ? pct(Math.round((wk[bk] - pw[bk]) / pw[bk] * 100)) + ' vs last week' : '', real: true });
    if (bp.how_people_feel_net != null) numbers.push({ label: 'How people feel', value: `${feelWord(bp.how_people_feel_net)} (${signed(bp.how_people_feel_net)})`, change: 'from the early signs, weighted by engagement', real: true });
    const share = (bp.share_of_conversation || []).find(s => s.brand === name); if (share) numbers.push({ label: 'Share of the conversation', value: share.share_pct + '%', change: `of ${(bp.share_of_conversation || []).length} brands monitored`, real: true });
    const dm = data.my_demand || {}; const sp = (dm.overview || {}).sales_pulse; if (sp) numbers.push({ label: `${sp.units != null ? 'Units' : 'Tonnes'} sold, ${sp.period}`, value: fmt(sp.units != null ? sp.units : sp.tonnes), change: pct(sp.vs_last_month_pct) + ' vs last month', real: !dm.demo || ((dm.overview.early_signs_vs_sales || []).some(m => m.real)) });
    const scorecard = ((data.insights && data.insights.overview && data.insights.overview.decision_scorecard) || []).map(s => ({ area: s.area, status: s.status, reason: s.reason, signs: s.early_signs, insight: s.top_insight, link: link('insights') }));
    const tracker = ((data.insights && data.insights.actions) || []).map(a => ({ title: a.action, status: a.status, owner: a.owner, result: a.result, insight: a.from_insight }));
    const stock = ((dm.sales_ahead || {}).stock_alerts || []).filter(s => s.type === 'Running out').map(s => ({ sku: s.sku, region: s.province, weeks: s.weeks_of_cover, note: s.note }));

    // ---- totals for the "don't miss" line
    const totalSignalsWeek = Object.values(sigs).filter(s => within(s.latest_evidence_date || '', addDays(asOf, -6), asOf)).length;
    const top = period === 'daily' ? items.slice(0, 5) : items.filter(it => it.kind === 'Signal').slice(0, 5);
    const countKinds = () => { const c = { 'early sign': 0, 'competitor move': 0, 'market change': 0, 'cost change': 0, 'alert': 0 }; items.forEach(i => { c[i.kind === 'Signal' ? 'early sign' : i.kind === 'Competitor' ? 'competitor move' : i.kind === 'Alert' ? 'alert' : i.kind === 'Number' ? 'cost change' : 'market change']++; }); return Object.keys(c).filter(k => c[k]).map(k => `${c[k]} ${k}${c[k] === 1 ? '' : 's'}`); };
    const parts = countKinds();
    const lead = period === 'daily'
      ? (items.length ? `${items.length} change${items.length === 1 ? '' : 's'} ${windowLabel}: ${parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0]}. The most important are below; the rest are in the dashboard.` : `Nothing new was detected ${windowLabel}.`)
      : (data.insights && data.insights.so_what) || '';
    const subject = period === 'daily'
      ? `${name}: what changed today${top[0] ? ' — ' + top[0].title : ''}`
      : `${name}: your week in market signals (${windowLabel})`;
    const preheader = period === 'daily' ? lead : `${topInsights.filter(i => i.status === 'Risk').length} risks, ${topInsights.filter(i => i.status === 'Watch').length} to watch, ${topInsights.filter(i => i.status === 'Opportunity').length} opportunities. ${totalSignalsWeek} early signs this week.`;

    return {
      version: 1, period, asOf, window: { start, end: asOf, label: windowLabel, lookbackDays: lookback },
      brand: { name, market, organisation: brand.organisation || (data.settings && data.settings.brand && (data.settings.brand.distributor || data.settings.brand.company)) || '' },
      dashboardUrl: url, recipients: opts.recipients || brand.recipients || [],
      subject, preheader, lead,
      top, items, touched: touched.slice(0, 3).map(insightCard), topInsights: topInsights.slice(0, 4).map(insightCard),
      upcoming: upcoming.slice(0, 6), due: due.slice(0, 6), numbers, scorecard, tracker, stock,
      counts: { items: items.length, signalsWeek: totalSignalsWeek, insights: insights.length, risks: insights.filter(i => i.status === 'Risk').length },
      demo: { demand: !!dm.demo, customers: !!(data.my_customers && data.my_customers.demo) },
      dataNote: (data.my_brand && data.my_brand.data_basis && data.my_brand.data_basis.period) ? `Monitored period: ${data.my_brand.data_basis.period}.` : ''
    };
  }

  /* ---------- HTML email ---------- */
  const C = { navy: '#153264', cobalt: '#0054A5', ink: '#152238', muted: '#60708C', line: '#E4E9F1', bg: '#F3F6FB', tint: '#EAF6FD', good: '#1A7F4B', goodTint: '#E2F4EA', warn: '#A3480A', warnTint: '#FFF1E5', risk: '#C62236', riskTint: '#FDECEE', demo: '#6B5A00', demoTint: '#FFF4C7', canary: '#FFC20E' };
  const FONT = "font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;";
  const statusColor = s => s === 'Risk' || s === 'Negative' || s === 'Down' ? [C.risk, C.riskTint] : s === 'Watch' || s === 'Mixed' || s === 'Neutral' ? [C.warn, C.warnTint] : s === 'Opportunity' || s === 'Positive' || s === 'Up' ? [C.good, C.goodTint] : [C.muted, C.bg];
  const pill = s => { if (!s) return ''; const [fg, bg] = statusColor(s); return `<span style="display:inline-block;padding:2px 9px;border-radius:999px;background:${bg};color:${fg};font-size:12px;font-weight:700;line-height:18px;${FONT}">${esc(s)}</span>`; };
  const tag = (t, kind) => `<span style="display:inline-block;padding:2px 7px;border-radius:5px;background:${kind === 'demo' ? C.demoTint : C.bg};color:${kind === 'demo' ? C.demo : C.muted};font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;line-height:16px;${FONT}">${esc(t)}</span>`;
  const btn = (href, label) => href ? `<a href="${esc(href)}" style="display:inline-block;background:${C.cobalt};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;${FONT}">${esc(label)}</a>` : '';
  const small = (href, label) => href ? `<a href="${esc(href)}" style="color:${C.cobalt};text-decoration:none;font-weight:700;font-size:13px;${FONT}">${esc(label)} &rarr;</a>` : '';
  const meansBox = (name, t) => t ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px"><tr><td style="background:${C.tint};border-radius:10px;padding:10px 14px"><div style="font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:${C.cobalt};${FONT}">What it means for ${esc(name)}</div><div style="font-size:14px;line-height:21px;color:${C.ink};margin-top:3px;${FONT}">${esc(t)}</div></td></tr></table>` : '';
  const h2 = t => `<tr><td style="padding:28px 28px 10px"><div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:${C.muted};${FONT}">${esc(t)}</div></td></tr>`;
  const card = inner => `<tr><td style="padding:0 28px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:14px"><tr><td style="padding:16px 18px">${inner}</td></tr></table></td></tr>`;
  const p = (t, extra) => `<div style="font-size:14px;line-height:21px;color:${C.ink};${FONT}${extra || ''}">${t}</div>`;
  const itemCard = (m, it) => card(`<div style="margin-bottom:8px">${pill(it.status)} ${tag(it.kind)}${it.scope && it.scope !== 'Sri Lanka' ? ' ' + tag(/global/i.test(it.scope) ? 'Pattern seen elsewhere' : 'Mixed evidence') : ''} <span style="font-size:12px;color:${C.muted};${FONT}">${esc(dshort(it.date))}</span></div><div style="font-size:16px;line-height:22px;font-weight:700;color:${C.ink};${FONT}">${esc(it.title)}</div>${it.body ? p(esc(it.body), 'margin-top:6px;') : ''}${meansBox(m.brand.name, it.means)}<div style="margin-top:10px;font-size:12px;color:${C.muted};${FONT}">${esc(it.meta || '')}${it.meta && it.link ? ' &nbsp;·&nbsp; ' : ''}${small(it.link, 'See the evidence')}</div>`);
  const insightCardHtml = (m, i) => card(`<div style="margin-bottom:8px">${pill(i.status)} ${tag(i.area)} ${tag('Impact ' + i.impact)} <span style="font-size:12px;color:${C.muted};${FONT}">${i.sure}% sure · ${esc(i.when)}</span></div><div style="font-size:16px;line-height:22px;font-weight:700;color:${C.ink};${FONT}">${esc(i.title)}</div>${p(esc(i.body), 'margin-top:6px;')}${i.action ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px"><tr><td style="background:${C.bg};border-radius:10px;padding:10px 14px"><div style="font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:${C.muted};${FONT}">What to do first</div><div style="font-size:14px;line-height:21px;color:${C.ink};margin-top:3px;${FONT}">${esc(i.action.action)}</div><div style="font-size:12px;color:${C.muted};margin-top:2px;${FONT}">By ${esc(dfmt(i.action.by_when))} · ${esc(i.action.owner)}</div></td></tr></table>` : ''}<div style="margin-top:10px;font-size:12px;color:${C.muted};${FONT}">${esc(i.evidence)} &nbsp;·&nbsp; ${small(i.link, 'Open ' + i.id)}</div>`);
  const row = (left, right) => `<tr><td style="padding:0 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid ${C.line}"><tr><td width="70" valign="top" style="padding:10px 0;font-size:12px;color:${C.muted};${FONT}">${left}</td><td valign="top" style="padding:10px 0">${right}</td></tr></table></td></tr>`;
  const dirWord = d => d === 'up' ? `<span style="color:${C.good};font-weight:700">&uarr; likely to lift sales</span>` : d === 'down' ? `<span style="color:${C.risk};font-weight:700">&darr; likely to lower sales</span>` : `<span style="color:${C.warn};font-weight:700">&harr; mixed effect</span>`;
  const empty = t => `<tr><td style="padding:0 28px 12px"><div style="border:1px dashed ${C.line};border-radius:12px;padding:14px;text-align:center;font-size:13px;color:${C.muted};${FONT}">${esc(t)}</div></td></tr>`;

  function renderHtml(m) {
    const daily = m.period === 'daily'; const n = m.brand.name;
    const title = daily ? 'What changed today' : 'Your week in market signals';
    const dateLine = daily ? dlong(m.asOf) : m.window.label;
    let body = '';
    // header
    body += `<tr><td style="background:${C.navy};padding:22px 28px;border-radius:16px 16px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-.01em;${FONT}">Forevate</td><td align="right" style="font-size:12px;color:#BFD3F2;${FONT}">${esc(n)}${m.brand.market ? ' · ' + esc(m.brand.market) : ''}</td></tr></table></td></tr>`;
    body += `<tr><td style="padding:26px 28px 0"><div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:${C.cobalt};${FONT}">${esc(daily ? 'Daily digest' : 'Weekly digest')} · ${esc(dateLine)}</div><div style="font-size:26px;line-height:32px;font-weight:800;color:${C.ink};margin-top:6px;letter-spacing:-.02em;${FONT}">${esc(title)}</div>${m.lead ? p(esc(m.lead), 'margin-top:10px;font-size:15px;line-height:23px;') : ''}</td></tr>`;
    if (daily) {
      body += h2(m.top.length ? `The ${m.top.length} thing${m.top.length === 1 ? '' : 's'} to know` : 'Nothing new since the last digest');
      m.top.forEach(it => body += itemCard(m, it));
      if (!m.top.length) body += empty('No new early signs, competitor moves or market changes were detected in this window.');
      if (m.touched.length) { body += h2('Insights with new evidence'); m.touched.forEach(i => body += insightCardHtml(m, i)); }
    } else {
      // where we stand
      body += h2('Where we stand');
      if (m.scorecard.length) body += `<tr><td style="padding:0 28px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${m.scorecard.map(s => { const [fg] = statusColor(s.status); return `<td width="25%" valign="top" style="padding:0 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-top:3px solid ${fg};border-radius:10px"><tr><td style="padding:10px 10px 12px"><div style="font-size:13px;font-weight:700;color:${C.ink};${FONT}">${esc(s.area)}</div><div style="margin:4px 0 6px">${pill(s.status)}</div><div style="font-size:12px;line-height:17px;color:${C.muted};${FONT}">${esc(s.reason)}</div></td></tr></table></td>`; }).join('')}</tr></table></td></tr>`;
      if (m.numbers.length) body += `<tr><td style="padding:4px 28px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};border-radius:12px"><tr>${m.numbers.map(x => `<td width="${Math.floor(100 / m.numbers.length)}%" valign="top" style="padding:14px 12px"><div style="font-size:11px;color:${C.muted};${FONT}">${esc(x.label)} ${x.real ? '' : tag('Demo', 'demo')}</div><div style="font-size:18px;font-weight:800;color:${C.ink};margin-top:3px;${FONT}">${esc(x.value)}</div><div style="font-size:11px;color:${C.muted};margin-top:2px;${FONT}">${esc(x.change)}</div></td>`).join('')}</tr></table></td></tr>`;
      body += h2('Insights to act on');
      m.topInsights.forEach(i => body += insightCardHtml(m, i));
      body += h2('Biggest early signs this week');
      m.top.forEach(it => body += itemCard(m, it));
      if (!m.top.length) body += empty('No new early signs this week.');
      const comp = m.items.filter(i => i.kind === 'Competitor'); if (comp.length) { body += h2('Competitor moves'); comp.slice(0, 4).forEach(it => body += itemCard(m, it)); }
      const mkt = m.items.filter(i => !['Signal', 'Competitor', 'Alert'].includes(i.kind)); if (mkt.length) { body += h2('Market changes'); mkt.slice(0, 4).forEach(it => body += itemCard(m, it)); }
    }
    // ahead
    body += h2(daily ? 'Coming up in the next 7 days' : 'Coming up in the next 2 weeks');
    if (m.upcoming.length) m.upcoming.forEach(u => body += row(esc(dshort(u.date)), `<div style="font-size:14px;font-weight:700;color:${C.ink};${FONT}">${esc(u.title)} ${tag(u.tag)}</div><div style="font-size:13px;line-height:19px;color:${C.muted};margin-top:2px;${FONT}">${esc(u.body)} · ${dirWord(u.direction)}</div>`)); else body += empty('No dated events in this window.');
    body += h2(daily ? 'Decisions due this week' : 'Decisions due in the next 2 weeks');
    if (m.due.length) m.due.forEach(d => body += row(esc(dshort(d.date)), `<div style="font-size:14px;font-weight:700;color:${C.ink};${FONT}">${esc(d.title)}</div><div style="font-size:12px;color:${C.muted};margin-top:2px;${FONT}">${esc(d.owner)} · from ${esc(d.insight)} ${pill(d.status)}</div>`)); else body += empty('No decision deadlines in this window. The next ones are in the dashboard.');
    if (!daily && m.stock.length) { body += h2('Stock risks'); body += `<tr><td style="padding:0 28px 12px"><div style="font-size:12px;color:${C.muted};margin-bottom:6px;${FONT}">${tag('Demo data', 'demo')} until sales data is connected</div>${m.stock.slice(0, 4).map(s => `<div style="font-size:13px;line-height:20px;color:${C.ink};${FONT}"><b>${esc(s.sku)}</b> in ${esc(s.region)}: ${s.weeks} weeks of cover${s.note ? ' · ' + esc(s.note) : ''}</div>`).join('')}</td></tr>`; }
    // CTA
    body += `<tr><td style="padding:26px 28px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.navy};border-radius:14px"><tr><td style="padding:22px 24px"><div style="font-size:17px;font-weight:800;color:#ffffff;${FONT}">Don't miss a signal</div><div style="font-size:14px;line-height:21px;color:#BFD3F2;margin-top:4px;${FONT}">${esc(m.counts.signalsWeek)} early signs were detected for ${esc(n)} in the last 7 days, feeding ${esc(m.counts.insights)} open insights (${esc(m.counts.risks)} at risk). Every number above links to its real posts and public sources in Forevate.</div><div style="margin-top:14px">${btn(m.dashboardUrl ? m.dashboardUrl + '#insights' : '', 'Open Forevate')}</div></td></tr></table></td></tr>`;
    // footer
    body += `<tr><td style="padding:18px 28px 26px"><div style="font-size:11.5px;line-height:17px;color:${C.muted};${FONT}">You receive this ${daily ? 'every evening' : 'every Monday'} because you are a registered contact for ${esc(n)} in Forevate${m.recipients.length ? ' (' + m.recipients.map(r => esc(r.email)).join(', ') + ')' : ''}. Numbers marked ${tag('Demo', 'demo')} are illustrative until that source is connected; everything else comes from monitored posts and public sources. ${esc(m.dataNote)}<br><br><a href="${esc(m.dashboardUrl || '#')}" style="color:${C.muted}">Manage digest settings</a> · <a href="${esc(m.dashboardUrl || '#')}" style="color:${C.muted}">Unsubscribe</a> · Forevate Market Intelligence OS</div></td></tr>`;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(m.subject)}</title></head><body style="margin:0;padding:0;background:${C.bg};"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(m.preheader)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:24px 12px"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;border:1px solid ${C.line}">${body}</table></td></tr></table></body></html>`;
  }

  /* ---------- plain text ---------- */
  function renderText(m) {
    const n = m.brand.name; const L = [];
    L.push(`FOREVATE · ${n}${m.brand.market ? ' · ' + m.brand.market : ''}`);
    L.push(m.period === 'daily' ? `What changed today — ${dlong(m.asOf)}` : `Your week in market signals — ${m.window.label}`);
    if (m.lead) L.push('', m.lead);
    const item = it => { L.push('', `* ${it.title}${it.status ? ' [' + it.status + ']' : ''}`); if (it.body) L.push(`  ${it.body}`); if (it.means) L.push(`  What it means for ${n}: ${it.means}`); if (it.meta) L.push(`  ${it.meta}`); if (it.link) L.push(`  ${it.link}`); };
    if (m.period === 'daily') { L.push('', `THE THINGS TO KNOW (${m.top.length})`); m.top.forEach(item); }
    else { L.push('', 'WHERE WE STAND'); m.scorecard.forEach(s => L.push(`* ${s.area}: ${s.status} — ${s.reason}`)); m.numbers.forEach(x => L.push(`* ${x.label}: ${x.value} (${x.change})${x.real ? '' : ' [demo]'}`)); L.push('', 'INSIGHTS TO ACT ON'); m.topInsights.forEach(i => { L.push('', `* ${i.id} [${i.status}] ${i.title}`, `  ${i.body}`); if (i.action) L.push(`  Do first: ${i.action.action} (by ${dfmt(i.action.by_when)}, ${i.action.owner})`); if (i.link) L.push(`  ${i.link}`); }); L.push('', 'BIGGEST EARLY SIGNS THIS WEEK'); m.top.forEach(item); }
    L.push('', 'COMING UP'); if (m.upcoming.length) m.upcoming.forEach(u => L.push(`* ${dshort(u.date)} — ${u.title}: ${u.body}`)); else L.push('* No dated events in this window.');
    L.push('', 'DECISIONS DUE'); if (m.due.length) m.due.forEach(d => L.push(`* ${dshort(d.date)} — ${d.title} (${d.owner}, ${d.insight})`)); else L.push('* None in this window.');
    L.push('', `Open Forevate: ${m.dashboardUrl ? m.dashboardUrl + '#insights' : ''}`, '', `${m.counts.signalsWeek} early signs in the last 7 days · ${m.counts.insights} open insights · ${m.counts.risks} at risk.`);
    return L.join('\n');
  }

  return { build, renderHtml, renderText, version: 1 };
});
