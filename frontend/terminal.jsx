/* global React */
const { useState, useEffect, useRef, useMemo } = React;

// ============================================================
// useDraggable — drag a window by its header
// ============================================================
function useDraggable(initial) {
  const [pos, setPos] = useState(initial);
  const onHeaderMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button')) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...pos };
    const onMove = (ev) => {
      setPos({
        top:  Math.max(0, startPos.top  + (ev.clientY - startY)),
        left: Math.max(0, startPos.left + (ev.clientX - startX)),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  return [pos, onHeaderMouseDown];
}

// ============================================================
// Mock filesystem (shared by both icons + terminal)
// ============================================================
const FS = {
  "about_me": {
    type: "file",
    content:
`hi — I'm Saaket.

CS major at NJIT. double minor in computer engineering & computational mathematics.

current work:
  researching ANNS algorithm performance on Intel AMX CPUs and high-performance GPU clusters. (summer 2026)

past work:
  software engineering intern at Cardaverse. web development frameworks & full-stack engineering. (summer 2025)

interests:
  - computer architecture
  - systems programming
  - high-performance computing
  - quantum computing
  - optimization algorithms

hobbies:
  - learning piano
  - reading books
  - casual basketball

reach me:
  github   ->  github.com/SaaketK
  linkedin ->  linkedin.com/in/saaket-kulkarni
  email    ->  saaket.bgk@gmail.com`
  },
  "Applications/": {
    type: "dir",
    order: ["Books", "Tools", "GD"],
    children: {
      "Tools": { type: "app", app: "tools" },
      "Books": { type: "app", app: "books" },
      "GD": { type: "app", app: "gd" },
    }
  },
  "projects/": {
    type: "dir",
    children: {
      "book_recommender/": {
        type: "dir",
        children: {
          "about": {
            type: "file",
            content:
`# AI Book Discovery Engine

Spring 2026.

stack:
  C++
  Python
  ctypes
  FastAPI
  SQLite
  Docker

pipeline:
  user query
    -> mistral 7B keyword extraction
  SQLite metadata lookup
    -> candidate books
  in-memory C++ Vamana graph routing
    -> top-k results via FastAPI

frontend:
  React-based book discovery UI
  natural-language reading requests
  loading and error states
  ranked results with titles, authors, subjects, and OpenLibrary links

systems work:
  built a Vamana ANNS graph index from scratch in C++
  parallelized graph search with OpenMP
  reached up to 33x query speedup over brute-force FAISS
  measured 96.0% Recall@10 on SIFT1M
  exposed the C++ index to Python via ctypes
  containerized the full stack with Docker

repo: github.com/SaaketK/SaaketK.github.io/tree/main/backend/recommender
double-click \`github\` to open it.`
          },
          "github": {
            type: "link",
            url: "https://github.com/SaaketK/SaaketK.github.io/tree/main/backend/recommender"
          },
          "pipeline.txt": {
            type: "file",
            content:
`# retrieval pipeline

query
  -> Mistral 7B keyword extraction
  -> SQLite metadata lookup
  -> in-memory C++ Vamana graph routing
  -> FastAPI recommendation response
  -> React ranked result cards`
          }
        }
      },
      "pinns/": {
        type: "dir",
        children: {
          "about": {
            type: "file",
            content:
`# Physics-Informed Neural Networks (PINNs)

Summer 2026.

stack:
  Python / PyTorch / NumPy / SciPy
  C (custom autograd + autodiff framework)
  CUDA (backend scaffolded, not yet active)

what it is:
  a research repo exploring PINNs across classical mechanics, quantum
  mechanics, and financial mathematics. each sub-project trains a neural
  network constrained by a governing differential equation and compares
  the result against an analytical solution and a finite-difference baseline.

---

sub-projects:

[1] C/CUDA PINN framework  (C-CUDA-PINNs/)
  a from-scratch CPU-first PINN runtime written in C.
  components:
    - tape-based reverse-mode autograd engine
    - differentiable ops: add, sub, mul, square, mean, tanh, matmul, MSE
    - MLP layers with tanh activations
    - SGD and Adam optimizers
    - forward-mode JetTensor for first and second PDE derivatives
    - latin hypercube sampling over box domains
    - hard-constraint ansatz for boundary / terminal conditions
    - CSV export for loss history, predictions, and timing
    - 9 passing unit test binaries

  1D heat equation:
    u_t = α u_xx,  u(0,x) = sin(πx),  u(t,0) = u(t,1) = 0
    analytical: u(t,x) = exp(-α π² t) sin(πx)

    results:
      PINN  max err 3.84e-04  |  mean err 6.64e-05
      FDM   max err 2.41e-04  |  mean err 8.64e-05
    training ~1 s on CPU. inference 1 ms for 10,000 points.

  1D Black-Scholes:
    V_t + ½σ²S²V_SS + rSV_S - rV = 0
    hard-constraint ansatz enforces terminal payoff and both boundaries
    exactly. payoff smoothed via softplus to handle the kink at S=K.

    results:
      PINN  max err 2.77  |  mean err 1.43e-01
      FDM   max err 1.31e-01  |  mean err 2.15e-03
    error concentrated near the strike (S≈K). active area of improvement.
    todo: L-BFGS refinement, adaptive collocation near strike.

[2] classical harmonic motion  (Classical-Harmonic-Motion/)
  solves the damped oscillator over long horizons (10–60 seconds):
    y'' + γy' + (g/l)y = 0,  y(0)=y₀,  y'(0)=dy₀

  approach: time-sliced PINN. trajectory split into overlapping windows.
  each slice uses a hard-constraint ansatz for exact initial conditions,
  preventing error accumulation across handoffs.
  training: adam warm-up followed by L-BFGS refinement.

  results (60s horizon):
    PINN  max err 3.07e-04  |  mean err 1.32e-05  |  435 s training
    FDM   max err 2.49e-02  |  mean err 1.23e-03  |  0.37 ms
  80× more accurate than FDM at the same computational budget.

[3] quantum harmonic oscillator  (Quantum-Harmonic-Oscillator/)
  solves the stationary 1D QHO:
    -½ψ''(x) + ½x²ψ(x) = Eψ(x)
  bc hard-enforced via ansatz ψ(x) = (1-(x/L)²)·net(x).
  normalization loss prevents the trivial zero solution.
  trains eigenstates n = 0, 1, 2, 3, 7 independently.

  results:
    n=0  E=0.500  wavefunction max err ~1e-04  density max err ~1e-06
    n=1  E=1.500  wavefunction max err ~1e-04  density max err ~1e-06
    n=2  E=2.500  wavefunction max err 3.16e-04  normalization 1.000302
    n=3  E=3.500  wavefunction max err ~1e-04  density max err ~1e-06

[4] wright-fisher PINN  (experiments/wright-fisher/)
  the main research project.
  prediction market prices are modeled as a wright-fisher diffusion:
    dp = θp(1-p)dt + √(c·p(1-p)/(T-t+δ)) dW

  goal: an inverse PINN that recovers latent deficiency parameters from
  observed price paths — detecting clock lag (δ), martingale drift (θ),
  boundary distortion (α), or microstructure noise.

  classical inverse solver (done):
    euler-gaussian quasi-likelihood solver validated on four synthetic
    deficiency types. correctly identifies which deficiency is present
    and recovers parameter values (δ=0.15 clock lag, θ=3 drift, α=2
    boundary distortion all cleanly separated).

  forward PINN — PINN-0 (done):
    learns fokker-planck density ρ(p,t) from simulated path snapshots.
    losses: particle negative log-likelihood + softplus normalization.
    collocation: sinkhorn/wasserstein adaptive sampling.
    training: adam + L-BFGS two-stage.
    result: mean density IAE ≈ 0.084 across six snapshot times.

  inverse PINN — PINN-1 (in progress):
    jointly learns ρ(p,t) and recovers δ from data.
    current status: forward density working (IAE ≈ 0.088), but δ
    saturates at its upper bound.
    next: staged training — freeze δ during forward pretraining,
    release only after density network converges.

---

status summary:
  heat 1D (C)              done       max err 3.84e-04, ~1 s training
  black-scholes 1D (C)     in prog    mean err 1.43e-01, kink unsolved
  SHM time-slice           done       max err 3.07e-04 over 60 s
  QHO eigenstates n=0–7    done       normalization 1.000000
  WF classical solver      done       all 4 deficiency types identified
  WF forward PINN          done       mean density IAE 0.084
  WF inverse PINN          in prog    density fit working; δ recovery failing
  CUDA backend             not started  infrastructure scaffolded

repo: github.com/SaaketK/PINN
double-click \`github\` to open it.`
          },
          "github": {
            type: "link",
            url: "https://github.com/SaaketK/PINN"
          }
        }
      },
      "forge/": {
        type: "dir",
        children: {
          "about": {
            type: "file",
            content:
`# Forge — Agentic C Code Auditor

Spring 2026.

stack:
  Python
  LangGraph
  Claude API
  Docker
  Streamlit

what it is:
  an asynchronous multi-agent pipeline that autonomously audits C codebases and generates verified patches, deployed through Streamlit Community Cloud.

execution graph:
  tree-sitter Abstract Syntax Tree parsing
    -> static analysis orchestration with cppcheck and clang-tidy
    -> Claude API patch formulation
    -> isolated Docker sandbox compilation

frontend:
  Streamlit interface for real-time audit visualization and patch review

deployment:
  containerized end-to-end for reproducible runs

repo: github.com/SaaketK/Forge
double-click \`github\` to open it.`
          },
          "github": {
            type: "link",
            url: "https://github.com/SaaketK/Forge"
          }
        }
      },
      "safepip/": {
        type: "dir",
        children: {
          "about": {
            type: "file",
            content:
`# safepip

a security wrapper around \`pip install\` that defends against typosquatting attacks on PyPI.

what it does:
  - validates package names against the top 1,000 PyPI packages using levenshtein distance — common typos get flagged before you install them
  - displays PyPI metadata (summary, author, creation date, last update)
  - pulls GitHub repo stats (stars, forks, open issues) when a package links one

architecture:
  - python CLI entry point + vetting logic
  - C extension for levenshtein distance (loaded via ctypes, cross-platform)
  - auto-generated popular package constants refreshable via \`safepip-constupdate\`
  - graceful fallback: if the C extension fails to load, metadata still works, typo detection just skips
repo: github.com/SaaketK/Safepip
double-click \`github\` to open it.`
          },
          "github": {
            type: "link",
            url: "https://github.com/SaaketK/Safepip"
          }
        }
      },
      "snaphealth/": {
        type: "dir",
        children: {
          "about": {
            type: "file",
            content:
`# snaphealth

Anthropic Claude Builder Club Hackathon Spring 2026.

developers: Roshan Tailor, Saaket Kulkarni, Frederick Rajakumar

stack:
  React 18
  Vite
  Tailwind CSS
  FastAPI
  Python
  Claude API

an AI-powered health literacy and triage tool for people without easy access to medical guidance.

the problem:
  healthcare literacy is one of the most unevenly distributed resources in the world. whether you're uninsured, dealing with a language barrier, or unable to get a timely appointment, understanding what's happening to yourself is a privilege many don't have.

the solution:
  users can describe symptoms in plain text, upload a photo of a wound or skin condition, or point their camera at a medication label and receive a clear, structured assessment in plain english. it doesn't replace a doctor — it helps people understand what they're looking at well enough to take the right next step.

frontend:
  built the full React/Vite mobile triage workflow
  camera-based symptom capture
  medication label upload
  severity-driven result screens
  follow-up chat UI

image handling:
  client-side canvas resizing
  JPEG conversion
  preview rendering
  optimized upload payloads without server-side image storage

api:
  Claude multimodal vision integration
  structured FastAPI REST endpoints
  Pydantic v2 validation for symptom triage and medication label decoding

live: snaphealth.vercel.app
repo: github.com/RTailor2301/SnapHealth
double-click \`github\` to open it.`
          },
          "github": {
            type: "link",
            url: "https://github.com/RTailor2301/SnapHealth"
          }
        }
      },
      "mit_6_1810_xv6/": {
        type: "dir",
        children: {
          "about": {
            type: "file",
            content:
`# MIT 6.1810 — xv6 labs

self-study work through MIT's operating systems course (6.1810, fall 2024 materials). xv6 is a small unix-like teaching kernel written in C, derived from version 6 unix and ported to RISC-V.
Labs:
  utilities       — sleep/find/exec in xv6         ✓
  syscall         — adding system calls            ✓
  pgtbl           — page table manipulation        ✓
  traps           — backtraces & alarms            ✓
  copy-on-write
  network driver
  lock        
  file system
  mmap        

repo: private. ask me directly if you want to see the work.`
          }
        }
      }
    }
  },
  "tools/": {
    type: "dir",
    children: {
      "heic_to_jpeg.txt": {
        type: "file",
        content:
`# HEIC -> JPEG converter

batch convert apple HEIC photos to JPEG with full color profile accuracy.

backend:
  python (pillow + pillow_heif)
  proper ICC sRGB color profile conversion
  single file -> .jpg | multiple -> .zip

endpoint:
  POST /heic/convert  (multipart upload)`
      },
      "yt_downloader.txt": {
        type: "file",
        content:
`# YouTube -> MP3/MP4

download youtube videos as audio or video.

backend:
  python + yt-dlp + ffmpeg
  containerized in docker

endpoint:
  POST /yt/download  { url, format: "mp3"|"mp4" }`
      },
      "gds_menu.txt": {
        type: "file",
        content:
`# GDS menu scraper

NJIT highlander commons dining menu.

backend:
  python + cloudscraper
  hits dineoncampus.com api directly
  filters to "the daily plate" and "carved & crafted" stations.

endpoint:
  GET /gds/menu?date=today&meal=lunch`
      },
      "clipboard.txt": {
        type: "file",
        content:
`# clipboard -> download

paste an image from your clipboard, get a proper file download with a timestamped name.

backend:
  python + fastapi multipart
  detects format, returns clean download

endpoint:
  POST /clipboard/upload  (image blob)`
      }
    }
  },
  "books/": {
    type: "dir",
    children: {
      "interests.txt": {
        type: "file",
        content:
`# book interests

i read anything in:
  - mathematics
  - physics
  - engineering
  - philosophy
  - psychology

open to recommendations outside these too — think i'd enjoy something? send it my way.

→ open Applications/Books to send a recommendation (or to try the AI recommender for yourself)`
      },
      "currently_reading.md": {
        type: "file",
        content:
`# currently reading

casual:
  - The Denial of Death — Ernest Becker
  - Gödel, Escher Bach - Douglas Hofstadter
  - Inferno — Dante Alighieri

formal:
  - Classical Mechanics — John R. Taylor
  - PDEs: An Introduction — Walter A. Strauss`
      },
      "finished.md": {
        type: "file",
        content:
`# finished

casual:
  - the human stain — philip roth
  - chaos — james gleick
  - atomic habits — james clear
  - crime and punishment — fyodor dostoevsky
  - 48 laws of power — robert greene
  - how to be a stoic — massimo pigliucci
  - the fractal geometry of nature — mandelbrot
  - notes from underground — dostoevsky
  - the idiot — dostoevsky

formal (textbooks):
  - Computer Systems: A Programmer's Perspective — Randal Bryant & David O'Hallaron
  - computer architecture: a quantitative approach — hennessy & patterson

[TODO: add ratings + quick thoughts for each]`
      },
    }
  },
  "top_secret/": {
    type: "dir",
    children: {
      "???.txt": {
        type: "file",
        content:
`[TODO: fill in]`
      }
    }
  },
  "README.txt": {
    type: "file",
    content:
`welcome to my room.

this is my personal site, rendered as the desk i actually work at.

  - double-click any folder to browse it
  - double-click a file to read it
  - the terminal on the right works too
  - try \`help\` for commands

esc closes this view.

— saaket`
  }
};

function getNode(pathArr) {
  let cur = { type: "dir", children: FS };
  for (let i = 0; i < pathArr.length; i++) {
    const key = pathArr[i];
    if (cur.type !== "dir") return null;
    let next = cur.children[key] || cur.children[key + "/"];
    if (!next) return null;
    cur = next;
  }
  return cur;
}
function listDir(node) {
  if (!node || node.type !== "dir") return [];
  if (node.order) return node.order.filter(k => k in node.children || (k + "/") in node.children);
  return Object.keys(node.children).sort();
}
function pathToString(pathArr) {
  return "~" + (pathArr.length ? "/" + pathArr.map(p => p.replace(/\/$/, "")).join("/") : "");
}
function resolvePath(cwd, target) {
  if (!target) return cwd;
  let parts;
  if (target.startsWith("/")) parts = target.split("/").filter(Boolean);
  else parts = [...cwd, ...target.split("/").filter(Boolean)];
  const stack = [];
  for (const p of parts) {
    if (p === "." || p === "") continue;
    if (p === "..") stack.pop();
    else stack.push(p);
  }
  return stack;
}

// ============================================================
// Pixel icon glyphs
// ============================================================
function GithubGlyph({ size = 48 }) {
  // official GitHub mark — clean SVG path (no pixel art for this one)
  return (
    <svg width={size * 0.83} height={size * 0.83} viewBox="0 0 24 24" fill="#0d1117">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function FolderGlyph({ size = 48 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 48 40" shapeRendering="crispEdges">
      <rect x="2" y="6" width="20" height="6" fill="#c0a04a" />
      <rect x="2" y="6" width="20" height="2" fill="#e8d28a" />
      <rect x="2" y="10" width="44" height="26" fill="#e8d28a" />
      <rect x="2" y="10" width="44" height="2" fill="#fff5c4" />
      <rect x="2" y="34" width="44" height="2" fill="#a07a30" />
      <rect x="2" y="10" width="2" height="26" fill="#fff5c4" />
      <rect x="44" y="12" width="2" height="22" fill="#a07a30" />
      <rect x="2" y="6" width="44" height="30" fill="none" stroke="#2a2118" strokeWidth="1" />
    </svg>
  );
}

function FileGlyph({ size = 48 }) {
  return (
    <svg width={size * 0.75} height={size * 0.83} viewBox="0 0 36 40" shapeRendering="crispEdges">
      <polygon points="2,2 26,2 34,10 34,38 2,38" fill="#fff" />
      <polygon points="26,2 34,10 26,10" fill="#c4c4c4" />
      <rect x="2" y="2" width="32" height="36" fill="none" stroke="#2a2118" strokeWidth="1" />
      <line x1="26" y1="2" x2="26" y2="10" stroke="#2a2118" strokeWidth="1" />
      <line x1="26" y1="10" x2="34" y2="10" stroke="#2a2118" strokeWidth="1" />
      <rect x="6" y="16" width="22" height="2" fill="#888" />
      <rect x="6" y="22" width="18" height="2" fill="#888" />
      <rect x="6" y="28" width="20" height="2" fill="#888" />
    </svg>
  );
}

function TerminalGlyph({ size = 48 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 48 40" shapeRendering="crispEdges">
      <rect x="2" y="2" width="44" height="36" fill="#0a0f0a" />
      <rect x="2" y="2" width="44" height="6" fill="#1a4480" />
      <rect x="2" y="2" width="44" height="36" fill="none" stroke="#2a2118" strokeWidth="1" />
      <rect x="6" y="14" width="6" height="2" fill="#5cf08a" />
      <rect x="14" y="14" width="14" height="2" fill="#5cf08a" />
      <rect x="6" y="20" width="20" height="2" fill="#5cf08a" />
      <rect x="6" y="26" width="6" height="2" fill="#5cf08a" />
      <rect x="14" y="26" width="3" height="3" fill="#5cf08a" />
    </svg>
  );
}

function MeGlyph({ size = 48 }) {
  return (
    <svg width={size * 0.83} height={size * 0.83} viewBox="0 0 40 40" shapeRendering="crispEdges">
      <rect x="2" y="2" width="36" height="36" fill="#f0e6c8" />
      <rect x="2" y="2" width="36" height="36" fill="none" stroke="#2a2118" strokeWidth="1" />
      <rect x="14" y="10" width="12" height="14" fill="#e7b890" />
      <rect x="14" y="10" width="12" height="6" fill="#3a2a1f" />
      <rect x="10" y="26" width="20" height="10" fill="#2f4d6e" />
    </svg>
  );
}

function AppsGlyph({ size = 48 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 48 40" shapeRendering="crispEdges">
      <rect x="2" y="2" width="44" height="36" fill="#3a4a5a" />
      <rect x="2" y="2" width="44" height="36" fill="none" stroke="#1a2028" strokeWidth="1" />
      <rect x="8" y="8" width="8" height="8" fill="#5cf08a" />
      <rect x="20" y="8" width="8" height="8" fill="#f0a85c" />
      <rect x="32" y="8" width="8" height="8" fill="#5c8af0" />
      <rect x="8" y="22" width="8" height="8" fill="#f05c8a" />
      <rect x="20" y="22" width="8" height="8" fill="#e8e070" />
      <rect x="32" y="22" width="8" height="8" fill="#a85cf0" />
    </svg>
  );
}

function ToolsAppGlyph({ size = 48 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 48 40" shapeRendering="crispEdges">
      <rect x="2" y="2" width="44" height="36" fill="#6b7a8a" />
      <rect x="2" y="2" width="44" height="36" fill="none" stroke="#2a3038" strokeWidth="1" />
      {/* wrench */}
      <rect x="10" y="8" width="4" height="22" fill="#d0d8e0" />
      <rect x="8" y="6" width="8" height="4" fill="#d0d8e0" />
      <rect x="8" y="28" width="8" height="4" fill="#d0d8e0" />
      {/* screwdriver */}
      <rect x="22" y="6" width="4" height="18" fill="#e8d870" />
      <rect x="20" y="22" width="8" height="6" fill="#a83a3a" />
      {/* hammer */}
      <rect x="34" y="10" width="8" height="6" fill="#888" />
      <rect x="36" y="16" width="4" height="16" fill="#6b4a30" />
    </svg>
  );
}

function GDGlyph({ size = 48 }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" shapeRendering="crispEdges">
      {/* outer dark ring */}
      <rect x="6" y="6" width="36" height="36" rx="4" fill="#7a3e00" />
      {/* orange bg */}
      <rect x="8" y="8" width="32" height="32" rx="3" fill="#e87000" />
      {/* highlight top */}
      <rect x="10" y="10" width="28" height="4" fill="#ffa030" opacity="0.7" />
      {/* yellow star / spiky shape */}
      <polygon points="24,6 27,18 36,14 28,22 38,26 28,28 32,40 24,33 16,40 20,28 10,26 20,22 12,14 21,18" fill="#ffe000" />
      {/* inner orange circle */}
      <rect x="18" y="18" width="12" height="12" rx="2" fill="#e87000" />
      {/* face: eyes */}
      <rect x="20" y="21" width="2" height="3" fill="#1a0a00" />
      <rect x="26" y="21" width="2" height="3" fill="#1a0a00" />
      {/* face: smile */}
      <rect x="20" y="25" width="8" height="1" fill="#1a0a00" />
      <rect x="20" y="26" width="2" height="1" fill="#1a0a00" />
      <rect x="26" y="26" width="2" height="1" fill="#1a0a00" />
    </svg>
  );
}

function BooksAppGlyph({ size = 48 }) {
  return (
    <svg width={size} height={size * 0.83} viewBox="0 0 48 40" shapeRendering="crispEdges">
      <rect x="2" y="2" width="44" height="36" fill="#3a2a1a" />
      <rect x="2" y="2" width="44" height="36" fill="none" stroke="#1a0f08" strokeWidth="1" />
      {/* book spines */}
      <rect x="8" y="6" width="6" height="26" fill="#a83a3a" />
      <rect x="8" y="8" width="6" height="2" fill="#d85858" />
      <rect x="16" y="4" width="6" height="28" fill="#3a6a3a" />
      <rect x="16" y="6" width="6" height="2" fill="#5a8a5a" />
      <rect x="24" y="8" width="6" height="24" fill="#3a4a8a" />
      <rect x="24" y="10" width="6" height="2" fill="#5a6aaa" />
      <rect x="32" y="6" width="6" height="26" fill="#c8a040" />
      <rect x="32" y="8" width="6" height="2" fill="#e8c060" />
      {/* shelf */}
      <rect x="4" y="32" width="40" height="2" fill="#1a0f08" />
    </svg>
  );
}

// ============================================================
// linkifyContent — turn URLs in plain text into clickable <a> tags.
// Catches: full URLs (http/https) and bare domains under common TLDs
// (github.com/path, linkedin.com/in/path, dineoncampus.com, etc.).
// Returns a mixed array of strings and React anchor elements that
// React can render directly.
// ============================================================
const __URL_RE =
  /(https?:\/\/[^\s<>"]+|(?:[\w-]+\.)+(?:com|org|io|dev|net|edu|gov|ai|app)(?:\/[\w\-./?=&%#~+]*)?)/gi;

function linkifyContent(text) {
  if (!text) return text;
  const parts = [];
  let lastIndex = 0;
  let match;
  __URL_RE.lastIndex = 0;
  while ((match = __URL_RE.exec(text)) !== null) {
    let url = match[0];
    // Strip trailing punctuation that's almost certainly sentence-end, not URL
    while (/[.,;:!?)\]]$/.test(url)) url = url.slice(0, -1);
    if (!url) continue;
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const href = url.startsWith("http") ? url : "https://" + url;
    parts.push(
      <a
        key={`l-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#2f5d8a",
          textDecoration: "underline",
          textUnderlineOffset: "2px",
          fontWeight: 500,
        }}
      >
        {url}
      </a>
    );
    lastIndex = match.index + url.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? parts : text;
}

// ============================================================
// File viewer popup (parchment style, no terminal involvement)
// ============================================================
function FileViewer({ name, content, onClose, offsetIndex = 0, zIndex = 200, onFocus }) {
  const initLeft = typeof window !== 'undefined' ? Math.max(40, Math.round(window.innerWidth / 2 - 280)) : 200;
  const [pos, onHeaderMouseDown] = useDraggable({ top: 50 + offsetIndex * 28, left: initLeft + offsetIndex * 28 });
  const [size, setSize] = useState({ width: 560, height: 500 });
  const startResize = (e) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, sw = size.width, sh = size.height;
    const mv = (ev) => setSize({ width: Math.max(320, sw + (ev.clientX - sx)), height: Math.max(220, sh + (ev.clientY - sy)) });
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  };
  return (
    <div
      onMouseDown={onFocus}
      style={{
      position: "absolute", top: pos.top, left: pos.left,
      width: size.width, background: "#f5edb3", border: "2px solid #b8a040",
      borderRadius: 4, zIndex: zIndex, fontFamily: "'VT323', monospace",
      boxShadow: "4px 4px 0 rgba(0,0,0,0.4)",
      display: "flex", flexDirection: "column"
    }}>
      <div
        onMouseDown={onHeaderMouseDown}
        style={{
          background: "#d4b840", padding: "4px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #b8a040",
          cursor: "move", userSelect: "none"
        }}
      >
        <span style={{ fontSize: 20, color: "#3a2a00", fontWeight: "bold" }}>{name}</span>
        <button onClick={onClose} style={{
          background: "#e8c940", border: "1px solid #b8a040",
          cursor: "pointer", fontFamily: "inherit", fontSize: 18,
          padding: "0 10px", color: "#3a2a00", lineHeight: "26px"
        }}>✕</button>
      </div>
      <div style={{
        padding: "16px 32px", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 19,
        color: "#2a1a00", height: size.height - 80, overflowY: "auto", lineHeight: 1.55
      }}>
        {linkifyContent(content)}
      </div>
      <div style={{
        background: "#d4b840", padding: "4px 10px", fontSize: 15,
        color: "#3a2a00", borderTop: "1px solid #b8a040",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span>READ-ONLY  |  {content.split('\n').length} lines  |  {name.split('.').pop()}</span>
        <span onMouseDown={startResize} title="Drag to resize" style={{ display: "inline-block", width: 14, height: 14, cursor: "nwse-resize", background: "repeating-linear-gradient(135deg, #3a2a00 0 2px, transparent 2px 5px)" }}></span>
      </div>
    </div>
  );
}

// ============================================================
// Desktop modal
// ============================================================
function Desktop({ onClose, initialFolder = null }) {
  const [openFolder, setOpenFolder] = useState(initialFolder);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [viewers, setViewers] = useState([]); // [{ id, name, content }]
  const [apps, setApps] = useState([]); // [{ id, app }]
  const [windowOrder, setWindowOrder] = useState(() => initialFolder ? ['folder'] : []); // stacking: 'folder' | viewer id | `app-${id}`
  const viewerIdRef = useRef(0);
  const appIdRef = useRef(0);
  const focusWindow = (id) => setWindowOrder((o) => (o[o.length - 1] === id ? o : [...o.filter((x) => x !== id), id]));
  const openViewer = (name, content) => {
    const id = ++viewerIdRef.current;
    setViewers((v) => [...v, { id, name, content }]);
    setWindowOrder((o) => [...o.filter((x) => x !== id), id]);
  };
  const closeViewer = (id) => {
    setViewers((v) => v.filter((w) => w.id !== id));
    setWindowOrder((o) => o.filter((x) => x !== id));
  };
  const openApp = (appName) => {
    const id = ++appIdRef.current;
    const key = `app-${id}`;
    setApps((a) => [...a, { id, app: appName }]);
    setWindowOrder((o) => [...o.filter((x) => x !== key), key]);
  };
  const closeApp = (id) => {
    const key = `app-${id}`;
    setApps((a) => a.filter((w) => w.id !== id));
    setWindowOrder((o) => o.filter((x) => x !== key));
  };
  const termRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  
  // FIXED: 12-hour clock with AM/PM
  const hours = now.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  const hh = String(hours % 12 || 12).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const clockText = `${hh}:${mm} ${ampm}`;

  const rootIcons = [
    { name: "about_me",       kind: "file", glyph: <MeGlyph /> },
    { name: "Applications/",  kind: "dir",  glyph: <AppsGlyph /> },
    { name: "projects/",      kind: "dir",  glyph: <FolderGlyph /> },
    { name: "tools/",         kind: "dir",  glyph: <FolderGlyph /> },
    { name: "books/",         kind: "dir",  glyph: <FolderGlyph /> },
    { name: "top_secret/",    kind: "dir",  glyph: <FolderGlyph /> },
    { name: "README.txt",     kind: "file", glyph: <FileGlyph /> },
    { name: "Terminal",       kind: "term", glyph: <TerminalGlyph /> },
  ];

  const openIcon = (icon) => {
    if (icon.kind === "dir") {
      setOpenFolder([icon.name]);
      setWindowOrder((o) => [...o.filter((x) => x !== 'folder'), 'folder']);
    } else if (icon.kind === "file") {
      const node = getNode([icon.name]);
      if (!node) return;
      if (node.type === "link") window.open(node.url, "_blank", "noopener,noreferrer");
      else openViewer(icon.name, node.content);
    } else if (icon.kind === "term") {
      termRef.current?.focus();
    }
  };

  return (
    <div className="desktop" onMouseDown={(e) => {
      if (e.target === e.currentTarget || e.target.classList.contains("desk-body") || e.target.classList.contains("desk-icons")) {
        setSelectedIcon(null);
      }
    }}>
      {/* menubar */}
      <div className="desk-menubar">
        <span className="brand"><span className="logo"></span>RoomOS</span>
        <span className="item">File</span>
        <span className="item">Edit</span>
        <span className="item">View</span>
        <span className="item">Help</span>
        <span className="grow"></span>
        <span className="clock">{clockText}</span>
        <button className="x" onClick={onClose}>x</button>
      </div>

      {/* body: icons left, terminal right */}
      <div className="desk-body">
        <div className="desk-icons">
          {rootIcons.map((ic) => (
            <div
              key={ic.name}
              className={"desk-icon" + (selectedIcon === ic.name ? " selected" : "")}
              onMouseDown={(e) => { e.stopPropagation(); setSelectedIcon(ic.name); }}
              onDoubleClick={() => openIcon(ic)}
            >
              <span className="glyph">{ic.glyph}</span>
              <span className="label">{ic.name}</span>
            </div>
          ))}
        </div>

        <TerminalPanel ref={termRef} initialCwd={initialFolder || []} onClose={onClose} onOpenApp={openApp} />
      </div>

      {/* taskbar */}
      <div className="desk-taskbar">
        <button className="start" onClick={() => termRef.current?.focus()}>▌ Start</button>
        <span className="task">
          <span style={{display:"inline-block",width:10,height:10,background:"#5cf08a",border:"1px solid #1a4a1a"}}></span>
          Terminal
        </span>
        {openFolder && (
          <span className="task">
            <span style={{display:"inline-block",width:10,height:8,background:"#e8d28a",border:"1px solid #2a2118"}}></span>
            {openFolder.join("/")}
          </span>
        )}
        <span className="grow"></span>
        <span className="tray">{clockText}</span>
      </div>

      {/* Stack of open file viewers — each open file pushes a new window */}
      {viewers.map((v, i) => (
        <FileViewer
          key={v.id}
          name={v.name}
          content={v.content}
          offsetIndex={i}
          zIndex={200 + windowOrder.indexOf(v.id)}
          onFocus={() => focusWindow(v.id)}
          onClose={() => closeViewer(v.id)}
        />
      ))}

      {/* Apps (Tools / Books) */}
      {apps.map((a, i) => {
        const key = `app-${a.id}`;
        const z = 200 + windowOrder.indexOf(key);
        if (a.app === "tools") {
          return <ToolsApp key={a.id} offsetIndex={i} zIndex={z}
            onFocus={() => focusWindow(key)} onClose={() => closeApp(a.id)} />;
        }
        if (a.app === "books") {
          return <BooksApp key={a.id} offsetIndex={i} zIndex={z}
            onFocus={() => focusWindow(key)} onClose={() => closeApp(a.id)} />;
        }
        if (a.app === "gd") {
          return <GDApp key={a.id} offsetIndex={i} zIndex={z}
            onFocus={() => focusWindow(key)} onClose={() => closeApp(a.id)} />;
        }
        return null;
      })}

      {openFolder && (
        <FileWindow
          path={openFolder}
          zIndex={200 + windowOrder.indexOf('folder')}
          onFocus={() => focusWindow('folder')}
          onClose={() => { setOpenFolder(null); setWindowOrder((o) => o.filter((x) => x !== 'folder')); }}
          onOpenFile={(p, name) => {
            const node = getNode([...p.map(s => s.replace(/\/$/, "")), name]);
            if (!node) return;
            if (node.type === "link") window.open(node.url, "_blank", "noopener,noreferrer");
            else if (node.type === "app") openApp(node.app);
            else openViewer(name, node.content);
          }}
          onOpenDir={(p) => {
            if (p) { setOpenFolder(p); setWindowOrder((o) => [...o.filter((x) => x !== 'folder'), 'folder']); }
            else { setOpenFolder(null); setWindowOrder((o) => o.filter((x) => x !== 'folder')); }
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// File browser window
// ============================================================
function FileWindow({ path, onClose, onOpenFile, onOpenDir, zIndex = 200, onFocus }) {
  const node = getNode(path);
  const items = listDir(node);
  const offsetTop = 80 + (path.length * 26);
  const offsetLeft = 280 + (path.length * 26);
  const [pos, onHeaderMouseDown] = useDraggable({ top: offsetTop, left: offsetLeft });
  const [size, setSize] = useState({ width: 540, height: 340 });
  const startResize = (e) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, sw = size.width, sh = size.height;
    const mv = (ev) => setSize({ width: Math.max(280, sw + (ev.clientX - sx)), height: Math.max(200, sh + (ev.clientY - sy)) });
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  };
  return (
    <div className="file-window" onMouseDown={onFocus} style={{ top: pos.top, left: pos.left, width: size.width, height: size.height, position: "absolute", zIndex }}>
      <div onMouseDown={startResize} title="Drag to resize" style={{ position: "absolute", right: 0, bottom: 0, width: 16, height: 16, cursor: "nwse-resize", background: "repeating-linear-gradient(135deg, #1a1a1a 0 2px, transparent 2px 5px)", zIndex: 5 }}></div>
      <div className="term-bar" onMouseDown={onHeaderMouseDown} style={{ cursor: "move", userSelect: "none" }}>
        <div className="title-icon" style={{ background: "#e8d28a" }}></div>
        <div className="title">{path.join("/")}</div>
        <button className="btn" onClick={() => {
          const up = path.slice(0, -1);
          onOpenDir(up.length ? up : null);
        }}>↑</button>
        <button className="btn" onClick={onClose}>x</button>
      </div>
      <div className="body">
        {items.length === 0 && <div style={{ color: "#666", padding: 8 }}>(empty folder)</div>}
        {items.map((name) => {
          const isDir = name.endsWith("/");
          const stripped = name.replace(/\/$/, "");
          const child = !isDir ? getNode([...path.map(s => s.replace(/\/$/, "")), name]) : null;
          const isLink = child && child.type === "link";
          const isApp = child && child.type === "app";
          const appGlyph = isApp
            ? (child.app === "tools" ? <ToolsAppGlyph size={44} />
              : child.app === "books" ? <BooksAppGlyph size={44} />
              : child.app === "gd" ? <GDGlyph size={44} />
              : null)
            : null;
          return (
            <div
              key={name}
              className="file-icon"
              onDoubleClick={() => {
                if (isDir) onOpenDir([...path, name]);
                else onOpenFile(path, name);
              }}
            >
              <span className="glyph">
                {isDir ? <FolderGlyph size={44} />
                  : isApp ? appGlyph
                  : isLink ? <GithubGlyph size={44} />
                  : <FileGlyph size={44} />}
              </span>
              <span className="label">{stripped}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Terminal panel
// ============================================================
const TerminalPanel = React.forwardRef(function TerminalPanel({ onClose, onOpenApp, initialCwd = [] }, ref) {
  const [cwd, setCwd] = useState(initialCwd);
  const [history, setHistory] = useState(() => [
    { type: "boot", text: "RoomOS shell v0.3" },
    { type: "boot", text: "[ ok ] mounting fs" },
    { type: "boot", text: "[ ok ] loading projects/" },
    { type: "boot", text: "[ ok ] loading tools/" },
    { type: "boot", text: "[ ok ] loading books/" },
    { type: "dim",  text: "" },
    { type: "out",  text: "type `help` for commands. esc closes the desktop." },
    { type: "dim",  text: "" },
  ]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  React.useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [history]);

  const push = (...lines) => setHistory((h) => [...h, ...lines]);

  function runCommand(raw) {
    const line = raw.trim();
    push({ type: "cmd", text: `${pathToString(cwd)} $ ${raw}` });
    if (!line) return;
    const [cmd, ...args] = line.split(/\s+/);
    switch (cmd) {
      case "help": {
        push(
          { type: "out", text: "available commands:" },
          { type: "out", text: "  ls [path]      list directory contents" },
          { type: "out", text: "  cd <path>      change directory" },
          { type: "out", text: "  pwd            print working directory" },
          { type: "out", text: "  cat <file>     print a file" },
          { type: "out", text: "  tree           show full filesystem" },
          { type: "out", text: "  whoami         a little about me" },
          { type: "out", text: "  run <app>      open an application (books, tools)" },
          { type: "out", text: "  ping           ping the server and show response time" },
          { type: "out", text: "  clear          clear the screen" },
          { type: "out", text: "  exit           close the desktop" },
          { type: "dim", text: "" },
          { type: "out", text: "tip: try `cat about_me`." },
        );
        break;
      }
      case "ls": {
        const target = args[0] ? resolvePath(cwd, args[0]) : cwd;
        const node = getNode(target);
        if (!node) { push({ type: "err", text: `ls: ${args[0]}: no such file or directory` }); break; }
        if (node.type === "file") { push({ type: "out", text: args[0] || "file" }); break; }
        push({ type: "ls", items: listDir(node).map(n => ({ name: n, isDir: n.endsWith("/") })) });
        break;
      }
      case "cd": {
        if (!args[0] || args[0] === "~" || args[0] === "/") { setCwd([]); break; }
        const target = resolvePath(cwd, args[0]);
        const node = getNode(target);
        if (!node) { push({ type: "err", text: `cd: ${args[0]}: no such file or directory` }); break; }
        if (node.type !== "dir") { push({ type: "err", text: `cd: ${args[0]}: not a directory` }); break; }
        setCwd(target);
        break;
      }
      case "pwd": { push({ type: "out", text: pathToString(cwd) }); break; }
      case "cat": {
        if (!args[0]) { push({ type: "err", text: "cat: missing operand" }); break; }
        const target = resolvePath(cwd, args[0]);
        const node = getNode(target);
        if (!node) { push({ type: "err", text: `cat: ${args[0]}: no such file or directory` }); break; }
        if (node.type !== "file") { push({ type: "err", text: `cat: ${args[0]}: is a directory` }); break; }
        node.content.split("\n").forEach((l) => push({ type: "out", text: l || " " }));
        break;
      }
      case "tree": {
        push({ type: "out", text: "~" });
        const walk = (children, prefix) => {
          const keys = Object.keys(children);
          keys.forEach((k, i) => {
            const last = i === keys.length - 1;
            const branch = last ? "└── " : "├── ";
            const ext = last ? "    " : "│   ";
            const node = children[k];
            push({ type: "out", text: `${prefix}${branch}${k}`, isDir: node.type === "dir" });
            if (node.type === "dir") walk(node.children, prefix + ext);
          });
        };
        walk(FS, "");
        break;
      }
      case "whoami": { push({ type: "out", text: "saaket — CS @ NJIT / systems / books / occasional sleeper" }); break; }
      case "run": {
        const appName = args[0]?.toLowerCase();
        const appMap = { books: "books", tools: "tools" };
        if (!appName) {
          push({ type: "err", text: "run: missing argument. usage: run <app>" });
          push({ type: "dim", text: "available apps: books, tools" });
        } else if (appMap[appName]) {
          push({ type: "out", text: `launching ${appName}…` });
          onOpenApp(appMap[appName]);
        } else {
          push({ type: "err", text: `run: ${args[0]}: no such application` });
          push({ type: "dim", text: "available apps: books, tools" });
        }
        break;
      }
      case "ping": {
        push({ type: "dim", text: "pinging server…" });
        (async () => {
          const t0 = performance.now();
          try {
            const res = await fetch(`${API_BASE}/ping`, { signal: AbortSignal.timeout(5000) });
            const ms = (performance.now() - t0).toFixed(1);
            if (res.ok) push({ type: "out", text: `pong — ${ms} ms` });
            else push({ type: "err", text: `server returned ${res.status} (${ms} ms)` });
          } catch {
            const ms = (performance.now() - t0).toFixed(1);
            push({ type: "err", text: `request failed after ${ms} ms` });
          }
        })();
        break;
      }
      case "clear": { setHistory([]); break; }
      case "exit": case "quit": case "q": { onClose(); break; }
      case "sudo": { push({ type: "warn", text: "nice try." }); break; }
      default: { push({ type: "err", text: `${cmd}: command not found. try \`help\`.` }); }
    }
  }

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      runCommand(input);
      if (input.trim()) setCmdHistory((h) => [...h, input]);
      setInput(""); setHistIdx(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const next = histIdx < 0 ? cmdHistory.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(next); setInput(cmdHistory[next] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < 0) return;
      const next = histIdx + 1;
      if (next >= cmdHistory.length) { setHistIdx(-1); setInput(""); }
      else { setHistIdx(next); setInput(cmdHistory[next]); }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const parts = input.split(/\s+/);
      const last = parts[parts.length - 1];
      const node = getNode(cwd);
      if (node && node.type === "dir") {
        const matches = listDir(node).filter((n) => n.startsWith(last));
        if (matches.length === 1) {
          parts[parts.length - 1] = matches[0];
          setInput(parts.join(" "));
        }
      }
    }
  };

  return (
    <div className="term-window" onClick={() => inputRef.current?.focus()}>
      <div className="term-bar">
        <div className="title-icon"></div>
        <div className="title">Terminal — saaket@room</div>
        <button className="btn" onClick={() => setHistory([])}>_</button>
        <button className="btn" onClick={() => {}}>□</button>
        <button className="btn" onClick={onClose}>x</button>
      </div>
      <div className="term-body" ref={bodyRef}>
        {history.map((h, i) => {
          if (h.type === "ls") {
            return (
              <div className="term-line" key={i}>
                {h.items.map((it, j) => (
                  <span key={j} className={it.isDir ? "dir" : ""} style={{ marginRight: 18 }}>{it.name}</span>
                ))}
              </div>
            );
          }
          const cls =
            h.type === "cmd"  ? "term-line cmd"  :
            h.type === "err"  ? "term-line err"  :
            h.type === "warn" ? "term-line warn" :
            h.type === "boot" ? "term-line dim"  :
            h.type === "dim"  ? "term-line dim"  :
            "term-line";
          if (h.isDir) return <div className={cls} key={i}><span className="dir">{h.text}</span></div>;
          return <div className={cls} key={i}>{h.text || "\u00a0"}</div>;
        })}
        <div className="term-prompt">
          <span className="ps">{pathToString(cwd)} $</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
        </div>
      </div>
    </div>
  );
});

// ============================================================
// AppWindow — generic retro app window (drag + resize)
// ============================================================
function AppWindow({ title, icon, children, onClose, onFocus, offsetIndex = 0, zIndex = 200, initialSize = { width: 580, height: 540 } }) {
  const initLeft = typeof window !== 'undefined' ? Math.max(40, Math.round(window.innerWidth / 2 - initialSize.width / 2)) : 200;
  const [pos, onHeaderMouseDown] = useDraggable({ top: 40 + offsetIndex * 28, left: initLeft + offsetIndex * 28 });
  const [size, setSize] = useState(initialSize);
  const startResize = (e) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, sw = size.width, sh = size.height;
    const mv = (ev) => setSize({ width: Math.max(360, sw + (ev.clientX - sx)), height: Math.max(280, sh + (ev.clientY - sy)) });
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  };
  return (
    <div
      className="app-window"
      onMouseDown={onFocus}
      style={{ position: "absolute", top: pos.top, left: pos.left, width: size.width, height: size.height, zIndex }}
    >
      <div className="app-titlebar" onMouseDown={onHeaderMouseDown}>
        <span className="app-titlebar-icon">{icon}</span>
        <span className="app-titlebar-name">{title}</span>
        <button className="app-titlebar-x" onClick={onClose}>✕</button>
      </div>
      <div className="app-body">{children}</div>
      <div className="app-footer">
        <span>{title.toLowerCase()} · v0.1</span>
        <span onMouseDown={startResize} title="Drag to resize" className="app-resize-grip"></span>
      </div>
    </div>
  );
}

// ============================================================
// useServerStatus — pings /health, polls every 30s
// ============================================================
function useServerStatus() {
  const [status, setStatus] = useState("checking"); // checking | online | offline
  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
        if (!cancelled) setStatus(res.ok ? "online" : "offline");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    };
    ping();
    const id = setInterval(ping, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  return status;
}

function ServerBadge({ status }) {
  const label = status === "checking" ? "checking…" : status === "online" ? "server online" : "server offline";
  return <div className={`server-badge ${status}`}>● {label}</div>;
}

// ============================================================
// ToolsApp — interactive interface for backend tools
// ============================================================
function ToolsApp(props) {
  const status = useServerStatus();
  const offline = status === "offline";
  return (
    <AppWindow title="Tools" icon={<ToolsAppGlyph size={20} />} {...props} initialSize={{ width: 620, height: 600 }}>
      <ServerBadge status={status} />
      {offline
        ? <div className="tool-offline">Server is offline — these tools need the backend running.</div>
        : (
          <>
            <HeicTool />
            <YtTool />
            <GdsTool />
            <ClipboardTool />
          </>
        )}
    </AppWindow>
  );
}

function HeicTool() {
  const [files, setFiles] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (!files.length) return;
    setStatusMsg("Converting…");
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    try {
      const res = await fetch(`${API_BASE}/heic/convert`, { method: "POST", body: fd });
      if (!res.ok) { const err = await res.json(); setStatusMsg(`Error: ${err.detail}`); return; }
      const blob = await res.blob();
      const isZip = files.length > 1;
      const name = isZip ? "converted.zip" : `${files[0].name.replace(/\.heic$/i, "")}.jpg`;
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
      setStatusMsg(`Done — ${files.length} file(s) converted.`);
    } catch { setStatusMsg("Request failed — is the server still running?"); }
  };
  return (
    <section className="tool-section">
      <h4>HEIC → JPEG</h4>
      <form onSubmit={submit}>
        <label className="file-input-label">
          <input type="file" accept=".heic,.HEIC,.heif,.HEIF" multiple onChange={(e) => setFiles([...e.target.files])} />
          <span>{files.length === 0 ? "Choose HEIC file(s)…" : files.length === 1 ? files[0].name : `${files.length} files selected`}</span>
        </label>
        <button type="submit" className="tool-btn">Convert to JPEG</button>
      </form>
      {statusMsg && <div className="tool-status">{statusMsg}</div>}
    </section>
  );
}

function YtTool() {
  const [url, setUrl] = useState("");
  const [fmt, setFmt] = useState("mp3");
  const [statusMsg, setStatusMsg] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setStatusMsg("Downloading…");
    try {
      const res = await fetch(`${API_BASE}/yt/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), format: fmt }),
      });
      if (!res.ok) { const err = await res.json(); setStatusMsg(`Error: ${err.detail}`); return; }
      const blob = await res.blob();
      const name = res.headers.get("content-disposition")?.match(/filename="?([^"]+)"?/)?.[1] ?? `download.${fmt}`;
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
      setStatusMsg("Done!");
    } catch { setStatusMsg("Request failed — is the server still running?"); }
  };
  return (
    <section className="tool-section">
      <h4>YouTube → MP3 / MP4</h4>
      <form onSubmit={submit}>
        <input type="url" placeholder="https://youtube.com/watch?v=…" value={url} onChange={(e) => setUrl(e.target.value)} required />
        <div className="tool-radio">
          <label><input type="radio" name="ytfmt" value="mp3" checked={fmt === "mp3"} onChange={() => setFmt("mp3")} /> MP3</label>
          <label><input type="radio" name="ytfmt" value="mp4" checked={fmt === "mp4"} onChange={() => setFmt("mp4")} /> MP4</label>
        </div>
        <button type="submit" className="tool-btn">Download</button>
      </form>
      {statusMsg && <div className="tool-status">{statusMsg}</div>}
    </section>
  );
}

function GdsTool() {
  const [date, setDate] = useState("today");
  const [meal, setMeal] = useState("lunch");
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setStatusMsg("Fetching menu…"); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/gds/menu?date=${date}&meal=${meal}`);
      const data = await res.json();
      if (!res.ok) { setStatusMsg(`Error: ${data.detail}`); return; }
      if (!data.menu?.length) { setStatusMsg("No menu items found for that meal."); return; }
      setStatusMsg(""); setResult(data.menu);
    } catch { setStatusMsg("Request failed — is the server still running?"); }
  };
  return (
    <section className="tool-section">
      <h4>GDS Menu Scraper</h4>
      <form onSubmit={submit}>
        <div className="tool-radio">
          <label><input type="radio" name="gdsdate" value="today" checked={date === "today"} onChange={() => setDate("today")} /> Today</label>
          <label><input type="radio" name="gdsdate" value="tomorrow" checked={date === "tomorrow"} onChange={() => setDate("tomorrow")} /> Tomorrow</label>
        </div>
        <select value={meal} onChange={(e) => setMeal(e.target.value)}>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
        <button type="submit" className="tool-btn">Get Menu</button>
      </form>
      {statusMsg && <div className="tool-status">{statusMsg}</div>}
      {result && (
        <div className="gds-result">
          {result.map((cat) => (
            <div key={cat.category} className="gds-station">
              <h5>{cat.category}</h5>
              <ul>{cat.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ClipboardTool() {
  const [statusMsg, setStatusMsg] = useState("Press Cmd+V / Ctrl+V to paste an image");
  const [preview, setPreview] = useState(null);
  const onPaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    let img = null;
    for (const it of items) if (it.type.startsWith("image/")) { img = it; break; }
    if (!img) { setStatusMsg("No image found in clipboard — copy an image first."); return; }
    const blob = img.getAsFile();
    setPreview(URL.createObjectURL(blob));
    setStatusMsg("Uploading…");
    const fd = new FormData();
    fd.append("file", blob, `clipboard.${img.type.split("/")[1]}`);
    try {
      const res = await fetch(`${API_BASE}/clipboard/upload`, { method: "POST", body: fd });
      if (!res.ok) { const err = await res.json(); setStatusMsg(`Error: ${err.detail}`); return; }
      const dl = await res.blob();
      const name = res.headers.get("content-disposition")?.match(/filename="?([^"]+)"?/)?.[1] ?? "clipboard.png";
      const a = document.createElement("a"); a.href = URL.createObjectURL(dl); a.download = name; a.click();
      setStatusMsg(`Downloaded as ${name}`);
    } catch { setStatusMsg("Request failed — is the server running?"); }
  };
  return (
    <section className="tool-section">
      <h4>Clipboard → Download</h4>
      <div className="clipboard-pastearea" tabIndex={0} onPaste={onPaste}>
        {preview ? <img src={preview} alt="paste preview" /> : <span>click here, then paste</span>}
      </div>
      <div className="tool-status">{statusMsg}</div>
    </section>
  );
}

// ============================================================
// GDApp / GDGame — mini Geometry Dash (Jumping Cube): Level 1 "Stereo Madness"
// ============================================================

// Hand-authored layout for Stereo Madness (level 1). World-x in pixels.
// type: "spike" (ground hazard) | "block" (h-tall, jump over OR land on top).
const SM_LEVEL = [
  { x: 640,  t: "spike" },
  { x: 1000, t: "spike" },
  { x: 1360, t: "spike" },
  { x: 1402, t: "spike" },                 // double
  { x: 1840, t: "block", h: 40 },
  { x: 2220, t: "spike" },
  { x: 2580, t: "block", h: 40 },
  { x: 2608, t: "block", h: 40 },          // wide platform
  { x: 3020, t: "spike" },
  { x: 3380, t: "spike" },
  { x: 3422, t: "spike" },
  { x: 3464, t: "spike" },                 // triple
  { x: 3920, t: "block", h: 40 },
  { x: 4300, t: "spike" },
  { x: 4660, t: "spike" },
  { x: 4702, t: "spike" },                 // double
  { x: 5120, t: "block", h: 40 },
  { x: 5148, t: "block", h: 40 },          // wide platform
  { x: 5560, t: "spike" },
  { x: 5920, t: "spike" },
  { x: 5962, t: "spike" },
  { x: 6004, t: "spike" },                 // triple finish
];
const SM_END = 6700;          // world-x at which the level is cleared
const BW = 28;                // block width (px)

// Stereo-Madness-flavored chiptune: 32-step loop at 16th-note resolution.
// Values are MIDI note numbers (0 = rest). i-VI-III-VII feel in A minor.
const SM_LEAD = [
  69,0,76,0, 72,0,76,0, 69,0,74,0, 72,0,67,0,
  69,0,77,0, 72,0,77,0, 71,0,74,0, 72,0,79,0,
];
const SM_BASS = [
  45,0,0,0, 45,0,0,45, 41,0,0,0, 41,0,0,41,
  48,0,0,0, 48,0,0,48, 43,0,0,0, 43,0,0,43,
];

function GDApp(props) {
  return (
    <AppWindow title="Jumping Cube — Level 1" icon={<GDGlyph size={20} />} {...props}
      initialSize={{ width: 600, height: 368 }}>
      <GDGame />
    </AppWindow>
  );
}

function GDGame() {
  const canvasRef = React.useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const GROUND_Y = H - 52;
    const CUBE = 36;
    const GRAVITY = 0.56;
    const JUMP_V = -11.5;
    const SPEED = 5;          // constant scroll speed for deterministic level timing
    const PX = 80;            // player's fixed screen-x

    // ── audio: Web Audio chiptune synth ───────────────────────
    let audioCtx = null, master = null, schedId = null, step = 0, nextNote = 0;
    const STEP_DUR = 60 / 150 / 4;   // 16th note @ 150 BPM
    const mfreq = (n) => 440 * Math.pow(2, (n - 69) / 12);
    const tone = (n, t, type, dur, g) => {
      const o = audioCtx.createOscillator(), gn = audioCtx.createGain();
      o.type = type; o.frequency.setValueAtTime(mfreq(n), t);
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(g, t + 0.006);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn); gn.connect(master); o.start(t); o.stop(t + dur + 0.02);
    };
    const kick = (t) => {
      const o = audioCtx.createOscillator(), gn = audioCtx.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      gn.gain.setValueAtTime(0.5, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(gn); gn.connect(master); o.start(t); o.stop(t + 0.18);
    };
    const scheduler = () => {
      while (nextNote < audioCtx.currentTime + 0.12) {
        const s = step % 32;
        if (SM_LEAD[s]) tone(SM_LEAD[s], nextNote, "square", 0.16, 0.06);
        if (SM_BASS[s]) tone(SM_BASS[s], nextNote, "sawtooth", 0.20, 0.09);
        if (s % 4 === 0) kick(nextNote);
        nextNote += STEP_DUR; step++;
      }
    };
    const startMusic = () => {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AC();
        master = audioCtx.createGain(); master.gain.value = 0.22; master.connect(audioCtx.destination);
      }
      audioCtx.resume();
      step = 0; nextNote = audioCtx.currentTime + 0.06;
      if (schedId) clearInterval(schedId);
      schedId = setInterval(scheduler, 25);
    };
    const stopMusic = () => { if (schedId) { clearInterval(schedId); schedId = null; } };

    // ── game state ────────────────────────────────────────────
    const mkState = () => ({
      phase: "start",                       // start | play | dead | win
      worldX: 0,
      bgX: 0, tileX: 0,
      p: { y: GROUND_Y - CUBE, vy: 0, grounded: true, rot: 0 },
    });
    let S = mkState();

    const tryJump = () => {
      if (S.phase === "dead" || S.phase === "win") { S = mkState(); S.phase = "play"; startMusic(); return; }
      if (S.phase === "start") { S.phase = "play"; startMusic(); }
      if (S.p.grounded) { S.p.vy = JUMP_V; S.p.grounded = false; }
    };
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); tryJump(); }
    };
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("click", tryJump);

    // obstacle screen-x helper
    const sx = (o) => o.x - S.worldX;

    let raf;
    const loop = () => {
      // ── update ──
      if (S.phase === "play") {
        S.worldX += SPEED;
        S.bgX = (S.bgX - SPEED * 0.15 + 80) % 80;
        S.tileX = (S.tileX - SPEED + W + 40) % 40;

        const prevBottom = S.p.y + CUBE;
        S.p.vy += GRAVITY;
        S.p.y += S.p.vy;
        S.p.grounded = false;

        // ground
        if (S.p.y >= GROUND_Y - CUBE) {
          S.p.y = GROUND_Y - CUBE; S.p.vy = 0; S.p.grounded = true;
        }

        // player collision box (with a little forgiveness)
        const px = PX + 5, pw = CUBE - 10;
        for (const o of SM_LEVEL) {
          const ox = sx(o);
          if (ox > W + 40 || ox < -60) continue;
          if (o.t === "spike") {
            const hx = ox + 8, hy = GROUND_Y - 34, hw = 22, hh = 34;
            if (px < hx + hw && px + pw > hx && S.p.y + 5 < hy + hh && S.p.y + CUBE - 5 > hy)
              S.phase = "dead";
          } else {
            const top = GROUND_Y - o.h;
            const horiz = px < ox + BW && px + pw > ox;
            if (!horiz) continue;
            if (S.p.vy >= 0 && prevBottom <= top + 2 && S.p.y + CUBE >= top) {
              // land on top of block
              S.p.y = top - CUBE; S.p.vy = 0; S.p.grounded = true;
            } else if (S.p.y + 5 < top + o.h && S.p.y + CUBE - 5 > top) {
              // ran into the side -> crash
              S.phase = "dead";
            }
          }
        }

        // rotation: spin while airborne, snap on landing
        if (S.p.grounded) S.p.rot = Math.round(S.p.rot / 90) * 90;
        else S.p.rot += 6;

        if (S.phase === "dead") stopMusic();
        if (S.worldX > SM_END) { S.phase = "win"; stopMusic(); }
      }

      // ── draw ──
      ctx.fillStyle = "#16213e"; ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "#1a2a52"; ctx.lineWidth = 1;
      for (let x = S.bgX; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      ctx.fillStyle = "#0f3460"; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.fillStyle = "#e94560"; ctx.fillRect(0, GROUND_Y, W, 3);
      ctx.strokeStyle = "#1a4a7a"; ctx.lineWidth = 1;
      for (let x = S.tileX; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, GROUND_Y + 3); ctx.lineTo(x, H); ctx.stroke(); }

      for (const o of SM_LEVEL) {
        const ox = sx(o);
        if (ox < -60 || ox > W + 40) continue;
        if (o.t === "spike") {
          ctx.fillStyle = "#e94560";
          ctx.beginPath(); ctx.moveTo(ox,GROUND_Y); ctx.lineTo(ox+19,GROUND_Y-40); ctx.lineTo(ox+38,GROUND_Y); ctx.closePath(); ctx.fill();
          ctx.fillStyle = "#ff6b81";
          ctx.beginPath(); ctx.moveTo(ox+9,GROUND_Y-5); ctx.lineTo(ox+19,GROUND_Y-34); ctx.lineTo(ox+29,GROUND_Y-5); ctx.closePath(); ctx.fill();
        } else {
          ctx.fillStyle = "#533483"; ctx.fillRect(ox, GROUND_Y - o.h, BW, o.h);
          ctx.fillStyle = "#7b5ea7"; ctx.fillRect(ox, GROUND_Y - o.h, BW, 5);
          ctx.fillStyle = "#6a42a8"; ctx.fillRect(ox, GROUND_Y - o.h, 4, o.h);
        }
      }

      const cx = PX + CUBE/2, cy = S.p.y + CUBE/2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(S.p.rot * Math.PI / 180);
      ctx.fillStyle = "#ffd700"; ctx.fillRect(-CUBE/2, -CUBE/2, CUBE, CUBE);
      ctx.fillStyle = "#cc9900"; ctx.fillRect(-CUBE/2+8, -CUBE/2+8, CUBE-16, CUBE-16);
      ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 2; ctx.strokeRect(-CUBE/2, -CUBE/2, CUBE, CUBE);
      ctx.strokeStyle = "#ffe566"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-CUBE/2+4, -CUBE/2+4); ctx.lineTo(CUBE/2-4, CUBE/2-4); ctx.stroke();
      ctx.restore();

      // progress bar (level completion)
      const pct = Math.max(0, Math.min(1, S.worldX / SM_END));
      ctx.fillStyle = "#0b1430"; ctx.fillRect(W/2 - 110, 12, 220, 12);
      ctx.fillStyle = "#5cf08a"; ctx.fillRect(W/2 - 110, 12, 220 * pct, 12);
      ctx.strokeStyle = "#cdd6e0"; ctx.lineWidth = 1; ctx.strokeRect(W/2 - 110, 12, 220, 12);
      ctx.fillStyle = "#ffffff"; ctx.font = "13px 'VT323', monospace"; ctx.textAlign = "center";
      ctx.fillText(`${Math.floor(pct * 100)}%`, W/2, 33);
      ctx.textAlign = "left";

      if (S.phase === "start") {
        ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffd700"; ctx.font = "30px 'VT323', monospace"; ctx.textAlign = "center";
        ctx.fillText("Gyro Challenge", W/2, H/2 - 26);
        ctx.fillStyle = "#9fd6ff"; ctx.font = "16px 'VT323', monospace";
        ctx.fillText("Level 1", W/2, H/2 - 2);
        ctx.fillStyle = "#cccccc"; ctx.font = "18px 'VT323', monospace";
        ctx.fillText("click or SPACE to play", W/2, H/2 + 26);
        ctx.textAlign = "left";
      }

      if (S.phase === "dead") {
        ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#e94560"; ctx.font = "34px 'VT323', monospace"; ctx.textAlign = "center";
        ctx.fillText("CRASHED", W/2, H/2 - 22);
        ctx.fillStyle = "#ffd700"; ctx.font = "20px 'VT323', monospace";
        ctx.fillText(`${Math.floor(pct * 100)}%`, W/2, H/2 + 8);
        ctx.fillStyle = "#cccccc"; ctx.font = "16px 'VT323', monospace";
        ctx.fillText("click or SPACE to retry", W/2, H/2 + 34);
        ctx.textAlign = "left";
      }

      if (S.phase === "win") {
        ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#5cf08a"; ctx.font = "30px 'VT323', monospace"; ctx.textAlign = "center";
        ctx.fillText("LEVEL COMPLETE!", W/2, H/2 - 18);
        ctx.fillStyle = "#ffd700"; ctx.font = "18px 'VT323', monospace";
        ctx.fillText("Stereo Madness — 100%", W/2, H/2 + 10);
        ctx.fillStyle = "#cccccc"; ctx.font = "16px 'VT323', monospace";
        ctx.fillText("click or SPACE to replay", W/2, H/2 + 36);
        ctx.textAlign = "left";
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      stopMusic();
      if (audioCtx) audioCtx.close();
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("click", tryJump);
    };
  }, []);

  return (
    <canvas ref={canvasRef} width={560} height={280}
      style={{ display: "block", width: "100%", cursor: "pointer", imageRendering: "pixelated" }} />
  );
}

// ============================================================
// BooksApp — currently reading / finished / recommend / AI recommender
// ============================================================
function BooksApp(props) {
  const status = useServerStatus();
  const [tab, setTab] = useState("reading");
  const [books, setBooks] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status !== "online") return;
    const load = async () => {
      try {
        const [bRes, rRes] = await Promise.all([
          fetch(`${API_BASE}/books`),
          fetch(`${API_BASE}/books/recommendations`),
        ]);
        if (bRes.ok) setBooks(await bRes.json());
        if (rRes.ok) setRecs(await rRes.json());
      } catch { /* no-op */ }
      setLoaded(true);
    };
    load();
  }, [status]);

  const refreshRecs = async () => {
    try { const r = await fetch(`${API_BASE}/books/recommendations`); if (r.ok) setRecs(await r.json()); }
    catch {}
  };

  return (
    <AppWindow title="Books" icon={<BooksAppGlyph size={20} />} {...props} initialSize={{ width: 620, height: 600 }}>
      <ServerBadge status={status} />
      <div className="book-tabs">
        <button className={tab === "reading" ? "active" : ""} onClick={() => setTab("reading")}>Currently Reading</button>
        <button className={tab === "finished" ? "active" : ""} onClick={() => setTab("finished")}>Finished</button>
        <button className={tab === "recommend" ? "active" : ""} onClick={() => setTab("recommend")}>Recommend a Book</button>
        <button className={tab === "ai" ? "active" : ""} onClick={() => setTab("ai")}>AI Recommender</button>
      </div>
      <div className="book-tab-body">
        {status === "offline"
          ? <div className="tool-offline">Server is offline — book data needs the backend running.</div>
          : !loaded
            ? <div className="tool-status">Loading…</div>
            : tab === "reading" ? <BookList books={books.filter((b) => b.status === "reading")} />
            : tab === "finished" ? <BookList books={books.filter((b) => b.status === "finished")} showRatings />
            : tab === "recommend" ? <RecommendForm books={books} recs={recs} onSubmitted={refreshRecs} />
            : <AiRecommender />
        }
      </div>
    </AppWindow>
  );
}

function BookList({ books, showRatings }) {
  if (!books.length) return <div className="tool-status">(no books)</div>;
  const casual = books.filter((b) => b.type === "casual");
  const formal = books.filter((b) => b.type === "formal");
  return (
    <div>
      <div className="book-section">
        <h5>Casual</h5>
        {casual.length === 0 ? <p className="book-empty">(none)</p> : casual.map((b) => (
          <div key={b.id} className="book-row">
            <div className="book-row-title">{b.title}</div>
            <div className="book-row-author">{b.author}</div>
            {showRatings && b.rating != null && <div className="book-row-rating">{"★".repeat(b.rating)}{"☆".repeat(5 - b.rating)}</div>}
            {b.thoughts && <div className="book-row-thoughts">"{b.thoughts}"</div>}
          </div>
        ))}
      </div>
      <div className="book-section">
        <h5>Formal</h5>
        {formal.length === 0 ? <p className="book-empty">(none)</p> : formal.map((b) => (
          <div key={b.id} className="book-row">
            <div className="book-row-title">{b.title}</div>
            <div className="book-row-author">{b.author}</div>
            {showRatings && b.rating != null && <div className="book-row-rating">{"★".repeat(b.rating)}{"☆".repeat(5 - b.rating)}</div>}
            {b.thoughts && <div className="book-row-thoughts">"{b.thoughts}"</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendForm({ books, recs, onSubmitted }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [type, setType] = useState("casual");
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState(null);

  const known = useMemo(() => {
    const set = new Set();
    books.forEach((b) => set.add(b.title.toLowerCase()));
    recs.forEach((r) => set.add(r.book.title.toLowerCase()));
    return set;
  }, [books, recs]);

  const submit = async (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    if (known.has(t.toLowerCase())) {
      setFeedback({ kind: "warn", msg: `"${t}" is already on the list — thanks though!` });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/books/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, author: author.trim() || null, type, note: note.trim() || null }),
      });
      if (!res.ok) { setFeedback({ kind: "err", msg: "Something went wrong — try again later." }); return; }
      setFeedback({ kind: "ok", msg: `Thanks for recommending "${t}"!` });
      setTitle(""); setAuthor(""); setNote(""); setType("casual");
      onSubmitted?.();
    } catch { setFeedback({ kind: "err", msg: "Request failed — is the server running?" }); }
  };

  return (
    <div>
      <p className="book-intro">Think I'd enjoy something? Drop it below.</p>
      <form onSubmit={submit} className="book-form">
        <input type="text" placeholder="Book title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input type="text" placeholder="Author (optional)" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="casual">Casual read</option>
          <option value="formal">Formal / textbook</option>
        </select>
        <textarea placeholder="Why should I read this? (optional)" rows="3" value={note} onChange={(e) => setNote(e.target.value)} />
        <button type="submit" className="tool-btn">Send Recommendation</button>
      </form>
      {feedback && <div className={`tool-status ${feedback.kind}`}>{feedback.msg}</div>}
      {recs.length > 0 && (
        <div className="book-section" style={{ marginTop: 16 }}>
          <h5>Recommendations from visitors ({recs.length})</h5>
          {recs.map((r) => (
            <div key={r.id} className="book-row">
              <div className="book-row-title">{r.book.title}</div>
              {r.book.author && r.book.author !== "Unknown" && <div className="book-row-author">{r.book.author}</div>}
              {r.comment && <div className="book-row-thoughts">"{r.comment}"</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AiRecommender() {
  const [query, setQuery] = useState("");
  const [topN, setTopN] = useState(5);
  const [statusMsg, setStatusMsg] = useState(null);
  const [results, setResults] = useState([]);

  const submit = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setStatusMsg("Thinking… (keywords → OpenLibrary → Vamana → rerank)"); setResults([]);
    try {
      const res = await fetch(`${API_BASE}/books/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, top_n: topN }),
      });
      if (!res.ok) {
        const err = await res.json();
        setStatusMsg(`Error: ${err.detail}`);
        return;
      }
      const data = await res.json();
      if (!data.length) { setStatusMsg("No recommendations found."); return; }
      setStatusMsg(null); setResults(data);
    } catch { setStatusMsg("Request failed — is the server running?"); }
  };

  return (
    <div>
      <p className="book-intro">Describe what you're in the mood for and let the recommender find something for you.</p>
      <form onSubmit={submit} className="book-form">
        <textarea
          placeholder='e.g. "a dense math book that reads like a story" or "stoic philosophy"'
          rows="3"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <div className="ai-controls">
          <label>Results: <input type="number" min="1" max="20" value={topN} onChange={(e) => setTopN(Math.max(1, Math.min(20, +e.target.value || 5)))} /></label>
          <button type="submit" className="tool-btn">Recommend</button>
        </div>
      </form>
      {statusMsg && <div className="tool-status">{statusMsg}</div>}
      {results.length > 0 && (
        <div className="book-section" style={{ marginTop: 16 }}>
          <h5>Top {results.length} matches</h5>
          {results.map((b, i) => (
            <div key={i} className="book-row">
              <div className="book-row-title">{b.title}</div>
              {b.author_name?.length > 0 && <div className="book-row-author">{b.author_name.join(", ")}</div>}
              {b.subject?.length > 0 && <div className="book-row-subject">{b.subject.slice(0, 4).join(" · ")}</div>}
              {b.key && <a className="book-row-link" href={`https://openlibrary.org${b.key}`} target="_blank" rel="noopener noreferrer">openlibrary →</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.Terminal = Desktop;
