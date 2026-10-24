# Production Image Resolution & Cloud Build Fix ("The Observer's Edition")

Fixes broken photographic, brand emblem, and appendix image loading when deploying the repository to Netlify or Vercel by eliminating a runtime-false `typeof import.meta.glob` check, mirroring static fallback assets into the public directory, and hardening the CI build pipeline against missing system binaries.

## User Review & Critical Decisions

> [!IMPORTANT]
> Your Phase 1 answers have been locked into this plan:
> - **Confirmed Decision 1 (Deployment Workflow)**: Optimizing for Git repository or repo-zip automated builds on **Netlify and Vercel** (`npm run build` producing `dist/`).
> - **Confirmed Decision 2 (Dual-Layer Asset Resolution)**: Fixing Vite's compile-time `import.meta.glob` bundling across all components **and** syncing static copies into the public asset directory so every image has both a hashed Vite bundle URL and a direct static fallback URL.

- **CI Build Resilience (Default Included)**: The pre-build duotone generator (`tint-photos`) currently calls the system `convert` (ImageMagick) CLI, which is often absent on default Vercel/Netlify build containers. We will update it to reuse the pre-generated duotone WebP assets whenever ImageMagick is not installed in the CI environment, ensuring builds never fail.

---

## 1. Overview & Core Concept

- **What It Does**: Restores 100% of photographic documentation, school facility images, duotone mood backdrops, university/college emblems, Certificate of Completion, Daily Time Records, and Clearance scans across both the Digital Edition (`/`) and the A4 Print Edition (`/print`) when deployed to Netlify or Vercel.
- **Target Audience / Persona**: Course evaluators, professors, and readers viewing Francois Joshua L. Bajandi's Field Study 1 e-portfolio on public cloud hosting (Netlify/Vercel) or exporting the A4 Print Edition.
- **Key Value**: Eliminates `404 Not Found` requests to `/src/assets/...` in production while keeping local content verification (`verify-content`) and cloud builds (`npm run build`) completely deterministic.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Title Page & Footer Emblems**: Bicol University and BU College of Education circular emblems load immediately during Beat 2 of the Title Page aperture reveal, in the persistent footer, and on the Print Edition cover page.
  2. **Act II Foundations (Certificate of Completion)**: The framed Certificate of Completion renders with its full-size inspection link intact.
  3. **Act III Learning Episodes (Episode 02 Campus Map, Facility Cards, Duotone Backdrops, & Personal Illustration)**: The interactive campus map inspector, facility/classroom photo cards, construction-green duotone mood backdrops, and hand-drawn classroom illustration all resolve cleanly without falling back to empty placeholder slots.
  4. **Act IV Evidence & Appendices**: Teaching schedule, observation documentation gallery, September/October Daily Time Record scans, and signed Clearance sheets render in both the Digital and Print Editions.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Preserves **"The Marked-Up Classroom" / "Electric Editorial"** aesthetic without altering layout geometry or typography.
  - *Color Palette & Mood*: Retains `--color-chalkboard` (`#0C1612`), `--color-chalk` (`#F2F5F0`), `--color-chalk-surface` (`#FFFFFF`), `--color-highlighter` (`#FFE600`), `--color-red-pen` (`#E5301F`), and episode-specific surfaces (`--color-notebook`, `--color-construction`, `--color-plum`).
  - *Typography & Hierarchy*: Retains `Bricolage Grotesque` display headings, `Instrument Sans` body copy, and `JetBrains Mono` functional annotations.
  - *Component Styling & Layout*: Index-card photo frames (`PhotoFrame` / `AutoPhotoFrame`) with hard offset shadows (`--shadow-hard`), clip-path scroll reveals, and halftone/duotone treatments.
- **Interactive Feedback & Motion**:
  - `IntersectionObserver` clip-path unmasks (`inset(0 0 0 0)`) trigger smoothly as resolved images enter the viewport, respecting `prefers-reduced-motion: reduce` and the mobile `lite` tier.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Replace `typeof import.meta.glob === 'function'` with `try / catch` Static Glob Assignment**
  - *Chosen Approach*: Execute `import.meta.glob(..., { eager: true })` inside a `try { ... } catch {}` block and check whether the resulting dictionary has entries (`Object.keys(modules).length > 0`) rather than checking `typeof import.meta.glob === 'function'`.
  - *Why*: Vite transforms the `import.meta.glob(...)` call expression at compile time into `Object.assign({ ... })`, but leaves `typeof import.meta.glob === 'function'` untouched in the output bundle. In browser runtimes, `import.meta.glob` is `undefined`, causing the ternary condition to evaluate to `false` and discard all bundled image URLs. Using `try / catch` lets Vite inline the asset map in browser builds while still catching the missing `.glob` function when running under Node/`tsx` during `npm run verify-content`.
  - *Alternatives Considered*: Removing Node compatibility checks entirely was rejected because the content verification runner (`tsx`) executes outside Vite and would throw a runtime `TypeError` without a `try / catch` guard.
- **Decision 2: Public Asset Mirroring & Production-Safe Fallback URLs**
  - *Chosen Approach*: Copy all photo, tinted duotone, and brand logo assets into static public directories (`/assets/photos/...`, `/assets/photos/tinted/...`, `/assets/brand/...`) and update every fallback URL from `/src/assets/...` to `/assets/...` (plus a fallback lookup against `/assets/aistudio/...` where applicable).
  - *Why*: Guarantees that even if an image is referenced dynamically by filename or outside the glob map, the static file is physically present in `dist/assets/` on Netlify and Vercel and never points to `/src/...` (which does not exist in production builds).
  - *Alternatives Considered*: Relying solely on Vite hashed assets was passed over per your preference for redundant static fallback copies.
- **Decision 3: Resilient Duotone Pre-Build Step & Dual-Platform SPA Routing**
  - *Chosen Approach*: Update the duotone build step to check if `convert` (ImageMagick) is available before invoking it; if unavailable on Vercel/Netlify build containers, verify and keep the committed duotone WebP files. Add SPA rewrite configuration for Vercel alongside the existing Netlify configuration.
  - *Why*: Prevents CI build failures on cloud runners lacking ImageMagick and ensures direct navigation to `/print` works on both Vercel and Netlify.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLOUD BUILD & ASSET PIPELINE                         │
│                                                                         │
│  ┌──────────────────────┐    ┌──────────────────────┐                   │
│  │  Duotone Pre-Check   │───▶│  Photo & Content     │───▶ Vite Build    │
│  │ (Uses ImageMagick if │    │  Verification        │     (dist/)       │
│  │  present, else keeps │    │  (tsx Node Runner)   │                   │
│  │  existing duotones)  │    └──────────────────────┘                   │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  DUAL-LAYER IMAGE RESOLUTION ENGINE                     │
│                                                                         │
│  Layer 1: Compile-Time Vite Glob Map (try { import.meta.glob } catch)   │
│           Resolves to hashed Vite bundle URLs (/assets/name-hash.webp)  │
│                                    │                                    │
│                                    ▼ (Fallback if unmapped / Node SSR)  │
│  Layer 2: Public Static Asset Mirror (/assets/photos/* & /assets/brand) │
│           Served directly from dist/assets/ on Netlify & Vercel         │
└────────────┬───────────────────────┬────────────────────────┬───────────┘
             │                       │                        │
             ▼                       ▼                        ▼
┌────────────────────────┐ ┌──────────────────────┐ ┌─────────────────────┐
│   TitlePage & Footer   │ │  EpisodeChapter &    │ │  FrontMatterPlates, │
│     Brand Emblems      │ │   AutoPhotoFrame     │ │  Appendices & Print │
│  (BU & BUCE Seals)     │ │ (Campus Map, Cards,  │ │ (Cert, DTR,         │
│                        │ │  Duotone Backdrops)  │ │  Clearance, Docs)   │
└────────────────────────┘ └──────────────────────┘ └─────────────────────┘
```

### Data Model & State

- **Bundled Asset Dictionaries**:
  - `photoModules`: Eagerly mapped dictionary of episode and appendix photos (`Record<string, { default: string }>`).
  - `tintedMoodModules`: Eagerly mapped dictionary of construction-green duotone WebP mood backdrops for Episode 02.
  - `brandLogoModules`: Eagerly mapped dictionary of university and college emblems (`logo-bicol-university.png`, `logo-buce.webp`).
  - `appendixPhotoModules`: Eagerly mapped dictionary for Certificate of Completion, Daily Time Record pages, Clearance scan, and observation documentation photos.
- **Resolution Priority**:
  1. Match by filename or glob pattern against the Vite `import.meta.glob` dictionary.
  2. If running outside Vite (`tsx` verification) or if a file was not matched in the eager glob, resolve to `/assets/photos/<filename>` (or `/assets/brand/<filename>` / `/assets/photos/tinted/<filename>`), which maps directly to the static files copied into `public/assets/`.

### Interactive Component & State Mapping

- **Episode 02 Interactive Campus Block Map & Facility Inspector (`CampusBlockMap` / `EpisodeChapter`)**:
  - Selecting an available facility block on the isometric map looks up its `photos[]` filenames via `getPhotoByFileMatch()`, resolving the bundled `.src` URL and rendering each photo inside the index-card inspector drawer.
- **Episode & Appendix Photo Frames (`AutoPhotoFrame` / `PhotoFrame`)**:
  - Receives a valid `src` string in production builds (never `undefined` for existing photos), ensuring `if (!src && !isIllustrationRole && hidePending) return null` does not hide populated documentary photos in production (`NODE_ENV=production`).
- **Digital (`/`) and Print (`/print`) Route Parity**:
  - Both routes consume the exact same `buLogoSrc`, `buceLogoSrc`, `getPhotoByFileMatch()`, and `resolveAppendixPhotoSrc()` helpers, guaranteeing identical image rendering when printing or exporting to PDF.
