# Bundle Size Optimization

This document tracks which components use heavy dependencies and how they are loaded.

## Heavy Dependencies

### tesseract.js (~500KB gzip)

**Purpose:** OCR — extracts text from images so users can search by photographing a screen.

**Usage:**
| File | How loaded |
|------|-----------|
| `components/home/media-filter.tsx` | **Dynamic import** inside `handleCropAndScan()`. The library is fetched only when the user taps the camera button and confirms the crop area. Zero cost on initial page load. |

**Before:** Statically imported at the top of the file, bundled into every page that renders `MediaFilter`.  
**After:** `await import("tesseract.js")` inside the async handler — loaded on demand.

---

### react-image-crop (~20KB gzip)

**Purpose:** Lets users draw a crop rectangle over a captured image before OCR scanning.

**Usage:**
| File | How loaded |
|------|-----------|
| `components/home/media-filter.tsx` | **Dynamic import** inside `DynamicCropModal` component. The component mounts only when `cropImageSrc` is set (i.e. after the user selects an image). The CSS is also imported dynamically. |

**Before:** Statically imported (including CSS) at the top of the file.  
**After:** `import("react-image-crop")` and `import("react-image-crop/dist/ReactCrop.css")` inside a `useEffect` that runs only when the crop modal opens.

---

### framer-motion (~40KB gzip)

**Purpose:** Declarative animation library used for page transitions, modal open/close, list stagger effects, and tab indicator pills.

**Migration strategy:** Replace with Tailwind CSS `animate-in` / `fade-in` / `slide-in-from-*` / `zoom-in-*` utilities (from `tailwindcss-animate`) and inline `transition-*` classes. These are zero-JS and compile to a few bytes of CSS.

| File | Status | Notes |
|------|--------|-------|
| `components/ui/page-transition.tsx` | ✅ Replaced | `animate-in fade-in duration-300` |
| `components/ui/animated-list.tsx` | ✅ Replaced | `animate-in fade-in slide-in-from-bottom-4 duration-500` |
| `components/media/trailer-modal.tsx` | ✅ Replaced | `animate-in fade-in zoom-in-95 slide-in-from-bottom-4` |
| `components/media/episode-details-modal.tsx` | ✅ Replaced | `animate-in fade-in zoom-in-95 slide-in-from-bottom-4` |
| `components/notifications/notifications-list.tsx` | ✅ Replaced | `animate-in fade-in slide-in-from-left-4` + `animationDelay` |
| `components/onboarding/onboarding-form.tsx` | ✅ Replaced | Progress bar: `transition-all duration-500`; steps: `animate-in fade-in slide-in-from-bottom-4` |
| `components/stats/leaderboard.tsx` | ✅ Replaced | `animate-in fade-in slide-in-from-left-4` + `animationDelay` |
| `components/profile/settings-content.tsx` | ✅ Replaced | `animate-in fade-in slide-in-from-right-2 duration-300` |
| `components/search/discovery-engine.tsx` | ✅ Replaced | `animate-in fade-in slide-in-from-bottom-2`; pill: static `bg-gradient-to-r` |
| `components/home/home-discovery-section.tsx` | ✅ Replaced | Filter sheet: `animate-in fade-in`; tab options: `animate-in fade-in slide-in-from-right-2` |
| `components/home/hero-slider.tsx` | ⚠️ Kept | Complex parallax scale + progress bar animations that require JS-driven values. Candidate for future optimisation with the Web Animations API. |

**Estimated savings:** If `hero-slider.tsx` is the only remaining consumer, framer-motion will still be included in the bundle for that route. However, all other routes that previously pulled in framer-motion (notifications, onboarding, settings, stats) will no longer include it.

---

## Bundle Analysis

Run the bundle analyzer to inspect chunk sizes:

```bash
# Generate a static HTML report at .next/bundle-report.html
npm run analyze

# Generate both client and server reports
npm run analyze:detail
```

Configuration is in `.bundleanalyzerrc.json`.

---

## Future Opportunities

1. **hero-slider.tsx** — The `motion.div` with `scale: 1.15` Ken Burns effect and the progress bar `width` animation are the main blockers for removing framer-motion entirely. These could be replaced with CSS `@keyframes` animations.
2. **Code splitting** — Consider splitting `MediaFilter` into a separate chunk since it is only rendered on the search/home pages.
3. **Image optimization** — The `unoptimized: true` flag in `next.config.ts` disables Next.js image optimization. Removing it would enable automatic WebP/AVIF conversion and responsive sizing.
