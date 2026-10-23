#!/usr/bin/env node
/*
 * Example mailer for the Forevate email digests.
 *
 *   node send-digest.example.js --brand bajaj --period daily            # today's digest, printed to stdout
 *   node send-digest.example.js --brand bajaj --period weekly --as-of 2026-10-21 --out ./out
 *   node send-digest.example.js --all --period daily --send              # every brand, really send
 *
 * Schedule it (cron, Asia/Colombo):
 *   0 18 * * *   node send-digest.example.js --all --period daily  --send   # every evening
 *   0 8  * * 1   node send-digest.example.js --all --period weekly --send   # Monday morning, covering the last 7 days
 *
 * It uses exactly the same digest.js as the dashboard, so what a brand manager previews in the
 * alerts pane is what they receive. Replace `deliver()` with your mail provider (SES, SendGrid,
 * Postmark, SMTP via nodemailer…). Nothing else needs to change.
 */
const fs = require('fs');
const path = require('path');
const Digest = require('./digest.js');

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : dflt; };
const BRANDS_DIR = path.resolve(opt('brands', path.join(__dirname, '..', 'brands')));
const period = opt('period', 'daily');                       // 'daily' | 'weekly'
const asOf = opt('as-of', null);                             // defaults to the brand data's as_of; in production pass today's date
const outDir = opt('out', null);
const send = !!opt('send', false);

const index = JSON.parse(fs.readFileSync(path.join(BRANDS_DIR, 'index.json'), 'utf8'));
const wanted = opt('all', false) ? index.brands.map(b => b.id) : [opt('brand', index.brands[0].id)];

async function deliver({ to, subject, html, text }) {
  // ---- Replace this with your provider. Example with nodemailer:
  // const nodemailer = require('nodemailer');
  // const t = nodemailer.createTransport(process.env.SMTP_URL);
  // await t.sendMail({ from: 'Forevate <digest@forevate.ai>', to: to.map(r => r.email), subject, html, text });
  console.log(`[send] ${subject} -> ${to.map(r => r.email).join(', ')} (${html.length} bytes)`);
}

(async () => {
  for (const id of wanted) {
    const entry = index.brands.find(b => b.id === id);
    if (!entry) { console.error('Unknown brand', id); continue; }
    const dir = path.join(BRANDS_DIR, path.basename(entry.folder));
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    const data = JSON.parse(fs.readFileSync(path.join(dir, manifest.files.data), 'utf8'));
    const signals = manifest.files.signals ? (JSON.parse(fs.readFileSync(path.join(dir, manifest.files.signals), 'utf8')).signals || []) : [];

    const recipients = (manifest.recipients || []).filter(r => !r.digests || r.digests.includes(period));
    const model = Digest.build(data, { period, asOf: asOf || data._readme.as_of, brand: manifest, signals, dashboardUrl: index.dashboard_url, recipients });
    const html = Digest.renderHtml(model);
    const text = Digest.renderText(model);

    if (outDir) {
      fs.mkdirSync(outDir, { recursive: true });
      const base = path.join(outDir, `forevate-${id}-${period}-digest-${model.asOf}`);
      fs.writeFileSync(base + '.html', html); fs.writeFileSync(base + '.txt', text); fs.writeFileSync(base + '.json', JSON.stringify(model, null, 2));
      console.log('wrote', base + '.{html,txt,json}');
    }
    if (!recipients.length) { console.log(`[skip] ${id}: no registered contacts for the ${period} digest`); continue; }
    if (send) await deliver({ to: recipients, subject: model.subject, html, text });
    else console.log(`[dry-run] ${model.subject}\n  to: ${recipients.map(r => r.email).join(', ')}\n  ${model.counts.items} items in window ${model.window.label}`);
  }
})();
