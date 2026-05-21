'''
Python Wrapper around the compiled Vamana C library
Drop in replacemenmts in router.py:
    candidates = search_books(keywords, limit=10000)
    candidates = vamana_filter(candidates, query, top_k=200)
    ranked = rank_book(body.query, candidates, top_ = body.top_n)

Build shared library:
g++ -O3 -march=native -shared -FPIC -std=c++17 vamana.cpp vamana_binding.cpp -o libvamana.so
Keep libvamana in same dir as this file
'''

import ctypes
import json
import os
import struct 
from pathlib import Path
from typing import Any
from recommender.embeddings import embed_single, build_book_text

# Load Library

_LIB_PATH = os.environ.get("VAMANA_LIB_PATH", str(Path(__file__).parent.parent / "vamana" / "libvamana.so"),)
try:
    _lib = ctypes.CDLL(_LIB_PATH)
except OSError:
    _lib = None

def _lib_available() -> bool:
    return _lib is not None
'''
C API (must match vamana_binding.cpp)
void* vamana_create(int R, int L, float alpha, int use_cosine)
void vamana_build(void* idx, float* vecs, int n, int dim, char** keys, int* ids)
int vamana_search(void* idx, float* query, int dim, int top_k, int* out_ids)
void vamana_destroy(void* idx)
'''
if _lib_available():
    _lib.vamana_create.restype = ctypes.c_void_p
    _lib.vamana_create.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_float, ctypes.c_int]

    _lib.vamana_build.restype = None
    _lib.vamana_build.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_float), ctypes.c_int, ctypes.c_int]

    _lib.vamana_search.restype = ctypes.c_int
    _lib.vamana_search.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_float), ctypes.c_int, ctypes.c_int, ctypes.POINTER(ctypes.c_int)]

    _lib.vamana_destroy.restype = None
    _lib.vamana_destroy.argtypes = [ctypes.c_void_p]

# Embedding Helper

def _embed_text(text: str) -> list[float]:
    return embed_single(text)
    


# Public API

def _vamana_filter_native(candidates: list[dict], book_vecs: list[list[float]], query_vec: list[float], dim: int, top_k: int, R: int, L: int, alpha: float) -> list[dict]:
    # Call compiled Vamana Library
    n = len(candidates)

    # Flattened vectors -> C float array
    flat_vecs = (ctypes.c_float * (n * dim))()
    for i, vec in enumerate(book_vecs):
        for j, v in enumerate(vec):
            flat_vecs[i * dim + j] = v
    
    flat_query = (ctypes.c_float * dim)(*query_vec)
    out_ids = (ctypes.c_int * top_k)()

    # Build index
    index = _lib.vamana_create(R, L, ctypes.c_float(alpha), True)
    try:
        _lib.vamana_build(index, flat_vecs, n, dim)
        hits = _lib.vamana_search(index, flat_query, dim, top_k, out_ids)
    finally:
        _lib.vamana_destroy(index)

    return [candidates[out_ids[i]] for i in range(hits)]

def vamana_filter(candidates: list[dict[str, Any]], query: str, top_k: int = 200, R: int = 48, L: int = 125, alpha: float = 1.2,) -> list[dict[str, Any]]:
    '''
    Given top 10k results from open library, return top_k nearest neighbors w/ Vamana
    If Vamana is unavailable, fall back is a cosine sort
    Parameters:
        candidates  - raw Open Library book dicts
        query       - original user query 
        top_k       - number of books to return (200)
        R, L, alpha - Vamana graph parameters
    '''
    if not candidates:
        return candidates
    
    top_k = min(top_k, len(candidates))

    # Embeddings
    query_vec = _embed_text(query)
    book_texts = [build_book_text(b) for b in candidates]
    book_vecs = [_embed_text(t) for t in book_texts]
    dim = len(query_vec)

    # C Library Path

    if _lib_available():
        return _vamana_filter_native(candidates, book_vecs, query_vec, dim, top_k, R, L, alpha)
    
    # Cosine fallback

    import math
    def cosine_similarity(a: list[float], b: list[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(x * x for x in b))
        return dot/(na * nb) if na and nb else 0.0
    
    scored = sorted(enumerate(candidates), key = lambda iv: cosine_similarity(book_vecs[iv[0]], query_vec), reverse = True)
    return [candidates[i] for i, _ in scored[:top_k]]