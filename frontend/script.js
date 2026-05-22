// ============================================================
// BOOK DATA — fetched from API
// ============================================================

let BOOKS = { currentlyReading: { casual: [], formal: [] }, finished: { casual: [], formal: [] } };
let _recommendations = [];

async function fetchBooks() {
  try {
    const res = await fetch(`${API_BASE}/books`);
    const books = await res.json();
    BOOKS = { currentlyReading: { casual: [], formal: [] }, finished: { casual: [], formal: [] } };
    books.forEach((b) => {
      const group = b.status === "reading" ? "currentlyReading" : "finished";
      if (BOOKS[group]?.[b.type]) BOOKS[group][b.type].push(b);
    });
  } catch (err) {
    console.error("Could not load books:", err);
  }
}

async function fetchRecommendations() {
  try {
    const res = await fetch(`${API_BASE}/books/recommendations`);
    const data = await res.json();
    _recommendations = data.map((r) => ({
      title: r.book.title,
      author: r.book.author,
      type: r.book.type,
      note: r.comment,
      date: r.submitted_at,
    }));
  } catch (err) {
    console.error("Could not load recommendations:", err);
  }
}

async function postRecommendation(rec) {
  const res = await fetch(`${API_BASE}/books/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: rec.title, author: rec.author, type: rec.type, note: rec.note }),
  });
  if (!res.ok) throw new Error(await res.text());
}

function getAllKnownTitles() {
  const titles = [];
  const addFrom = (list) => list.forEach((b) => titles.push(b.title.toLowerCase()));
  addFrom(BOOKS.currentlyReading.casual);
  addFrom(BOOKS.currentlyReading.formal);
  addFrom(BOOKS.finished.casual);
  addFrom(BOOKS.finished.formal);
  _recommendations.forEach((r) => titles.push(r.title.toLowerCase()));
  return titles;
}

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
  const recs = _recommendations;
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

document.getElementById("recommend-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const feedback = document.getElementById("rec-feedback");
  const title = document.getElementById("rec-title").value.trim();
  const author = document.getElementById("rec-author").value.trim();
  const type = document.getElementById("rec-type").value;
  const note = document.getElementById("rec-note").value.trim();

  if (!title) return;

  if (getAllKnownTitles().includes(title.toLowerCase())) {
    feedback.textContent = `"${title}" is already on my list — either I've read it, I'm reading it, or someone already recommended it. Thanks though!`;
    feedback.className = "rec-feedback warning";
    feedback.hidden = false;
    return;
  }

  try {
    await postRecommendation({ title, author, type, note });
    await fetchRecommendations();
    feedback.textContent = `Thanks for recommending "${title}"! I'll check it out.`;
    feedback.className = "rec-feedback success";
    feedback.hidden = false;
    e.target.reset();
    renderRecommendations();
  } catch (err) {
    feedback.textContent = "Something went wrong — please try again later.";
    feedback.className = "rec-feedback warning";
    feedback.hidden = false;
  }
});

// ============================================================
// INIT
// ============================================================

async function init() {
  await fetchBooks();
  await fetchRecommendations();
  renderBooks();
  renderRecommendations();
}

init();
