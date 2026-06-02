#include "vamana.hpp"
#include <numeric>
#include <cassert>
#include <iostream>
#include <random>
#ifdef _OPENMP
#include <omp.h>
#endif

// ─────────────────────────────────────────────────────────────────────────────
// Performance notes:
//   - All node vectors are L2-normalized inside build() once. After that,
//     cosine distance between two stored vectors is simply (1 - dot(a, b)),
//     which removes two sqrt() calls per distance computation.
//   - The query vector is normalized once inside search() before beam_search,
//     so dist_to_query is also a single dot product.
//   - find_medoid is O(n) (centroid-nearest) instead of the original O(n²).
//   - Greedy/beam search uses the standard DiskANN pattern with proper early
//     termination: maintain a top-L sorted candidate set, expand the closest
//     unexpanded node, stop when none remain. This visits O(L) nodes per
//     search instead of potentially all reachable nodes.
// ─────────────────────────────────────────────────────────────────────────────


// ── Distance Helpers ─────────────────────────────────────────────────────────
// Both arguments assumed L2-normalized when use_cosine is true.

float VamanaIndex::dist(int a, int b) const {
    const auto& va = nodes_[a].vec;
    const auto& vb = nodes_[b].vec;
    const size_t d = va.size();

    if (cfg_.use_cosine) {
        float dot = 0.f;
        for (size_t i = 0; i < d; i++) dot += va[i] * vb[i];
        return 1.f - dot;
    } else {
        float sum = 0.f;
        for (size_t i = 0; i < d; i++) {
            float diff = va[i] - vb[i];
            sum += diff * diff;
        }
        return sum;
    }
}

// Query is normalized in search() before any calls reach here.
float VamanaIndex::dist_to_query(const std::vector<float>& q, int b) const {
    const auto& vb = nodes_[b].vec;
    const size_t d = q.size();

    if (cfg_.use_cosine) {
        float dot = 0.f;
        for (size_t i = 0; i < d; i++) dot += q[i] * vb[i];
        return 1.f - dot;
    } else {
        float sum = 0.f;
        for (size_t i = 0; i < d; i++) {
            float diff = q[i] - vb[i];
            sum += diff * diff;
        }
        return sum;
    }
}


// ── Medoid: O(n) centroid-nearest ────────────────────────────────────────────
// Original was O(n²). For 8k nodes × 384 dims that was ~70M distance calls.
int VamanaIndex::find_medoid() const {
    int n   = static_cast<int>(nodes_.size());
    int dim = static_cast<int>(nodes_[0].vec.size());

    std::vector<float> centroid(dim, 0.f);
    for (const auto& node : nodes_)
        for (int d = 0; d < dim; d++)
            centroid[d] += node.vec[d];
    for (float& v : centroid) v /= static_cast<float>(n);

    // Normalize centroid so we can use the same fast dot-product distance.
    if (cfg_.use_cosine) {
        float norm = 0.f;
        for (float v : centroid) norm += v * v;
        norm = std::sqrt(norm);
        if (norm > 0.f) for (float& v : centroid) v /= norm;
    }

    int best = 0;
    float best_dist = std::numeric_limits<float>::max();
    for (int i = 0; i < n; i++) {
        float d;
        if (cfg_.use_cosine) {
            float dot = 0.f;
            for (size_t k = 0; k < centroid.size(); k++) dot += centroid[k] * nodes_[i].vec[k];
            d = 1.f - dot;
        } else {
            d = distance::l2_squared(centroid, nodes_[i].vec);
        }
        if (d < best_dist) { best_dist = d; best = i; }
    }
    return best;
}


// ── Random graph init ────────────────────────────────────────────────────────
void VamanaIndex::init_random_graph(std::mt19937& rng) {
    int n = static_cast<int>(nodes_.size());
    adj_.assign(n, {});

    if (n <= 1 || cfg_.R <= 0) return;

    const int target_degree = std::min(cfg_.R, n - 1);
    const uint32_t base_seed = rng();

    #pragma omp parallel for schedule(static)
    for (int i = 0; i < n; i++) {
        std::mt19937 local_rng(base_seed + static_cast<uint32_t>(i) * 2654435761u);
        std::uniform_int_distribution<int> ud(0, n - 1);

        adj_[i].reserve(target_degree);
        int picks = 0;
        while (picks < target_degree) {
            int j = ud(local_rng);
            if (j == i) continue;

            bool duplicate = false;
            for (int existing : adj_[i]) {
                if (existing == j) {
                    duplicate = true;
                    break;
                }
            }
            if (duplicate) continue;

            adj_[i].push_back(j);
            picks++;
        }
    }
}


// ── Greedy search (build phase): DiskANN-style with early termination ───────
// Returns ALL visited nodes (used by prune as the candidate pool).
std::vector<Candidate> VamanaIndex::internal_greedy_search(int start, int target, int L,
                                                             std::vector<std::mutex>* locks) const {
    int n = static_cast<int>(nodes_.size());
    std::vector<char> visited(n, 0);
    std::vector<char> expanded(n, 0);

    std::vector<Candidate> L_set;
    L_set.reserve(L + 1);

    auto try_insert_L = [&](Candidate c) {
        auto it = std::lower_bound(L_set.begin(), L_set.end(), c);
        L_set.insert(it, c);
        if (static_cast<int>(L_set.size()) > L) L_set.pop_back();
    };

    visited[start] = 1;
    try_insert_L({dist(start, target), start});

    while (true) {
        int p = -1;
        for (const auto& c : L_set) {
            if (!expanded[c.second]) { p = c.second; break; }
        }
        if (p < 0) break;
        expanded[p] = 1;

        // Take a safe snapshot of adj_[p] under lock if running in parallel.
        // Without this, a concurrent push_back on adj_[p] can trigger reallocation
        // and leave this thread with a dangling pointer — silent crash.
        std::vector<int> nbrs;
        if (locks) {
            std::lock_guard<std::mutex> lk((*locks)[p]);
            nbrs = adj_[p];
        } else {
            nbrs = adj_[p];
        }

        for (int nbr : nbrs) {
            if (visited[nbr]) continue;
            visited[nbr] = 1;
            float d = dist(nbr, target);
            if (static_cast<int>(L_set.size()) < L || d < L_set.back().first) {
                try_insert_L({d, nbr});
            }
        }
    }

    return L_set;   // top-L, sorted ascending
}


// ── Beam search (query phase): same pattern as above ─────────────────────────
// Returns top-L sorted ascending — that's all we need for search().
std::vector<Candidate> VamanaIndex::beam_search(const std::vector<float>& query, int start, int L) const {
    int n = static_cast<int>(nodes_.size());
    std::vector<char> visited(n, 0);
    std::vector<char> expanded(n, 0);

    std::vector<Candidate> L_set;
    L_set.reserve(L + 1);

    auto try_insert_L = [&](Candidate c) {
        auto it = std::lower_bound(L_set.begin(), L_set.end(), c);
        L_set.insert(it, c);
        if (static_cast<int>(L_set.size()) > L) L_set.pop_back();
    };

    visited[start] = 1;
    try_insert_L({dist_to_query(query, start), start});

    while (true) {
        int p = -1;
        for (const auto& c : L_set) {
            if (!expanded[c.second]) { p = c.second; break; }
        }
        if (p < 0) break;
        expanded[p] = 1;

        for (int nbr : adj_[p]) {
            if (visited[nbr]) continue;
            visited[nbr] = 1;
            float d = dist_to_query(query, nbr);
            if (static_cast<int>(L_set.size()) < L || d < L_set.back().first) {
                try_insert_L({d, nbr});
            }
        }
    }

    return L_set;   // already sorted ascending
}


// ── Robust Prune (unchanged logic) ───────────────────────────────────────────
void VamanaIndex::prune(int p, std::vector<Candidate>& candidates) {
    candidates.erase(
        std::remove_if(candidates.begin(), candidates.end(),
                       [p](const Candidate& c){ return c.second == p; }),
        candidates.end());

    std::sort(candidates.begin(), candidates.end());

    std::vector<int> result;
    result.reserve(cfg_.R);
    std::vector<char> pruned(candidates.size(), 0);

    for (size_t i = 0; i < candidates.size() && static_cast<int>(result.size()) < cfg_.R; i++) {
        if (pruned[i]) continue;
        int v_star = candidates[i].second;
        result.push_back(v_star);

        for (size_t j = i + 1; j < candidates.size(); j++) {
            if (pruned[j]) continue;
            float dist_p_c     = candidates[j].first;
            float dist_vstar_c = dist(v_star, candidates[j].second);
            if (cfg_.alpha * dist_vstar_c <= dist_p_c) pruned[j] = 1;
        }
    }
    adj_[p] = std::move(result);
}


void VamanaIndex::build(std::vector<BookNode> books) {
    if (books.empty())
        throw std::invalid_argument("No books provided to VamanaIndex::build");

    nodes_ = std::move(books);
    int n  = static_cast<int>(nodes_.size());

    if (cfg_.use_cosine) {
        for (auto& node : nodes_) {
            float norm = 0.f;
            for (float v : node.vec) norm += v * v;
            norm = std::sqrt(norm);
            if (norm > 0.f) for (float& v : node.vec) v /= norm;
        }
    }

    std::mt19937 rng(42);
    init_random_graph(rng);

    std::cerr << "Vamana:\n Finding medoid over " << n << " nodes\n";
    medoid_ = find_medoid();
    std::cerr << "Medoid: " << medoid_ << "\n";

    std::vector<int> order(n);
    std::iota(order.begin(), order.end(), 0);
    std::shuffle(order.begin(), order.end(), rng);

    std::cerr << "Building graph (R=" << cfg_.R << ", L=" << cfg_.L
              << ", alpha=" << cfg_.alpha << ")\n";
#ifdef _OPENMP
    std::cerr << "OpenMP threads: " << omp_get_max_threads() << "\n";
#endif

    // One mutex per node.
    std::vector<std::mutex> locks(n);
    std::atomic<int> done{0};

    #pragma omp parallel for schedule(dynamic, 64)
    for (int idx = 0; idx < n; idx++) {
        int p = order[idx];

        // Phase 1: greedy search — read adj_ with locked snapshots inside.
        auto candidates = internal_greedy_search(medoid_, p, cfg_.L, &locks);

        // Phase 2: prune and update adj_[p] under its own lock.
        {
            std::lock_guard<std::mutex> lk(locks[p]);
            for (int nb : adj_[p])
                candidates.push_back({dist(p, nb), nb});

            std::sort(candidates.begin(), candidates.end(),
                      [](const Candidate& a, const Candidate& b){ return a.second < b.second; });
            candidates.erase(
                std::unique(candidates.begin(), candidates.end(),
                            [](const Candidate& a, const Candidate& b){ return a.second == b.second; }),
                candidates.end());

            prune(p, candidates);
        }

        // Phase 3: reverse edges — always lock lower index first to prevent deadlock.
        std::vector<int> nbrs;
        {
            std::lock_guard<std::mutex> lk(locks[p]);
            nbrs = adj_[p];
        }

        for (int q : nbrs) {
            // Acquire locks in consistent order (smaller index first) to avoid deadlock.
            int lo = std::min(p, q), hi = std::max(p, q);
            std::lock_guard<std::mutex> lk_lo(locks[lo]);
            std::lock_guard<std::mutex> lk_hi(locks[hi]);

            adj_[q].push_back(p);
            if (static_cast<int>(adj_[q].size()) > cfg_.R) {
                std::vector<Candidate> q_cands;
                q_cands.reserve(adj_[q].size());
                for (int nb : adj_[q]) q_cands.push_back({dist(q, nb), nb});
                prune(q, q_cands);
            }
        }

        int cur = ++done;
        if (cur % 1000 == 0)
            std::cerr << cur << "/" << n << " nodes processed\n";
    }

    std::cerr << "Build Complete\n";
}


// ── Search ───────────────────────────────────────────────────────────────────
std::vector<int> VamanaIndex::search(const std::vector<float>& query, int top_k) const {
    if (nodes_.empty())
        throw std::runtime_error("VamanaIndex is empty — call build() first");

    // Normalize the query once so dist_to_query is a single dot product per call.
    std::vector<float> q_norm = query;
    if (cfg_.use_cosine) {
        float norm = 0.f;
        for (float v : q_norm) norm += v * v;
        norm = std::sqrt(norm);
        if (norm > 0.f) for (float& v : q_norm) v /= norm;
    }

    auto candidates = beam_search(q_norm, medoid_, cfg_.L);

    int k = std::min(top_k, static_cast<int>(candidates.size()));
    std::vector<int> result(k);
    for (int i = 0; i < k; i++) result[i] = candidates[i].second;
    return result;
}
