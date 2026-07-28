# Contributing

This document covers internal build setup for people working on this SDK itself — not consumers installing the package. If you're looking for how to *use* the widgets, see [README.md](./README.md).

## Table of Contents

- [Why this exists](#why-this-exists)
- [Setting up the stylesheet build](#setting-up-the-stylesheet-build)
- [Adding a new widget's classes to the build](#adding-a-new-widgets-classes-to-the-build)
- [Local development](#local-development)

---

## Why this exists

Since this SDK is installed as a real package (not copied into the consumer's own repo, the way shadcn/ui works), the consumer's own Tailwind build **never scans this package's source files** by default — so every class string in files like `themes/defaultTheme.ts` / `CARD_DEFAULT_CLASSES` compiles to nothing in their app, and every widget would render with zero layout or color.

The fix: this SDK ships its **own pre-compiled stylesheet** as part of its build, so consumers import real, already-compiled CSS rather than relying on their own Tailwind config to happen to pick up ours. This is why every consumer-facing widget needs `import "@anedyasystems/anedya-widgets-react/styles.css"` — see the README's [Stylesheet import](./README.md#stylesheet-import) section for the consumer-facing side of this.

---

## Setting up the stylesheet build

**1. The input file**, `src/styles/base.css`:

```css
@import "tailwindcss";

/* Explicit @source directives so Tailwind scans exactly the folders
   containing our class strings, rather than relying purely on
   automatic detection. Paths are relative to this file's location. */
@source "../widgets/**/*.{ts,tsx}";
@source "../themes/**/*.{ts,tsx}";
@source "../common.ts";
```

**2. Install the Tailwind v4 CLI** (a separate package from core `tailwindcss` as of v4):

```bash
npm install -D @tailwindcss/cli
```

**3. Build script**, in `package.json`:

```json
{
  "scripts": {
    "build:css": "tailwindcss -i ./src/styles/base.css -o ./dist/style.css --minify",
    "build:js": "tsup",
    "build": "npm run build:js && npm run build:css"
  }
}
```

> **Order matters:** `build:js` must run before `build:css` if `tsup`'s `clean` option is enabled — `tsup` wipes `dist/` before writing its own output, which would delete `style.css` if the CSS step ran first.

Run `npm run build` before every publish so `dist/style.css` always reflects current source. Consider chaining this into `prepublishOnly` so it can't be forgotten:

```json
{
  "scripts": {
    "prepublishOnly": "npm run build"
  }
}
```

---

## Adding a new widget's classes to the build

Whenever you add a new widget (e.g. `ChartWidget`), make sure its default classes and theme files live somewhere already covered by the `@source` globs in `base.css` — or add a new `@source` line pointing at wherever they live:

```css
@source "../widgets/**/*.{ts,tsx}";  /* covers src/widgets/**, including new widget folders */
@source "../themes/**/*.{ts,tsx}";   /* covers src/themes/**, including new theme files */
```

If a new widget's classes live outside these paths, they silently won't compile — same failure mode described in [Why this exists](#why-this-exists), just for a *new* widget's classes instead of the whole package. After adding any new source file, rebuild and grep for a known class to confirm it made it into `dist/style.css`:

```bash
npm run build:css
grep "your-new-class-name" dist/style.css
```

---

## Local development

The demo app (`my-app`) is used to manually test widgets while working on this SDK. Set it up using `npm link`, which symlinks your local package into the demo — no `file:` reference in `package.json` needed.

### One-time setup

**1. In the package root**, register it as linkable:

```bash
npm link
```

**2. In the demo app**, link to it:

```bash
npm link @anedyasystems/anedya-widgets-react
```

This creates a symlink from the demo's `node_modules/anedya-widgets-react` to your local package root — the demo now resolves that import to your local working copy instead of anything published to npm.

### Two ways to import while developing

**Option A — import directly from source (fastest iteration)**

```jsx
import { AnedyaCard } from "../../../src";
import "../../../dist/style.css";
```

Use this while actively developing a widget's component code (`.tsx` logic, props, structure). JS changes are picked up by the demo's own dev server via normal React/Vite hot-reload — no rebuild of the SDK package itself required.

**Caveat:** the imported stylesheet (`../../../dist/style.css`) is still a *built* artifact, not the raw `base.css` — so any CSS/Tailwind class change still needs:

```bash
npm run build:css
```
before it shows up in the demo, even in this mode.

**Option B — import as the published package (accurate consumer simulation)**

```jsx
import { AnedyaCard } from "@anedyasystems/anedya-widgets-react";
import "@anedyasystems/anedya-widgets-react/styles.css";
```

Use this to verify the package behaves correctly as an actual installed dependency — e.g. confirming `exports` map entries resolve correctly, the stylesheet subpath import works, and nothing that only exists in the local `src/` folder (but wasn't actually exported) is accidentally being relied on.

Because the link points at your package root, any rebuild there is picked up automatically:

```bash
npm run build
```

No re-linking needed after this, **unless** you change the package's `name` field or its `exports` map — in either case, re-run `npm link` in both the package root and the demo to refresh the symlink.

### Switching between the two

The demo file typically keeps both import blocks present, with one commented out — swap which is active depending on which mode you're testing in.

Two things worth knowing if changes don't seem to show up:

- **Vite's dependency pre-bundling cache** may have optimized an older version of the package. If Option B isn't reflecting a fresh build, clear it and restart:
```bash
  rm -rf node_modules/.vite
  npm run dev
```
- Restart the demo's dev server (not just save/hot-reload) after switching which import block is active — changing which module resolves `AnedyaCard` can require a fresh module graph.

**Rule of thumb:** use Option A day-to-day while iterating on a widget; switch to Option B before committing/publishing, as a final sanity check that the consumer-facing package actually works the way the README describes.