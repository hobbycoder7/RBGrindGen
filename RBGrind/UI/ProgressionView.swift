import SwiftUI

/// The 49-tile skill tree — mirror of the web Progression screen.
struct ProgressionView: View {
    @Bindable var store: AppStore
    @Binding var selection: String?

    @State private var state: ProgStateResult?
    @State private var drawer: DrawerData?
    @State private var confirmSkip = false

    private var tree: ProgTree? { store.progTree }
    private var selectedNode: ProgNode? {
        guard let selection, let tree else { return nil }
        return tree.nodes.first { $0.id == selection }
    }
    private func stateOf(_ id: String) -> String { state?.states[id] ?? "locked" }

    var body: some View {
        GeometryReader { geo in
            VStack(spacing: 0) {
                header
                if state?.allDone == true {
                    completeBanner
                }
                legend
                Divider().overlay(Theme.border)
                treeMap
                if let node = selectedNode {
                    // Bounded so the drawer can never overflow past the screen edge
                    // (SwiftUI doesn't auto-scroll an overflowing VStack) — the footer
                    // itself scrolls internally past this budget instead.
                    footer(node, maxHeight: geo.size.height * 0.62)
                }
            }
            .background(Theme.bg)
        }
        .onAppear { refresh() }
        .onChange(of: store.landedJSON) { refresh() }
        .onChange(of: store.progSkipJSON) { refresh() }
        .onChange(of: selection) {
            confirmSkip = false
            refreshDrawer()
        }
    }

    private func refresh() {
        state = store.progStates()
        refreshDrawer()
    }

    private func refreshDrawer() {
        drawer = selection.flatMap { store.progDrawer(id: $0) }
    }

    // MARK: chrome

    private var header: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text("Progression")
                .font(.system(size: 26, weight: .bold))
                .foregroundStyle(Theme.text)
            Text("Land a trick to unlock what comes next.")
                .font(.system(size: 12))
                .foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 22)
        .padding(.top, 14)
        .padding(.bottom, 14)
    }

    private var completeBanner: some View {
        Text("✦ TREE COMPLETE ✦")
            .font(.system(size: 14, weight: .heavy))
            .kerning(1.1)
            .foregroundStyle(Theme.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 11)
            .background(Theme.accent, in: RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal, 16)
            .padding(.bottom, 12)
    }

    private var legend: some View {
        HStack(spacing: 14) {
            legendItem("Landed", fill: Theme.accent, border: Theme.landedBorder)
            legendItem("Available", fill: Theme.accentLight, border: Theme.accent)
            legendItem("Locked", fill: Theme.lockedBg, border: Theme.lockedBorder)
            legendItem("Skipped", fill: Theme.skippedBg, border: Theme.skippedBorder)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }

    private func legendItem(_ label: String, fill: Color, border: Color) -> some View {
        HStack(spacing: 6) {
            RoundedRectangle(cornerRadius: 4)
                .fill(fill)
                .overlay(RoundedRectangle(cornerRadius: 4).stroke(border, lineWidth: 2))
                .frame(width: 12, height: 12)
            Text(label)
                .font(.system(size: 10.5))
                .foregroundStyle(Theme.muted)
        }
    }

    // MARK: tree map

    private var treeMap: some View {
        Group {
            if let tree {
                ScrollView([.horizontal, .vertical], showsIndicators: true) {
                    ZStack(alignment: .topLeading) {
                        edgeCanvas(tree)
                        ForEach(tree.nodes) { node in
                            tileView(node, tile: tree.tile)
                        }
                    }
                    .frame(width: tree.canvasW + 32, height: tree.canvasH, alignment: .topLeading)
                    .padding(.vertical, 20)
                    // Tapping empty canvas closes an open drawer — same idea as
                    // tapping the dimmed backdrop behind the Generator's Tricks/
                    // Filter/Siri sheets. Tile buttons still claim their own taps
                    // first (SwiftUI hit-tests the deepest view), so this only
                    // ever fires on genuinely empty space and never blocks
                    // jumping straight from one node's drawer to another.
                    .contentShape(Rectangle())
                    .onTapGesture { closeDrawer() }
                }
                .defaultScrollAnchor(.topLeading)
            } else {
                Text("Tree unavailable").foregroundStyle(Theme.muted)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.surface)
    }

    private func closeDrawer() {
        if selection != nil { selection = nil }
    }

    private func edgeCanvas(_ tree: ProgTree) -> some View {
        let nodesById = Dictionary(uniqueKeysWithValues: tree.nodes.map { ($0.id, $0) })
        return Canvas { context, _ in
            // row stripes
            let maxTier = tree.nodes.map(\.tier).max() ?? 0
            for tier in 0...maxTier {
                let centerY = tree.tierY0 + Double(tier) * tree.tierGap + tree.tile / 2
                let band = CGRect(x: 0, y: centerY - (tree.tile + 26) / 2,
                                  width: tree.canvasW + 32, height: tree.tile + 26)
                context.fill(Path(band), with: .color(.black.opacity(0.03)))
            }
            // edges: parent bottom → child top, elbow route, arrowhead at end
            for node in tree.nodes {
                let childState = stateOf(node.id)
                for parentId in node.parentsFlat {
                    guard let parent = nodesById[parentId] else { continue }
                    let live = stateOf(parentId) == "landed"
                    let sx = parent.x + 16, sy = parent.y + tree.tile
                    let tx = node.x + 16, ty = node.y - 7
                    let midY = (sy + ty) / 2
                    var path = Path()
                    path.move(to: CGPoint(x: sx, y: sy))
                    path.addLine(to: CGPoint(x: sx, y: midY))
                    path.addLine(to: CGPoint(x: tx, y: midY))
                    path.addLine(to: CGPoint(x: tx, y: ty))
                    let color = live ? Theme.accent : Color(hex: 0xC9C1B0)
                    let width: CGFloat = live ? 2.2 : 1.4
                    var style = StrokeStyle(lineWidth: width, lineCap: .round, lineJoin: .round)
                    if childState == "skipped" { style.dash = [3, 4] }
                    context.stroke(path, with: .color(color), style: style)
                    // arrowhead chevron pointing down at (tx, ty)
                    var arrow = Path()
                    let s = width * 2.2
                    arrow.move(to: CGPoint(x: tx - s, y: ty - s))
                    arrow.addLine(to: CGPoint(x: tx, y: ty))
                    arrow.addLine(to: CGPoint(x: tx + s, y: ty - s))
                    context.stroke(arrow, with: .color(color),
                                   style: StrokeStyle(lineWidth: width * 0.75, lineCap: .round, lineJoin: .round))
                }
            }
        }
        .frame(width: tree.canvasW + 32, height: tree.canvasH)
    }

    private func tileView(_ node: ProgNode, tile: Double) -> some View {
        let nodeState = stateOf(node.id)
        let selected = selection == node.id
        let (fill, border, textColor): (Color, Color, Color) = switch nodeState {
        case "landed": (Theme.accent, Theme.landedBorder, Theme.white)
        case "available": (Theme.accentLight, Theme.accent, Theme.accent)
        case "skipped": (Theme.skippedBg, Theme.skippedBorder, Theme.skippedText)
        default: (Theme.lockedBg, Theme.lockedBorder, Theme.lockedText)
        }
        let labelColor: Color = (nodeState == "locked" || nodeState == "skipped") ? Color(hex: 0x9A917E) : Theme.text

        return VStack(spacing: 5) {
            Button {
                selection = node.id
                confirmSkip = false
            } label: {
                ZStack {
                    RoundedRectangle(cornerRadius: 12).fill(fill)
                    RoundedRectangle(cornerRadius: 12).stroke(border, lineWidth: 2.5)
                    Text(node.glyph)
                        .font(Theme.glyph(size: 14.5))
                        .foregroundStyle(textColor)
                    if nodeState == "skipped" {
                        Rectangle()
                            .fill(Theme.skipRed)
                            .frame(width: tile + 6, height: 2.5)
                            .rotationEffect(.degrees(-45))
                    }
                }
                .frame(width: tile, height: tile)
                .opacity(nodeState == "locked" ? 0.85 : 1)
                .saturation(nodeState == "locked" ? 0.4 : 1)
                .overlay(alignment: .topTrailing) {
                    Circle()
                        .fill(node.fam == "soul" ? Theme.accent : Theme.teal)
                        .overlay(Circle().stroke(Theme.bg, lineWidth: 2))
                        .frame(width: 10, height: 10)
                        .offset(x: 4, y: -4)
                        .opacity(nodeState == "locked" ? 0.5 : 1)
                }
                .shadow(color: nodeState == "available" && !selected ? Theme.accent.opacity(0.27) : .clear, radius: 6)
                .overlay {
                    if selected {
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Theme.gold, lineWidth: 3)
                            .padding(-4)
                            .shadow(color: Theme.gold.opacity(0.4), radius: 6)
                    }
                }
                .scaleEffect(selected ? 1.08 : 1)
            }
            .buttonStyle(.plain)

            Text(node.name)
                .font(.system(size: 10.5, weight: .bold))
                .foregroundStyle(labelColor)
                .strikethrough(nodeState == "skipped", color: labelColor)
                .multilineTextAlignment(.center)
                .lineSpacing(0)
                .frame(width: tile + 34)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(width: tile)
        .position(x: node.x + 16, y: node.y + tile / 2 + 14)
        .animation(.easeOut(duration: 0.12), value: selected)
    }

    // MARK: detail footer

    private func footer(_ node: ProgNode, maxHeight: CGFloat) -> some View {
        let nodeState = stateOf(node.id)
        let stranded = store.progStranded(id: node.id)
        let hasKids = tree?.nodes.contains { $0.parentsFlat.contains(node.id) } ?? false

        return VStack(alignment: .leading, spacing: 0) {
            // Pinned so the close button always stays reachable even when the
            // scrollable content below is scrolled down.
            HStack(spacing: 9) {
                Circle()
                    .fill(node.fam == "soul" ? Theme.accent : Theme.teal)
                    .frame(width: 9, height: 9)
                Text(node.name)
                    .font(.system(size: 19, weight: .heavy))
                    .foregroundStyle(Theme.text)
                    .lineLimit(1)
                Text(nodeState.uppercased())
                    .font(.system(size: 10, weight: .medium))
                    .kerning(1)
                    .foregroundStyle(Theme.muted)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 2)
                    .overlay(Capsule().stroke(Theme.border, lineWidth: 1))
                Spacer()
                Button {
                    selection = nil
                    confirmSkip = false
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(Theme.muted)
                        .padding(4)
                }
                .buttonStyle(.plain)
            }
            .padding(.bottom, 10)

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 14) {
                        footLabel("Trail", node.legs.trail ?? "Grab/Freestyle")
                        footLabel("Lead", node.legs.lead ?? "Grab/Freestyle")
                    }
                    .padding(.bottom, 10)

                    if let url = URL(string: node.bog) {
                        Link(destination: url) {
                            HStack(spacing: 5) {
                                Text("Book of Grinds")
                                Image(systemName: "arrow.up.right.square")
                            }
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundStyle(Theme.accent)
                        }
                        .padding(.bottom, 12)
                    }

                    statusNote(node, nodeState: nodeState, stranded: stranded)

                    actionButtons(node, nodeState: nodeState, stranded: stranded, hasKids: hasKids)

                    drawers(node, nodeState: nodeState)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 14)
        .padding(.bottom, 16)
        .frame(maxHeight: maxHeight)
        .background(Theme.bg)
        .overlay(alignment: .top) { Rectangle().fill(Theme.accent).frame(height: 2) }
    }

    private func footLabel(_ label: String, _ value: String) -> some View {
        HStack(spacing: 4) {
            Text(label).foregroundStyle(Theme.muted)
            Text(value).fontWeight(.semibold).foregroundStyle(Theme.text)
        }
        .font(.system(size: 12))
    }

    @ViewBuilder
    private func statusNote(_ node: ProgNode, nodeState: String, stranded: Int) -> some View {
        if nodeState == "locked", !confirmSkip {
            (Text("Suggested after: ").foregroundStyle(Theme.muted)
             + Text(node.suggestedAfter).fontWeight(.semibold).foregroundStyle(Theme.text))
                .font(.system(size: 12.5))
                .padding(.bottom, 12)
        }
        if nodeState == "available", !confirmSkip, node.parents.isEmpty {
            Text("Fundamental — required, can't be skipped.")
                .font(.system(size: 12))
                .italic()
                .foregroundStyle(Theme.muted)
                .padding(.bottom, 12)
        }
        if (nodeState == "available" || nodeState == "locked"), confirmSkip {
            (Text("Skipping ") + Text(node.name).bold() + Text(" also hides ")
             + Text("\(stranded)").bold() + Text(" trick\(stranded == 1 ? "" : "s") below it. Skip the whole branch?"))
                .font(.system(size: 12.5))
                .foregroundStyle(Color(hex: 0x8A3C34))
                .padding(11)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(hex: 0xF1DED9), in: RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(hex: 0xD8B3AC), lineWidth: 1))
                .padding(.bottom, 12)
        }
        if nodeState == "skipped" {
            Text("Hidden from the frontier. Un-skip to bring it back.")
                .font(.system(size: 12))
                .italic()
                .foregroundStyle(Theme.muted)
                .padding(.bottom, 12)
        }
    }

    @ViewBuilder
    private func actionButtons(_ node: ProgNode, nodeState: String, stranded: Int, hasKids: Bool) -> some View {
        HStack(spacing: 9) {
            if nodeState == "available" || nodeState == "locked" {
                if !confirmSkip {
                    footerButton("Mark Landed", fill: Theme.accent, fg: Theme.white, bold: true) {
                        store.progAction("markLanded", id: node.id)
                    }
                    if node.canSkip {
                        footerButton("Skip", fill: Theme.surface, fg: Theme.muted, stroke: Theme.border, flex: false) {
                            if stranded > 0 { confirmSkip = true } else { store.progAction("skip", id: node.id) }
                        }
                    }
                } else {
                    footerButton("Skip branch", fill: Theme.skipRed, fg: Theme.white, bold: true) {
                        store.progAction("skip", id: node.id)
                        confirmSkip = false
                    }
                    footerButton("Cancel", fill: Theme.surface, fg: Theme.muted, stroke: Theme.border, flex: false) {
                        confirmSkip = false
                    }
                }
            }
            if nodeState == "landed" {
                footerButton("Unmark Landed", fill: Theme.accentLight, fg: Theme.accent, stroke: Theme.accent) {
                    store.progAction("unmark", id: node.id)
                }
            }
            if nodeState == "skipped" {
                footerButton(hasKids ? "Un-skip Branch" : "Un-skip", fill: Theme.accentLight, fg: Theme.accent, stroke: Theme.accent) {
                    store.progAction("unskip", id: node.id)
                }
            }
        }
    }

    private func footerButton(_ label: String, fill: Color, fg: Color, stroke: Color? = nil, bold: Bool = false, flex: Bool = true, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 14, weight: bold ? .heavy : .bold))
                .foregroundStyle(fg)
                .frame(maxWidth: flex ? .infinity : nil)
                .padding(.horizontal, flex ? 0 : 16)
                .padding(.vertical, 12)
                .background(fill, in: RoundedRectangle(cornerRadius: 11))
                .overlay {
                    if let stroke {
                        RoundedRectangle(cornerRadius: 11).strokeBorder(stroke, lineWidth: 1.5)
                    }
                }
        }
        .buttonStyle(.plain)
    }

    // MARK: drawers

    @ViewBuilder
    private func drawers(_ node: ProgNode, nodeState: String) -> some View {
        let baseLanded = nodeState == "landed"
        if let drawer, !drawer.mods.isEmpty {
            drawerSection("Variations", chips: drawer.mods, baseLanded: baseLanded, nodeName: node.name, unit: "variations") { chip in
                store.progAction(chip.landed ? "unmarkMod" : "markMod", id: node.id, modKey: chip.key)
            }
        }
        if let drawer, !drawer.spins.isEmpty {
            drawerSection("Spins", chips: drawer.spins, baseLanded: baseLanded, nodeName: node.name, unit: "spins") { chip in
                store.progAction(chip.landed ? "unmarkSpin" : "markSpin", id: node.id, spinKey: chip.key)
            }
        }
    }

    private func drawerSection(_ title: String, chips: [DrawerData.Chip], baseLanded: Bool, nodeName: String, unit: String, toggle: @escaping (DrawerData.Chip) -> Void) -> some View {
        let landedCount = chips.filter(\.landed).count
        return VStack(alignment: .leading, spacing: 8) {
            Divider().overlay(Theme.border).padding(.top, 14).padding(.bottom, 3)
            HStack {
                Text(title.uppercased())
                    .font(.system(size: 11, weight: .bold))
                    .kerning(1)
                    .foregroundStyle(Theme.muted)
                Spacer()
                if baseLanded {
                    Text("\(landedCount)/\(chips.count) landed")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(landedCount > 0 ? Theme.accent : Theme.muted)
                }
            }
            if !baseLanded {
                Text("Land \(nodeName) first to open its \(unit).")
                    .font(.system(size: 12))
                    .italic()
                    .foregroundStyle(Theme.muted)
            } else {
                // No inner ScrollView here — the whole footer scrolls as one surface
                // (see `footer`), so a nested scroll region would just fight that
                // gesture instead of adding anything.
                ChipFlowLeadingLayout(spacing: 7) {
                    ForEach(chips) { chip in
                        Button {
                            toggle(chip)
                        } label: {
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(chip.landed ? Theme.white : Color(hex: 0xCFC7B6))
                                    .frame(width: 7, height: 7)
                                Text(chip.name)
                                    .font(.system(size: 12.5, weight: .semibold))
                                    .foregroundStyle(chip.landed ? Theme.white : Theme.text)
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 7)
                            .background(chip.landed ? Theme.accent : Theme.surface, in: RoundedRectangle(cornerRadius: 9))
                            .overlay(RoundedRectangle(cornerRadius: 9).stroke(chip.landed ? Theme.accent : Theme.border, lineWidth: 1.5))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

/// Leading-aligned wrapping layout for drawer chips.
struct ChipFlowLeadingLayout: Layout {
    var spacing: CGFloat = 7

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? 360
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0
        for size in subviews.map({ $0.sizeThatFits(.unspecified) }) {
            if x + size.width > maxWidth, x > 0 { x = 0; y += rowHeight + spacing; rowHeight = 0 }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: maxWidth, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
