import SwiftUI

enum Screen: String, CaseIterable {
    case generator, landed, progression
}

/// App shell: screen switching + the custom bottom nav from the web app.
struct RootView: View {
    @State private var store = AppStore.shared
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
                bottomNav
            }
        }
        .background(Theme.bg)
        .preferredColorScheme(.light)
        .onAppear {
            // test-drive hook: reproduce "switch away and back" headlessly
            if ProcessInfo.processInfo.environment["RBG_TABTEST"] == "1" {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { screen = .landed }
                DispatchQueue.main.asyncAfter(deadline: .now() + 2.4) { screen = .generator }
            }
        }
    }

    private var bottomNav: some View {
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

