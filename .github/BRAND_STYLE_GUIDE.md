# Renaissance Kids Brand Style Guide

## Mission Statement

"Light up learning through the arts."™

## Brand Identity

Renaissance Kids is a warm, creative, community-focused organization that brings arts integration to education. We are professional yet approachable, structured yet playful.

-----

## Color Palette

### Primary Colors

```
Teal:   #2F6B65  (backgrounds, headers)
Peach:  #F7C4A5  (accents, highlights)
Navy:   #1C1C1C  (text, borders)
```

### Accent Colors

```
Brand Red:    #E92929
Brand Blue:   #2B59C3
Brand Yellow: #FFE600
Brand Green:  #48B749
Brand Purple: #8028A0
Brand Orange: #F05A22
```

### Usage Guidelines

- **Teal**: Primary brand color for headers, buttons, backgrounds
- **Peach**: Warm accents, call-out boxes, friendly highlights
- **Navy**: Body text, icons, borders
- **Accent Colors**: Subject categorization, game elements, data visualization

-----

## Typography

### Headings

```
Primary:   Comic Sans MS, Chalkboard, cursive
Secondary: Century Gothic, Arial, sans-serif
```

### Body Text

```
Font:   Century Gothic, Arial, sans-serif
Size:   16px base
Weight: 400 (regular), 700 (bold)
```

### Code/Data

```
Font: Monaco, Courier, monospace
```

-----

## Logo Usage

### Primary Logo

Full color logo with tagline on white background

### Secondary Logo

White logo on teal background (for dark contexts)

### Clearspace

Maintain minimum clearspace of logo height × 0.5 on all sides

### Minimum Size

Digital: 120px width
Print: 1 inch width

-----

## Voice & Tone

### Marketing Content

- **Warm & Inviting**: "Your child will discover…"
- **Benefits-Focused**: Not "We teach painting" but "Bring imagination to life"
- **Community-Oriented**: "Here in Dutchess County," "our Hudson Valley families"
- **Clear CTAs**: "Claim your spot today at www.renkids.org"

### Educational Content

- **Approachable**: Use analogies and metaphors
- **Encouraging**: Celebrate progress
- **Clear**: No jargon unless explained

### Parent Communications

- **Respectful**: Professional yet friendly
- **Transparent**: Clear about policies and expectations
- **Supportive**: Focus on partnership

-----

## Contact Information (Required)

**Always Use Complete Format**

```
Renaissance Kids, Inc.
1343 Route 44
Pleasant Valley, NY 12569
(845) 452-4225
info@renkids.org
www.renkids.org
```

**Never Abbreviate**

- Route 44 (not "Rt. 44")
- Pleasant Valley (not "Pleasantville")

-----

## UI Components

### Buttons

```css
Primary:
  background: #2F6B65
  color: white
  border-radius: 8px
  padding: 12px 24px

Secondary:
  background: white
  color: #2F6B65
  border: 2px solid #2F6B65
```

### Cards

```css
background: white
border-radius: 12px
box-shadow: 0 4px 8px rgba(0,0,0,0.1)
padding: 24px
```

### Form Inputs

```css
border: 2px solid #1C1C1C
border-radius: 8px
padding: 12px
focus: border-color #2F6B65
```

-----

## Imagery

### Photography Style

- Bright, natural lighting
- Candid shots of students creating
- Close-ups of artwork and hands-on learning
- Diverse representation

### Illustrations

- Hand-drawn aesthetic
- Colorful, playful
- Match accent color palette
- Avoid overly polished/corporate style

-----

## Footer Requirements

### Website Footer

```
Renaissance Kids, Inc.
1343 Route 44, Pleasant Valley, NY 12569
(845) 452-4225 | info@renkids.org
```

### Document Footer (Worksheets/Reports)

```
Renaissance Kids, Inc.
```

(Italicized, centered)

-----

## Accessibility

### Color Contrast

All text meets WCAG AA standards (4.5:1 for body, 3:1 for large text)

### Alt Text

Always describe images: "Renaissance Kids student painting a galaxy in our Pleasant Valley studio"

### Font Sizes

Minimum 14px for body text, 12px for footnotes

-----

## Examples

### Good Marketing Copy

"Where math meets magic, your child won't just solve problems—they'll create solutions! Here at Renaissance Kids in Pleasant Valley, we light up learning through the arts.™"

### Bad Marketing Copy

"We offer mathematics instruction using proven pedagogical methods."

### Good Subject Line

"🎨 Spots filling fast! Enroll in Spring Arts Classes"

### Bad Subject Line

"Renaissance Kids Educational Opportunities Q2 2026"

-----

## Implementation in Code

### CSS Variables

For consistency across all web components, use these CSS custom properties:

```css
:root {
  /* Primary Colors */
  --rk-teal: #2F6B65;
  --rk-peach: #F7C4A5;
  --rk-navy: #1C1C1C;

  /* Accent Colors */
  --rk-red: #E92929;
  --rk-blue: #2B59C3;
  --rk-yellow: #FFE600;
  --rk-green: #48B749;
  --rk-purple: #8028A0;
  --rk-orange: #F05A22;

  /* Neutral Colors */
  --rk-white: #FFFFFF;
  --rk-bg: #FDFBF7;

  /* Typography */
  --font-heading: "Comic Sans MS", Chalkboard, cursive;
  --font-body: "Century Gothic", Arial, sans-serif;
  --font-code: Monaco, Courier, monospace;

  /* Font Sizes */
  --font-size-base: 16px;
  --font-size-small: 14px;
  --font-size-footnote: 12px;

  /* Spacing */
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-pill: 999px;
}
```

### Button Examples

```css
/* Primary Button */
.btn-primary {
  background: var(--rk-teal);
  color: var(--rk-white);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-family: var(--font-body);
  font-weight: 700;
  border: none;
}

/* Secondary Button */
.btn-secondary {
  background: var(--rk-white);
  color: var(--rk-teal);
  border: 2px solid var(--rk-teal);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-family: var(--font-body);
  font-weight: 700;
}
```

### Typography in HTML

```html
<!-- Heading -->
<h1 style="font-family: var(--font-heading); color: var(--rk-teal);">
  Welcome to Renaissance Kids
</h1>

<!-- Body Text -->
<p style="font-family: var(--font-body); font-size: var(--font-size-base); color: var(--rk-navy);">
  Light up learning through the arts.™
</p>
```
