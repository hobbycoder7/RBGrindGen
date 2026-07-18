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

/// Marks the last Siri-spoken trick landed, then immediately speaks a new
/// one the same way it came — a switch-up leads to another switch-up, a
/// single to another single — so "land it, hear the next one" stays
/// hands-free through a whole session.
struct GrindLandedIntent: AppIntent {
    static let title: LocalizedStringResource = "Mark Grind Landed"
    static let description = IntentDescription(
        "Marks your last RB Grind trick as landed, then generates a new one."
    )
    static let openAppWhenRun = false

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        .result(dialog: GrindIntentLogic.landedDialog().asIntentDialog)
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

/// Speaks a quick tour of the voice commands, most important first.
struct GrindHelpIntent: AppIntent {
    static let title: LocalizedStringResource = "RB Grind Help"
    static let description = IntentDescription(
        "Explains the RB Grind voice commands."
    )
    static let openAppWhenRun = false

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        .result(dialog: "\(GrindIntentLogic.helpText)")
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
        return Dialog(text: spokenForm(display.main))
    }

    /// Siri-only expansion of the display abbreviations so they're spoken as
    /// words: "BS Royale" → "Backside Royale", "AO Soul" → "Alley-oop Soul".
    /// The Generator screen keeps showing BS/AO. Internal (not private) so the
    /// intenttest can pin the exact behavior with fixed strings.
    static func spokenForm(_ text: String) -> String {
        text
            .replacingOccurrences(of: "\\bBS\\b", with: "Backside", options: .regularExpression)
            .replacingOccurrences(of: "\\bAO\\b", with: "Alley-oop", options: .regularExpression)
    }

    /// Marks whatever was last spoken landed (one-way — never un-marks). If
    /// `landedSuggestsNext` is on (default), also rolls and speaks the next
    /// one the same way the last came: the last result's own isChain decides
    /// single vs. switch-up, not the app's stored toggle, since the last one
    /// may itself have come from the ad hoc "Switch Up Grind" phrase. The
    /// "Landed!" lead-in only applies to a real new trick — an empty-pool/
    /// error message speaks plain, no lead-in. With the toggle off, the chain
    /// ends at the landing: just "Landed!", no new trick, cache untouched.
    @MainActor
    static func landedDialog() -> Dialog {
        let store = AppStore.shared
        guard let last = store.lastSiriResult() else {
            return Dialog(text: "You haven't asked for a grind yet — say Hey Siri, Grind first.")
        }
        store.markLandedIfNeeded(last)
        guard store.landedSuggestsNext else {
            return Dialog(text: "Landed!")
        }
        let nextResult = last.isChain ? store.generateSwitchUp() : store.generate()
        return dialog(forFreshResult: nextResult, leadIn: "Landed! Next up,")
    }

    /// Shared tail of generateDialog/switchUpDialog/landedDialog: validate,
    /// cache for "repeat", speak the name (optionally prefixed).
    @MainActor
    private static func dialog(forFreshResult result: GenResult?, leadIn: String? = nil) -> Dialog {
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
        let spoken = spokenForm(display.main)
        return Dialog(text: leadIn.map { "\($0) \(spoken)" } ?? spoken)
    }

    /// Spoken command tour, most important first: core generate, the
    /// hands-free session driver, the alternate generate mode, then the
    /// convenience repeat. Internal for intenttest.
    static let helpText = "Here are the R B Grind voice commands. "
        + "Say Grind to hear a random trick. "
        + "Say Grind Landed to mark it landed and hear the next one. "
        + "Say Grind Switch Up for a two grind combo instead. "
        + "And say Repeat Grind to hear the last one again. "
        + "The full list is in the app, under Siri."

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
                "New \(.applicationName)",
                "Generate a \(.applicationName)",
            ],
            shortTitle: "Generate a Grind",
            systemImageName: "bolt.fill"
        )
        AppShortcut(
            intent: RepeatGrindIntent(),
            phrases: [
                "Repeat \(.applicationName)",
                "Repeat previous \(.applicationName)",
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
        AppShortcut(
            intent: GrindLandedIntent(),
            phrases: [
                "\(.applicationName) landed",
                "\(.applicationName) landon",   // Siri often hears "landed" as "landon"
                "Mark \(.applicationName) landed",
                "I landed my \(.applicationName)",
            ],
            shortTitle: "Mark Landed & Next",
            systemImageName: "bookmark.fill"
        )
        AppShortcut(
            intent: GrindHelpIntent(),
            phrases: [
                "\(.applicationName) help",
                "Help with \(.applicationName)",
                "\(.applicationName) commands",
                "\(.applicationName) voice commands",
            ],
            shortTitle: "Help",
            systemImageName: "questionmark.circle"
        )
    }
}
