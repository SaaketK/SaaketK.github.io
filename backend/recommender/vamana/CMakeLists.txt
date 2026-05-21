cmake_minimum_required(VERSION 3.16)
project(vamana CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Shared Library imported via ctypes
add_library(vamana SHARED vamana.cpp vamana_binding.cpp)

target_compile_options(vamana PRIVATE -O3 -march=native -Wall -Wextra)

# Store as libvamana.so (Linux) / libvamana.dylib (Mac OS)
set_target_properties(vamana PROPERTIES OUTPUT_NAME "vamana" PREFIX "lib")

# Binary for isolation testing
add_executable(vamana_test vamana_test.cpp vamana.cpp)
target_compile_options(vamana_test PRIVATE -O3 -march=native -Wall)