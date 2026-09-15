---
title: Clinic Pay Tracker
order: 4
status: live
summary: "A pay-tracking and invoicing tool for a self-employed dental specialist working across two clinics with two different pay structures."
users: "My wife — a self-employed dental specialist working across two clinics (a London practice and one in Southend-on-Sea) with different pay structures at each. She's the only user, logging her own pay on her phone after each shift."
role: "Solo engineering team, alongside a full-time role at TCS — built and maintain the whole thing: the frontend, the Worker API, and the D1 schema."
problem: |
  My wife is self-employed across two dental clinics that pay her in completely different ways — one on an hourly rate plus a two-tier treatment commission and a set of flat daily bonuses, the other on a per-treatment rate table with no hourly component at all. She was tracking both by memory and a notes app, then reconstructing the month from scratch to invoice each clinic — easy to under-bill, easy to lose a day entirely.

  She needed something she could log on her phone in under a minute after each shift, that would do the maths itself for whichever clinic she'd worked that day, and hand her a ready-to-send invoice at the end of the month.
architecture: |
  It's deliberately the simplest stack that could do the job. `index.html` is the entire frontend — no framework, no build step — hosted on GitHub Pages behind a custom domain. It talks to a small Cloudflare Worker API backed by Cloudflare D1.

  **Two clinics, two pay formulas, one app.** Each clinic has its own calculation function. The Harley clinic is `hourly + tiered treatment commission + flat daily bonuses` (see the snippet below); the Southend clinic is an entirely different item-and-rate-table model. Switching clinics in the UI swaps which formula and which invoice renderer is used — there's no attempt to unify them into one generic model, because they aren't actually the same shape of problem.

  **One table in a shared database.** The D1 database (`los-db`) is shared with another one of my projects — the Worker only ever reads or writes the single `clinic_days` table that belongs to this app, identified by a `YYYY-MM-DD` key per day worked.

  **Auth is a shared password, on purpose.** There's exactly one real user, so a single app-wide password gating both the frontend and the Worker API is enough — no accounts, no sessions, no OAuth. It's the right amount of engineering for who actually uses this.

  **Invoicing is a copy-paste, not a PDF.** At month end, the invoice tab totals up hours and treatments for the period and renders a plain-text summary she copies straight into a message to the clinic — matching how she actually sends invoices today rather than generating a document nobody asked for.
outcome: |
  In daily use since it was built: 60 days logged, 298.5 hours, £8,114.10 tracked in gross fees — real numbers pulled straight from the app's own data summary, not an estimate. Logging a shift now takes under a minute on her phone, and month-end invoicing is copy-paste instead of reconstructing the month from memory.

  It's the smallest of these projects by far, and it hasn't needed to change since — which, for a tool that has to survive being used by someone other than the person who built it, is the actual measure of whether it works.
stack:
  - HTML
  - JavaScript
  - Cloudflare Workers
  - Cloudflare D1
  - GitHub Pages
codeSnippet:
  file: index.html
  lang: javascript
  repoUrl: https://github.com/mohitchimote/clinic-tracker/blob/main/index.html#L706-L711
  code: |
    function calcDay(s) {
      const hourly = s.hours * 11;
      const treats = (s.t6*12)+(s.t3*2)-(s.cons*5);
      const extras = (s.bonus?30:0)+(s.indem?2.5:0)+(s.gdc?2.5:0);
      return { hourly, treats, extras, total: hourly+treats+extras };
    }
screenshots:
  - src: /images/work/clinic-tracker/day-log.png
    alt: "Clinic Pay Tracker daily log for the Harley clinic, showing hours worked and treatment tier counters for a real logged day"
    caption: "Daily log — Harley clinic, a real logged shift (7 hrs, 4× 6% treatments, 1 cons-only) — the exact inputs to the calcDay() snippet above"
  - src: /images/work/clinic-tracker/invoice.png
    alt: "Clinic Pay Tracker invoice breakdown for the Harley clinic with a real itemised total"
    caption: "Invoice breakdown — hourly pay, treatment commission, and daily extras itemised to a real total due, ready to copy or export as PDF"
  - src: /images/work/clinic-tracker/data-summary.png
    alt: "Clinic Pay Tracker settings screen showing the clinic switcher and cumulative real usage: 60 days logged, 298.5 hours, £8,114.10 earned"
    caption: "Settings — the clinic switcher (she works across two, each with its own pay formula) and real cumulative usage since launch"
links:
  live: https://paytracker.drmonica.in
  repo: https://github.com/mohitchimote/clinic-tracker
---
