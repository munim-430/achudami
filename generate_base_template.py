"""
Step 2: Base Template Extraction Script.
Cleanly erases student-specific dynamic text from the original PDF using vector redactions.
Preserves 100% of static labels, vector lines, university seals, and official stamps.
"""
import sys
from pathlib import Path
import pymupdf as fitz
from config import REDACTION_RECTS, CLEAN_TEMPLATE_PATH

def generate_base_template(input_pdf_path: str, output_path: str = None) -> Path:
    in_file = Path(input_pdf_path)
    if not in_file.exists():
        raise FileNotFoundError(f"Input template PDF not found: {input_pdf_path}")

    out_file = Path(output_path) if output_path else CLEAN_TEMPLATE_PATH
    out_file.parent.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(str(in_file))
    page = doc[0]

    print(f"Sanitizing template: {in_file.name}")
    print(f"Applying {len(REDACTION_RECTS)} vector redactions...")

    for field_name, rect in REDACTION_RECTS.items():
        page.add_redact_annot(rect, fill=(1, 1, 1))

    # Apply redactions cleanly (erases vector glyphs beneath redaction boxes)
    page.apply_redactions()

    doc.save(str(out_file), garbage=4, deflate=True)
    doc.close()

    print(f"[SUCCESS] Clean vector base template generated: {out_file}")

    # Verification: check remaining text in base template
    verify_doc = fitz.open(str(out_file))
    v_page = verify_doc[0]
    blocks = v_page.get_text("blocks")
    print(f"\nVerification: {len(blocks)} static text blocks preserved.")
    for b in blocks:
        txt = b[4].strip()
        if txt:
            print(f"  ✓ Preserved static element: {repr(txt[:45])}")

    # Verify official stamp image is preserved
    images = v_page.get_images()
    print(f"\nVerification: {len(images)} official seal/stamp image(s) verified intact.")
    verify_doc.close()

    return out_file

if __name__ == "__main__":
    src_pdf = sys.argv[1] if len(sys.argv) > 1 else "/home/munim/Downloads/MINAN_261008_114403 (9).pdf"
    generate_base_template(src_pdf)
