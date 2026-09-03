# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-09-03
- Primary product surfaces: GitHub Pages public wiki, generated data-table pages, long-form system guides
- Evidence reviewed: `_config.yml`, `_data/nav.yml`, `_data/generated_manifest.json`, generated `docs/data/tables/*.md`, extracted `assets/data/raw/*.json`, parent repository `docs/art-bible.md`, `scripts/ui/main_screen.gd`

## Brand

- Personality: **Evidence Ledger at Blue Hour** — a precise martial archive, quiet rather than ornamental, with visible proof for every number.
- Trust signals: patch stamp, verification date, source manifest, schema name, extracted row count, explicit limitations.
- Avoid: glossy game-HUD imitation, rarity color without labels, purple gradients, decorative texture behind dense tables, claims that conceal client/server uncertainty.

## Product goals

- Goals: make extracted values searchable and comparable; show where each value came from; remain fast and usable as a static site.
- Non-goals: gameplay simulation, community speculation, live-account integration, copying the source game's interface.
- Success signals: a visitor can find a table, filter to a row, sort a field, share the query URL, and verify its patch/source without documentation.

## Personas and jobs

- Primary personas: build optimizer, collection completionist, data verifier, guide author.
- User jobs: locate exact values, compare rows, understand odds, trace relationships, verify freshness.
- Key contexts of use: portrait phone during play, desktop comparison/research, keyboard-only reference work.

## Information architecture

- Primary navigation: Home; Equipment; Collection; Food; World; Odds/Systems as content becomes available; Raw Data; provenance and changelog.
- Core routes/screens: editorial home, topic hubs, system guides, generated data-table explorer, source/patch documentation.
- Content hierarchy: plain-language conclusion → key numbers → interactive evidence → method/source → limitations and related data.

## Design principles

1. **Provenance is interface.** Patch, date, schema, and source are a persistent evidence rail, not footer trivia.
2. **Comparison before decoration.** Dense values use stable columns, tabular numerals, restrained accents, and shareable filters.
3. **Static-first resilience.** Navigation and prose work without JavaScript; scripts progressively add search, filtering, sorting, and pagination.
- Tradeoffs: raw matrices remain horizontally scrollable on narrow screens rather than becoming ambiguous cards; artwork yields to reading performance.

## Visual language

- Color: ink `#132129`, hanji `#eee6cf`, celadon `#86ad9b`, broth gold `#e7bd67`, ember `#b84935`. Celadon means verified/current; ember is reserved for risk or emphasis.
- Typography: Korean editorial serif stack for display headings; humanist Korean sans stack for interface/body; monospace only for identifiers and schema values. Full-corpus self-hosted WOFF2 may replace stacks after license/coverage validation.
- Spacing/layout rhythm: 4px base; 12/16/24/32/48/64px working scale; reading measure 72–78ch; maximum data canvas 1180px.
- Shape/radius/elevation: mostly square brush-notched geometry, 3–12px radii, fine borders, one soft shell shadow; no floating-card stack.
- Motion: 140–220ms state transitions and one short brush-rule reveal; all motion disabled by `prefers-reduced-motion`.
- Imagery/iconography: CSS-drawn seal and evidence marks. Do not reuse `Wuxia Kitchen` product artwork as `비룡 키우기` content.

## Components

- Existing components to reuse: generated front matter (`data_file`, `data_fields`, `data_rows`, schema/category), `_data/nav.yml`, generated manifest.
- New/changed components: sticky header, search dialog, responsive navigation drawer, breadcrumbs, evidence rail, hero, metric/topic cards, data explorer, pagination, notices, footer.
- Variants and states: active/draft navigation; verified/stale/unverified evidence; table loading/empty/error; ascending/descending/unsorted columns; enabled/disabled pagination.
- Token/component ownership: global tokens and component CSS live in `assets/css/main.scss`; shell behavior in `assets/js/wiki.js`; table state in `assets/js/data-explorer.js`.

## Accessibility

- Target standard: WCAG 2.2 AA.
- Keyboard/focus behavior: skip link, 44px minimum targets, 3px visible focus, trapped mobile drawer, native modal dialog, sortable header buttons, focus returned after overlays.
- Contrast/readability: text/accent pairs target AA; body line-height 1.72; no essential information encoded by color alone.
- Screen-reader semantics: landmarks, labelled navigation, table captions, `scope`, `aria-sort`, live result/page counts, busy/error states.
- Reduced motion and sensory considerations: reduced-motion media query, no flashing, no required hover, forced-colors support.

## Responsive behavior

- Supported breakpoints/devices: 320px minimum; mobile below 48rem; compact/tablet below 72rem; desktop at 72rem and above.
- Layout adaptations: desktop sticky left rail; tablet/mobile modal drawer; single-column content; evidence metadata wraps; data table scrolls in a named focusable region.
- Touch/hover differences: 44px controls, no hover-only disclosure, hidden page-size selector on compact widths while retaining a safe 25-row default.

## Interaction states

- Loading: restrained progress mark and `aria-busy` while JSON is fetched.
- Empty: explanatory table row with filter-reset guidance.
- Error: inline alert with underlying JSON link; prose/navigation remain usable.
- Success: filtered row range and page count announced politely.
- Disabled: pagination endpoints are disabled semantically and visually.
- Offline/slow network: static shell and documentation remain available; raw data load failure is explicit.

## Content voice

- Tone: factual, compact, Korean-first, clear about uncertainty.
- Terminology: prefer in-game Korean label, then internal schema/ID where it aids verification.
- Microcopy rules: state action and result; distinguish “추출 확인”, “추론”, and “확인 불가”; use exact patch/date rather than “최신”.

## Implementation constraints

- Framework/styling system: native GitHub Pages Jekyll/Liquid, Kramdown, SCSS, dependency-free vanilla JavaScript.
- Design-token constraints: CSS custom properties are canonical; internal links and assets use Liquid `relative_url`, while GitHub Actions injects the deployment `base_path` (`/afk-wiki` by default).
- Performance constraints: fetch only the active table JSON; paginate DOM rows; no remote theme, runtime framework, or external font request.
- Compatibility constraints: current evergreen mobile/desktop browsers; functional prose and navigation without JavaScript.
- Test/screenshot expectations: Jekyll build must succeed; JS syntax must parse; smoke-test drawer, search, data load, filtering, sorting, pagination, error state, and 320/768/1280px layouts.

## Open questions

- [ ] Confirm publishable `비룡 키우기`-specific brand/icon assets; owner: project; impact: richer entity identity without cross-product misbranding.
- [ ] Decide whether full Korean WOFF2 fonts will be vendored; owner: project; impact: consistent typography versus current local-font stack.
- [ ] Define stale-page policy when page patch and site patch diverge; owner: data pipeline; impact: evidence-rail warning automation.
