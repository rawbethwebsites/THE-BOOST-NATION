import {
  buildEmail, lintEmail, isReady, parseRoles, followUpDue, isOverdue, toCsv, STATUSES,
} from './outreach.js';

const $ = (sel, root = document) => root.querySelector(sel);
const FORM_KEY = 'emailTheTop.form.v1';
const TRACKER_KEY = 'emailTheTop.tracker.v1';

const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  },
};

const today = () => new Date().toISOString().slice(0, 10);
const escapeHtml = (s) => (s ?? '').toString().replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

/* ---------- Tabs ---------- */
function showTab(name) {
  document.querySelectorAll('[role="tab"]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  document.querySelectorAll('[role="tabpanel"]').forEach((p) => { p.hidden = p.id !== `tab-${name}`; });
  if (location.hash !== `#${name}`) history.replaceState(null, '', `#${name}`);
}
document.querySelectorAll('[role="tab"]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

/* ---------- Write ---------- */
const form = $('#draft-form');
const subjectEl = $('#subject');
const bodyEl = $('#body');
let edited = false;

const formData = () => Object.fromEntries(new FormData(form).entries());

function fillForm(data) {
  for (const [k, v] of Object.entries(data)) if (form.elements[k]) form.elements[k].value = v;
}

function regenerate() {
  const { subject, body } = buildEmail(formData());
  subjectEl.value = subject;
  bodyEl.value = body;
  edited = false;
  $('#edit-note').hidden = true;
  refreshChecks();
}

function refreshChecks() {
  const data = formData();
  const checks = lintEmail(bodyEl.value, data.roles);
  $('#checks').innerHTML = checks.map((c) => {
    const state = c.ok ? 'ok' : c.level;
    const mark = c.ok ? '✓' : c.level === 'warn' ? '!' : '✕';
    return `<li class="${state}"><span class="mark" aria-hidden="true">${mark}</span>
      <span>${escapeHtml(c.label)}${c.ok ? '' : `<span class="tip">${escapeHtml(c.tip)}</span>`}</span></li>`;
  }).join('');

  const ready = isReady(checks);
  const mailto = $('#mailto');
  const href = `mailto:${encodeURIComponent(data.email || '')}?subject=${encodeURIComponent(subjectEl.value)}&body=${encodeURIComponent(bodyEl.value)}`;
  mailto.href = ready ? href : '#';
  mailto.setAttribute('aria-disabled', String(!ready));
  mailto.title = ready ? '' : 'Fix the checks above first';
  $('#copy').disabled = !ready;
}

form.addEventListener('input', () => {
  store.set(FORM_KEY, formData());
  if (edited) refreshChecks(); else regenerate();
});
bodyEl.addEventListener('input', () => { edited = true; $('#edit-note').hidden = false; refreshChecks(); });
subjectEl.addEventListener('input', () => { edited = true; $('#edit-note').hidden = false; refreshChecks(); });
$('#regen').addEventListener('click', regenerate);
$('#mailto').addEventListener('click', (e) => { if ($('#mailto').getAttribute('aria-disabled') === 'true') e.preventDefault(); });

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2500);
}

$('#copy').addEventListener('click', async () => {
  const text = `Subject: ${subjectEl.value}\n\n${bodyEl.value}`;
  try { await navigator.clipboard.writeText(text); toast('Copied. Paste it into your email.'); }
  catch { bodyEl.select(); toast('Select-all done. Press Ctrl/Cmd+C to copy.'); }
});

$('#save').addEventListener('click', () => {
  const d = formData();
  if (!d.contactName && !d.company) { toast('Add at least a name or company first.'); return; }
  const entries = store.get(TRACKER_KEY, []);
  entries.unshift({
    id: crypto.randomUUID?.() ?? String(Date.now()),
    contactName: d.contactName, title: d.title, company: d.company, email: d.email,
    roles: parseRoles(d.roles).join(', '),
    subject: subjectEl.value, body: bodyEl.value,
    status: 'Sent', sentOn: today(), notes: '',
  });
  store.set(TRACKER_KEY, entries);
  renderTracker();
  toast('Saved to tracker as sent today.');
});

/* ---------- Tracker ---------- */
function renderTracker() {
  const entries = store.get(TRACKER_KEY, []);
  const now = today();
  const tbody = $('#tracker tbody');
  $('#empty').hidden = entries.length > 0;
  $('#tracker').hidden = entries.length === 0;

  const count = (s) => entries.filter((e) => e.status === s).length;
  const overdue = entries.filter((e) => isOverdue(e, now)).length;
  const wins = count('Forwarded') + count('Replied') + count('Call booked');
  $('#stats').innerHTML = entries.length ? [
    ['Emailed', entries.filter((e) => e.status !== 'Draft').length],
    ['Forwards / replies', wins],
    ['Calls booked', count('Call booked')],
    ['Follow-ups due', overdue],
  ].map(([l, n]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join('') : '';

  const badge = $('#due-badge');
  badge.hidden = overdue === 0;
  badge.textContent = overdue;

  tbody.innerHTML = entries.map((e) => {
    const due = followUpDue(e);
    const late = isOverdue(e, now);
    return `<tr data-id="${escapeHtml(e.id)}" class="${late ? 'overdue' : ''}">
      <td>${escapeHtml(e.contactName)}<small>${escapeHtml(e.title)}</small>${e.email ? `<small>${escapeHtml(e.email)}</small>` : ''}</td>
      <td>${escapeHtml(e.company)}</td>
      <td>${escapeHtml(e.roles)}</td>
      <td><select data-field="status" aria-label="Status">${STATUSES.map((s) => `<option${s === e.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td><input type="date" data-field="sentOn" value="${escapeHtml(e.sentOn)}" aria-label="Sent on"></td>
      <td>${due ? `<span class="${late ? 'due-label' : ''}">${late ? 'Due ' : ''}${due}</span>` : '—'}</td>
      <td><textarea data-field="notes" rows="2" aria-label="Notes" placeholder="Forwarded to…">${escapeHtml(e.notes)}</textarea></td>
      <td><button type="button" class="icon" data-action="delete" aria-label="Delete ${escapeHtml(e.contactName)}">✕</button></td>
    </tr>`;
  }).join('');
}

function updateEntry(id, patch) {
  const entries = store.get(TRACKER_KEY, []).map((e) => (e.id === id ? { ...e, ...patch } : e));
  store.set(TRACKER_KEY, entries);
}

$('#tracker tbody').addEventListener('change', (ev) => {
  const field = ev.target.dataset.field;
  if (!field) return;
  updateEntry(ev.target.closest('tr').dataset.id, { [field]: ev.target.value });
  if (field !== 'notes') renderTracker();
});
$('#tracker tbody').addEventListener('click', (ev) => {
  if (ev.target.dataset.action !== 'delete') return;
  const id = ev.target.closest('tr').dataset.id;
  if (!confirm('Remove this contact from the tracker?')) return;
  store.set(TRACKER_KEY, store.get(TRACKER_KEY, []).filter((e) => e.id !== id));
  renderTracker();
});

$('#export').addEventListener('click', () => {
  const blob = new Blob([toCsv(store.get(TRACKER_KEY, []))], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `outreach-${today()}.csv` });
  a.click();
  URL.revokeObjectURL(a.href);
});

/* ---------- Boot ---------- */
fillForm(store.get(FORM_KEY, {}));
regenerate();
renderTracker();
const initial = location.hash.slice(1);
showTab(['write', 'tracker', 'method'].includes(initial) ? initial : 'write');
