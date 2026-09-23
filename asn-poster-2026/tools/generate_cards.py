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

with (ROOT / "qa.tsv").open(encoding="utf-8", newline="") as source:
    qa_rows = list(csv.DictReader(source, delimiter="\t"))

qa_fields = {"category", "question", "answer"}
assert len(qa_rows) == 50, f"Expected 50 questions, found {len(qa_rows)}"
assert all(set(row) == qa_fields and all(row.values()) for row in qa_rows), "Missing Q&A field"
assert len({row["question"].casefold() for row in qa_rows}) == 50, "Duplicate questions"
assert all(row["question"].endswith("?") for row in qa_rows), "Question needs a question mark"
assert all(all(ord(char) < 128 for char in row["question"] + row["answer"]) for row in qa_rows), "Q&A must be English only"

qa = [{"id": i, **row} for i, row in enumerate(qa_rows, 1)]
(ROOT / "www" / "qa-data.js").write_text(
    "// Generated from qa.tsv. Do not edit by hand.\n"
    + "window.ASN_QA = "
    + json.dumps(qa, ensure_ascii=False, separators=(",", ":"))
    + ";\n",
    encoding="utf-8",
)
print(f"Generated {len(qa)} questions and answers")

review = ["# ASN 2026 Poster: 50 Questions and Answers", "",
          "All questions and answers were rewritten for this edition. Questions 16-50 focus on discussion (35 questions).", "",
          "Audio: question once, answer twice. Flashcards: question on the front, answer on the back.", "",
          "[Sources and interpretation notes](qa-sources.md)", ""]
previous_category = None
for card in qa:
    if card["category"] != previous_category:
        review.extend([f'## {card["category"]}', ""])
        previous_category = card["category"]
    review.extend([f'### {card["id"]:02}. {card["question"]}', "", card["answer"], ""])
(ROOT / "questions-and-answers.md").write_text("\n".join(review), encoding="utf-8")
