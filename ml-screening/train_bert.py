"""Fine-tune DistilBERT for resume screening on AzharAli05/Resume-Screening-Dataset.

Input: (Resume, Job_Description) encoded as a sentence pair -> [CLS] resume [SEP] jd [SEP].
Label: Decision (select=1 / reject=0).
Output: a saved HF model directory (default ./distilbert-screen) that serve.py loads.

CPU-only machine, so keep it tractable:
  - DistilBERT (6 layers, ~66M params)
  - short max_len (pair truncation)
  - few epochs

Smoke test first:   python train_bert.py --limit 200 --epochs 1 --max-len 128 --out smoke-model
Full run:           python train_bert.py            (all rows, 2 epochs, max_len 256)
"""
import argparse
import numpy as np
import pandas as pd
from datasets import load_dataset, Dataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from transformers import (
    AutoTokenizer, AutoModelForSequenceClassification,
    TrainingArguments, Trainer, DataCollatorWithPadding,
)

DATASET = "AzharAli05/Resume-Screening-Dataset"
BASE_MODEL = "distilbert-base-uncased"


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int, default=0, help="use only N rows (0 = all) for smoke tests")
    p.add_argument("--epochs", type=float, default=2.0)
    p.add_argument("--max-len", type=int, default=256)
    p.add_argument("--batch", type=int, default=8)
    p.add_argument("--out", type=str, default="distilbert-screen")
    return p.parse_args()


def load_frame(limit: int) -> pd.DataFrame:
    print(f"Downloading {DATASET} ...")
    df = load_dataset(DATASET, split="train").to_pandas()
    label = df["Decision"].astype(str).str.strip().str.lower()
    df = df[label.isin(["select", "reject"])].copy()
    df["label"] = (label[label.isin(["select", "reject"])] == "select").astype(int).values
    df["Resume"] = df["Resume"].fillna("").astype(str)
    df["Job_Description"] = df["Job_Description"].fillna("").astype(str)
    if limit:
        df = df.groupby("label", group_keys=False).apply(
            lambda g: g.sample(min(len(g), limit // 2), random_state=42)
        ).reset_index(drop=True)
    print(f"Using {len(df)} rows | select={int(df.label.sum())} reject={int((1-df.label).sum())}")
    return df


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    probs = 1 / (1 + np.exp(-(logits[:, 1] - logits[:, 0])))
    preds = logits.argmax(axis=-1)
    return {
        "accuracy": accuracy_score(labels, preds),
        "f1": f1_score(labels, preds),
        "roc_auc": roc_auc_score(labels, probs),
    }


def main():
    args = parse_args()
    df = load_frame(args.limit)

    tr_df, te_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["label"])
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

    def tok(batch):
        return tokenizer(batch["Resume"], batch["Job_Description"],
                         truncation=True, max_length=args.max_len)

    keep = ["Resume", "Job_Description", "label"]
    tr_ds = Dataset.from_pandas(tr_df[keep], preserve_index=False).map(tok, batched=True)
    te_ds = Dataset.from_pandas(te_df[keep], preserve_index=False).map(tok, batched=True)

    model = AutoModelForSequenceClassification.from_pretrained(BASE_MODEL, num_labels=2)

    targs = TrainingArguments(
        output_dir="./_bert_ckpt",
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch,
        per_device_eval_batch_size=args.batch * 2,
        eval_strategy="epoch",
        save_strategy="no",
        logging_steps=50,
        learning_rate=2e-5,
        warmup_ratio=0.1,
        report_to="none",
    )

    trainer = Trainer(
        model=model, args=targs,
        train_dataset=tr_ds, eval_dataset=te_ds,
        tokenizer=tokenizer,
        data_collator=DataCollatorWithPadding(tokenizer),
        compute_metrics=compute_metrics,
    )

    print("Training ...")
    trainer.train()
    print("\n=== Final eval ===")
    print(trainer.evaluate())

    trainer.save_model(args.out)
    tokenizer.save_pretrained(args.out)
    print(f"\nSaved model -> {args.out}")


if __name__ == "__main__":
    main()
