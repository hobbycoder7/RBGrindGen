import AppIntents

/// The settings-aware Siri trigger. perform() reads the persisted filter
/// settings (whatever is currently saved by the app — no parameters, no
/// hardcoded defaults) and generates against them, speaking just the trick
/// name back.
struct GenerateGrindIntent: AppIntent {
    static let title: LocalizedStringResource = "Generate a Grind"
    static let description = IntentDescription(
        "Generates a random trick using your current RB Grind settings."
    )
    static let openAppWhenRun = false

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        .result(dialog: GrindIntentLogic.generateDialog().asIntentDialog)
    }
}

/// Forces a fresh two-grind switch-up, regardless of the app's current
/// Single/Switch-Up/Practice/Work-On-Only mode — that mode is left
/// untouched in the store, this is a one-off ad hoc request.
struct SwitchUpGrindIntent: AppIntent {
    static let title: LocalizedStringResource = "Generate a Switch-Up"
    static let description = IntentDescription(
        "Generates a two-grind switch-up combo using your current RB Grind settings."
    )
    static let openAppWhenRun = false

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        .result(dialog: GrindIntentLogic.switchUpDialog().asIntentDialog)
    }
}

/// Repeats the last trick GenerateGrindIntent or SwitchUpGrindIntent spoke —
/// no new roll, just re-reads AppStore's cached last-Siri-result. Independent
/// of whatever the in-app Generator screen currently shows.
struct RepeatGrindIntent: AppIntent {
    static let title: LocalizedStringResource = "Repeat Last Grind"
    static let description = IntentDescription(
        "Repeats the last grind RB Grind gave you."
    )
    static let openAppWhenRun = false

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        .result(dialog: GrindIntentLogic.repeatDialog().asIntentDialog)
    }
}

/// Dialog-building split out so the exact intent path is testable in-process
/// as a plain string (see RBG_STORETEST=intenttest) — IntentDialog itself
/// isn't inspectable, so the AppIntents type only gets built at the boundary.
enum GrindIntentLogic {
    struct Dialog {
        let text: String
        var asIntentDialog: IntentDialog { IntentDialog(stringLiteral: text) }
    }

    @MainActor
    static func generateDialog() -> Dialog {
        dialog(forFreshResult: AppStore.shared.generate())
    }

    @MainActor
    static func switchUpDialog() -> Dialog {
        dialog(forFreshResult: AppStore.shared.generateSwitchUp())
    }

    @MainActor
    static func repeatDialog() -> Dialog {
        guard let result = AppStore.shared.lastSiriResult(), let display = result.short else {
            return Dialog(text: "You haven't asked for a grind yet — say Hey Siri, Grind first.")
        }
        return Dialog(text: display.main)
    }

    /// Shared tail of generateDialog/switchUpDialog: validate, cache for
    /// "repeat", speak the name.
    @MainActor
    private static func dialog(forFreshResult result: GenResult?) -> Dialog {
        guard let result else {
            return Dialog(text: "Something went wrong generating a trick. Open RB Grind and try there.")
        }
        if result.isEmpty {
            return Dialog(text: emptyMessage(for: result.emptyKey))
        }
        guard let display = result.short, !display.main.isEmpty else {
            return Dialog(text: "Something went wrong generating a trick. Open RB Grind and try there.")
        }
        AppStore.shared.saveLastSiriResult(result)
        return Dialog(text: display.main)
    }

    private static func emptyMessage(for key: String?) -> String {
        switch key ?? "" {
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
}

/// Registers the Siri phrases. Every phrase MUST contain \(.applicationName) —
/// a phrase without it builds fine but silently does nothing at runtime.
/// "Grind" works wherever the app name appears via INAlternativeAppNames, so
/// "Repeat \(.applicationName)" also matches spoken "Repeat Grind".
struct RBGrindShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: GenerateGrindIntent(),
            phrases: [
                "\(.applicationName)",
                "Give me a \(.applicationName)",
                "Give me a \(.applicationName) grind",
                "New \(.applicationName) grind",
                "Generate a \(.applicationName) grind",
            ],
            shortTitle: "Generate a Grind",
            systemImageName: "bolt.fill"
        )
        AppShortcut(
            intent: RepeatGrindIntent(),
            phrases: [
                "Repeat \(.applicationName)",
                "Repeat \(.applicationName) grind",
                "Repeat my last \(.applicationName)",
            ],
            shortTitle: "Repeat Last Grind",
            systemImageName: "arrow.counterclockwise"
        )
        AppShortcut(
            intent: SwitchUpGrindIntent(),
            phrases: [
                "\(.applicationName) switch up",
                "Switch up \(.applicationName)",
                "Give me a \(.applicationName) switch up",
                "Generate a \(.applicationName) switch up",
            ],
            shortTitle: "Generate a Switch-Up",
            systemImageName: "arrow.triangle.swap"
        )
    }
}
