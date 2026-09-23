"""Build the offline card bundle from the approved review data."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
with (ROOT / "cards.tsv").open(encoding="utf-8", newline="") as source:
    rows = list(csv.DictReader(source, delimiter="\t"))

expected = {"category", "phrase", "japanese", "example"}
assert len(rows) == 100, f"Expected 100 cards, found {len(rows)}"
assert all(set(row) == expected and all(row.values()) for row in rows), "Missing card field"
assert len({row["phrase"].casefold() for row in rows}) == 100, "Duplicate phrases"
assert len({row["example"].casefold() for row in rows}) == 100, "Duplicate examples"

cards = [{"id": i, **row} for i, row in enumerate(rows, 1)]
(ROOT / "www" / "cards-data.js").write_text(
    "// Generated from cards.tsv. Do not edit by hand.\n"
    + "window.ASN_CARDS = "
    + json.dumps(cards, ensure_ascii=False, separators=(",", ":"))
    + ";\n",
    encoding="utf-8",
)
print(f"Generated {len(cards)} cards")
