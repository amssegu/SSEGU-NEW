# SSEG(U) Website Design System

**Version:** 1.0\
**Reference:** Screenshot supplied in the conversation\
**Design direction:** Contemporary Editorial Broadsheet\
**Product type:** Ugandan digital news publication

> This document translates the supplied homepage reference into reusable
> visual and implementation guidelines. Colour values and dimensions are
> approximate estimates from the screenshot, not extracted source
> tokens.

## 1. Design direction

The interface combines the authority and typography of a traditional
newspaper with the navigation and modular content layout of a modern
digital publication.

Core principles:

-   **Editorial first:** headlines and reporting lead the visual
    hierarchy.
-   **Purple-led identity:** purple is the primary brand colour,
    supported by white and restrained neutrals.
-   **Photography-driven:** authentic editorial images give stories
    prominence.
-   **Information-rich:** show several useful stories without excessive
    whitespace.
-   **Clear hierarchy:** one dominant lead story, supporting stories and
    a concise sidebar.
-   \*\* restrained decoration:\*\* square or subtly rounded corners,
    fine borders and minimal shadows.
-   **Local relevance:** prioritise Ugandan stories, institutions,
    places, currency and context.

The site should feel like a serious publication, not a generic blog,
SaaS dashboard or social feed.

## 2. Colour palette

The following values are practical approximations based on the
reference.

### Brand colours

  --------------------------------------------------------------------------
  Token                      Hex                     Use
  -------------------------- ----------------------- -----------------------
  `--color-primary`          `#32165F`               Main brand purple,
                                                     utility bar, strong
                                                     panels

  `--color-primary-strong`   `#521A8A`               Navigation active
                                                     state, buttons, panel
                                                     headers

  `--color-accent`           `#7026A8`               Links, highlights and
                                                     secondary emphasis

  `--color-lavender`         `#EEE5F6`               Icon backgrounds and
                                                     subtle brand surfaces
  --------------------------------------------------------------------------

### Neutral colours

  Token                    Hex         Use
  ------------------------ ----------- --------------------------------------
  `--color-background`     `#FFFFFF`   Main page background
  `--color-surface`        `#F7F6FA`   Subtle panels and alternate surfaces
  `--color-border`         `#E4E0EB`   Dividers and component borders
  `--color-text`           `#161323`   Main text and headlines
  `--color-text-muted`     `#555267`   Metadata and secondary text
  `--color-text-inverse`   `#FFFFFF`   Text on dark backgrounds

### Functional/category colours

  Token                  Hex         Use
  ---------------------- ----------- -------------------------
  `--color-breaking`     `#E51D2A`   Breaking-news indicator
  `--color-business`     `#0875E8`   Business category
  `--color-technology`   `#159447`   Technology category
  `--color-sports`       `#EF741B`   Sports category
  Education              `#521A8A`   Education category
  Politics               `#7026A8`   Politics category

Category colours are accents, not competing brand colours. Use them
primarily for small category labels and indicators. Purple remains the
overarching identity.

## 3. Typography

Use two complementary type families:

-   **Editorial:** Merriweather for headlines and section titles.
-   **Interface:** Inter for navigation, body copy, metadata, labels and
    controls.

Recommended fallbacks:

``` css
--font-editorial: "Merriweather", Georgia, serif;
--font-interface: "Inter", Arial, sans-serif;
```

Suggested Google Fonts import:

``` css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:wght@400;700;900&display=swap");
```

### Type scale

  Token       Desktop size     Weight Typical use
  --------- -------------- ---------- -------------------------------------
  Display         42--46px   700--900 Homepage lead headline
  H1                  32px   700--900 Article title
  H2                  25px        700 Section heading
  H3                  21px        700 Story headline
  H4                  17px        700 Compact story headline
  Body                16px        400 Summary and article text
  Small               14px   400--500 Metadata and supporting text
  Micro               12px        700 Category labels and compact details

Typography rules:

-   Headlines use a tight line-height of approximately `1.1–1.25`.
-   Body copy uses a more relaxed line-height of approximately
    `1.45–1.65`.
-   Keep headlines readable and editorial; avoid overly condensed or
    decorative display fonts.
-   Use bold sans-serif typography for navigation and interface labels.
-   Do not use serif typography for every element. The contrast between
    editorial and interface type is intentional.

## 4. Layout and grid

### Desktop homepage

Use a centred content container with a maximum width of approximately
`1570px`.

The reference homepage has three principal content areas:

1.  **Lead story:** the dominant photographic feature.
2.  **Secondary stories:** a vertical list of supporting stories with
    thumbnails.
3.  **Sidebar:** top stories, newsletter and section shortcuts.

A 12-column grid is a useful implementation model. The approximate
visual proportions are 55% lead story, 30% secondary stories and 15%
sidebar. Adjust the exact column widths to fit the available container
and gaps.

### Layout measurements

  Element                       Recommended value
  --------------------------- -------------------
  Maximum content width                    1570px
  Desktop page gutter                    48--52px
  Main content gap                           24px
  Utility bar height                         38px
  Brand header height                       120px
  Primary navigation height                  52px
  Breaking ticker height                     46px
  Main section gap                           32px

These are starting values. At narrower desktop widths, reduce gutters
and gaps before allowing content to become cramped.

### Homepage sequence

1.  Utility bar: date, local weather and utility links.
2.  Brand header: logo/tagline and optional advertisement.
3.  Primary navigation: home and publication categories.
4.  Breaking-news ticker.
5.  Main news area: lead story, secondary stories and sidebar.
6.  Additional news sections and story grids.
7.  Footer and publication information.

## 5. Spacing, borders and elevation

The design is compact and structured. Avoid oversized padding and
excessive whitespace.

### Spacing scale

  Token            Value
  -------------- -------
  `--space-1`        4px
  `--space-2`        8px
  `--space-3`       12px
  `--space-4`       16px
  `--space-5`       20px
  `--space-6`       24px
  `--space-8`       32px
  `--space-10`      40px

### Shape and elevation

  Token              Value
  ------------------ -----------------------------------
  Small radius       2px
  Medium radius      4px
  Large radius       8px
  Subtle shadow      `0 1px 3px rgba(20, 10, 40, .08)`
  Standard divider   `1px solid #E4E0EB`

Prefer square or subtly rounded corners. Use shadows sparingly. Avoid
glassmorphism, floating-card effects, large pill shapes and decorative
gradients that weaken the newspaper aesthetic.

## 6. Core components

### 6.1 Utility bar

-   Full-width deep-purple background.
-   Compact white text and small icons.
-   Date and local weather on the left.
-   About, Contact, Advertise and social/search links on the right.
-   Hide or simplify nonessential details on mobile.

### 6.2 Brand header

-   Publication logo and tagline on the left.
-   Optional advertisement banner on the right.
-   White background with generous horizontal alignment.
-   Preserve the logo's proportions and clear space.
-   On mobile, prioritise the logo and move or hide the advertisement.

### 6.3 Primary navigation

-   Horizontal category navigation on desktop.
-   Active item uses a solid purple background and white text.
-   Inactive items use dark text on a light surface.
-   Dropdown indicators should be subtle and consistent.
-   Tablet navigation may scroll horizontally.
-   Mobile navigation should use a menu button and accessible drawer or
    panel.

### 6.4 Breaking-news ticker

-   Red breaking-news label.
-   Pale or white background.
-   Bold, readable headline.
-   Optional directional arrow or next-story control.
-   Use a thin divider or border to separate it from navigation and
    content.
-   On mobile, keep the ticker compact and horizontally manageable.

### 6.5 Lead story card

This is the primary visual anchor of the homepage.

-   Large landscape image, normally 16:9.
-   Image fills the card using `object-fit: cover`.
-   Dark gradient overlay near the bottom for text contrast.
-   Category badge above the headline.
-   Large white serif headline.
-   Short white summary.
-   Timestamp, comment count and reading link at the bottom.
-   Keep the card's geometry simple; avoid excessive rounding.

### 6.6 Compact story card

-   Thumbnail on the left, text on the right.
-   Thumbnail normally 4:3.
-   Category label in its assigned category colour.
-   Serif headline, approximately 17--21px.
-   Compact timestamp and optional metadata.
-   Fine horizontal divider between adjacent stories.
-   Ensure the image and text remain aligned at different headline
    lengths.

### 6.7 Top stories sidebar

-   White panel with a purple title bar.
-   Numbered list of trending or important stories.
-   Strong, clearly aligned numbers.
-   Compact headlines with readable line spacing.
-   Fine horizontal separators.
-   Five entries are appropriate for the initial homepage view.

### 6.8 Newsletter panel

-   Solid purple background.
-   White envelope or newsletter icon.
-   Short heading and supporting sentence.
-   Email input and clearly labelled subscribe button.
-   Keep the form compact and ensure visible focus and error states.

### 6.9 Section shortcuts

-   Circular pale-lavender icon backgrounds.
-   Purple icons.
-   Short labels beneath icons.
-   Examples: News, Jobs, Study and More.
-   Use consistent icon sizing and spacing.

### 6.10 More-news section

-   Clear section heading with a short purple vertical accent or rule.
-   Optional "View all" link aligned to the opposite edge.
-   Responsive story-card grid.
-   Consistent image ratios and headline treatment.

## 7. Imagery

Photography is a major part of the publication's identity.

Preferred image subjects include:

-   Kampala and other Ugandan cityscapes.
-   Government, public institutions and civic affairs.
-   Ugandan businesses, markets and financial activity.
-   Schools, universities and education.
-   Technology, software and local startups.
-   Ugandan sports and cultural events.

Image direction:

-   Use realistic, credible editorial photography.
-   Prefer authentic local context over generic international stock
    imagery.
-   Avoid visibly artificial, overly polished or misleading images.
-   Use consistent cropping and focal-point positioning.
-   Do not use an image that implies an event or person was present when
    that is not established.
-   Provide meaningful alternative text where an image conveys
    information; use empty alt text for purely decorative images.

### Image ratios

  Component                   Ratio
  --------------------------- -------
  Lead story                  16:9
  Secondary story thumbnail   4:3
  More-news card              16:9
  Article featured image      16:9
  Small thumbnail             4:3

Use `object-fit: cover` and define predictable image containers to
prevent layout shifts.

## 8. Responsive behaviour

The desktop composition should adapt rather than simply shrink.

  Element             Desktop            Tablet                  Mobile
  ------------------- ------------------ ----------------------- -------------------
  Utility bar         Full               Compact                 Hidden or minimal
  Brand header        Logo + advert      Logo + smaller advert   Logo first
  Navigation          Horizontal         Scrollable              Menu drawer
  Breaking ticker     Full               Full                    Compact
  Lead story          Large feature      Large feature           Full width
  Secondary stories   Beside lead        Below or beside lead    Stacked
  Sidebar             Right column       Below main stories      Below content
  More-news grid      Multiple columns   Two columns             One column

Suggested breakpoints:

``` css
/* Mobile */
@media (max-width: 640px) {}

/* Tablet */
@media (min-width: 641px) and (max-width: 1023px) {}

/* Desktop */
@media (min-width: 1024px) {}

/* Wide desktop */
@media (min-width: 1440px) {}
```

Responsive requirements:

-   Prevent horizontal page overflow.
-   Keep headlines readable without awkward truncation.
-   Stack the main homepage columns in a deliberate editorial order.
-   Make navigation, forms and controls usable by touch.
-   Preserve adequate contrast and visible keyboard focus.
-   Avoid hiding important story content solely to preserve the desktop
    layout.

## 9. Accessibility and interaction

-   Use semantic landmarks: `header`, `nav`, `main`, `aside`, `section`
    and `footer`.
-   Maintain a logical heading hierarchy.
-   Give links and buttons descriptive accessible names.
-   Ensure all interactive controls work with a keyboard.
-   Provide visible focus states.
-   Do not rely on category colour alone to communicate meaning; include
    text labels.
-   Maintain sufficient text/background contrast.
-   Use appropriate labels and validation messages for forms.
-   Respect reduced-motion preferences if the ticker or other elements
    animate.
-   Make dropdowns and mobile navigation accessible to keyboard and
    assistive-technology users.

## 10. CSS design tokens

A starting token sheet for implementation:

``` css
:root {
  /* Brand */
  --color-primary: #32165F;
  --color-primary-strong: #521A8A;
  --color-accent: #7026A8;
  --color-lavender: #EEE5F6;

  /* Surfaces */
  --color-background: #FFFFFF;
  --color-surface: #F7F6FA;
  --color-border: #E4E0EB;

  /* Text */
  --color-text: #161323;
  --color-text-muted: #555267;
  --color-text-inverse: #FFFFFF;

  /* Functional */
  --color-breaking: #E51D2A;
  --color-business: #0875E8;
  --color-technology: #159447;
  --color-sports: #EF741B;

  /* Typography */
  --font-editorial: "Merriweather", Georgia, serif;
  --font-interface: "Inter", Arial, sans-serif;

  /* Layout */
  --container-width: 1570px;
  --page-gutter: 24px;
  --content-gap: 24px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  /* Shape */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;

  /* Elevation */
  --shadow-subtle: 0 1px 3px rgba(20, 10, 40, .08);
}

.container {
  width: min(
    calc(100% - 2 * var(--page-gutter)),
    var(--container-width)
  );
  margin-inline: auto;
}

.editorial-heading {
  font-family: var(--font-editorial);
  font-weight: 700;
  line-height: 1.2;
}

.interface-text {
  font-family: var(--font-interface);
}
```

## 11. Suggested component architecture

A framework-agnostic component breakdown suitable for a Next.js
implementation:

``` text
src/
├── components/
│   ├── layout/
│   │   ├── UtilityBar
│   │   ├── BrandHeader
│   │   ├── PrimaryNavigation
│   │   ├── BreakingNewsTicker
│   │   └── Footer
│   │
│   ├── news/
│   │   ├── LeadStory
│   │   ├── CompactStory
│   │   ├── StoryCard
│   │   ├── StoryGrid
│   │   ├── CategoryBadge
│   │   └── ArticleMetadata
│   │
│   ├── sidebar/
│   │   ├── TopStories
│   │   ├── Newsletter
│   │   └── SectionShortcuts
│   │
│   └── common/
│       ├── SectionHeading
│       ├── Advertisement
│       └── Pagination
│
├── app/
│   ├── page.tsx
│   ├── news/
│   ├── business/
│   ├── politics/
│   ├── technology/
│   └── article/
│
└── styles/
    └── design-tokens.css
```

Treat these as suggested component boundaries, not mandatory filenames.
Components should receive content through props or the site's content
layer rather than hardcoding article data into presentation components.

## 12. Design quality checklist

Before considering a page complete, check the following:

-   [ ] Purple is the dominant brand colour; category colours remain
    secondary.
-   [ ] Editorial headlines use the serif typeface.
-   [ ] Interface text uses the sans-serif typeface.
-   [ ] The lead story is visually dominant on the homepage.
-   [ ] Story thumbnails use consistent aspect ratios and cropping.
-   [ ] The desktop layout has a clear lead, supporting stories and
    sidebar hierarchy.
-   [ ] Borders and shadows are restrained.
-   [ ] Navigation and breaking-news ticker remain clear and usable.
-   [ ] Mobile content is intentionally reordered and readable.
-   [ ] Forms, links and controls have accessible labels and focus
    states.
-   [ ] Images have appropriate alternative text.
-   [ ] No horizontal overflow or avoidable layout shifts occur.

## 13. Design summary

**Identity:** Contemporary Editorial Broadsheet\
**Visual character:** Purple-led, photography-driven, information-dense
and newspaper-inspired\
**Primary type pairing:** Merriweather + Inter\
**Primary layout:** Three-part desktop news composition with a dominant
lead story\
**Surface language:** White and pale neutral backgrounds, fine dividers,
restrained shadows and small corner radii\
**Editorial priority:** Clear headlines, credible imagery, local
relevance and accessible navigation

When making design decisions not explicitly covered here, favour
editorial clarity, consistency and usability over decorative novelty.
