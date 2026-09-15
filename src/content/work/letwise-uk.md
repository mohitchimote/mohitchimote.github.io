---
title: LetWise UK
order: 3
status: live
summary: "A landlord wealth-management platform — mortgage, tenancy, and cashflow tracking with an automatic remortgage-savings finder, plus a role-gated admin console. Built for a friend managing a multi-property portfolio."
users: "My friend, a portfolio landlord managing multiple UK rental properties, is the primary user — tracking property valuations, mortgages, tenancies, and cashflow in one place. A second, role-gated admin interface is for platform operations: managing the market-rate data that powers the savings comparisons, monitoring subscriptions, and handling remortgage referrals."
role: "Solo engineering team, alongside a full-time product role at TCS — product design, data model, and full-stack build (TanStack Start frontend, Supabase schema and RLS policies, Cloudflare Workers deployment, Paddle billing integration)."
problem: |
  A friend of mine manages a portfolio of rental properties in the UK, and was tracking mortgages, tenancies, and rental income the way most landlords do — spreadsheets, plus whatever each mortgage lender's portal shows in isolation. The two things that actually matter for a landlord's return — whether any mortgage's fixed-rate period is ending soon, and whether a better rate is now available elsewhere — weren't connected anywhere. Compliance deadlines (EPC ratings, gas safety certificates) added another set of dates to track by hand.

  LetWise UK was built to put portfolio equity, cashflow, and compliance deadlines in one dashboard, and — the more novel part — to automatically flag when a property's current mortgage rate is worse than what's newly available, without the landlord having to go shopping for rates themselves.
architecture: |
  LetWise UK is a single TanStack Start application — React 19 with file-based routing, server-rendered and deployed to Cloudflare Workers — rather than a separate frontend and API. Role-gated route groups (`/_authenticated/*` for the landlord app, `/_authenticated/_admin/*` for the admin console) mean one deployment serves two distinct interfaces without a second app to build or ship.

  **Access control lives in the database, not the app.** Every table — properties, mortgages, tenancies, transactions, subscriptions — has Row-Level Security enabled in Postgres via Supabase. Rather than each policy re-deriving "is this user an admin," a single `has_role()` security-definer function is called from every policy that needs it (see the snippet below). Landlords see only rows where `auth.uid() = user_id`; admins pass a role check instead. The authorization logic exists in exactly one place, not duplicated across a dozen policies or re-implemented in application code.

  **The savings finder is a straight comparison, not a black box.** Each mortgage is matched against the latest `market_rates` row for its LTV band and term type, and the difference against the mortgage's current rate becomes a "potential monthly saving" shown on the landlord's dashboard. Acting on it logs a row to `referrals`, which shows up in the admin console's referral queue — the whole feature is a join and a subtraction, not a model.

  **Billing is Paddle, wired through Supabase Edge Functions.** Checkout runs client-side via Paddle.js; a Supabase Edge Function verifies and handles the webhook, updating the `subscriptions` table server-side so subscription status is never trusted from the client.

  **Admin is a first-class interface, not an afterthought.** The admin console (visually distinct — emerald rather than the landlord app's indigo) covers rate management, user administration, a broadcast tool for announcements, the referral queue, and a read-only audit log that every admin write goes through.
outcome: |
  In active use by the friend it was built for, tracking their property portfolio day to day — mortgages, tenancies, cashflow, and compliance deadlines in one dashboard instead of scattered across lender portals and spreadsheets.

  The architecture decisions travel well beyond a single user, though: role-gated routing in one deployment, RLS-enforced multi-tenancy through a single `has_role()` function, and Paddle billing wired through server-verified webhooks are the same shape a genuine multi-landlord SaaS product would need — nothing here was built assuming there'd only ever be one user.
stack:
  - TanStack Start
  - React
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
  - Supabase (Postgres, Auth, Edge Functions)
  - Cloudflare Workers
  - Paddle
diagram:
  caption: "One deployment, two role-gated interfaces — authorization enforced in Postgres RLS, not in the app."
  svg: |
    <svg viewBox="0 0 680 320" role="img" aria-labelledby="letwise-arch-title" xmlns="http://www.w3.org/2000/svg">
      <title id="letwise-arch-title">LetWise UK architecture: one TanStack Start app on Cloudflare Workers serves role-gated landlord and admin routes, backed by Supabase Postgres with Row-Level Security, with Paddle billing verified through a Supabase Edge Function webhook</title>
      <defs>
        <marker id="letwise-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" style="fill:var(--text-3)" />
        </marker>
      </defs>

      <path d="M340,84 L340,110 Q340,150 210,150" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#letwise-arrow)" />
      <path d="M340,84 L340,110 Q340,150 530,150" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#letwise-arrow)" />
      <path d="M420,205 L385,205" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#letwise-arrow)" />

      <g>
        <rect x="190" y="20" width="300" height="64" rx="4" style="fill:var(--surface);stroke:var(--amber);stroke-width:1.25" />
        <text x="340" y="46" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">letwise.uk</text>
        <text x="340" y="64" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">TanStack Start (SSR) on Cloudflare Workers — /app + /admin, role-gated</text>
      </g>

      <g>
        <rect x="40" y="150" width="340" height="110" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="210" y="176" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">Supabase Postgres</text>
        <text x="210" y="196" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">Row-Level Security on every table</text>
        <text x="210" y="212" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">has_role() gates admin reads;</text>
        <text x="210" y="228" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">landlords see only auth.uid() = user_id</text>
      </g>

      <g>
        <rect x="420" y="150" width="220" height="110" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="530" y="176" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">Paddle</text>
        <text x="530" y="196" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">Client-side checkout</text>
        <text x="530" y="212" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">→ webhook → Edge Function</text>
        <text x="530" y="228" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">→ writes subscriptions row</text>
      </g>
    </svg>
codeSnippet:
  file: supabase/migrations/20260419221700_403e120a-61b7-4927-bed1-b532dcefa40e.sql
  lang: sql
  repoUrl: https://github.com/mohitchimote/letwise-uk/blob/main/supabase/migrations/20260419221700_403e120a-61b7-4927-bed1-b532dcefa40e.sql#L38-L41
  code: |
    -- one security-definer function, called from every RLS policy that needs a role check
    create or replace function public.has_role(_user_id uuid, _role public.app_role)
    returns boolean language sql stable security definer set search_path = public as $$
      select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
    $$;

    -- used directly in policies, e.g. (properties table):
    create policy "properties_admin_select" on public.properties
      for select using (public.has_role(auth.uid(), 'admin'));
screenshots:
  - src: /images/work/letwise-uk/wealth-dashboard.png
    alt: "LetWise UK landlord wealth dashboard showing portfolio equity, cashflow, and critical alerts"
    caption: "Landlord wealth dashboard — portfolio equity, net cashflow, and compliance alerts in one view"
  - src: /images/work/letwise-uk/admin-console.png
    alt: "LetWise UK admin Command Center showing platform-wide MRR, active users, and referral metrics"
    caption: "Command Center — platform metrics, visually distinct (emerald vs. the landlord app's indigo) from the landlord interface"
  - src: /images/work/letwise-uk/market-rates.png
    alt: "LetWise UK Market Rates admin screen listing scraped mortgage products by lender, LTV band, and rate"
    caption: "Market Rates — the scraped product data every landlord's Switch & Save comparison is matched against"
links:
  live: https://letwise-uk.lovable.app/
  repo: https://github.com/mohitchimote/letwise-uk
---
