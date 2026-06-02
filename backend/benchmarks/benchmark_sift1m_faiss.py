"""
SIFT1M FAISS Flat benchmark and ground-truth generator.

Run this in a separate Python process from benchmark_sift1m.py so FAISS's
bundled OpenMP runtime is never loaded alongside Vamana's libomp.

Usage (from backend/benchmarks):
    python benchmark_sift1m_faiss.py

This writes:
    sift1m_gt_100000x10000_top10.npy
"""

import time
from pathlib import Path

import numpy as np
import faiss


# ── Config ────────────────────────────────────────────────────────────────────
SIFT_DIR = Path("/Users/saaketk/Downloads/sift")

TOP_K = 10
N_BASE = None
N_QUERIES = 10_000

GT_CACHE = Path(__file__).with_name(
    f"sift1m_gt_{N_BASE or 'full'}x{N_QUERIES}_top{TOP_K}.npy"
)


# ── .fvecs / .ivecs readers ───────────────────────────────────────────────────
def read_fvecs(path: Path, max_n: int = None) -> np.ndarray:
    """Read .fvecs -> float32 ndarray (n, d). Each record: [dim:int32][v0..vd:float32]."""
    with open(path, "rb") as f:
        d = int(np.frombuffer(f.read(4), dtype=np.int32)[0])
    record = 1 + d
    raw = np.fromfile(path, dtype=np.float32)
    n = len(raw) // record
    if max_n:
        n = min(n, max_n)
    return np.ascontiguousarray(raw[: n * record].reshape(n, record)[:, 1:])


def read_ivecs(path: Path, max_n: int = None) -> np.ndarray:
    """Read .ivecs -> int32 ndarray (n, k). Same layout as fvecs but int32 throughout."""
    with open(path, "rb") as f:
        d = int(np.frombuffer(f.read(4), dtype=np.int32)[0])
    record = 1 + d
    raw = np.fromfile(path, dtype=np.int32)
    n = len(raw) // record
    if max_n:
        n = min(n, max_n)
    return np.ascontiguousarray(raw[: n * record].reshape(n, record)[:, 1:])


def recall_at_k(predicted: np.ndarray, ground_truth: np.ndarray, k: int) -> float:
    gt_k = ground_truth[:, :k]
    hits = sum(
        len(set(predicted[i].tolist()) & set(gt_k[i].tolist()))
        for i in range(len(predicted))
    )
    return hits / (len(predicted) * k)


def bench_faiss_flat(base: np.ndarray, queries: np.ndarray, gt: np.ndarray):
    n, d = base.shape

    print(f"[FAISS Flat] building exact index  n={n:,}  d={d}")
    t0 = time.perf_counter()
    idx = faiss.IndexFlatL2(d)
    idx.add(base)
    build_s = time.perf_counter() - t0
    print(f"             build done in {build_s:.2f}s")

    print(f"             searching {len(queries):,} queries ...")
    latencies = np.empty(len(queries))
    predicted = np.empty((len(queries), TOP_K), dtype=np.int32)

    for i, q in enumerate(queries):
        t1 = time.perf_counter()
        _, ids = idx.search(q.reshape(1, -1), TOP_K)
        latencies[i] = (time.perf_counter() - t1) * 1000
        predicted[i] = ids[0]

    rec = recall_at_k(predicted, gt, TOP_K)
    return dict(build_s=build_s, latencies=latencies, recall=rec, name="FAISS Flat")


def main():
    print("=" * 60)
    print("SIFT1M FAISS Flat Benchmark / Ground Truth")
    print(f"  base  : {N_BASE or '1M (full)'} vectors")
    print(f"  queries: {N_QUERIES}")
    print(f"  top-k : {TOP_K}")
    print("=" * 60)

    print("\nLoading data ...")
    t0 = time.perf_counter()
    base = read_fvecs(SIFT_DIR / "sift_base.fvecs", N_BASE)
    query = read_fvecs(SIFT_DIR / "sift_query.fvecs", N_QUERIES)
    print(f"  loaded in {time.perf_counter()-t0:.1f}s  |  base {base.shape}  query {query.shape}")

    if N_BASE is None:
        gt = read_ivecs(SIFT_DIR / "sift_groundtruth.ivecs", N_QUERIES)
        print("  ground truth: loaded from file (full 1M base)")
    else:
        print(f"  ground truth: recomputing on {len(base):,}-vector subset via FAISS ...")
        idx = faiss.IndexFlatL2(base.shape[1])
        idx.add(base)
        _, gt = idx.search(query, TOP_K)
        gt = gt.astype(np.int32)
        np.save(GT_CACHE, gt)
        print(f"  ground truth: saved {GT_CACHE}")

    result = bench_faiss_flat(base, query, gt)
    lats = result["latencies"]

    print("\n" + "=" * 68)
    print(f"{'Method':<14} {'Build':>8}  {'Mean lat':>9} {'p50':>7} {'p99':>7}  {'QPS':>7}  {'Recall@'+str(TOP_K):>10}")
    print("-" * 68)
    print(
        f"{result['name']:<14} {result['build_s']:>7.1f}s"
        f"  {np.mean(lats):>8.2f}ms"
        f" {np.median(lats):>6.2f}ms"
        f" {np.percentile(lats,99):>6.2f}ms"
        f"  {1000/np.mean(lats):>7.0f}"
        f"  {result['recall']:>10.3f}"
    )
    print("=" * 68)
    print(f"\nFAISS Flat recall@{TOP_K}: {result['recall']:.1%} -- exact ceiling\n")


if __name__ == "__main__":
    main()
