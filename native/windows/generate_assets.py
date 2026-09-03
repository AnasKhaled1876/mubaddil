"""Build Store/MSIX logo assets and the EXE icon from native/assets/icon.png."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "icon.png"
OUT = ROOT / "windows" / "Assets"
ICO = ROOT / "assets" / "icon.ico"

SIZES = {
    "StoreLogo.png": 50,
    "Square44x44Logo.png": 44,
    "Square71x71Logo.png": 71,
    "Square150x150Logo.png": 150,
    "Square310x310Logo.png": 310,
    "Wide310x150Logo.png": (310, 150),
}


def main() -> None:
    image = Image.open(SRC).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size in SIZES.items():
        if isinstance(size, tuple):
            canvas = Image.new("RGBA", size, (243, 234, 219, 255))
            side = min(size) - 24
            tile = image.resize((side, side), Image.Resampling.LANCZOS)
            canvas.paste(tile, ((size[0] - side) // 2, (size[1] - side) // 2), tile)
            canvas.save(OUT / name)
        else:
            image.resize((size, size), Image.Resampling.LANCZOS).save(OUT / name)
    image.save(
        ICO,
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    print(f"wrote {OUT} and {ICO}")


if __name__ == "__main__":
    main()
