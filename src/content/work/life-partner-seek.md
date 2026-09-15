---
title: Life Partner Seek
order: 5
status: built
summary: "Matchmaking platform built for a proposed marriage bureau — complete and deployable, with a role-based visibility model built to the same standard as an enterprise RBAC system."
users: "Bride, groom, and parent members browsing and managing matrimonial profiles, plus relationship-manager and admin roles staffing the bureau. Built for a family member who's planning to launch this as a matchmaking bureau — it hasn't launched yet, so there are no real members using it, and this write-up doesn't claim otherwise."
role: "Solo engineering team, alongside a full-time role at TCS — product design, data model, and full-stack build (React/TypeScript frontend, Supabase schema and RLS policies)."
problem: |
  A family member was planning to launch a matrimonial matchmaking bureau — the traditional model where bride and groom candidates, often with a parent managing the profile on their behalf, are matched by staff who mediate between families. That staffing model creates a real access-control problem: members need to browse and message each other, parents need visibility into a profile they manage without holding that person's login, and bureau staff (relationship managers, admins) need broad cross-profile access to do their job — but a member shouldn't see everyone's full profile, and even staff identity shouldn't be exposed to a member who has no active relationship with them.

  Life Partner Seek was built to solve that access problem in the data layer, not paper over it with UI-level hiding that a direct API call could bypass.
architecture: |
  **Five roles, one enum, one lookup table.** `app_role` — `bride`, `groom`, `parent`, `relationship_manager`, `admin` — is a Postgres enum, and role membership lives in a dedicated `user_roles` table rather than as a column on `profiles`. That separation is deliberate: it's the standard defense against a user editing their own profile row to grant themselves a role they shouldn't have.

  **One function gates every decision.** `has_role(user_id, role)` is a `SECURITY DEFINER` SQL function that checks `user_roles`, and it's the only thing every RLS policy calls to make an access decision — no role logic duplicated across policies or reimplemented in the frontend.

  **Staff access is real, but staff identity isn't free.** Admins and relationship managers can see across member profiles to do their job. But a `RESTRICTIVE` policy on `profiles` (the snippet below) means a member can only see *who* a given admin or RM actually is if they have a genuine relationship with that staff member — themselves, an active `managed_profiles` link, or an existing message thread. Role membership alone doesn't unlock visibility in either direction by default.

  **Parents get delegated access, not shared logins.** A `managed_profiles` table links a `manager_id` to a `managed_profile_id` with an explicit `relationship` (`parent` or `relationship_manager`) — so a parent managing their child's profile is a real, auditable row in the data model, not a shared password.
outcome: |
  Complete and deployable, but not launched — it's waiting on its operator (the family member it was built for) to decide on go-to-market, so there are no real members or usage numbers to report yet.

  It was built as though it were going into production from day one regardless: the role model wasn't bolted on after an MVP, it was there from the first schema migration, and the access-control decisions are enforced by Postgres RLS rather than trusted to the frontend.
stack:
  - React
  - TypeScript
  - Supabase
  - PLpgSQL
  - Row-Level Security
  - shadcn/ui
  - Tailwind CSS
diagram:
  caption: "Role membership alone doesn't grant visibility — a RESTRICTIVE policy checks the actual relationship (self, admin, RM, a managed-profile link, or an active message thread) before a staff member's identity is shown to a regular member."
  svg: |
    <svg viewBox="0 0 700 320" role="img" aria-labelledby="lps-arch-title" xmlns="http://www.w3.org/2000/svg">
      <title id="lps-arch-title">Life Partner Seek role-based visibility: five roles resolve through one has_role check, which gates whether a regular member sees only their own matches or staff sees cross-profile access with identity protection</title>
      <defs>
        <marker id="lps-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" style="fill:var(--text-3)" />
        </marker>
      </defs>

      <path d="M76,70 L76,90 Q76,110 220,110" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#lps-arrow)" />
      <path d="M213,70 L213,90 Q213,110 260,110" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#lps-arrow)" />
      <path d="M350,70 L350,110" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#lps-arrow)" />
      <path d="M487,70 L487,90 Q487,110 440,110" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#lps-arrow)" />
      <path d="M624,70 L624,90 Q624,110 480,110" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#lps-arrow)" />

      <path d="M350,180 L350,200 Q350,220 190,220" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#lps-arrow)" />
      <path d="M350,180 L350,200 Q350,220 510,220" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#lps-arrow)" />

      <g style="font-family:'JetBrains Mono',monospace;font-size:10.5px">
        <rect x="14" y="20" width="124" height="50" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="76" y="49" text-anchor="middle" style="fill:var(--text-2)">bride</text>

        <rect x="151" y="20" width="124" height="50" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="213" y="49" text-anchor="middle" style="fill:var(--text-2)">groom</text>

        <rect x="288" y="20" width="124" height="50" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="350" y="49" text-anchor="middle" style="fill:var(--text-2)">parent</text>

        <rect x="425" y="20" width="124" height="50" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="487" y="41" text-anchor="middle" style="fill:var(--text-2)"><tspan x="487" dy="0">relationship_</tspan><tspan x="487" dy="12">manager</tspan></text>

        <rect x="562" y="20" width="124" height="50" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="624" y="49" text-anchor="middle" style="fill:var(--text-2)">admin</text>
      </g>

      <g>
        <rect x="200" y="110" width="300" height="70" rx="4" style="fill:var(--surface);stroke:var(--amber);stroke-width:1.25" />
        <text x="350" y="140" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">has_role(uid, role)</text>
        <text x="350" y="158" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">SECURITY DEFINER · checked against user_roles</text>
      </g>

      <g>
        <rect x="40" y="220" width="300" height="80" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="190" y="246" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">Regular members</text>
        <text x="190" y="264" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">bride · groom · parent</text>
        <text x="190" y="280" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">see own profile + eligible matches</text>
      </g>

      <g>
        <rect x="360" y="220" width="300" height="80" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="510" y="246" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">Staff (admin · RM)</text>
        <text x="510" y="264" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">cross-profile access —</text>
        <text x="510" y="280" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">but identity hidden from members by default</text>
      </g>
    </svg>
codeSnippet:
  file: supabase/migrations/20251020212633_23ff1f4c-f63b-4f2f-9c6d-b52789f4746e.sql
  lang: sql
  repoUrl: https://github.com/mohitchimote/life-partner-seek/blob/main/supabase/migrations/20251020212633_23ff1f4c-f63b-4f2f-9c6d-b52789f4746e.sql#L1-L32
  code: |
    -- Allow staff names (Admin/RM) to be visible to users who have a direct message relationship with them
    -- This updates the restrictive profiles visibility policy to include has_message_relationship()

    DROP POLICY IF EXISTS "Restrict staff visibility" ON public.profiles;

    CREATE POLICY "Restrict staff visibility"
    ON public.profiles
    AS RESTRICTIVE
    FOR SELECT
    USING (
      -- Non-staff profiles are generally visible subject to other policies
      (
        NOT has_role(id, 'admin'::app_role)
        AND NOT has_role(id, 'relationship_manager'::app_role)
      )
      OR
      -- Staff profiles (admin/RM) are visible if one of these conditions holds
      (
        (has_role(id, 'admin'::app_role) OR has_role(id, 'relationship_manager'::app_role))
        AND (
          auth.uid() = id                                  -- self
          OR has_role(auth.uid(), 'admin'::app_role)       -- admin viewing
          OR has_role(auth.uid(), 'relationship_manager'::app_role) -- RM viewing
          OR EXISTS (
            SELECT 1
            FROM public.managed_profiles mp
            WHERE mp.manager_id = profiles.id
              AND mp.managed_profile_id = auth.uid()
          )
          OR has_message_relationship(auth.uid(), id)      -- has DM relationship with this staff
        )
      )
    );
screenshots:
  - src: /images/work/life-partner-seek/admin-dashboard.png
    alt: "Life Partner Seek admin dashboard showing all 9 profiles, pending approvals, and membership distribution"
    caption: "Admin dashboard — the unrestricted view: all profiles, pending approvals, membership tiers across the whole platform"
  - src: /images/work/life-partner-seek/admin-profiles.png
    alt: "Life Partner Seek admin Manage Profiles screen listing every member profile with verify/reject actions"
    caption: "Admin — Manage Profiles: cross-profile access to verify, message, or inactivate any member"
  - src: /images/work/life-partner-seek/rm-dashboard.png
    alt: "Life Partner Seek relationship manager dashboard showing only the 3 profiles that RM manages"
    caption: "Relationship Manager dashboard — same layout as admin, but scoped to only the profiles this RM is assigned (3, not 9)"
  - src: /images/work/life-partner-seek/parent-managed-profiles.png
    alt: "Life Partner Seek parent view showing two managed children's profiles"
    caption: "Parent view — managing two children's profiles via the managed_profiles delegation, not a shared login"
  - src: /images/work/life-partner-seek/member-search.png
    alt: "Life Partner Seek member search view showing a matched profile card with Favorited and Connect actions"
    caption: "Member — Search: browsing eligible matches, the ordinary member-facing view most of the RBAC model exists to protect"
  - src: /images/work/life-partner-seek/member-messages.png
    alt: "Life Partner Seek member's message inbox showing a regular match plus two staff conversations with real names visible"
    caption: "Member inbox — the RESTRICTIVE policy in action: staff (Admin, RM) show their real names here specifically because an active message thread exists — the exact condition in the code snippet below"
links:
  live: https://life-partner-seek.lovable.app/
  repo: https://github.com/mohitchimote/life-partner-seek
---
