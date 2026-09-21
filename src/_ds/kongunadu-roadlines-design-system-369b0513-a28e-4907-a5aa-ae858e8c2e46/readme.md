# Kongunadu Roadlines Design System

Kongunadu Road Lines is a Tamil Nadu road-transport company (est. 1980, HQ Chennai, operations from Namakkal, branches at state capitals) specialising in gas and hazardous-goods haulage: liquid cryogenics (oxygen, nitrogen, argon), reefer containers and trailers, CNG/LNG cascades and tankers, bulk LPG/propane, fuel tankers, 40-foot semi/low/high-bed trailers, open trucks, and emergency medical oxygen. ISO 9001:2008 certified; holds all hazardous-goods licences.

One surface is represented: the public service catalogue / storefront (currently hosted on IndiaMART). This system gives it an owned brand identity derived from the fleet livery.

## Sources
- IndiaMART seller listing: https://www.indiamart.com/kongunaduroadlines/transportation-service.html#8504971733 (product names, specs, About Us copy, phone)
- Attached folder `kongunadu roadlines/` — four fleet photos (500×500 webp) showing the livery: cryogenic tanker, emergency medical truck, fuel tanker, refrigerated container. Copied to `assets/images/`.
- Logo supplied by the user as `uploads/Untitled-1-01.png` (8000×4500). Cropped to `assets/logo.png` (transparent), `assets/logo-1600.png` (web size) and `assets/logo-inverse.png` (green→white for dark/green grounds). Brand green and red are sampled from it.

## Content fundamentals
- Voice: first-person plural, formal Indian B2B register ("We are engaged in providing…", "Being a client-centric firm…"). Address the customer as "our clients"/"you" in CTAs.
- Casing: Title Case for service names ("Fuel Transportation Service"); sentence case for body. Labels and buttons are uppercase by component styling, so write them in sentence case in source.
- CTAs are short and marketplace-direct: "Get Best Price", "Call Now", "WhatsApp".
- Facts-forward: spec lists (Starting location, Destination, Service charges, Duration), certifications (ISO 9001:2008, GST), year (1980). Keep these as key/value pairs, not prose.
- No emoji. No exclamation marks. Prices in ₹ with Indian units ("₹50,000 to 5 Lac").
- Example hero: "Gas & hazardous goods road transport across India." Example body: "We undertake all hazardous goods transportation as we have all valid licences for the transportation."

## Visual foundations
- **Colour**: white ground (tanker bodywork), logo green `--kr-green-700 #00623F` as brand/primary, logo red `--kr-red-600 #D91619` as accent for contact actions and the ROAD LINES line only. Saffron `--kr-saffron-500` + steel `--kr-steel-900` come from bumper chevrons/HAZCHEM placards and are used for a hazard stripe rule and warnings. Neutrals are warm greys. Inverse surfaces are steel-blue-black, not pure black.
- **Type**: Archivo 700/800 display (uppercase for wordmark, labels, buttons; tight -0.02em for headlines), Source Sans 3 body 16/1.5, The logo letterforms are a wide bold grotesque (both KONGUNADU and ROAD LINES); `--font-brand` = Archivo at `font-stretch:125%` 800 is the nearest Google Fonts match for type-only lettering. Spectral serif is an optional italic accent for ledes/quotes. Fonts are Google substitutions — supply the logo typeface if known.
- **Spacing**: 4px base; sections 56–64px; container 1200px; gutter 24px.
- **Shape**: squared and industrial. Radii 0–6px; only Tag is a pill. Borders 1px warm grey; inputs and secondary buttons 2px.
- **Elevation**: flat by default. `--shadow-sm` for raised cards, `--shadow-md` on hover/dropdowns, `--shadow-lg` for dialogs/toasts. No inner shadows, no blur/glass.
- **Backgrounds**: solid white, `--surface-muted` grey bands, steel inverse bands. No gradients except the two decorative rules: green/red split (72/28) and saffron/steel 135° chevron stripe. Never place text over the stripe.
- **Imagery**: daylight fleet photography, white vehicles, warm Indian roadside colour. No filters, no B&W, no grain. Photos sit in 4:3 frames.
- **Motion**: 120–200ms ease-out; hover = darker fill (primary) or tint (secondary/ghost); raised cards lift 2px; press = 1px translateY. No bounces, no fades on load.
- **Focus**: 3px green ring at 35% alpha.
- **Cards**: white, 1px grey border, 6px radius; inverse card has a 4px green top rule; dialog has a 6px green top rule; toast has a 4px status left rule (the one left-rule exception, on a dark surface).

## Iconography
No icon assets exist in the source. **Lucide** (stroke 2.25, CDN `lucide@0.460.0`) is used as a substitute for its plain industrial line style; used in cards/UI kit via a small `I(name,size)` helper. Icons needed: phone, message-circle, search, map-pin, menu, x, arrow-right. No icon font, no emoji, no unicode glyph icons (the × in Tag/Dialog close is the only typographic glyph). Replace with the brand's own set if one exists.

## Components (`components/`)
- core/: Button, IconButton, Badge, Tag, Card
- forms/: Input, Select, Checkbox, Radio, Switch
- navigation/: Tabs
- feedback/: Dialog, Toast, Tooltip
- brand/: Wordmark, ServiceCard

Intentional additions (no source component library exists): **Wordmark** — the logo image with inverse variant; **ServiceCard** — the catalogue listing unit from the IndiaMART page (photo, title, specs, Get Best Price, Call).

## Index
- `styles.css` → `tokens/` (fonts, colors, typography, spacing, base)
- `guidelines/` — 15 specimen cards (Colors, Type, Spacing, Brand)
- `components/<group>/` — jsx + d.ts + prompt.md + one card per group
- `ui_kits/website/` — storefront recreation (index.html + Header/Hero/Services/About/Footer.jsx + data.js)
- `assets/logo.png`, `assets/logo-1600.png`, `assets/logo-inverse.png` — logo
- `assets/images/` — four livery photos
- `thumbnail.html`, `SKILL.md`
