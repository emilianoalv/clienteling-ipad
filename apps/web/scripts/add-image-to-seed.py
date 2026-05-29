#!/usr/bin/env python3
"""
One-shot helper: inserta el campo `image: "/products/{sku-lower}.jpg"` justo
debajo de cada línea `sku: "X-Y-N" as Sku,` en product.repository.ts.

Idempotente: si la línea image: ya existe debajo del sku, no la duplica.
"""
import re
import sys
from pathlib import Path

PATH = Path(__file__).parent.parent / "src/server/repositories/product.repository.ts"

with PATH.open("r", encoding="utf-8") as f:
    lines = f.readlines()

sku_re = re.compile(r'^(\s*)sku: "([A-Z]+-[A-Z]+-[0-9]+)" as Sku,\s*$')

out = []
i = 0
inserted = 0
while i < len(lines):
    line = lines[i]
    m = sku_re.match(line)
    out.append(line)
    if m:
        indent = m.group(1)
        sku = m.group(2)
        # Idempotencia: si la siguiente línea ya es `image:`, no insertamos.
        next_line = lines[i + 1] if i + 1 < len(lines) else ""
        if "image:" not in next_line:
            out.append(f'{indent}image: "/products/{sku.lower()}.jpg",\n')
            inserted += 1
    i += 1

with PATH.open("w", encoding="utf-8") as f:
    f.writelines(out)

print(f"Inserted image fields: {inserted}")
