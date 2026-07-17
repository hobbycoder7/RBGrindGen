import SwiftUI

@main
struct RBGrindApp: App {
    init() {
        GrindEngineSelfTest.runIfRequested()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
