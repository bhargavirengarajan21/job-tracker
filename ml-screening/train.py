"""Train a resume-screening classifier on AzharAli05/Resume-Screening-Dataset.

The label (select/reject) depends on the FIT between a resume and a specific job
description. A plain bag-of-words over concatenated text can't model that, so we
engineer resume<->JD interaction features:
  - resume TF-IDF, JD TF-IDF (shared vocabulary)
  - element-wise product  (co-occurring terms -> alignment)
  - absolute difference   (terms present in one but not the other -> gaps)
These are stacked and fed to LogisticRegression.

Output: model.joblib -> dict(vectorizer, clf). See serve.py for how it's applied.

Run:  python train.py
"""
import sys
import joblib
import numpy as np
import pandas as pd
from scipy.sparse import hstack, csr_matrix
from datasets import load_dataset
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

DATASET = "AzharAli05/Resume-Screening-Dataset"
MODEL_PATH = "model.joblib"


def load_frame() -> pd.DataFrame:
    print(f"Downloading {DATASET} ...")
    df = load_dataset(DATASET, split="train").to_pandas()
    print(f"Loaded {len(df)} rows, columns: {list(df.columns)}")
    return df


def pair_features(vec: TfidfVectorizer, resume, jd):
    """Build [resume, jd, resume*jd, |resume-jd|] feature matrix."""
    r = vec.transform(resume)
    j = vec.transform(jd)
    prod = r.multiply(j)                       # alignment: shared weighted terms
    diff = csr_matrix(np.abs((r - j).toarray())) if r.shape[0] < 2000 else _sparse_absdiff(r, j)
    return hstack([r, j, prod, diff]).tocsr()


def _sparse_absdiff(r, j):
    # abs difference kept sparse to avoid densifying large matrices
    d = (r - j)
    d.data = np.abs(d.data)
    return d


def main() -> int:
    df = load_frame()

    label = df["Decision"].astype(str).str.strip().str.lower()
    mask = label.isin(["select", "reject"])
    df, label = df[mask], label[mask]
    y = (label == "select").astype(int).to_numpy()  # 1 = select, 0 = reject
    print(f"Label balance -> select: {int(y.sum())}, reject: {int((1 - y).sum())}")

    resume = df["Resume"].fillna("").astype(str).to_numpy()
    jd = df["Job_Description"].fillna("").astype(str).to_numpy()

    idx = np.arange(len(y))
    tr, te = train_test_split(idx, test_size=0.2, random_state=42, stratify=y)

    print("Fitting shared TF-IDF vocabulary ...")
    vec = TfidfVectorizer(sublinear_tf=True, ngram_range=(1, 2),
                          min_df=3, max_df=0.9, max_features=40000)
    vec.fit(np.concatenate([resume[tr], jd[tr]]))

    print("Building interaction features ...")
    X_tr = pair_features(vec, resume[tr], jd[tr])
    X_te = pair_features(vec, resume[te], jd[te])

    print("Training ...")
    clf = LogisticRegression(max_iter=3000, C=8.0, class_weight="balanced")
    clf.fit(X_tr, y[tr])

    proba = clf.predict_proba(X_te)[:, 1]
    pred = (proba >= 0.5).astype(int)
    print("\n=== Evaluation (held-out 20%) ===")
    print(classification_report(y[te], pred, target_names=["reject", "select"]))
    print(f"ROC-AUC: {roc_auc_score(y[te], proba):.4f}")

    joblib.dump({"vectorizer": vec, "clf": clf}, MODEL_PATH)
    print(f"\nSaved model -> {MODEL_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
