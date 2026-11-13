import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEmail, lintEmail, isReady, parseRoles, joinOr,
  followUpDue, isOverdue, toCsv, wordCount,
} from '../src/outreach.js';

const input = {
  yourName: 'Ada Obi',
  background: 'a final-year law student at UNILAG',
  contactName: 'Mr. Kobayashi',
  company: 'Canon',
  roles: 'legal analyst, legal assistant, paralegal',
  location: 'London',
  reason: 'your in-house legal team has a great reputation',
};

const byId = (checks) => Object.fromEntries(checks.map((c) => [c.id, c]));

test('parseRoles splits on commas, semicolons and newlines', () => {
  assert.deepEqual(parseRoles(' a, b;c\n d ,'), ['a', 'b', 'c', 'd']);
  assert.deepEqual(parseRoles(''), []);
});

test('joinOr reads naturally', () => {
  assert.equal(joinOr(['x']), 'x');
  assert.equal(joinOr(['x', 'y']), 'x or y');
  assert.equal(joinOr(['x', 'y', 'z']), 'x, y, or z');
});

test('generated email satisfies all three rules', () => {
  const { subject, body } = buildEmail(input);
  assert.match(subject, /legal analyst roles at Canon/);
  assert.match(body, /^Hi Mr\. Kobayashi,/);
  assert.match(body, /a legal analyst, legal assistant, or paralegal role in London/);
  assert.match(body, /If you're not the right person/);
  const checks = lintEmail(body, input.roles);
  assert.ok(isReady(checks), JSON.stringify(checks.filter((c) => !c.ok)));
  assert.ok(checks.every((c) => c.ok));
});

test('article matches first role', () => {
  const { body } = buildEmail({ ...input, roles: 'associate' });
  assert.match(body, /an associate role/);
});

test('empty input leaves placeholders and is not ready', () => {
  const { body } = buildEmail({});
  const c = byId(lintEmail(body, ''));
  assert.equal(c.placeholders.ok, false);
  assert.equal(c.specific.ok, false);
  assert.equal(isReady(Object.values(c)), false);
});

test('lint catches a missing forward line and begging', () => {
  const text = 'Hi Jamie, please hire me as a paralegal. Thanks.';
  const c = byId(lintEmail(text, 'paralegal'));
  assert.equal(c.forward.ok, false);
  assert.equal(c.advice.ok, false);
  assert.equal(c['no-begging'].ok, false);
  assert.match(c['no-begging'].tip, /hire me/);
  assert.equal(c.specific.ok, true);
});

test('length is only a warning', () => {
  const { body } = buildEmail(input);
  const long = `${body}\n${'word '.repeat(250)}`;
  const checks = lintEmail(long, input.roles);
  assert.equal(byId(checks).length.ok, false);
  assert.ok(isReady(checks));
  assert.ok(wordCount(long) > 200);
});

test('follow-up due 7 days after sending, only while waiting', () => {
  assert.equal(followUpDue({ status: 'Sent', sentOn: '2026-11-01' }), '2026-11-08');
  assert.equal(followUpDue({ status: 'Replied', sentOn: '2026-11-01' }), null);
  assert.equal(followUpDue({ status: 'Sent' }), null);
  assert.equal(isOverdue({ status: 'Sent', sentOn: '2026-11-01' }, '2026-11-08'), true);
  assert.equal(isOverdue({ status: 'Sent', sentOn: '2026-11-01' }, '2026-11-07'), false);
});

test('CSV export quotes awkward cells', () => {
  const csv = toCsv([{ contactName: 'Jamie "JD" Dimon', company: 'JPMorgan, Chase', status: 'Sent', sentOn: '2026-11-01' }]);
  const [header, row] = csv.split('\n');
  assert.match(header, /^contactName,title,company/);
  assert.match(row, /^"Jamie ""JD"" Dimon",,"JPMorgan, Chase"/);
  assert.match(row, /2026-11-08$/);
});
