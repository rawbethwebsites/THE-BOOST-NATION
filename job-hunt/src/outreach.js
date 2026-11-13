// Pure logic for the "email the top" outreach method.
// Three rules: ask for the forward, ask for advice (not a job), be specific.

export const FOLLOW_UP_DAYS = 7;
export const MAX_WORDS = 200;

export const STATUSES = ['Draft', 'Sent', 'Forwarded', 'Replied', 'Call booked', 'No reply'];

const clean = (s) => (s ?? '').toString().trim();

export function parseRoles(input) {
  return clean(input)
    .split(/[,\n;]/)
    .map((r) => r.trim())
    .filter(Boolean);
}

export function joinOr(items) {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} or ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, or ${items[items.length - 1]}`;
}

const article = (word) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

export function buildEmail(input) {
  const name = clean(input.yourName);
  const background = clean(input.background);
  const contact = clean(input.contactName);
  const company = clean(input.company);
  const reason = clean(input.reason);
  const location = clean(input.location);
  const signoff = clean(input.signoff);
  const roles = parseRoles(input.roles);

  const roleText = roles.length ? joinOr(roles) : '[the exact role(s) you want]';
  const companyText = company || '[company]';
  const firstRole = roles[0] || 'career';

  const subject = `Quick question about ${firstRole} roles at ${companyText}`;

  const intro = name
    ? `I'm ${name}${background ? `, ${background}` : ''}.`
    : `[One line on who you are.]`;
  const why = reason
    ? ` I've followed ${companyText} closely: ${reason.replace(/\.$/, '')}.`
    : '';
  const where = location ? ` in ${location}` : '';
  const roleLine = roles.length
    ? `${article(roles[0])} ${roleText}`
    : roleText;

  const body = [
    `Hi ${contact || '[name]'},`,
    '',
    `${intro}${why}`,
    '',
    `I'm working toward ${roleLine} role${where}, and I'd really value your guidance on how to best position myself for a role like that at ${companyText}.`,
    '',
    `If you're not the right person, I'd love it if you could connect me with whoever is.`,
    '',
    'Thank you for your time,',
    name || '[your name]',
    ...(signoff ? [signoff] : []),
  ].join('\n');

  return { subject, body };
}

const FORWARD_RE = /(not the right person|connect me with|point me (to|toward)|introduce me to|pass (this|my note) (along|on)|forward (this|my))/i;
const ADVICE_RE = /(guidance|advice|advise|position myself|prepare myself|how (to|i can|i could|i should) best)/i;
const BEGGING_RE = /(hire me|give me a job|i need a job|any (open|available) (jobs?|roles?|positions?)|please consider me for|looking for any (job|role|position)|desperate)/i;

export function wordCount(text) {
  return clean(text).split(/\s+/).filter(Boolean).length;
}

// Returns a list of { id, label, ok, level, tip } checks for the email text.
export function lintEmail(text, rolesInput = '') {
  const body = clean(text);
  const roles = Array.isArray(rolesInput) ? rolesInput : parseRoles(rolesInput);
  const begging = body.match(BEGGING_RE);
  const mentionsRole = roles.length > 0 && roles.some((r) => body.toLowerCase().includes(r.toLowerCase()));
  const placeholders = body.match(/\[[^\]]+\]/g) || [];
  const words = wordCount(body);

  return [
    {
      id: 'forward',
      label: 'Asks for the forward',
      ok: FORWARD_RE.test(body),
      level: 'error',
      tip: 'End with: "If you\'re not the right person, I\'d love it if you could connect me with whoever is."',
    },
    {
      id: 'advice',
      label: 'Asks for advice, not a job',
      ok: ADVICE_RE.test(body),
      level: 'error',
      tip: 'Ask how to best position yourself for the role. People love mentoring; they hate being put on the spot.',
    },
    {
      id: 'no-begging',
      label: 'No "please hire me" language',
      ok: !begging,
      level: 'error',
      tip: begging ? `Remove "${begging[0]}". Ask for guidance instead.` : 'Keep it about guidance.',
    },
    {
      id: 'specific',
      label: 'Names the exact role(s)',
      ok: mentionsRole,
      level: 'error',
      tip: 'Say exactly what you want, e.g. "legal analyst, legal assistant, or paralegal". Specific is easy to forward.',
    },
    {
      id: 'placeholders',
      label: 'No unfilled [placeholders]',
      ok: placeholders.length === 0,
      level: 'error',
      tip: placeholders.length ? `Fill in ${placeholders.join(', ')}.` : 'All filled in.',
    },
    {
      id: 'length',
      label: `Short (${words} words, aim for under ${MAX_WORDS})`,
      ok: words > 0 && words <= MAX_WORDS,
      level: 'warn',
      tip: 'Executives skim. Cut anything that isn\'t who you are, the ask, or the forward line.',
    },
  ];
}

export function isReady(checks) {
  return checks.every((c) => c.ok || c.level !== 'error');
}

export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// When to nudge again: only for emails still waiting on a response.
export function followUpDue(entry) {
  if (!entry.sentOn || !['Sent', 'No reply'].includes(entry.status)) return null;
  return addDays(entry.sentOn, FOLLOW_UP_DAYS);
}

export function isOverdue(entry, todayIso) {
  const due = followUpDue(entry);
  return Boolean(due && due <= todayIso);
}

const CSV_FIELDS = ['contactName', 'title', 'company', 'email', 'roles', 'status', 'sentOn', 'notes'];

const csvCell = (v) => {
  const s = clean(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(entries) {
  const header = [...CSV_FIELDS, 'followUpDue'].join(',');
  const rows = entries.map((e) =>
    [...CSV_FIELDS.map((f) => csvCell(e[f])), csvCell(followUpDue(e))].join(','),
  );
  return [header, ...rows].join('\n');
}
