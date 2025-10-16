import os
import io
import json
import argparse
import sys
from typing import Dict, List, Tuple, Optional

import numpy as np
import pandas as pd
import requests
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score


DATA_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Telco-Customer-Churn-re6WUJLg9NQrkqYJuGUfxcUvxUbjYe.csv"
DEFAULT_OUTPUT_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "public", "models", "churn-model.json")
)


def fetch_dataset(url: str) -> pd.DataFrame:
    print("[v0] Downloading dataset from:", url)
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    df = pd.read_csv(io.BytesIO(resp.content))
    print("[v0] Dataset shape:", df.shape)
    return df


def clean_and_prepare(df: pd.DataFrame) -> pd.DataFrame:
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    before = len(df)
    df = df.dropna(subset=["TotalCharges"]).copy()
    after = len(df)
    if after != before:
        print(f"[v0] Dropped {before - after} rows due to NaN TotalCharges")

    df["Churn"] = df["Churn"].astype(str)
    df["ChurnNumeric"] = (df["Churn"].str.strip().str.lower() == "yes").astype(int)

    return df


def build_feature_spec(df: pd.DataFrame) -> Tuple[List[str], Dict[str, List[str]]]:
    ignore_cols = {"customerID", "Churn", "ChurnNumeric"}

    numeric_cols = [
        c for c in df.columns
        if c not in ignore_cols and pd.api.types.is_numeric_dtype(df[c])
    ]

    categorical_cols = [
        c for c in df.columns
        if c not in ignore_cols and df[c].dtype == "object"
    ]

    categorical_mapping: Dict[str, List[str]] = {}
    for c in categorical_cols:
        cats = df[c].dropna().astype(str).str.strip().unique().tolist()
        cats = sorted(cats)
        categorical_mapping[c] = cats

    return numeric_cols, categorical_mapping


def transform_features(
    df: pd.DataFrame,
    numeric_cols: List[str],
    categorical_mapping: Dict[str, List[str]],
) -> Tuple[np.ndarray, List[str]]:
    feature_names: List[str] = []
    feature_names.extend(numeric_cols)

    for col, cats in categorical_mapping.items():
        for cat in cats:
            feature_names.append(f"{col}__{cat}")

    X = np.zeros((len(df), len(feature_names)), dtype=float)

    for i, (_, row) in enumerate(df.iterrows()):
        for j, col in enumerate(numeric_cols):
            X[i, j] = float(row[col]) if not pd.isna(row[col]) else 0.0

        base = len(numeric_cols)
        idx = base
        for col, cats in categorical_mapping.items():
            val = str(row[col]).strip() if not pd.isna(row[col]) else ""
            for cat in cats:
                X[i, idx] = 1.0 if val == cat else 0.0
                idx += 1

    return X, feature_names


def train_and_export(df: pd.DataFrame, output_path: str = DEFAULT_OUTPUT_PATH) -> None:
    numeric_cols, categorical_mapping = build_feature_spec(df)
    X, feature_names = transform_features(df, numeric_cols, categorical_mapping)
    y = df["ChurnNumeric"].values.astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = LogisticRegression(max_iter=1000, solver="liblinear")
    clf.fit(X_train, y_train)

    proba_test = clf.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, proba_test)
    acc = accuracy_score(y_test, (proba_test >= 0.5).astype(int))
    print(f"[v0] AUC: {auc:.4f} | Accuracy: {acc:.4f}")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    model_json = {
        "model_type": "logistic_regression",
        "target": "Churn",
        "positive_label": "Yes",
        "numeric_cols": numeric_cols,
        "categorical_cols": categorical_mapping,
        "feature_names": feature_names,
        "coef": clf.coef_.ravel().tolist(),
        "intercept": float(clf.intercept_.ravel()[0]),
        "training_metrics": {"auc": float(auc), "accuracy": float(acc)},
        "notes": "Features are numeric columns followed by one-hot vectors for each categorical column in the order specified.",
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(model_json, f, indent=2)

    print(f"[v0] Saved model to: {os.path.abspath(output_path)}")


def load_dataset(input_path: Optional[str], url: str) -> pd.DataFrame:
    if input_path:
        full = os.path.abspath(input_path)
        if os.path.exists(full):
            print("[v0] Loading dataset from local file:", full)
            df = pd.read_csv(full)
            print("[v0] Local dataset shape:", df.shape)
            return df
        else:
            print(f"[v0] Local file not found at {full}. Falling back to URL.")
    return fetch_dataset(url)


def main():
    parser = argparse.ArgumentParser(description="Train churn model and export as JSON")
    parser.add_argument(
        "--input",
        help="Optional local path to Telco-Customer-Churn.csv (fallback if network is blocked)",
        default=None,
    )
    parser.add_argument(
        "--url",
        help="Dataset URL (used if --input is not provided or not found)",
        default=DATA_URL,
    )
    parser.add_argument(
        "--output",
        help="Path to write churn-model.json (defaults to project-root/public/models/churn-model.json)",
        default=DEFAULT_OUTPUT_PATH,
    )
    args = parser.parse_args()

    try:
        df = load_dataset(args.input, args.url)
        df = clean_and_prepare(df)
        train_and_export(df, args.output)
        print("[v0] Done.")
    except Exception as e:
        print("[v0] Training failed:", repr(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
