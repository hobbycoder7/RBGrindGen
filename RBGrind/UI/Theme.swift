import SwiftUI

/// Exact palette from the web app's `C` color object (grind_engine.js top).
enum Theme {
    static let bg = Color(hex: 0xF5F0E8)
    static let surface = Color(hex: 0xEDE8DC)
    static let border = Color(hex: 0xD9D3C7)
    static let text = Color(hex: 0x0D0B08)
    static let muted = Color(hex: 0x6B6455)
    static let accent = Color(hex: 0x1A3FD4)
    static let accentLight = Color(hex: 0xE8EDFF)
    static let white = Color.white

    // Progression screen accents (PGOLD / TEAL in the web app)
    static let gold = Color(hex: 0xC6971F)
    static let teal = Color(hex: 0x3F8FB0)

    // tile states (web progression tiles)
    static let landedBorder = Color(hex: 0x0F2EA8)
    static let lockedBg = Color(hex: 0xE3DDCE)
    static let lockedBorder = Color(hex: 0xCABFAA)
    static let lockedText = Color(hex: 0xA89F8C)
    static let skippedBg = Color(hex: 0xEFDCD8)
    static let skippedBorder = Color(hex: 0xC79A93)
    static let skippedText = Color(hex: 0xA9736C)
    static let skipRed = Color(hex: 0xB0554E)
    static let armRed = Color(hex: 0xC0392B)

    /// Big condensed display face for trick names — the native stand-in for the
    /// web app's Barlow Condensed 900. System font, condensed width, black weight.
    static func trickName(size: CGFloat) -> Font {
        .system(size: size, weight: .black, design: .default).width(.condensed)
    }

    /// Serif face for progression glyphs — Iowan Old Style per the reference.
    static func glyph(size: CGFloat) -> Font {
        .custom("Iowan Old Style", size: size).bold()
    }

    /// Port of the web nameFontSize() thresholds (px ≈ pt at this layout width).
    static func nameFontSize(for name: String) -> CGFloat {
        switch name.count {
        case ...4: 84
        case ...6: 72
        case ...9: 58
        case ...13: 46
        case ...18: 38
        case ...26: 30
        case ...36: 24
        case ...48: 19
        default: 16
        }
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}
