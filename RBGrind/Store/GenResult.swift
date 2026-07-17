import Foundation

/// Decoded display block from a nativeGenerate result.
struct DisplayInfo: Codable, Equatable {
    let main: String
    let sub: String?
    let lead: String?
    let trail: String?
    let specialName: String?
    let bog: String?
    let legs: [Leg]?

    struct Leg: Codable, Equatable {
        let label: String
        let name: String
        let lead: String?
        let trail: String?
        let bog: String?
    }
}

/// One nativeGenerate outcome. `raw` is the exact JSON the engine returned —
/// it is passed back verbatim for landed/working/skip mutations so the
/// trick/chain payloads never round-trip through Swift types.
struct GenResult: Equatable {
    let raw: String
    let status: String
    let emptyKey: String?
    let isChain: Bool
    let sig: String?
    let short: DisplayInfo?
    let detailed: DisplayInfo?
    let fakieIn: Bool?    // single tricks: approach for the "Apch" row

    var isEmpty: Bool { status == "empty" }

    init?(raw: String) {
        struct Mirror: Codable {
            let status: String
            let emptyKey: String?
            let isChain: Bool?
            let sig: String?
            let displayShort: DisplayInfo?
            let displayDetailed: DisplayInfo?
            let trick: TrickMirror?
            struct TrickMirror: Codable {
                let entry: Entry?
                struct Entry: Codable { let fakieIn: Bool? }
            }
        }
        guard let mirror = try? JSONDecoder().decode(Mirror.self, from: Data(raw.utf8)) else { return nil }
        self.raw = raw
        self.status = mirror.status
        self.emptyKey = mirror.emptyKey
        self.isChain = mirror.isChain ?? false
        self.sig = mirror.sig
        self.short = mirror.displayShort
        self.detailed = mirror.displayDetailed
        self.fakieIn = mirror.trick?.entry?.fakieIn
    }

    static func == (lhs: GenResult, rhs: GenResult) -> Bool { lhs.raw == rhs.raw }
}

/// Base-trick metadata for the Tricks sheet.
struct BaseTrick: Codable, Identifiable {
    let id: String
    let name: String
    let fam: String
}

// MARK: - Generator actions on the store

extension AppStore {
    /// Full generate flow (drill / switch-up / hideLanded / normal) via JS.
    func generate(currentSig: String? = nil, extraSkipSig: String? = nil) -> GenResult? {
        var parts = [
            "\"filters\":\(filtersJSON)",
            "\"landed\":\(landedJSON)",
            "\"working\":\(workingJSON)",
            "\"skipped\":\(skippedJSON)",
        ]
        if let currentSig { parts.append("\"currentSig\":\(Self.jsonString(currentSig))") }
        if let extraSkipSig { parts.append("\"extraSkipSig\":\(Self.jsonString(extraSkipSig))") }
        guard let out = GrindEngine.shared.callJSON("nativeGenerate", "{\(parts.joined(separator: ","))}") else {
            return nil
        }
        return GenResult(raw: out)
    }

    private func mutateLists(_ function: String, result: GenResult, detailed: Bool) {
        let payload = "{\"lists\":\(listsFragment),\"result\":\(result.raw),\"detailed\":\(detailed)}"
        if let out = GrindEngine.shared.callJSON(function, payload) {
            applyListsResult(out)
        }
    }

    func toggleLanded(_ result: GenResult, detailed: Bool) { mutateLists("nativeToggleLanded", result: result, detailed: detailed) }
    func toggleWorking(_ result: GenResult, detailed: Bool) { mutateLists("nativeToggleWorking", result: result, detailed: detailed) }
    func skipTrick(_ result: GenResult, detailed: Bool) { mutateLists("nativeSkipTrick", result: result, detailed: detailed) }

    func isLanded(_ sig: String?) -> Bool { sig.map { s in landed.contains { $0.sig == s } } ?? false }
    func isWorking(_ sig: String?) -> Bool { sig.map { s in working.contains { $0.sig == s } } ?? false }

    /// Family-grouped base tricks for the sheet (cached after first fetch).
    static var baseListCache: (soul: [BaseTrick], groove: [BaseTrick])?
    var baseList: (soul: [BaseTrick], groove: [BaseTrick]) {
        if let cached = Self.baseListCache { return cached }
        struct Lists: Codable { let soul: [BaseTrick]; let groove: [BaseTrick] }
        guard let json = GrindEngine.shared.callJSON("nativeBaseList"),
              let lists = try? JSONDecoder().decode(Lists.self, from: Data(json.utf8)) else {
            return ([], [])
        }
        Self.baseListCache = (lists.soul, lists.groove)
        return Self.baseListCache!
    }

    func setAllTricks(_ tricks: [BaseTrick], enabled: Bool) {
        for trick in tricks { filters.tricks[trick.id] = enabled }
    }

    /// drillToggle port: turning a drill mode ON resets scope to All.
    func setDrill(_ key: WritableKeyPath<Filters, Bool>, on: Bool) {
        filters[keyPath: key] = on
        if on { filters.practiceScope = "all" }
    }

    /// Engine defaults (Reset / Test Mode buttons).
    func resetFilters(testMode: Bool) {
        let fn = testMode ? "nativeTestFilters" : "nativeDefaultFilters"
        if let json = GrindEngine.shared.callJSON(fn),
           let fresh = try? JSONDecoder().decode(Filters.self, from: Data(json.utf8)) {
            filters = fresh
        }
    }

    /// Port of the web activeChips summary strip.
    var activeChips: [String] {
        if filters.workOnly { return ["Work-On Only"] }
        if filters.practice { return ["Practice Mode"] }
        var chips: [String] = []
        let sp = filters.spins, sl = filters.sliders
        if filters.switchUp == 2 { chips.append("Switch Up") }
        chips.append(sp.inMin == sp.inMax ? "In \(sp.inMax)°" : "In \(sp.inMin)–\(sp.inMax)°")
        if filters.switchUp != 0 { chips.append(sp.suMin == sp.suMax ? "Sw \(sp.suMax)°" : "Sw \(sp.suMin)–\(sp.suMax)°") }
        if sp.outMax > 0 { chips.append(sp.outMin == sp.outMax ? "Out \(sp.outMax)°" : "Out \(sp.outMin)–\(sp.outMax)°") }
        if sp.fakieIn > 0 { chips.append("Fakie \(sp.fakieIn)%") }
        if sp.truespin { chips.append("Truespin") }
        if sp.rewindOut > 0 { chips.append("Rewind \(sp.rewindOut)%") }
        if sl.topside > 0 { chips.append("Top \(sl.topside)%") }
        if sl.switch > 0 { chips.append("Switch \(sl.switch)%") }
        if sl.negative > 0 { chips.append("Neg \(sl.negative)%") }
        if sl.rough > 0 { chips.append("Rough \(sl.rough)%") }
        if sl.tough > 0 { chips.append("Tough \(sl.tough)%") }
        if sl.christ > 0 { chips.append("Christ \(sl.christ)%") }
        if sl.antichrist > 0 { chips.append("Anti Christ \(sl.antichrist)%") }
        if filters.hideLanded { chips.append("Hide Landed") }
        return chips
    }
}
