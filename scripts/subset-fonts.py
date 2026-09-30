"""
Rebuilds the self-hosted fonts in assets/fonts from the upstream variable fonts.

  pip install fonttools brotli
  python scripts/subset-fonts.py path/to/sources

Sources (SIL Open Font License), from https://github.com/google/fonts/tree/main/ofl:
  cormorantgaramond/CormorantGaramond[wght].ttf
  cormorantgaramond/CormorantGaramond-Italic[wght].ttf
  caveat/Caveat[wght].ttf

`next/font/local` cannot split a family by `unicode-range` the way Google Fonts does,
so each file carries Latin and Cyrillic together: everything English and Bulgarian need.
"""

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

# Google Fonts' "latin" and "cyrillic" ranges.
LATIN = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,"
    "U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
)
CYRILLIC = "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116"

OUT = Path(__file__).resolve().parent.parent / "assets" / "fonts"

# (source, output, axis limits): only the weights `lib/fonts.ts` declares.
FONTS = [
    ("CormorantGaramond[wght].ttf", "CormorantGaramond.woff2", {"wght": (500, 700)}),
    ("CormorantGaramond-Italic[wght].ttf", "CormorantGaramond-Italic.woff2", {"wght": (500, 700)}),
    ("Caveat[wght].ttf", "Caveat-SemiBold.woff2", {"wght": 600}),
]


def build(source: Path, output: Path, axes: dict) -> None:
    # Instance, then reload from disk: subsetting the in-memory instance trips on
    # tables the instancer leaves lazily loaded.
    staged = output.with_suffix(".tmp.ttf")
    instancer.instantiateVariableFont(TTFont(source), axes).save(staged)
    font = TTFont(staged)

    options = subset.Options()
    options.flavor = "woff2"
    # The default feature set keeps kerning, ligatures, contextual alternates and
    # `locl` (the Bulgarian letterforms); stylistic sets are dropped, which is most
    # of the weight.
    options.name_IDs = ["*"]
    options.notdef_outline = True

    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=subset.parse_unicodes(f"{LATIN},{CYRILLIC}"))
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(output)
    staged.unlink()
    print(f"{output.name}: {output.stat().st_size // 1024} KB")


if __name__ == "__main__":
    sources = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    OUT.mkdir(parents=True, exist_ok=True)

    for source, output, axes in FONTS:
        build(sources / source, OUT / output, axes)
