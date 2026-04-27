# Hermes GTM — Visual Spec (from landing-mock-{1,2,3}.png)

This spec is the source of truth for a from-scratch CSS rewrite. Each mock is
948×1659 (a tall single-page composition rendered at ~2x for retina). All three
share a single design system: editorial, monochrome, navy-on-cream, with a
single muted periwinkle illustration accent. There are NO bright/saturated
brand colors — the entire site is two-tone with cool-blue secondary tints.

---

## Mock 1 — `landing-mock-1.png` (the primary, "Own your growth engine" home)

### Verbatim copy

Top nav (left = wordmark, right = links):
- Wordmark: "Hermes GTM" with a small angular pennant/wing glyph to its left
- Nav links: Service · Process · Pricing
- (Right-side CTA appears to be present but minimal; the upper-right cluster
  contains nav text only — no filled button in the header)

Hero (left column, large):
- Headline (two lines, serif):
    Own your
    growth engine.
- Sub-paragraph (sans, ~3 lines):
    "We design and build custom GTM systems for prospecting, research,
    enrichment, routing, and outbound — then hand over the code."
- Buttons: "Book an Audit"  (primary, dark navy fill, light text)
           "See How It Works →"  (ghost / text link with arrow)

Trust strip (single row of three pills directly under the CTAs):
- "Built around your motion"
- "You own the code"
- "No black-box lock-in"
Each pill prefixed by a tiny line-icon glyph.

Section: "What we build" (eyebrow / small section title, left-aligned)
Six capability tiles in a 3×2 grid, each = small icon + label:
  Row 1: Signal-based sourcing · Account research · Lead scoring
  Row 2: Outbound systems · CRM & workflow sync · Human-in-the-loop review

Section: "How it works" (left-aligned title)
Four numbered/iconed steps in a single row:
  1. Audit the motion
  2. Design the system
  3. Launch and refine
  4. Handoff and train

Section: "Selected outcomes" (left-aligned title)
Three large stat cards in a row, each large numeral + caption:
  - 80%   "less manual research"
  - 3x    "more qualified pipeline"
  - 45%   "increase in reply rate"
(Each stat is paired with a small abstract glyph to its right.)

Section: "Engagement models" (left-aligned title)
Three pricing-style cards in a row:
  - Audit
      "Deep-dive into your motion, data, and GTM gaps."
      $750–$1.5k
  - Sprint
      "Design and build a focused system to solve a specific GTM need."
      $3k–$8k
  - Buildout
      "End-to-end custom GTM system, built for scale."
      $10k–$25k

Closing CTA band (full-width, centered):
- Headline (serif):  "Stop renting generic GTM software."
- Sub:  "Get a custom system built for your exact motion — and actually own it."
- Button:  "Book a GTM Audit →"

Footer (very compact, single row):
- Left: wordmark "Hermes GTM   for B2B SaaS, AI companies, & ..."
- Right: nav (Service · Process · Pricing · About) and small social icons (X, LinkedIn)

### Layout
Single-column, max content width roughly 1100–1200px centered on a cream
canvas. The HERO is the only 50/50 split: text occupies the left ~55%, a tall
illustrative motif occupies the right ~45%. Every subsequent section is a
left-aligned section header followed by a horizontal grid of equal-width tiles
(3-up for capabilities/outcomes/pricing, 4-up for process). Vertical rhythm is
generous — roughly 96–128px between major sections; tighter (~24px) between a
section title and its grid. Section headers sit hard-left, no eyebrow above
them on this mock.

### Typography
- Headlines: a high-contrast modern SERIF, regular/medium weight, very tight
  tracking, slight optical-italic flair on the second line ("growth engine.").
  Hero headline ~88–104px, line-height ~1.05.
- Section titles ("What we build", "How it works", "Selected outcomes",
  "Engagement models", and the closing "Stop renting…") use the same serif at
  ~36–44px.
- Body / paragraph: a neutral SANS (geometric-humanist, e.g. Inter / Söhne
  feel), 16–18px, regular, line-height ~1.5, ink color softened ~70% opacity.
- Buttons & nav: same sans, 14–15px, medium weight, no uppercase.
- Stat numerals (80% / 3x / 45%) are SERIF, very large (~72–96px), regular.
- Tile labels are sans, 14–16px medium.
- Italic usage: subtle — appears mostly in headline accent words and possibly
  the eyebrow-style category words.

### Color palette (sampled)
- Background (canvas):    #FAF9F8  warm off-white / paper
- Primary ink:            #0B1732  near-black deep navy (used for headlines,
                                   buttons, dark accents)
- Secondary ink (body):   ~#52596C / #6A78A4  muted slate
- Illustration mid-tone:  #6A78A4 → #B1B9D4 → #BBC5E6  cool periwinkle ramp
- Illustration highlight: #FAF9F8 (cutouts breathe into bg)
There is no red/green/gold accent. Buttons are filled with the navy ink; ghost
buttons are bare text + arrow.

### Hero illustration
Right side of hero: a tall, vertically-oriented composition rendered in the
periwinkle ramp on the cream background. Reads as an architectural / mechanical
"engine" abstraction — stacked geometric forms (arches, wings, gear-like
circles, flowing ribbons), with a faint monoline label "GTM ENGINE" set
vertically. Style is flat vector with subtle gradient shading, NOT photographic
and NOT 3D-rendered; closer to a contemporary editorial illustration (think
Stripe / Linear marketing art, but softer and more painterly). Tiny iconography
elsewhere on the page (capability tiles, trust pills, process steps) is
monoline navy on cream — single 1.5px stroke, rounded joins.

### Components
- Buttons (primary): pill-shape with very generous radius (≈ height/2,
  effectively full-rounded). Filled with #0B1732, label in #FAF9F8, ~14–15px
  medium, ~14px vertical / 22px horizontal padding.
- Buttons (secondary / "See How It Works"): no fill, no border — just label +
  "→" in navy ink.
- Trust pills: outlined / hairline border in slate, fully rounded, small icon
  on the left, ~28–32px tall.
- Capability tiles: borderless on cream — icon stacked above (or inline left
  of) a single-line label. Optional very faint top divider line between rows.
- Stat cards: borderless; oversized serif numeral, small caption underneath,
  small accent glyph aligned right.
- Pricing cards: subtle hairline border (~1px slate at low opacity) with
  generous internal padding, rounded corners (~16–20px). Each has: small
  icon, tier name (sans medium), description (sans regular, body), price as
  a serif display number.
- Dividers: hairlines #BBC5E6 at low alpha; sparse — sections are mostly
  separated by whitespace, not rules.
- Eyebrows: not heavily used on this mock; section titles do the job.

### Mood (one sentence)
Confident, editorial, almost old-world-print — a quiet navy-on-cream broadside
that says "engineering studio," not "SaaS template."

---

## Mock 2 — `landing-mock-2.png` ("Systems designed around your motion")

### Verbatim copy

Top nav: same wordmark "Hermes GTM" left; nav links right.

Hero:
- Headline (serif, two lines):
    Systems designed
    around your motion.
- Sub:
    "We build custom GTM infrastructure around your ICP, data, and workflow —
    so your team can move faster, reach the right buyers, and compound every
    cycle."
- Buttons: "Book an Audit" (primary navy)  ·  "See How It Works →" (ghost)

Eyebrow above hero illustration label: "HERMES GTM / GTM INFRASTRUCTURE"
(stacked vertical caps, used as decoration on the illustration).

Section: "End-to-end GTM infrastructure." (serif title) with sub-line
"…that powers your motion. Built for scale." Below it, a 4-column row of
capability cards, each card = icon + bold label + 2-line description:
  - Prospecting Infrastructure
      "Firmographic & technographic [signal sourcing]…"
  - Research & Enrichment
      "[Account-level research, ICP enrichment, data hygiene.]"
  - Routing & Workflow Automation
      "[Lead routing, CRM sync, workflow orchestration.]"
  - Outbound Systems
      "We build outbound engines that [convert]. Multi-channel orchestration."

Section: "A collaborative build from insight to impact."
A horizontal 4-step process strip with little chevron/arrow icons:
  1. Discover  — landscape mapping
  2. Design    — architect the system
  3. Build     — end-to-end implementation
  4. Transfer  — handoff & SOPs

Section: "Everything you need to run and scale."
A 5-column row of small icon + label tiles:
  - Source Code Handoff
  - Documentation & SOPs
  - Team Training & Enablement
  - Integrations & Connections
  - Analytics & Monitoring
(each preceded by a small navy line-icon)

Testimonial block (full-width, centered or left-aligned):
- Pull quote (serif italic):
    "Hermes GTM became an extension of our team. They built the
    infrastructure that powers our entire outbound motion — clean data,
    smart routing, and systems we can actually scale."
- Attribution (sans small):
    "VP of Revenue Operations · B2B SaaS Company (Series B)"

Closing CTA band:
- Headline:  "Ready to build a system that compounds?"
- Sub:       "Let's design and build your custom GTM infrastructure."
- Button:    "Book an Audit →"  (and possibly a secondary text link)

Footer: wordmark + minimal nav, identical treatment to Mock 1.

### Layout
Same single-column page architecture as Mock 1, same canvas width, same
left-aligned section titles. Hero is again ~55/45 split with illustration on
the right. Capability and "everything you need" rows feel slightly denser than
Mock 1 (4-up and 5-up vs 3-up). The testimonial breaks rhythm by being a
near-full-width single block with no card chrome — just a large italic serif
quote sitting on the cream background.

### Typography
Identical system to Mock 1. The testimonial leans on the italic cut of the
serif. Process step numerals (1 2 3 4) appear in serif at ~28–36px, slate
color, sitting above each step label.

### Color palette
Identical to Mock 1.
- Canvas:     #FAF9F8
- Ink:        #0B1935
- Body slate: #313C5A / #6D748A
- Periwinkle ramp: #7C8499 → #B4BACC → #BBC3D8

### Hero illustration
A second tall vertical illustration on the right of the hero, same
periwinkle/cream palette, same flat-vector + soft-gradient style. Composition
includes drape-like ribbons, an arched portal/window form, and a small
monoline "GTM INFRASTRUCTURE" label oriented vertically. Different motif from
Mock 1 (more "architectural arch," less "engine"), but same illustrator's
hand.

### Components
- Buttons: identical pill style.
- Capability cards (4-up): hairline border, ~16–20px radius, generous padding,
  icon top-left, bold label, body description. Slightly more chrome than Mock
  1's borderless tiles.
- Process strip: numbered with serif numerals, joined visually by a thin
  arrow/chevron between each step.
- Testimonial: no card; just a large italic serif quote with a small icon or
  monogram and a sans attribution line. Possibly a small navy seal/wing glyph
  to the right.
- Tile row of 5: borderless, line-icon + small label, evenly spaced.

### Mood
Architectural and reassuring — the same editorial voice as Mock 1, dialed
toward "platform / infrastructure" instead of "engine / craft."

---

## Mock 3 — `landing-mock-3.png` ("Proof, not promises" — work / case-studies page)

### Verbatim copy

Top nav: wordmark left; nav right —
  Services · Process · Work · Pricing · About · Contact

Breadcrumb / sub-nav under header (sans small, slate):
  "Work / Case Studies / Audit Booking"

Hero (text left, illustration right):
- Headline (serif, two lines):
    Proof, not
    promises.
- Sub:
    "We build custom GTM systems that turn signals into pipeline.
    Measurable, repeatable, and built to compound."
- Button: "See how it works →"
- Floating illustration labels (next to art): "Signals · Meetings · Pipeline ·
  Engage · Revenue · …" (small caps tag words orbiting the diagram)

Section: three case-study tiles in a 3-up grid. Each tile contains:
- Small uppercase eyebrow tag (industry):
    "AI INFRASTRUCTURE"     "B2B SAAS"     "DEVTOOLS"
- Huge serif stat: 80%   ·   3x   ·   45%
- Single-line caption under stat:
    "less manual research"    "more qualified pipeline"
    "increase in reply rate"
- 2-line body description:
    "Automated account research and prioritization across 5,000+ accounts."
    "Built an outbound engine that increased opportunities and improved
     close rate."
    "Rewrote positioning and sequences to earn replies — not just opens."
- Link: "→ Read case study"

Section: "What clients actually get" (serif title, left)
Five borderless tiles in a row:
  - A working system
      "End-to-end GTM system built for your ICP, offer, and motion."
  - Source code
      "No black boxes. You own the system, assets, and intellectual property."
  - Documentation
      "Clear operating docs so your team can run it confidently."
  - Training
      "Enable your team with walkthroughs and playbooks built around your
       stack."
  - Iteration support
      "We refine, test, and improve based on real market feedback."

Section: "Engagement options"  (with link "Compare all options →" at right)
Three pricing cards, same trio as Mock 1:
  - Audit       — "End-to-end deep-dive into your motion, data, and GTM gaps."
                  $750–$1.5k · 2–5 days · Deliverable: Audit Report
  - Sprint      — (label visible, full body cut by OCR but mirrors Mock 1)
                  $3k–$8k · 1–2 weeks · Deliverable: Working System
  - Buildout    — "End-to-end custom GTM system, built for scale."
                  $10k–$25k · 3–8 weeks · Deliverable: Full System + Handoff

Section: "Request your GTM audit" (serif title) — a 50/50 split:
- Left: paragraph
    "Tell us about your motion and challenges. We'll review and get back
    within 1 business day."
  Plus three trust pills:
    "Tailored to your business"  ·  "No sales pitch"  ·  "Confidential"
- Right: short contact form with fields (Name, Work email, Company,
  "What's your biggest GTM challenge right now?") and a primary "Book audit"
  button. Below the button: micro-copy "No spam. Ever."

Footer (the only mock with a full footer):
- Left column: wordmark + tagline
    "Custom GTM systems engineering for B2B SaaS, AI companies, and
    technical ventures."
  Plus location: "San Francisco, CA"
- Three link columns:
    Services:  Audit · Sprint · Buildout
    Process:   How it works · Methodology
    Company:   About · Work · Contact
- Bottom bar:
    "© 2026 Hermes GTM LLC. All rights reserved.   Privacy Policy · Terms of
    Service"

### Layout
Same canvas, same single-column architecture. Three-up tile grid for case
studies; five-up for "what clients get"; three-up for pricing. The contact
section introduces the only true two-column form layout in the system. Footer
is a 4-column grid (brand block + 3 link columns).

### Typography
Identical system. Notable additions on this page:
- All-caps eyebrow tags ("AI INFRASTRUCTURE", "B2B SAAS", "DEVTOOLS") in sans,
  ~11–12px, generous letter-spacing (~0.12em), slate color.
- Stat numerals at very large serif size (~88–112px), each paired with a tiny
  glyph (×, ↑, %) that sits beside or above the numeral.
- Form labels and inputs: sans 14–15px on cream, hairline-bordered inputs.

### Color palette
Identical to Mocks 1 & 2.

### Hero illustration
A relational diagram on the right of the hero — a central dark navy node
("Hermes GTM" wing/wordmark) with arcing lines fanning out to small periwinkle
chips labeled "Signals", "Meetings", "Pipeline", "Engage", "Revenue", etc.
Same flat-vector, soft-gradient style as Mocks 1 & 2. Reads as a "system
graph" or "constellation."

Tile icons across the page are again monoline 1.5px navy, occasionally with a
single periwinkle fill shape behind them.

### Components
- Buttons: same pill primary, same ghost secondary.
- Eyebrow tags: small uppercase, letter-spaced sans, no background — just text,
  often preceded by a tiny dot or icon.
- Case-study tiles: borderless, vertically stacked content, separated only by
  generous whitespace and (optionally) a hairline divider above each tile.
- "What clients get" tiles: borderless 5-up, icon top-left, label medium sans,
  body 2 lines.
- Pricing cards: hairline border ~1px low-alpha slate, ~16–20px radius. Header
  row = small icon + tier name. Then 1-line description. Then large serif
  price. Then small meta line (timeline · deliverable).
- Form: cream background, hairline 1px borders on inputs, ~10px radius (less
  rounded than buttons), label above field, primary pill button at bottom.
- Footer: thin top divider, 4-column grid, small sans (~13px), generous line
  height. Bottom bar uses ~12px slate.

### Mood
Quietly evidential — "we have receipts" — same editorial calm as the other
two, with case-study density doing the work instead of marketing language.

---

## Shared design tokens (cross-cutting, drives the CSS rewrite)

### Color
    --bg            #FAF9F8   warm off-white / paper canvas
    --ink           #0B1732   primary text, headlines, button fills
    --ink-2         #1B274A   slightly softer navy (hover, deep accent)
    --slate-700     #313C5A   strong body text
    --slate-500     #52596C   secondary body
    --slate-400     #6A78A4   muted text / icon outlines
    --periwinkle-300 #7C8499  illustration mid
    --periwinkle-200 #B1B9D4  illustration light
    --periwinkle-100 #BBC5E6  illustration highlight / hairlines
    --hairline      rgba(11,23,50,0.10)   dividers, card borders, input borders

There is NO accent hue. Do not introduce green/red/gold. The whole brand
lives in navy + cream + cool periwinkle tints.

### Typography
- Display / Headline / Section title: a high-contrast modern SERIF.
  Recommended stack: "Tiempos Headline", "Söhne Breit", "GT Sectra",
  "Canela", "Domaine Display", Georgia, serif.
  Weights used: Regular (400), occasional Medium (500). Italics used
  sparingly for emphasis and for pull-quotes.
  Sizes: hero 88–104px / line-height 1.05 / tracking -0.01em;
         section title 36–44px;
         large stat 72–112px.
- Body / UI: a neutral GROTESQUE/HUMANIST SANS.
  Recommended stack: "Söhne", "Inter", "Neue Haas Grotesk", system-ui,
  sans-serif.
  Body 16–18px / line-height 1.5;
  UI label 14–15px medium;
  Eyebrow caps 11–12px, letter-spacing 0.10–0.14em, uppercase, slate-500.

### Spacing & layout
- Page max content width ~1180px, centered, side gutters 24–32px on desktop.
- Section vertical rhythm: 96–128px between major sections.
- Inside a section: 24px between section title and grid; 24–32px gap inside
  grids.
- Hero is a 55/45 split (text/illustration) on desktop; stacks on mobile.
- Tile grids: 3-up, 4-up, and 5-up are all used. Borderless tiles are the
  default; only pricing cards and "infrastructure capability" cards (Mock 2)
  use a hairline border.

### Components
- Primary button: pill (border-radius = full / 999px), filled --ink,
  label --bg, sans 14–15px medium, padding ~14px / 22px, no shadow.
- Ghost button / link: bare label + "→" in --ink, no background, no border.
- Trust pill: hairline border, full pill radius, ~28–32px tall, small icon
  + label.
- Card (pricing / capability): hairline border --hairline, radius 16–20px,
  padding 28–32px, no shadow.
- Divider: 1px --hairline, used sparingly — whitespace is the primary
  separator.
- Icons: monoline, 1.5px stroke, navy ink on cream, rounded joins. Some
  tiles use a single periwinkle fill shape behind the icon for emphasis.
- Wordmark: "Hermes GTM" in the SERIF, with a small angular pennant /
  paper-airplane / wing glyph to the left of the word.

### Illustration system
Flat vector forms in the periwinkle ramp on cream, with subtle linear
gradients for depth (no hard shadows, no 3D, no photography). Motifs across
the three mocks: an "engine" (Mock 1), an architectural arch / draped form
(Mock 2), and a relational graph of labeled chips around a central navy
node (Mock 3). Each illustration has a small monoline ALL-CAPS vertical
label as a decorative wayfinder ("GTM ENGINE", "GTM INFRASTRUCTURE",
"HERMES GTM").

### Voice/feel of the system
Editorial, confident, near-monochrome. Reads as a small engineering studio's
broadside, not a SaaS template. The serif headlines + cream paper + a single
cool illustration accent are doing 90% of the brand work; the UI is
deliberately quiet so the words and the illustration carry the page.
