// Vercel serverless function: POST /api/enquiry
// Env (all optional): RESEND_API_KEY, ENQUIRY_TO, ENQUIRY_CC, ENQUIRY_FROM, WEBHOOK_URL, ALLOWED_ORIGINS (comma list)
'use strict';
const hits = new Map(); // best-effort per-instance rate limit
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, n);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function allowed(req) {
  const o = req.headers.origin; if (!o) return true;
  let host; try { host = new URL(o).host; } catch (_) { return false; }
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return host === req.headers.host || ['nj-tech.in', 'www.nj-tech.in', 'nj-tech.vercel.app'].includes(host) || extra.includes(host) || extra.includes(o);
}
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, a = (hits.get(ip) || []).filter(t => now - t < win);
  a.push(now); hits.set(ip, a); if (hits.size > 500) hits.clear();
  return a.length > 5;
}
function parse(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (_) { b = Object.fromEntries(new URLSearchParams(b)); } }
  return b && typeof b === 'object' ? b : {};
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const wantsHtml = /text\/html/.test(req.headers.accept || '') && !/json/.test(req.headers.accept || '');
  const out = (code, body) => {
    if (wantsHtml && code === 200) { res.statusCode = 303; res.setHeader('Location', '/?sent=1#contact'); return res.end(); }
    res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(body));
  };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return out(405, { ok: false, error: 'Method not allowed.' }); }
  if (!allowed(req)) return out(403, { ok: false, error: 'Origin not allowed.' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (limited(ip)) return out(429, { ok: false, error: 'Too many enquiries. Please message us on WhatsApp.' });

  const b = parse(req);
  if (clean(b.website, 50)) return out(200, { ok: true, delivered: true }); // honeypot: pretend success
  const d = { name: clean(b.name, 80), business: clean(b.business, 100), contact: clean(b.contact, 120), need: clean(b.need, 150), details: clean(b.details, 1000), ref: clean(b.ref, 300) };
  if (d.name.length < 2) return out(400, { ok: false, error: 'Please enter your name.' });
  const digits = d.contact.replace(/\D/g, '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact) && (digits.length < 8 || digits.length > 15)) return out(400, { ok: false, error: 'Please enter a valid phone number or email.' });

  const lines = [['Name', d.name], ['Business', d.business || '-'], ['Contact', d.contact], ['Need', d.need || '-'], ['Details', d.details || '-'], ['Inspiration', d.ref || '-']];
  const textBody = lines.map(([k, v]) => k + ': ' + v).join('\n');
  let delivered = false;
  try {
    if (process.env.RESEND_API_KEY && process.env.ENQUIRY_TO) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.ENQUIRY_FROM || 'NJ Tech <onboarding@resend.dev>', to: process.env.ENQUIRY_TO.split(',').map(s => s.trim()),
          cc: process.env.ENQUIRY_CC ? process.env.ENQUIRY_CC.split(',').map(s => s.trim()) : undefined,
          subject: 'New enquiry: ' + d.name + (d.business ? ' (' + d.business + ')' : ''),
          text: textBody, html: '<table>' + lines.map(([k, v]) => '<tr><td><b>' + k + '</b></td><td>' + esc(v) + '</td></tr>').join('') + '</table>',
          reply_to: /@/.test(d.contact) ? d.contact : undefined
        })
      });
      delivered = r.ok || delivered;
    }
    if (process.env.WEBHOOK_URL) {
      const r = await fetch(process.env.WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'New NJ Tech enquiry\n' + textBody, ...d }) });
      delivered = r.ok || delivered;
    }
  } catch (e) { console.error('enquiry delivery failed:', e.message); }
  console.log('enquiry received', { delivered });
  return out(200, { ok: true, delivered });
};
