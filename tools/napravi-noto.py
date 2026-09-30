# -*- coding: utf-8 -*-
"""Noto Sans za ponudu za ugradnju (dizajn Gradi Lako). Iz varijabilnog fonta pravi tri staticna
(Regular 400, SemiBold 600, Bold 700), pa ih sece na nasa slova kao i napravi-fontove.py.
Pokretanje: python tools/napravi-noto.py  (izvor: tools/izvorni-fontovi/NotoSans-Regular.ttf = varijabilni)"""
import os
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

OVDE = os.path.dirname(os.path.abspath(__file__))
IZVOR = os.path.join(OVDE, "izvorni-fontovi", "NotoSans-Regular.ttf")
CILJ = os.path.join(OVDE, "..", "public", "fonti")
ZNAKOVI = [chr(c) for c in range(0x20, 0x7F)] + [chr(c) for c in range(0xA0, 0x180)] + list("€–—‚„“”‘’×²³°№…•")

def napravi(wght, izlaz):
    f = TTFont(IZVOR)
    f = instancer.instantiateVariableFont(f, {"wght": wght, "wdth": 100})
    o = subset.Options(); o.layout_features = []; o.name_IDs = ["*"]; o.notdef_outline = True; o.recalc_bounds = True
    s = subset.Subsetter(options=o); s.populate(text="".join(ZNAKOVI)); s.subset(f)
    for t in ("GSUB",):
        if t in f: del f[t]
    put = os.path.join(CILJ, izlaz); f.save(put)
    print("%-24s %6.1f KB" % (izlaz, os.path.getsize(put) / 1024))

if __name__ == "__main__":
    napravi(400, "NotoSans-Regular.ttf"); napravi(600, "NotoSans-SemiBold.ttf"); napravi(700, "NotoSans-Bold.ttf")
