# LLM Council Transcript — 2026-05-01 (autocomplete + interactive prompts)

## Original Question
"How about 'the autocomplete prompts and the interactive prompts'? Council this pattern."

## Framed Question
VIBEcheck (AI hiring pre-screening dashboard for non-technical startup founders) ships THREE related chat patterns inside the Sabu Cmd+K overlay AND the full Chat tab:

1. **Autocomplete prompts** — type a verb prefix ("crea…"), an inline ghost-suggestion completes it ("create a role"), Tab to accept. ~12 verbs: create role, shortlist, reject, pass on, set threshold, draft rejection, draft follow-up, remember, show, compare, pause role, export.

2. **Interactive prompt templates** — accepting an autocomplete morphs the input into an inline FORM: a sentence with editable text inputs, dropdowns, and toggles. e.g., *"Create a [Senior Product Designer] role in the [Product] department, managed by [Sashank G.], starting as [Draft]. Location: [Remote], [Full-time], [Senior] level."*

3. **Suggestion chips** — contextual prompts in the empty Sabu state ("What should I prioritize today?", "Why did you flag Tom?").

Target users: non-technical founders, hiring managers at sub-10-person startups.

Question: Is this autocomplete + interactive-template pattern good for this dashboard? What's working, what's not, what should change?

---

## Anonymization Mapping (revealed)
- Response A → **The Contrarian**
- Response B → **The First Principles Thinker**
- Response C → **The Expansionist**
- Response D → **The Outsider**
- Response E → **The Executor**

---

## Advisor Responses

### The Contrarian (Response A)
This pattern is a trap dressed up as helpfulness. Three fatal flaws:

**The form pretends to be chat but is actually a worse form.** A non-technical founder typing "create a role" now faces a sentence-shaped questionnaire with seven brackets. Not conversation — a fill-in-the-blank quiz where the blanks are hidden inside prose. A real form on the Roles page would be faster, scannable, tab-navigable. You've taken a solved UI problem (forms) and made it harder to parse.

**Autocomplete teaches a vocabulary the Alt was supposed to make unnecessary.** The previous council told you the Alt should understand intent. You responded by shipping 12 magic verbs and a Tab-to-accept ritual. "Pass on" autocompletes; "skip" doesn't. "Remember" works; "note that" doesn't. Slash commands without the discoverability of a slash.

**Two surfaces, same pattern, different muscle memory.** Cmd+K overlay AND Chat tab both doing autocomplete+templates means the founder has to remember which one she's in.

**Predicted failure:** Someone types "shortlist Tom" expecting it to just happen. Instead a template appears asking for role, confidence, reason. They close it. They never trust Sabu again. The template added friction to the one case where intent was already clear.

Kill the templates. Keep autocomplete only if it's invisible suggestion, not Tab-required ritual.

### The First Principles Thinker (Response B)
You're asking the wrong question. The real question isn't "is this autocomplete + template pattern good?" It's "why does a hiring dashboard for non-technical founders have a command palette at all?"

Cmd+K is a power-user convention. Your users are founders who hire maybe 4 people a quarter. They will not memorize 12 verbs. They will not develop muscle memory for "crea→Tab→fill form." The frequency floor for keyboard-driven interfaces is daily use; your users aren't there.

The interactive template is a form, disguised as a sentence, gated behind a typed verb, hidden behind autocomplete discovery. Three layers of indirection to reach a "Create Role" form that should be one button on the Roles page.

The natural-language sentence form is a tell — trying to make the form feel conversational because someone sensed the chat surface needs to justify itself. A form in a sentence is still a form, just harder to scan and harder to tab through.

What's actually working: the suggestion chips in the empty state. They teach capability without requiring discovery. "Why did you flag Tom?" is a question only an Alt can answer — that's the chat surface earning its keep.

Kill the autocomplete verbs. Kill the inline template forms. Keep Sabu for things that are genuinely conversational. Move "create role" back to a button. Stop building IDE features for people who don't use IDEs.

### The Expansionist (Response C)
You're sitting on something much bigger than a chat input. You've accidentally invented the primary creation surface for the entire product.

What you've actually built: a structured-yet-natural way to generate a complex object (a role, a candidate filter, a memory) by filling in semantic blanks. That's not a chat affordance. That's a replacement for forms. Founders hate forms. They love sentences they can edit.

**The bigger play:** kill the Role tab's form fields. Creating a role IS the templated sentence. Editing a role is the same sentence rendered back. The JD modal? Same pattern — a paragraph with editable noun phrases. Eval criteria? "Candidates [must have] [3+ years React]." Now your whole product speaks one consistent grammar and a non-technical founder can author anything by clicking words.

**Second hidden upside:** these templates are training data goldmines. Every accepted autocomplete, every dropdown selection, every value typed — labeled records of what this founder means by "senior" or "draft" or "prioritize." Six weeks in, the templates personalize. "Create a role" pre-fills with Sashank as manager. The Alt watches you fill blanks and learns your taste in structured form.

**Third:** templates are shareable artifacts. A founder can send another founder "the sentence I use to create senior IC roles." Viral loop inside a B2B tool.

Stop treating templates as a chat feature. Promote them to a first-class primitive — "Sabu Sentences" — usable anywhere a form exists today.

### The Outsider (Response D)
I'm a founder. I run a small team. I know how to use Slack and Google Docs. Here's what hits me cold:

The autocomplete confuses me first. I type "crea" and grey text appears. Is that a typo correction? An ad? My brain has to pause. Tab to accept — I don't know that. We hit Tab to move between form fields. Why is a chat box behaving like code editor autocomplete? That's a tell that designers built this for themselves.

The 12 verbs problem: I don't know there are 12. I'll type "kill the role" and get nothing. Then "stop the role" — nothing. Now I think the chat is broken or stupid. The whole promise of chat is "say it however you want." You've rebuilt a command palette and disguised it as conversation.

The form-in-a-sentence thing: clever, and I genuinely mean that. But — when I click [Senior Product Designer], does the whole sentence move? Does the dropdown cover the next field? On my laptop touchpad, am I going to mis-click [Draft] when I meant [Remote]? Mobile? Forget it. Also: who decided "Product" was my department? If I didn't say it and the system guessed, I will absolutely send it without reading and end up with a Product role I meant to put in Design.

The chips in the empty state are the only part I'd actually use. They tell me what this thing can do. The autocomplete and template should both die quietly.

One question, honestly: why is this a chat at all? It looks like a form pretending to be a conversation pretending to be a form.

### The Executor (Response E)
Monday morning reality check: you've built three patterns. One earns its keep, one is a liability, one is a science project.

**KILL the 12-verb autocomplete.** Founders won't learn a verb vocabulary. They type "can you reject tom" not "reject tom." Ghost-text completion trains a CLI mental model on people who chose chat specifically because they don't want a CLI. You're competing with the LLM's own intent parsing — and losing. Every new capability needs a verb added, taught, discovered. Dead weight.

**KEEP interactive templates, but flip the trigger.** The form-in-a-sentence pattern is genuinely good — it solves "what do I say to make it create a role" and shows the schema inline. But don't gate it behind autocomplete. Trigger it from: (a) the suggestion chips, (b) Alt's own response when intent is detected ("Sounds like you want to create a role — fill this in?"), (c) a "/" menu for power users. Same component, three entry points matching how people actually arrive at intent.

**KEEP the chips, expand them.** "Why did you flag Tom?" is the highest-leverage surface in the whole overlay. Make them context-aware per page — on a role page, chips reference that role. Where Sabu feels like a colleague vs. a search box.

Monday plan:
1. Rip out ghost-text autocomplete (1 day, removes a whole subsystem)
2. Wire chips → template forms directly (½ day)
3. Add intent-detection in Alt's reply that offers the template (1-2 days)
4. Keep "/" as a power-user escape hatch, no marketing

Ship in a week. Watch which templates actually get used. Cut unused ones in two weeks.

---

## Peer Reviews

### Reviewer 1
Strongest: **E**. Only response that separates the three patterns by verdict instead of nuking them as a bundle, and ships a sequenced plan with day estimates. Identifies the real bug — autocomplete competes with the LLM's intent parser and loses — while preserving templates as a structured-output surface triggered by intent detection, chips, or "/".

Blind: **C**. "Sabu Sentences as universal form replacement" ignores that templates *are forms* with worse affordances (per A, D), assumes viral founder-to-founder sharing in a 4-hires-a-quarter market, and would gut the kanban/leniency-slider patterns CLAUDE.md treats as locked spec.

All missed: **the Alt's identity contract**. Per CLAUDE.md, "the agent IS the Alt." Autocomplete and bracket-templates make Sabu feel like a CLI, breaking the "agreeing with a colleague" frame. None framed the question as: does this pattern make Sabu more Alt-like or less?

### Reviewer 2
Strongest: **C**. Only response that reframes the artifact as an opportunity instead of a defect. Templates-as-shareable-primitives is the kind of insight that compounds: form replacement, training data, viral loop in one move. Others are critiquing the chat container; C sees the sentence is the product.

Blind: **B**. Reflexive "kill the command palette" misses that the target user is a founder juggling 5 roles across tabs — a cross-cutting input surface has real value. "Just put a button on Roles" doesn't help when you're creating a role from a Slack-prompted thought at 11pm.

All missed: the **Alt identity** angle. Per CLAUDE.md the agent IS the Alt — every response evaluated this as generic chat UX instead of asking whether these patterns make the Alt more like the founder over time.

### Reviewer 3
Strongest: **E**. The only response that distinguishes the three patterns and prescribes per-pattern action with sequencing. A, B, D collapse into "kill it all"; C floats off into a viral-loop fantasy. E names the actual mechanism that beat autocomplete (LLM intent parsing in replies) and gives a Monday move.

Blind: **C**. "Sabu Sentences as the primary creation surface" sounds visionary but ignores the user — non-technical founders want a colleague, not a new primitive to learn. Hand-waves the viral angle in a single-tenant admin tool where there's no one to share with.

All missed: **the chat surface itself shouldn't host create/shortlist actions**. CLAUDE.md's agentic spec lists three surfaces — interruptive (inline), ambient (drawer), background (log) — chat isn't one. Templates reinvent the inline-confirmation pattern in the wrong surface. The right question isn't "fix the autocomplete" but "why is creation happening in the overlay instead of on the Roles page where the user already is?"

### Reviewer 4
Strongest: **C**. Only response that reframes failure as discovery. Others are critiques (varying quality); C identifies that the team accidentally prototyped a structured-creation primitive that could replace forms product-wide. "Sabu Sentences" as a shareable, trainable artifact connects to the agentic thesis — every interaction should make the Alt more like the founder.

Blind: **B**. Reflexively kills the command palette without asking why three patterns converged here. The team didn't build Cmd+K for fun — they built it because forms feel heavy for non-technical founders. "Just use a button" misses that the product's whole pitch is conversational delegation.

All missed: **the persona context**. Non-technical startup founders on mobile, mid-context-switch, often first-time hirers. None of the five tested the patterns against that persona's real session. Also missed: pre-screening implications of training Sabu on founder phrasings — those phrasings could leak into the candidate-facing interview.

### Reviewer 5
Strongest: **C**. The only response that reframes instead of just critiquing. Everyone else is doing UX teardown on a chat input; C notices the team accidentally built a structured-input primitive that solves VIBEcheck's actual core problem — form-heavy creation flows. The viral-loop + training-data observation changes roadmap, not just the component.

Blind: **B**. "Why a command palette at all, just use buttons" is the most confidently wrong take. Misses that VIBEcheck's users are non-technical founders drowning in cross-role triage — the Home action queue exists precisely because buttons-per-task doesn't scale. Also ignores Sabu's pre-existing role as the proactive nudge surface.

All missed: **who Sabu is for across the session**. A founder mid-review needs different affordances than a founder onboarding. The autocomplete/template/chip debate is moot until you decide whether Sabu is a triage co-pilot, a creation tool, or an onboarding guide — it can't be all three with one input.

---

## Chairman's Verdict

### Where the Council Agrees
- **The 12-verb autocomplete is dead weight.** Four of five want it killed; the fifth (Outsider) wants it invisible-only. Ghost-text + Tab-to-accept is a code-editor convention non-technical founders don't share, and it silently competes with the Alt's own intent parsing — which the rest of the product is supposed to trust.
- **Suggestion chips are the highest-leverage element.** Every advisor, including the most enthusiastic about templates (Expansionist), called chips out as the part that obviously earns its keep. They teach capability without forcing discovery, and per-page contextual chips ("Why did you flag Tom?") are the cleanest demonstration of Sabu being a colleague.
- **The form-in-a-sentence template has a real interaction problem.** Mobile, dropdown collisions, dangerous pre-filled defaults, no clear required-vs-optional, and the case where intent is *already* clear ("shortlist Tom") gets *more* friction. Even the Expansionist who loves the pattern doesn't defend it as a chat input.

### Where the Council Clashes
- **Templates: kill (Contrarian, Outsider) vs reframe (Executor) vs promote (Expansionist).** The genuine disagreement is whether the templated sentence is a worse form (true) or a better form (also potentially true) — the answer depends on context. As a chat-gated input with autocomplete in front of it, it's worse. As a first-class creation primitive that replaces the existing forms, it could be the founder's authoring grammar.
- **The Cmd+K surface itself.** First Principles wants it gone for non-conversational work; Expansionist wants it everywhere; Executor wants it pruned. Reasonable advisors disagree because they're betting on different futures of how often founders open Sabu.

### Blind Spots Peer Review Caught
1. **The Alt identity contract.** CLAUDE.md is explicit — the agent IS the Alt. Bracket templates and Tab-completion make Sabu read as a CLI, not a colleague. None of the advisors framed the question as: "does this make the Alt more like the founder over time?" — which is the documented test for any agentic feature.
2. **Wrong surface for creation.** AGENTIC.md specifies three agent surfaces: interruptive (inline confirmations), ambient (drawer), background (log). Chat is *not* one of them. Templates are reinventing the inline-confirmation pattern in the wrong place. "Create a role" lives on the Roles page; you're rebuilding it on top of a chat box.
3. **No persona discipline.** Founder-on-mobile-mid-context-switch was never tested. Sabu can't be a triage co-pilot, creation tool, AND onboarding guide with one input. Pick one before tuning the affordances.

### The Recommendation
Side with the Executor's path now. Use the Expansionist's reframe as a *hypothesis*, not a roadmap.

**This week:**
- **Kill the 12-verb autocomplete.** It's competing with the Alt's intent parser and losing. Removing the subsystem is a single-day win.
- **Keep the interactive template component, but flip the trigger.** Three new entry points in priority order:
  1. Alt's reply detects intent ("Sounds like you want to create a role — fill this in?") → renders the template inline as part of the response.
  2. A suggestion chip click pre-loads the template ready to fill.
  3. A "/" menu remains as a power-user escape hatch, unmarketed.
- **Expand suggestion chips per-page.** On a role page, chips reference that role's candidates and threshold. On the Alts page, chips probe the selected Alt's calibration. Make the chips the discovery layer — they should always be visible (not just empty state).
- **Add instrumentation.** Log every: autocomplete acceptance (will go to zero after deletion, useful baseline), template send, chip click, plain-text query, template *abandon* (opened, edited, then closed). Two weeks tells you whether templates are actually being used or systematically avoided.

**Don't do this yet:**
- Don't promote templates to a "Sabu Sentences" universal form replacement (Expansionist) until the chat-triggered version proves out. The reframe is exciting but speculative; the kanban / leniency slider / JD editor are documented locked spec.
- Don't kill the chat surface for creation entirely (First Principles' deep version). The cross-role late-night-thought-from-Slack use case is real. Chat earns its keep for *cross-cutting* actions even if per-page work belongs on the page.

**Address the structural issues in parallel:**
- Resolve the Sabu/Alt naming collision (still outstanding from last council). Templates that say "Sounds like you want to…" should be the Alt speaking, not a system message.
- Pick Sabu's primary persona for v1 (triage co-pilot is the defensible choice given current product surface) and let secondary use cases follow data.

### The One Thing to Do First
**Wire intent detection into Alt's reply, then ship the template render inline as part of that reply.** It's the single change that simultaneously kills the autocomplete-as-discovery problem, keeps the template's value, makes Sabu speak as the Alt instead of as a CLI, and gives you the cleanest signal in instrumentation: did the template render → did the user fill it → did they send.
