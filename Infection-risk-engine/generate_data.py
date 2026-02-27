"""
generate_infection_data.py
--------------------------
Synthetic infection dataset generator for Vigilance-Net graph ML training.

Features generated:
    degree              — number of direct contacts a patient node has
    infected_neighbors  — number of those contacts who are infected
    exposure_time       — cumulative exposure duration in minutes
    shortest_path       — graph distance to nearest confirmed infection source
    centrality          — betweenness/importance score in the contact graph (0–1)

Label:
    infected            — binary (0 = not infected, 1 = infected)

Risk formula (epidemiologically motivated):
    risk = (infected_neighbors * 3)
         + (exposure_time / 120)
         + (1 / shortest_path) * 2
         + (centrality * 2)
         + (degree * 0.05)

    probability = sigmoid(risk - dynamic_offset)
    infected    = 1 if probability > 0.5 else 0

Class balance: ~40% infected (realistic hospital outbreak scenario).
"""

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

RANDOM_SEED    = 42
N_SAMPLES      = 3000
OUTPUT_PATH    = "synthetic_infection_data.csv"

# Feature ranges (epidemiologically justified)
DEGREE_RANGE          = (0, 25)    # contact graph degree
INFECTED_NBR_RANGE    = (0, 6)     # infected neighbors
EXPOSURE_TIME_RANGE   = (0, 300)   # minutes
SHORTEST_PATH_RANGE   = (1, 4)     # hops to nearest source (min=1 avoids div/0)

# Risk weights
W_INFECTED_NEIGHBORS = 3.0
W_EXPOSURE_TIME      = 1 / 120     # normalizes 0–300 min → 0–2.5
W_SHORTEST_PATH      = 2.0         # applied as W / path (higher weight for closer source)
W_CENTRALITY         = 2.0
W_DEGREE             = 0.05

# Sigmoid sharpness — higher = more decisive boundary, lower = more uncertainty
SIGMOID_STEEPNESS = 1.0

# Class balance target: offset = mean(risk) + CLASS_BIAS
# Positive bias → fewer infected (harder to be classified positive)
CLASS_BIAS = 1.5   # Results in ~40% infected; set to 0 for ~50%


# ---------------------------------------------------------------------------
# Generation
# ---------------------------------------------------------------------------

def generate_features(n: int, rng: np.random.Generator) -> dict[str, np.ndarray]:
    return {
        "degree":             rng.integers(*DEGREE_RANGE,        size=n),
        "infected_neighbors": rng.integers(*INFECTED_NBR_RANGE,  size=n),
        "exposure_time":      rng.integers(*EXPOSURE_TIME_RANGE, size=n),
        "shortest_path":      rng.integers(*SHORTEST_PATH_RANGE, size=n),
        "centrality":         rng.random(n),
    }


def compute_risk(features: dict[str, np.ndarray]) -> np.ndarray:
    return (
        features["infected_neighbors"] * W_INFECTED_NEIGHBORS
        + features["exposure_time"]    * W_EXPOSURE_TIME
        + (1 / features["shortest_path"]) * W_SHORTEST_PATH
        + features["centrality"]       * W_CENTRALITY
        + features["degree"]           * W_DEGREE
    )


def risk_to_label(
    risk: np.ndarray,
    steepness: float = SIGMOID_STEEPNESS,
    bias: float = CLASS_BIAS,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Converts raw risk scores to binary infection labels via sigmoid.

    The offset is derived dynamically from the actual risk distribution so
    class balance stays consistent regardless of weight changes.
    """
    offset = risk.mean() + bias
    probability = 1 / (1 + np.exp(-steepness * (risk - offset)))
    infected = (probability > 0.5).astype(int)
    return infected, probability


def build_dataframe(
    features: dict[str, np.ndarray],
    infected: np.ndarray,
    probability: np.ndarray,
) -> pd.DataFrame:
    return pd.DataFrame({
        **features,
        "infection_probability": probability.round(4),
        "infected": infected,
    })


def print_summary(df: pd.DataFrame) -> None:
    total    = len(df)
    n_inf    = df["infected"].sum()
    n_not    = total - n_inf
    inf_rate = n_inf / total

    print("=" * 45)
    print("  Synthetic Infection Dataset Summary")
    print("=" * 45)
    print(f"  Total samples   : {total:,}")
    print(f"  Infected (1)    : {n_inf:,}  ({inf_rate:.1%})")
    print(f"  Not infected (0): {n_not:,}  ({1 - inf_rate:.1%})")
    print(f"  Output file     : {OUTPUT_PATH}")
    print("=" * 45)
    print(df.head(10).to_string(index=False))
    print()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    rng = np.random.default_rng(RANDOM_SEED)

    features    = generate_features(N_SAMPLES, rng)
    risk        = compute_risk(features)
    infected, probability = risk_to_label(risk)
    df          = build_dataframe(features, infected, probability)

    df.to_csv(OUTPUT_PATH, index=False)
    print_summary(df)
    print(df["infected"].value_counts())


if __name__ == "__main__":
    main()