# LLM Council Transcript — 2026-05-01

## Original Question
"Is adding / commands a good pattern for the dashboard? And are the current / commands the best ones or more could be included?"

## Framed Question
VIBEcheck (AI hiring pre-screening dashboard for non-technical startup founders) has a Cmd+K "Sabu" overlay. Inside it, typing "/" opens a slash-command dropdown with page-contextual commands plus a /sources connector picker.

Current /commands by surface:
- Always: `/sources` (Slack/LinkedIn/Google Docs/Notion picker), `/export`
- Home: + `/triage`
- Roles: + `/threshold`, `/criteria`
- Candidates: + `/compare`, `/draft`
- Alts: + `/memory`, `/calibrate`

Target users: non-technical founders, hiring managers at sub-10-person startups. They are not power users — they want hiring help without becoming "AI tool experts."

Question: Are slash commands the right pattern, AND are the current ones the best ones?

---

## Anonymization Mapping (revealed)
- Response A → **The Outsider**
- Response B → **The Expansionist**
- Response C → **The Contrarian**
- Response D → **The Executor**
- Response E → **The First Principles Thinker**

---

## Advisor Responses

### The Outsider (Response A)
Slash commands are a power-user pattern. You're shipping them to non-technical founders. That's the whole problem in one sentence.

"Sabu" — what is this word? Is it a person? An acronym? Why isn't it just called "Ask Alt"? You already have a character (the Alt). Now there's a second named thing (Sabu) that talks to the first named thing? I'd be lost in the first 30 seconds.

Cmd+K — non-technical founders don't know this shortcut. Designers and developers do.

The slash commands themselves read like internal jargon: /triage (medical?), /calibrate (calibrate what?), /threshold (threshold of what?), /sources (sources of what?), /draft (draft what?), /compare (compare what?). A founder hiring their first engineer is going to type "/", see a list of seven cryptic verbs, and close the panel.

Founders don't want commands. They want to type "show me the three best candidates for the backend role" and have it work. Keep slash commands as a hidden accelerator for the 5% who discover them. Don't design the primary interface around them.

### The Expansionist (Response B)
Slash commands are a massive underplay here. You've built the scaffolding for an agentic OS for hiring and you're treating it like a search shortcut menu.

The real opportunity: slash commands become the founder's API to their own taste. Every command is a reusable behavior the Alt learns from. Stop thinking "command palette," start thinking "spellbook the founder builds over time."

Missing high-value commands:
- `/remember` — promote anything in current view into Alt memory
- `/why` — explain Alt's last decision (trust-building is your moat)
- `/pipeline` — cross-role view; founders think about humans, not roles
- `/clone` — duplicate a role's config
- `/intro` — draft a warm intro to a shortlisted candidate
- `/standup` — Alt summarizes everything since last login (daily ritual)
- Custom slash commands users save → marketplace, moat that compounds per customer

Surface commands contextually as ghost suggestions inline so non-technical users discover power. Build for the ceiling.

### The Contrarian (Response C)
Slash commands are wrong for this audience and you're about to learn it the expensive way. They are the single most "I am a power user" pattern in software — discovery requires typing a punctuation mark on a hunch. You're importing a developer-tool pattern into a product whose pitch is "you don't need to be technical."

Worse: stacked inside Cmd+K (also power-user). Path to your second-most-prominent feature: memorize a shortcut, then a punctuation trigger, then nine cryptic commands.

The deeper problem: every command listed is a thing the page itself should already surface.
- `/threshold` belongs on the leniency slider
- `/compare` belongs as a button when candidates are selected
- `/draft` belongs on the candidate row
- `/triage` IS the home page

You're building a parallel command surface that duplicates the UI — two places where everything lives, two places to keep in sync.

`/sources` is the only one that earns its keep (connectors don't have a natural home in the UI yet).

Kill the slash menu. Let Sabu be conversational. The Alt is supposed to understand intent — make it do that instead of giving people a CLI in a trench coat.

### The Executor (Response D)
Slash commands are wrong for this user. Founders at 8-person startups don't memorize command palettes — they type "show me Priya's interview" and expect it to work. Cmd+K overlay is fine; the slash menu inside it is engineering theater.

You've already built it, so don't rip it out — prune hard and let usage decide.

**Kill immediately:**
- `/export` — nobody opens Sabu to export. They click a button on the page.
- `/calibrate` — too vague.
- `/criteria` — overlaps with the kanban on the Role tab.
- `/draft` — should just happen when you ask "write a rejection for Sam."

**Keep:**
- `/sources` — genuinely needs structured input.
- `/compare` — real verb that benefits from a picker UI.
- `/memory` — discrete write action, worth being explicit.

**Add:** `/candidate` (or `@candidate`) — fuzzy-pick a person to scope the conversation.

**Concrete next step:** ship instrumentation this week. Log every slash invocation and every Sabu query that doesn't use one. In two weeks you'll know which commands are <2% of usage and can cut them with data, not opinions.

### The First Principles Thinker (Response E)
You're asking the wrong question. The real question isn't "are slash commands the right pattern" — it's: **why does a dashboard built around a natural-language Alt need a command palette at all?**

Sabu's premise is that the Alt understands intent. If your NLP layer is good enough to run pre-screening interviews, it's good enough to parse "draft a rejection email." Slash commands are an admission that you don't trust your own AI.

Founders use the product six times a week, not sixty times a day. The cost of learning eight context-dependent commands exceeds the time saved.

Strip further. Slash commands are doing two distinct jobs:
1. **Discoverability** — "what can the Alt do?" Solve with a one-time inline hint or rotating placeholder.
2. **Precision invocation of structured actions** — `/sources` picking a connector. That's a parameter picker, not a command. Belongs as a chip-style attachment inside the input, like Linear's @-mentions.

Kill the slash-command framing. Keep `/sources` as a true picker. Make everything else just talking.

---

## Peer Reviews

### Reviewer 1
Strongest: **D**. Pairs a clear opinion with a shippable plan: name the four to kill, three to keep, one to add, plus instrumentation before redesigning. Everyone else delivers a thesis; D delivers a Monday morning.

Biggest blind spot: **B**. "Spellbook" is seductive but ignores users who use the product six times a week. Designing for the Linear/Notion power user this product explicitly rejects.

All missed: nobody asked whether Sabu itself is the right primary surface. They debated the menu without questioning whether a non-technical founder ever opens Cmd+K. Also: voice input. Founders driving between meetings would talk to Alt before they'd type "/triage."

### Reviewer 2
Strongest: **C**. Names the structural bug others dance around: every slash command duplicates UI that already exists. Building a parallel command surface = two sources of truth to keep in sync. C correctly isolates `/sources` as the only one that earns its keep.

Biggest blind spot: **B**. "Spellbook" + custom user-defined commands for non-technical founders using the product six times a week is fantasy. Designing for a power user that doesn't exist in this segment.

All missed: the mobile/touch story. Founders triage candidates on phones between meetings. Slash commands and Cmd+K are keyboard-only patterns.

### Reviewer 3
Strongest: **E**. Reframes the question rather than tinkering inside the bad frame. "Slash commands are admitting you don't trust your AI" is the cleanest articulation of the product tension. The @-mention/rotating-placeholder split is also the most concrete UI prescription.

Biggest blind spot: **B**. Building a "spellbook + marketplace" for non-technical founders is fantasy. CLAUDE.md is explicit: founders who want to scale taste, not learn a DSL.

All missed: none questioned whether Sabu should exist as a *separate* surface from the per-page agentic affordances already designed in AGENTIC.md (inline confirmations, ambient drawer, activity log). A global Cmd+K overlay competes with the three-surface model — a founder now has four places to find Alt's output. The real question isn't which slash commands; it's whether Sabu collapses into the existing surfaces or replaces them.

### Reviewer 4
Strongest: **E**. Separates discoverability from structured input and keeps only `/sources` (the picker that genuinely needs picking). C makes a similar point but stops at "duplication"; E gets to the underlying principle: a natural-language Alt that needs a command palette is admitting its NLU is weak.

Biggest blind spot: **B**. These users won't author custom commands — they barely tolerate Cmd+K. Designing for a Linear/Raycast power user that doesn't exist.

All missed: nobody questioned "Sabu." CLAUDE.md says the agent IS the Alt — "Sashank's Alt suggests..." A second named entity ("Sabu") inside the Alt overlay fractures the identity model the agentic architecture rests on. Also missed: the Cmd+K overlay competes with the ambient suggestions drawer specified in AGENTIC.md.

### Reviewer 5
Strongest: **D**. The only one proposing a falsifiable test instead of asserting a worldview. A/C/E are variations of "kill it," B is "expand it" — none can be wrong. D ships instrumentation in a week and lets behavior decide.

Biggest blind spot: **B**. "Spellbook + marketplace" for non-technical startup founders running <10-person teams is a misread. They will not author custom commands, let alone share them.

All missed: the Sabu/Alt naming collision A barely touched. If the agent IS the Alt (per CLAUDE.md), why is the overlay called "Sabu"? Product-identity bug bigger than any slash-command debate. Also ignored mobile/touch. And nobody asked whether `/sources` belongs in chat at all versus being a one-time setup in Settings.

---

## Chairman's Verdict

### Where the Council Agrees

- **Slash commands are the wrong primary pattern for this user.** Four of five advisors converged here independently. Non-technical founders using the product six times a week will not memorize a vocabulary of cryptic verbs invoked behind two power-user gestures (Cmd+K, then `/`).
- **`/sources` is the one command that earns its keep.** Every advisor singled it out — connectors are a structured-input picker without a natural home in the UI.
- **Most current commands duplicate UI that already exists.** `/threshold` lives on the leniency slider. `/triage` IS the home page. `/draft` belongs on the candidate row. `/criteria` overlaps the Role-tab kanban. Maintaining both surfaces is a tax with no payoff.
- **The Alt's NLP layer should carry the load slash commands currently paper over.** If the Alt can run live pre-screening interviews, it can parse "draft a rejection for Tom."

### Where the Council Clashes

- **Kill vs. prune vs. expand.** The Contrarian and First Principles say kill the slash-command framing entirely. The Executor says prune the four dead commands, keep three, add one, and let usage data decide the rest. The Expansionist sees a missed product opportunity to make slash commands the founder's customizable "spellbook." The Outsider sits in the middle: keep them as a hidden accelerator for the 5% who discover them.
- **The disagreement maps cleanly to belief about the user's evolution.** If founders stay six-times-a-week users, slash commands die. If the product becomes daily-driver core, the Expansionist's "spellbook" view has merit. Reasonable advisors disagree because they're betting on different futures.

### Blind Spots the Council Caught

Three things only emerged through peer review:

1. **The "Sabu" / "the Alt" naming collision.** CLAUDE.md is explicit: the agent IS the Alt — "Sashank's Alt suggests…" not "the system suggests." Calling the overlay "Sabu" introduces a second named entity inside the Alt, fracturing the identity model the entire agentic architecture rests on. The Outsider flagged the name; reviewers connected it to the documented identity principle.
2. **Sabu's surface competes with AGENTIC.md's three-surface model.** That doc specifies inline confirmations, an ambient suggestions drawer, and a background activity log. A global Cmd+K overlay is a *fourth* surface — and the most prominent one. A founder now has four places to find Alt's output.
3. **No mobile/touch story.** Slash menus and Cmd+K are keyboard-only. Founders triage candidates on phones between meetings; the entire pattern dies on touch.

### The Recommendation

Side with the Executor's path, but anchor it to the First Principles reframe.

- **Cut these now**, no instrumentation needed — they have no defensible job: `/export`, `/calibrate`, `/criteria`, `/triage`, `/draft`. Each duplicates a UI affordance the founder is already on the page for.
- **Keep `/sources`**, but reframe it as a chip/`@`-mention attachment in the input rather than a command (per First Principles). It's a parameter picker, not a verb.
- **Keep `/memory`** for now — it's a discrete write action that benefits from being explicit. Re-evaluate after instrumentation.
- **Add `/candidate`** (or `@candidate`) — fuzzy-pick a person to scope the conversation. This is the one verb that addresses a real gap: referencing specific entities mid-chat.
- **Ship instrumentation this week**. Log every slash invocation and every Sabu query that doesn't use one. Two weeks of behavior beats five advisors' opinions.

Do not build the Expansionist's spellbook. The user segment can't carry it. Re-open that conversation only if usage data shows founders are returning to Sabu more than five times a day, which the current product shape doesn't predict.

Address the bigger structural bugs in parallel: rename the overlay so the Alt speaks (drop "Sabu" — let the Alt be the Alt), and decide whether the Cmd+K surface collapses into or replaces the three agentic surfaces from AGENTIC.md.

### The One Thing to Do First

**Ship instrumentation on the Sabu overlay this week** — log every slash invocation, every prompt, every Sabu open without a query. Don't redesign the menu before you have two weeks of data. Cuts and additions become falsifiable instead of opinions.
