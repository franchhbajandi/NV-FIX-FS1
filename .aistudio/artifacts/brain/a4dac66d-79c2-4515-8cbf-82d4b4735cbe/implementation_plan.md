# Phase A & Episode 03 — Revised Implementation Plan

Delivers the complete **Phase A** Field Study 1 portfolio experience—including the top navigation bar, interactive chalk-dust hero, Act I–II foundations, Episode 02 (`The Learner's Environment`), Episode 03 (`Learner Behavior and Motivation`), Act IV appendices, the `/print` A4 edition, and the automated PDF & content verification pipelines—while incorporating all seven architectural revisions.

## User Review & Confirmed Revisions

> [!IMPORTANT]
> All seven revisions from your review are locked into this plan and will be enforced across the adapter, UI components, print edition, and `verify-content` script:

1. **NA Facility Rows & `data-verify-status`**:
   - For `status: "NA"` rows, `"Not available"` renders as **real visible text inside the Status cell** (and `"Available"` for `status: "A"`), derived directly from `row.status` (never `aria-hidden`).
   - The Status cell carries `data-verify-id="${facId}-status"` and `data-verify-status={row.status}`, which `verify-content` validates against the source JSON `"A"` / `"NA"` value.
   - The **Description cell** for empty `NA` rows stays genuinely empty (`""`) and verified via `data-verify-id="${facId}-description"` without any synthetic placeholder text.
2. **Global `_` Prefix & `statusKey` Filtering at Any Depth**:
   - Both the zero-copy intake adapter and `verify-content` recursively ignore every object key starting with `_` (`key.startsWith('_')`, e.g., `_note`, `_omitted`, `_changes`, `_comment`) as well as `statusKey` (`key === 'statusKey'`) at **any depth** across all content JSON files.
3. **Interactive Isometric Campus Map (Design-System Spec)**:
   - **Lit Isometric Blocks for `status: "A"`**: Clicking/selecting any available block opens an adjacent **Index Card inspector** displaying that facility's verbatim description and inline `AutoPhotoFrame` photos.
   - **Dashed Ghost Outlines for `status: "NA"`**: Unavailable facilities render as translucent isometric wireframe footprints (`stroke-dasharray`) with their facility label and `"Not available"` status.
   - **Available / Not Available Filter Toggle**: Interactive filter controls (`All`, `Available`, `Not available`) highlight or filter matching campus blocks and table rows.
   - **Data-Computed Counts**: Total, Available (`A`), and Not available (`NA`) counts are computed dynamically from `schoolFacilities.rows` (never hardcoded).
   - **Scroll-Triggered Block Assembly**: Isometric campus blocks assemble on scroll via `IntersectionObserver` with staggered vertical drop-in transitions (automatically respecting `prefers-reduced-motion`).
4. **Stamps Exclusively on the Psychosocial Checklist**:
   - Red-pen stamps are used **only** on the Psychosocial Environment Checklist: check icon + `OBSERVED` for `observed: true`, and red X icon + `Not observed` for `observed: false`, paired with visually hidden (`sr-only`) text carrying `data-verify-id` and `data-verify-observed`.
   - **Zero stamps on facility rows or section headers**: All `StampBadge` accents are removed from school facilities rows, campus map headers, and classroom matrix headers.
5. **Electric Editorial Filmstrip (No 35mm / Archival Skeuomorphism)**:
   - Strips out all 35mm sprocket holes, fake frame numbers (`FRAME 01A`), and film stock labels (`KODAK 400TX`).
   - Uses clean **Electric Editorial** framing (`2px solid var(--color-ink)`, hard offset shadows, crisp geometric/monospace captions) with interactive **Duotone / Halftone / Original** visual treatment controls.
   - Native horizontal touch/trackpad swipe using CSS `scroll-snap-type: x mandatory` (`snap-x snap-mandatory`), full keyboard accessibility (`tabIndex={0}`, `ArrowLeft` / `ArrowRight` scrolling, and accessible Previous/Next buttons), rendering **only** `role: "mood"` photos.
6. **Path/Index-Based Status Registry Keys (Zero Source File `id` Mutation)**:
   - Source JSON files (`episode-02.json`, `episode-03.json`, `front-matter.json`, `biography.json`, `philosophy.json`, `institutional.json`, `appendices.json`, `photo-manifest.json`) are never modified to add `id` fields.
   - Status registry keys and `data-verify-id` attributes are resolved deterministically from item paths and array indexes (e.g., `ep-02.schoolFacilities.rows[0]`, `ep-03.activity2.teacherInterview.practicesTable.rows[3]`).
7. **Phase A Complete Scope & Hold-for-Review Deliverable Gate**:
   - Confirms Phase A includes:
     - **Top Bar & Mobile Bottom Bar**: Episode jump bar, TOC drawer trigger, `Ctrl/Cmd+K` search dialog, and `/print` edition switcher.
     - **Chalk-Dust Hero (`HeroChalkboard`)**: Interactive HTML5 Canvas chalk-dust particle field + editorial title lockup and key metrics.
     - **Episode 02 (`The Learner's Environment`) & Episode 03 (`Learner Behavior and Motivation`)**: Full zero-copy intake, plum accent theming for Episode 03, 2×2 learner code cards (`A1`, `A2`, `H1`, `H2`), and attributed resource-teacher interview quotes.
     - **Print Edition (`/print`) & PDF Pipeline (`export-pdf`)**: Synchronized A4 print layout with all expanders open, `PENDING` items omitted, and Playwright PDF generation.
   - **Hold Gate**: Upon completing Phase A code and verification, execution will hold and report: (a) rendered verification screenshots, (b) production bundle size report, and (c) the complete `verify-content` pass report, before building the Episode 03 particle set piece.

---

## 1. Overview & Core Concept

- **What It Does**: Delivers the complete Phase A Field Study 1 digital and print portfolio, integrating both Episode 02 (`The Learner's Environment`) and Episode 03 (`Learner Behavior and Motivation`) through a zero-copy content intake adapter with automated build-time verification.
- **Target Audience / Persona**: Cooperating teachers, Bicol University College of Education evaluators, and portfolio reviewers examining classroom observations, campus facility audits, learner diversity profiles, and resource-teacher interviews.
- **Key Value**: Combines expressive **Electric Editorial** visual storytelling (interactive isometric campus map, seating-chart matrix, scroll-snap duotone/halftone filmstrip, chalk-dust hero) with strict academic integrity (100% verbatim text fidelity, zero invented learner names, automatic `PENDING` suppression in production/print, and automated DOM verification).

---

## 2. User Experience & Visual Design

### Phase A Global Experience
1. **Top Navigation Bar & Quick Jump**: Fixed editorial top bar with direct jump links to Act I, Act II, Episode 02, Episode 03, Act IV, Quick Search (`Ctrl/Cmd+K`), Table of Contents drawer, and the `/print` A4 Print Edition.
2. **Chalk-Dust Hero (`HeroChalkboard`)**: Dark slate chalkboard canvas (`--color-chalkboard: #141C19`) with pointer-reactive chalk particles (`prefers-reduced-motion` safe), institutional kicker, portfolio title, and dynamic completion metrics.

### Episode 02 — The Learner's Environment (Cobalt Accent)
1. **Isometric Campus Map & School Facilities Audit**:
   - **Data-Computed Summary Strip**: Computes `Total facilities (22)`, `Available (15)`, and `Not available (7)` directly from `schoolFacilities.rows`, paired with an interactive `All` / `Available` / `Not available` segmented filter toggle.
   - **Scroll-Assembled Isometric Map**: SVG isometric architectural blocks that assemble into position when scrolled into view. `status: "A"` blocks render as lit 3D volumes (`--color-cobalt`, `--color-forest`, `--color-highlighter`); `status: "NA"` blocks render as dashed ghost wireframe outlines.
   - **Interactive Index-Card Inspector**: Selecting any lit `"A"` block on the map opens an index card beside the map showing the facility's verbatim description and inline `AutoPhotoFrame` photographs (`ep02-img01` through `ep02-img07`), plus a jump link to its table row.
   - **Facilities Table (No Stamps)**: Renders all 22 rows. The Status cell displays visible text `"Available"` (`status: "A"`) or `"Not available"` (`status: "NA"`) with `data-verify-id="${facId}-status"` and `data-verify-status={fac.status}`. Empty `NA` description cells remain empty (`""`) with `data-verify-id="${facId}-description"`.
2. **Classroom Observation & Seating-Chart Grid**:
   - Renders `classroomQuestions` (5 questions) via `AnswerBlock`.
   - Renders `classroomMatrix` (8 rows) as an architectural seating-chart grid with each row's photos (`ep02-img08` through `ep02-img13`) alongside; rows without photos expand cleanly across the description columns.
3. **Reflections & Personal Illustration**:
   - Renders `reflectSchool` (3 questions) and `personalIllustration` (`ep02-illustration` framed index card with verbatim format and caption).
4. **Electric Editorial Mood Filmstrip**:
   - Renders **only** `role: "mood"` photos (`ep02-img14` through `ep02-img18`) in a horizontal CSS `scroll-snap` strip (`snap-x snap-mandatory`) with keyboard navigation (`ArrowLeft` / `ArrowRight`) and Duotone / Halftone / Original toggle—zero 35mm perforations or skeuomorphic clutter.
5. **Psychosocial Environment Checklist (Exclusive Stamp Usage)**:
   - Renders all 11 psychosocial items with red-pen stamps (`✓ OBSERVED` for `true`, `✕ Not observed` for `false`) and visually hidden `sr-only` verification nodes (`data-verify-observed`), followed by `psychosocialReflect` (3 questions).

### Episode 03 — Learner Behavior and Motivation (Plum Accent)
1. **Plum Opener Header (`surface-episode-03`)**:
   - Displays `03`, `Learner Behavior and Motivation`, and delivered metadata (`school`, `sectionsObserved`, `resourceTeacher`) without an empty right-hand sticky note container.
2. **Activity 1 — Observing Learner Behavior and Motivation**:
   - Verbatim heading `Activity 1 — Observing Learner Behavior and Motivation`.
   - `Learners observed` (`Grade 8 — Hooke`) rendered as a 2×2 index-card grid for learner codes `A1`, `A2`, `H1`, and `H2`. Displays `age` and `gender` only when present in the JSON (`A2`, `H1`) and omits them when absent (`A1`, `H2`).
   - `Interview Guide to the Learners` (8 questions) rendered via `AnswerBlock` (`prose` vs `expander`, with Q4 pull-quote).
   - `Answer the following question:` (3-paragraph home environment synthesis with pull-quote).
3. **Activity 2 — Teacher-guided activities/practices**:
   - Verbatim heading `Activity 2 — Teacher-guided activities/practices that address learners' gender, needs, strengths, interests, and experiences` and `(Individual Activity)`.
   - `Class Observation` and `An Observation Guide for the Learners' Behavior and Motivation` (7 observation questions).
   - `Interview with a Teacher`: Displays the delivered profile card (`Herson N. Alamo, Teacher VI`, `Legazpi City Science High School`, `English 8`, `October 12, 2026`), followed by `Part 1 — Principles & Practices on Learner Behavior and Motivation` (Q1–Q3) and `Part 2 — Impact of Individual Differences` (Q4–Q6) rendered as **attributed quote `AnswerBlock`s** (`attribution: "full"`).
   - `Teacher-guided practices`: Verbatim title, instruction, and 2-column table. Row 4 (`4. Responding to learners' emotional needs.`, `"status": "PENDING"`) is automatically hidden in production, `/print`, and `VERIFY_HIDE_PENDING=true` runs.
   - `Answer the following questions:` (3 closing questions with pull-quotes).

---

## 3. Technical Architecture & Verification Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Delivered Source JSON Files (Untouched)                  │
│  • episode-02.json (cobalt)          • episode-03.json (plum)              │
│  • status.json (path/index keys)     • photo-manifest.json (role: mood)    │
└──────────────────────────────────────┬─────────────────────────────────────┘
                                       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     Zero-Copy Content Intake Adapter                       │
│  • unwrapDeliveredEpisode(raw) — zero reshaping, zero id injection         │
│  • isIgnoredKey(k): k.startsWith('_') || k === 'statusKey' (any depth)     │
│  • Path/index status resolution: e.g. ep-03...practicesTable.rows[3]       │
└──────────────────┬───────────────────┴──────────────────┬──────────────────┘
                   ▼                                      ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────────┐
│ Digital Portfolio + /print Edition  │  │ Build & Verification Pipeline     │
│ • HeroChalkboard + TopBar           │  │ • verify-content (Digital + Print)│
│ • Ep 02: Isometric Campus Map,      │  │   - data-verify-status check      │
│   Seating Grid, Editorial Filmstrip,│  │   - data-verify-observed check    │
│   Psychosocial Red-Pen Stamps       │  │   - Paragraph (\n\n) & Pullquotes │
│ • Ep 03: Learner Cards (A1,A2,H1,H2)│  │   - PENDING leak check (0 leaks)  │
│   Attributed Teacher Quotes, Table  │  │ • Vite build + Playwright PDF     │
└─────────────────────────────────────┘  └───────────────────────────────────┘
```

### Verification & Hold-for-Review Checklist
1. **`verify-content` Full Pass**: Verifies 100% of non-pending strings, paragraph breaks (`\n\n`), pull-quote substrings, `data-verify-status` (`A` / `NA`), and `data-verify-observed` (`true` / `false`) across both Digital and `/print` editions, plus 0 `PENDING` leaks (confirming Episode 03 practice row 4 is hidden).
2. **Production Bundle & PDF Pipeline**: Runs `npm run build` to capture exact bundle size metrics and verifies `/print` layout readiness.
3. **Visual Inspection Screenshots**: Captures verification screenshots of the Top Bar + Chalk-Dust Hero, Episode 02 Isometric Campus Map + Filmstrip + Psychosocial Stamps, Episode 03 Plum Opener + Learner Cards + Attributed Teacher Interview + Practices Table, and `/print` Edition for your review before starting the Episode 03 particle set piece.
