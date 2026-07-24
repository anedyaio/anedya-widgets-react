# Contributing

This document covers internal build setup for people working on this SDK itself — not consumers installing the package. If you're looking for how to *use* the widgets, see [README.md](./README.md).

## Table of Contents

- [Why this exists](#why-this-exists)
- [Setting up the stylesheet build](#setting-up-the-stylesheet-build)
- [Adding a new widget's classes to the build](#adding-a-new-widgets-classes-to-the-build)

---

## Why this exists

Since this SDK is installed as a real package (not copied into the consumer's own repo, the way shadcn/ui works), the consumer's own Tailwind build **never scans this package's source files** by default — so every class string in files like `themes/defaultTheme.ts` / `CARD_DEFAULT_CLASSES` compiles to nothing in their app, and every widget would render with zero layout or color.

The fix: this SDK ships its **own pre-compiled stylesheet** as part of its build, so consumers import real, already-compiled CSS rather than relying on their own Tailwind config to happen to pick up ours. This is why every consumer-facing widget needs `import "public-widget-sdk/styles.css"` — see the README's [Stylesheet import](./README.md#stylesheet-import) section for the consumer-facing side of this.

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

Run