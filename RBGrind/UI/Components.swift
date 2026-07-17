import SwiftUI

// Shared controls mirroring the web app's sub-components.

struct SheetLabel: View {
    let text: String
    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 12, weight: .bold))
            .kerning(1.6)
            .foregroundStyle(Theme.muted)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.bottom, 12)
    }
}

struct SectionHeader: View {
    let label: String
    let onAll: () -> Void
    let onNone: () -> Void

    var body: some View {
        HStack {
            Text(label.uppercased())
                .font(.system(size: 10, weight: .bold))
                .kerning(1.4)
                .foregroundStyle(Theme.muted)
            Spacer()
            HStack(spacing: 6) {
                pill("All", action: onAll)
                pill("None", action: onNone)
            }
        }
        .padding(.bottom, 12)
    }

    private func pill(_ label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Theme.accent)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(Theme.accentLight, in: RoundedRectangle(cornerRadius: 6))
        }
        .buttonStyle(.plain)
    }
}

struct ToggleRow: View {
    let label: String
    var sublabel: String? = nil
    @Binding var value: Bool
    var disabled: Bool = false
    var compact: Bool = false

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: compact ? 15 : 16, weight: .medium))
                    .foregroundStyle(Theme.text)
                if let sublabel {
                    Text(sublabel)
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.muted)
                }
            }
            Spacer()
            ZStack(alignment: value ? .trailing : .leading) {
                Capsule()
                    .fill(value ? Theme.accent : Theme.border)
                    .frame(width: 46, height: 26)
                Circle()
                    .fill(Theme.white)
                    .frame(width: 20, height: 20)
                    .shadow(color: .black.opacity(0.18), radius: 1.5, y: 1)
                    .padding(3)
            }
            .animation(.easeInOut(duration: 0.18), value: value)
            .onTapGesture { if !disabled { value.toggle() } }
        }
        .opacity(disabled ? 0.4 : 1)
        .padding(.bottom, compact ? 0 : 16)
    }
}

struct SliderRow: View {
    let label: String
    @Binding var value: Int

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Text(label)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(Theme.text)
                Spacer()
                Text("\(value)%")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(value > 0 ? Theme.accent : Theme.muted)
            }
            Slider(
                value: Binding(get: { Double(value) }, set: { value = Int(($0 / 5).rounded()) * 5 }),
                in: 0...100
            )
            .tint(Theme.accent)
        }
        .padding(.bottom, 18)
    }
}

/// Two-thumb degree range slider snapping to the web app's spin stops
/// (0/90/180/270/360/450/540). Tap or drag anywhere; nearest handle follows.
struct DegreeRangeSlider: View {
    @Binding var minValue: Int
    @Binding var maxValue: Int

    private static let stops = [0, 90, 180, 270, 360, 450, 540]
    @State private var dragging: Handle?
    private enum Handle { case min, max }

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Spacer()
                Text(minValue == maxValue ? "\(maxValue)°" : "\(minValue)° – \(maxValue)°")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Theme.accent)
            }
            GeometryReader { geo in
                let width = geo.size.width
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.border).frame(height: 6)
                    Capsule()
                        .fill(Theme.accent)
                        .frame(width: max(0, position(maxValue, width) - position(minValue, width)), height: 6)
                        .offset(x: position(minValue, width))
                    thumb.position(x: position(minValue, width), y: geo.size.height / 2)
                    thumb.position(x: position(maxValue, width), y: geo.size.height / 2)
                }
                .frame(height: geo.size.height)
                .contentShape(Rectangle())
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { gesture in
                            let value = nearestStop(at: gesture.location.x, width: width)
                            if dragging == nil {
                                let dMin = abs(value - minValue), dMax = abs(value - maxValue)
                                if dMin < dMax { dragging = .min }
                                else if dMax < dMin { dragging = .max }
                                else { dragging = value <= minValue ? .min : .max }
                            }
                            apply(value)
                        }
                        .onEnded { _ in dragging = nil }
                )
            }
            .frame(height: 40)
            .padding(.horizontal, 16)
            HStack {
                ForEach(Self.stops, id: \.self) { deg in
                    let inRange = deg >= minValue && deg <= maxValue
                    Text("\(deg)")
                        .font(.system(size: 11, weight: inRange ? .bold : .medium))
                        .foregroundStyle(inRange ? Theme.accent : Theme.muted)
                    if deg != Self.stops.last { Spacer() }
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private var thumb: some View {
        Circle()
            .fill(Theme.accent)
            .frame(width: 28, height: 28)
            .overlay(Circle().stroke(Theme.bg, lineWidth: 3))
            .shadow(color: .black.opacity(0.3), radius: 3, y: 2)
    }

    private func position(_ value: Int, _ width: CGFloat) -> CGFloat {
        CGFloat(value) / 540 * width
    }

    private func nearestStop(at x: CGFloat, width: CGFloat) -> Int {
        let raw = Double(max(0, min(1, x / width))) * 540
        return Self.stops.min(by: { abs(Double($0) - raw) < abs(Double($1) - raw) }) ?? 0
    }

    private func apply(_ value: Int) {
        switch dragging {
        case .min: minValue = min(value, maxValue)
        case .max: maxValue = max(value, minValue)
        case nil: break
        }
    }
}

struct TrickCheckBox: View {
    let label: String
    @Binding var value: Bool

    var body: some View {
        Button {
            value.toggle()
        } label: {
            HStack(spacing: 9) {
                ZStack {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(value ? Theme.accent : .clear)
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(value ? Theme.accent : Theme.border, lineWidth: 1.5)
                    if value {
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(Theme.white)
                    }
                }
                .frame(width: 18, height: 18)
                Text(label)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Theme.text)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 11)
            .background(value ? Theme.accentLight : Theme.surface, in: RoundedRectangle(cornerRadius: 11))
            .overlay(RoundedRectangle(cornerRadius: 11).stroke(value ? Theme.accent : .clear, lineWidth: 1.5))
        }
        .buttonStyle(.plain)
    }
}

struct Chip: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .semibold))
            .kerning(0.4)
            .foregroundStyle(Theme.muted)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Theme.surface, in: Capsule())
    }
}
