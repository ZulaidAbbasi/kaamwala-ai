---
name: KaamWala AI Orchestration
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#404944'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#39008b'
  on-tertiary: '#ffffff'
  tertiary-container: '#5210bc'
  on-tertiary-container: '#bda3ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 20px
  gutter: 12px
  card-padding: 16px
  section-gap: 24px
---

## Brand & Style
The brand personality centers on "Empowered Reliability." It bridges the gap between sophisticated agentic AI and the grounded, high-trust world of Pakistan's informal economy. The UI evokes a sense of professional calm through a **Corporate/Modern** style, utilizing heavy whitespace and a polished mobile-first architecture to ensure the technology feels like a helpful partner rather than a complex tool.

Key characteristics:
- **Trust-first:** High-contrast typography and traditional emerald tones suggest stability.
- **Agentic Transparency:** Use of distinct purple accents to highlight "AI thinking" phases.
- **Clarity:** A focus on "One Task at a Time" to reduce cognitive load for users in fast-paced environments.

## Colors
The palette is rooted in a Deep Emerald primary color, symbolizing growth and professional integrity. This is balanced by a modern Teal secondary for interactive elements and a vibrant Purple reserved exclusively for AI-driven insights and "Agent Trace" moments. 

Surface colors remain strictly off-white to reduce eye strain, while the dark navy text ensures maximum legibility in outdoor or high-glare environments common for field-service coordination.

## Typography
The design system utilizes **Plus Jakarta Sans** for its approachable yet professional geometric structure. 

- **Headlines:** Use tight letter-spacing and bold weights to command attention during service "Discovery" and "Pricing" stages.
- **Body Text:** Generous line-height (1.5x) is maintained for readability.
- **Labels:** Small caps or semibold weights are used for metadata like "Confidence Scores" or "Timestamps."

## Layout & Spacing
The layout follows an 8px rhythmic grid, prioritizing a single-column mobile flow that stacks cards vertically. 

- **Grid:** On mobile, use a 4-column grid with 20px side margins to prevent content from feeling "trapped." 
- **Stacking:** Workflow steps and provider lists use a vertical stack with 12px gaps to maintain a clear path of travel for the eye.
- **Safe Areas:** Ensure interactive elements like "Book Now" buttons are pinned to the bottom of the viewport in a sticky container with a frosted glass background.

## Elevation & Depth
This design system uses **Ambient Shadows** to create a sense of organized hierarchy. Surfaces are layered to represent the AI orchestration process:

1.  **Level 0 (Background):** #F9FAFB - The canvas.
2.  **Level 1 (Cards):** White surface with a very soft, multi-layered shadow (0px 4px 20px rgba(0,0,0,0.05)).
3.  **Level 2 (Active States/Modals):** More pronounced shadow (0px 12px 32px rgba(0,0,0,0.1)) to draw focus.
4.  **Special (AI Trace):** A subtle purple inner glow or border-left accent to denote "Agentic reasoning" layers.

## Shapes
The shape language is friendly and modern. 
- **Base Components:** 8px (0.5rem) for small inputs and buttons.
- **Section Cards:** 16px (1rem) for standard content containers to achieve the "Premium" feel requested.
- **Status Pills:** Fully rounded (999px) to distinguish them from actionable buttons.

## Components

### Buttons
- **Primary:** Solid Deep Emerald (#064E3B) with white text. High-contrast, 16px roundedness, 56px height for mobile tap targets.
- **Secondary:** Outlined Emerald with 1.5px border or light teal tint background.
- **AI Action:** Solid Purple (#8B5CF6) with white text, used only for "Optimize" or "Automate" functions.

### Cards
- **Section Cards:** White background, 16px radius, subtle border (#F1F5F9).
- **Provider Cards:** Includes a profile avatar (48px), title, star rating (Amber), and a secondary "View Profile" button.
- **Agent Trace Cards:** Use a light purple tint background (#F5F3FF) and a "Monospace-lite" font for the reasoning logs to feel technical yet accessible.
- **Receipt Cards:** Use a dashed separator line and "notched" corners to mimic a physical receipt.

### Workflow Stepper
- A horizontal scrollable track at the top of the screen. 
- **Active Step:** Emerald circle with a white checkmark.
- **Upcoming Step:** Light gray border with a subtle number.
- **Connecting Line:** 2px solid emerald (completed) or dashed gray (upcoming).

### Data Visualization
- **Score Breakdown Bars:** 8px tall rounded tracks. The track is light gray, filled with Teal (#0D9488) to represent the score.
- **Status Badges:** Soft background (10% opacity of status color) with bold text of the same hue. (e.g., "Backend Live" in Green).

### Feedback UI
- **Info/Warning Boxes:** 12px rounded, background color matches the status at 5% opacity, with a 4px left-border accent in the solid status color.