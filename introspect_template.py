"""
Step 1: Automated Coordinate & Font Introspection Script.
Inspects an input template PDF, extracting text spans, exact bounding boxes, font metadata,
and maps the target injection regions.
"""
import sys
import json
from pathlib import Path
import pymupdf as fitz

def introspect_template(pdf_path: str, output_json: str = None) -> list:
    pdf_file = Path(pdf_path)
    if not pdf_file.exists():
        raise FileNotFoundError(f"Template PDF not found: {pdf_path}")

    doc = fitz.open(str(pdf_file))
    print(f"Loaded template: {pdf_file.name} (Pages: {len(doc)})")
    page = doc[0]
    print(f"Page geometry: {page.rect.width:.2f} x {page.rect.height:.2f} pt")

    spans = []
    blocks = page.get_text("dict")["blocks"]
    for b in blocks:
        if b.get("type") == 0:
            for l in b["lines"]:
                for s in l["spans"]:
                    text = s["text"].strip()
                    if text:
                        spans.append({
                            "text": s["text"],
                            "origin": [round(x, 2) for x in s.get("origin", (0, 0))],
                            "bbox": [round(x, 2) for x in s["bbox"]],
                            "size": round(s["size"], 2),
                            "font": s["font"],
                            "color": s["color"],
                            "flags": s["flags"],
                        })

    print(f"\nExtracted {len(spans)} text spans from template.\n")
    print(f"{'Origin (X, Y)':<20} {'Size':<8} {'Font':<24} {'Text'}")
    print("-" * 80)
    for s in spans:
        orig_str = f"[{s['origin'][0]:.2f}, {s['origin'][1]:.2f}]"
        print(f"{orig_str:<20} {s['size']:<8.2f} {s['font']:<24} {repr(s['text'])}")

    if output_json:
        out_path = Path(output_json)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(spans, f, indent=2, ensure_ascii=False)
        print(f"\nSaved introspection results to: {out_path}")

    return spans

if __name__ == "__main__":
    pdf_target = sys.argv[1] if len(sys.argv) > 1 else "/home/munim/Downloads/MINAN_261008_114403 (9).pdf"
    introspect_template(pdf_target, "template_introspection.json")
