import Foundation
import JavaScriptCore

/// Swift↔JS bridge to the verified trick engine.
///
/// `grind_engine.js` is the untouched logic slice of the web app (lines 3–1202
/// of rb-trick-gen-v3_05.jsx) plus a `native*` wrapper layer. Every call across
/// the boundary is a JSON string in → JSON string out, so Swift never pokes at
/// JS internals directly.
final class GrindEngine {
    static let shared = GrindEngine()

    /// Boxed so the exception handler closure can write without capturing self mid-init.
    private final class ErrorBox { var last: String? }

    private let context: JSContext
    private let errorBox = ErrorBox()

    private init() {
        guard let ctx = JSContext() else { fatalError("JSContext unavailable") }
        context = ctx
        let box = errorBox
        context.exceptionHandler = { _, exception in
            let message = exception?.toString() ?? "unknown JS exception"
            box.last = message
            print("[GrindEngine] JS exception: \(message)")
        }
        guard let url = Bundle.main.url(forResource: "grind_engine", withExtension: "js"),
              let source = try? String(contentsOf: url, encoding: .utf8) else {
            fatalError("[GrindEngine] grind_engine.js missing from app bundle")
        }
        context.evaluateScript(source, withSourceURL: url)
        if let err = errorBox.last {
            fatalError("[GrindEngine] engine failed to evaluate: \(err)")
        }
    }

    /// Call a native* wrapper taking zero or one JSON-string argument and
    /// returning a JSON string. Returns nil (and logs) on any JS error.
    @discardableResult
    func callJSON(_ function: String, _ payload: String? = nil) -> String? {
        errorBox.last = nil
        guard let fn = context.objectForKeyedSubscript(function), !fn.isUndefined else {
            print("[GrindEngine] missing JS function: \(function)")
            return nil
        }
        let args: [Any] = payload.map { [$0] } ?? []
        let result = fn.call(withArguments: args)
        if let err = errorBox.last {
            print("[GrindEngine] \(function) threw: \(err)")
            return nil
        }
        guard let result, result.isString else {
            print("[GrindEngine] \(function) returned a non-string")
            return nil
        }
        return result.toString()
    }
}

// MARK: - Launch self-test (Phase 1 milestone evidence)

enum GrindEngineSelfTest {
    /// Runs when the app is launched with RBG_SELFTEST=1 in its environment
    /// (`SIMCTL_CHILD_RBG_SELFTEST=1 simctl launch --console-pty …`).
    /// Prints the JS self-test report, a live generated trick, and all 49
    /// progression tiles — proving the bridge works for both engine halves.
    static func runIfRequested() {
        guard ProcessInfo.processInfo.environment["RBG_SELFTEST"] == "1" else { return }
        print("RBG-SELFTEST: begin")
        let engine = GrindEngine.shared

        guard let reportJSON = engine.callJSON("nativeSelfTest"),
              let report = jsonObject(reportJSON) else {
            print("RBG-SELFTEST: FAIL — nativeSelfTest unavailable")
            return
        }
        let pass = report["pass"] as? Bool ?? false
        print("RBG-SELFTEST: engine self-test \(pass ? "PASS" : "FAIL")")
        for check in report["checks"] as? [[String: Any]] ?? [] {
            let okay = check["pass"] as? Bool ?? false
            print("RBG-SELFTEST:   \(okay ? "ok  " : "FAIL") \(check["name"] as? String ?? "?")")
        }
        let samples = (report["samples"] as? [String] ?? []).joined(separator: " | ")
        print("RBG-SELFTEST: samples: \(samples)")

        if let filters = engine.callJSON("nativeDefaultFilters"),
           let genJSON = engine.callJSON("nativeGenerate",
                "{\"filters\":\(filters),\"landed\":[],\"working\":[],\"skipped\":[]}"),
           let gen = jsonObject(genJSON),
           let display = gen["displayShort"] as? [String: Any] {
            let lead = display["lead"] as? String ?? "—"
            let trail = display["trail"] as? String ?? "—"
            print("RBG-SELFTEST: generated \"\(display["main"] as? String ?? "?")\" lead=\(lead) trail=\(trail)")
        } else {
            print("RBG-SELFTEST: FAIL — nativeGenerate round-trip failed")
        }

        if let tiles = report["tiles"] as? [[String: Any]] {
            print("RBG-SELFTEST: tiles (\(tiles.count)):")
            for tile in tiles {
                let row = tile["row"] as? Int ?? -1
                let glyph = tile["glyph"] as? String ?? "?"
                let name = tile["name"] as? String ?? "?"
                print("RBG-SELFTEST:   row \(row)  [\(glyph)] \(name)")
            }
        }
        print("RBG-SELFTEST: end")
    }

    private static func jsonObject(_ json: String) -> [String: Any]? {
        guard let data = json.data(using: .utf8) else { return nil }
        return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
    }
}
