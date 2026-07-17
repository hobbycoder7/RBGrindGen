import SwiftUI

/// The Landed screen: landed list + Working On + Too Hard, with search.
struct LandedView: View {
    @Bindable var store: AppStore
    @State private var search = ""

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
                        ForEach(landedFiltered) { entry in
                            entryRow(entry, big: true) {
                                store.removeEntry(sig: entry.sig, from: "landed")
                            }
                        }
                    }
                    if !workingFiltered.isEmpty {
                        sectionHeader("Working On", count: workingFiltered.count,
                                      note: "Still in the rotation — these keep coming up so you can try them again.")
                            .padding(.top, landedFiltered.isEmpty ? 4 : 28)
                        ForEach(workingFiltered) { entry in
                            entryRow(entry, big: false) {
                                store.removeEntry(sig: entry.sig, from: "working")
                            }
                        }
                    }
                    if !skippedSorted.isEmpty, search.isEmpty {
                        sectionHeader("Too Hard", count: skippedSorted.count,
                                      note: "Hidden from generation. Remove one to let it come up again.")
                            .padding(.top, 28)
                        ForEach(skippedSorted) { entry in
                            entryRow(entry, big: false) {
                                store.removeEntry(sig: entry.sig, from: "skipped")
                            }
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
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Landed".uppercased())
                .font(.system(size: 10, weight: .semibold))
                .kerning(1.6)
                .foregroundStyle(Theme.muted)
            Text("\(store.landed.count) \(store.landed.count == 1 ? "trick" : "tricks")")
                .font(.system(size: 26, weight: .bold))
                .foregroundStyle(Theme.text)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 22)
        .padding(.top, 14)
        .padding(.bottom, 16)
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

    private func sectionHeader(_ title: String, count: Int, note: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(title.uppercased()) · \(count)")
                .font(.system(size: 11, weight: .bold))
                .kerning(1.3)
                .foregroundStyle(Theme.muted)
            Text(note)
                .font(.system(size: 12))
                .lineSpacing(3)
                .foregroundStyle(Theme.muted)
                .padding(.bottom, 10)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func entryRow(_ entry: TrickEntry, big: Bool, onRemove: @escaping () -> Void) -> some View {
        HStack(alignment: .center, spacing: 12) {
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
            Button(action: onRemove) {
                Image(systemName: "xmark")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.muted)
                    .frame(width: 32, height: 32)
                    .background(Theme.surface, in: RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, big ? 14 : 12)
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
