"""
ANN Benchmark: Vamana (C++) vs. FAISS (flat) vs. sklearn (brute-force KNN)

Separates BUILD time from SEARCH time for a fair comparison.
Vamana builds a graph (one-time cost); FAISS/sklearn just store vectors.
The meaningful comparison is search latency once the index exists.

Usage (from backend/):
    pip install faiss-cpu scikit-learn
    python benchmark_ann.py
"""

import ctypes
import os
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))

from recommender.embeddings import embed_batch, embed_single, build_book_text
from recommender.openlibrary import search_books
from recommender.keywords import getkeywords

# ── Vamana C library ──────────────────────────────────────────────────────────
_LIB_PATH = os.environ.get(
    "VAMANA_LIB_PATH",
    str(Path(__file__).parent / "recommender" / "vamana" / "libvamana.dylib"),
)
try:
    _lib = ctypes.CDLL(_LIB_PATH)
    _lib.vamana_create.restype  = ctypes.c_void_p
    _lib.vamana_create.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_float, ctypes.c_bool]
    _lib.vamana_build.restype   = None
    _lib.vamana_build.argtypes  = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_float), ctypes.c_int, ctypes.c_int]
    _lib.vamana_search.restype  = ctypes.c_int
    _lib.vamana_search.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_float), ctypes.c_int, ctypes.c_int, ctypes.POINTER(ctypes.c_int)]
    _lib.vamana_destroy.restype = None
    _lib.vamana_destroy.argtypes= [ctypes.c_void_p]
    VAMANA_OK = True
except OSError as e:
    print(f"[warn] Vamana lib not loaded: {e}")
    VAMANA_OK = False

# ── config ────────────────────────────────────────────────────────────────────
QUERIES = [
    "introductory calculus textbook",
    "philosophy of mind and consciousness",
    "algorithms and data structures",
    "russian classic literature novels",
    "quantum mechanics undergraduate",
    "history of mathematics",
    "operating systems and computer architecture",
    "psychology of human behavior",
    "chaos theory and complexity science",
    "machine learning and neural networks",
]

TOP_K   = 200
R, L    = 32, 64
ALPHA   = 1.2


# ── timing helpers ────────────────────────────────────────────────────────────
def time_vamana(book_vecs: np.ndarray, query_vec: np.ndarray, top_k: int):
    """Returns (build_ms, search_ms)."""
    n, dim = book_vecs.shape

    # Zero-copy: numpy buffer → ctypes pointer (no 3M Python objects)
    flat_vecs  = np.ascontiguousarray(book_vecs, dtype=np.float32)
    flat_query = np.ascontiguousarray(query_vec, dtype=np.float32)
    vecs_ptr   = flat_vecs.ctypes.data_as(ctypes.POINTER(ctypes.c_float))
    query_ptr  = flat_query.ctypes.data_as(ctypes.POINTER(ctypes.c_float))
    out_ids    = (ctypes.c_int * top_k)()

    # ── build ──
    t0    = time.perf_counter()
    index = _lib.vamana_create(R, L, ctypes.c_float(ALPHA), True)
    _lib.vamana_build(index, vecs_ptr, n, dim)
    build_ms = (time.perf_counter() - t0) * 1000

    # ── search ──
    t1 = time.perf_counter()
    _lib.vamana_search(index, query_ptr, dim, top_k, out_ids)
    search_ms = (time.perf_counter() - t1) * 1000

    _lib.vamana_destroy(index)
    return build_ms, search_ms


def time_faiss(book_vecs: np.ndarray, query_vec: np.ndarray, top_k: int):
    """Returns (build_ms, search_ms)."""
    import faiss
    dim    = book_vecs.shape[1]
    norms  = np.linalg.norm(book_vecs, axis=1, keepdims=True)
    vecs_n = (book_vecs / np.where(norms == 0, 1, norms)).astype("float32")
    q_norm = (query_vec / np.linalg.norm(query_vec)).astype("float32").reshape(1, -1)

    t0    = time.perf_counter()
    index = faiss.IndexFlatIP(dim)
    index.add(vecs_n)
    build_ms = (time.perf_counter() - t0) * 1000

    t1 = time.perf_counter()
    index.search(q_norm, top_k)
    search_ms = (time.perf_counter() - t1) * 1000

    return build_ms, search_ms


def time_sklearn(book_vecs: np.ndarray, query_vec: np.ndarray, top_k: int):
    """Returns (build_ms, search_ms)."""
    from sklearn.neighbors import NearestNeighbors
    q = query_vec.reshape(1, -1)

    t0 = time.perf_counter()
    nn = NearestNeighbors(n_neighbors=top_k, algorithm="brute", metric="cosine")
    nn.fit(book_vecs)
    build_ms = (time.perf_counter() - t0) * 1000

    t1 = time.perf_counter()
    nn.kneighbors(q)
    search_ms = (time.perf_counter() - t1) * 1000

    return build_ms, search_ms


# ── main ──────────────────────────────────────────────────────────────────────
def main():
    results = []

    for i, query in enumerate(QUERIES, 1):
        print(f"\n[{i:02d}/10] query: \"{query}\"")

        print("       extracting keywords...")
        keywords = getkeywords(query)
        if not keywords:
            print("       [skip] no keywords returned")
            continue

        print(f"       fetching OpenLibrary (keywords: {keywords})...")
        candidates = search_books(keywords, limit=10_000)
        n = len(candidates)
        if n < TOP_K:
            print(f"       [skip] only {n} candidates, need at least {TOP_K}")
            continue
        print(f"       {n} candidates retrieved")

        print("       embedding...")
        book_texts = [build_book_text(b) for b in candidates]
        book_vecs  = np.array(embed_batch(book_texts), dtype="float32")
        query_vec  = np.array(embed_single(query),     dtype="float32")
        top_k      = min(TOP_K, n)
        print(f"       {n} × {book_vecs.shape[1]}-dim ready. benchmarking...")

        row = {"query": query, "n": n}

        if VAMANA_OK:
            vb, vs = time_vamana(book_vecs, query_vec, top_k)
            row["v_build"] = vb; row["v_search"] = vs
            print(f"       vamana  : build {vb:.1f} ms  |  search {vs:.1f} ms")
        else:
            row["v_build"] = row["v_search"] = None
            print("       vamana  : [unavailable]")

        fb, fs = time_faiss(book_vecs, query_vec, top_k)
        row["f_build"] = fb; row["f_search"] = fs
        print(f"       faiss   : build {fb:.1f} ms  |  search {fs:.1f} ms")

        sb, ss = time_sklearn(book_vecs, query_vec, top_k)
        row["s_build"] = sb; row["s_search"] = ss
        print(f"       sklearn : build {sb:.1f} ms  |  search {ss:.1f} ms")

        results.append(row)

    if not results:
        print("\nno results.")
        return

    # ── summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 88)
    print(f"{'query':<38} {'n':>5}  {'vamana':^19}  {'faiss':^19}  {'sklearn':^19}")
    print(f"{'':38} {'':>5}  {'build':>8} {'search':>8}   {'build':>8} {'search':>8}   {'build':>8} {'search':>8}")
    print("-" * 88)

    for r in results:
        vb = f"{r['v_build']:.0f}" if r["v_build"] is not None else "n/a"
        vs = f"{r['v_search']:.1f}" if r["v_search"] is not None else "n/a"
        print(f"{r['query'][:37]:<38} {r['n']:>5}  {vb:>7}ms {vs:>7}ms   {r['f_build']:>7.1f}ms {r['f_search']:>7.1f}ms   {r['s_build']:>7.1f}ms {r['s_search']:>7.1f}ms")

    print("=" * 88)

    # Averages — search only
    vs_times = [r["v_search"] for r in results if r["v_search"] is not None]
    fs_times = [r["f_search"] for r in results]
    ss_times = [r["s_search"] for r in results]

    print(f"\n  SEARCH-ONLY averages (the fair comparison):")
    if vs_times:
        print(f"    vamana : {np.mean(vs_times):.2f} ms")
    print(f"    faiss  : {np.mean(fs_times):.2f} ms")
    print(f"    sklearn: {np.mean(ss_times):.2f} ms")

    if vs_times and ss_times:
        print(f"\n  vamana search speedup vs sklearn search: {np.mean(ss_times) / np.mean(vs_times):.1f}x")
        print(f"  vamana search speedup vs faiss search  : {np.mean(fs_times) / np.mean(vs_times):.1f}x")

    # Build amortization note
    vb_times = [r["v_build"] for r in results if r["v_build"] is not None]
    if vb_times:
        print(f"\n  vamana avg build: {np.mean(vb_times):.0f} ms (one-time cost, amortized over queries)")

    print()


if __name__ == "__main__":
    main()
