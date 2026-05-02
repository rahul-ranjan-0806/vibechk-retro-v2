# Council Transcript — 2026-05-02 08:49

## Original question

> is it worth keeping the candidates tab when the candidates exist in the roles tab for each role?

## Framed question (sent to all 5 advisors)

VIBEcheck is an AI-powered hiring pre-screening dashboard (React + Vite + Tailwind, Notion-style design language). Target users: startup admins, founders, small teams (≤10 people) who want an AI "Alt" to pre-screen candidates and feed results to their ATS.

The dashboard nav has these sections (in current order): Chat, Home, Roles, Candidates, Alts, Org, Settings.

Two surfaces show candidate data:

1. **Global Candidates tab** (top-level nav): Cross-role table of every candidate across every role. Filters: search, role dropdown, status, Alt-rec, time, score slider. Shows: Score, Name + reasoning, Role, Alt rec, Status, Time. Read-only triage view. Click a row → slide-over with candidate detail, or navigate to the candidate inside the role-specific page.

2. **Role-specific Candidates sub-tab** (inside Roles → [role] → Candidates tab): Same flat-table layout (recently rewritten to match the global page visually). Same filters minus the Role filter. Click a row → opens a detail panel with rich candidate-specific content: Score summary, Alt scores per criterion, Profile links (LinkedIn / GitHub / etc), Assessment detail (transcript, LinkedIn analysis, notes), ATS actions. The detail panel is far richer than the global page's slide-over.

The question: should the global Candidates tab be removed from the nav, given that every candidate already lives inside Roles → [role] → Candidates? Or is the cross-role triage view valuable enough to justify its own top-level nav slot?

Constraints/context:
- Small-team product (≤10 people, founders + admins). Hiring volume per role is small (6–12 candidates per role in mocks).
- Prototype-level decision; product hasn't shipped.
- Notion is the design reference. Notion doesn't usually duplicate page lists across multiple top-level slots.
- Alt-first product: AI handles shortlisting; humans only intervene on dilemmas. Home already surfaces dilemmas across roles ("Needs your call"). Activity log tracks Alt decisions.
- Removing the tab simplifies nav. Keeping it provides a "single pane" for cross-role triage.
- Global page is read-only — no shortlist actions surfaced from it; full work happens inside the role.

What's at stake: a permanent nav-level decision that shapes how users mentally model the product.

---

## Anonymization map (for peer review)

- A = The Expansionist
- B = The First Principles Thinker
- C = The Executor
- D = The Contrarian
- E = The Outsider

---

## Advisor responses

### The Contrarian

Kill it. And while you're at it, interrogate why you built it in the first place — that's the real bug.

The global Candidates tab is a prop. It looks powerful in a demo ("see every candidate in one view!") but it does nothing the product actually needs. Three problems you're glossing over:

1. **It's a read-only dead-end.** You navigate to a cross-role table, click a row, get a thin slide-over, then have to jump into the role to do anything real. That's not triage, that's a detour. Every click on this tab ends with the user leaving it.
2. **Home already does the only job that matters.** "Needs your call" surfaces cross-role dilemmas. That's the actual cross-cutting use case. The global Candidates tab competes with Home and loses, because Home is opinionated (Alt-curated dilemmas) while Candidates is a dumb dump of everything. Admins of a 10-person company looking at 6-12 candidates per role do not need a 60-row table to "scan."
3. **It contradicts the product thesis.** You wrote in CLAUDE.md: the Alt handles shortlisting, humans intervene on dilemmas. A global flat list of all candidates is the *pre-Alt* mental model — the spreadsheet view ATS users are escaping. Keeping it tells users "you should still be reviewing everyone," which undermines the trust you're trying to build in the Alt.

The fatal flaw: you're keeping it because removing it feels like losing a feature. It's not a feature, it's a redundant index. Notion doesn't duplicate page lists at the top level for a reason — it teaches users the wrong hierarchy.

Cut it. If cross-role triage matters later, it belongs as a Home widget, not a nav slot.

### The First Principles Thinker

You're asking the wrong question entirely.

The real question isn't "global tab or no global tab." It's: **what is the primary unit of work in this product?**

You haven't decided. And until you do, every nav decision is a coin flip dressed up as analysis.

Two possible answers:

**If the unit is the role**, then the founder thinks "I'm hiring for X, what's happening in X." Candidates only exist inside roles. A global Candidates tab is a category error — like Notion having a top-level "Paragraphs" section. Kill it. Done.

**If the unit is the candidate**, then the founder thinks "who are the humans Alt is talking to right now, and which ones need me." Roles are just a tag. The global view is the product; role pages are filters. Kill the per-role Candidates sub-tab and make role pages link out to a pre-filtered global view.

You're trying to have it both ways and that's why you've built the same table twice with different richness levels. That's not a nav problem. That's a model problem leaking into the UI.

Now — given everything else in your spec (Alt-first, dilemmas surfaced on Home, Activity log on Alt) — the unit of work you've actually committed to is **the dilemma**, not the role and not the candidate. Home is already the cross-cutting triage surface. You said so yourself in CLAUDE.md: "the only place to see pending actions across all roles."

So the global Candidates tab isn't a second triage surface. It's a confession that you don't trust Home to do its job. Fix Home or kill the tab. Don't ship both.

### The Expansionist

Keep the global Candidates tab. You're undervaluing what it becomes.

Right now you're framing it as a redundant list. That's because you've only built the read-only v1. The cross-role candidate surface is the most strategically valuable real estate in the entire product, and removing it forecloses an enormous upside.

Three things that get unlocked by keeping the slot:

One, talent pooling. Candidates rejected for Role A are often perfect for Role B six weeks later. No founder remembers this. An Alt that surfaces "this person you passed on for Eng is a strong fit for the new Forward Deployed role" is a wedge into recruiting CRM territory — a category an order of magnitude bigger than pre-screening. That feature has nowhere to live without this tab.

Two, the Alt's portfolio view. The global page is where founders feel the Alt working at scale across the whole org. "Your Alt screened 47 people this week, flagged 6, you decided on 4." That's the dopamine hit that makes them trust the Alt with more roles. Roles → Candidates is task mode; global is power mode.

Three, hiring intelligence. Pattern recognition only works across roles: "candidates from these schools convert 3x," "your Alt's leniency drifts on senior roles." This is the founder-taste-amplifier vision in CLAUDE.md and it requires a cross-role canvas.

Notion doesn't duplicate page lists because Notion is a document tool. You're not Notion. You're a hiring brain. Linear keeps Inbox and Issues as separate top-level nav even though Inbox is "just" a filtered view — because the cognitive mode is different.

Don't kill the slot. Make it carry weight.

### The Outsider

Walking in cold, here's what trips me up: I see "Candidates" in the top nav and "Roles" right next to it. My first instinct is to click Candidates, because that's the noun I care about — I'm hiring people, not roles. So I land on a flat table, scan it, click a row, get a thin slide-over, and feel vaguely underwhelmed. Then I poke around, find Roles → some role → Candidates, click a row, and get the actual rich panel with transcripts and ATS actions.

Now I'm confused. Why are there two Candidates pages? Which one is the "real" one? Did I miss something on the first one? Am I supposed to use both?

That's the killer. Two surfaces with the same name and almost the same table, but one is secretly the lite version. As an outsider I can't tell from the nav which is canonical, and once I learn the role-scoped one is richer, the global one starts to feel like a demo screen.

Also — you told me Home already surfaces "Needs your call" across roles. So the cross-role triage job is already done, by a surface designed for it (Alt-curated dilemmas), not a raw table. The global Candidates tab is solving a problem Home already solves, but worse, because it dumps everything instead of triaging.

Cut it. If someone genuinely wants to scan everyone, that's a filter view inside Roles or a saved view on Home, not a permanent nav slot competing with the richer page that shares its name. Naming collision in top nav is the kind of thing users never quite forgive — it makes the whole product feel like it doesn't know what it is.

### The Executor

Kill it. Monday morning, here's what you do:

1. Delete the Candidates route from the nav.
2. On Home, make sure the "Needs your call" section has a "View all candidates needing review" link that opens a filtered view scoped to needs_review across all roles.
3. Add one keyboard shortcut (Cmd+P or similar) that opens a global candidate search/jump — typeahead by name, jumps you straight into the role's candidate detail panel. That's your "single pane" escape hatch without burning a nav slot.
4. Audit any internal links that point to /candidates and redirect them to the role-scoped equivalent or Home.

Total effort: probably 2–3 hours of work including the redirects.

Why this is the fastest correct path: you have two surfaces doing similar things, one is strictly worse (read-only, thinner detail panel, no actions). Maintaining two filter UIs, two row components, two click-through behaviors as the product evolves is real ongoing tax. Every future change to candidate row UX is now a 2x change. That's the actual cost — not the nav slot, the divergence drift over the next 6 months.

The "cross-role triage" use case is real but it's already solved by Home's action queue. If it turns out it isn't, you'll know within two weeks of real users — add it back then, with evidence, and build it properly with actions surfaced inline. Don't pre-build a nav-level surface for a use case that Home is supposed to own.

One thing I'd flag: before you delete, grep the codebase for `/candidates` route references and `CandidatesPage` imports so the redirect list is complete. Don't ship dead links.

---

## Peer reviews (5/5 reviewers, anonymized)

### Review 1
1. **B is strongest.** It reframes the question from "should this tab exist" to "what is the unit of work?" — which is the actual decision underneath. It then catches Rahul red-handed: CLAUDE.md already declares Home as "the only place to see pending actions across all roles." The global tab is a vote of no-confidence in that decision. C and D arrive at the right answer; B explains why the question was malformed.
2. **A has the biggest blind spot.** It conflates "we might want talent pooling someday" with "keep this specific tab now." Talent pooling, portfolio dopamine, and hiring intelligence are real — but they belong on the Alt page (portfolio of work) or as a future Talent Pool surface, not bolted onto a read-only duplicate table. A is defending a slot, not a feature.
3. **All five missed the migration question.** What happens to existing muscle memory, bookmarks, and any in-flight Loom demos that show the global tab? More importantly: none asked whether per-role Candidates should also be reconsidered if Home owns triage and Alt owns portfolio — the role sub-tab might be the redundant one, not the global one. The council assumed the role-scoped view is sacred.

### Review 2
1. **Strongest: B.** It refuses the framing and exposes the real defect — the team hasn't decided whether the unit of work is role, candidate, or dilemma. Every other response argues tactics on top of an undecided model. B also lands the killer point: a second triage surface is a vote of no confidence in Home. That's the load-bearing insight.
2. **Biggest blind spot: A.** It conflates "we might want cross-role talent pooling and Alt portfolio metrics later" with "keep this specific read-only flat table now." Those future surfaces (talent pool, Alt's weekly scoreboard) are different products with different shapes — neither is a flat candidate table. A is defending the slot, not the page. Saving real estate for hypothetical features is how nav rot starts.
3. **What all five missed:** None addressed the migration cost for existing users who've already learned the global tab, or how candidate identity works across roles — if the same person applies to two roles, are they one record or two? That data-model question determines whether a global candidate view is even coherent. Also, no one asked Abhishek/Kinnari whether the global tab was a deliberate bet or a leftover from an earlier IA — you might be debating someone else's stale decision.

### Review 3
1. **Strongest: B.** It refuses the framing and forces the upstream question — what's the unit of work? — then resolves it using Rahul's own spec ("Home is the cross-cutting triage surface"). Every other response argues at the nav level; B argues at the model level and uses CLAUDE.md as the lever. C is the best tactical answer, but B is the one that prevents the same mistake recurring on the next nav decision.
2. **Biggest blind spot: A.** It conflates "we will need a cross-role canvas someday" with "keep this specific tab now." Talent pooling, portfolio view, and hiring intelligence are real — but none of them are served by the current read-only flat table. A is defending a slot, not a surface. The honest version of A's argument is "kill it now, rebuild it later when the Alt has something to say there," which is closer to C/D's position.
3. **What all five missed:** None addressed the role-scoped sub-tab. If global is redundant with Home, the per-role Candidates tab is also suspect — candidates could live as a section inside the role page rather than a tab. Also: nobody asked what happens at 50+ candidates per role, where flat tables genuinely break down and the calculus changes.

### Review 4
1. **Response B is strongest.** It reframes the question from "which tab" to "what's the unit of work" — exposing that the duplication is a data-model confusion leaking into nav. It then closes the loop using the spec itself: Home is already declared the cross-role triage surface, so a second one is an admission of distrust in Home. That's the sharpest cut. C is the best tactical answer, but B is the best strategic one.
2. **Response A has the biggest blind spot.** It argues for keeping the slot to host future features (talent pooling, portfolio view, hiring intelligence) — but none of those exist yet, and squatting nav real estate for hypothetical features is exactly the anti-pattern that produced the current redundant tab. A also ignores that the Alt page Activity tab and Home are already the designated "Alt working at scale" surfaces per CLAUDE.md.
3. **All five missed the migration cost on existing users and links.** No one asks: who currently uses /candidates, what bookmarks/Slack-shared URLs break, and does the team's go-live checklist (Tanvi) reference it? C touches redirects but only as cleanup. Also missed: the global tab might be the natural home for talent-pool/rejected-candidate reuse later — that decision deserves an explicit "not now, here's where it lives when it returns" note, not silent deletion.

### Review 5
1. **B is strongest.** It reframes the question from "which tab" to "what's the unit of work," exposing that the duplication is a model problem leaking into UI. It's the only response that holds the spec accountable to itself — citing CLAUDE.md's claim that Home is "the only place to see pending actions across all roles" and pointing out the global tab is a vote of no-confidence in Home. C is the most actionable, but B is the most clarifying.
2. **A has the biggest blind spot.** It argues for keeping the slot based on features that don't exist yet (talent pooling, portfolio view, hiring intelligence). That's pre-building nav for hypothetical roadmap. Worse, it ignores that those features could live as Home widgets, Alt page surfaces, or a future "Talent Pool" tab introduced when the feature ships — not squatted on by a read-only table now. The Linear Inbox/Issues analogy fails because Inbox has a distinct cognitive mode; the current global Candidates tab demonstrably doesn't.
3. **All five missed:** the migration/permissions angle. Who actually uses the global tab today — recruiters, hiring managers, founders? Removing it without checking telemetry or asking Tanvi/Kinnari risks breaking a workflow Rahul hasn't seen. Also nobody asked whether "global candidates" is really the latent need for a **Talent Pool** (rejected-but-revisitable) — a different object entirely, not a nav redesign.

---

## Chairman's verdict

### Where the council agrees

Four of five advisors (Contrarian, First Principles, Outsider, Executor) independently arrive at: **kill the global Candidates tab.** This is a high-confidence signal — every angle except the upside-hunting one converges:

- The tab is read-only, so every click ends with the user leaving it for the role page where the actual work happens.
- Home already owns cross-role triage by spec ("the only place to see pending actions across all roles"). A second cross-role surface is a vote of no-confidence in Home.
- Two surfaces named "Candidates" with similar tables but different richness creates a naming collision that an outsider can't resolve without clicking through both. The lite version reads as a demo screen.
- Maintaining duplicate filter UIs and row components is real ongoing tax — every future candidate-row change is a 2× change.

### Where the council clashes

**Expansionist vs everyone else** on whether the slot itself is worth holding for future features (talent pooling, Alt portfolio metrics, hiring intelligence). The Expansionist sees a strategic moat in cross-role surfaces; the other four see the *current* surface as a placeholder for features that don't exist and may take a different shape than a flat candidate table when they do.

**First Principles vs the rest** on which surface is actually redundant. If Home owns dilemma triage and Alt owns portfolio, the per-role Candidates sub-tab is potentially as suspect as the global one — candidates could be a section inside the role page rather than a tab. The other four advisors silently assumed the role-scoped view was canonical.

### Blind spots the council caught

Three blind spots only surfaced in peer review:

1. **The candidate identity model is undefined.** If the same person applies to two roles, is that one candidate record or two? The answer determines whether a "global candidate view" is even coherent — and the council debated UI without resolving the data model underneath.

2. **The talent pool is a different object, not a nav slot.** The Expansionist's strongest argument (rejected-for-A, perfect-for-B) is real, but it points to a future *Talent Pool* surface, not a read-only flat table of all-candidates-ever. Holding a nav slot for a feature with a different shape is a mistake.

3. **Migration cost was unaddressed.** No advisor asked who currently uses `/candidates`, whether the team's go-live checklist or Slack-shared URLs reference it, or whether the global tab was a deliberate Abhishek/Kinnari decision vs an IA leftover.

### The recommendation

**Kill the global Candidates tab.** The convergence across four independent angles plus all five peer reviews favoring B's strategic framing is too strong to ignore. The Expansionist's argument is real but misdirected — the future surfaces it defends (talent pool, Alt portfolio) belong elsewhere (a future Talent Pool tab, the Alt page's Activity surface) and have different shapes than the current flat table.

But take First Principles' point seriously before deleting: the duplication is a *model* problem. Before removing the global tab, write down the answer to "what is the unit of work in this product" in CLAUDE.md. The spec already implies it — the *dilemma*, surfaced via Home — but make it explicit so the next nav debate doesn't recreate this redundancy elsewhere.

Then take Executor's tactical path: delete the route, add a "View all needs-your-call" link on Home, add a Cmd+K-style global candidate jump for the rare cross-role lookup, and grep for references before shipping. Don't pre-build replacements for the talent-pool / portfolio use case — let those earn their slots when they exist as actual features.

### The one thing to do first

Before deleting any code: **add one paragraph to CLAUDE.md declaring "the unit of work is the dilemma; Home owns cross-role surfaces; per-role pages own per-role work."** That single sentence resolves the model confusion that produced the duplicate tab — and it's the cheapest decision you can lock in before touching the nav.
