#include "vamana.hpp"
#include <iostream>
#include <cassert>
#include <random>

// Quick smoke-test: build an index over random vectors, search for one of them,
// and confirm it appears in the top results.
int main() {
    const int N   = 500;   // number of "books"
    const int DIM = 64;    // embedding dimension
    const int K   = 10;    // neighbours to retrieve

    std::mt19937 rng(0);
    std::uniform_real_distribution<float> dist(-1.f, 1.f);

    // ── Generate random book vectors ──────────────────────────────────────────
    std::vector<BookNode> books(N);
    for (int i = 0; i < N; ++i) {
        books[i].id = i;
        books[i].open_lib_key = "/works/OL" + std::to_string(i) + "W";
        books[i].vec.resize(DIM);
        for (float& v : books[i].vec) v = dist(rng);
    }

    // Save a query: exact copy of book[42]'s vector — should always be top-1
    std::vector<float> query = books[42].vec;

    // ── Build ─────────────────────────────────────────────────────────────────
    VamanaIndex::Config cfg;
    cfg.R          = 32;
    cfg.L          = 64;
    cfg.alpha      = 1.2f;
    cfg.use_cosine = true;

    VamanaIndex index(cfg);
    index.build(std::move(books));

    // ── Search ────────────────────────────────────────────────────────────────
    auto results = index.search(query, K);

    std::cout << "Top-" << K << " results for query (= book 42):\n";
    bool found_42 = false;
    for (int i = 0; i < static_cast<int>(results.size()); ++i) {
        int id = results[i];
        std::cout << "  #" << i+1 << "  node " << id
                  << "  (" << index.node(id).open_lib_key << ")\n";
        if (id == 42) found_42 = true;
    }

    if (found_42) {
        std::cout << "\n✓ PASS: book 42 found in top-" << K << "\n";
    } else {
        std::cout << "\n✗ FAIL: book 42 not in top-" << K
                  << " — try increasing L or R\n";
        return 1;
    }
    return 0;
}