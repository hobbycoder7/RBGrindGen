import AppIntents

/// The settings-aware Siri trigger. perform() reads the persisted filter
/// settings (whatever is currently saved by the app — no parameters, no
/// hardcoded defaults) and generates against them, speaking the result back.
struct GenerateGrindIntent: AppIntent {
    static let title: LocalizedStringResource = "Generate a Grind"
    static let description = IntentDescription(
        "Generates a random trick using your current RB Grind settings."
    )
    static let openAppWhenRun = false

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        .result(dialog: "\(GrindIntentLogic.dialogText())")
    }
}

/// Dialog-building split out so the exact intent path is testable in-process.
enum GrindIntentLogic {
    @MainActor
    static func dialogText() -> String {
        let store = AppStore.shared
        guard let result = store.generate() else {
            return "Something went wrong generating a trick. Open RB Grind and try there."
        }
        if result.isEmpty {
            return switch result.emptyKey ?? "" {
            case "disabled":
                "No tricks are enabled right now. Open RB Grind and turn some tricks back on."
            case "practice-empty", "practice-empty-double":
                "There's nothing to practice yet. Land or flag some tricks in the app first."
            case "workonly-empty", "workonly-empty-double":
                "There's nothing on your working-on list yet. Flag some tricks in the app first."
            default:
                "Pool complete — you've landed everything available. Turn off Hide Landed or enable more tricks."
            }
        }
        guard let name = result.short?.main else {
            return "Something went wrong generating a trick. Open RB Grind and try there."
        }
        return "Try \(name)"
    }
}

/// Registers the Siri phrases. Every phrase MUST contain \(.applicationName) —
/// a phrase without it builds fine but silently does nothing at runtime.
/// "Grind" works wherever the app name appears via INAlternativeAppNames.
/// The bare-name phrase is an untested-territory attempt; the longer ones are
/// the guaranteed-working fallbacks.
struct RBGrindShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: GenerateGrindIntent(),
            phrases: [
                "\(.applicationName)",
                "Give me a \(.applicationName)",
                "Give me a \(.applicationName) trick",
                "New \(.applicationName) trick",
                "Generate a \(.applicationName) trick",
            ],
            shortTitle: "Generate a Grind",
            systemImageName: "bolt.fill"
        )
    }
}
