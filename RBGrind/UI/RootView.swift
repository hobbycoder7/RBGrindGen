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

    /// Instant first frame while the engine loads: the app-icon tile look on
    /// the cream field (continuous with the static launch screen) plus a
    /// spinner so a slow cold start reads as loading, not frozen.
    private struct LaunchSplash: View {
        var body: some View {
            VStack(spacing: 22) {
                ZStack {
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Theme.accent)
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(Theme.landedBorder, lineWidth: 4)
                    Text("RB")
                        .font(Theme.glyph(size: 44))
                        .foregroundStyle(Theme.white)
                }
                .frame(width: 112, height: 112)
                .overlay(alignment: .topTrailing) {
                    Circle()
                        .fill(Theme.accent)
                        .overlay(Circle().stroke(Theme.bg, lineWidth: 3))
                        .frame(width: 22, height: 22)
                        .offset(x: 8, y: -8)
                }
                Text("RB Grind".uppercased())
                    .font(.system(size: 11, weight: .semibold))
                    .kerning(2.2)
                    .foregroundStyle(Theme.muted)
                ProgressView()
                    .tint(Theme.muted)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Theme.bg)
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

