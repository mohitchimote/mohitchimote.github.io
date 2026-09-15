---
title: Journey LOS
order: 2
status: poc
summary: "Config-first, multi-tenant Loan Origination System for UK building societies and specialist lenders — a from-scratch RBAC engine (65-table schema, three-layer nav → section → field permissions) built so a new lender is onboarded by data entry, not a code deployment."
users: "UK building societies and specialist lenders — the institution is the tenant. Within one case, internal staff (advisors, underwriters, processors, compliance), broker firms, solicitors, valuers, and the customer themselves all work the same case through a role-appropriate view, enforced by permissions rather than separate apps."
role: "Solo engineering team, alongside a full-time product role at TCS. This is the same domain I work in professionally — UK mortgage and loan origination — built here as a from-scratch personal exploration of how far a fully configurable permission model can go before it needs custom code per lender."
problem: |
  Loan origination platforms I've worked on professionally tend to bake one lender's org chart into the product — role names like "underwriter" or "senior underwriter" hardcoded, along with which fields each role can see. That works until the next lender has a different structure: a small building society might have a flat 12-person team; a larger one has managers, regional directors, and a formal approval hierarchy. Shipping code to support every new lender's org chart doesn't scale.

  Journey LOS is a personal exploration of the alternative: what if the entire permission model — roles, workflow stages, which fields are visible or editable at each stage — was configuration a lender's admin enters, not code a development team ships?
architecture: |
  Journey LOS is a hub-and-spoke multi-tenant platform: one hub, multiple lender institutions, with every party on a case (internal staff, brokers, solicitors, valuers, customers) accessing the same case data through a role-appropriate view rather than separate applications.

  **Auth was rebuilt from scratch, on purpose.** It originally used Clerk. I pulled it out — a third-party service sitting on the critical auth path, a JWT claim payload too thin for rich RBAC data, per-MAU pricing at scale, and SSO integration being harder with Clerk as an intermediary. In its place: PBKDF2-SHA256 password hashing (100,000 iterations, 16-byte salt, pure WebCrypto, no npm dependency) and hand-rolled HS256 JWTs — the same "no external auth library" instinct as InventPro, but carrying a much richer payload here. Every token encodes the caller's institution, role, role level, permission list, and visibility scope directly, so authorization needs zero database lookups per request.

  **Permission is layered three ways.** The same case view renders differently per role and per workflow stage, checked at three levels: can you reach this page at all (nav), can you see this section and is it editable (section, per workflow stage), can you see this specific field and edit it (field, down to a per-field sensitivity tier). See the diagram below.

  **Config-first RBAC, not fixed roles.** `role_definitions` stores each institution's org chart as data — role label, level, approval limit, visibility scope — checked against a ~60-entry `permission_catalog`. Permission checks support wildcard matching (`entity.*` grants `entity.case.create`, `entity.case.edit`, etc.) via a single `hasPermission()` function, wired into every protected route through a `requirePermission()` Hono middleware — see the code snippet.

  **A genuinely large domain model.** 65 tables across 38 migrations: cases carry an array of case types so a Porting + Further Advance can share one case, one ESIS, and one customer set; facilities model Part A/Part B loans independently; collateral has its own lifecycle (`proposed → owned → pledged → charged → released`) and can be flagged, not blocked, when re-pledged across active cases; customers carry versioned financial profiles with a configurable staleness window that gates workflow progression.

  **Honest state.** This is proof-of-concept stage. The RBAC middleware and schema described above are real and wired into all 28 API route files — that part works. Some of the design document's more ambitious enforcement patterns, like query-level Chinese-wall separation between broker-sourced and internally-sourced cases, are specified in the role schema (`case_source_filter`) but not yet enforced in every case query. I'm building this in the open about what's actually implemented versus designed.
outcome: |
  Proof-of-concept stage — not deployed anywhere live, and not trying to look otherwise. What's real: a 65-table schema across 38 migrations, a three-layer permission model wired into all 28 API route files, and a working decision to rip out a third-party auth provider mid-build once it stopped fitting the RBAC model, rather than bend the model to fit the provider.

  The open question this was built to answer — whether a fully config-driven permission model can absorb a new lender's org chart without a code change — is answered for the parts that are wired up. The parts still marked as designed-but-not-enforced (like the Chinese-wall query filtering) are the honest boundary of what's actually done versus what's specified.
stack:
  - React
  - Vite
  - Hono.js
  - Cloudflare Workers
  - Cloudflare D1
  - Cloudflare KV
  - Cloudflare R2
  - TypeScript
  - Tailwind CSS
  - WebCrypto API (PBKDF2 + HS256 JWT)
diagram:
  caption: "One case, three permission layers — nav, section, and field each decide what a role sees before a query runs."
  svg: |
    <svg viewBox="0 0 680 340" role="img" aria-labelledby="joules-arch-title" xmlns="http://www.w3.org/2000/svg">
      <title id="joules-arch-title">Journey LOS permission model: a case view is gated at three nested levels — nav item, section, and field — each checked against the caller's role before rendering</title>
      <defs>
        <marker id="joules-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" style="fill:var(--text-3)" />
        </marker>
      </defs>

      <path d="M340,84 L340,140" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#joules-arrow)" />
      <path d="M340,204 L340,260" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#joules-arrow)" />

      <g>
        <rect x="20" y="20" width="640" height="64" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="340" y="46" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">Nav Item</text>
        <text x="340" y="64" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10.5px">Can you reach this page at all? — gated by JWT permissions[]</text>
      </g>

      <g>
        <rect x="100" y="140" width="480" height="64" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="340" y="166" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">Section</text>
        <text x="340" y="184" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10.5px">View / edit / hidden — per role x workflow stage</text>
      </g>

      <g>
        <rect x="180" y="260" width="320" height="64" rx="4" style="fill:var(--surface);stroke:var(--amber);stroke-width:1.25" />
        <text x="340" y="286" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">Field</text>
        <text x="340" y="304" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10.5px">Per-field view/edit roles + sensitivity tier</text>
      </g>
    </svg>
codeSnippet:
  file: apps/api/src/middleware/auth.ts
  lang: typescript
  repoUrl: https://github.com/mohitchimote/los-platform/blob/main/apps/api/src/middleware/auth.ts#L58-L79
  code: |
    // Checks that the user holds at least one of the required permissions.
    // Supports wildcard suffix matching: 'entity.*' grants 'entity.case.create', etc.
    export function hasPermission(userPermissions: string[], required: string): boolean {
      return userPermissions.some(p => {
        if (p === '*') return true;
        if (p === required) return true;
        if (p.endsWith('.*')) {
          const prefix = p.slice(0, -2);
          return required === prefix || required.startsWith(prefix + '.');
        }
        return false;
      });
    }

    export const requirePermission = (permission: string) =>
      createMiddleware<{ Bindings: Env }>(async (c, next) => {
        const user = c.get('user');
        if (!hasPermission(user.permissions, permission)) {
          return c.json({ success: false, error: 'Forbidden: insufficient permissions' }, 403);
        }
        await next();
      });
screenshots:
  - src: /images/work/journey-los/dashboard.png
    alt: "Journey LOS broker dashboard showing pipeline value, case status breakdown, and recent cases"
    caption: "Broker dashboard — pipeline by stage, case status, and recent cases for the logged-in role."
  - src: /images/work/journey-los/roles-admin.png
    alt: "Journey LOS admin screen for configuring a role's permissions and approval limits"
    caption: "Role configuration — an institution admin builds their own org chart and permission set as data, no deployment required."
    placeholder: true
links:
  live: https://los-platform.pages.dev/
  repo: https://github.com/mohitchimote/los-platform
---
