import Foundation

/// Phase 2 milestone check: values written to the store in one launch are
/// readable in a fresh launch (real UserDefaults round-trip), and the landed
/// list written through the JS bridge drives progression state correctly.
///
/// Drive with the RBG_STORETEST env var: "write" → "read" (verify) → "reset".
enum StoreSelfTest {
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

        default:
            break
        }
    }
}
