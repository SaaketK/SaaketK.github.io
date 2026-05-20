// ============================================================
// BOOK DATA
// When your server is ready, replace the BookStore methods
// with fetch() calls to your API endpoints.
// ============================================================

const BOOKS = {
  currentlyReading: {
    casual: [
      { title: "The Denial of Death", author: "Ernest Becker"},
      { title: "Inferno", author: "Dante Alighieri" },
    ],
    formal: [
      { title: "Partial Differential Equations: An Introduction", author: "Walter A. Strauss" },
    ],
  },
  finished: {
    casual: [
      // rating: null means "not yet rated", thoughts: null means "no thoughts yet"
      { title: "The Human Stain", author: "Philip Roth", rating: null, thoughts: null },
      { title: "Chaos", author: "James Gleick", rating: null, thoughts: null },
      { title: "Atomic Habits", author: "James Clear", rating: null, thoughts: null },
      { title: "Crime and Punishment", author: "Fyodor Dostoevsky", rating: null, thoughts: null },
      { title: "48 Laws of Power", author: "Robert Greene", rating: null, thoughts: null },
      { title: "How to Be a Stoic", author: "Massimo Pigliucci", rating: null, thoughts: null },
      { title: "The Fractal Geometry of Nature", author: "Benoit B. Mandelbrot", rating: null, thoughts: null },
      { title: "Notes from Underground", author: "Fyodor Dostoevsky", rating: null, thoughts: null },
      { title: "The Idiot", author: "Fyodor Dostoevsky", rating: null, thoughts: null },
    ],
    formal: [
      { title: "The Information", author: "James Gleick", note: "select chapters", rating: null, thoughts: null },
      { title: "Computer Architecture: A Quantitative Approach", author: "Hennessy & Patterson", note: "select chapters", rating: null, thoughts: null },
    ],
  },
};

// ============================================================
// BACKEND ABSTRACTION (swap to real API later)
// ============================================================

const BookStore = {
  // --- Future: replace with fetch(`/api/recommendations`, ...) ---

  getRecommendations() {
    const raw = localStorage.getItem("book-recommendations");
    return raw ? JSON.parse(raw) : [];
  },

  addRecommendation(rec) {
    const recs = this.getRecommendations();
    recs.push({ ...rec, date: new Date().toISOString() });
    localStorage.setItem("book-recommendations", JSON.stringify(recs));
    return recs;
  },

  getAllKnownTitles() {
    const titles = [];
    const addFrom = (list) => list.forEach((b) => titles.push(b.title.toLowerCase()));
    addFrom(BOOKS.currentlyReading.casual);
    addFrom(BOOKS.currentlyReading.formal);
    addFrom(BOOKS.finished.casual);
    addFrom(BOOKS.finished.formal);
    this.getRecommendations().forEach((r) => titles.push(r.title.toLowerCase()));
    return titles;
  },
};

// ============================================================
// RENDERING
// ============================================================

function renderStars(rating) {
  if (rating === null || rating === undefined) return "";
  const filled = "★".repeat(rating);
  const empty = "☆".repeat(5 - rating);
  return filled + empty;
}

function createBookItem(book, options = {}) {
  const el = document.createElement("div");
  el.className = "book-item";

  let infoHTML = `<div class="book-info">
    <span class="book-title">${book.title}</span>`;

  if (book.author) {
    infoHTML += `<div class="book-author">${book.author}</div>`;
  }

  if (book.progress) {
    infoHTML += `<div class="book-progress">${book.progress}</div>`;
  }

  if (book.note) {
    infoHTML += `<div class="book-progress">${book.note}</div>`;
  }

  if (book.thoughts) {
    infoHTML += `<div class="book-thoughts">"${book.thoughts}"</div>`;
  }

  if (book.recNote) {
    infoHTML += `<div class="book-thoughts">"${book.recNote}"</div>`;
  }

  infoHTML += `</div>`;

  let metaHTML = "";
  if (book.starred) {
    metaHTML = `<span class="book-badge starred">⭐ starred</span>`;
  } else if (book.rating !== null && book.rating !== undefined) {
    metaHTML = `<span class="book-rating">${renderStars(book.rating)}</span>`;
  } else if (options.showUnrated) {
    metaHTML = `<span class="book-rating" style="opacity:0.35">unrated</span>`;
  }

  if (options.badge) {
    metaHTML += `<span class="book-badge">${options.badge}</span>`;
  }

  el.innerHTML = infoHTML + metaHTML;
  return el;
}

function renderBooks() {
  const containers = {
    "current-casual-list": BOOKS.currentlyReading.casual,
    "current-formal-list": BOOKS.currentlyReading.formal,
    "finished-casual-list": BOOKS.finished.casual,
    "finished-formal-list": BOOKS.finished.formal,
  };

  for (const [id, list] of Object.entries(containers)) {
    const container = document.getElementById(id);
    container.innerHTML = "";
    const isFinished = id.startsWith("finished");
    list.forEach((book) => {
      container.appendChild(createBookItem(book, { showUnrated: isFinished }));
    });
  }
}

function renderRecommendations() {
  const recs = BookStore.getRecommendations();
  const section = document.getElementById("rec-list-section");
  const list = document.getElementById("rec-list");

  if (recs.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  list.innerHTML = "";
  recs.forEach((rec) => {
    const book = {
      title: rec.title,
      author: rec.author,
      recNote: rec.note,
    };
    list.appendChild(createBookItem(book, { badge: rec.type }));
  });
}

// ============================================================
// TABS
// ============================================================

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// ============================================================
// RECOMMENDATION FORM
// ============================================================

document.getElementById("recommend-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const feedback = document.getElementById("rec-feedback");
  const title = document.getElementById("rec-title").value.trim();
  const author = document.getElementById("rec-author").value.trim();
  const type = document.getElementById("rec-type").value;
  const note = document.getElementById("rec-note").value.trim();

  if (!title) return;

  const known = BookStore.getAllKnownTitles();
  if (known.includes(title.toLowerCase())) {
    feedback.textContent = `"${title}" is already on my list — either I've read it, I'm reading it, or someone already recommended it. Thanks though!`;
    feedback.className = "rec-feedback warning";
    feedback.hidden = false;
    return;
  }

  BookStore.addRecommendation({ title, author, type, note });
  feedback.textContent = `Thanks for recommending "${title}"! I'll check it out.`;
  feedback.className = "rec-feedback success";
  feedback.hidden = false;

  e.target.reset();
  renderRecommendations();
});

// ============================================================
// INIT
// ============================================================

renderBooks();
renderRecommendations();
