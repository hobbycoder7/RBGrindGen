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
            let d1 = GrindIntentLogic.dialogText()
            print("RBG-INTENTTEST: defaults → \"\(d1)\"")
            store.filters.sliders.switch = 100
            let d2 = GrindIntentLogic.dialogText()
            let switchOK = d2.hasPrefix("Try Switch")
            print("RBG-INTENTTEST: switch=100 → \"\(d2)\" \(switchOK ? "PASS (settings-aware)" : "FAIL")")
            store.filters.tricks = store.filters.tricks.mapValues { _ in false }
            let d3 = GrindIntentLogic.dialogText()
            print("RBG-INTENTTEST: all tricks off → \"\(d3)\" \(d3.contains("No tricks are enabled") ? "PASS" : "FAIL")")
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
                store.toggleWorking(r, detailed: false)
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
