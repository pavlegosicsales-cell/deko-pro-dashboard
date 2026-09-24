---
name: website-build-rules
description: Step 2 of 3 in the website build system. Builds a complete client website in one shot — home page, contact page with a wizard form, and a privacy policy page — with all design and copy standards baked in. Trigger when the user says they're ready to build, asks to "build the site", "start the build", or wants to turn client info into a finished website.
---

# Website Build Rules — Step 2 of 3

This is part of a three-skill website build system:

1. **Client Info Gathering** — gather all client info, set up the project folder
2. **Website Build Rules** (this skill) — build the site in one shot with all standards baked in
3. **Form Backend Setup** — wire up the contact form with branded email notifications

This skill runs one big build pass. It reads the client context from Step 1, confirms any gaps, then builds a complete starting site — home page, contact page with a wizard form, and a privacy page. All design and copy rules below are applied automatically without being asked.

---

## Step 1 — Find the context file

Ask: "Do you have a `context.md` from the client info gathering step? What's the path?"

Read it. If it does not exist, offer to gather the key info now:
- Business name, services, location, phone, email, brand colours, social proof
- This does not need to be as thorough as Skill 01 — just enough to build

Do not start the build until you have at minimum: business name, services, location, brand colours, phone, and email.

---

## Step 2 — Confirm scope and location

Unless the user says otherwise, build:
- `index.html` — home page
- `contact.html` — contact page with a wizard form
- `privacy.html` — privacy policy page
- `styles.css` — all styles
- `main.js` — mobile nav toggle, wizard form logic, form submission

Ask: "Should I add any other pages to this first build, or just home, contact, and privacy?"

Ask: "Where should I write the files? The project folder from Step 1, or somewhere else?" If using the Step 1 folder, confirm the path.

Build everything in one pass. Do not write one file and ask for feedback before continuing.

---

## Step 3 — Build: structure and file rules

- Semantic HTML5: `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`
- CSS custom properties for all brand tokens in `:root`
- One external stylesheet (`styles.css`), one external script (`main.js`)
- No CSS frameworks, no JS libraries unless the user explicitly asks
- All image paths are relative: `images/hero.jpg`, `images/logo.svg` etc.
- Placeholder `src` on images that have not been supplied yet — comment the placeholder clearly
- Clean lowercase filenames, no spaces

---

## Step 4 — Build: design rules

Apply every rule below without being asked. These are the house standards.

### No generic AI layouts

Do not build:
- A grid of three or four identical cards with rounded corners and a drop shadow as the main content block
- A "features" row of icon + heading + two-sentence description repeated three times
- A "Why choose us" section with a bullet-point grid and tick icons
- A hero with a floating card overlay (`box-shadow: 0 4px 24px rgba(0,0,0,0.1)`, `border-radius: 16px`)
- A testimonials carousel with star ratings and grey avatar circles

These patterns are the default output of AI that did not read the brand. They look the same on every site. Do not use them.

### Use image-led sections instead

- The hero has a full-bleed background image (`background-image`, `object-fit: cover`) — use `images/hero.jpg` as a placeholder if no image has been provided, with a comment
- Photo-led proof sections: a real job photo takes up space, a card grid does not
- Services are not cards. They can be a list, a two-column layout with an image, a full-width section with a heading and short paragraph — whatever suits the brand
- Every section that warrants a photo gets one, even if it is a placeholder

### Typography

- Do not default to Playfair Display + Inter — that combination is the first thing AI reaches for and it looks generic
- Choose fonts that match the actual brand. A trade or local service business is direct and plain — a headline serif is usually wrong
- Use Google Fonts only when they genuinely suit the client; not every site needs a Google Font
- Body text: 16–17px minimum, 1.55–1.65 line height
- Heading scale using `clamp()` so it flows on all screen widths without breakpoints
- Limit font weights in use: pick two (e.g. 400 and 700), not four

### Spacing and layout

- Generous vertical rhythm: sections breathe
- Minimum `padding: 80px 0` on every section at desktop width
- Do not stack content tight — whitespace is part of the design, not wasted space
- Max content width: `min(1120px, 90%)` centered — adjust for the brand, do not go wider than 1200px

### Colour

- Use the brand colours from `context.md`. Do not invent extra colours.
- One primary CTA colour. One.
- Check contrast: white text needs a dark enough background to pass WCAG AA (4.5:1 for body, 3:1 for large text)

---

## Step 5 — Build: copy rules

Apply to every word written on the site. These are non-negotiable.

### Hard bans

- Em-dashes (`—`) — use a comma, colon, or period instead
- "Delve into", "tapestry", "harnessing", "leverage", "seamlessly", "game-changing", "revolutionize", "cutting-edge", "at the end of the day", "it's worth noting", "in today's fast-paced world", "look no further", "unlock your potential"
- "Learn more" or "Click here" as CTA labels — use action verbs that say what happens: "Get a quote", "Call us now", "Book a visit", "See our work"
- Alt text as a description of a stock photo concept ("two professionals shaking hands in an office") — describe the actual subject, or use a clear placeholder: `alt="[Electrician working on switchboard — placeholder]"`
- Price-based claims ("cheapest", "lowest prices") unless the client specifically asked for them

### Voice

- Match the client's tone from `context.md`
- Trade and local service businesses talk plain and direct — no flowery adjectives, no corporate waffle
- One clear message per section — do not cram two or three selling points into one paragraph
- Real numbers: review count, years in business, suburbs covered — use the figures from `context.md`, not made-up ones
- Write in second person where it makes sense: "We'll come to you" beats "Customers can expect our team to arrive"

---

## Step 6 — Build: SEO rules

Apply to every page.

- Unique `<title>` per page: `[Page Topic] | [Business Name]` — under 60 characters, written from scratch, not a placeholder
- Unique `<meta name="description">` per page — 140–155 characters, active voice, includes a keyword naturally
- One `<h1>` per page
- Heading hierarchy: H1 > H2 > H3, no skipped levels
- `alt` attribute on every `<img>` — never empty on a content image
- `<html lang="en">`
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Canonical `<link rel="canonical" href="...">` on each page pointing to itself

---

## Step 7 — Build: responsive rules

- Mobile-first: base styles for mobile, desktop overrides in `@media (min-width: 768px)`
- No horizontal scroll at any screen width — check all sections
- Mobile nav: hamburger icon (three lines) that toggles a full-width menu. Wire it in `main.js`. The menu must actually open and close.
- Tap targets: all buttons and links minimum 44px tall on mobile
- `max-width: 100%` on all `<img>` elements
- Body font minimum 16px — do not use `font-size: 14px` for body copy on mobile

---

## Step 8 — Build: contact page wizard form

The contact form is a multi-step wizard, not a single-page form. This is the standard for every site.

**Structure:**
- Steps 1–N: button-choice questions only (user taps a card, no typing required)
- Final step: text fields only (name, phone, email, and optional message)
- Progress bar or step dots across the top
- "Back" button on every step after the first
- "Continue" button advances to the next step; tapping a single-choice card auto-advances
- Submit button is disabled while the request is in flight (add `disabled` on submit)
- On success: show an inline confirmation message — do not redirect to another page
- The form posts to a `const ENDPOINT = ''` constant at the top of `main.js` — leave it empty, clearly commented: `// Paste the Apps Script URL here after running Skill 03`

**Typical step structure — adapt to the client's services:**
1. "What can we help with?" — service type choices from context.md
2. "Where is the job?" — suburb / area (a free-text input is fine here)
3. "When are you looking to get started?" — timing choices (Urgently / Within a month / Just planning ahead)
4. "Your details" — name, phone, email, optional message

Adjust the questions and choices based on the actual services in context.md. Keep each step to one clear question.

---

## Step 9 — Build: privacy policy page

Boilerplate Australian small business privacy policy, styled to match the site.

Include:
- What is collected: name, email, phone (via the contact form)
- How it is used: to respond to enquiries only
- Storage: data is not sold or shared with third parties
- Right to request deletion: email to [client email from context.md]
- Last updated: [today's date]

Link the privacy page in the footer of every page.

---

## Step 10 — Check before handing over

Before saying the build is done, run through this list:

- [ ] Every `<title>` is written, unique, under 60 characters
- [ ] Every `<meta name="description">` is written, unique, 140–155 characters
- [ ] One `<h1>` per page
- [ ] Every `<img>` has a real `alt` attribute
- [ ] Zero em-dashes in any copy
- [ ] No banned phrases in any copy
- [ ] Mobile nav opens and closes
- [ ] Wizard form: Back button works on every non-first step
- [ ] Wizard form: `ENDPOINT` is empty and clearly labelled as a placeholder
- [ ] Privacy page is linked in every footer
- [ ] All files are in the correct project folder

---

## Step 11 — Hand off to Skill 03

Once the build passes the checklist:

> "Site is built. Home page, contact page (with the wizard form), and privacy policy are all in `[project folder path]`. The contact form has a placeholder endpoint — run the **Form Backend Setup** skill (Skill 03) to generate the Apps Script and wire it up."
