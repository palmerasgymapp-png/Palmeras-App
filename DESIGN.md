---
name: Kinetic Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e4e2e1'
  on-surface-variant: '#c5c9ac'
  inverse-surface: '#e4e2e1'
  inverse-on-surface: '#303030'
  outline: '#8f9378'
  outline-variant: '#444932'
  surface-tint: '#b0d500'
  primary: '#ffffff'
  on-primary: '#2a3400'
  primary-container: '#caf300'
  on-primary-container: '#596c00'
  inverse-primary: '#536600'
  secondary: '#ffb59d'
  on-secondary: '#5d1800'
  secondary-container: '#ff5711'
  on-secondary-container: '#511400'
  tertiary: '#ffffff'
  on-tertiary: '#313030'
  tertiary-container: '#e5e2e1'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#caf300'
  primary-fixed-dim: '#b0d500'
  on-primary-fixed: '#171e00'
  on-primary-fixed-variant: '#3e4c00'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59d'
  on-secondary-fixed: '#390c00'
  on-secondary-fixed-variant: '#832600'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#131313'
  on-background: '#e4e2e1'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 20px
  container-max: 1280px
---

## Brand & Style

This design system is engineered for high-performance fitness environments, bridging the gap between rigorous gym management and personal athletic achievement. The brand personality is **motivating, precise, and high-energy**, utilizing a "Dark Performance" aesthetic that prioritizes focus and reduces visual fatigue in low-light gym settings.

The style is a hybrid of **High-Contrast Modern** and **Tactile Minimalism**. It leverages deep blacks to create a sense of infinite space, while "Action Neon" accents direct the user toward critical tasks. The UI should feel like a premium piece of fitness equipment: durable, ergonomic, and engineered for results. Visuals are characterized by aggressive typography, generous negative space, and subtle depth created through tonal layering rather than heavy shadows.

## Colors

The palette is anchored in **Deep Charcoal (#121212)** and pure black to establish a sophisticated, high-performance atmosphere. 

- **Primary (Electric Lime):** Used for primary calls to action, progress indicators, and "active" states. It represents energy and go-signals.
- **Secondary (Vibrant Orange):** Used for secondary CTAs, intensity markers, or urgent notifications. It provides a warm, metabolic contrast to the lime.
- **Neutral (Slate Gray):** Used for structural elements, card backgrounds, and borders to create subtle hierarchy without breaking the dark-mode immersion.
- **Data Visualization:** Use high-saturation variants of the primary and secondary colors for heart rate zones, load tracking, and performance metrics.

## Typography

The typography strategy employs a "Dual-Speed" approach. **Montserrat** is used for headings to provide a bold, geometric, and athletic presence. Its heavy weights (700-800) are essential for establishing the high-energy tone. **Inter** is used for all functional body text and data-heavy interfaces to ensure maximum legibility and a systematic feel.

All uppercase styling should be reserved for **labels** and **section headers** to mimic the look of traditional athletic apparel and scoreboard displays. For numerical data (reps, sets, weights), use Inter with tabular lining figures to ensure vertical alignment in charts and tables.

## Layout & Spacing

The design system utilizes a **8px grid system** to maintain mathematical consistency. 

- **Desktop:** 12-column fluid grid with 24px gutters. Content is housed in a max-width container of 1280px.
- **Mobile:** 4-column fluid grid with 16px margins.
- **Spacing Philosophy:** Use "Density for Data, Space for Focus." Dashboard views (management side) should use compact spacing (`sm` and `xs`) to fit more information. Client-facing training screens (app side) should use generous spacing (`md` and `lg`) to allow for easy interaction while moving or exercising.

## Elevation & Depth

This design system avoids traditional drop shadows in favor of **Tonal Elevation**. Depth is communicated through color luminance:

1.  **Level 0 (Background):** Pure black (#000000).
2.  **Level 1 (Cards/Sections):** Deep Charcoal (#121212).
3.  **Level 2 (Modals/Popovers):** Slate Gray (#2D2D2D).

For specific interactive elements like buttons, a **glow effect** (soft outer shadow) using the Primary color (#D4FF00) at 20% opacity may be used to indicate a "ready" or "active" state, simulating the glow of a digital console.

## Shapes

The shape language is defined by **modern, confident curves**. A standard 12px - 16px radius (`rounded-lg` and `rounded-xl`) is applied to all cards and primary containers to soften the high-contrast aesthetic and make the UI feel approachable.

- **Primary Buttons:** Should use the `rounded-lg` (1rem/16px) setting to provide a large, tactile target.
- **Form Inputs:** Use `rounded-sm` (0.25rem/4px) for a more technical, precise appearance.
- **Avatars/Status Indicators:** Use full circles (pill-shaped) to contrast against the structured rectangular grid.

## Components

- **Buttons:** Primary buttons are Solid Electric Lime with black text for maximum "pop." Secondary buttons use a Slate Gray outline with white text.
- **Cards:** Backgrounds should be #121212 with a subtle 1px border of #2D2D2D. No shadows.
- **Input Fields:** Dark backgrounds (#121212) with a #2D2D2D border that shifts to #D4FF00 on focus.
- **Progress Bars:** High-contrast tracks (black) with vibrant fills (Lime or Orange). Use a subtle glow on the leading edge of the progress bar to imply movement.
- **Chips/Badges:** Small, uppercase labels with low-opacity fills (e.g., Lime at 15% opacity with Lime text) for categorization like "Cardio," "Strength," or "Active."
- **Navigation:** Use a vertical sidebar for management (pro feel) and a bottom tab bar for the client app (thumb-friendly mobility).