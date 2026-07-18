import Foundation

/// Phase 2 milestone check: values written to the store in one launch are
/// readable in a fresh launch (real UserDefaults round-trip), and the landed
/// list written through the JS bridge drives progression state correctly.
///
/// Drive with the RBG_STORETEST env var: "write" → "read" (verify) → "reset".
enum StoreSelfTest {
    @MainActor
    static func runIfRequested() {
        guard let mode = ProcessInfo.processInfo.environment["RBG_STORETEST"] else { return }
        let store = AppStore.shared

        switch mode {
        case "write":
            store.resetAll()
            store.filters.sliders.switch = 77
            store.filters.spins.inMax = 360
            store.filters.hideLanded = false
            store.progAction("markLanded", id: "makio")
            print("RBG-STORETEST: wrote switch=77 inMax=360 hideLanded=false landedCount=\(store.landed.count)")

        case "read":
            var failures: [String] = []
            if store.filters.sliders.switch != 77 { failures.append("switch=\(store.filters.sliders.switch) expected 77") }
            if store.filters.spins.inMax != 360 { failures.append("inMax=\(store.filters.spins.inMax) expected 360") }
            if store.filters.hideLanded != false { failures.append("hideLanded=\(store.filters.hideLanded) expected false") }
            if store.filters.sliders.topside != 5 { failures.append("topside=\(store.filters.sliders.topside) expected default 5") }
            if store.landed.count != 1 || store.landed.first?.display != "Makio" {
                failures.append("landed=\(store.landed.map(\.display)) expected [Makio]")
            }

            let statePayload = "{\"landed\":\(store.landedJSON),\"progSkip\":\(store.progSkipJSON)}"
            if let stateJSON = GrindEngine.shared.callJSON("nativeProgState", statePayload),
               let obj = (try? JSONSerialization.jsonObject(with: Data(stateJSON.utf8))) as? [String: Any],
               let states = obj["states"] as? [String: String] {
                if states["makio"] != "landed" { failures.append("prog makio=\(states["makio"] ?? "nil") expected landed") }
                if states["fishbrain"] != "available" { failures.append("prog fishbrain=\(states["fishbrain"] ?? "nil") expected available") }
                if states["soul"] != "available" { failures.append("prog soul=\(states["soul"] ?? "nil") expected available") }
                if states["acid"] != "locked" { failures.append("prog acid=\(states["acid"] ?? "nil") expected locked") }
            } else {
                failures.append("nativeProgState failed")
            }

            if failures.isEmpty {
                print("RBG-STORETEST: READ PASS — persisted filters + landed list survived relaunch and drive prog state")
            } else {
                print("RBG-STORETEST: READ FAIL — \(failures.joined(separator: "; "))")
            }

        case "reset":
            store.resetAll()
            print("RBG-STORETEST: reset done landedCount=\(store.landed.count) switch=\(store.filters.sliders.switch)")

        case "intenttest":
            // Phase 6: the exact dialog path the Siri intent runs, in-process.
            store.resetAll()
            let d1 = GrindIntentLogic.generateDialog()
            print("RBG-INTENTTEST: defaults → spoken=\"\(d1.text)\"")
            let noTryPrefix = !d1.text.hasPrefix("Try ")
            let noFeetLeak = !d1.text.contains("Trail:")
            print("RBG-INTENTTEST: spoken text has no \"Try \" prefix → \(noTryPrefix ? "PASS" : "FAIL")")
            print("RBG-INTENTTEST: spoken text has no Trail/Lead → \(noFeetLeak ? "PASS" : "FAIL")")

            store.filters.sliders.switch = 100
            let d2 = GrindIntentLogic.generateDialog()
            let switchOK = d2.text.hasPrefix("Switch")
            print("RBG-INTENTTEST: switch=100 → spoken=\"\(d2.text)\" \(switchOK ? "PASS (settings-aware)" : "FAIL")")

            // repeat should echo the last successful generate(), not roll a new one
            let r1 = GrindIntentLogic.repeatDialog()
            let repeatMatches = r1.text == d2.text
            print("RBG-INTENTTEST: repeat → spoken=\"\(r1.text)\" \(repeatMatches ? "PASS (echoes last grind)" : "FAIL")")

            store.filters.tricks = store.filters.tricks.mapValues { _ in false }
            let d3 = GrindIntentLogic.generateDialog()
            print("RBG-INTENTTEST: all tricks off → \"\(d3.text)\" \(d3.text.contains("No tricks are enabled") ? "PASS" : "FAIL")")
            // a failed generate must NOT clobber the repeat cache
            let r2 = GrindIntentLogic.repeatDialog()
            let repeatSurvived = r2.text == d2.text
            print("RBG-INTENTTEST: repeat after disabled-tricks → \"\(r2.text)\" \(repeatSurvived ? "PASS (cache untouched)" : "FAIL")")

            store.resetAll()
            let r3 = GrindIntentLogic.repeatDialog()
            print("RBG-INTENTTEST: repeat after reset → \"\(r3.text)\" \(r3.text.contains("haven't asked") ? "PASS (fresh-install fallback)" : "FAIL")")

            // "Switch Up Grind" forces a chain even while the app is in Single
            // mode, and must NOT persist that override into the app's own toggle.
            store.resetAll()
            store.filters.switchUp = 0
            let su1 = GrindIntentLogic.switchUpDialog()
            let looksLikeChain = su1.text.contains(" to ")
            print("RBG-INTENTTEST: switch-up while app is Single → \"\(su1.text)\" \(looksLikeChain ? "PASS (chain shape)" : "FAIL")")
            print("RBG-INTENTTEST: app's switchUp toggle untouched → \(store.filters.switchUp == 0 ? "PASS" : "FAIL (was \(store.filters.switchUp))")")

            // bypasses drill mode too — Practice Mode alone would otherwise
            // short-circuit nativeGenerate into an (empty) drill-pool replay
            store.filters.practice = true
            let su2 = GrindIntentLogic.switchUpDialog()
            let bypassedDrill = su2.text.contains(" to ")
            print("RBG-INTENTTEST: switch-up while Practice Mode is on → \"\(su2.text)\" \(bypassedDrill ? "PASS (bypasses drill)" : "FAIL")")
            print("RBG-INTENTTEST: app's Practice Mode toggle untouched → \(store.filters.practice == true ? "PASS" : "FAIL")")

            // repeat should now echo the switch-up, not the earlier single grind
            let r4 = GrindIntentLogic.repeatDialog()
            print("RBG-INTENTTEST: repeat after switch-up → \"\(r4.text)\" \(r4.text == su2.text ? "PASS (echoes switch-up)" : "FAIL")")

            // "Grind Landed": marks the last-spoken trick landed, then speaks
            // a fresh one in the SAME mode (single→single, switch-up→switch-up)
            store.resetAll()
            _ = GrindIntentLogic.generateDialog()
            let sigA = store.lastSiriResult()?.sig
            let landed1 = GrindIntentLogic.landedDialog()
            print("RBG-INTENTTEST: grind landed (single) → spoken=\"\(landed1.text)\"")
            let singleMarked = store.landed.count == 1 && store.landed.first?.sig == sigA
            print("RBG-INTENTTEST: previous single marked landed → \(singleMarked ? "PASS" : "FAIL")")
            let sigB = store.lastSiriResult()?.sig
            print("RBG-INTENTTEST: a new trick was generated and cached → \(sigB != nil && sigB != sigA ? "PASS" : "FAIL")")
            print("RBG-INTENTTEST: app's switchUp toggle untouched by single landed-flow → \(store.filters.switchUp == 0 ? "PASS" : "FAIL")")
            print("RBG-INTENTTEST: landed dialog has lead-in → \(landed1.text.hasPrefix("Landed! Next up, ") ? "PASS" : "FAIL")")
            let repeatAfterLanded = GrindIntentLogic.repeatDialog()
            let repeatHasNoLeadIn = !repeatAfterLanded.text.hasPrefix("Landed!") && landed1.text == "Landed! Next up, " + repeatAfterLanded.text
            print("RBG-INTENTTEST: repeat after landed drops lead-in → \"\(repeatAfterLanded.text)\" \(repeatHasNoLeadIn ? "PASS" : "FAIL")")

            _ = GrindIntentLogic.switchUpDialog()
            let sigC = store.lastSiriResult()?.sig
            let landed2 = GrindIntentLogic.landedDialog()
            print("RBG-INTENTTEST: grind landed (switch-up) → spoken=\"\(landed2.text)\"")
            let chainMarked = store.landed.contains { $0.sig == sigC && $0.isChain == true }
            print("RBG-INTENTTEST: previous switch-up marked landed as a chain → \(chainMarked ? "PASS" : "FAIL")")
            let nextIsAlsoChain = landed2.text.contains(" to ")
            print("RBG-INTENTTEST: next grind after switch-up landed is also a switch-up → \(nextIsAlsoChain ? "PASS" : "FAIL")")
            print("RBG-INTENTTEST: total landed count now 2 → \(store.landed.count == 2 ? "PASS" : "FAIL (\(store.landed.count))")")

            // toggle-safety: firing "landed" twice in a row (e.g. a stray Siri
            // repeat) must never un-mark — each call always advances first
            let sigD = store.lastSiriResult()?.sig
            _ = GrindIntentLogic.landedDialog()
            let stillLanded = sigD.map { s in store.landed.contains { $0.sig == s } } ?? false
            print("RBG-INTENTTEST: repeated landed calls never un-mark (toggle-safe) → \(stillLanded ? "PASS" : "FAIL")")

            store.resetAll()
            let freshLanded = GrindIntentLogic.landedDialog()
            print("RBG-INTENTTEST: grind landed with no prior grind → \"\(freshLanded.text)\" \(freshLanded.text.contains("haven't asked") ? "PASS (fresh-install fallback)" : "FAIL")")

            // landedSuggestsNext toggle: defaults on, and off stops the chain
            print("RBG-INTENTTEST: landedSuggestsNext defaults true → \(store.landedSuggestsNext ? "PASS" : "FAIL")")
            store.landedSuggestsNext = false
            _ = GrindIntentLogic.generateDialog()
            let sigE = store.lastSiriResult()?.sig
            let landedOff = GrindIntentLogic.landedDialog()
            print("RBG-INTENTTEST: landed with suggest-next OFF → \"\(landedOff.text)\" \(landedOff.text == "Landed!" ? "PASS" : "FAIL")")
            let markedOff = store.landed.contains { $0.sig == sigE }
            print("RBG-INTENTTEST: still marks landed when OFF → \(markedOff ? "PASS" : "FAIL")")
            let cacheUntouchedOff = store.lastSiriResult()?.sig == sigE
            print("RBG-INTENTTEST: cache untouched when OFF (no next trick rolled) → \(cacheUntouchedOff ? "PASS" : "FAIL")")

            // "Skip Grind": marks too hard, then advances (settings-aware,
            // same shape as Landed). A skipped SWITCH-UP records nothing
            // (matches the web app's Too-Hard button, which disables itself
            // on a chain) but still advances to a fresh chain.
            store.resetAll()
            _ = GrindIntentLogic.generateDialog()
            let skigSigA = store.lastSiriResult()?.sig
            let skip1 = GrindIntentLogic.skipDialog()
            print("RBG-INTENTTEST: skip grind (single) → spoken=\"\(skip1.text)\"")
            let skipMarked = store.skipped.contains { $0.sig == skigSigA } && !store.landed.contains { $0.sig == skigSigA }
            print("RBG-INTENTTEST: previous single marked skipped → \(skipMarked ? "PASS" : "FAIL")")
            print("RBG-INTENTTEST: skip dialog has lead-in → \(skip1.text.hasPrefix("Skipped! Next up, ") ? "PASS" : "FAIL")")

            _ = GrindIntentLogic.switchUpDialog()
            let chainSigForSkip = store.lastSiriResult()?.sig
            let skip2 = GrindIntentLogic.skipDialog()
            print("RBG-INTENTTEST: skip grind (switch-up) → spoken=\"\(skip2.text)\"")
            let chainNotSkipped = !store.skipped.contains { $0.sig == chainSigForSkip }
            print("RBG-INTENTTEST: switch-up skip records nothing (chains aren't enumerable) → \(chainNotSkipped ? "PASS" : "FAIL")")
            print("RBG-INTENTTEST: still advances to a new switch-up → \(skip2.text.contains(" to ") ? "PASS" : "FAIL")")

            let skipSigRepeat = store.lastSiriResult()?.sig
            _ = GrindIntentLogic.skipDialog()
            let skipStillOnce = store.skipped.filter { $0.sig == skipSigRepeat }.count <= 1
            print("RBG-INTENTTEST: repeated skip never double-adds (toggle-safe) → \(skipStillOnce ? "PASS" : "FAIL")")

            store.resetAll()
            let freshSkip = GrindIntentLogic.skipDialog()
            print("RBG-INTENTTEST: skip with no prior grind → \"\(freshSkip.text)\" \(freshSkip.text.contains("haven't asked") ? "PASS (fresh-install fallback)" : "FAIL")")

            store.landedSuggestsNext = false
            _ = GrindIntentLogic.generateDialog()
            let skipOff = GrindIntentLogic.skipDialog()
            print("RBG-INTENTTEST: skip with suggest-next OFF → \"\(skipOff.text)\" \(skipOff.text == "Skipped!" ? "PASS" : "FAIL")")

            // "Save Grind": marks working-on, then advances. Unlike Skip,
            // switch-ups DO get recorded (Working On has no chain exclusion).
            store.resetAll()
            _ = GrindIntentLogic.generateDialog()
            let saveSigA = store.lastSiriResult()?.sig
            let save1 = GrindIntentLogic.saveDialog()
            print("RBG-INTENTTEST: save grind (single) → spoken=\"\(save1.text)\"")
            let saveMarked = store.working.contains { $0.sig == saveSigA } && !store.landed.contains { $0.sig == saveSigA }
            print("RBG-INTENTTEST: previous single marked working-on → \(saveMarked ? "PASS" : "FAIL")")
            print("RBG-INTENTTEST: save dialog has lead-in → \(save1.text.hasPrefix("Saved! Next up, ") ? "PASS" : "FAIL")")

            _ = GrindIntentLogic.switchUpDialog()
            let chainSigForSave = store.lastSiriResult()?.sig
            let save2 = GrindIntentLogic.saveDialog()
            let chainSaved = store.working.contains { $0.sig == chainSigForSave && $0.isChain == true }
            print("RBG-INTENTTEST: switch-up save records as a chain → \(chainSaved ? "PASS" : "FAIL")")
            print("RBG-INTENTTEST: still advances to a new switch-up → \(save2.text.contains(" to ") ? "PASS" : "FAIL")")

            let saveSigRepeat = store.lastSiriResult()?.sig
            _ = GrindIntentLogic.saveDialog()
            let saveStillWorking = saveSigRepeat.map { s in store.working.contains { $0.sig == s } } ?? false
            print("RBG-INTENTTEST: repeated save stays marked (toggle-safe) → \(saveStillWorking ? "PASS" : "FAIL")")

            store.resetAll()
            let freshSave = GrindIntentLogic.saveDialog()
            print("RBG-INTENTTEST: save with no prior grind → \"\(freshSave.text)\" \(freshSave.text.contains("haven't asked") ? "PASS (fresh-install fallback)" : "FAIL")")

            store.landedSuggestsNext = false
            _ = GrindIntentLogic.generateDialog()
            let saveOff = GrindIntentLogic.saveDialog()
            print("RBG-INTENTTEST: save with suggest-next OFF → \"\(saveOff.text)\" \(saveOff.text == "Saved!" ? "PASS" : "FAIL")")

            store.resetAll()

            // Siri-only abbreviation expansion: BS→Backside, AO→Alley-oop
            let sp1 = GrindIntentLogic.spokenForm("Fakie 270 Inspin BS Royale")
            print("RBG-INTENTTEST: spokenForm BS → \"\(sp1)\" \(sp1 == "Fakie 270 Inspin Backside Royale" ? "PASS" : "FAIL")")
            let sp2 = GrindIntentLogic.spokenForm("Switch AO Soul fakie out")
            print("RBG-INTENTTEST: spokenForm AO → \"\(sp2)\" \(sp2 == "Switch Alley-oop Soul fakie out" ? "PASS" : "FAIL")")
            let sp3 = GrindIntentLogic.spokenForm("Backside forward out")
            print("RBG-INTENTTEST: spokenForm leaves spelled words alone → \(sp3 == "Backside forward out" ? "PASS" : "FAIL")")

            // exit wording through the full store→engine→Siri path:
            // soul-only pool, forced 0° in / 180° out ⇒ deterministic "Soul fakie out"
            store.resetAll()
            store.filters.tricks = store.filters.tricks.mapValues { _ in false }
            store.filters.tricks["soul"] = true
            store.filters.spins.inMin = 0
            store.filters.spins.inMax = 0
            store.filters.spins.outMin = 180
            store.filters.spins.outMax = 180
            store.filters.spins.fakieIn = 0
            store.filters.spins.truespin = false
            store.filters.spins.rewindOut = 0
            store.filters.sliders = .init(switch: 0, topside: 0, negative: 0, christ: 0, antichrist: 0, rough: 0, tough: 0)
            store.filters.hideLanded = false
            let w1 = GrindIntentLogic.generateDialog()
            print("RBG-INTENTTEST: exit wording → \"\(w1.text)\" \(w1.text == "Soul fakie out" ? "PASS (stance-out)" : "FAIL")")

            // help text names all six action commands, most important first
            // (matches the Siri page card order: generate, switch-up,
            // landed, skip, save, repeat)
            let help = GrindIntentLogic.helpText
            let namesAll = ["Say Grind to", "Grind Switch Up", "Grind Landed", "Grind Skip", "Grind Save", "Repeat Grind"].allSatisfy { help.contains($0) }
            let order = [help.range(of: "Say Grind to"), help.range(of: "Grind Switch Up"), help.range(of: "Grind Landed"),
                         help.range(of: "Grind Skip"), help.range(of: "Grind Save"), help.range(of: "Repeat Grind")].compactMap { $0?.lowerBound }
            let ordered = order.count == 6 && zip(order, order.dropFirst()).allSatisfy { $0 < $1 }
            print("RBG-INTENTTEST: help names all six commands in priority order → \(namesAll && ordered ? "PASS" : "FAIL")")

            store.resetAll()

        case "devtest":
            // Dev-section buttons: clearLanded and zeroSliders, through the
            // exact store methods the UI calls, with persistence verified via
            // a fresh UserDefaults read.
            store.resetAll()
            store.progAction("markLanded", id: "makio")
            store.progAction("markLanded", id: "soul")
            store.toggleWorkingOn(store.generate()!, detailed: false)
            print("RBG-DEVTEST: seeded landed=\(store.landed.count) working=\(store.working.count)")
            store.clearLanded()
            let persistedLanded = UserDefaults.standard.string(forKey: "rbrg_landed") ?? "?"
            let clearOK = store.landed.isEmpty && persistedLanded == "[]" && store.working.count == 1
            print("RBG-DEVTEST: clear landed → landed=\(store.landed.count) persisted=\(persistedLanded) workingKept=\(store.working.count) \(clearOK ? "PASS" : "FAIL")")

            store.zeroSliders()
            let s = store.filters.sliders
            let sp = store.filters.spins
            let allZero = [s.switch, s.topside, s.negative, s.christ, s.antichrist, s.rough, s.tough].allSatisfy { $0 == 0 }
            let spinsZero = [sp.inMin, sp.inMax, sp.outMin, sp.outMax, sp.fakieIn, sp.rewindOut, sp.suMin, sp.suMax, sp.suRewind].allSatisfy { $0 == 0 } && sp.truespin == false
            // session/display toggles must survive (defaults: hideLanded on, specialFirst on)
            let untouched = store.filters.hideLanded && store.filters.specialFirst && !store.filters.practice && !store.filters.workOnly
            let persistedFilters = UserDefaults.standard.string(forKey: "rbrg_filters") ?? ""
            let persistedZero = persistedFilters.contains("\"switch\":0") && persistedFilters.contains("\"truespin\":false")
            print("RBG-DEVTEST: zero out → sliders=\(allZero) spins+truespin=\(spinsZero) togglesUntouched=\(untouched) persisted=\(persistedZero) \(allZero && spinsZero && untouched && persistedZero ? "PASS" : "FAIL")")
            let zr = store.generate()
            print("RBG-DEVTEST: still generates after zero out → \"\(zr?.short?.main ?? "nil")\" \(zr?.status == "ok" ? "PASS" : "FAIL")")
            store.resetAll()

        case "seed":
            // richer fixture for eyeballing the Landed screen: a few landed
            // tiles, one working-on trick, one too-hard trick — all through
            // the same JS paths the UI uses.
            store.resetAll()
            store.progAction("markLanded", id: "makio")
            store.progAction("markLanded", id: "frontside")
            store.progAction("markSpin", id: "makio", spinKey: "zero")
            if let r = store.generate() {
                store.toggleWorkingOn(r, detailed: false)
                if let r2 = store.generate(currentSig: r.sig) {
                    store.skipTrick(r2, detailed: false)
                }
            }
            print("RBG-STORETEST: seeded landed=\(store.landed.count) working=\(store.working.count) skipped=\(store.skipped.count)")

        case "gentest":
            // Phase 3 milestone: generation honors the store's slider values.
            // Writes through the same store property the UI slider binds to.
            store.resetAll()
            var sample: [String] = []
            for _ in 0..<10 {
                if let r = store.generate(), let main = r.short?.main { sample.append(main) }
            }
            print("RBG-GENTEST: defaults sample: \(sample.prefix(4).joined(separator: " | "))")

            store.filters.sliders.switch = 100
            var allSwitch = true
            var count = 0
            for _ in 0..<60 {
                guard let r = store.generate(), let main = r.short?.main else { continue }
                count += 1
                if !main.hasPrefix("Switch") { allSwitch = false; print("RBG-GENTEST: non-Switch result: \(main)") }
            }
            print("RBG-GENTEST: switch=100 over \(count) generates → \(allSwitch ? "ALL Switch — PASS" : "FAIL")")

            store.filters.sliders.switch = 0
            var noneSwitch = true
            for _ in 0..<60 {
                guard let r = store.generate(), let main = r.short?.main else { continue }
                if main.hasPrefix("Switch") { noneSwitch = false }
            }
            print("RBG-GENTEST: switch=0 over 60 generates → \(noneSwitch ? "ZERO Switch — PASS" : "FAIL")")
            store.resetAll()

        default:
            break
        }
    }
}
