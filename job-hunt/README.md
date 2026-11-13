# Email the Top

A small web app for the job hunt: email the person at the top and get forwarded to the right one, instead of disappearing into a pile of applications nobody reads.

The goal isn't a reply from the CEO. It's a forward to the right person. Every draft follows three rules:

1. **Ask for the forward.** End with "If you're not the right person, I'd love it if you could connect me with whoever is."
2. **Ask for advice, not a job.** Ask how to best position yourself for the role. No "please hire me".
3. **Be specific.** Name the exact roles, e.g. "legal analyst, legal assistant, or paralegal".

## What it does

- **Write**: fill in who you are, who you're emailing and the exact roles. You get a ready subject and body. A live checklist checks the text against the three rules (and flags "hire me" language, unfilled placeholders and long emails). Copy and "Open in mail app" unlock only when the rules pass. You can edit the draft freely and it's re-checked as you type.
- **Tracker**: save each email you send. Track status (Sent, Forwarded, Replied, Call booked, No reply), notes, and a follow-up date 7 days after sending; overdue follow-ups are highlighted and counted on the tab. Export to CSV.
- **The method**: the playbook, plus tips on finding executives and their email addresses.

Data stays in your browser (localStorage). Nothing is sent anywhere. Export CSV to back up.

## Run it

Lives in the `job-hunt/` folder of The Boost Nation site, so the main server (`npm start` at the repo root) serves it at `/job-hunt/`. It has no build step and no dependencies of its own. To run it on its own, serve this folder over HTTP (ES modules don't load from `file://`):

```bash
npm start        # serves on http://localhost:3000
# or: python3 -m http.server 3000
```

Deploy as-is to GitHub Pages, Netlify or Vercel.

## Test

```bash
npm test         # Node's built-in test runner, Node 18+
```

The email builder, rule checks, follow-up dates and CSV export live in `src/outreach.js` (pure functions, unit tested). `src/app.js` wires them to the page.
