# Renaissance Kids Design System

This directory contains the centralized brand assets and design system for Renaissance Kids.

## Files

### `brand-variables.css`

The core CSS variables file that defines:
- Brand colors (Teal, Peach, Navy, and accent colors)
- Typography (fonts, sizes, weights)
- Spacing system
- Border radius values
- Shadows and transitions
- Reusable component classes

**Usage:**
```html
<link rel="stylesheet" href="/styles/brand-variables.css">
```

### `accessibility-test.html`

Interactive color contrast checker that verifies WCAG AA compliance for all brand color combinations. Open this file in a browser to see:
- Contrast ratios for each color pair
- Pass/fail status for different text sizes
- Recommendations for safe color usage

## Quick Reference

### Primary Colors

```css
--rk-teal: #2F6B65    /* Headers, buttons, primary UI */
--rk-peach: #F7C4A5   /* Accents, highlights, warm elements */
--rk-navy: #1C1C1C    /* Body text, borders, icons */
```

### Typography

```css
--font-heading: "Comic Sans MS", Chalkboard, cursive
--font-body: "Century Gothic", Arial, sans-serif
--font-code: Monaco, Courier, monospace
```

### Component Classes

Use these pre-built classes in your HTML:

```html
<!-- Buttons -->
<button class="rk-btn-primary">Primary Action</button>
<button class="rk-btn-secondary">Secondary Action</button>

<!-- Cards -->
<div class="rk-card">Card content here</div>

<!-- Callout boxes -->
<div class="rk-callout">Important information</div>

<!-- Form inputs -->
<input type="text" class="rk-input" placeholder="Enter text">

<!-- Typography -->
<h1 class="rk-heading">Heading Text</h1>
<p class="rk-body">Body text content</p>
<code class="rk-code">code snippet</code>
```

## Brand Guidelines

For complete brand guidelines including:
- Voice & tone
- Contact information format
- Logo usage
- Marketing copy examples
- Accessibility standards

See: **`.github/BRAND_STYLE_GUIDE.md`**

## Accessibility

All primary color combinations meet WCAG AA standards:
- ✓ Teal on White: 4.77:1 (PASS AA)
- ✓ Navy on White: 15.6:1 (PASS AAA)
- ✓ Navy on Peach: 7.92:1 (PASS AAA)

**Note:** Bright accent colors (Yellow, Red, Green, Orange) should only be used for large text or decorative elements, not body text.

## Contact

Renaissance Kids, Inc.
1343 Route 44
Pleasant Valley, NY 12569
(845) 452-4225
info@renkids.org
www.renkids.org
