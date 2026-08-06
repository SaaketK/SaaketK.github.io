#include "vamana.hpp"
#include <cstring>
#include <new>

// extern "C" for python to find the functions

extern "C" {
    // Create a new index
    void* vamana_create(int R, int L, float alpha, bool use_cosine){
        VamanaIndex::Config cfg;
        cfg.R = R;
        cfg.L = L;
        cfg.alpha = alpha;
        cfg.use_cosine = use_cosine;
        return static_cast<void*>(new (std::nothrow) VamanaIndex(cfg));
    }
    /*
        Build the index from a 2D float array
        vectors: [n * dim] - each book occupies 'dim' consecutive floats
        n: number of books
        dim: number of dimensions of each embedding
    */
    void vamana_build(void* handle, float* vecs, int n, int dim){
        auto* idx = static_cast<VamanaIndex*>(handle);
        if(!idx || !vecs || n <= 0 || dim <= 0) return;

        idx->build_flat(vecs, n, dim);
    }
    /*
        Search the index
        query: float array of length 'dim'
        top_k: retrieve k neighbors
        out_ids: caller allocated int array of length top_k, filled with node ids
        returns number of hits written to out_ids
    */ 
    int vamana_search(void* handle, float* query, int dim, int top_k , int* out_ids) {
        auto* idx = static_cast<VamanaIndex*>(handle);
        if(!idx || !query || !out_ids || top_k <= 0) return 0;

        std::vector<float> q(query, query + dim);
        std::vector<int> result = idx->search(q, top_k);

        int hits = static_cast<int>(result.size());
        std::memcpy(out_ids, result.data(), hits * sizeof(int));
        return hits;
    }
    // Free the index
    void vamana_destroy(void* handle){
        delete static_cast<VamanaIndex*>(handle);
    }
}
