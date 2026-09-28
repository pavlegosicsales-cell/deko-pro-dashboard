# -*- coding: utf-8 -*-
"""Pravi male fontove za PDF ponude iz punih TTF-ova.

Zasto:
  1) pdf-lib ume da pokvari font kad sam secе (subset: true), pa se slova ne iscrtaju.
     Zato se ovde unapred isece sve sto nam ne treba, a pdf-lib font ugradi ceo.
  2) Carlito ima „ti" ligaturu iz Calibrija; ona u PDF-u razbija rec
     („karakteristikama" postane „karakteristi kama"). Zato se GSUB tabela uklanja.

Pokretanje:  python tools/napravi-fontove.py
Izvori (skinuti sa github.com/google/fonts) stoje u tools/izvorni-fontovi/.
"""
import os
from fontTools import subset
from fontTools.ttLib import TTFont

OVDE = os.path.dirname(os.path.abspath(__file__))
IZVOR = os.path.join(OVDE, "izvorni-fontovi")
CILJ = os.path.join(OVDE, "..", "public", "fonti")

# ASCII + Latin-1 + Latin Extended-A (č ć ž š đ i sva zapadna slova) + nekoliko znakova
ZNAKOVI = (
    [chr(c) for c in range(0x20, 0x7F)]
    + [chr(c) for c in range(0xA0, 0x180)]
    + list("€–—‚„“”‘’×²³°№…")
)

def napravi(ulaz: str, izlaz: str) -> None:
    f = TTFont(os.path.join(IZVOR, ulaz), fontNumber=0)
    o = subset.Options()
    o.layout_features = []          # bez ligatura i ostalih GSUB zamena
    o.name_IDs = ["*"]
    o.notdef_outline = True
    o.recalc_bounds = True
    s = subset.Subsetter(options=o)
    s.populate(text="".join(ZNAKOVI))
    s.subset(f)
    for t in ("GSUB",):
        if t in f: del f[t]
    put = os.path.join(CILJ, izlaz)
    f.save(put)
    print("%-28s %6.1f KB" % (izlaz, os.path.getsize(put) / 1024))

if __name__ == "__main__":
    os.makedirs(CILJ, exist_ok=True)
    napravi("Carlito-Regular.ttf", "Carlito-Regular.ttf")
    napravi("Carlito-Bold.ttf", "Carlito-Bold.ttf")
    napravi("Arimo-Regular.ttf", "Arimo-Regular.ttf")
