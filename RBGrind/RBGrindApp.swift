import SwiftUI

@main
struct RBGrindApp: App {
    init() {
        GrindEngineSelfTest.runIfRequested()
        StoreSelfTest.runIfRequested()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
