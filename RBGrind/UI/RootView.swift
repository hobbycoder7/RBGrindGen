import SwiftUI

enum Screen: String, CaseIterable {
    case generator, landed, progression
}

/// App shell: screen switching + the custom bottom nav from the web app.
struct RootView: View {
    @State private var store = AppStore.shared
    @State private var screen: Screen = .generator

    var body: some View {
        VStack(spacing: 0) {
            switch screen {
            case .generator:
                GeneratorView(store: store)
            case .landed:
                PlaceholderScreen(title: "Landed", note: "Phase 5")
            case .progression:
                PlaceholderScreen(title: "Progression", note: "Phase 4")
            }
            bottomNav
        }
        .background(Theme.bg)
        .preferredColorScheme(.light)
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

struct PlaceholderScreen: View {
    let title: String
    let note: String

    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.system(size: 26, weight: .bold))
                .foregroundStyle(Theme.text)
            Text("Coming in \(note)")
                .font(.system(size: 13))
                .foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.bg)
    }
}
