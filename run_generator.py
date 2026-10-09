"""
Master CLI Entry Point: Pixel-Perfect Automated Certificate Generation Engine.

Usage:
    python run_generator.py --template sample.pdf --data students.xlsx --out ./output_pdfs
"""
import argparse
import sys
import time
from pathlib import Path

from generate_base_template import generate_base_template
from data_processor import load_and_normalize_records
from batch_generator import CertificateGenerator
from verify_diff import verify_visual_diff

def main():
    parser = argparse.ArgumentParser(
        description="Pixel-Perfect Automated Certificate Generation Engine for Hanyang University."
    )
    parser.add_argument(
        "--template",
        "-t",
        type=str,
        default="/home/munim/Downloads/MINAN_261008_114403 (9).pdf",
        help="Path to the original official template PDF.",
    )
    parser.add_argument(
        "--data",
        "-d",
        type=str,
        default="/home/munim/Downloads/Hanyang University 2026 Winter - Student Acceptance List.xlsx",
        help="Path to the Excel (.xlsx) or CSV data file.",
    )
    parser.add_argument(
        "--out",
        "-o",
        type=str,
        default="./dist",
        help="Directory to save the generated PDF certificates.",
    )
    parser.add_argument(
        "--skip-qa",
        action="store_true",
        help="Skip automated visual diff QA check before batch generation.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of certificates to generate (useful for testing).",
    )

    args = parser.parse_args()

    template_path = Path(args.template)
    data_path = Path(args.data)
    out_dir = Path(args.out)

    print("=" * 80)
    print("🎓 HANYANG UNIVERSITY — BATCH CERTIFICATE GENERATION ENGINE")
    print("=" * 80)
    print(f"Template PDF: {template_path}")
    print(f"Data Source : {data_path}")
    print(f"Destination : {out_dir}\n")

    if not template_path.exists():
        print(f"[ERROR] Template PDF does not exist: {template_path}")
        sys.exit(1)
    if not data_path.exists():
        print(f"[ERROR] Data source file does not exist: {data_path}")
        sys.exit(1)

    start_time = time.time()

    # Pass 1: Generate clean vector base template from original
    print("--- [PASS 1: TEMPLATE VECTOR SANITIZATION] ---")
    clean_template = generate_base_template(str(template_path))

    # Pass 2: Data Normalization
    print("\n--- [PASS 2: DATA NORMALIZATION] ---")
    records = load_and_normalize_records(str(data_path))
    if args.limit:
        records = records[:args.limit]
    print(f"[LOADED] {len(records)} normalized student records ready for processing.")

    # Instantiate generator engine
    engine = CertificateGenerator(base_template_path=str(clean_template))

    # Automated QA check on Record #1
    if not args.skip_qa and len(records) > 0:
        print("\n--- [QA TEST: PRE-BATCH VISUAL DIFF VALIDATION] ---")
        test_file = out_dir / "_qa_test_candidate.pdf"
        engine.generate_single_certificate(records[0], test_file)
        qa_passed = verify_visual_diff(str(template_path), str(test_file))
        if test_file.exists():
            test_file.unlink()  # Clean up test candidate

        if not qa_passed:
            print("[ABORT] Automated QA check failed. Aborting batch generation to prevent layout drift.")
            sys.exit(1)
        print("[QA CONFIRMED] Layout verified at 300 DPI. Zero drift on seals & static headers.")

    # Pass 3: Batch Injection
    print("\n--- [PASS 3: BATCH GENERATION & INJECTION] ---")
    generated_files = engine.batch_generate(records, str(out_dir))

    elapsed = time.time() - start_time
    print("=" * 80)
    print(f"✨ BATCH RUN COMPLETED SUCCESSFULLY in {elapsed:.2f}s ({elapsed / len(records):.3f}s/doc)")
    print(f"📂 Output Location: {out_dir.resolve()}")
    print(f"📄 Total Generated: {len(generated_files)} certificates")
    print("=" * 80)

if __name__ == "__main__":
    main()
