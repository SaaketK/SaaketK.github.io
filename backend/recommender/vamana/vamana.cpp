#include "vamana.hpp"
#include <numeric>
#include <cassert>
#include <iostream>
#include <random>

// Distance Helpers

float VamanaIndex::dist(int a, int b) const {
    return cfg_.use_cosine ? distance::cosine(nodes_[a].vec, nodes_[b].vec) : distance::l2_squared(nodes_[a].vec, nodes_[b].vec);
}

float VamanaIndex::dist_to_query(const std::vector<float>& q, int b) const {
    return cfg_.use_cosine ? distance::cosine(q, nodes_[b].vec) : distance::l2_squared(q, nodes_[b].vec);
}

// Find the medoid (node whose average distance to all others is smallest; basically center of the graph)
// O(n^2) complexity

int VamanaIndex::find_medoid() const {
    int n = static_cast<int>(nodes_.size());
    int best = 0;
    float best_sum = std::numeric_limits<float>::max();

    for(int i = 0; i < n; i++){
        float sum = 0.f;
        for(int j = 0; j < n; j++){
            sum += dist(i, j);
        }
        if(sum < best_sum){
            best_sum = sum;
            best = i;
        }
    }
    return best;
}

// Initialize each node with R random distinct neighbors

void VamanaIndex::init_random_graph(std::mt19937& rng){
    int n = static_cast<int>(nodes_.size());
    adj_.assign(n, {});

    std::vector<int> pool(n);
    std::iota(pool.begin(), pool.end(), 0);

    for(int i = 0; i < n; i++){
        std::vector<int> candidates;
        candidates.reserve(cfg_.R);
        // partial Fisher-Yates shuffle to pick R neighbors != i
        std::vector<int> tmp = pool;
        int picks = 0;
        for(int k = n - 1; k >= 0 && picks <= cfg_.R; k--){
            std::uniform_int_distribution<int> ud(0, k);
            int j = ud(rng);
            std::swap(tmp[j], tmp[k]);
            if(tmp[k] != i){
                candidates.push_back(tmp[k]);
                picks++;
            }
        }
        adj_[i] = std::move(candidates);
    }
}

// Greedy Beam Search from a node index to another node index
// Candidates returned in ascending order of distance to target

std::vector<Candidate> VamanaIndex::internal_greedy_search(int start, int target, int L) const {
    std::vector<bool> visited(nodes_.size(), false);

    // min heap of (dist-to-target, node)
    std::priority_queue<Candidate, std::vector<Candidate>, MinCmp> front;
    // track visited nodes
    std::vector<Candidate> seen;

    auto push = [&](int node_id) {
        if(visited[node_id]) return;
        visited[node_id] = true;
        float d = dist(node_id, target);
        front.push({d, node_id});
        seen.push_back({d, node_id});
    };

    push(start);

    while(!front.empty()){
        auto [d, p] = front.top(); 
        front.pop();

        // Expand Neighbors
        for(int nbr : adj_[p]){
            push(nbr);
        }
        
        // Bound front by L
        if(static_cast<int>(front.size()) > L){
            std::vector<Candidate> tmp;
            tmp.reserve(L);
            while(!front.empty()){
                tmp.push_back(front.top());
                front.pop();
            }
            if(static_cast<int>(tmp.size()) > L){
                tmp.resize(L);
            }
            for(auto& c : tmp) front.push(c);
        }
    }
    std::sort(seen.begin(), seen.end()); // Ascending 
    return seen;
}

// Beam Search from entry point to query vector
// Visited Candidates returned in ascending order of distance to query
std::vector<Candidate> VamanaIndex::beam_search(const std::vector<float>& query, int start, int L) const {
    std::vector<bool> visited(nodes_.size(), false);

    std::priority_queue<Candidate, std::vector<Candidate>, MinCmp> front;
    std::vector<Candidate> seen;

    auto push = [&](int node_id) {
        if(visited[node_id]) return;
        visited[node_id] = true;
        float d = dist_to_query(query, node_id);
        front.push({d, node_id});
        seen.push_back({d, node_id});
    };

    push(start);

    while(!front.empty()){
        auto [d, p] = front.top(); 
        front.pop();

        // Expand Neighbors
        for(int nbr : adj_[p]){
            push(nbr);
        }
        
        // Bound front by L
        if(static_cast<int>(front.size()) > L){
            std::vector<Candidate> tmp;
            while(!front.empty()){
                tmp.push_back(front.top());
                front.pop();
            }
            if(static_cast<int>(tmp.size()) > L) tmp.resize(L);
            for(auto& c: tmp) front.push(c);
        }
    }
    std::sort(seen.begin(), seen.end()); // Ascending 
    return seen;
}


// Robust Prune: Select at most R diverse neighbors for node p

void VamanaIndex::prune(int p, std::vector<Candidate>& candidates){

    // Remove self
    candidates.erase(std::remove_if(candidates.begin(), candidates.end(), [p](const Candidate& c){ return c.second == p;}), candidates.end());
    
    // Sort in ascending distance to p
    std::sort(candidates.begin(), candidates.end());
    
    std::vector<int> result;
    result.reserve(cfg_.R);
    std::vector<bool> pruned(candidates.size(), false);

    for(size_t i = 0; i < candidates.size() && static_cast<int>(result.size()) < cfg_.R; i++){
        if(pruned[i]) continue;
        int v_star = candidates[i].second;
        result.push_back(v_star);

        // Prune candidates shadowed by v star
        // Remove c if alpha * dist(v_star, c) <= dist(p, c)
        for(size_t j = i + 1; j < candidates.size(); j++){
            if(pruned[j]) continue;
            int c_id = candidates[j].second;
            float dist_p_c = candidates[j].first;
            float dist_vstar_c = dist(v_star, c_id);
            if(cfg_.alpha * dist_vstar_c <= dist_p_c){
                pruned[j] = true;
            }
        }
    }
    adj_[p] = std::move(result);
}

// Main Vamana Graph Construction

void VamanaIndex::build(std::vector<BookNode> books){
    if (books.empty()){
        throw std::invalid_argument("No books provided to VamanaIndex::build");
    }

    nodes_ = std::move(books);
    int n = static_cast<int>(nodes_.size());

    // Use seed 42 for testing, replace with rd later
    // std::random_device rd; 
    std::mt19937 rng(42);
    init_random_graph(rng);

    // For 10k nodes the medoid seach takes ~10^8 operations
    // If it takes too long, swap for centroid-nearest
    std::cerr << "Vamana:\n Finding medoid over " << n << " nodes\n";
    medoid_ = find_medoid();
    std::cerr << "Medoid: " << medoid_ << "\n";

    // Random visit order
    std::vector<int> order(n);
    std::iota(order.begin(), order.end(), 0);
    std::shuffle(order.begin(), order.end(), rng);

    std::cerr << "Building graph (Max Nodes = " << cfg_.R << ", Search List Size = " << cfg_.L << ", alpha = " << cfg_.alpha << ")\n";
    
    for(int idx = 0; idx < n; idx++){
        int p = order[idx];

        // Greedy search from medoid to p
        auto candidates = internal_greedy_search(medoid_, p, cfg_.L);

        // Merge existing neighbors of p into candidates
        for(int nb : adj_[p]){
            candidates.push_back({dist(p, nb), nb});
        }

        // Remove duplicates by id
        std::sort(candidates.begin(), candidates.end(), [](const Candidate& a, const Candidate& b){ return a.second == b.second; });
        candidates.erase(std::unique(candidates.begin(), candidates.end(), [](const Candidate & a, const Candidate& b){ return a.second == b.second; }));

        // Pruning
        prune(p, candidates);
        
        for(int q : adj_[p]){
            adj_[q].push_back(p);
            if(static_cast<int>(adj_[p].size()) > cfg_.R) {
                // Build candidate list for q and prune again
                std::vector<Candidate> q_cands;
                q_cands.reserve(adj_[q].size());
                for(int nb : adj_[q]){
                    q_cands.push_back({dist(q, nb), nb});
                }
                prune(q, q_cands);
            }
        }
        if(idx % 1000 == 0){
            std::cerr << idx << "/" << n << "nodes processed\n";
        }
    }
    std::cerr << "Build Complete\n";
}

// Beam Search with top-k results

std::vector<int> VamanaIndex::search(const std::vector<float>& query, int top_k) const {
    if(nodes_.empty()){
        throw std::runtime_error("VamanaIndex is empty, build() must be run first");
    }
    auto candidates = beam_search(query, medoid_, cfg_.L);

    int k = std::min(top_k, static_cast<int>(candidates.size()));
    std::vector<int> result(k);
    for(int i = 0; i < k; i++){
        result[i] = candidates[i].second;
    }
    return result;
}