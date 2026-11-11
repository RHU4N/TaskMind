---
name: Academic Intelligence
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8a4cfc'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001d31'
  on-tertiary-container: '#188ace'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.875rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.625rem
    letterSpacing: -0.01em
  title:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.01em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system serves undergraduate and graduate university students who balance dense course loads, research deadlines, and team projects. The visual narrative merges the rigor of Brazilian academic scholarship with the kinetic clarity of modern AI workflows.

The emotional goal is reduction of cognitive load: transforming panic, disorganized syllabi, and conflicting assignment dates into composure, clear sequencing, and proactive momentum. 

### Visual Philosophy
- **Style Blend:** Modern SaaS Minimalist with an Architectural Layering model. It pairs crisp white metric cards, deep navy navigational scaffolding, and focused electric-violet accents reserved strictly for AI-assisted synthesis, predictive scheduling, and automated task prioritization.
- **Academic Context:** Course tags, assessment rubrics, and status monitors rely on deliberate visual anchors. Interface density remains compact without feeling crowded, accommodating long Brazilian Portuguese academic titles (e.g., *Metodologia Científica e Pesquisa Aplicada*) cleanly across varied viewports.

## Colors

The palette uses a crisp, high-contrast light mode foundation paired with deep slate structures and an intentional semantic spectrum.

### Functional Roles & Spectrum
- **Primary (`#0F172A` / Slate 900):** Dictates structural chrome, primary navigation bars, headings, and high-emphasis states. Secondary deep slate (`#1E293B`) serves as the active baseline for sidebar groupings and strong buttons.
- **Secondary (`#7C3AED` / Electric Violet):** Reserved exclusively for generative and predictive actions: AI study plan synthesis, automated task breakdown, and cognitive workload analysis. Supported by `#6366F1` and `#8B5CF6` for interactive hover and focus rings.
- **Canvas & Surfaces:**
  - Base Application Canvas: `#F8FAFC`
  - Sub-structural Canvas / Section Insets: `#F1F5F9`
  - Primary Surface Containers (Cards, Modals, Popovers): `#FFFFFF`
  - Border Strokes & Subtle Dividers: `#E2E8F0`
- **Semantic Academic Feedback:**
  - **Concluído (Completed):** `#059669` (Emerald 600) on `#ECFDF5` background.
  - **Pendente / Em Andamento (In Progress / Pending):** `#D97706` (Amber 600) on `#FFFBEB` background.
  - **Atrasado / Crítico (Overdue / Critical):** `#E11D48` (Rose 600) on `#FFE4E6` background.
  - **Sugestão de IA (AI Insights):** `#7C3AED` (Violet 600) on `#F5F3FF` background.

## Typography

The typography couples the structural clarity of Plus Jakarta Sans for titles and metrics with the high readability of Inter for body text, lists, and dense tables.

### Typesetting Rules
- **Headline Hierarchy:** Use Plus Jakarta Sans with tighter tracking (`-0.02em` to `-0.01em`) to maintain balance when rendering accented Brazilian Portuguese orthography (`ã`, `õ`, `é`, `ç`).
- **Data & Tables:** Body copy, timestamps, syllabus requirements, and metadata rely on Inter at regular (400) and medium (500) weights to prevent visual vibration during extended study sessions.
- **Labels & Micro-indicators:** Badges and metric markers utilize `label-sm` with slight positive tracking (`+0.01em`) and medium/semibold weight for rapid identification.

## Layout & Spacing

The layout uses a left-hand navigation dock paired with an adaptive fluid canvas designed to support both high-density multi-column kanban boards and focused single-column study timelines.

### Grid & Breakpoints
- **Desktop (≥ 1280px):** Fixed persistent sidebar (260px width), fluid main stage maxing out at 1600px with 12-column responsive layout, 24px (`1.5rem`) gutters, and 32px (`2rem`) page outer margin.
- **Tablet / Laptop (768px – 1279px):** Collapsed icon-only sidebar (72px width), fluid 8-column layout with 20px gutters, and 24px outer margins.
- **Mobile (< 768px):** Off-canvas bottom sheet or slide-over navigation drawer, single-column vertical stack, 16px (`1rem`) gutters, and 16px outer margin.

### Vertical Rhythm
Layouts scale strictly on a 4px/8px baseline grid:
- Card internal paddings use `space-lg` (`1.5rem`) for main summary cards, reducing to `space-md` (`1rem`) for dense list items and nested course units.
- Stacked module distance is governed by `space-xl` (`2rem`) to separate distinct academic categories.

## Elevation & Depth

This system avoids heavy, muddy drop shadows, utilizing low-contrast hairline borders combined with soft ambient light to communicate layer depth.

### Layering Hierarchy
1. **Level 0 (Base Canvas):** `#F8FAFC` flat canvas. Holds the global layout foundation.
2. **Level 1 (Card & Section Containers):** `#FFFFFF` background bound by a 1px solid border in `#E2E8F0`. Shadow is minimal: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
3. **Level 2 (Hover States, Interactive Cards, Dropdown Menus):** Lifted slightly with border `#CBD5E1` and ambient shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
4. **Level 3 (Modals, Overlays, Command Palette):** Sits high on the z-axis with border `#94A3B8` (40% opacity) and diffuse ambient shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.
5. **AI Glow (Contextual Focus):** Elements driven by automated AI recommendations feature a subtle dual ring instead of an intense shadow: `0 0 0 1px #8B5CF6, 0 1px 3px 0 rgba(124, 58, 237, 0.15)`.

## Shapes

The interface balances precision with modern softness:

- **Cards & Primary Modules:** Use `rounded-2xl` (1rem / 16px) to frame complex multi-task groupings and subject dashboards.
- **Buttons, Text Inputs, and Dropdowns:** Use `rounded-lg` (0.5rem / 8px) for crisp interactive edges that feel tactile and structured.
- **Status Badges, Course Tags, & Avatars:** Use full pill rounding (`rounded-full` / 9999px) to contrast against rectangular content cards and establish instant scannability.

## Components

### Buttons
- **Primary Action:** Solid `#0F172A` background, white label, `rounded-lg`, height 40px (`h-10`), padding `px-4`. Hover shifts to `#1E293B`.
- **AI Action:** Solid `#7C3AED` background with white label, paired with an icon prefix (e.g., sparkle). Hover shifts to `#6D28D9`. Focus introduces an electric violet offset ring (`ring-2 ring-violet-400`).
- **Secondary / Outline:** `#FFFFFF` background, 1px border `#E2E8F0`, `#0F172A` label. Hover shifts to `#F8FAFC` background with border `#CBD5E1`.
- **Ghost:** Transparent background, `#64748B` text. Hover shifts to `#F1F5F9` background and `#0F172A` text.

### Badges & Academic Tags
- **Status Badges (Pill Shape):** Height 24px (`h-6`), padding `px-2.5`, text `label-sm`.
  - *Concluído:* Emerald text `#047857`, emerald tint `#ECFDF5`, border `#A7F3D0`.
  - *Pendente:* Amber text `#B45309`, amber tint `#FFFBEB`, border `#FDE68A`.
  - *Atrasado:* Rose text `#BE123C`, rose tint `#FFE4E6`, border `#FECDD3`.
  - *IA Priorizado:* Violet text `#6D28D9`, violet tint `#F5F3FF`, border `#DDD6FE`.
- **Course Tags (Discipline Chips):** Monochromatic neutral background (`#F1F5F9`), text `#334155`, border 1px solid `#E2E8F0`, `rounded-md`. Prefixed with an accent dot for quick discipline color categorization (e.g., Blue for *Cálculo II*, Emerald for *Algoritmos*, Violet for *Inteligência Artificial*, Rose for *Ética e Direito*).

### Input Fields & Controls
- **Text Inputs:** Height 40px (`h-10`), background `#FFFFFF`, border 1px solid `#E2E8F0`, radius `rounded-lg`, typography `body-md`. Focus state uses border `#0F172A` with no harsh glow, or border `#7C3AED` if the input is an AI query prompt.
- **Checkboxes & Radios:** Size 18px by 18px. Unchecked uses 1.5px border `#CBD5E1`. Checked state transitions to solid `#0F172A` (or `#7C3AED` for automated task completions) with a crisp white check icon.

### Cards & Task Rows
- **Canvas Cards:** Background `#FFFFFF`, border 1px solid `#E2E8F0`, radius `rounded-2xl`, internal padding `space-lg` (`1.5rem`).
- **Task List Rows:** Interactive rows within cards. Height 52px, horizontal padding `space-md`, border-b 1px solid `#F1F5F9`. Hover state tints to `#F8FAFC`. Houses task status checkbox on the left, course badge and title centrally, and due date/priority indicator right-aligned.

### Navigation Dock (Sidebar)
- Background `#FFFFFF` (or deep contrast `#0F172A` depending on layout flavor; default system spec uses `#FFFFFF` with border-r `#E2E8F0`).
- Menu items utilize `rounded-lg` with `px-3 py-2.5`, transitioning from `#64748B` to `#0F172A` text and `#F1F5F9` background when active.