import Foundation

/// Static tree data from nativeProgTree() — computed once by the engine.
struct ProgTree: Codable {
    let nodes: [ProgNode]
    let canvasW: Double
    let canvasH: Double
    let tile: Double
    let minGap: Double
    let tierY0: Double
    let tierGap: Double
}

struct ProgNode: Codable, Identifiable {
    let id: String
    let base: String
    let fam: String
    let name: String
    let glyph: String
    let sig: String
    let x: Double
    let y: Double
    let tier: Int
    let parents: [[String]]
    let parentsFlat: [String]
    let parentNames: [[String]]
    let canSkip: Bool
    let isSpinTile: Bool
    let legs: Legs
    let bog: String

    struct Legs: Codable { let lead: String?; let trail: String? }

    /// "Suggested after" text: AND-groups joined with " + ", OR'd with ", or ".
    var suggestedAfter: String {
        parentNames.map { $0.joined(separator: " + ") }.joined(separator: ", or ")
    }
}

struct ProgStateResult: Codable {
    let states: [String: String]
    let allDone: Bool
    let landedIds: [String]
}

struct DrawerData: Codable {
    let spins: [Chip]
    let mods: [Chip]

    struct Chip: Codable, Identifiable {
        let key: String
        let label: String
        let name: String
        let sig: String
        let landed: Bool
        let bog: String?
        var id: String { key }
    }
}

extension AppStore {
    private static var progTreeCache: ProgTree?

    var progTree: ProgTree? {
        if let cached = Self.progTreeCache { return cached }
        guard let json = GrindEngine.shared.callJSON("nativeProgTree"),
              let tree = try? JSONDecoder().decode(ProgTree.self, from: Data(json.utf8)) else {
            return nil
        }
        Self.progTreeCache = tree
        return tree
    }

    func progStates() -> ProgStateResult? {
        let payload = "{\"landed\":\(landedJSON),\"progSkip\":\(progSkipJSON)}"
        guard let json = GrindEngine.shared.callJSON("nativeProgState", payload) else { return nil }
        return try? JSONDecoder().decode(ProgStateResult.self, from: Data(json.utf8))
    }

    func progStranded(id: String) -> Int {
        let payload = "{\"landed\":\(landedJSON),\"progSkip\":\(progSkipJSON),\"id\":\(Self.jsonString(id))}"
        guard let json = GrindEngine.shared.callJSON("nativeProgStranded", payload),
              let obj = (try? JSONSerialization.jsonObject(with: Data(json.utf8))) as? [String: Any] else {
            return 0
        }
        return obj["stranded"] as? Int ?? 0
    }

    func progDrawer(id: String) -> DrawerData? {
        let payload = "{\"id\":\(Self.jsonString(id)),\"landed\":\(landedJSON)}"
        guard let json = GrindEngine.shared.callJSON("nativeProgDrawer", payload) else { return nil }
        return try? JSONDecoder().decode(DrawerData.self, from: Data(json.utf8))
    }
}
