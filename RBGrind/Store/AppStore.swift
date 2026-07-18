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
        static let currentResult = "rbrg_current_result"
        static let landedSuggestsNext = "rbrg_landed_suggests_next"
    }

    // MARK: typed filters (persist on every change)

    var filters: Filters {
        didSet { if !loading { persistFilters() } }
    }

    /// Whether "Grind Landed" / "Skip Grind" / "Save Grind" roll and speak a
    /// new trick after marking the previous one, or just confirm the mark
    /// and stop there. Native-only (not part of Filters — the web app has no
    /// such concept), surfaced as a toggle at the top of the Siri page.
    /// Defaults to on. (Symbol name predates Skip/Save; kept to avoid
    /// churning an already-persisted UserDefaults key for a cosmetic rename.)
    var landedSuggestsNext: Bool {
        didSet { if !loading { defaults.set(landedSuggestsNext, forKey: Key.landedSuggestsNext) } }
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

    // MARK: - current trick (shared by the Generator screen AND every Siri
    // command — Repeat/Landed/Skip/Save all act on this, and any of
    // Generate/Switch Up/Landed/Skip/Save writes it, from either surface)

    /// The trick/chain currently shown on the Generator screen. Persisted
    /// with a timestamp (see loadCurrentResult) so a Siri command — which
    /// may run in a separate process when the app isn't foregrounded — and
    /// the next app launch both pick up whatever was generated most
    /// recently, regardless of whether a tap or a voice command produced
    /// it. If the app is already running when Siri fires, this same
    /// @Observable mutation updates the live Generator screen directly.
    var currentResult: GenResult? {
        didSet { if !loading { persistCurrentResult() } }
    }

    /// One-step undo snapshot for the Generator's back arrow. Session-only —
    /// intentionally NOT persisted; "go back" isn't a meaningful concept
    /// across a relaunch or a separate Siri process.
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
        landedSuggestsNext = defaults.object(forKey: Key.landedSuggestsNext) != nil
            ? defaults.bool(forKey: Key.landedSuggestsNext)
            : true
        setLanded(defaults.string(forKey: Key.landed) ?? "[]", persist: false)
        setWorking(defaults.string(forKey: Key.working) ?? "[]", persist: false)
        setSkipped(defaults.string(forKey: Key.skipped) ?? "[]", persist: false)
        setProgSkip(defaults.string(forKey: Key.progSkip) ?? "[]", persist: false)
        // rehydrate whatever trick was last shown — by either the
        // Generator's own Generate button or a Siri command — so the app
        // picks up exactly where it left off, whichever surface drove it.
        // Freshness-gated so a trick from hours/days ago doesn't resurface.
        currentResult = Self.loadCurrentResult(from: defaults)
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

    // MARK: - current-trick persistence

    private struct CachedResult: Codable {
        let raw: String
        let at: Double   // Date().timeIntervalSince1970 when saved
    }

    /// How long a persisted trick stays valid to rehydrate into
    /// `currentResult` — checked ONLY when loading from disk (app launch,
    /// or a Siri command running in a fresh process because the app wasn't
    /// open). Once live in memory there's no further expiry; the screen
    /// just shows whatever it shows, same as any other on-screen state.
    /// Long enough to survive a real pause within one skate session (tying
    /// laces, a water break); short enough that reopening the app — or
    /// asking Siri — after a long gap doesn't resurface a trick from hours
    /// or days ago (the original bug: a stale cache never expired).
    /// 3600 / 2 = 30 minutes.
    static let currentResultMaxAge: TimeInterval = 3600 / 2

    private func persistCurrentResult() {
        guard let result = currentResult else {
            defaults.removeObject(forKey: Key.currentResult)
            return
        }
        let cached = CachedResult(raw: result.raw, at: Date().timeIntervalSince1970)
        guard let data = try? JSONEncoder().encode(cached),
              let json = String(data: data, encoding: .utf8) else { return }
        defaults.set(json, forKey: Key.currentResult)
    }

    /// Static (not tied to the singleton) so both `init()` and the
    /// staleness unit test can call it directly against a real
    /// `UserDefaults` without needing a fresh process.
    static func loadCurrentResult(from defaults: UserDefaults, maxAge: TimeInterval = currentResultMaxAge) -> GenResult? {
        guard let json = defaults.string(forKey: Key.currentResult),
              let cached = try? JSONDecoder().decode(CachedResult.self, from: Data(json.utf8)),
              Date().timeIntervalSince1970 - cached.at <= maxAge else { return nil }
        return GenResult(raw: cached.raw)
    }

    // MARK: - dev tools (Filters sheet → Dev section)

    /// Empties the landed list only — working/skipped/progression-skip stay.
    /// Progression tiles re-lock automatically (their state derives from
    /// landed sigs).
    func clearLanded() {
        setLanded("[]")
    }

    /// Zeroes every slider and spin control: the seven probability sliders,
    /// the In/Out/Switch-Up spin ranges, Fakie In, both Rewinds, and Truespin
    /// off. Session toggles (Work-On Only, Practice, Hide Landed) and Special
    /// Names First are deliberately untouched. Note the 0% Rough/Negative
    /// sliders also gate off Tea Kettle / Hot Dog / Stub Soul, same as
    /// dragging them there by hand; grooves still generate at their
    /// mandatory 90° lock with a 0–0 in-range.
    func zeroSliders() {
        var f = filters
        f.spins = .init(inMin: 0, inMax: 0, outMin: 0, outMax: 0,
                        fakieIn: 0, truespin: false, rewindOut: 0,
                        suMin: 0, suMax: 0, suRewind: 0)
        f.sliders = .init(switch: 0, topside: 0, negative: 0, christ: 0, antichrist: 0, rough: 0, tough: 0)
        filters = f
    }

    // MARK: - testing support

    func resetAll() {
        [Key.filters, Key.landed, Key.working, Key.skipped, Key.progSkip, Key.currentResult, Key.landedSuggestsNext].forEach {
            defaults.removeObject(forKey: $0)
        }
        loading = true
        if let json = GrindEngine.shared.callJSON("nativeDefaultFilters"),
           let fresh = try? JSONDecoder().decode(Filters.self, from: Data(json.utf8)) {
            filters = fresh
        }
        landedSuggestsNext = true
        setLanded("[]", persist: false)
        setWorking("[]", persist: false)
        setSkipped("[]", persist: false)
        setProgSkip("[]", persist: false)
        currentResult = nil
        previousResult = nil
        loading = false
    }
}
