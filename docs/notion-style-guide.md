# Notion-Style Visual System

A reference for the migration from the current Space Grotesk + Inter system to a Notion-faithful visual language. Built from analysis of 11 representative screens (sidebar, page editor, database table, modals, popovers, settings, comment selection, file upload, teamspace settings).

---

## 1. Foundation

### What makes Notion *feel* like Notion

1. **One typeface, weight does the work.** No display vs body family — the same font handles 32px page titles and 12px metadata. Hierarchy is created by size, weight, and color only.
2. **Restrained chrome, document-first.** Borders are nearly invisible. Cards are rare. The canvas reads as a piece of paper, not as a series of UI containers.
3. **Generous whitespace.** Content is constrained to ~720px wide with ~96px of top breathing room. List rows are shorter, tighter — but they sit in lots of empty space.
4. **Hover-reveal controls.** Block handles (`+` and `⋮⋮`) appear only on hover. Properties show "Empty" in muted italic until filled. Nothing competes for attention until you ask.
5. **Color used as accent, never as architecture.** The whole app is essentially black-on-white with one royal blue for primary CTAs. Status colors live only in pills and dots.

---

## 2. Typography

### Font stack

```css
--font-body: "Inter", "Notion Sans", -apple-system, BlinkMacSystemFont,
             "Segoe UI", "Helvetica Neue", Arial, sans-serif;
```

**Drop Space Grotesk entirely.** Notion uses one family across the whole product. Inter is the closest open-source match to Notion's custom Sans.

### Type scale

| Role            | Size / Line-height | Weight | Letter-spacing | Use                                     |
|-----------------|--------------------|--------|----------------|-----------------------------------------|
| Page title      | 32px / 40px        | 700    | -0.02em        | Document titles (Soft launching, Doc Hub) |
| H1 (in body)    | 24px / 32px        | 600    | -0.01em        | "Brand Identity", "Tone of Voice"       |
| H2              | 20px / 28px        | 600    | -0.01em        | Sub-section headings                    |
| H3              | 16px / 24px        | 600    | 0              | Tertiary headings, modal titles         |
| Body large      | 16px / 24px        | 400    | 0              | Default page body                       |
| Body            | 14px / 22px        | 400    | 0              | Sidebar items, table cells, properties  |
| Small / meta    | 12px / 18px        | 400    | 0              | Captions, timestamps, breadcrumb        |
| Tiny / button   | 13px / 18px        | 500    | 0              | Buttons, pills, sidebar nav             |

**No more `text-[10px]` micro-labels.** Notion's smallest text is 12px. Section labels use weight + position, not uppercase tracking.

### Heading default

```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-body); /* same family */
  letter-spacing: -0.01em;
  color: var(--text-primary);
}
```

Drop the `font-display` class everywhere. Headings are heavier, not different.

---

## 3. Color

Notion's palette has a slight warm cast — pure-cool grays read as harsh next to it.

### Core (light)

```css
--color-bg:              #FFFFFF;          /* main canvas */
--color-bg-sidebar:      #F7F6F3;          /* warm off-white */
--color-bg-hover:        rgba(55,53,47,0.06);
--color-bg-selected:     rgba(35,131,226,0.07);  /* faint blue tint */

--color-text-primary:    #37352F;          /* warm near-black */
--color-text-secondary:  rgba(55,53,47,0.65);
--color-text-tertiary:   rgba(55,53,47,0.45);
--color-text-placeholder:rgba(55,53,47,0.30);

--color-border:          rgba(55,53,47,0.09);  /* nearly invisible */
--color-border-strong:   rgba(55,53,47,0.16);  /* table cells, inputs */

--color-accent:          #2383E2;          /* royal blue, primary CTA */
--color-accent-hover:    #1A73D9;
--color-link:            #2383E2;
```

### Status pills (subtle pastel + dark text)

```css
--status-default-bg:     rgba(55,53,47,0.08);   --status-default-fg:   #37352F;
--status-progress-bg:    #FBF3DB;               --status-progress-fg:  #886A19;  /* yellow */
--status-success-bg:     #DDEDEA;               --status-success-fg:   #1B6855;  /* green */
--status-danger-bg:      #FBE4E4;               --status-danger-fg:    #B12C24;  /* red */
--status-info-bg:        #DBEDF8;               --status-info-fg:      #1366A0;  /* blue */
--status-purple-bg:      #EAE4F2;               --status-purple-fg:    #5A4778;
--status-pink-bg:        #F5E0E9;               --status-pink-fg:      #99425D;
--status-brown-bg:       #E9E5E3;               --status-brown-fg:     #64473A;
```

Pills are background-tinted, text uses the saturated dark variant.

### Dark mode

```css
--color-bg:              #191919;
--color-bg-sidebar:      #202020;
--color-bg-hover:        rgba(255,255,255,0.05);
--color-text-primary:    rgba(255,255,255,0.90);
--color-text-secondary:  rgba(255,255,255,0.55);
--color-border:          rgba(255,255,255,0.08);
```

---

## 4. Spacing

### Page-level

| Token           | Value      | Use                                       |
|-----------------|------------|-------------------------------------------|
| Page width      | 720px      | Default content max-width                 |
| Page width wide | 1024px     | Tables, full-width pages                  |
| Page top pad    | 96px       | Space above page title                    |
| Page side pad   | 96px       | Default left/right gutter                 |
| Sidebar width   | 240px      | Default                                   |
| Sidebar width collapsed | 56px | Icon-only                                 |

### Block-level

| Token              | Value | Use                              |
|--------------------|-------|----------------------------------|
| Block vertical pad | 4px   | Gap between consecutive blocks   |
| Block hover pad    | 2px   | Inset hover bg vs. block content |
| List indent        | 24px  | Per nesting level in sidebar     |
| Property row height| 28px  | Database property rows           |
| Sidebar item height| 28px  | Sidebar nav items                |
| Modal padding      | 32px  | Default modal content padding    |
| Modal sm padding   | 20px  | Small modals (confirm, login)    |

Use a **4px base grid** (4, 8, 12, 16, 20, 24, 32, 48, 64, 96).

---

## 5. Shape & elevation

| Token             | Value             | Use                                |
|-------------------|-------------------|------------------------------------|
| Radius xs         | 3px               | Pills, status badges, code         |
| Radius sm         | 4px               | Buttons, inputs, popover items     |
| Radius md         | 6px               | Cards, popovers                    |
| Radius lg         | 10px              | Modals, large overlays             |
| Shadow popover    | `0 1px 4px rgba(15,15,15,0.05), 0 4px 12px rgba(15,15,15,0.10)` | Dropdowns, hover menus |
| Shadow modal      | `0 8px 32px rgba(15,15,15,0.14)` | Dialogs, sheets |
| Shadow tooltip    | `0 1px 2px rgba(15,15,15,0.16)` | Inline tooltips |

No `rounded-xl` or `rounded-2xl`. Notion never goes above ~10px radius.

---

## 6. Components

### 6.1 Sidebar

Width **240px**, `bg-sidebar`, no border on the right (just bg color shift).

- **Workspace switcher** (top): `Avatar 16px` + workspace name (text-sm medium) + chevron + new-page icon — total height 36px
- **Search row**: icon + "Search" placeholder, height 28px, hover bg
- **Top-level items** (Home, Inbox): icon + label, text-sm, height 28px
- **Section header** (`Private`, `Favorites`, `Teamspaces`, `Shared`): text-xs (12px), `text-tertiary`, weight 400, **NOT uppercase**, padding-left 14px, height 24px
- **Page item**: chevron-right (12px, only visible on hover) + icon (16px) + title (text-sm, truncate), height 28px, padding-left 14px
- **Nested page**: indent 16px per level, vertical guide line (1px, `border` color)
- **Add new** (under section): "+ Add new" — `text-tertiary` text-sm, hover → `text-primary`
- **Bottom row**: Settings, Templates, Trash — same as top-level items
- **Footer**: Invite members + plan upgrade icons

**Hover state**: `bg-hover` (the warm semi-transparent gray)
**Active state**: `bg-selected` (faint blue tint), text color stays the same

### 6.2 Page header

Almost nothing — just a thin top bar:

- **Left**: Breadcrumb (workspace → parent → current, text-sm) + privacy badge ("🔒 Private")
- **Right**: "Edited Xm ago" (text-xs, `text-tertiary`) · `Share` (text button) · Comment icon · Star icon · `⋯` menu
- Height: 44px, no border, padding 8px 12px
- Page-level cover image (optional) sits below this bar before the title

### 6.3 Page title

```tsx
<h1 className="text-[32px] font-bold tracking-[-0.02em] leading-[40px] mb-2">
  {title}
</h1>
```

Sits ~96px from top, centered in 720px max-width column. No subtitle by default. Allow icon (24px emoji) directly to the left.

### 6.4 Block hover controls

Every block has:
```
[ + ] [ ⋮⋮ ]   The actual block content
```

- `+`: 16x16 plus icon, opens block-add menu
- `⋮⋮`: 16x16 grab handle, opens block-options menu, drag-to-reorder
- Both **only visible on block hover**, positioned in the left margin (-32px from block edge)
- Color: `text-tertiary`, hover: `text-secondary`

### 6.5 Selection toolbar (text-selection floating pill)

When text is selected:
```
[ Explain ] [ 💬 ] [ ✏️ ] [ Comment ] [ ✦ ] [ B ] [ I ] [ U ] [ S ] [ ↗ ] [ Aa ] [ A ] [ ⋯ ]
```

Floats above selection, `bg-bg`, `shadow-popover`, `rounded-md`, padding `4px 8px`, height 32px. Each item is 24x24, hover bg.

### 6.6 Buttons

| Variant   | Style                                                                                  |
|-----------|----------------------------------------------------------------------------------------|
| Primary   | `bg-accent text-white text-sm font-medium px-3 py-1.5 rounded-sm hover:bg-accent-hover` |
| Secondary | `text-primary text-sm font-medium px-3 py-1.5 rounded-sm hover:bg-hover`               |
| Ghost     | `text-secondary text-sm hover:text-primary hover:bg-hover px-2 py-1 rounded-sm`        |
| Icon      | `w-7 h-7 flex items-center justify-center rounded-sm hover:bg-hover text-secondary`    |
| Danger    | `text-status-danger-fg text-sm hover:bg-status-danger-bg px-3 py-1.5 rounded-sm`       |

**Drop `rounded-full` pills entirely.** Notion never uses fully-rounded buttons. All buttons are `rounded-sm` (4px).

### 6.7 Popovers / dropdowns

- `bg-bg`, `rounded-md`, `shadow-popover`, no border
- Internal padding: 6px (top/bottom), 0 (sides)
- Item: 28px height, padding `4px 12px`, text-sm, `gap-2`
- Item hover: `bg-hover`
- Item with icon: 16px icon + label + (optional shortcut on right in `text-tertiary`)
- Section header inside popover: text-xs (12px), `text-tertiary`, padding `4px 12px`, no uppercase
- Divider: 1px `border` color, margin `4px 0`

### 6.8 Modal / dialog

- `bg-bg`, `rounded-lg` (10px), `shadow-modal`
- Padding: 32px (default), 20px (compact)
- No header bar — title is just a heading inside
- Close: `×` icon top-right, 24x24, ghost
- Width: 480px (small), 720px (default), 960px (settings)
- Backdrop: `bg-foreground/30` with `backdrop-blur-sm`

### 6.9 Property rows (database)

Used in row-detail modals and inline:

```
[icon] Property name (gray)        [value (black)]
```

- Row height 28px
- Icon: 16px, `text-tertiary`
- Property label: 110-140px wide, text-sm, `text-secondary`
- Value: text-sm, `text-primary`, or "Empty" placeholder in `text-placeholder`
- Hover: `bg-hover` on the whole row
- "+ Add a property" at the bottom: `text-tertiary` text-sm, hover → `text-primary`

### 6.10 Status pills

```tsx
<span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm bg-status-progress-bg text-status-progress-fg text-xs font-normal">
  <span className="w-2 h-2 rounded-full bg-status-progress-fg/40" />
  In progress
</span>
```

- Always `rounded-sm` (3-4px), **never `rounded-full`**
- Optional leading status dot (8x8, slightly desaturated)
- Padding tight: `px-1.5 py-0.5`
- text-xs, font-normal (not bold)

### 6.11 Database table

- Header row: 32px tall, text-xs, `text-tertiary`, with property type icon to the left of label
- Cell: 32px tall, text-sm, padding `6px 8px`
- Vertical column lines: `border-strong` (slightly heavier than block dividers)
- Horizontal row lines: `border` (very subtle)
- Hover row: `bg-hover` on entire row
- Cell editing: outline `2px accent`, no bg change
- Footer: "+ New" button (text-tertiary), property summary (sum/count) on right

### 6.12 Inputs

```tsx
<input className="w-full bg-transparent text-sm text-primary placeholder:text-placeholder
                  px-3 py-1.5 border border-border-strong rounded-sm
                  focus:border-accent focus:outline-none" />
```

Modal inputs sometimes have `bg-hover` and no border. Inline inputs (database cells) are completely chromeless until focused.

### 6.13 Comments

- Comment thread bubble: `bg-status-info-bg/40`, `rounded-md`, padding 8px 12px
- Comment author: text-sm font-medium
- Comment time: text-xs `text-tertiary`
- Inline highlight under commented text: 2px solid `#FFD43B` underline (yellow)
- Reply input: chromeless, "Add a comment…" placeholder

---

## 7. Distinctive Notion behaviors to adopt

These are interaction patterns, not just styling:

1. **Block hover handles** (`+` and `⋮⋮`) on the left margin of every content block
2. **"Empty" italic placeholder** for unfilled fields instead of empty cells
3. **Inline emoji icons** in headings and items (24px adjacent to title, 16px adjacent to body)
4. **Hover-reveal `+` next to section labels** for "add new"
5. **Floating selection toolbar** above selected text (formatting + AI actions)
6. **Slash menu** ( `/` ) for inserting blocks
7. **`@` mention popover** for people, pages, dates
8. **Inline `>` chevrons** on hover for expandable items
9. **Right-click context menu** on every block, identical to `⋮⋮` menu
10. **Inline icons next to property labels** (📅 calendar, 👤 person, 📋 select)

---

## 8. Tokens — Tailwind config delta

```js
// tailwind.config.js — updated extends
fontFamily: {
  sans: ["Inter", "ui-sans-serif", "-apple-system", "system-ui", "sans-serif"],
  // drop: display, pixel (keep pixel only if PixelSprite still needed)
},
colors: {
  // Replace HSL system with Notion's RGB/HSLA values from §3
  bg: "#FFFFFF",
  "bg-sidebar": "#F7F6F3",
  "bg-hover": "rgba(55,53,47,0.06)",
  "bg-selected": "rgba(35,131,226,0.07)",
  text: {
    DEFAULT: "#37352F",
    secondary: "rgba(55,53,47,0.65)",
    tertiary: "rgba(55,53,47,0.45)",
    placeholder: "rgba(55,53,47,0.30)",
  },
  border: {
    DEFAULT: "rgba(55,53,47,0.09)",
    strong: "rgba(55,53,47,0.16)",
  },
  accent: {
    DEFAULT: "#2383E2",
    hover: "#1A73D9",
  },
  // status palette as in §3
},
borderRadius: {
  none: "0",
  xs: "3px",
  sm: "4px",
  md: "6px",
  lg: "10px",
  // drop xl, 2xl, 3xl, full (keep full only for avatars/dots)
  full: "9999px",
},
boxShadow: {
  popover: "0 1px 4px rgba(15,15,15,0.05), 0 4px 12px rgba(15,15,15,0.10)",
  modal: "0 8px 32px rgba(15,15,15,0.14)",
  tooltip: "0 1px 2px rgba(15,15,15,0.16)",
}
```

---

## 9. Migration deltas (vs current style guide v2)

| Area              | v2 (current)                                           | Notion target                                |
|-------------------|--------------------------------------------------------|----------------------------------------------|
| Display font      | Space Grotesk                                          | Drop. Inter only.                            |
| Heading family    | `font-display` class                                   | Same as body, weight+size only               |
| Page titles       | `text-2xl/3xl semibold`                                | `text-[32px] font-bold tracking-[-0.02em]`   |
| Section labels    | `text-[11px] uppercase tracking-[0.08em] semibold`     | `text-xs text-tertiary` (no uppercase)       |
| Buttons           | `rounded-full` pills                                   | `rounded-sm` (4px)                           |
| Default card      | `rounded-xl` (12px) `border border-border bg-card p-5` | No card wrapper; document blocks on bg       |
| Page gutter       | `px-8 py-8`                                            | `px-24 pt-24` (96px), constrained 720px col  |
| Section gap       | `mb-10`                                                | `mb-8` between major content groups          |
| Color system      | HSL semantic tokens                                    | Warm hex/rgba tokens (slight cream cast)     |
| Sidebar bg        | Same as main bg                                        | `#F7F6F3` (distinct warm gray)               |
| Borders           | Visible `border-border`                                | Nearly invisible `rgba(55,53,47,0.09)`       |

---

## 10. Application order (suggested)

1. **Foundation reset** — replace tokens (`index.css`, `tailwind.config.js`), drop Space Grotesk import, set body to Inter, update HSL → warm hex palette
2. **Sidebar refit** — App.tsx sidebar to 240px warm-bg, drop pill-shaped active state for soft-blue tint, section headers go from uppercase to title-case muted
3. **ChatPage** — most-used surface, biggest immediate impact: page header thinning, message bubbles becoming chromeless, slash-menu styling
4. **HomePage** — restructure as a Notion document: title at top, properties below, content blocks instead of cards
5. **Page editor pattern** — apply across RolesPage / AltsPage / OrgPage: thin breadcrumb header, large page title, content as document blocks
6. **Database tables** — CandidatesPage and embedded candidate lists become Notion-table-style (light header, hover rows, type icons)
7. **Modals & popovers** — adopt Notion's softer shadow + tighter padding; drop `rounded-xl` for `rounded-lg`
8. **Block hover controls** — last because it's invasive: add `+`/`⋮⋮` pattern on hover for content blocks (HomePage dilemma rows, AltsPage memory rows, etc.)

---

## 11. Verification

- Side-by-side spot check against the sampled Notion screens (sidebar, page editor, table, modal, popover)
- Build clean: `npx vite build` after each step
- Dark mode: confirm warm-cast equivalents render correctly
- Existing functionality unchanged: Cmd+K Sabu overlay, JD editor modal, 3D map toggle, agentic search

---

## Appendix: screens analyzed

| # | What it shows |
|---|---|
| 50, 65 | Page editor with body content + selection toolbar |
| 100 | Page with linked sub-pages |
| 130 | Image upload popover in body |
| 150 | Database table + icon picker popover |
| 175 | Database property edit menu (Status options) |
| 200 | Database table view |
| 250 | Row detail in modal (Soft launching) |
| 300 | Page title with Aa font picker, settings menu |
| 350 | Customize Document Hub modal |
| 400 | Settings → Account → Change email modal-on-modal |
| 450 | Teamspace settings modal |
