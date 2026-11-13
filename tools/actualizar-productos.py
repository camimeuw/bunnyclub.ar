#!/usr/bin/env python3
"""Copia data/productos.csv a data/productos.js.

Sirve para que la página muestre los productos aunque la abras con doble clic
(sin servidor). Corré este script cada vez que edites el CSV:

    python3 tools/actualizar-productos.py
"""
import json, pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
csv = (raiz / "data" / "productos.csv").read_text(encoding="utf-8-sig")
(raiz / "data" / "productos.js").write_text(
    "// Generado por tools/actualizar-productos.py a partir de data/productos.csv. No editar a mano.\n"
    "window.BUNNY_CSV = " + json.dumps(csv, ensure_ascii=False) + ";\n", encoding="utf-8")
print("Listo: data/productos.js actualizado")
