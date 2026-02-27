"""
train.py
--------
Trains a Logistic Regression model on synthetic infection graph data
for the Vigilance-Net risk prediction pipeline.

Outputs:
    models/risk_model.pkl    — trained LogisticRegression
    models/scaler.pkl        — fitted StandardScaler (must be saved alongside model)
"""

import os
import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from sklearn.model_selection import cross_val_score, train_test_split, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DATA_PATH   = "synthetic_infection_data.csv"
MODEL_DIR   = "models"
MODEL_PATH  = os.path.join(MODEL_DIR, "risk_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")

FEATURES = [
    "degree",
    "infected_neighbors",
    "exposure_time",
    "shortest_path",
    "centrality",
]
TARGET = "infected"

TEST_SIZE   = 0.2
RANDOM_SEED = 42
CV_FOLDS    = 5


# ---------------------------------------------------------------------------
# Load
# ---------------------------------------------------------------------------

def load_data(path: str) -> tuple[pd.DataFrame, pd.Series]:
    df = pd.read_csv(path)

    missing = [f for f in FEATURES + [TARGET] if f not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in dataset: {missing}")

    X = df[FEATURES]
    y = df[TARGET]
    return X, y


# ---------------------------------------------------------------------------
# Train
# ---------------------------------------------------------------------------

def train(X: pd.DataFrame, y: pd.Series) -> tuple[LogisticRegression, StandardScaler]:
    """
    Fits a StandardScaler + LogisticRegression on the training split.
    Scaler is fit ONLY on X_train to prevent data leakage.
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TEST_SIZE,
        random_state=RANDOM_SEED,
        stratify=y,          # preserves class ratio in both splits
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    model = LogisticRegression(max_iter=1000, random_state=RANDOM_SEED)
    model.fit(X_train_scaled, y_train)

    evaluate(model, scaler, X_train, X_test, y_train, y_test, X, y)

    return model, scaler


# ---------------------------------------------------------------------------
# Evaluate
# ---------------------------------------------------------------------------

def evaluate(
    model: LogisticRegression,
    scaler: StandardScaler,
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
    X_full: pd.DataFrame,
    y_full: pd.Series,
) -> None:
    X_test_scaled = scaler.transform(X_test)
    y_pred  = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]

    print("=" * 50)
    print("  Vigilance-Net — Model Training Report")
    print("=" * 50)
    print(f"  Train size : {len(X_train):,}  |  Test size : {len(X_test):,}")
    print(f"  Infected % (test): {y_test.mean():.1%}\n")

    print("Classification Report:")
    print(classification_report(y_test, y_pred, digits=4))

    print(f"ROC-AUC      : {roc_auc_score(y_test, y_proba):.4f}")

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    print(f"Confusion    : TP={tp}  FP={fp}  FN={fn}  TN={tn}")
    print(f"Sensitivity  : {tp / (tp + fn):.4f}  (recall for infected class)")
    print(f"Specificity  : {tn / (tn + fp):.4f}  (recall for non-infected class)")

    # Cross-validation on full dataset using a pipeline (no leakage)
    pipe = Pipeline([("scaler", StandardScaler()), ("model", LogisticRegression(max_iter=1000))])
    cv   = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_SEED)
    cv_scores = cross_val_score(pipe, X_full, y_full, cv=cv, scoring="roc_auc")
    print(f"\n{CV_FOLDS}-Fold CV ROC-AUC : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    print("\nFeature Coefficients (scaled):")
    for feat, coef in sorted(
        zip(FEATURES, model.coef_[0]),
        key=lambda x: abs(x[1]),
        reverse=True,
    ):
        bar = "█" * int(abs(coef) * 3)
        sign = "+" if coef > 0 else "-"
        print(f"  {feat:<22} {sign}{abs(coef):.4f}  {bar}")

    print("=" * 50)


# ---------------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------------

def save_artifacts(model: LogisticRegression, scaler: StandardScaler) -> None:
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"\n  Model  saved → {MODEL_PATH}")
    print(f"  Scaler saved → {SCALER_PATH}")
    print("\nDone.\n")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    X, y = load_data(DATA_PATH)
    model, scaler = train(X, y)
    save_artifacts(model, scaler)


if __name__ == "__main__":
    main()