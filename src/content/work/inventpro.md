---
title: InventPro
order: 1
status: live
summary: "Multi-tenant SaaS inventory and billing platform — built first for a family member's paint shop, general enough for any small-retail trade managing stock and billing, running serverless end-to-end on Cloudflare's edge network."
users: "Independent small-retail shop owners and their counter staff, with a superadmin role for platform operations. Built first for my uncle's paint shop, but the tenant model isn't paint-specific — SKUs, stock movements, and billing work the same whether the shop sells paint, computer hardware, or anything else counted and sold over a counter."
role: "Solo engineering team, built and maintained alongside a full-time product role at TCS — product design, full-stack architecture and build (worker API, tenant app, superadmin portal, marketing site, CI/CD)."
problem: |
  My uncle runs a paint retail shop in India, and like most small retailers he was running it on paper ledgers and spreadsheets that didn't talk to each other — stock counts drifted from what was actually on the shelf, billing was manual, and there was no single place to see what was owed, what was low, or what a customer bought last time. Off-the-shelf inventory SaaS either assumes a much larger operation (multi-warehouse, barcode hardware, dedicated IT) or charges per-seat in a way that doesn't make sense for a single-counter shop.

  InventPro was built to fit the actual shape of that business: one shop, a handful of staff, and a need to track stock, purchases, and billing without hiring anyone to run it. The brief was personal, but the build wasn't scaled down for it — multi-tenant from day one, with the same isolation and auth model a paying SaaS customer would expect. Nothing in the data model is paint-specific, so the same tenant shape has since picked up shops in other trades too.
architecture: |
  InventPro is deliberately edge-native — every part of it runs on Cloudflare's serverless platform (Workers, D1, Pages), with no server to provision or patch and infrastructure that scales with usage rather than needing to be sized upfront.

  **Three standalone frontends, one API.** `app/` (tenant-facing), `admin/` (superadmin portal), and `website/` (marketing) are each a single HTML file with no build step — no bundler, no framework, deployed to Cloudflare Pages as-is. All three talk to one Cloudflare Worker (`worker/src/index.js`) that fronts a single Cloudflare D1 database.

  **One table, JSON documents.** Rather than a normalized schema per feature, every tenant's data — SKUs, inward/outward stock movements, bills, customers, purchase orders, credit notes, audit log, settings — lives in one `documents` table (`tenant_id`, `collection`, `doc_id`, `data`), with `data` as a JSON blob. The D1 helpers (`dbFind`, `dbFindOne`, `dbUpsert`, `dbBatchUpsert`) are the entire data layer — no ORM. It trades some query flexibility for a schema that never needs a migration when a new collection shows up.

  **Tenant isolation is a WHERE clause.** Every row is scoped by `tenant_id`, with reserved IDs for platform-level concerns: `__system__` holds the tenant registry and platform settings, `__otp__` holds short-lived OTP sessions, and each onboarded business gets its own `shop_*` id. A superadmin role can cross tenants by passing `?tenantId=` explicitly — there's no ambient "view everything" mode.

  **Auth is hand-rolled, on purpose.** Cloudflare Workers don't have Node's `crypto` module, so JWT signing and verification are implemented directly against the Web Crypto API (`crypto.subtle`) — see the snippet below. Login is OTP-based: a 6-digit code is generated, AES-256-GCM encrypted at rest, emailed via Resend, and exchanged for a 24-hour HS256 JWT on verification (10-minute OTP TTL, 5 attempts max).

  **Tenant lifecycle is a small state machine.** Self-registration lands a business in a pending queue; a superadmin approval creates the tenant and its owner user. Deletion is two-step — archive (soft delete, data retained) before a hard delete wipes every row for that `tenant_id`. Plan limits (`trial` / `free` / `pro` / `enterprise`) are enforced server-side at the points that matter — data sync and user creation — not just in the UI.

  **Shipping.** GitHub Actions handles CI/CD to Cloudflare; secrets (`JWT_SECRET`, `RESEND_API_KEY`, `OTP_ENCRYPT_KEY`) are set via `wrangler secret put`, never committed.
outcome: |
  Live and in daily use, starting with my uncle's paint shop as the first tenant and since onboarded further tenants in other retail trades — evidence the multi-tenant model generalizes beyond the shop it was originally built for.

  The serverless architecture means there's been no server to provision or patch since launch, and the single-table document model plus three-static-HTML-files-and-one-Worker-script shape keeps operational overhead low as tenant count grows — very little surface area to maintain per additional shop, regardless of what it sells.
stack:
  - JavaScript
  - Cloudflare Workers
  - Cloudflare D1
  - Cloudflare Pages
  - Web Crypto API
  - Resend
  - GitHub Actions
diagram:
  caption: "Three static frontends, one Worker, one D1 table — tenant isolation is a WHERE clause, not a schema."
  svg: |
    <svg viewBox="0 0 680 400" role="img" aria-labelledby="inventpro-arch-title" xmlns="http://www.w3.org/2000/svg">
      <title id="inventpro-arch-title">InventPro architecture: three static frontends call one Cloudflare Worker API, backed by a single Cloudflare D1 documents table partitioned by tenant_id</title>
      <defs>
        <marker id="inventpro-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" style="fill:var(--text-3)" />
        </marker>
      </defs>

      <path d="M120,84 L120,110 Q120,150 220,150" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#inventpro-arrow)" />
      <path d="M340,84 L340,150" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#inventpro-arrow)" />
      <path d="M560,84 L560,110 Q560,150 460,150" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#inventpro-arrow)" />
      <path d="M340,214 L340,280" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#inventpro-arrow)" />

      <g>
        <rect x="20" y="20" width="200" height="64" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="120" y="46" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">app.inventpro.app</text>
        <text x="120" y="64" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10.5px">Tenant app</text>
      </g>
      <g>
        <rect x="240" y="20" width="200" height="64" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="340" y="46" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">admin.inventpro.app</text>
        <text x="340" y="64" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10.5px">Superadmin portal</text>
      </g>
      <g>
        <rect x="460" y="20" width="200" height="64" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="560" y="46" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">inventpro.app</text>
        <text x="560" y="64" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10.5px">Marketing site</text>
      </g>

      <g>
        <rect x="190" y="150" width="300" height="64" rx="4" style="fill:var(--surface);stroke:var(--amber);stroke-width:1.25" />
        <text x="340" y="176" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">api.inventpro.app</text>
        <text x="340" y="194" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">Cloudflare Worker · hand-rolled JWT · OTP auth</text>
      </g>

      <g>
        <rect x="40" y="280" width="600" height="100" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="340" y="306" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">Cloudflare D1 — one "documents" table</text>
        <text x="340" y="324" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">tenant_id · collection · doc_id · data (json)</text>

        <g style="font-family:'JetBrains Mono',monospace;font-size:10.5px">
          <rect x="59" y="336" width="130" height="28" rx="3" style="fill:var(--ink);stroke:var(--rule-strong)" />
          <text x="124" y="354" text-anchor="middle" style="fill:var(--text-2)">shop_*</text>

          <rect x="203" y="336" width="144" height="28" rx="3" style="fill:var(--ink);stroke:var(--rule-strong)" />
          <text x="275" y="354" text-anchor="middle" style="fill:var(--text-2)">__system__</text>

          <rect x="347" y="336" width="144" height="28" rx="3" style="fill:var(--ink);stroke:var(--rule-strong)" />
          <text x="419" y="354" text-anchor="middle" style="fill:var(--text-2)">__otp__</text>

          <rect x="491" y="336" width="130" height="28" rx="3" style="fill:var(--ink);stroke:var(--rule-strong)" />
          <text x="556" y="354" text-anchor="middle" style="fill:var(--text-2)">superadmin</text>
        </g>
      </g>
    </svg>
codeSnippet:
  file: worker/src/index.js
  lang: javascript
  repoUrl: https://github.com/mohitchimote/InventPro/blob/main/worker/src/index.js#L45-L67
  code: |
    // ── JWT ───────────────────────────────────────────────────────────────────
    async function signJWT(payload, secret) {
      const h = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const b = btoa(JSON.stringify({ ...payload, iat: Date.now() }));
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${b}`));
      return `${h}.${b}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
    }
    async function verifyJWT(token, secret) {
      try {
        const [h, b, s] = token.split('.');
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
          { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
        const valid = await crypto.subtle.verify('HMAC', key,
          Uint8Array.from(atob(s), c => c.charCodeAt(0)),
          new TextEncoder().encode(`${h}.${b}`));
        if (!valid) return null;
        const p = JSON.parse(atob(b));
        if (Date.now() - p.iat > 86400000) return null;
        return p;
      } catch { return null; }
    }
screenshots:
  - src: /images/work/inventpro/dashboard.png
    alt: "InventPro tenant dashboard for a live paint-shop tenant, showing SKU counts, stock movement, and low-stock alerts"
    caption: "Tenant dashboard — a live paint-shop tenant (1,132 SKUs, 45k+ units tracked). Inventory value and receivables figures blurred out for privacy."
  - src: /images/work/inventpro/admin-tenants.png
    alt: "InventPro superadmin portal showing the real tenant registry with plan tier and status"
    caption: "Superadmin portal — the tenant registry, cross-tenant: four live shops across free, monthly, and enterprise plans"
links:
  repo: https://github.com/mohitchimote/InventPro
---
