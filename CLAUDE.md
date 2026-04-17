# VIBEcheck — Product & Design Context

> Authoritative context for designing the VIBEcheck dashboard. Captures product decisions, architecture, and design direction from sessions between Rahul (founding product designer) and Claude. Treat this as the source of truth when proposing UI/flow changes — if a change conflicts with what's here, call it out.

---

## What is VIBEcheck?

VIBEcheck (vibechk) is an AI-powered hiring pre-screening platform by Alt Inc. Companies create AI avatars ("Alts") modeled on founders' voices and personalities. These Alts conduct candidate pre-screening conversations autonomously. Results feed into an ATS (e.g., Dover).

**Target users:** Startup admins, small teams (<10 people), founders who want to scale their hiring taste without scaling their time.

**Key people at Alt Inc:**
- Abhishek Madan — co-founder, product vision owner
- Shreyas & Neehar — co-founders
- Kinnari — product lead
- Madhur — design review collaborator
- Tanvi — go-live checklist

---

## Dashboard Architecture (Finalized)

**Nav:** Home → Roles → Alt → Settings

### Home Page
- Chat with Alt (dropdown switcher) + action queue (flat time-ordered pending items with Alt recommendations)
- Cross-cutting triage surface — the only place to see pending actions across all roles
- First-login welcome state: shows what Alt's team configured (roles created, Alts configured, memories loaded, flows published) with "What to do next" checklist. Transitions to normal view on "Get started →"

### Roles List Page
- Role cards with status dots (emerald=live, amber=draft, grey=paused), pipeline bars, candidate count, hiring manager name
- Search bar + status filter (All/Live/Draft/Paused)

### Role Detail Page — Three tabs:
1. **Role** — Hiring manager dropdown, interview link (copy), JD text, role status toggle (Live/Draft/Paused). ATS integration REMOVED.
2. **Interview Config** — Alt assignment card, interview flow directives (reorderable, publish step), eval criteria as **kanban board** with Must-have/Good-to-have/Nice-to-have columns (drag to reprioritize, only Nice-to-have has Add button), **leniency slider** (single 0-100 control, maps to two derived thresholds)
3. **Candidates** — Summary stats, search + status filter, flat triage sections (auto-shortlisted/needs your call/auto-rejected/decided), batch confirm buttons

### Alt Page
- Hover-expand sidebar (56px collapsed rail → 240px expanded with completeness bars + pending badges)
- Four tabs (in order): **Profile → Talk to Alt → Memories → Activity**
- Profile tab has gamified character card: pixel art sprite with breathing/blinking animation, HP-bar completeness meter, level badge (NEW/TRAINING/READY), personality trait chips, sample opening quote, interview approach timeline
- Activity tab: assigned roles, recent interviews cross-role, stats cards

### Settings
- Org details, team members, integrations

---

## Key Interaction Patterns

### ReviewPanel
- Renders as centered modal (LayoutContext = "modal")
- Fixed header, scrollable body, fixed footer for action buttons
- Used for candidate review, memory editing, eval criteria editing

### Candidate Review Panel
- Two tabs: **Alt Scores** (default, opens first) → **Transcript** (on click)
- Alt recommendation badge shown prominently (emerald for shortlist, red for pass)
- Shortlist/Reject pinned at footer

### Auto-advance
- After shortlist/reject, panel loads next pending candidate automatically
- Queue position counter shown ("2 of 5 remaining")

### Undo Toast
- Status changes immediately. 5s countdown toast with draining progress bar
- Undo reverts to needs_review
- Batch actions trigger toast too ("2 candidates rejected")
- Emerald toast for shortlist, red for reject

### Alt Recommendations
- Every candidate shows "Alt: Shortlist ↑" or "Alt: Pass ↓" badge
- Recommended action button has ring highlight

### Leniency Slider
- Single 0-100 control
- Maps to two derived thresholds: shortlistAbove = 100 - (leniency × 0.4), rejectBelow = leniency × 0.5
- Five named levels: Strict → Cautious → Balanced → Trusting → Full trust
- Visual band shows three zones (red reject → amber review → emerald shortlist)

### Eval Criteria Kanban
- Three columns: Must-have, Good-to-have, Nice-to-have
- HTML5 drag-and-drop between columns and within columns
- Click to edit in ReviewPanel (label, description, priority dropdown)
- Only Nice-to-have has "+ Add criterion" button
- Must-have and Good-to-have are generated from JD

---

## Design Reviews Incorporated

### Madhur/Rahul Apr 8
- ✅ Wider right pane + modal alternative
- ✅ Three-tab restructure
- ✅ Hiring manager field
- ✅ Search and filter
- ✅ Transcript + Alt Scores tabs
- ✅ Immediate status change with undo
- ✅ Alt gallery view (hover-expand sidebar)
- ✅ First-login welcome state
- ✅ Reframe "Needs review" → Alt's recommendation (badges)
- PENDING: Gamified Alt profile (discuss with team)

### Kinnari/Madhur/Rahul Apr 9
- ✅ Leniency slider replacing dual thresholds
- ✅ Alt Scores tab first, Transcript on click
- ✅ Kanban eval criteria (must/good/nice-to-have)
- ✅ Rename tabs: Role → Interview Config → Candidates
- ✅ Remove ATS integration from Role tab
- ✅ Flatten candidate list (remove boxed triage sections)
- ✅ Reorder Alt tabs: Profile → Talk → Memories → Activity
- ✅ Priority-based eval with drag reorder within tiers
- BLOCKED: Real assessment report data (waiting on Kinnari's JSON)

---

## Visual Design System

### Current page-based prototype (vibechk-dashboard)
- **Font:** Inter (300–700), loaded from Google Fonts
- **Primary:** hsl(230 80% 56%) — blue for interactive elements
- **Background:** hsl(220 20% 97%) — light grey
- **Cards:** white
- **Text:** hsl(220 25% 12%) dark grey-blue, muted at hsl(220 10% 46%)
- **Status colors:** Emerald (success/shortlisted), Amber (pending/warning), Red (rejected/danger)
- **Borders:** hsl(220 13% 88%)
- **Radius:** 0.5rem on cards, buttons, inputs, tabs, badges
- **Toasts:** Emerald bg for shortlist, Red bg for reject

### Retro prototype (vibechk-retro)
- Separate project exploring selective retro treatment
- All pages use light blue tinted backgrounds (hsl(228 60% 96%))
- Alt page has "retro world" treatment: NES-inspired color palette on light blue bg
- Pixel art sprites with breathing idle animation + eye blinks
- HP-bar style completeness meters
- Game-style stat cards with colored numbers (cyan, yellow, green, magenta)
- Scanline overlay, twinkling dot particles
- Content uses Inter throughout (not Lecta)
- Other pages stay modern with rounded corners and semantic colors

### NES-inspired retro palette (light blue variant):
- Blue: #3040d0 / #4050e0
- Green: #208040
- Red: #c03030
- Yellow: #a07800
- Cyan: #1878a0
- Magenta: #8030a0
- Orange: #b06820
- Panel bg: #f0f4ff
- World bg: #e8eeff
- Text: #1a2060
- Dim text: #6070a0

---

## Prototype Files

- `vibechk-dashboard/` — Main page-based prototype (React 18 + TypeScript + Tailwind + shadcn/ui)
- `vibechk-retro/` — Retro exploration (same stack, selective retro Alt page)
- Key source files:
  - `src/App.tsx` — Page-based layout with sidebar nav
  - `src/components/HomePage.tsx` — Action queue + welcome state
  - `src/components/RolePage.tsx` — 3-tab role detail with kanban eval + leniency slider
  - `src/components/RolesListPage.tsx` — Search/filter role cards
  - `src/components/AltPage.tsx` — Hover-expand sidebar + 4-tab detail + retro character card
  - `src/components/CandidateReviewContent.tsx` — Shared review component
  - `src/components/ReviewPanel.tsx` — Modal review panel
  - `src/components/LayoutContext.tsx` — Modal toggle
  - `src/components/SettingsPage.tsx` — Org settings

---

## Agentic Architecture (Designed, not yet built)

> See `AGENTIC.md` for the full deep dive — philosophy, feature list with priorities, confirmation-fatigue analysis, and the 20 specific features mapped to pages. The summary below is the 30-second version.


### Core principle
Trust scales with predictability, not capability. The Alt should amplify the founder's taste, not replace it.

### Action categorization (Reversibility × Consequence):
- **Reversible + Low consequence → Just do it, log it** (auto-reject below threshold, memory suggestions, context gathering)
- **Reversible + High consequence → Confirm before** (tonality changes, threshold adjustments)
- **Irreversible + Low consequence → Confirm before** (role publishing)
- **Irreversible + High consequence → Hard gate** (sending emails in founder's name)

### Three surfaces for agent output:
1. **Interruptive (inline confirmation):** Consequential, time-sensitive actions shown in the UI where you'd take them manually. Dashed blue border, "Alt suggests:" label.
2. **Ambient (suggestions drawer):** Non-urgent improvements. Pinnable panel from nav. Memory additions, threshold tuning, tonality adjustments. Auto-expire after 30 days.
3. **Background (activity log):** Pre-authorized auto-decisions. Chronological log on Alt page. Each entry expandable, reversible within 30 days. Escalates to proposal when confidence is low.

### High-value agent features (priority order):
1. Memory extraction from connected sources (Slack, email, notes)
2. Decision reasoning on candidate review (pattern recognition across admin history)
3. Cross-role triage summary on Home
4. Highlight extraction from transcripts (reduces review time ~80%)
5. Threshold/leniency tuning suggestions
6. Auto-drafted follow-up messages and rejections
7. Alt tonality adjustments based on performance
8. JD drafting and criteria generation

### Agent identity
The agent IS the Alt — "Sashank's Alt suggests..." not "the system suggests." The Alt sprite appears next to suggestions. Accepting a proposal feels like agreeing with a colleague.

### Key anti-pattern to avoid
Every action requiring confirmation becomes a yes/no question factory. Fix: pre-authorization at configuration time (leniency slider pattern), visibility replaces confirmation, undo is the safety net.

---

## Slack Channels for Requirements
- `#prescreening-experience` — C0A5156HC67
- `#vibechk-design` — C0ARDR3PKKK

## Figma Files
- Design system: `QL2r94oUzAJU71SDqukddV` (vibechk – Design System v2)
- Active prototype file: `71lTXRtjBopnXdwnjy5UKE`

---

## Key Design Principles
- Rahul arrives at correct instincts through questioning, works best interactively
- Design process: requirements → flow design → interactive HTML wireframes → Figma
- 8-bit aesthetic used sparingly (Alt profile, dialog boxes, motion moments) — not constant
- Weight differentiates before size in typography
- Three-tier color hierarchy for status (full opacity → 55% → 30%)
- "Does this make the Alt more like the founder over time?" — the test for any agentic feature
