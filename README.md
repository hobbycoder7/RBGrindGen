# RB Grind

A trick generator and progression tracker for aggressive inline skating. Native iOS.

Tap Generate and it names your next grind — `Soul`, `Acid`, `Backside Royale`, or something a lot meaner once you open the filters up. Names are assembled from the actual grammar of grind naming rather than drawn from a fixed list, so rotation in and out, fakie, truespin, rewind, topside, switch and negative all combine the way they do on a real obstacle. Every trick links out to [Book of Grinds](https://bookofgrinds.com/) if you don't know it yet.

## What's in it

- **Generator** — single grinds or switch-ups, with the approach and a foot-by-foot breakdown of what each foot is doing. Sliders weight how often the modifiers show up.
- **Progression** — a tree of the grind curriculum. Land a trick to unlock what it leads into; tiles read as landed, available, locked or skipped, so the tree doubles as a record of where you actually are.
- **Siri** — seven phrases for when your phone's in your pocket: generate a grind or a switch-up, mark the last one landed, skip it, save it, repeat it. Generation respects whatever filters you left set in the app.

## Built with

SwiftUI, no third-party dependencies.

It started life as a React artifact inside Claude. The "engine" is in JavaScript, running on the phone through JavaScriptCore. Swift just draws the screens and remembers what you've landed.

Written with [Claude Code](https://claude.com/claude-code), so Jim has no idea how the code actually works.
