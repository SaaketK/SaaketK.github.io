#pragma once

#include <stdio.h>
#include <vector>
#include <string>
#include <unordered_map>
#include <random>
#include <algorithm>
#include <cmath>
#include <queue>
#include <limits>
#include <stdexcept>
#include <mutex>
#include <atomic>

// Distance Utilities

namespace distance {
   
    inline float l2_squared(const std::vector<float>& a, const std::vector<float>& b){
        float sum = 0.f;
        for(size_t i = 0; i < a.size(); i++){
            float d = a[i] - b[i];
            sum += d*d;
        }
        return sum;
    }

    inline float cosine(const std::vector<float>& a, const std::vector<float>& b){
        float dot = 0.f, na = 0.f, nb = 0.f;
        for(size_t i = 0; i < a.size(); i++){
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        if(na == 0.f || nb == 0.f) return 1.f; // max distance
        return 1.f - (dot / (std::sqrt(na) * std::sqrt(nb)));
    }
}

// Core Types

struct BookNode {
    int id;                     // index in the books array
    std::string open_lib_key;   // open library key - "/works/ABCDEF"
    std::vector<float> vec;     // embedding vector
};

// Candidate alias to create a pair of (distance, node_id)
using Candidate = std::pair<float, int>;

// std::priority_queue is a max-heap by default, use MinCmp and MaxCmp to manually determine which heap to use
struct MinCmp { bool operator()(const Candidate& a, const Candidate& b){ return a.first > b.first; }};
struct MaxCmp { bool operator()(const Candidate& a, const Candidate& b){ return a.first < b.first; }};

class VamanaIndex {
    public:
        // R (Max Degree) L (Search List Size) alpha (pruning factor) 
        struct Config { int R; int L; float alpha; bool use_cosine; };

        VamanaIndex() = default;
        explicit VamanaIndex(Config cfg) : cfg_(cfg) {}

        void build(std::vector<BookNode> books);
        std::vector<int> search(const std::vector<float>& query, int top_k) const;

        const BookNode& node(int id) const { return nodes_[id]; }
        size_t size() const { return nodes_.size(); }
    
    private:
        Config cfg_;
        std::vector<BookNode> nodes_;
        std::vector<std::vector<int>> adj_;
        int medoid_ = 0; // global starting point

        float dist(int a, int b) const;
        float dist_to_query(const std::vector<float>& q, int b) const;
        std::vector<Candidate> internal_greedy_search(int start, int target, int L,
                                                       std::vector<std::mutex>* locks = nullptr) const;
        std::vector<Candidate> beam_search(const std::vector<float>& query, int start, int L) const;
        void prune(int p, std::vector<Candidate>& candidates);
        int find_medoid() const;
        void init_random_graph(std::mt19937& rng);
};
