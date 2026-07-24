# RB Grind — Native iOS App Workflow (Full Rebuild + Siri)

**Run this in Claude Code on your Mac mini (M1).** Claude Code creates the Xcode
project, edits Swift files, and runs `xcodebuild` directly — driving the
compile-fix-rebuild loop itself instead of you copy-pasting errors back and forth.
Same verification rigor the web app was built with (every change checked before
moving on), applied to Swift.

## Background context (so the "Val Town" references below make sense)
Before this native-app plan, the same trick-generation engine was already deployed
as a small web API (on val.town, a browser-based JS hosting service) for a simpler
Siri integration — just "say a phrase, get a random trick spoken back," no
Progression tree, no persisted settings. That version proved two things worth
trusting here: the engine logic runs cleanly when extracted from the full app file
on its own, and the "?mode=easy/hard" filter concept works. It's referenced a few
times below as precedent, but **that file isn't included in this workflow** — it
was trimmed down to Generator-only and is missing all the Progression tree logic
this build needs, so it's not useful as a starting point here beyond the lessons
learned from it.

## What this actually is
A full native rebuild of the app — Generator screen (sliders, spin dials,
hideLanded), Progression screen (the 49-tile tree, drawers, landed/locked states),
Landed list — **plus** a Siri voice trigger ("Hey Siri, grind" or similar) that
generates using whatever settings are *currently set in the app*, not a fixed
preset. This is a genuinely large project — realistically several Claude Code
sessions, not one sitting. The single biggest chunk of work is the Progression
tree UI (Phase 4) — budget for that accordingly.

## The key architecture point: persisted settings, not query params
The web app's Val Town version took filters via URL (`?mode=easy`), which works
for a stateless web request but not here — Siri triggers independently of the app
being open, so there's nothing to attach a parameter to. Instead: the app saves its
current slider/filter state (and landed/skipped tricks) to a small persisted
store. Adjusting a slider on the Generator screen writes to that store
immediately. The Siri intent doesn't ask questions or take parameters — it just
reads whatever's currently saved and generates against it. Set your mode once in
the app; it's hands-free from there until you change it again.

## What to attach / have present
**`rb-trick-gen-v4.jsx`** (formerly `rb-trick-gen-v3_05.jsx`) — the full app file, not the trimmed Val Town
extraction. This build needs more than the Val Town version had:
- `BASE`, `generateTrick`, `computeDisplay`, `enumerateVariants`, `trickSignature`
  — the Generator engine (Val Town had this part).
- `PROG_NODES`, `PROG_ROWS`, `PROG_GLYPHS`, `progTiers`, `progLayoutX`, `progName`,
  `progSig`, `progStateOf`, `progReachWith` — the entire Progression tree logic.
  **Val Town's file has none of this** — it was trimmed down to Generator-only.
- The React/JSX UI code itself won't run natively (no DOM in a native app — this
  has to be rebuilt in SwiftUI), but keep it as the **visual reference**: pull
  exact values from the app's `C` color object (defined at the very top of the
  file — `bg:'#F5F0E8'`, `surface:'#EDE8DC'`, `border:'#D9D3C7'`, `text:'#0D0B08'`,
  `muted:'#6B6455'`, `accent:'#1A3FD4'`, plus the tile/soul/groove accent colors),
  the serif glyph font (`Iowan Old Style`, Georgia fallback), and the row spacing
  constants (`PROG_TILE=56`, `PROG_MINGAP=80`, `PROG_TIER_GAP=132`, `PROG_TIER_Y0=42`).
  Match those exactly in SwiftUI rather than eyeballing or reinventing them.

Don't let a fresh chat re-derive or "improve" any of the naming/tree logic from
scratch — all of it is already correct and heavily tested across a long build.

## Why JavaScriptCore, not a Swift rewrite of the engine
The naming logic (`V3.name()`, `ALIASES`, modifier-eligibility scaling, spin-degree
menus, an edge case in how the app links out to bookofgrinds.com reference pages
for certain named tricks — a subtle bug where the wrong page could get linked once
some names got customized; not something this port needs to touch, just an
example of the kind of subtle correctness work already done) and the Progression
tree's verified state (all
49 tiles, zero unlock violations, zero glyph/sig collisions) took an enormous
amount of work to get right. Reimplementing that by hand in Swift risks
reintroducing bugs already found and fixed, for zero benefit. `JavaScriptCore` is
built into iOS — it runs the existing JS directly inside the native app, so the
*logic* layer (engine + tree calculations) is embedded verbatim. Only the **UI**
needs rebuilding — SwiftUI can't render React, but it can absolutely be made to
look and behave the same way, driven by the same underlying JS calculations.

## Prerequisites checklist (confirm before Phase 0)
- [ ] Xcode opens and can build/run a blank App project in the Simulator.
- [ ] Signed into Xcode with your Apple ID (Xcode → Settings → Accounts).
- [ ] iPhone connected/trusted, **Developer Mode enabled** on the phone (Settings →
      Privacy & Security → Developer Mode) — required to run local builds.
- [ ] Decide up front: **free personal signing** (re-install from Xcode roughly
      every 7 days) vs. **$99/yr Apple Developer Program** (no limit; needed for
      App Store distribution or long-term daily use without re-installing).

## Build phases — confirm each milestone before starting the next

### Phase 0 — New Xcode project
- App template, SwiftUI interface, Swift language, iOS 17+ deployment target.
- **Milestone:** blank app builds and runs in the Simulator.

### Phase 1 — Embed the engine
- **Critical: the full `.jsx` file CANNOT be fed to JavaScriptCore as-is.** Line 1
  is `import ... from "react"` and everything from `export default function App()`
  (around line 1226) onward is React/JSX — JavaScriptCore is a pure ES engine with
  no module loader and no JSX parser, so both would throw. You must extract the
  **logic-only slice first**.
- The logic is cleanly separable: it runs from the `const C` / `BASE` declarations
  near the top through the last `prog*` helper and `nameFontSize` (~line 1192),
  with NO React usage in that range (React first appears ~line 1226). Everything
  the engine and tree need — `BASE`, `generateTrick`, `computeDisplay`,
  `enumerateVariants`, `trickSignature`, `V3`, `ALIASES`, all the `PROG_*` data and
  `prog*` functions — lives in that slice. Precedent: the Val Town file was exactly
  this kind of extraction (a smaller slice) and ran standalone in plain JS with no
  changes, so this is proven separable.
- Extract that slice into a standalone `.js` file (strip the line-1 `import`; drop
  everything from the first React component onward). Add one small wrapper function
  at the end for Swift to call, e.g. `function nativeGenerate(filtersJSON) { ... }`
  returning a JSON string, so the Swift↔JS boundary is a single clean call in each
  direction rather than Swift poking at many JS internals.
- **Verify the slice runs in plain Node BEFORE bundling it into Xcode** (`node
  --input-type=module` or as a `.mjs`, same harness pattern the web app used) — if
  it throws "X is not defined", the slice boundary cut through a dependency; extend
  it until it evaluates clean. Do this outside Xcode first; debugging a bad slice
  inside JavaScriptCore is far more painful.
- Write `GrindEngine.swift`: loads a `JSContext`, evaluates the bundled slice,
  exposes Swift functions wrapping the JS wrapper(s) — one for Generator
  (`generateTrick`/`computeDisplay`) and one exposing the tree data/state
  (`prog*`).
- **Milestone:** a console `print()` through the Swift wrapper shows real trick
  names AND real Progression tile data (e.g. print all 49 tile names + their
  row) — confirms the JS bridge works for both halves before any UI is built.

### Phase 2 — Persisted settings + landed state
- Define a Swift model mirroring the web app's `filters` object: the 7 modifier
  sliders, the spin-range fields (`inMin/inMax/outMin/outMax/fakieIn/truespin/
  rewindOut`), the enabled-tricks map, `hideLanded`.
- Define persisted storage for landed + skipped + working tricks. **The web app
  already persists these** — look at `saveLanded`/`saveWorking`/`saveSkipped` in
  the reference file: they store JSON arrays of trick entries under the keys
  `rbrg_landed`, `rbrg_working`, `rbrg_skipped` (via the artifact's
  `window.storage`, which won't exist natively). Mirror that same shape — arrays
  of entries keyed by trick sig — in the Swift store so the tree's landed/locked
  logic works identically. The entry format and sig scheme come straight from the
  reference file (`progEntry`, `progSig`); reuse them via the JS bridge rather than
  reinventing the sig format in Swift.
- `UserDefaults` (Codable structs as JSON) is enough for this data size — no need
  for Core Data/SwiftData.
- **Milestone:** a value written to the store in one place is readable from
  another (e.g. a unit test or two print statements in different views) —
  confirms persistence actually works before UI depends on it.

### Phase 3 — Generator screen
- Sliders, spin-range controls, `hideLanded` toggle, Generate button, trick name
  display (lead/trail feet too, matching the web app).
- Reads/writes the Phase 2 store; calls the Phase 1 engine.
- **Milestone:** tapping Generate in the Simulator produces a real trick, and
  moving a slider actually changes the distribution over repeated taps (e.g. set
  Switch to 100% and confirm every result has Switch).

### Phase 4 — Progression screen (the big one)
- Render all 49 tiles across their 10 rows, with connector lines, glyphs, and
  landed/available/locked visual states — matching the constants/colors in the
  reference file (`PROG_TIER_GAP`, `PROG_TILE`, the cream/blue palette, the serif
  glyph font).
- Tap a tile → footer detail (foot positions, Mark Landed / Skip, "Suggested
  after" text for locked tiles, drawers for spin/variation chips).
- This is by far the largest phase — treat it as several of its own
  milestones (tiles render in correct positions → tap-to-select works → footer
  detail works → Mark Landed updates state → drawers work) rather than one big
  jump.
- **Milestone (final, for this phase):** the tree visually and functionally
  matches the web app — landing a tile updates its state, locked tiles show the
  softened "Suggested after" text, nothing crashes on tap.

### Phase 5 — Landed screen
- Simple list of landed tricks, reading Phase 2's persisted store.
- **Milestone:** tricks landed in Phase 3 or Phase 4 show up here.

### Phase 6 — Siri App Intent (settings-aware)
- Define an `AppIntent` whose `perform()` **reads the Phase 2 persisted filter
  settings** (not hardcoded defaults, not App Intent parameters) and calls the
  Phase 1 engine with them, returning `.result(dialog: "Try \(name)")` —
  `ProvidesDialog` is the result type that makes Siri speak text back (confirmed
  current as of WWDC25).
- Add an `AppShortcutsProvider` with the invocation phrase(s).
- **Verified, strict requirement:** every phrase must *contain*
  `\(.applicationName)` — leaving it out builds fine but the phrase silently does
  nothing at runtime. The wording around it is flexible (doesn't have to be a
  particular sentence shape).
- **Untested edge case:** every real example found in research (including
  Apple's own WWDC sample code) pairs the app name with at least one other word —
  none use the bare app name alone. Not confirmed disallowed, just untested.
  Register a longer backup phrase alongside a bare-name attempt so there's always
  a guaranteed-working fallback.
- **For a short trigger like "Hey Siri, grind":** rather than naming the whole
  app a bare common word, look into **App Shortcut synonyms** — keep the real
  display name distinct (e.g. "RB Grind"), register "Grind" as a synonym accepted
  wherever `\(.applicationName)` appears in a phrase. Confirm the exact current
  API against Xcode's docs when you get there.
- **Test via the Shortcuts app first**, not voice — isolates "is the intent logic
  correct" from "did Siri understand what I said," two very different failure
  modes.
- **Milestone:** change a slider in the app, walk away, say "Hey Siri, grind" —
  the spoken result reflects the setting you just changed, hands-free, no app
  open. This is the actual feature.

### Phase 7 — Visual polish
- Match the real app's palette/typography throughout (cream background, serif
  `Iowan Old Style`/Georgia for glyphs, blue accent) — pull exact values from the
  reference file rather than eyeballing them.
- App icon, launch screen.

## Verification discipline — carry this over, don't skip it
- **Don't stack unverified phases** — a broken Phase 2 makes Phase 4 and Phase 6
  impossible to debug cleanly, since both depend on it directly.
- **Xcode's build errors are the equivalent of the `tsc` checks** used throughout
  the web-app build. Read them, fix the actual issue, rebuild.
- **Claude Code drives the loop:** run `xcodebuild` against the project directly,
  iterate on real compiler errors — don't hand-write Swift and hope it compiles.
- Exact App Intents/SwiftUI API syntax should be verified against Xcode's
  autocomplete/compiler output in the moment, not trusted blindly from any
  pre-written guide, including this one. The two App Intents specifics this doc
  commits to (`\(.applicationName)` requirement, `ProvidesDialog`) were verified
  against current 2026 sources — still confirm against the compiler.
- **Given the size of this project, commit progress incrementally** (git, even
  just local commits) at each milestone — if a later phase goes sideways, you
  want a known-working point to return to rather than losing a full session's work.

## Known gotchas going in
- Free personal signing needs re-installing roughly every 7 days — expected.
- Developer Mode must be manually enabled on the iPhone itself before it accepts
  a locally-built app.
- The `\(.applicationName)` phrase requirement is the single most likely thing to
  silently eat time in Phase 6 — check this first if a Siri phrase does nothing.
- **UserDefaults + App Intents:** confirm early (in Phase 2, before building on
  top of it) that an `AppIntent` registered via `AppShortcutsProvider` in the main
  app target can read the same `UserDefaults.standard` the app writes to. This
  should be the case for intents defined directly in the app target (as opposed
  to a separate Intents Extension), but verify it with a real read/write test
  before Phase 6 depends on it — don't assume.
- The Progression tree (Phase 4) is a lot of custom SwiftUI layout work (absolute
  positioning, connector-line drawing) — expect this to be the longest phase by a
  wide margin, and don't be surprised if it needs breaking into even smaller
  sub-milestones than listed above.

## What's already solved — don't re-relitigate this in the new chat
Everything in the reference engine is already verified: modifier-slider
distribution (~5% each, matching sliders), the Zero/Switch balance fix, the four
renamed tricks and alias resolution, all 49 Progression tiles (zero unlock
violations, zero sig/glyph collisions, zero orphans), the soft-gate philosophy
(locked tiles landable, "Suggested after" text), and the coach-designed row
ordering. None of that needs re-deriving or re-designing — only the native Swift
UI and Siri wiring around it is new work.
