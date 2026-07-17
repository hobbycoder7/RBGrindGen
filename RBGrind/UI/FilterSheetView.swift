import SwiftUI

/// The Tricks / Filters sheet — mirror of the web FilterSheet.
struct FilterSheetView: View {
    @Bindable var store: AppStore
    @State var page: Int
    @State private var resetArmed = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider().overlay(Theme.border)
            ScrollView {
                if page == 0 {
                    tricksPage
                } else {
                    filtersPage
                }
            }
        }
        .background(Theme.bg)
        .presentationDetents([.fraction(0.86)])
        .presentationDragIndicator(.hidden)
    }

    private var header: some View {
        HStack(spacing: 12) {
            HStack(spacing: 0) {
                tab("Tricks", index: 0)
                tab("Filters", index: 1)
            }
            .padding(3)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 11))
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.text)
                    .frame(width: 34, height: 34)
                    .background(Theme.surface, in: RoundedRectangle(cornerRadius: 9))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 22)
        .padding(.top, 16)
        .padding(.bottom, 14)
    }

    private func tab(_ label: String, index: Int) -> some View {
        Button {
            page = index
        } label: {
            Text(label.uppercased())
                .font(.system(size: 12, weight: .bold))
                .kerning(1)
                .foregroundStyle(page == index ? Theme.text : Theme.muted)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(page == index ? Theme.white : .clear, in: RoundedRectangle(cornerRadius: 9))
                .shadow(color: page == index ? .black.opacity(0.12) : .clear, radius: 1.5, y: 1)
        }
        .buttonStyle(.plain)
    }

    // MARK: Tricks page

    private var tricksPage: some View {
        let lists = store.baseList
        let columns = [GridItem(.flexible(), spacing: 7), GridItem(.flexible(), spacing: 7)]
        return VStack(spacing: 0) {
            SectionHeader(label: "Soul Tricks") {
                store.setAllTricks(lists.soul, enabled: true)
            } onNone: {
                store.setAllTricks(lists.soul, enabled: false)
            }
            LazyVGrid(columns: columns, spacing: 7) {
                ForEach(lists.soul) { trick in
                    TrickCheckBox(label: trick.name, value: trickBinding(trick.id))
                }
            }
            Spacer().frame(height: 22)
            SectionHeader(label: "Groove Tricks") {
                store.setAllTricks(lists.groove, enabled: true)
            } onNone: {
                store.setAllTricks(lists.groove, enabled: false)
            }
            LazyVGrid(columns: columns, spacing: 7) {
                ForEach(lists.groove) { trick in
                    TrickCheckBox(label: trick.name, value: trickBinding(trick.id))
                }
            }
        }
        .padding(.horizontal, 22)
        .padding(.top, 18)
        .padding(.bottom, 40)
    }

    private func trickBinding(_ id: String) -> Binding<Bool> {
        Binding(
            get: { store.filters.tricks[id] ?? true },
            set: { store.filters.tricks[id] = $0 }
        )
    }

    // MARK: Filters page

    private var filtersPage: some View {
        VStack(spacing: 0) {
            SheetLabel(text: "Session")
            ToggleRow(
                label: "Work-On Only",
                sublabel: "Drill only tricks you've flagged as working-on",
                value: Binding(get: { store.filters.workOnly }, set: { store.setDrill(\.workOnly, on: $0) })
            )
            ToggleRow(
                label: "Practice Mode",
                sublabel: store.filters.workOnly ? "Off while Work-On Only is on" : "Drill only tricks you've landed or are working on",
                value: Binding(get: { store.filters.practice }, set: { store.setDrill(\.practice, on: $0) }),
                disabled: store.filters.workOnly
            )
            ToggleRow(
                label: "Hide Landed",
                sublabel: (store.filters.workOnly || store.filters.practice) ? "Off while a drill mode is on" : "Skip tricks you've already landed",
                value: $store.filters.hideLanded,
                disabled: store.filters.workOnly || store.filters.practice
            )

            Spacer().frame(height: 18)
            SheetLabel(text: "Display")
            ToggleRow(
                label: "Special Names First",
                sublabel: "e.g. Soyale, Fishbrain, Savannah",
                value: $store.filters.specialFirst
            )

            Spacer().frame(height: 18)
            SheetLabel(text: "In Spins")
            DegreeRangeSlider(minValue: $store.filters.spins.inMin, maxValue: $store.filters.spins.inMax)
            HStack(alignment: .top, spacing: 20) {
                SliderRow(label: "Fakie In", value: $store.filters.spins.fakieIn)
                ToggleRow(label: "Truespin", value: $store.filters.spins.truespin, compact: true)
            }
            .padding(.top, 6)

            Spacer().frame(height: 14)
            SheetLabel(text: "Switch-Up Spins")
            Text("Transition spin between the two grinds in a Double switch-up.")
                .font(.system(size: 12))
                .foregroundStyle(Theme.muted)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.bottom, 10)
            DegreeRangeSlider(minValue: $store.filters.spins.suMin, maxValue: $store.filters.spins.suMax)
            SliderRow(label: "Rewind", value: $store.filters.spins.suRewind)
                .padding(.top, 6)

            Spacer().frame(height: 14)
            SheetLabel(text: "Out Spins")
            DegreeRangeSlider(minValue: $store.filters.spins.outMin, maxValue: $store.filters.spins.outMax)
            SliderRow(label: "Rewind Out", value: $store.filters.spins.rewindOut)
                .padding(.top, 6)

            Spacer().frame(height: 10)
            SheetLabel(text: "Probability")
            HStack(alignment: .top, spacing: 20) {
                VStack(spacing: 0) {
                    SliderRow(label: "Topside", value: $store.filters.sliders.topside)
                    SliderRow(label: "Negative", value: $store.filters.sliders.negative)
                    SliderRow(label: "Anti Christ", value: $store.filters.sliders.antichrist)
                    SliderRow(label: "Tough", value: $store.filters.sliders.tough)
                }
                VStack(spacing: 0) {
                    SliderRow(label: "Switch", value: $store.filters.sliders.switch)
                    SliderRow(label: "Christ", value: $store.filters.sliders.christ)
                    SliderRow(label: "Rough", value: $store.filters.sliders.rough)
                }
            }

            Spacer().frame(height: 14)
            Button {
                store.resetFilters(testMode: !store.filters.testMode)
            } label: {
                Text(store.filters.testMode ? "● TEST MODE ON — tap to turn off" : "Test Mode (crank everything for naming tests)")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(store.filters.testMode ? Theme.white : Theme.accent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(store.filters.testMode ? Color(hex: 0x2E7D32) : Theme.surface, in: RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)

            Spacer().frame(height: 10)
            Button {
                if resetArmed {
                    store.resetFilters(testMode: false)
                    resetArmed = false
                } else {
                    resetArmed = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 3) { resetArmed = false }
                }
            } label: {
                Text(resetArmed ? "Tap again to reset everything" : "Reset all to defaults")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(resetArmed ? Theme.white : Theme.accent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(resetArmed ? Theme.armRed : Theme.surface, in: RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 22)
        .padding(.top, 18)
        .padding(.bottom, 40)
    }
}
