import SwiftUI

enum Screen: String, CaseIterable {
    case generator, landed, progression
}

/// App shell: screen switching + the custom bottom nav from the web app.
///
/// The store (and with it the JS engine) is NOT touched until after the first
/// frame: SwiftUI paints the splash immediately, then the deferred `.task`
/// does the blocking AppStore/JSContext init behind it. Before this, the
/// engine loaded before anything drew — on a device Debug build that read as
/// a frozen white screen.
struct RootView: View {
    @State private var store: AppStore?
    @State private var screen: Screen = .generator
    @State private var progSelection: String?

    init() {
        // test-drive hooks: jump straight to a screen / preselect a tree node
        let env = ProcessInfo.processInfo.environment
        if let name = env["RBG_SCREEN"], let target = Screen(rawValue: name) {
            _screen = State(initialValue: target)
        }
        if let sel = env["RBG_PROGSEL"] {
            _progSelection = State(initialValue: sel)
        }
    }

    var body: some View {
        Group {
            if let store {
                appShell(store)
            } else {
                LaunchSplash()
                    .task {
                        // test-drive hook: the splash is a single frame on a fast
                        // launch, so hold it to screenshot the loading state
                        if let hold = ProcessInfo.processInfo.environment["RBG_SPLASHHOLD"],
                           let seconds = Double(hold) {
                            try? await Task.sleep(for: .seconds(seconds))
                        }
                        // runs after the splash's first frame is committed
                        store = AppStore.shared
                    }
            }
        }
        .background(Theme.bg)
        .preferredColorScheme(.light)
    }

    private func appShell(_ store: AppStore) -> some View {
        VStack(spacing: 0) {
            switch screen {
            case .generator:
                GeneratorView(store: store)
            case .landed:
                LandedView(store: store)
            case .progression:
                ProgressionView(store: store, selection: $progSelection)
            }
            // the progression detail footer replaces the nav while a tile is selected
            if !(screen == .progression && progSelection != nil) {
                bottomNav(store)
            }
        }
        .onAppear {
            // test-drive hook: reproduce "switch away and back" headlessly
            if ProcessInfo.processInfo.environment["RBG_TABTEST"] == "1" {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { screen = .landed }
                DispatchQueue.main.asyncAfter(deadline: .now() + 2.4) { screen = .generator }
            }
        }
    }

    private func bottomNav(_ store: AppStore) -> some View {
        HStack(spacing: 0) {
            navTab(.generator, label: "Generator", icon: "bolt")
            navTab(.landed, label: store.landed.isEmpty ? "Landed" : "Landed (\(store.landed.count))", icon: "list.bullet")
            navTab(.progression, label: "Progression", icon: "point.3.filled.connected.trianglepath.dotted")
        }
        .padding(.top, 12)
        .padding(.bottom, 6)
        .background(Theme.bg)
        .overlay(alignment: .top) { Rectangle().fill(Theme.border).frame(height: 1) }
    }

    /// Holds the launch screen's look while the engine loads, so the handoff
    /// from `LaunchScreen.storyboard` to SwiftUI is invisible: same cream field,
    /// same centred wordmark at the same size/kerning/position. Only the spinner
    /// is added — it marks a slow cold start as loading rather than frozen.
    ///
    /// Any change to the wordmark here has to be mirrored in the storyboard.
    private struct LaunchSplash: View {
        var body: some View {
            ZStack {
                Theme.bg
                Text("RB Grind".uppercased())
                    .font(.system(size: 17, weight: .semibold))
                    .kerning(6)
                    .foregroundStyle(Theme.text)
                VStack {
                    Spacer()
                    ProgressView()
                        .tint(Theme.muted)
                        .padding(.bottom, 88)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .ignoresSafeArea()
        }
    }

    private func navTab(_ target: Screen, label: String, icon: String) -> some View {
        let active = screen == target
        return Button {
            screen = target
        } label: {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 17, weight: active ? .semibold : .medium))
                Text(label.uppercased())
                    .font(.system(size: 10, weight: .semibold))
                    .kerning(0.8)
            }
            .foregroundStyle(active ? Theme.accent : Theme.muted)
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }
}

