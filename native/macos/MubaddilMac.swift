import Carbon
import Cocoa
import ApplicationServices
import Darwin
import Foundation

func sourceID(_ src: TISInputSource) -> String? {
    guard let ptr = TISGetInputSourceProperty(src, kTISPropertyInputSourceID) else { return nil }
    return Unmanaged<CFString>.fromOpaque(ptr).takeUnretainedValue() as String
}

func sourceName(_ src: TISInputSource) -> String? {
    guard let ptr = TISGetInputSourceProperty(src, kTISPropertyLocalizedName) else { return nil }
    return Unmanaged<CFString>.fromOpaque(ptr).takeUnretainedValue() as String
}

func sourceType(_ src: TISInputSource) -> String? {
    guard let ptr = TISGetInputSourceProperty(src, kTISPropertyInputSourceType) else { return nil }
    return Unmanaged<CFString>.fromOpaque(ptr).takeUnretainedValue() as String
}

func isSelectable(_ src: TISInputSource) -> Bool {
    guard let ptr = TISGetInputSourceProperty(src, kTISPropertyInputSourceIsSelectCapable) else { return false }
    let value = Unmanaged<CFBoolean>.fromOpaque(ptr).takeUnretainedValue()
    return CFBooleanGetValue(value)
}

func allSources() -> [TISInputSource] {
    guard let cf = TISCreateInputSourceList(nil, false) else { return [] }
    return (cf.takeRetainedValue() as [AnyObject]) as? [TISInputSource] ?? []
}

func keyboardSources() -> [TISInputSource] {
    allSources().filter { src in
        guard let type = sourceType(src) else { return false }
        return type == (kTISTypeKeyboardLayout as String)
            || type == (kTISTypeKeyboardInputMode as String)
    }
}

@discardableResult
func printSources() -> Int32 {
    var rows: [[String: String]] = []
    for src in keyboardSources() {
        guard let id = sourceID(src), let name = sourceName(src) else { continue }
        rows.append(["id": id, "name": name])
    }
    if let data = try? JSONSerialization.data(withJSONObject: rows, options: []),
       let text = String(data: data, encoding: .utf8) {
        print(text)
        return 0
    }
    return 1
}

func currentID() -> String? {
    let src = TISCopyCurrentKeyboardInputSource().takeRetainedValue()
    return sourceID(src)
}

func scoreArabic(_ src: TISInputSource, preferPC: Bool) -> Int {
    let id = (sourceID(src) ?? "").lowercased()
    let name = (sourceName(src) ?? "").lowercased()
    let blob = id + " " + name
    guard blob.contains("arab") else { return -1 }
    var score = 10
    let isPC = blob.contains("pc") || blob.contains("101")
    if preferPC { score += isPC ? 20 : 0 } else { score += isPC ? 0 : 20 }
    if isSelectable(src) { score += 5 }
    return score
}

func scoreEnglish(_ src: TISInputSource) -> Int {
    let id = (sourceID(src) ?? "").lowercased()
    let name = (sourceName(src) ?? "").lowercased()
    let blob = id + " " + name
    if blob.contains("arab") { return -1 }
    var score = -1
    if id.contains("us") || name == "u.s." || blob.contains("abc") { score = 30 }
    else if blob.contains("british") || blob.contains("australian") { score = 20 }
    else if blob.contains("english") { score = 15 }
    if isSelectable(src) && score > 0 { score += 5 }
    return score
}

func selectBest(target: String, preferPC: Bool) -> Bool {
    let sources = keyboardSources()
    let scored: [(TISInputSource, Int)] = sources.map { src in
        let value = target == "ar" ? scoreArabic(src, preferPC: preferPC) : scoreEnglish(src)
        return (src, value)
    }
    guard let best = scored.max(by: { $0.1 < $1.1 }), best.1 > 0 else { return false }
    return TISSelectInputSource(best.0) == noErr
}

func showHUD(_ text: String) {
    let app = NSApplication.shared
    app.setActivationPolicy(.accessory)
    let screen = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 800, height: 600)
    let width: CGFloat = min(520, max(280, screen.width * 0.4))
    let height: CGFloat = 48
    let rect = NSRect(
        x: screen.midX - width / 2,
        y: screen.maxY - 72,
        width: width,
        height: height
    )
    let panel = NSPanel(
        contentRect: rect,
        styleMask: [.nonactivatingPanel, .borderless, .hudWindow],
        backing: .buffered,
        defer: false
    )
    panel.level = .statusBar
    panel.isOpaque = false
    panel.backgroundColor = NSColor(calibratedWhite: 0.08, alpha: 0.92)
    panel.hasShadow = true
    panel.ignoresMouseEvents = true
    panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
    let field = NSTextField(labelWithString: text)
    field.frame = NSRect(x: 16, y: 12, width: width - 32, height: 24)
    field.alignment = .center
    field.font = NSFont.systemFont(ofSize: 15, weight: .semibold)
    field.textColor = NSColor(calibratedWhite: 0.96, alpha: 1)
    field.backgroundColor = .clear
    panel.contentView?.addSubview(field)
    panel.orderFrontRegardless()
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
        app.terminate(nil)
    }
    app.run()
}

func promptTrust() -> Bool {
    let prompt = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
    let options = [prompt: true] as CFDictionary
    return AXIsProcessTrustedWithOptions(options)
}

let args = Array(CommandLine.arguments.dropFirst())
if args.isEmpty {
    fputs("usage: mubaddil-mac ime list|get|set ar|en [pc|native] | hud TEXT | trust\n", stderr)
    exit(1)
}

switch args[0] {
case "ime":
    guard args.count > 1 else { exit(1) }
    switch args[1] {
    case "list":
        exit(printSources())
    case "get":
        print(currentID() ?? "")
        exit(0)
    case "set":
        let target = args.count > 2 ? args[2] : "ar"
        let preferPC = args.count > 3 ? args[3] != "native" : true
        exit(selectBest(target: target, preferPC: preferPC) ? 0 : 1)
    default:
        exit(1)
    }
case "hud":
    showHUD(args.dropFirst().joined(separator: " "))
case "trust":
    exit(promptTrust() ? 0 : 1)
default:
    exit(1)
}
