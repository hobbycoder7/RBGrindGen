import Foundation
import Observation

/// Single source of persisted app state, mirroring the web app's storage:
/// the same five keys, the same JSON shapes.
///
/// Filters are typed (Swift edits every field); the three trick lists and the
/// progression skip list are held as **opaque JSON strings exactly as the JS
/// engine produced them** and only ever mutated by JS (`nativeToggleLanded`,
/// `nativeProgAction`, …), so the entry format cannot drift from the web app.
/// Adjusting any filter persists immediately — the Siri intent reads whatever
/// is saved here without the app running.
@Observable
final class AppStore {
    static let shared = AppStore()

    private enum Key {
        static let filters = "rbrg_filters"
        static let landed = "rbrg_landed"
        static let working = "rbrg_working"
        static let skipped = "rbrg_skipped"
        static let progSkip = "rbrg_prog_skip"
        static let lastSiriResult = "rbrg_last_siri_result"
    }

    // MARK: typed filters (persist on every change)

    var filters: Filters {
        didSet { if !loading { persistFilters() } }
    }

    // MARK: opaque list JSON (written only from JS results or reset)

    private(set) var landedJSON = "[]"
    private(set) var workingJSON = "[]"
    private(set) var skippedJSON = "[]"
    private(set) var progSkipJSON = "[]"

    // decoded read-only views for UI
    private(set) var landed: [TrickEntry] = []
    private(set) var working: [TrickEntry] = []
    private(set) var skipped: [TrickEntry] = []
    private(set) var progSkip: [String] = []

    // MARK: session-only Generator state (never persisted)

    /// The trick/chain currently on screen, plus the one-step undo snapshot
    /// and the Detail toggle. Mirrors the web App()'s trick/chain/prevView/
    /// exitDetailed living at the root: tab switches recreate the screen
    /// views, so this state must outlive them — but a relaunch clears it,
    /// same as a web reload.
    var currentResult: GenResult?
    var previousResult: GenResult?
    var exitDetailed = false

    private var loading = true
    private let defaults = UserDefaults.standard

    init() {
        // merge any saved filters over engine defaults — same nested merge the
        // web app runs on load (nativeMergeFilters), so partial saves are safe.
        let saved = defaults.string(forKey: Key.filters) ?? "null"
        guard let mergedJSON = GrindEngine.shared.callJSON("nativeMergeFilters", saved),
              let merged = try? JSONDecoder().decode(Filters.self, from: Data(mergedJSON.utf8)) else {
            fatalError("[AppStore] engine failed to provide filters")
        }
        filters = merged
        setLanded(defaults.string(forKey: Key.landed) ?? "[]", persist: false)
        setWorking(defaults.string(forKey: Key.working) ?? "[]", persist: false)
        setSkipped(defaults.string(forKey: Key.skipped) ?? "[]", persist: false)
        setProgSkip(defaults.string(forKey: Key.progSkip) ?? "[]", persist: false)
        loading = false
    }

    // MARK: - JSON plumbing

    var filtersJSON: String {
        guard let data = try? JSONEncoder().encode(filters),
              let json = String(data: data, encoding: .utf8) else { return "{}" }
        return json
    }

    static func jsonString(_ value: String) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: value, options: .fragmentsAllowed),
              let json = String(data: data, encoding: .utf8) else { return "\"\"" }
        return json
    }

    private func setLanded(_ json: String, persist: Bool = true) {
        landedJSON = json
        landed = Self.decodeEntries(json)
        if persist { defaults.set(json, forKey: Key.landed) }
    }

    private func setWorking(_ json: String, persist: Bool = true) {
        workingJSON = json
        working = Self.decodeEntries(json)
        if persist { defaults.set(json, forKey: Key.working) }
    }

    private func setSkipped(_ json: String, persist: Bool = true) {
        skippedJSON = json
        skipped = Self.decodeEntries(json)
        if persist { defaults.set(json, forKey: Key.skipped) }
    }

    private func setProgSkip(_ json: String, persist: Bool = true) {
        progSkipJSON = json
        progSkip = (try? JSONDecoder().decode([String].self, from: Data(json.utf8))) ?? []
        if persist { defaults.set(json, forKey: Key.progSkip) }
    }

    private static func decodeEntries(_ json: String) -> [TrickEntry] {
        (try? JSONDecoder().decode([TrickEntry].self, from: Data(json.utf8))) ?? []
    }

    private func persistFilters() {
        defaults.set(filtersJSON, forKey: Key.filters)
    }

    /// Apply a JS mutation result — an object holding any of
    /// `landed` / `working` / `skipped` / `progSkip` as full replacement arrays.
    func applyListsResult(_ json: String) {
        guard let obj = try? JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any] else {
            print("[AppStore] unparseable lists result")
            return
        }
        if let arr = obj["landed"], let s = Self.stringify(arr) { setLanded(s) }
        if let arr = obj["working"], let s = Self.stringify(arr) { setWorking(s) }
        if let arr = obj["skipped"], let s = Self.stringify(arr) { setSkipped(s) }
        if let arr = obj["progSkip"], let s = Self.stringify(arr) { setProgSkip(s) }
    }

    private static func stringify(_ value: Any) -> String? {
        guard let data = try? JSONSerialization.data(withJSONObject: value) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    var listsFragment: String {
        "{\"landed\":\(landedJSON),\"working\":\(workingJSON),\"skipped\":\(skippedJSON)}"
    }

    // MARK: - engine-backed actions (shared by Generator/Progression/Landed)

    /// Run a progression action (markLanded / unmark / skip / unskip /
    /// markSpin / unmarkSpin / markMod / unmarkMod) through the JS invariant
    /// logic and persist the returned lists.
    @discardableResult
    func progAction(_ action: String, id: String, spinKey: String? = nil, modKey: String? = nil) -> Bool {
        var parts = [
            "\"action\":\(Self.jsonString(action))",
            "\"id\":\(Self.jsonString(id))",
            "\"lists\":\(listsFragment)",
            "\"progSkip\":\(progSkipJSON)",
        ]
        if let spinKey { parts.append("\"spinKey\":\(Self.jsonString(spinKey))") }
        if let modKey { parts.append("\"modKey\":\(Self.jsonString(modKey))") }
        guard let out = GrindEngine.shared.callJSON("nativeProgAction", "{\(parts.joined(separator: ","))}") else {
            return false
        }
        applyListsResult(out)
        return true
    }

    /// Remove one entry by signature from 'landed' | 'working' | 'skipped'.
    func removeEntry(sig: String, from which: String) {
        let payload = "{\"lists\":\(listsFragment),\"which\":\(Self.jsonString(which)),\"sig\":\(Self.jsonString(sig))}"
        if let out = GrindEngine.shared.callJSON("nativeRemoveBySig", payload) {
            applyListsResult(out)
        }
    }

    // MARK: - Siri "repeat" cache

    /// The most recent trick Siri actually spoke (via GenerateGrindIntent),
    /// cached verbatim as the engine's own JSON so RepeatGrindIntent can
    /// re-decode and re-speak it later without generating a new one. A plain
    /// UserDefaults string — separate from `currentResult` (in-app, never
    /// persisted) and from the landed/working/skipped lists (JS-owned).
    func saveLastSiriResult(_ result: GenResult) {
        defaults.set(result.raw, forKey: Key.lastSiriResult)
    }

    func lastSiriResult() -> GenResult? {
        guard let raw = defaults.string(forKey: Key.lastSiriResult) else { return nil }
        return GenResult(raw: raw)
    }

    // MARK: - testing support

    func resetAll() {
        [Key.filters, Key.landed, Key.working, Key.skipped, Key.progSkip, Key.lastSiriResult].forEach {
            defaults.removeObject(forKey: $0)
        }
        loading = true
        if let json = GrindEngine.shared.callJSON("nativeDefaultFilters"),
           let fresh = try? JSONDecoder().decode(Filters.self, from: Data(json.utf8)) {
            filters = fresh
        }
        setLanded("[]", persist: false)
        setWorking("[]", persist: false)
        setSkipped("[]", persist: false)
        setProgSkip("[]", persist: false)
        loading = false
    }
}
