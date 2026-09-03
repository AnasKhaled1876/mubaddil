"""Small always-on control window. Falls back to tray-only if Tk is missing."""

from __future__ import annotations

import tkinter as tk
from tkinter import ttk

from . import engine, ime, startup
from .paths import is_msix

INK = "#1a1916"
PAPER = "#f3eadb"
PANEL = "#fffaf1"
ACCENT = "#1f6b4a"
MUTED = "#5e584e"
SESSION = {"root": None}


def show() -> None:
    root = SESSION.get("root")
    if root is None:
        return
    try:
        root.after(0, lambda: (root.deiconify(), root.lift(), root.focus_force()))
    except Exception:
        return


def open_settings(config: dict, watcher, on_quit=None) -> None:
    root = tk.Tk()
    SESSION["root"] = root
    root.title("مبدّل — Mubaddil")
    root.configure(bg=PAPER)
    root.minsize(460, 520)
    root.geometry("520x580")

    try:
        root.tk.call("tk", "scaling", 1.2)
    except tk.TclError:
        pass

    enabled = tk.BooleanVar(value=config.get("enabled", True))
    layout_id = tk.StringVar(value=config.get("layout_id", "windows-101"))
    sensitivity = tk.StringVar(value=config.get("sensitivity", "balanced"))
    boot = tk.BooleanVar(value=config.get("start_with_windows", True))
    status = tk.StringVar(value="شغّال على الجهاز كله — اكتب في أي برنامج")

    def persist() -> None:
        config["enabled"] = bool(enabled.get())
        config["layout_id"] = layout_id.get()
        config["sensitivity"] = sensitivity.get()
        config["start_with_windows"] = bool(boot.get())
        watcher.config = config
        ime.save_config(config)
        if not is_msix():
            if boot.get():
                startup.set_enabled(True)
            else:
                startup.set_enabled(False)

    def on_toggle() -> None:
        persist()
        status.set("شغّال" if enabled.get() else "متوقف")

    pad = {"padx": 20, "pady": 6}
    header = tk.Frame(root, bg=PAPER)
    header.pack(fill="x", **pad)
    tk.Label(
        header,
        text="مبدّل",
        font=("Segoe UI", 26, "bold"),
        fg=INK,
        bg=PAPER,
    ).pack(anchor="e")
    tk.Label(
        header,
        text="يصلح الكتابة بالكيبورد الغلط على ويندوز كله، مش المتصفح بس.",
        font=("Segoe UI", 11),
        fg=MUTED,
        bg=PAPER,
        wraplength=460,
        justify="right",
    ).pack(anchor="e")

    card = tk.Frame(root, bg=PANEL, highlightbackground="#e4dac8", highlightthickness=1)
    card.pack(fill="both", expand=True, padx=20, pady=8)

    tk.Checkbutton(
        card,
        text="شغّال",
        variable=enabled,
        command=on_toggle,
        font=("Segoe UI", 12, "bold"),
        bg=PANEL,
        fg=INK,
        activebackground=PANEL,
        anchor="e",
        justify="right",
    ).pack(fill="x", padx=16, pady=(16, 8))

    tk.Label(card, text="تخطيط الكيبورد", bg=PANEL, fg=INK, anchor="e").pack(
        fill="x", padx=16
    )
    layouts = [f"{item['id']} — {item['label_ar']}" for item in engine.LAYOUTS.values()]
    layout_choice = tk.StringVar(
        value=next(
            (row for row in layouts if row.startswith(layout_id.get())),
            layouts[0],
        )
    )

    def on_layout(_event=None) -> None:
        layout_id.set(layout_choice.get().split(" — ", 1)[0])
        persist()

    combo = ttk.Combobox(
        card, textvariable=layout_choice, values=layouts, state="readonly"
    )
    combo.pack(fill="x", padx=16, pady=(0, 10))
    combo.bind("<<ComboboxSelected>>", on_layout)

    tk.Label(card, text="الحساسية", bg=PANEL, fg=INK, anchor="e").pack(fill="x", padx=16)
    sens_map = {
        "conservative": "هادية — أقل غلط",
        "balanced": "متوازنة",
        "aggressive": "سريعة",
    }
    sens_choice = tk.StringVar(value=sens_map.get(sensitivity.get(), sens_map["balanced"]))

    def on_sens(_event=None) -> None:
        inverted = {label: key for key, label in sens_map.items()}
        sensitivity.set(inverted.get(sens_choice.get(), "balanced"))
        persist()

    sens = ttk.Combobox(
        card, textvariable=sens_choice, values=list(sens_map.values()), state="readonly"
    )
    sens.pack(fill="x", padx=16, pady=(0, 10))
    sens.bind("<<ComboboxSelected>>", on_sens)

    if not is_msix():
        tk.Checkbutton(
            card,
            text="تشغيل مع ويندوز (يفتح لوحده بعد الريستارت)",
            variable=boot,
            command=persist,
            bg=PANEL,
            fg=INK,
            activebackground=PANEL,
            anchor="e",
            justify="right",
        ).pack(fill="x", padx=16, pady=(0, 12))
    else:
        tk.Label(
            card,
            text="حزمة MSIX: يفتح مع ويندوز من إعدادات التطبيقات",
            bg=PANEL,
            fg=MUTED,
            anchor="e",
        ).pack(fill="x", padx=16, pady=(0, 12))

    tk.Label(
        card,
        text="جرّب هنا: اكتب hgsghl ثم مسافة",
        bg=PANEL,
        fg=MUTED,
        anchor="e",
    ).pack(fill="x", padx=16)
    test = tk.Text(card, height=4, font=("Segoe UI", 16), wrap="word")
    test.pack(fill="both", expand=True, padx=16, pady=(0, 8))

    tk.Label(
        card,
        textvariable=status,
        bg=PANEL,
        fg=ACCENT,
        anchor="e",
        font=("Segoe UI", 10, "bold"),
    ).pack(fill="x", padx=16, pady=(0, 8))

    tk.Label(
        card,
        text="تراجع: Alt+Z    إيقاف التحويل: Esc",
        bg=PANEL,
        fg=MUTED,
        anchor="e",
    ).pack(fill="x", padx=16, pady=(0, 16))

    def hide_to_tray() -> None:
        persist()
        root.withdraw()

    def really_quit() -> None:
        persist()
        SESSION["root"] = None
        if on_quit:
            on_quit()
        root.destroy()

    root.protocol("WM_DELETE_WINDOW", hide_to_tray)
    persist()
    root.mainloop()
