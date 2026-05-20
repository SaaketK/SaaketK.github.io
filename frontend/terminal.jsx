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
`hi — i'm saaket.

CS major at NJIT.
double minor in computer engineering &
computational mathematics.

interests:
  - computer architecture
  - systems programming
  - high-performance computing
  - quantum computing
  - optimization algorithms

[TODO: add more about myself — current work,
past experience, hobbies outside CS]

reach me:
  github   ->  github.com/SaaketK
  linkedin ->  linkedin.com/in/saaket-kulkarni
  email    ->  [TODO]`
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
`# book recommender

a personalized book recommendation engine.
in progress — backend running on my desktop.

stack:
  python (FastAPI)
  postgresql
  ollama (mistral 7B)
  sentence-transformers
  c++ vamana index (summer 2026)

pipeline:
  user input
    -> ollama (keyword extraction)
  openlibrary api
    -> ~200 candidates
  embedding similarity
    -> top 20
  ollama (final ranking)
    -> top 3 with reasoning

systems work (in progress):
  custom vamana ann graph in c++
  pybind11 bridge to python
  AVX2 SIMD distance kernels (stretch goal)

repo: not yet public — will live at
github.com/SaaketK/book-recommender
when the python pipeline is shippable.`
          },
          "pipeline.txt": {
            type: "file",
            content:
`# pipeline status

[done] keywords.py     — LLM keyword extraction
[done] openlibrary.py  — API search (200 candidates)
[done] embeddings.py   — cosine similarity, top 20
[wip ] ranker.py       — LLM picks top 3
[wip ] pipeline.py     — wire everything together
[todo] FastAPI route   — expose to frontend
[todo] vamana C++      — summer 2026
[todo] SIMD kernels    — stretch`
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

a security wrapper around \`pip install\` that
defends against typosquatting attacks on PyPI.

what it does:
  - validates package names against the top
    1,000 PyPI packages using levenshtein
    distance — common typos get flagged before
    you install them
  - displays PyPI metadata (summary, author,
    creation date, last update)
  - pulls GitHub repo stats (stars, forks,
    open issues) when a package links one

architecture:
  - python CLI entry point + vetting logic
  - C extension for levenshtein distance
    (loaded via ctypes, cross-platform)
  - auto-generated popular package constants
    refreshable via \`safepip-constupdate\`
  - graceful fallback: if the C extension
    fails to load, metadata still works,
    typo detection just skips

install:
  git clone https://github.com/SaaketK/Safepip.git
  cd safepip
  pip install -e .

usage:
  safepip <package>
  safepip gunicor          # asks "did you mean gunicorn?"
  safepip requests==2.31.0 # versions supported

repo: github.com/SaaketK/Safepip
double-click \`github\` to open it.`
          },
          "github": {
            type: "link",
            url: "https://github.com/SaaketK/Safepip"
          }
        }
      },
      "GDS webscraper/": {
        type: "dir",
        children: {
          "about": {
            type: "file",
            content:
`# python-gds-webscraper

a python utility for retrieving NJIT
highlander commons dining hall menus.
also powers the GDS menu tool in the
\`tools/\` folder.

features:
  - date flexibility: today, tomorrow, or
    a specific YYYY-MM-DD
  - station targeting: focuses on the daily
    plate (all meals) and carved & crafted
    (lunch + dinner)
  - automatic period_id resolution per meal

how it works:
  1. hits the /periods endpoint for the date
     to find the unique ID for the meal
  2. uses the period_id + LOCATION_ID + date
     to pull the full menu JSON, then parses
     the requested categories

inputs:
  date  -> today | tomorrow | YYYY-MM-DD
  meal  -> breakfast | lunch | dinner

stack:
  python + cloudscraper (cloudflare-aware
  HTTP wrapper around requests)

repo: github.com/SaaketK/Python-GDS-Webscraper
double-click \`github\` to open it.`
          },
          "github": {
            type: "link",
            url: "https://github.com/SaaketK/Python-GDS-Webscraper"
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

[TODO: fill in description — couldn't find
this on the public github profile. add the
real readme content here once you point me
at the repo, or paste the description below.]

what it does:
  [TODO]

stack:
  [TODO]

what i learned / what was hard:
  [TODO]

repo: [TODO: paste url, then i'll wire
the github link]`
          },
          "github": {
            type: "link",
            url: "https://github.com/SaaketK"
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

self-study work through MIT's operating
systems course (6.1810, fall 2024 materials).
xv6 is a small unix-like teaching kernel
written in C, derived from version 6 unix
and ported to RISC-V.

[TODO: fill in which labs you've completed
and any notable details. some examples
to draw from:]

  lab utilities    — ls/find/xargs in xv6
  lab syscall      — adding system calls
  lab pgtbl        — page table manipulation
  lab traps        — backtraces & alarms
  lab cow          — copy-on-write fork
  lab thread       — user-level threads
  lab net          — network stack driver
  lab lock         — fine-grained locking
  lab fs           — large files + symlinks
  lab mmap         — memory-mapped files

what i'm getting out of it:
  [TODO: write a few honest lines on what
  you're learning — kernel boot path,
  trap handling, page tables, fs internals,
  whatever's clicking for you]

repo: private. ask me directly if you want
to see the work.`
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

batch convert apple HEIC photos to JPEG with
full color profile accuracy.

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
  filters to "the daily plate" and
  "carved & crafted" stations.

endpoint:
  GET /gds/menu?date=today&meal=lunch`
      },
      "clipboard.txt": {
        type: "file",
        content:
`# clipboard -> download

paste an image from your clipboard, get a
proper file download with a timestamped name.

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

open to recommendations outside these too —
recommend something via the recommend.md file.`
      },
      "currently_reading.md": {
        type: "file",
        content:
`# currently reading

casual:
  - the denial of death — ernest becker (pg 56) *
  - inferno — dante alighieri

formal:
  - PDEs: an introduction — walter a. strauss

(* = current standout)`
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

formal (selected chapters):
  - the information — james gleick
  - computer architecture: a quantitative
    approach — hennessy & patterson

[TODO: add ratings + quick thoughts for each]`
      },
      "recommend.md": {
        type: "file",
        content:
`# recommend a book

think i'd enjoy something? send it my way.

i'm into math, physics, engineering, philosophy,
and psychology — but i'm open to anything good.

[TODO: wire this up to the recommender backend
once it's deployed — for now, drop me an email
or DM on linkedin]`
      }
    }
  },
  "top_secret/": {
    type: "dir",
    children: {
      "???.txt": {
        type: "file",
        content:
`[TODO: fill in]

what goes here is up to you. some ideas:
  - personal essays / writing
  - blog drafts
  - long-form thoughts on a topic
  - projects you don't want to advertise
  - whatever feels right`
      }
    }
  },
  "README.txt": {
    type: "file",
    content:
`welcome to my room.

this is my personal site, rendered as the
desk i actually work at.

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
          background: "#d4b840", padding: "4px 8px",
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
        padding: "16px 22px", whiteSpace: "pre-wrap", fontSize: 19,
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
function Desktop({ onClose }) {
  const [openFolder, setOpenFolder] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [viewers, setViewers] = useState([]); // [{ id, name, content }]
  const [windowOrder, setWindowOrder] = useState([]); // stacking: 'folder' or viewer id, last = top
  const viewerIdRef = useRef(0);
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
    { name: "about_me",    kind: "file", glyph: <MeGlyph /> },
    { name: "projects/",   kind: "dir",  glyph: <FolderGlyph /> },
    { name: "tools/",      kind: "dir",  glyph: <FolderGlyph /> },
    { name: "books/",      kind: "dir",  glyph: <FolderGlyph /> },
    { name: "top_secret/", kind: "dir",  glyph: <FolderGlyph /> },
    { name: "README.txt",  kind: "file", glyph: <FileGlyph /> },
    { name: "Terminal",    kind: "app",  glyph: <TerminalGlyph /> },
  ];

  // FIXED: files open FileViewer, never feed terminal
  const openIcon = (icon) => {
    if (icon.kind === "dir") {
      setOpenFolder([icon.name]);
      setWindowOrder((o) => [...o.filter((x) => x !== 'folder'), 'folder']);
    } else if (icon.kind === "file") {
      const node = getNode([icon.name]);
      if (!node) return;
      if (node.type === "link") window.open(node.url, "_blank", "noopener,noreferrer");
      else openViewer(icon.name, node.content);
    } else if (icon.kind === "app") {
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

        <TerminalPanel ref={termRef} onClose={onClose} />
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

      {openFolder && (
        <FileWindow
          path={openFolder}
          zIndex={200 + windowOrder.indexOf('folder')}
          onFocus={() => focusWindow('folder')}
          onClose={() => { setOpenFolder(null); setWindowOrder((o) => o.filter((x) => x !== 'folder')); }}
          onOpenFile={(p, name) => {
            // FIXED: open FileViewer, not terminal cat command
            const node = getNode([...p.map(s => s.replace(/\/$/, "")), name]);
            if (!node) return;
            if (node.type === "link") window.open(node.url, "_blank", "noopener,noreferrer");
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
  const [size, setSize] = useState({ width: 460, height: 300 });
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
          return (
            <div
              key={name}
              className="file-icon"
              onDoubleClick={() => {
                if (isDir) onOpenDir([...path, name]);
                else onOpenFile(path, name);
              }}
            >
              <span className="glyph">{isDir ? <FolderGlyph size={44} /> : isLink ? <GithubGlyph size={44} /> : <FileGlyph size={44} />}</span>
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
const TerminalPanel = React.forwardRef(function TerminalPanel({ onClose }, ref) {
  const [cwd, setCwd] = useState([]);
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
      </div>
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
  );
});

window.Terminal = Desktop;