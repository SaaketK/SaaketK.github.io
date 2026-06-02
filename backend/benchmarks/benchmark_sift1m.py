"""
SIFT1M Benchmark: Vamana (C++) only

This script intentionally does not import FAISS. FAISS wheels bundle their own
libomp.dylib on macOS, while Vamana links Homebrew libomp.dylib. Loading both in
one Python process can crash with duplicate OpenMP runtime errors.

Build the Vamana index ONCE, then run all 10k queries against it.
Reports: build time, mean/p99 latency, QPS, recall@10 vs ground truth.

Usage (from backend/benchmarks):
    python benchmark_sift1m.py

Before running this, generate the matching ground-truth file in a separate
process:
    python benchmark_sift1m_faiss.py

To switch to full 1M vectors (expect ~20-30 min build):
    Change N_BASE = None in both benchmark_sift1m.py and
    benchmark_sift1m_faiss.py, then regenerate ground truth.
"""

import ctypes
import sys
import time
from pathlib import Path

import numpy as np

# ── Config ────────────────────────────────────────────────────────────────────
SIFT_DIR  = Path("/Users/saaketk/Downloads/sift")
LIB_PATH  = Path(__file__).parent.parent / "recommender" / "vamana" / "libvamana.dylib"

R, L      = 64, 50
ALPHA     = 1.2
TOP_K     = 10

N_BASE    = None   # set to None for full 1M (slow build, ~20-30 min)
N_QUERIES = 10_000    # all 10k queries

GT_CACHE = Path(__file__).with_name(
    f"sift1m_gt_{N_BASE or 'full'}x{N_QUERIES}_top{TOP_K}.npy"
)


# ── .fvecs / .ivecs readers ───────────────────────────────────────────────────
def read_fvecs(path: Path, max_n: int = None) -> np.ndarray:
    """Read .fvecs → float32 ndarray (n, d). Each record: [dim:int32][v0..vd:float32]."""
    with open(path, "rb") as f:
        d = int(np.frombuffer(f.read(4), dtype=np.int32)[0])
    record = 1 + d  # number of float32 slots per record (dim header + vector)
    raw = np.fromfile(path, dtype=np.float32)
    n = len(raw) // record
    if max_n:
        n = min(n, max_n)
    # Reshape and drop the dim-header column (col 0 is int32 garbage when read as float32)
    return np.ascontiguousarray(raw[: n * record].reshape(n, record)[:, 1:])


def read_ivecs(path: Path, max_n: int = None) -> np.ndarray:
    """Read .ivecs → int32 ndarray (n, k). Same layout as fvecs but int32 throughout."""
    with open(path, "rb") as f:
        d = int(np.frombuffer(f.read(4), dtype=np.int32)[0])
    record = 1 + d
    raw = np.fromfile(path, dtype=np.int32)
    n = len(raw) // record
    if max_n:
        n = min(n, max_n)
    return np.ascontiguousarray(raw[: n * record].reshape(n, record)[:, 1:])


# ── Recall ────────────────────────────────────────────────────────────────────
def recall_at_k(predicted: np.ndarray, ground_truth: np.ndarray, k: int) -> float:
    """Mean recall@k: fraction of true top-k neighbors returned, averaged over queries."""
    gt_k = ground_truth[:, :k]
    hits = sum(
        len(set(predicted[i].tolist()) & set(gt_k[i].tolist()))
        for i in range(len(predicted))
    )
    return hits / (len(predicted) * k)


# ── Vamana ────────────────────────────────────────────────────────────────────
def load_lib() -> ctypes.CDLL:
    lib = ctypes.CDLL(str(LIB_PATH))
    lib.vamana_create.restype   = ctypes.c_void_p
    lib.vamana_create.argtypes  = [ctypes.c_int, ctypes.c_int, ctypes.c_float, ctypes.c_bool]
    lib.vamana_build.restype    = None
    lib.vamana_build.argtypes   = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_float), ctypes.c_int, ctypes.c_int]
    lib.vamana_search.restype   = ctypes.c_int
    lib.vamana_search.argtypes  = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_float), ctypes.c_int, ctypes.c_int, ctypes.POINTER(ctypes.c_int)]
    lib.vamana_destroy.restype  = None
    lib.vamana_destroy.argtypes = [ctypes.c_void_p]
    return lib


def bench_vamana(base: np.ndarray, queries: np.ndarray, gt: np.ndarray):
    n, d = base.shape
    lib  = load_lib()

    print(f"[Vamana] building index  n={n:,}  d={d}  R={R}  L={L}  alpha={ALPHA}")
    base_ptr = base.ctypes.data_as(ctypes.POINTER(ctypes.c_float))

    t0    = time.perf_counter()
    index = lib.vamana_create(R, L, ctypes.c_float(ALPHA), True)
    lib.vamana_build(index, base_ptr, n, d)
    build_s = time.perf_counter() - t0
    print(f"         build done in {build_s:.1f}s")

    print(f"         searching {len(queries):,} queries ...")
    out_ids    = (ctypes.c_int * TOP_K)()
    latencies  = np.empty(len(queries))
    predicted  = np.empty((len(queries), TOP_K), dtype=np.int32)

    for i, q in enumerate(queries):
        q_c   = np.ascontiguousarray(q, dtype=np.float32)
        q_ptr = q_c.ctypes.data_as(ctypes.POINTER(ctypes.c_float))
        t1    = time.perf_counter()
        lib.vamana_search(index, q_ptr, d, TOP_K, out_ids)
        latencies[i] = (time.perf_counter() - t1) * 1000
        predicted[i] = list(out_ids)

    lib.vamana_destroy(index)

    rec = recall_at_k(predicted, gt, TOP_K)
    return dict(build_s=build_s, latencies=latencies, recall=rec, name="Vamana")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("SIFT1M ANN Benchmark")
    print(f"  base  : {N_BASE or '1M (full)'} vectors")
    print(f"  queries: {N_QUERIES}")
    print(f"  top-k : {TOP_K}")
    print("=" * 60)

    print("\nLoading data ...")
    t0    = time.perf_counter()
    base  = read_fvecs(SIFT_DIR / "sift_base.fvecs",  N_BASE)
    query = read_fvecs(SIFT_DIR / "sift_query.fvecs", N_QUERIES)
    print(f"  loaded in {time.perf_counter()-t0:.1f}s  |  base {base.shape}  query {query.shape}")

    # Ground truth: this must be generated by benchmark_sift1m_faiss.py.
    # Keeping FAISS out of this process avoids duplicate libomp.dylib crashes.
    if N_BASE is None:
        gt = read_ivecs(SIFT_DIR / "sift_groundtruth.ivecs", N_QUERIES)
        print(f"  ground truth: loaded from file (full 1M base)\n")
    else:
        if not GT_CACHE.exists():
            raise FileNotFoundError(
                f"Missing ground truth cache: {GT_CACHE}\n"
                "Run benchmark_sift1m_faiss.py first to generate it."
            )
        gt = np.load(GT_CACHE)
        expected_shape = (len(query), TOP_K)
        if gt.shape != expected_shape:
            raise ValueError(
                f"Ground truth cache shape mismatch: got {gt.shape}, expected {expected_shape}. "
                "Regenerate it with benchmark_sift1m_faiss.py."
            )
        print(f"  ground truth: loaded {GT_CACHE.name}\n")

    results = []

    # Vamana
    try:
        results.append(bench_vamana(base, query, gt))
    except Exception as e:
        print(f"[Vamana unavailable: {e}]")

    if not results:
        print("No results.")
        return

    # ── Summary table ─────────────────────────────────────────────────────────
    print("\n" + "=" * 68)
    print(f"{'Method':<14} {'Build':>8}  {'Mean lat':>9} {'p50':>7} {'p99':>7}  {'QPS':>7}  {'Recall@'+str(TOP_K):>10}")
    print("-" * 68)
    for r in results:
        lats = r["latencies"]
        print(
            f"{r['name']:<14} {r['build_s']:>7.1f}s"
            f"  {np.mean(lats):>8.2f}ms"
            f" {np.median(lats):>6.2f}ms"
            f" {np.percentile(lats,99):>6.2f}ms"
            f"  {1000/np.mean(lats):>7.0f}"
            f"  {r['recall']:>10.3f}"
        )
    print("=" * 68)

    print(f"\nVamana recall@{TOP_K}: {results[0]['recall']:.1%}")
    print("Run benchmark_sift1m_faiss.py separately for FAISS Flat timing.\n")


if __name__ == "__main__":
    main()
