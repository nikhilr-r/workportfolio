/* NJ Tech: behaviour. Everything here is progressive; the page is complete HTML without it. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(pointer: fine)');
const WA = '919881345138', MAIL = 'kaldajatin91@gmail.com', CC = 'rajputnikhil1906@gmail.com';
const inr = new Intl.NumberFormat('en-IN');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* viewport width without the scrollbar, for full-bleed rows */
const setCw = () => document.documentElement.style.setProperty('--cw', document.documentElement.clientWidth + 'px');
setCw(); addEventListener('resize', setCw);

/* ---------- scroll reveal ---------- */
const reveal = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const t = e.target; t.classList.add('in'); reveal.unobserve(t);
  setTimeout(() => t.classList.remove('rv', 'in'), 1800 + (parseFloat(getComputedStyle(t).getPropertyValue('--i')) || 0) * 90); // hand hover transitions back to the component
}), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
$$('.rv').forEach(el => reveal.observe(el));

/* ---------- counters ---------- */
function countUp(el, to, dur, delay, fmt) {
  if (RM.matches) { el.textContent = fmt(to); return; }
  el.textContent = fmt(0);
  setTimeout(() => {
    const t0 = performance.now();
    (function f(t) {
      const p = clamp((t - t0) / dur, 0, 1);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }, delay);
}
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; cio.unobserve(e.target);
  const el = e.target; countUp(el, +el.dataset.count, 900, 0, v => v + (el.dataset.suffix || ''));
}), { threshold: .6 });
$$('[data-count]:not(.bill [data-count])').forEach(el => cio.observe(el));

/* ---------- hero: the card cycles through the kinds of business we build for ---------- */
const bill = $('#bill');
if (bill && !RM.matches) {
  const biz = JSON.parse(bill.dataset.biz), nm = $('#bz-n'), ls = $('#bz-l'), chk = ls.querySelector('svg').outerHTML;
  let i = 0, hold = false, vis = true;
  bill.addEventListener('pointerenter', () => hold = true); bill.addEventListener('pointerleave', () => hold = false);
  new IntersectionObserver(([e]) => vis = e.isIntersecting).observe(bill);
  const esc = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  setInterval(() => {
    if (hold || !vis || document.hidden) return;
    i = (i + 1) % biz.length;
    [nm, ls].forEach(e => e.classList.add('bz-sw', 'bz-out'));
    setTimeout(() => {
      nm.textContent = biz[i][0];
      ls.innerHTML = biz[i][1].map((t, k) => '<li style="--k:' + k + '">' + chk + '<span>' + esc(t) + '</span></li>').join('');
      ls.classList.add('sw');
      requestAnimationFrame(() => [nm, ls].forEach(e => e.classList.remove('bz-out')));
    }, 380);
  }, 4600);
}

/* ---------- nav, progress, scrollspy, dock ---------- */
const nav = $('#nav'), prog = $('#prog'), dock = $('.dock'), steps = $('#steps');
const spyMap = { work: 'work', reviews: 'reviews', services: 'services', industries: 'services', process: 'services', about: 'about', faq: 'contact', contact: 'contact' };
const links = $$('.nl a');
let ticking = false;
function frame() {
  ticking = false;
  const y = scrollY, max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  nav.classList.toggle('s', y > 16);
  prog.style.setProperty('--sp', (y / max).toFixed(4));
  let cur = null;
  for (const id in spyMap) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= innerHeight * .35) cur = spyMap[id]; }
  links.forEach(a => a.classList.toggle('act', a.getAttribute('href') === '#' + cur));
  const ct = $('#contact'); if (dock && ct) dock.classList.toggle('off', ct.getBoundingClientRect().top < innerHeight * .55);
  if (steps) {
    const r = steps.getBoundingClientRect();
    const p = clamp((innerHeight * .78 - r.top) / (r.height * .92 + innerHeight * .1), 0, 1);
    steps.style.setProperty('--p', p.toFixed(3));
    $$('li', steps).forEach((li, i, a) => li.classList.toggle('on', p >= i / (a.length - 1) - .001 && r.top < innerHeight * .8));
  }
}
const sched = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
addEventListener('scroll', sched, { passive: true }); addEventListener('resize', sched); frame();

/* ---------- mobile menu ---------- */
const mb = $('#mb'), mm = $('#mm');
function menu(open) {
  if (open === !mm.hidden) return;
  mb.setAttribute('aria-expanded', open); mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mb.querySelector('use').setAttribute('href', open ? '#x' : '#menu');
  document.body.classList.toggle('lock', open);
  if (open) { mm.hidden = false; requestAnimationFrame(() => mm.classList.add('o')); }
  else { mm.classList.remove('o'); setTimeout(() => { if (!mm.classList.contains('o')) mm.hidden = true; }, 350); }
}
mb.addEventListener('click', () => menu(mm.hidden));
$$('a', mm).forEach(a => a.addEventListener('click', () => menu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape' && !mm.hidden) { menu(false); mb.focus(); } });
matchMedia('(min-width: 960px)').addEventListener('change', e => e.matches && menu(false));
mm.style.zIndex = 55; nav.style.zIndex = 60;

/* ---------- dialogs ---------- */
const qd = $('#qd');
const outside = (d, e) => { const r = d.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; };
function setHash(h) { try { history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); } catch (_) {} }
$$('dialog').forEach(d => {
  d.addEventListener('click', e => { if (e.target === d && outside(d, e)) d.close(); });
  $$('[data-close]', d).forEach(b => b.addEventListener('click', () => d.close()));
  d.addEventListener('close', () => { const h = location.hash.slice(1); if (h === 'enquire' || h.startsWith('project-')) setHash(''); });
});
function openDialog(d, hash) {
  menu(false);
  $$('dialog[open]').forEach(o => o !== d && o.close());
  if (!d.open) d.showModal();
  if (hash) setHash(hash);
  d.scrollTop = 0;
}

/* project viewer (screens crossfade, tabs, arrows, gentle autoplay while open) */
const viewers = new Map();
function viewer(d) {
  if (viewers.has(d)) return viewers.get(d);
  if (!$('.shot', d)) { const n = { start() {}, stop() {} }; viewers.set(d, n); return n; }
  const root = $('[data-viewer]', d), shots = $$('.shot', root), tabs = $$('.tab', root), cap = $('.cap', root), strip = $('.vt', root);
  const caps = JSON.parse(d.dataset.caps || '[]'); let i = 0, hold = false, timer = null;
  const go = n => {
    i = (n + shots.length) % shots.length;
    shots.forEach((s, k) => s.classList.toggle('on', k === i));
    tabs.forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-pressed', k === i); });
    if (cap) cap.innerHTML = '<b>' + String(i + 1).padStart(2, '0') + '</b> / ' + String(shots.length).padStart(2, '0') + ' &nbsp;' + (caps[i] || '');
    if (strip && tabs[i]) strip.scrollTo({ left: tabs[i].offsetLeft - strip.clientWidth / 2 + tabs[i].clientWidth / 2, behavior: RM.matches ? 'auto' : 'smooth' });
  };
  tabs.forEach((t, k) => t.addEventListener('click', () => { hold = true; go(k); }));
  $('[data-prev]', root)?.addEventListener('click', () => { hold = true; go(i - 1); });
  $('[data-next]', root)?.addEventListener('click', () => { hold = true; go(i + 1); });
  root.addEventListener('pointerenter', () => hold = true); root.addEventListener('pointerleave', () => hold = false);
  d.addEventListener('keydown', e => { if (shots.length > 1 && !/INPUT|TEXTAREA/.test(e.target.tagName)) { if (e.key === 'ArrowRight') { hold = true; go(i + 1); } if (e.key === 'ArrowLeft') { hold = true; go(i - 1); } } });
  const api = {
    start() { go(0); hold = false; clearInterval(timer); if (shots.length > 1 && !RM.matches) timer = setInterval(() => { if (!hold && !document.hidden) go(i + 1); }, 4200); },
    stop() { clearInterval(timer); }
  };
  d.addEventListener('close', api.stop); viewers.set(d, api); return api;
}
function openProject(id) {
  const d = document.getElementById('project-' + id); if (!d) return;
  openDialog(d, 'project-' + id); viewer(d).start();
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); openProject(o.dataset.open); return; }
  const q = e.target.closest('[data-q]'); if (q) { e.preventDefault(); openQuote(); }
});

/* ---------- enquiry form ---------- */
const g = id => document.getElementById(id);
const form = g('qform'), okBox = g('qok'), formBox = g('qf');
function openQuote() {
  formBox.hidden = false; okBox.hidden = true;
  openDialog(qd, 'enquire');
  if (fine.matches) setTimeout(() => g('qn').focus({ preventScroll: true }), 80);
}
const read = () => ({
  name: g('qn').value.trim(), business: g('qb').value.trim(), contact: g('qc').value.trim(),
  need: $$('input[name=need]:checked', form).map(i => i.value).join(', '),
  details: g('qd2').value.trim(), ref: g('qr').value.trim(), website: $('[name=website]', form).value
});
function bad(el, msg) { el.classList.add('bad'); el.setAttribute('aria-invalid', 'true'); g('qe').textContent = msg; el.focus(); return false; }
function valid(d) {
  ['qn', 'qc'].forEach(id => { g(id).classList.remove('bad'); g(id).removeAttribute('aria-invalid'); }); g('qe').textContent = '';
  if (d.name.length < 2) return bad(g('qn'), 'Please enter your name.');
  const digits = d.contact.replace(/\D/g, '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact) && (digits.length < 8 || digits.length > 15)) return bad(g('qc'), 'Please enter a valid phone number or email.');
  return true;
}
const text = d => 'Hello Jatin, new enquiry from the NJ Tech website:\n\nName: ' + d.name + '\nBusiness: ' + (d.business || '-') + '\nContact: ' + d.contact + '\nNeed: ' + (d.need || '-') + '\nDetails: ' + (d.details || '-') + '\nInspiration: ' + (d.ref || '-');
form.addEventListener('input', e => { e.target.classList.remove('bad'); e.target.removeAttribute('aria-invalid'); g('qe').textContent = ''; });
form.addEventListener('submit', async e => {
  e.preventDefault();
  const d = read(); if (!valid(d)) return;
  const btn = g('qsub'), lab = $('span', btn); btn.disabled = true; lab.textContent = 'Sending…';
  let delivered = false;
  try {
    const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d), signal: AbortSignal.timeout(9000) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) delivered = !!j.delivered;
    else if (r.status === 400 && j.error) { btn.disabled = false; lab.textContent = 'Send enquiry'; g('qe').textContent = j.error; return; }
  } catch (_) { /* offline or endpoint not set up: fall through to WhatsApp / email */ }
  btn.disabled = false; lab.textContent = 'Send enquiry';
  g('qwa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text(d));
  g('qml').href = 'mailto:' + MAIL + '?cc=' + CC + '&subject=' + encodeURIComponent('New enquiry from ' + d.name + (d.business ? ' - ' + d.business : '')) + '&body=' + encodeURIComponent(text(d));
  g('qnm').textContent = d.name.split(' ')[0];
  g('qok-h').firstChild.textContent = delivered ? 'Thank you, ' : 'Almost done, ';
  g('qok-p').textContent = delivered
    ? 'Your enquiry has reached us. We will call you back soon. To speak sooner, message us on WhatsApp.'
    : 'Send these details on WhatsApp or email so they reach us right away.';
  track('generate_lead', { delivered }); formBox.hidden = true; okBox.hidden = false; qd.scrollTop = 0; if (delivered) form.reset();
  g('qok-h').setAttribute('tabindex', '-1'); g('qok-h').focus({ preventScroll: true });
});

/* ---------- services tabs ---------- */
(() => {
  const tabs = $$('.stab'), panels = $$('.spanel'); if (!tabs.length) return;
  const sel = (i, focus) => {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => p.hidden = k !== i);
    if (focus) tabs[i].focus();
    tabs[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: RM.matches ? 'auto' : 'smooth' });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => sel(i));
    t.addEventListener('keydown', e => {
      const n = tabs.length, k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (k) { e.preventDefault(); sel((i + k + n) % n, true); }
      if (e.key === 'Home') { e.preventDefault(); sel(0, true); }
      if (e.key === 'End') { e.preventDefault(); sel(n - 1, true); }
    });
  });
  panels.forEach((p, k) => p.hidden = k !== 0);
})();

/* ---------- carousels: dots, arrows, optional autoplay ---------- */
function carousel(el, o = {}) {
  const kids = [...el.children]; if (kids.length < 2) return;
  const pad = () => parseFloat(getComputedStyle(el).paddingLeft) || 0;
  const pos = k => k.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft - pad();
  const go = i => el.scrollTo({ left: Math.max(0, pos(kids[clamp(i, 0, kids.length - 1)])), behavior: RM.matches ? 'auto' : 'smooth' });
  const near = () => { let b = 0, bd = 1e9; kids.forEach((k, i) => { const m = Math.abs(pos(k) - el.scrollLeft); if (m < bd) { bd = m; b = i; } }); return b; };
  const dots = document.createElement('div'); dots.className = 'dots'; dots.setAttribute('role', 'group'); dots.setAttribute('aria-label', (el.dataset.label || 'Slides') + ' navigation');
  kids.forEach((k, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Go to item ' + (i + 1)); b.addEventListener('click', () => { hz(9000); go(i); }); dots.appendChild(b); });
  el.after(dots);
  if (el.dataset.label) { el.setAttribute('role', 'region'); el.setAttribute('aria-label', el.dataset.label); }
  const bs = [...dots.children]; let raf;
  const upd = () => { const n = near(); bs.forEach((b, i) => b.classList.toggle('on', i === n)); };
  el.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(upd); }, { passive: true }); addEventListener('resize', upd); upd();
  const ctl = el.id && $(`.ctl[data-for="${el.id}"]`);
  ctl?.querySelector('[data-prev]').addEventListener('click', () => { hz(9000); go(near() - 1); });
  ctl?.querySelector('[data-next]').addEventListener('click', () => { hz(9000); go(near() + 1); });
  let hold = false, vis = false, rt;
  function hz(ms) { hold = true; clearTimeout(rt); rt = setTimeout(() => hold = false, ms); }
  if (el.dataset.auto && !RM.matches) {
    el.addEventListener('pointerenter', () => { hold = true; clearTimeout(rt); }); el.addEventListener('pointerleave', () => hz(1500));
    el.addEventListener('touchstart', () => hz(9000), { passive: true }); el.addEventListener('focusin', () => hz(9000));
    new IntersectionObserver(([e]) => vis = e.isIntersecting, { threshold: .4 }).observe(el);
    setInterval(() => { if (hold || !vis || document.hidden) return; const max = el.scrollWidth - el.clientWidth; go(el.scrollLeft >= max - 4 ? 0 : near() + 1); }, +el.dataset.auto);
  }
}
$$('.carousel').forEach(el => carousel(el));
// scrollable strips must be reachable by keyboard
$$('.rtrack').forEach(el => el.tabIndex = 0);

/* ---------- card spotlight ---------- */
if (fine.matches) document.addEventListener('pointermove', e => {
  const c = e.target.closest && e.target.closest('.pc'); if (!c) return;
  const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true });

/* ---------- pause marquees off-screen ---------- */
const mio = new IntersectionObserver(es => es.forEach(e => e.target.style.animationPlayState = e.isIntersecting ? 'running' : 'paused'));
$$('.mq').forEach(m => mio.observe(m));

/* ---------- analytics events (no-ops if the tag is blocked) ---------- */
const track = (n, p) => { try { window.gtag && window.gtag('event', n, p || {}); } catch (_) {} };
document.addEventListener('click', e => {
  const a = e.target.closest('a,button'); if (!a) return;
  const h = a.getAttribute('href') || '';
  if (h.startsWith('tel:')) track('call_click');
  else if (h.includes('wa.me')) track('whatsapp_click');
  else if (h.startsWith('mailto:')) track('email_click');
  else if (a.hasAttribute('data-q')) track('quote_open');
  else if (a.dataset.open) track('project_open', { project: a.dataset.open });
  else if (a.closest('.pd-a') && h.startsWith('http')) track('live_site_click', { url: h });
});
form.addEventListener('submit', () => track('enquiry_submit'));

/* ---------- deep links ---------- */
function route() {
  const h = location.hash.slice(1);
  if (h === 'enquire') openQuote();
  else if (h.startsWith('project-')) openProject(h.slice(8));
}
addEventListener('hashchange', route); if (location.hash) setTimeout(route, 400);
if (/[?&]sent=1/.test(location.search)) { try { history.replaceState(null, '', location.pathname); } catch (_) {} }
})();
