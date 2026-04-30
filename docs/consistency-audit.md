# Dashboard Consistency Audit + Fix Plan

A grep-driven audit of the current dashboard against the Notion-style guide ([notion-style-guide.md](notion-style-guide.md)). This is the punch list for getting the system to truly consistent.

---

## Summary of inconsistencies found

| Category               | Count of violations | Severity |
|------------------------|---------------------|----------|
| Arbitrary text sizes outside scale | 348 instances of `text-[Npx]` | High |
| `text-[10px]` and `text-[9px]` micro-text | 229 instances (under Notion's 12px floor) | High |
| `rounded-xl` / `rounded-2xl` (above guide max of `rounded-lg`) | 14 instances | Medium |
| `rounded-full` on non-avatar/dot elements (chips, switchers) | 5 instances | Medium |
| `uppercase tracking-*` (style-guide says drop) | 31 instances | Medium |
| Page top padding (4 different values across 6 pages) | `pt-12 / pt-16 / pt-20 / py-5` | Medium |
| Page max-width (3 different values) | `840px / 1080px / 3xl(768px)` | Low |
| Modal radii (mixed `rounded-2xl border-4` vs default) | 2 modal styles, 1 dialog default | Medium |
| Border thickness (mixed `border` and `border-4`) | 2 `border-4` modal callouts | Medium |
| Input styling (3 different patterns) | text-sm vs text-[10px] vs text-[11px] | Medium |
| `font-medium` vs `font-semibold` for same role | mixed usage on titles, labels | Low |

---

## 1. Typography inconsistencies

### 1.1 Arbitrary sizes outside the scale

The Notion-style guide defines **only** these sizes:

```
12px (small/meta) · 13px (UI/buttons) · 14px (body) · 16px (body large)
20px (H2) · 24px (H1) · 32px (page title) · 40px (display)
```

Current usage:

| Size | Instances | Status |
|------|-----------|--------|
| `text-[10px]` | **156** | ❌ Below 12px floor; needs migration to `text-xs` (12px) |
| `text-[9px]` | **73** | ❌ Way below floor; mostly status pill labels — bump to `text-[11px]` minimum or `text-xs` |
| `text-[11px]` | **66** | ⚠️ Allowed only for ALL CAPS labels in the *old* style guide; v2/Notion drops uppercase, so these should mostly become `text-xs` (12px) |
| `text-[8px]` | **19** | ❌ Smaller than browser default minimum; consolidate to `text-[11px]` |
| `text-[7px]` | **1** | ❌ Delete |
| `text-[13px]` | **24** | ✅ UI text — keep |
| `text-[15px]` | **15** | ✅ Body large variant — keep but document as a token |
| `text-[12px]` | **10** | ✅ Same as `text-xs` — switch to `text-xs` for consistency |
| `text-[28px]` | **1** | ❌ One-off in ChatPage greeting — should be `text-2xl` (24px) or `text-[32px]` page title |
| `text-[40px]` | **3** | ✅ Page title — keep, this is the page-title token |

**Fix**: codify the scale in Tailwind config as `text-display`, `text-h1`, `text-h2`, `text-body-lg`, `text-body`, `text-ui`, `text-small`, then bulk-replace arbitrary sizes.

### 1.2 Heading sizing inconsistency

| Page | Page title size | Status |
|------|-----------------|--------|
| HomePage | `text-[40px] font-bold` | ✅ matches Notion display |
| RolesPage (RoleDetail) | `text-[40px] font-bold` | ✅ updated |
| OrgPage | `text-3xl font-semibold` (30px) | ❌ inconsistent — should be `text-[40px] font-bold` |
| SettingsPage | `text-[40px] font-bold` | ✅ |
| AltsPage (AltDetail) | `text-2xl font-semibold` (24px) | ❌ should be `text-[40px] font-bold` |
| ChatPage | `text-[28px] font-bold` | ❌ should be `text-[40px] font-bold` for the welcome state |
| CandidatesPage | `text-2xl font-semibold` (24px) | ❌ should be `text-[40px] font-bold` |

**Fix**: pick `text-[40px] font-bold tracking-[-0.02em] leading-[48px]` as the single page-title token. Apply everywhere.

### 1.3 Section headings (mid-level)

Currently mixed:
- `text-[15px] font-semibold` (HomePage, AltsPage v2 update)
- `text-[13px] font-semibold` (some AltsPage, RolesPage)
- `text-base font-semibold` (some dialogs)
- `text-lg font-semibold` (some headings still)
- `text-sm font-medium` (Memories heading in AltsPage)

**Fix**: define **two** section heading tokens:
- `text-base font-semibold` (16px) — for in-page section heads ("Top memories", "Connected sources", "Role pipelines")
- `text-sm font-semibold` (14px) — for nested/inline section heads inside a section

Drop `text-lg`, `text-[15px]`, and `text-[13px] font-semibold` for section heads.

### 1.4 Lingering ALL CAPS labels (31 instances)

Style guide says drop them; remaining offenders:

- **ChatPage**: 8 instances of `text-[9px] uppercase tracking-widest` and `tracking-[0.15em]` for property-card sub-labels (Sources used, Eval criteria, Leniency, Assigned Alt, etc.)
- **RolesPage**: 7 instances in candidate profile card (TL;DR, Resume preview, Experience, Education, Source) and the JD editor's "PDF / MD / DOC" badges
- **CandidatesPage**: 6 instances for table column headers (Score, Candidate, Role, Alt, Status, Time) — *defensible* because they're table headers, but should be normalized to `text-xs text-muted-foreground` (lowercase, no tracking) per Notion style
- **SettingsPage**: 1 instance — section title (already updated to plain in some places, missed one)
- **OrgPage**: 1 instance for stat labels

**Fix**: convert to plain `text-xs text-muted-foreground` (no uppercase, no tracking). Where the visual hierarchy needs more weight, use `text-sm font-semibold text-foreground` instead.

---

## 2. Border-radius inconsistencies

### 2.1 Above-cap radii (Notion guide caps at `rounded-lg` = 10px)

- **`rounded-2xl`** (16px): 2 modals — `RolesPage:315` (JD editor) and `AltsPage:650` (memory modal)
- **`rounded-xl`** (12px): 12 instances:
  - `OrgPage:39` org logo badge — should be `rounded-md`
  - `SettingsPage:29` section card wrapper — should be `rounded-lg`
  - `AltsPage:986` add-memory input wrapper — should be `rounded-lg`
  - `AltsPage:1176` sprite card — `rounded-lg` ok, currently `rounded-xl`
  - `AltsPage:1273` explore-memories button — should be `rounded-lg`
  - `AltsPage:1405` disconnect confirmation modal — should be `rounded-lg`
  - `RolesPage:465` chat bubble — should be `rounded-md`

**Fix**: cap everything at `rounded-lg`. Modals get `rounded-lg`, large content blocks get `rounded-md`, small buttons/pills get `rounded-sm`.

### 2.2 `rounded-full` on non-circular elements

- **AltsPage:769, 787** — voice/tone preview chips: switch to `rounded-sm`
- **AltsPage:800** — segmented switcher: switch to `rounded-sm`
- **AltsPage:1099** — bottom 2D/3D toggle: keep `rounded-md` (segmented controls are OK with subtle radius)
- All progress bars (`h-1 rounded-full`) — keep, those are fine

**Fix**: switch chips and segmented controls to `rounded-sm` per Notion style. Progress bars stay `rounded-full`.

### 2.3 Card radius drift

Mixed across pages:
- `rounded-md` for inputs ✅
- `rounded-lg` for "containers" (CandidatesPage, OrgPage) — should be `rounded-md` for tables, `rounded-lg` only for modals
- `rounded-xl` for big cards — drop

**Fix**: enforce 4-tier system:
- Inputs / pills / small buttons → `rounded-sm` (4px)
- Cards / panels / segmented controls → `rounded-md` (6px)
- Modals / sheets / large overlays → `rounded-lg` (10px)
- Avatars / dots / progress bars → `rounded-full`

---

## 3. Modal / dialog inconsistencies

| Modal | Current style | Issue |
|-------|---------------|-------|
| AltsPage memory modal (line 650) | `border-4 border-border rounded-2xl shadow-2xl` | Heavy 4px border + 16px radius + 2xl shadow — none match Notion's soft `shadow-modal` + 10px radius |
| RolesPage JD editor (line 315) | `border-4 border-border rounded-2xl shadow-2xl` | Same as above |
| AltsPage disconnect confirmation (line 1405) | `border border-border rounded-xl shadow-xl p-5` | `rounded-xl` should be `rounded-lg`, `shadow-xl` should be `shadow-modal` |
| AltsPage talk-to-Alt dialog | `DialogContent` (Radix default) | OK, but uses default Radix radius — verify it matches `rounded-lg` |
| AltsPage configure sheet | `SheetContent` (Radix default) | OK |

**Fix**: define a single modal class set:
```
bg-card rounded-lg shadow-modal border border-border
```
No more `border-4`, no `rounded-2xl`, no `shadow-2xl`.

---

## 4. Button inconsistencies

After the Notion overhaul, buttons mostly use `rounded-sm` — but some legacy `rounded-md` and `rounded-lg` remain. Sample audit:

| Location | Current | Should be |
|----------|---------|-----------|
| HomePage dilemma actions | `rounded-sm` | ✅ |
| ChatPage send button | `rounded-lg px-3 py-2` | `rounded-sm px-3 py-1.5` |
| RolesPage chat send | `rounded-lg` | `rounded-sm` |
| AltsPage configure CTA | `rounded-md` | `rounded-sm` |
| Settings buttons | `rounded-md` | `rounded-sm` |
| CandidatesPage filter chips | `rounded-md` | `rounded-sm` |

**Fix**: migrate all `<button>` `rounded-*` to `rounded-sm` unless it's a circular icon button (`rounded-full`).

---

## 5. Page layout inconsistencies

### 5.1 Container widths

| Page | Container | Type |
|------|-----------|------|
| HomePage | `max-w-[840px]` | Document |
| RolesPage detail tabs (Job posting, Interview config) | `max-w-[840px]` | Document |
| RolesPage detail header | `max-w-[1080px]` | Wider for header tabs |
| OrgPage | `max-w-[840px]` | Document |
| SettingsPage | `max-w-[840px]` | Document |
| CandidatesPage | `max-w-[1080px]` | Wide for table |
| ChatPage | `max-w-3xl` (768px) | Conversation |
| AltsPage | No max-width (full split) | Two-column |

**Fix**: standardize on **two** width tokens:
- `max-w-[840px]` — all document-style pages (Home, Org, Settings, Roles tabs)
- `max-w-[1080px]` — table-heavy or wide-feature pages (Candidates, Roles header)
- `max-w-3xl` — chat conversations only (ChatPage)
- AltsPage stays its own beast (split layout)

Define as Tailwind tokens: `max-w-page` / `max-w-page-wide` / `max-w-conversation`.

### 5.2 Page top padding (vertical rhythm)

Currently 4 values across pages:

| Page | Top padding | Bottom padding |
|------|-------------|-----------------|
| HomePage | `pt-20` (80px) | `pb-32` |
| RolesPage tabs | `pt-16` (64px) | `pb-24` |
| RolesPage detail header | `pt-16` (64px) | `pb-0` |
| OrgPage | `pt-16` (64px) | `pb-24` |
| SettingsPage | `pt-16` (64px) | `pb-24` |
| CandidatesPage | `pt-12` (48px) | `pb-4` |
| ChatPage | `py-10` | `py-10` |

**Fix**: one canonical pair — `pt-16 pb-24` for all document pages (matches Notion's ~64px above title). HomePage drops from `pt-20` to `pt-16`. CandidatesPage bumps from `pt-12` to `pt-16`. ChatPage stays its own pattern.

### 5.3 Section gap

Currently 4 values:
- HomePage `mb-12` (48px)
- AltsPage right column `mb-10` (40px)
- OrgPage `gap-12` (48px)
- SettingsPage `gap-10` (40px)
- RolesPage `gap-10` (40px)

**Fix**: standardize on **`gap-12` / `mb-12`** (48px) for between-section spacing on document pages. Within sections, use `gap-3` (12px) for tight rows, `gap-6` (24px) for card grids.

---

## 6. Input inconsistencies

3 different input patterns exist:

| Pattern | Where | Issue |
|---------|-------|-------|
| `text-sm border border-border rounded-lg px-3 py-2` | ChatPage editing fields | `rounded-lg` too round; should be `rounded-sm` |
| `text-[11px] border border-border px-2 py-1.5` | RolesPage candidate filters | No radius (defaults to 0); too small text |
| `text-[10px] border border-border rounded-md px-2 py-1.5` | CandidatesPage filters | Below 12px floor |
| `text-xs border border-border rounded-md px-3 py-1.5` | CandidatesPage main search | OK |

**Fix**: define **one input class set**:
```
text-sm bg-background border border-border-strong rounded-sm
px-2.5 py-1.5 outline-none focus:border-accent placeholder:text-tertiary
```
Use everywhere. For chromeless inline edits (database cells), use `bg-transparent border-transparent hover:bg-muted focus:border-accent`.

---

## 7. Color usage drift

Current `--accent-blue` is correct (Notion royal blue), but some screens still use it for:
- "Sashank's Alt" eyebrow text (small caps style — should be `text-muted-foreground`)
- Dilemma callout border (correctly removed)
- Icon accents in CandidatesPage and SettingsPage — sometimes used for non-primary purposes

**Fix**: reserve `accent-blue` for:
- Primary CTAs (`bg-accent-blue`)
- Active hyperlinks (`text-accent-blue` only on actual links)
- Selected database row tint (`bg-accent-blue/7`)
- Comment underline (`underline accent-blue`)

Drop everywhere else.

---

## 8. Component duplication

These patterns exist as inline classes but have NO shared component:

| Pattern | Instances | Fix |
|---------|-----------|-----|
| Status pill (bg + dot + label) | ~20 instances | Extract `<StatusPill status="success|warning|danger|info">` |
| Section heading (16px semibold + optional CTA) | ~12 instances | Extract `<SectionHeading title cta? />` |
| Property row (icon + label + value) | ~8 instances | Extract `<PropertyRow icon label>{value}</PropertyRow>` |
| Empty state (icon + text + CTA) | ~6 instances | Extract `<EmptyState icon title body cta? />` |
| Notion-style breadcrumb header | 2 inline copies (HomePage, RolesPage) | Extract `<PageHeader breadcrumb actions? />` |
| Page title block (icon + h1 + subtitle) | 4 inline copies | Extract `<PageTitle icon title subtitle? />` |

**Fix**: create `src/components/notion/` with these 6 components. Migrate inline usages over the next pass.

---

## 9. Token consolidation needed

### 9.1 Add to `src/index.css`

```css
:root {
  /* Type tokens — codify the scale */
  --text-display: 40px;
  --text-h1: 32px;
  --text-h2: 24px;
  --text-h3: 20px;
  --text-body-lg: 16px;
  --text-body: 14px;
  --text-ui: 13px;
  --text-small: 12px;

  /* Spacing tokens */
  --space-page-top: 64px;
  --space-page-bottom: 96px;
  --space-page-side: 48px;
  --space-section-gap: 48px;
  --space-row-gap: 12px;

  /* Container widths */
  --width-page: 840px;
  --width-page-wide: 1080px;
  --width-conversation: 768px;
}
```

### 9.2 Add to `tailwind.config.js`

```js
fontSize: {
  display: ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
  h1: ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
  h2: ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
  h3: ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
  "body-lg": ["16px", { lineHeight: "24px" }],
  body: ["14px", { lineHeight: "22px" }],
  ui: ["13px", { lineHeight: "18px" }],
  small: ["12px", { lineHeight: "18px" }],
},
maxWidth: {
  page: "840px",
  "page-wide": "1080px",
  conversation: "768px",
},
```

This lets us write `text-display`, `text-h1`, `text-body` instead of `text-[40px] font-bold tracking-[-0.02em] leading-[48px]`.

---

## 10. Fix plan (4 phases, ordered by ROI)

### Phase 1 — Token consolidation (highest ROI, lowest risk)
**Goal**: define the scale once so violations become visible.

1. Add font-size tokens to `tailwind.config.js` (`text-display`, `text-h1`, `text-body`, etc.)
2. Add `max-w-page` / `max-w-page-wide` / `max-w-conversation` width tokens
3. Add CSS custom props for spacing rhythm in `index.css`
4. Update `docs/notion-style-guide.md` to reference these tokens

**Estimated effort**: 1 commit, ~30 lines of config

### Phase 2 — Bulk migration (mechanical fixes)
**Goal**: collapse 348 arbitrary text-size violations + radius drift.

1. Find/replace `text-[10px]` → `text-xs` (156 instances) and `text-[9px]` → `text-[11px]` (73 instances)
2. Find/replace `text-[12px]` → `text-xs` (10 instances)
3. Find/replace `rounded-2xl` → `rounded-lg` and `rounded-xl` → `rounded-md` (14 instances)
4. Drop ALL CAPS labels in ChatPage property cards (8 instances) + RolesPage profile cards (7 instances) — convert to plain `text-xs text-muted-foreground`
5. Run build after each batch to catch regressions

**Estimated effort**: 4-5 commits, ~50 file edits, mostly mechanical

### Phase 3 — Page-title + layout normalization
**Goal**: every page has the same hero pattern.

1. Apply `text-[40px] font-bold` to AltsPage AltDetail name, OrgPage title, CandidatesPage title, ChatPage welcome
2. Standardize `pt-16 pb-24` page padding everywhere
3. Add Notion-style breadcrumb header to remaining pages (Org, Settings, Candidates, Alts) — currently only HomePage and RolesPage have it
4. Standardize `gap-12 / mb-12` between document sections

**Estimated effort**: 2-3 commits

### Phase 4 — Component extraction
**Goal**: kill copy-paste; future changes happen in one place.

1. Build `src/components/notion/PageHeader.tsx` (breadcrumb + actions row)
2. Build `src/components/notion/PageTitle.tsx` (icon + h1 + subtitle)
3. Build `src/components/notion/SectionHeading.tsx`
4. Build `src/components/notion/StatusPill.tsx`
5. Build `src/components/notion/PropertyRow.tsx`
6. Build `src/components/notion/EmptyState.tsx`
7. Migrate 5+ inline usages each to the new components

**Estimated effort**: 6-8 commits, +300 / -200 lines

### Phase 5 — Modal + popover refit
**Goal**: every overlay looks like Notion's.

1. Replace `border-4 rounded-2xl shadow-2xl` modal pattern with `border border-border rounded-lg shadow-modal`
2. Audit Radix `DialogContent` / `SheetContent` defaults — override theme classes if needed
3. Refit AltChatOverlay (Sabu Cmd+K) backdrop and z-index per Notion's lighter feel
4. Refit popovers (icon picker, status menu, slash menu) with new `shadow-popover` token

**Estimated effort**: 2-3 commits

### Phase 6 — Block hover handles (deferred)
**Goal**: the most-Notion-feeling interaction.

1. Build `<Block>` wrapper with hover-revealed `+` (add) and `⋮⋮` (drag) handles
2. Apply to HomePage dilemma rows, AltsPage memory rows, RolesPage criterion rows
3. Wire `+` to a stub block-add menu, `⋮⋮` to a stub options menu

**Estimated effort**: 3-4 commits, can land independently

---

## 11. Verification checklist

After Phase 1-3, every page should:

- [ ] Use `text-display` for the page title (no arbitrary px)
- [ ] Have `pt-16 pb-24` page padding
- [ ] Have a Notion breadcrumb header (44px tall, thin border-bottom)
- [ ] Use `max-w-page` or `max-w-page-wide`, never raw `max-w-5xl`
- [ ] Have section labels as plain `text-base font-semibold` (no uppercase)
- [ ] Use `rounded-sm` for buttons, `rounded-md` for cards, `rounded-lg` for modals
- [ ] Have status pills using a shared `<StatusPill>` component
- [ ] Have no `text-[10px]` or smaller anywhere

Run `npx vite build` after each phase to ensure no regressions.

---

## Quick wins (do today, < 30min each)

If you want to feel progress immediately, these single-file changes have high visual impact:

1. **OrgPage title** → bump from `text-3xl` to `text-[40px] font-bold tracking-[-0.02em]` (1-line change)
2. **AltsPage AltDetail title** → same fix (1-line change)
3. **CandidatesPage title** → same fix (1-line change)
4. **All 8 ChatPage property card labels** → strip `uppercase tracking-widest` (8 mechanical replacements)
5. **`rounded-2xl` modals** → switch to `rounded-lg` (2 instances, 2 lines)

Combined: ~15 lines of edits, 3 of the 7 pages instantly look more cohesive.
