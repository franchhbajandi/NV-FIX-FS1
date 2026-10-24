# Implementation Plan: Electric Editorial Motion Suite & Dynamic Photo System

Execute the final client-approved revisions:

1. **PDF Availability Guard**:
   - `fetch('/Bajandi_FS1_Portfolio.pdf', { method: 'HEAD' })` strictly validating `headers.get('content-type')?.includes('application/pdf')`.
   - Remove the dummy 608-byte file from `public/` so the button renders disabled "PDF (Coming Soon)" until the real PDF is supplied.
   - Never falls through to HTML or source text.
   - Document `npm run pdf` and `/print` → Chrome "Save as PDF" fallback in `README.md`.

2. **Electric Editorial Photo System (`AutoPhotoFrame.tsx`)**:
   - Auto-discover images in `src/assets/photos/` with regex supporting both `ep{N}-{nn}-{slug}` and `ep0{N}-{nn}-{slug}`.
   - Pure Electric Editorial styling: crisp thin outlines, high-contrast offset color blocks (`#2447FF`, `#E8FF3A`, `#FF3D1F`), viewfinder corner brackets (`┌ ┐ └ ┘`), optional halftone texture, clean technical captions.
   - No washi tape or polaroid frames.
   - Required metadata in `photos.json`: build warning logged for unindexed photos; `alt` defaults to caption, never empty.

3. **High-Performance Motion Engine (Single rAF Loop, Ref-Based)**:
   - All velocity skew and card tilt updates mutate DOM element styles directly via `useRef` inside a single centralized `requestAnimationFrame` loop (zero React state updates during scroll/pointer motion).
   - Touch devices (`pointer: coarse`) bypass skew and 3D tilt entirely.
   - All skewed headlines wrapped inside `overflow-hidden` containers to prevent layout jitter.
   - Full `@media (prefers-reduced-motion: reduce)` fallbacks.

4. **Non-Developer README Guide**:
   - Document "How to add a photo": filename convention (`ep4-01-slug.webp` or `ep04-01-slug.webp`), pre-blurring/cropping learner faces for DepEd privacy compliance, WebP compression, and adding caption/alt in `photos.json`.
   - Document PDF compilation workflow (`npm run pdf` and `/print` fallback).

5. **Verbatim Worksheets & Mobile Table Scrolling**:
   - Preserve all data, tables, matrices, and rubrics with native horizontal touch-scrolling.
   - Dedicated "Download original PDF" triggers linking to `/docs/Episode-0X-FS1.pdf`.
