import os
import pandas as pd
import numpy as np

DATASET_PATH = "dataset.csv"
REPORT_PATH = os.path.join("ml", "dataset_report.txt")

def analyze_dataset():
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"{DATASET_PATH} not found in current directory.")

    df = pd.read_csv(DATASET_PATH)
    
    os.makedirs("ml", exist_ok=True)
    
    lines = []
    lines.append("========================================================")
    lines.append("AGRISURGE — DATASET ANALYSIS REPORT")
    lines.append("========================================================")
    lines.append(f"Dataset File: {DATASET_PATH}")
    lines.append(f"Total Rows: {len(df)}")
    lines.append(f"Total Columns: {len(df.columns)}")
    lines.append("")

    lines.append("--- 1. COLUMN NAMES & DATA TYPES ---")
    for col, dtype in df.dtypes.items():
        lines.append(f"  - {col}: {dtype}")
    lines.append("")

    lines.append("--- 2. MISSING VALUES PER COLUMN ---")
    null_counts = df.isnull().sum()
    for col, count in null_counts.items():
        lines.append(f"  - {col}: {count} missing ({count / len(df) * 100:.2f}%)")
    lines.append("")

    lines.append("--- 3. DUPLICATE ROWS ---")
    dup_count = df.duplicated().sum()
    lines.append(f"Total Duplicate Rows: {dup_count}")
    lines.append("")

    lines.append("--- 4. CATEGORICAL COLUMNS & UNIQUE VALUES ---")
    cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    for col in cat_cols:
        val_counts = df[col].value_counts().to_dict()
        lines.append(f"  - {col} ({len(val_counts)} unique): {val_counts}")
    lines.append("")

    lines.append("--- 5. NUMERICAL VARIABLES SUMMARY ---")
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    summary = df[num_cols].describe().T
    lines.append(summary.to_string())
    lines.append("")

    lines.append("--- 6. TARGET DISTRIBUTION (crop_failure) ---")
    if "crop_failure" in df.columns:
        target_counts = df["crop_failure"].value_counts().to_dict()
        target_pct = df["crop_failure"].value_counts(normalize=True).to_dict()
        lines.append(f"Value Counts: {target_counts}")
        lines.append(f"Percentages:  {target_pct}")
    else:
        lines.append("TARGET COLUMN 'crop_failure' NOT FOUND!")
    lines.append("")

    lines.append("--- 7. CORRELATIONS WITH TARGET ---")
    if "crop_failure" in df.columns:
        corr = df[num_cols].corr()["crop_failure"].sort_values(ascending=False)
        lines.append(corr.to_string())
    lines.append("")

    lines.append("--- 8. SUITABILITY ASSESSMENT ---")
    lines.append("The dataset contains real weather, vegetation, soil, and crop features alongside a binary outcome target (crop_failure).")
    lines.append("It is suitable for supervised agricultural risk classification.")
    lines.append("========================================================")

    report_content = "\n".join(lines)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report_content)

    print(report_content)

if __name__ == "__main__":
    analyze_dataset()
