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

# ── OpenMP ────────────────────────────────────────────────────────────────────
find_package(OpenMP)
if(OpenMP_CXX_FOUND)
    target_link_libraries(vamana OpenMP::OpenMP_CXX)
    target_link_libraries(vamana_test OpenMP::OpenMP_CXX)
    message(STATUS "OpenMP found via find_package")
else()
    # Apple Clang ships without OpenMP — fall back to Homebrew libomp
    find_library(OMP_LIB omp
        HINTS /opt/homebrew/opt/libomp/lib   # Apple Silicon
              /usr/local/opt/libomp/lib)     # Intel Mac
    find_path(OMP_INCLUDE omp.h
        HINTS /opt/homebrew/opt/libomp/include
              /usr/local/opt/libomp/include)
    if(OMP_LIB AND OMP_INCLUDE)
        foreach(TGT vamana vamana_test)
            target_compile_options(${TGT} PRIVATE -Xpreprocessor -fopenmp)
            target_include_directories(${TGT} PRIVATE ${OMP_INCLUDE})
            target_link_libraries(${TGT} ${OMP_LIB})
        endforeach()
        message(STATUS "OpenMP: using Homebrew (libomp at ${OMP_LIB}")
    else()
        message(STATUS "OpenMP not found — building single-threaded")
    endif()
endif()

# Copy the shared library to the source directory for easy access
add_custom_command(TARGET vamana POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:vamana> ${CMAKE_SOURCE_DIR}/libvamana.dylib)