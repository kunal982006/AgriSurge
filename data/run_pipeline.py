"""
AgriSurge ML Pipeline — Master Runner
Runs Phase 1 → Phase 2 → Phase 3 in order.
Usage:  python data/run_pipeline.py
"""
import subprocess
import sys
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def run_phase(script_path: str, label: str):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}\n")
    result = subprocess.run(
        [sys.executable, script_path],
        cwd=ROOT
    )
    if result.returncode != 0:
        print(f"\n[ABORT] {label} failed with exit code {result.returncode}.")
        sys.exit(result.returncode)


if __name__ == "__main__":
    run_phase("data/phase1_audit.py",        "Phase 1 & 2 — Data Audit")
    run_phase("data/phase2_build_dataset.py","Phase 3–8 — Build Training Dataset")
    run_phase("data/phase3_train.py",        "Phase 9–13 — Model Training & Evaluation")
    print("\nFull pipeline complete.")
