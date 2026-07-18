import SwiftUI

struct GeneratorView: View {
    @Bindable var store: AppStore

    @State private var skipArmed = false
    @State private var sheetPage: Int?
    @State private var animKey = 0

    // on-screen trick state lives in the store (session-only) so it survives
    // tab switches — this view is recreated every time the tab comes back
    private var result: GenResult? { store.currentResult }
    private var previous: GenResult? { store.previousResult }
    private var exitDetailed: Bool { store.exitDetailed }

    private var display: DisplayInfo? {
        guard let result, !result.isEmpty else { return nil }
        return exitDetailed ? result.detailed : result.short
    }

    private var anyVisible: Bool { result != nil && !(result?.isEmpty ?? true) }
    private var isLanded: Bool { anyVisible && store.isLanded(result?.sig) }
    private var isWorking: Bool { anyVisible && store.isWorking(result?.sig) }
    private var tooHardActive: Bool {
        anyVisible && !store.filters.practice && !store.filters.workOnly && !(result?.isChain ?? false)
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            content
            if !store.activeChips.isEmpty {
                chipsRow
            }
            controls
        }
        .background(Theme.bg)
        .sheet(item: $sheetPage) { page in
            FilterSheetView(store: store, page: page)
        }
        .onAppear {
            if ProcessInfo.processInfo.environment["RBG_AUTOGEN"] == "1", result == nil {
                generateAction()
            }
            if let raw = ProcessInfo.processInfo.environment["RBG_SHEET"], let page = Int(raw) {
                sheetPage = page
            }
        }
    }

    // MARK: pieces

    private var header: some View {
        Text("RB Grind".uppercased())
            .font(.system(size: 10, weight: .semibold))
            .kerning(2)
            .foregroundStyle(Theme.muted)
            .frame(maxWidth: .infinity)
            .padding(.top, 14)
            .padding(.bottom, 4)
    }

    @ViewBuilder
    private var content: some View {
        ScrollView {
            VStack(spacing: 0) {
                if let result, result.isEmpty {
                    emptyState(result.emptyKey ?? "complete")
                } else if let result, let display {
                    if result.isChain {
                        chainView(display)
                    } else {
                        trickView(result, display)
                    }
                } else {
                    VStack(spacing: 8) {
                        Text("Your next grind".uppercased())
                            .font(Theme.trickName(size: 22))
                            .kerning(2)
                        Text("Tap generate.")
                            .font(.system(size: 14))
                    }
                    .foregroundStyle(Theme.muted)
                    .padding(.top, 80)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 20)
            .padding(.vertical, 8)
        }
        .frame(maxHeight: .infinity)
    }

    private func trickView(_ result: GenResult, _ display: DisplayInfo) -> some View {
        VStack(spacing: 6) {
            Text(display.main.uppercased())
                .font(Theme.trickName(size: Theme.nameFontSize(for: display.main)))
                .foregroundStyle(Theme.text)
                .multilineTextAlignment(.center)
                .lineSpacing(-2)
                .frame(minHeight: 120)
                .id(animKey)

            if let bog = display.bog, let url = URL(string: bog) {
                Link(destination: url) {
                    HStack(spacing: 5) {
                        Text("Book of Grinds".uppercased())
                        Image(systemName: "arrow.up.right.square")
                    }
                    .font(.system(size: 10, weight: .semibold))
                    .kerning(0.8)
                    .foregroundStyle(Theme.muted)
                    .opacity(0.8)
                }
            }

            detailPill

            VStack(spacing: 10) {
                footRow("Apch", result.fakieIn == true ? "Fakie" : "Forward")
                footRow("Trail", display.trail ?? "Grab/Freestyle")
                footRow("Lead", display.lead ?? "Grab/Freestyle")
            }
            .padding(.top, 14)
        }
    }

    private func chainView(_ display: DisplayInfo) -> some View {
        VStack(spacing: 5) {
            Text(display.main.uppercased())
                .font(Theme.trickName(size: Theme.nameFontSize(for: display.main)))
                .foregroundStyle(Theme.text)
                .multilineTextAlignment(.center)
                .frame(minHeight: 70)
                .id(animKey)
            Text("Switch-Up".uppercased())
                .font(.system(size: 11, weight: .semibold))
                .kerning(1.2)
                .foregroundStyle(Theme.muted)

            detailPill

            VStack(spacing: 14) {
                ForEach(Array((display.legs ?? []).enumerated()), id: \.offset) { _, leg in
                    VStack(alignment: .leading, spacing: 5) {
                        HStack {
                            Text(leg.label.uppercased())
                                .font(.system(size: 9, weight: .bold))
                                .kerning(1.3)
                                .foregroundStyle(Theme.muted)
                            Spacer()
                            if let bog = leg.bog, let url = URL(string: bog) {
                                Link(destination: url) {
                                    HStack(spacing: 3) {
                                        Text("BoG")
                                        Image(systemName: "arrow.up.right.square")
                                    }
                                    .font(.system(size: 9, weight: .semibold))
                                    .foregroundStyle(Theme.muted)
                                }
                            }
                        }
                        Text(leg.name.uppercased())
                            .font(Theme.trickName(size: 16))
                            .foregroundStyle(Theme.text)
                            .multilineTextAlignment(.leading)
                        Text("Trail: \(leg.trail ?? "Grab/Freestyle")  ·  Lead: \(leg.lead ?? "Grab/Freestyle")")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Theme.muted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 11)
                    .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12))
                }
            }
            .frame(maxWidth: 320)
            .padding(.top, 10)
        }
    }

    private var detailPill: some View {
        Button {
            skipArmed = false
            store.exitDetailed.toggle()
        } label: {
            Text("Detail".uppercased())
                .font(.system(size: 10, weight: .bold))
                .kerning(1.2)
                .foregroundStyle(exitDetailed ? Theme.white : Theme.muted)
                .padding(.horizontal, 13)
                .padding(.vertical, 5)
                .background(exitDetailed ? Theme.accent : Theme.surface, in: Capsule())
        }
        .buttonStyle(.plain)
        .padding(.top, 10)
    }

    private func footRow(_ label: String, _ value: String) -> some View {
        HStack(spacing: 16) {
            Text(label.uppercased())
                .font(.system(size: 10, weight: .semibold))
                .kerning(1.4)
                .foregroundStyle(Theme.muted)
                .frame(width: 40, alignment: .trailing)
            Rectangle().fill(Theme.border).frame(width: 1, height: 12)
            Text(value)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Theme.text)
                .frame(minWidth: 90, alignment: .leading)
        }
    }

    private func emptyState(_ key: String) -> some View {
        let isDrillEmpty = key.hasPrefix("practice-empty") || key.hasPrefix("workonly-empty")
        let icon = key == "disabled" ? "🎛️" : isDrillEmpty ? "🎯" : "🏁"
        let title: String = switch key {
        case "disabled": "No Tricks Enabled"
        case "practice-empty-double", "workonly-empty-double": "No Switch-Ups Saved"
        case "practice-empty": "Nothing to Practice"
        case "workonly-empty": "Nothing to Work On"
        default: "Pool Complete"
        }
        let body: String = switch key {
        case "disabled":
            "No trick can roll right now. Either every trick is off, or the only ones enabled are gated behind a modifier that's at 0% (Rough or Negative). Open Tricks to enable more, raise those sliders, or hit Reset."
        case "practice-empty-double", "workonly-empty-double":
            "No switch-ups saved yet. Generate a switch-up and mark it landed or working-on, or switch the filter to Single or All."
        case "practice-empty":
            "No landed or working-on tricks yet. Land some tricks first, then switch Practice Mode on to drill them."
        case "workonly-empty":
            "No working-on tricks yet. Flag some tricks as working-on first, then switch this on to drill just those."
        default:
            "You've landed every available grind in the current pool. Turn off Hide Landed, or enable more tricks to keep going."
        }
        return VStack(spacing: 0) {
            Text(icon).font(.system(size: 28)).padding(.bottom, 16)
            Text(title.uppercased())
                .font(Theme.trickName(size: 20))
                .kerning(1.2)
                .foregroundStyle(Theme.text)
                .padding(.bottom, 10)
            Text(body)
                .font(.system(size: 13))
                .lineSpacing(4)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 40)
        .padding(.horizontal, 16)
    }

    private var chipsRow: some View {
        FlowChips(chips: store.activeChips)
            .padding(.horizontal, 22)
            .padding(.bottom, 10)
    }

    private var controls: some View {
        VStack(spacing: 10) {
            segmentControl
            buttonRow
            HStack(spacing: 10) {
                sheetButton("Tricks", icon: "square.grid.2x2") { sheetPage = 0 }
                sheetButton("Filter", icon: "line.3.horizontal.decrease") { sheetPage = 1 }
                sheetButton("Siri", icon: "waveform") { sheetPage = 2 }
            }
        }
        .padding(.horizontal, 22)
        .padding(.bottom, 16)
    }

    private var segmentControl: some View {
        let drillOn = store.filters.practice || store.filters.workOnly
        return HStack(spacing: 0) {
            if drillOn {
                segPill("Single", on: store.filters.practiceScope == "single") { store.filters.practiceScope = "single" }
                segPill("Switch Up", on: store.filters.practiceScope == "double") { store.filters.practiceScope = "double" }
                segPill("All", on: store.filters.practiceScope == "all") { store.filters.practiceScope = "all" }
            } else {
                segPill("Single", on: store.filters.switchUp == 0) { store.filters.switchUp = 0 }
                segPill("Switch Up", on: store.filters.switchUp == 2) { store.filters.switchUp = 2 }
            }
        }
        .padding(3)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12))
    }

    private func segPill(_ label: String, on: Bool, action: @escaping () -> Void) -> some View {
        Button {
            skipArmed = false
            action()
        } label: {
            Text(label.uppercased())
                .font(.system(size: 11, weight: .bold))
                .kerning(0.9)
                .foregroundStyle(on ? Theme.text : Theme.muted)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(on ? Theme.white : .clear, in: RoundedRectangle(cornerRadius: 9))
                .shadow(color: on ? .black.opacity(0.12) : .clear, radius: 1.5, y: 1)
        }
        .buttonStyle(.plain)
    }

    private var buttonRow: some View {
        HStack(spacing: 8) {
            squareButton(active: previous != nil, fill: Theme.surface, fg: Theme.muted) {
                goBack()
            } label: {
                Image(systemName: "arrow.uturn.backward")
            }

            Button { generateAction() } label: {
                Text("Generate".uppercased())
                    .font(.system(size: 14, weight: .semibold))
                    .kerning(1.4)
                    .foregroundStyle(Theme.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(Theme.accent, in: RoundedRectangle(cornerRadius: 14))
            }
            .buttonStyle(.plain)

            squareButton(active: anyVisible, fill: isLanded ? Theme.accent : Theme.surface, fg: isLanded ? Theme.white : Theme.muted) {
                guard let result else { return }
                skipArmed = false
                store.toggleLanded(result, detailed: exitDetailed)
            } label: {
                Image(systemName: isLanded ? "bookmark.fill" : "bookmark")
            }

            squareButton(active: anyVisible, fill: isWorking ? Theme.accent : Theme.surface, fg: isWorking ? Theme.white : Theme.muted) {
                guard let result else { return }
                skipArmed = false
                store.toggleWorkingOn(result, detailed: exitDetailed)
            } label: {
                Image(systemName: isWorking ? "target" : "circle.circle")
            }

            squareButton(active: tooHardActive, fill: skipArmed ? Theme.armRed : Theme.surface, fg: skipArmed ? Theme.white : Theme.muted) {
                tooHardAction()
            } label: {
                Image(systemName: "nosign")
            }
        }
    }

    private func squareButton(active: Bool, fill: Color, fg: Color, action: @escaping () -> Void, @ViewBuilder label: () -> some View) -> some View {
        Button(action: action) {
            label()
                .font(.system(size: 18, weight: .medium))
                .foregroundStyle(fg)
                .frame(width: 48, height: 54)
                .background(fill, in: RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
        .disabled(!active)
        .opacity(active ? 1 : 0.35)
    }

    private func sheetButton(_ label: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon).font(.system(size: 12, weight: .semibold))
                Text(label.uppercased())
                    .font(.system(size: 11, weight: .semibold))
                    .kerning(0.7)
            }
            .foregroundStyle(Theme.text)
            .frame(maxWidth: .infinity)
            .frame(height: 40)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 11))
        }
        .buttonStyle(.plain)
    }

    // MARK: actions

    private func generateAction(extraSkipSig: String? = nil) {
        skipArmed = false
        let currentSig = (result?.isEmpty ?? true) ? nil : result?.sig
        guard let next = store.generate(currentSig: currentSig, extraSkipSig: extraSkipSig) else { return }
        if next.isEmpty {
            if anyVisible { store.previousResult = result }
            store.currentResult = next
        } else {
            if anyVisible { store.previousResult = result }
            withAnimation(.easeOut(duration: 0.08)) {
                store.currentResult = next
                animKey += 1
            }
        }
    }

    private func goBack() {
        guard let previous else { return }
        skipArmed = false
        store.currentResult = previous
        store.previousResult = nil
        animKey += 1
    }

    private func tooHardAction() {
        guard tooHardActive, let result else { return }
        if skipArmed {
            skipArmed = false
            store.skipTrick(result, detailed: exitDetailed)
            generateAction(extraSkipSig: result.sig)
        } else {
            skipArmed = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) { skipArmed = false }
        }
    }
}

/// Wrapping chip row (web: flex-wrap centered).
struct FlowChips: View {
    let chips: [String]

    var body: some View {
        ChipFlowLayout(spacing: 5) {
            ForEach(chips, id: \.self) { Chip(text: $0) }
        }
    }
}

/// Minimal centered flow layout for chips.
struct ChipFlowLayout: Layout {
    var spacing: CGFloat = 5

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? 390
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0
        for size in subviews.map({ $0.sizeThatFits(.unspecified) }) {
            if x + size.width > maxWidth, x > 0 { x = 0; y += rowHeight + spacing; rowHeight = 0 }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: maxWidth, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let maxWidth = bounds.width
        var rows: [[(LayoutSubviews.Element, CGSize)]] = [[]]
        var x: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 { rows.append([]); x = 0 }
            rows[rows.count - 1].append((subview, size))
            x += size.width + spacing
        }
        var y = bounds.minY
        for row in rows {
            let rowWidth = row.reduce(0) { $0 + $1.1.width } + spacing * CGFloat(max(0, row.count - 1))
            var rx = bounds.minX + (maxWidth - rowWidth) / 2
            let rowHeight = row.map(\.1.height).max() ?? 0
            for (subview, size) in row {
                subview.place(at: CGPoint(x: rx, y: y), proposal: ProposedViewSize(size))
                rx += size.width + spacing
            }
            y += rowHeight + spacing
        }
    }
}

extension Int: @retroactive Identifiable {
    public var id: Int { self }
}
