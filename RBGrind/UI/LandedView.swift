import SwiftUI

/// The Landed screen: landed list + Working On + Too Hard, with search.
struct LandedView: View {
    @Bindable var store: AppStore
    @State private var search = ""

    // MARK: multi-select (per category — each list has its own selection set
    // since "Select All" applies within one category at a time)
    @State private var isSelecting = false
    @State private var selectedLanded: Set<String> = []
    @State private var selectedWorking: Set<String> = []
    @State private var selectedSkipped: Set<String> = []
    @State private var removeArmed = false

    private func matches(_ entry: TrickEntry) -> Bool {
        search.isEmpty || entry.display.localizedCaseInsensitiveContains(search)
    }

    private var landedFiltered: [TrickEntry] {
        store.landed.filter(matches).sorted { $0.at > $1.at }
    }
    private var workingFiltered: [TrickEntry] {
        store.working.filter(matches).sorted { $0.at > $1.at }
    }
    private var skippedSorted: [TrickEntry] {
        store.skipped.sorted { $0.at > $1.at }
    }

    private var hasAnyEntries: Bool {
        !store.landed.isEmpty || !store.working.isEmpty || !store.skipped.isEmpty
    }
    private var selectedCount: Int { selectedLanded.count + selectedWorking.count + selectedSkipped.count }

    private func allSelected(_ entries: [TrickEntry], _ selection: Set<String>) -> Bool {
        !entries.isEmpty && entries.allSatisfy { selection.contains($0.sig) }
    }
    private func toggleSelectAll(_ entries: [TrickEntry], _ selection: inout Set<String>) {
        if allSelected(entries, selection) { selection.removeAll() }
        else { selection = Set(entries.map(\.sig)) }
    }
    private func toggle(_ sig: String, in selection: inout Set<String>) {
        if selection.contains(sig) { selection.remove(sig) } else { selection.insert(sig) }
    }

    private func exitSelectMode() {
        isSelecting = false
        removeArmed = false
        selectedLanded.removeAll()
        selectedWorking.removeAll()
        selectedSkipped.removeAll()
    }
    private func removeSelected() {
        selectedLanded.forEach { store.removeEntry(sig: $0, from: "landed") }
        selectedWorking.forEach { store.removeEntry(sig: $0, from: "working") }
        selectedSkipped.forEach { store.removeEntry(sig: $0, from: "skipped") }
        exitSelectMode()
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider().overlay(Theme.border)
            searchBar
            Divider().overlay(Theme.border)
            ScrollView {
                VStack(spacing: 0) {
                    if landedFiltered.isEmpty {
                        emptyState
                    } else {
                        if isSelecting {
                            selectAllRow(landedFiltered, $selectedLanded)
                                .padding(.bottom, 6)
                        }
                        ForEach(landedFiltered) { entry in
                            entryRow(entry, big: true,
                                     isSelected: selectedLanded.contains(entry.sig),
                                     onToggleSelect: { toggle(entry.sig, in: &selectedLanded) },
                                     onRemove: { store.removeEntry(sig: entry.sig, from: "landed") })
                        }
                    }
                    if !workingFiltered.isEmpty {
                        sectionHeader("Working On", count: workingFiltered.count,
                                      note: "Still in the rotation — these keep coming up so you can try them again.",
                                      entries: workingFiltered, selection: $selectedWorking)
                            .padding(.top, landedFiltered.isEmpty ? 4 : 28)
                        ForEach(workingFiltered) { entry in
                            entryRow(entry, big: false,
                                     isSelected: selectedWorking.contains(entry.sig),
                                     onToggleSelect: { toggle(entry.sig, in: &selectedWorking) },
                                     onRemove: { store.removeEntry(sig: entry.sig, from: "working") })
                        }
                    }
                    if !skippedSorted.isEmpty, search.isEmpty {
                        sectionHeader("Too Hard", count: skippedSorted.count,
                                      note: "Hidden from generation. Remove one to let it come up again.",
                                      entries: skippedSorted, selection: $selectedSkipped)
                            .padding(.top, 28)
                        ForEach(skippedSorted) { entry in
                            entryRow(entry, big: false,
                                     isSelected: selectedSkipped.contains(entry.sig),
                                     onToggleSelect: { toggle(entry.sig, in: &selectedSkipped) },
                                     onRemove: { store.removeEntry(sig: entry.sig, from: "skipped") })
                            .opacity(0.75)
                        }
                    }
                }
                .padding(.horizontal, 22)
                .padding(.top, 8)
                .padding(.bottom, 16)
            }
        }
        .background(Theme.bg)
        .onChange(of: search) {
            // a narrowed/changed search can hide previously-selected rows —
            // drop selections that are no longer visible so "Select All"
            // and the remove count always match what's actually on screen.
            guard isSelecting else { return }
            let landedSigs = Set(landedFiltered.map(\.sig))
            let workingSigs = Set(workingFiltered.map(\.sig))
            selectedLanded.formIntersection(landedSigs)
            selectedWorking.formIntersection(workingSigs)
        }
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Landed".uppercased())
                    .font(.system(size: 10, weight: .semibold))
                    .kerning(1.6)
                    .foregroundStyle(Theme.muted)
                Text("\(store.landed.count) \(store.landed.count == 1 ? "trick" : "tricks")")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(Theme.text)
            }
            Spacer()
            if hasAnyEntries {
                selectControls
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 22)
        .padding(.top, 14)
        .padding(.bottom, 16)
    }

    @ViewBuilder
    private var selectControls: some View {
        if isSelecting {
            HStack(spacing: 8) {
                pillButton("Cancel", fg: Theme.muted, bg: Theme.surface) { exitSelectMode() }
                pillButton(removeArmed ? "Tap again" : "Remove (\(selectedCount))",
                           fg: Theme.white,
                           bg: selectedCount == 0 ? Theme.border : (removeArmed ? Theme.armRed : Theme.accent)) {
                    if removeArmed {
                        removeSelected()
                    } else {
                        removeArmed = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { removeArmed = false }
                    }
                }
                .disabled(selectedCount == 0)
            }
        } else {
            pillButton("Select", fg: Theme.muted, bg: Theme.surface) { isSelecting = true }
        }
    }

    private func pillButton(_ label: String, fg: Color, bg: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(fg)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(bg, in: RoundedRectangle(cornerRadius: 9))
        }
        .buttonStyle(.plain)
    }

    private func selectAllButton(_ entries: [TrickEntry], _ selection: Binding<Set<String>>) -> some View {
        Button {
            toggleSelectAll(entries, &selection.wrappedValue)
        } label: {
            Text(allSelected(entries, selection.wrappedValue) ? "Deselect All" : "Select All")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Theme.accent)
        }
        .buttonStyle(.plain)
    }

    private func selectAllRow(_ entries: [TrickEntry], _ selection: Binding<Set<String>>) -> some View {
        HStack {
            Spacer()
            selectAllButton(entries, selection)
        }
    }

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14))
                .foregroundStyle(Theme.muted)
            TextField("Search tricks…", text: $search)
                .font(.system(size: 15))
                .foregroundStyle(Theme.text)
                .autocorrectionDisabled()
            if !search.isEmpty {
                Button {
                    search = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(Theme.muted)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal, 22)
        .padding(.vertical, 14)
    }

    private var emptyState: some View {
        VStack(spacing: 0) {
            Text("🛼").font(.system(size: 36)).padding(.bottom, 12)
            Text(search.isEmpty ? "Nothing landed yet." : "No tricks match.")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Theme.muted)
            if search.isEmpty {
                Text("Generate a trick and tap the bookmark.")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.muted)
                    .padding(.top, 6)
            }
        }
        .padding(.vertical, (store.working.isEmpty && store.skipped.isEmpty) ? 64 : 40)
        .frame(maxWidth: .infinity)
    }

    private func sectionHeader(_ title: String, count: Int, note: String, entries: [TrickEntry], selection: Binding<Set<String>>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("\(title.uppercased()) · \(count)")
                    .font(.system(size: 11, weight: .bold))
                    .kerning(1.3)
                    .foregroundStyle(Theme.muted)
                Spacer()
                if isSelecting {
                    selectAllButton(entries, selection)
                }
            }
            Text(note)
                .font(.system(size: 12))
                .lineSpacing(3)
                .foregroundStyle(Theme.muted)
                .padding(.bottom, 10)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func entryRow(_ entry: TrickEntry, big: Bool, isSelected: Bool, onToggleSelect: @escaping () -> Void, onRemove: @escaping () -> Void) -> some View {
        HStack(alignment: .center, spacing: 12) {
            if isSelecting {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 21))
                    .foregroundStyle(isSelected ? Theme.accent : Color(hex: 0xCFC7B6))
            }
            VStack(alignment: .leading, spacing: big ? 5 : 4) {
                Text(entry.display.uppercased())
                    .font(Theme.trickName(size: big ? 20 : 18))
                    .foregroundStyle(Theme.text)
                    .multilineTextAlignment(.leading)
                Text("Trail: \(entry.trail ?? "Grab/Freestyle")  ·  Lead: \(entry.lead ?? "Grab/Freestyle")")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.muted)
                if big {
                    Text(Self.formatDate(entry.date))
                        .font(.system(size: 11))
                        .kerning(0.4)
                        .foregroundStyle(Theme.muted)
                }
            }
            Spacer(minLength: 0)
            if !isSelecting {
                Button(action: onRemove) {
                    Image(systemName: "xmark")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Theme.muted)
                        .frame(width: 32, height: 32)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.vertical, big ? 14 : 12)
        .padding(.horizontal, isSelecting ? 8 : 0)
        .background(isSelecting && isSelected ? Theme.accentLight : Color.clear, in: RoundedRectangle(cornerRadius: 10))
        .contentShape(Rectangle())
        .onTapGesture { if isSelecting { onToggleSelect() } }
        .overlay(alignment: .bottom) { Rectangle().fill(Theme.border).frame(height: 1) }
    }

    /// Port of the web fmtDate: Today / Yesterday / "Jul 17".
    static func formatDate(_ date: Date) -> String {
        let days = Calendar.current.dateComponents([.day], from: Calendar.current.startOfDay(for: date), to: Calendar.current.startOfDay(for: Date())).day ?? 0
        if days == 0 { return "Today" }
        if days == 1 { return "Yesterday" }
        return date.formatted(.dateTime.month(.abbreviated).day())
    }
}
