# RB Grind — native iOS app

Native SwiftUI rebuild of the RB Grind web app (rolling-blade trick generator +
49-tile progression tree) with a settings-aware Siri trigger. The build plan and
phase history live in `AI Files/RB_Grind_iOS_Full_Workflow.md`; phases 0–7 are
implemented (Siri device voice test still pending a connected iPhone).

## Architecture — the one rule that matters

**All trick/tree logic is JavaScript, executed via JavaScriptCore.** Swift owns
UI and persistence only.

- `RBGrind/Engine/grind_engine.js` — lines 1–1267 are a **byte-identical slice**
  of `AI Files/rb-trick-gen-v4.jsx` (source lines 3–1269, current as of
  v4.0). Never edit that region directly; edit the `.jsx` first (it's the
  canonical source), verify there with a `jsc` harness, THEN re-extract. The
  boundary shifts whenever the slice's line count changes — don't assume the
  old numbers still apply; re-find it (`grep -n "^// ══ ICONS" AI\ Files/rb-trick-gen-v4.jsx`,
  the extraction ends the line before). Below the `NATIVE BRIDGE` marker:
  `native*` wrapper functions (JSON string in → JSON string out) that port
  the web App() handler logic verbatim, plus small post-processing helpers
  (`__abbrevTrue`, `__abbrevBackside`, `__exitWording`) for iOS-only display
  wording that layer on top of — and must be re-checked against — whatever
  the engine slice emits.
- `GrindEngine.swift` — JSContext holder; `callJSON("nativeX", payload)`.
- `AppStore` (@Observable) — persists to UserDefaults under the web app's exact
  keys: `rbrg_filters`, `rbrg_landed`, `rbrg_working`, `rbrg_skipped`,
  `rbrg_prog_skip`. The three lists + progSkip are **opaque JSON strings
  produced only by JS** (list invariants live in JS); Swift decodes them
  read-only for display and passes them back verbatim.
- Filters are typed (`Filters` struct) — field names must match the JS `filters`
  object exactly; every change persists immediately (that's what the Siri
  intent reads).
- `GenerateGrindIntent` (AppIntents, in-app target) reads AppStore and returns
  `.result(dialog:)`. Phrases all contain `\(.applicationName)`;
  `INAlternativeAppNames` in `Support/Info.plist` registers "Grind" as an
  app-name synonym.

## Build / run / verify

```sh
# build (folder-synchronized project: new Swift files need NO pbxproj edits)
xcodebuild -project RBGrind.xcodeproj -scheme RBGrind \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -derivedDataPath build/DerivedData build

# install + launch
xcrun simctl install "iPhone 17" build/DerivedData/Build/Products/Debug-iphonesimulator/RBGrind.app
xcrun simctl launch "iPhone 17" com.jameskopacz.RBGrind

# test the JS engine OUTSIDE Xcode first (same engine iOS uses; node not installed)
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc \
  RBGrind/Engine/grind_engine.js <harness.js>
```

### Headless test hooks (env vars via `SIMCTL_CHILD_` prefix + `simctl launch --console-pty`)

- `RBG_SELFTEST=1` — engine self-test: 12 checks + all 49 tiles printed.
- `RBG_STORETEST=write|read|reset|seed|gentest|intenttest` — persistence
  round-trip across launches, list seeding, slider→distribution check
  (switch=100 ⇒ all Switch), Siri dialog path.
- `RBG_AUTOGEN=1` — auto-tap Generate on launch (for screenshots).
- `RBG_SCREEN=generator|landed|progression`, `RBG_PROGSEL=<nodeId>` — jump to a
  screen / preselect a tree tile.
- Screenshot: `xcrun simctl io "iPhone 17" screenshot out.png`.

## Conventions

- Colors/typography come from the web app's `C` object → `Theme.swift`
  (bg #F5F0E8, surface #EDE8DC, border #D9D3C7, text #0D0B08, muted #6B6455,
  accent #1A3FD4). Tree glyphs use Iowan Old Style; big trick names use the
  system condensed black face (stand-in for web Barlow Condensed 900).
- Layout constants (PROG_TILE=56, PROG_TIER_GAP=132, …) are computed in JS and
  consumed via `nativeProgTree()` — don't duplicate them in Swift.
- Commit at every verified milestone. Verify each phase before stacking on it.
- Device installs: free personal signing (7-day expiry), iPhone needs Developer
  Mode; a DEVELOPMENT_TEAM must be set in Xcode Signing settings for device
  builds (simulator needs none).
