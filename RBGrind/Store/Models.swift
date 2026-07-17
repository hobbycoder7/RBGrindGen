import Foundation

/// Mirror of the web app's `filters` object — field names must match the JS
/// shape exactly (this struct is encoded straight into engine payloads and
/// decoded from `nativeMergeFilters` / `nativeDefaultFilters` output).
struct Filters: Codable, Equatable {
    var tricks: [String: Bool]
    var testMode: Bool
    var spins: Spins
    var sliders: Sliders
    var hideLanded: Bool
    var practice: Bool
    var workOnly: Bool
    var specialFirst: Bool
    var switchUp: Int
    var practiceScope: String

    struct Spins: Codable, Equatable {
        var inMin: Int
        var inMax: Int
        var outMin: Int
        var outMax: Int
        var fakieIn: Int
        var truespin: Bool
        var rewindOut: Int
        var suMin: Int
        var suMax: Int
        var suRewind: Int
    }

    struct Sliders: Codable, Equatable {
        var `switch`: Int
        var topside: Int
        var negative: Int
        var christ: Int
        var antichrist: Int
        var rough: Int
        var tough: Int
    }
}

/// Read-only view of a landed/working/skipped entry for UI display.
///
/// Entries also carry `trick`/`chain` payloads that only the JS engine needs;
/// Swift never re-encodes entries (the raw JSON array strings are passed back
/// to JS verbatim), so ignoring those fields here is lossless.
struct TrickEntry: Codable, Identifiable, Equatable {
    let sig: String
    let display: String
    let lead: String?
    let trail: String?
    let at: Double            // Date.now() — milliseconds since epoch
    let isChain: Bool?

    var id: String { sig }
    var date: Date { Date(timeIntervalSince1970: at / 1000) }
}
