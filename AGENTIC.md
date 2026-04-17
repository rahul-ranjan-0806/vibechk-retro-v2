# VIBEcheck — Agentic Architecture Deep Dive

> Companion to `CLAUDE.md`. This captures the full reasoning, trade-offs, and specific feature designs for agentic capabilities in the dashboard.

---

## Core Philosophy

**Trust scales with predictability, not capability.** A tool that does less but predictably is more useful than a tool that does more but surprises you.

**The Alt is the founder's identity, not a generic AI.** Every agentic feature either reinforces that personal connection (the Alt gets sharper, more "you") or dilutes it (the Alt starts acting like a generic AI). The test: does this make the Alt more like the founder over time, or does it introduce behavior the founder didn't ask for?

---

## Three Levels of Agency

### Level 1 — Conversational interface over existing actions
The admin types "reject everyone below 60" instead of dragging a slider. The agent translates language to existing UI actions. Just a different input method.

### Level 2 — Autonomous decisions within defined guardrails
The agent takes actions on its own based on thresholds or patterns. The leniency slider is already this — pre-authorized decisions within bounds.

### Level 3 — Cross-system, multi-step execution
The agent chains actions across tools. "Find candidates from LinkedIn, send them the interview link, schedule follow-ups when they complete." Real agency reaching into other systems.

---

## What Should Be Agentic

### 1. Pattern recognition across decisions (extending the admin's reasoning)

**Why it works:** The admin makes hundreds of hiring decisions. Each contains implicit signals. An agent that surfaces patterns across those decisions provides information the admin fundamentally can't compute on their own — too many decisions to hold in working memory. This is additive, not substitutive.

**Risk:** Pattern recognition in hiring is where bias lives. If past decisions show preference for top-tier university candidates, surfacing that pattern reinforces it. Also, the agent's definition of "similar candidates" carries assumptions the admin might not notice.

**Design principle:** Surface patterns WITH underlying reasoning exposed. Not "you'd probably shortlist this" but "you've shortlisted 6 of 8 candidates who scored high on problem framing, which this candidate does." The admin sees the criteria, can push back.

### 2. Mechanical work compression (drafting, gathering context, summarizing)

**Why it works:** Lower risk than decision-making. Drafting isn't sending. Context gathering is pure information retrieval. The admin still interprets and decides.

**Risk:** "Mechanical work" has hidden value. Writing a rejection email forces thinking about the candidate as a person. Agent-drafted outreach may sound generic, cheapening the founder's personal brand. Also, anchoring effect — when the agent drafts first, the admin's edits tend to stay close to the draft rather than being genuinely their own voice.

**Design principle:** Context summaries are safe (just information). Draft messages should feel like starting points — maybe bullet points of what to cover rather than finished prose, forcing the admin to actually write.

### 3. Alt self-improvement (interview quality feedback)

**Why it works:** The agent has information the admin never will — it can watch every interview, notice patterns across candidates (unclear follow-ups, consistently difficult prompts, length drift). Every interview becomes training data. This compounds.

**Risk:** "The Alt is improving itself" means changing behavior without the admin's direction. If the Alt decides to ask fewer clarifying questions based on a pattern, but the admin actually wanted those questions, the Alt drifts silently.

**Risk:** Reward hacking. If "good interview" = candidate satisfaction, the Alt goes easier. If "good interview" = consistency, the Alt homogenizes. Whatever you optimize for, you'll get unexpected optimization.

**Design principle:** Self-improvement must always propose, never commit. "I've noticed my opener isn't landing — want to try a different one?" The admin approves or declines. The moment the Alt silently adjusts its own behavior, it stops being "the founder's Alt."

---

## What Should NOT Be Agentic

### 1. Actual hiring decisions in ambiguous cases

The ambiguous middle (between auto-shortlist and auto-reject thresholds) is exactly where the admin's judgment matters most. If the agent decides by default, the admin's input reduces to ratifying an already-framed decision — not the same as deciding.

**Psychological trap:** When the agent proposes and the admin confirms, the admin isn't really choosing — they're ratifying. Over time they defer more, and their hiring taste atrophies. The tool they're using to amplify judgment erodes judgment.

**Legal dimension:** "The AI did it" is a weak defense. The human decided to trust the AI, but has less context to defend the decision.

**Correct pattern:** Threshold system. Clear auto-decisions above/below bounds the admin sets. Manual review for everything else. If volume is too high, the answer is tighter thresholds, not more agent autonomy.

### 2. Outbound communication in the founder's name

Candidates increasingly detect AI-generated writing. If a candidate realizes the thoughtful founder message was auto-generated, trust damage is disproportionate — it feels like deception. The founder's personal brand, which was the whole reason for vibechk, is damaged by the feature meant to amplify it.

**One bad auto-sent message undoes months.** A factual error, tone mismatch, or broken link lands worse from the founder than from a recruiting coordinator, because expectations of personal attention were higher.

**Correct pattern:** Drafts yes, auto-send never. The friction of clicking "send" after reviewing is not a bottleneck worth removing. If the founder can't spare 30 seconds to review a message in their name, they shouldn't be sending it.

### 3. Changes to the Alt's configuration without confirmation

The Alt is a trust product. The admin trusts that today's configuration persists tomorrow. Silent changes break that trust. "I didn't configure it this way" is the worst possible experience.

**Control legibility:** Users need to understand why their tool behaves as it does. Self-modifying agents are illegible by nature. If the Alt adjusts tonality, the admin notices something off but can't trace why — was it a bug? A silent update?

**Correct pattern:** Always proposed, never committed. "I noticed you rejected 5 candidates above your shortlist threshold — want me to raise it?" The admin decides.

### 4. Anything the admin would feel blindsided by

Even a mostly hands-off admin has specific moments (controversial candidate, high-stakes role) where they want to be in the loop. The cost of a surprise bad action is high; the benefit of avoiding a confirmation click is low.

**Correct pattern:** When designing any agentic feature, ask "would the admin be surprised this happened without their input?" If yes, keep it proposal-only.

---

## The Confirmation Fatigue Problem

### The failure mode
Every confirmation adds a step. A tool with 20 agentic features becomes 20 approval prompts. The admin spends their day saying yes. Eventually they:
1. Rubber-stamp without reading (defeating the purpose)
2. Turn features off (the friction is higher than doing it themselves)
3. Feel like they have a needy assistant, not a useful tool

"Always require confirmation" is the safe answer, not the good answer.

### The fix: categorize by Reversibility × Consequence

| | Low consequence | High consequence |
|---|---|---|
| **Reversible** | Just do it, log it | Confirm before |
| **Irreversible** | Confirm before | Hard gate, always confirm |

Most agentic actions live in Reversible + Low consequence → no confirmation needed.

### Specific examples:

**Just do it (no confirmation):**
- Auto-rejecting below threshold (admin pre-authorized via leniency slider)
- Memory suggestions appearing in drawer (not executed, just surfaced)
- Context gathering before an interview (information only)
- Logging a pattern (passive, no action)

**Confirm before:**
- Changing Alt's tonality (reversible but high-consequence)
- Adjusting leniency threshold (changes future behavior broadly)
- Publishing a role as live (semi-reversible, external exposure)

**Hard gate:**
- Sending email to a candidate (irreversible, high consequence)

### Key insight
Confirmation is for actions the admin wouldn't authorize in advance. If they set the threshold, the agent executing within it isn't a new decision — it's the decision they already made. Confirming each instance confirms something they already said yes to.

### Design principles to avoid fatigue:
1. **Pre-authorization by default.** Features ask "what scope are you comfortable with?" at setup, not "is this specific action okay?" every time.
2. **Visibility replaces confirmation.** Activity log, "recent actions" summary, weekly digest. Admin can see agent's work without being interrupted.
3. **Undo is the safety net.** 5-second undo toast on reversible actions. 24-hour reversal window. Trust comes from easy reversal, not upfront approval.
4. **Escalation on uncertainty.** Agent only interrupts when confidence is genuinely low. Rare interruptions are salient; constant ones lose meaning.
5. **Batch review.** "You have 3 Alt suggestions pending" instead of 3 separate interruptions. Admin enters review mode deliberately.

---

## Three Surfaces for Agent Output

### 1. Interruptive — Inline Confirmation
For consequential, time-sensitive actions.

**Design:**
- Proposals appear IN the UI where you'd take the action manually
- Dashed blue border on elements containing a pending proposal
- "Alt suggests:" label inline with the action button
- One-click confirm, 5-second undo window
- Batch confirm at section level ("Confirm all 3 Alt recommendations")
- Keyboard: Enter to confirm, Esc to dismiss

**Override tracking:**
- Clicking the non-recommended action gets a subtle inline prompt: "Alt recommended shortlisting. Override?" — one line, not a modal
- Overrides are logged for pattern analysis

### 2. Ambient — Suggestions Drawer
For non-urgent improvements.

**Design:**
- Pinnable panel from a nav indicator ("3 suggestions" with badge)
- Admin visits when they want, ignores indefinitely without consequence

**Each suggestion has:**
1. What — "Add a memory: 'Prefers candidates with direct execution experience.'"
2. Why — "Based on 4 candidates you rejected this week who scored high on strategy but low on execution."
3. Source — "Drawn from your decision patterns."
4. Action — [Add memory] [Dismiss] [Show me the candidates]

**Behaviors:**
- Suggestions auto-expire after 30 days
- Dismissal trains the agent (stop making similar suggestions)
- "Show me the evidence" always available — no black-box suggestions

### 3. Background — Activity Log
For pre-authorized auto-decisions and passive actions.

**Design:**
- Chronological list on Alt page, extending the Activity tab
- Each entry expandable for full reasoning, reversible within 30 days

**Escalation triggers** (auto-action → proposal):
- Score within 5 points of threshold boundary
- Candidate matches a pattern where admin has overridden before
- Role flagged as high-stakes

**Status indicator in nav:**
- Solid dot: agent actively taking actions
- Hollow dot: agent suggesting only
- Grey dot: agent silent

---

## Agent Identity

The agent IS the Alt — "Sashank's Alt suggests..." not "the system suggests..." The Alt's sprite appears (small, inline) next to suggestions. Accepting a proposal feels like agreeing with a colleague. This reinforces the brand moat: the thing doing agentic work is the founder's personalized assistant, not a generic AI.

---

## Specific Features by Page (Priority Ordered)

### Home Page
1. **Cross-role triage summary** — Agent drafts one-paragraph summary: "5 candidates across 3 roles. 2 likely shortlists, 2 likely rejects, 1 genuinely needs your call. Handle the easy ones in 30 seconds?" [HIGH VALUE]
2. **Smart action queue prioritization** — Reorder pending items by what matters (waiting time, role priority, admin patterns) not just chronology
3. **Alt chat as thinking partner** — Chat has access to admin's history, active roles, pending candidates. Ask "should I shortlist Marcus?" and it reasons using past decisions [HIGH VALUE]

### Roles List Page
4. **Auto-generate JD drafts** — Agent drafts JD from role title + org context + comparable startups. Admin edits rather than writes from scratch.
5. **Stale role detection** — "This role has 40 link visits but zero completions. Something's broken." Agent identifies friction points.
6. **Interview link distribution suggestions** — "You haven't shared this publicly. These channels tend to work: [HN Who's Hiring], [Designer Hangout]." Draft social posts for each.

### Role Detail Page
7. **JD-driven criteria updates** — When admin edits JD, agent proposes criteria changes. "You added a line about systems thinking — add as good-to-have?"
8. **Interview flow suggestions by role type** — "For design roles, portfolio walk-through first works best. Your flow is ordered differently — reorder?"
9. **Threshold tuning from outcomes** — "You've overridden 4 of 6 auto-rejections — threshold too strict. Suggest 40→35?"
10. **Candidate summary pre-review** — 3-line summary on candidate card before clicking in: "Strong on execution, weak on ambiguity. Background at Series B startups." [HIGH VALUE]

### Candidate Review Panel (highest feature density)
11. **Decision reasoning from history** — "Among past decisions, similar profiles were shortlisted 6 of 8 times. The rejections involved weak culture-fit, which this candidate doesn't exhibit." [HIGH VALUE]
12. **Highlight extraction from transcript** — 3-5 most signal-rich moments instead of full transcript. Saves 80% of reading time. [HIGH VALUE]
13. **Follow-up question suggestions** — "Alt didn't get clear culture-fit signal. Suggested async follow-up: 'Tell me about a time you pushed back on a decision.'"
14. **Auto-drafted rejection/acceptance messages** — Draft references specifics from interview, not templates. Admin reviews and sends.

### Alt Page
15. **Memory extraction from external sources** — Admin connects Slack/email/LinkedIn. Agent reads and surfaces: "You wrote: 'I don't care about fancy degrees.' Add as memory?" [HIGHEST VALUE — makes Alt genuinely personal without explicit configuration]
16. **Tonality adjustment from interview feedback** — "Candidates take longer to warm up. Your opener might be too direct. Want to soften?"
17. **Contradiction detection across memories** — "'Prefers direct execution' vs 'Values strategic thinking in senior roles.' Resolve?"
18. **Performance benchmarking** — "Your Alt's interviews: 84% completion vs 72% platform avg. Above average on engagement, below on technical depth."

### Settings
19. **Integration recommendations** — "You haven't connected an ATS. Dover or Ashby would save 2-3 hours/week."
20. **Team member role suggestions** — "Priya Rao is Head of Product. Recommend: access to own candidates, all roles in department, configured Alts."

### Cross-cutting: Suggestions Drawer
Aggregates all lower-urgency output:
- Memory suggestions awaiting review
- Threshold tuning recommendations
- Interview flow optimization ideas
- JD improvements
- Patterns worth knowing ("You've been rejecting more culture-fit cases — preferences shifting?")

---

## What NOT to Build

- **"Type commands to control the dashboard" chat input** — solves a non-problem. Clicking a nav item is faster than typing "go to roles."
- **Auto-scheduling interviews** — too many edge cases, low value per instance
- **AI-generated candidate outreach at top-of-funnel** — damages founder brand if it sounds generic
- **Autonomous hiring decisions beyond threshold system** — violates core product thesis
- **Self-modifying Alt configuration** — breaks trust

---

## Implementation Priority

### Ship first (highest leverage):
1. Memory extraction from connected sources
2. Decision reasoning on candidate review
3. Cross-role triage summary on Home
4. Highlight extraction from transcripts

### Ship second (compounding value):
5. Threshold/leniency tuning suggestions
6. Auto-drafted follow-up messages and rejections
7. Alt tonality adjustments based on performance

### Ship third (quality of life):
8. JD drafting and criteria generation
9. Stale role detection
10. Contradiction detection across memories

---

## Build Order for Infrastructure

1. **Consistent proposal markup** — Dashed borders, Alt attribution, one-click confirm, 5s undo. Pure design system work. Unlocks every agentic feature after.
2. **Suggestions drawer** — The ambient surface container. Starts empty, fills as features ship.
3. **Activity log extension** — Extend Alt Activity tab to include agent actions (auto-decisions, memory extractions, threshold adjustments).
4. **Agent status indicator in nav** — Small dot showing agent autonomy level.
5. **Override tracking** — Log every time admin disagrees with Alt. Surface patterns as suggestions. This is the feedback loop that makes the Alt learn.

---

## The Deeper Pattern

Useful agent features cluster around three jobs:

1. **Synthesizing across history** — The agent sees all past decisions, interviews, memories at once. The founder can't. Every feature using the agent's memory of past data to inform a current decision is high-leverage.

2. **Drafting to compress review** — Writing the first version (JD, rejection email, interview question) so the founder reviews rather than creates. The creative act is harder than the editing act.

3. **Passive learning from external signals** — The agent reads what the founder writes elsewhere (Slack, email) and extracts implicit preferences. Turns the Alt from "a thing I configure" into "a thing that understands me."

Features outside these three jobs tend to be gimmicks or risks in disguise.
