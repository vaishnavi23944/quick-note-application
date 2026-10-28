const STORAGE_KEY = "quickNoteApp.notes.v1";

const formSection = document.getElementById("note-form-section");
const form = document.getElementById("note-form");
const titleInput = document.getElementById("note-title");
const contentInput = document.getElementById("note-content");
const formHeading = document.getElementById("form-heading");
const saveButton = document.getElementById("save-note");
const notesGrid = document.getElementById("notes-grid");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search");
const notesCount = document.getElementById("notes-count");
const toast = document.getElementById("toast");

let notes = loadNotes();
let editingId = null;
let toastTimer = null;

function loadNotes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Could not read saved notes:", error);
    return [];
  }
}

function saveNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch (error) {
    showToast("Could not save notes in this browser.");
    return false;
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime())
    ? "Just now"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function openForm(note = null) {
  editingId = note ? note.id : null;
  formHeading.textContent = note ? "Edit your note" : "Create a note";
  saveButton.textContent = note ? "Update note" : "Save note";
  titleInput.value = note ? note.title : "";
  contentInput.value = note ? note.content : "";
  formSection.hidden = false;
  formSection.scrollIntoView({ behavior: "smooth", block: "start" });
  titleInput.focus({ preventScroll: true });
}

function closeForm() {
  form.reset();
  formSection.hidden = true;
  editingId = null;
}

function renderNotes() {
  const query = searchInput.value.trim().toLowerCase();
  const filteredNotes = notes
    .filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(query))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  notesCount.textContent = `${filteredNotes.length} ${filteredNotes.length === 1 ? "note" : "notes"}`;
  notesGrid.innerHTML = "";

  filteredNotes.forEach((note) => {
    const card = document.createElement("article");
    card.className = "note-card";
    card.innerHTML = `
      <h3>${escapeHTML(note.title)}</h3>
      <p class="note-content">${escapeHTML(note.content)}</p>
      <div class="note-meta">Updated ${escapeHTML(formatDate(note.updatedAt))}</div>
      <div class="note-actions">
        <button class="small-button edit" type="button" data-action="edit" data-id="${escapeHTML(note.id)}">Edit</button>
        <button class="small-button delete" type="button" data-action="delete" data-id="${escapeHTML(note.id)}">Delete</button>
      </div>`;
    notesGrid.appendChild(card);
  });

  const hasNotes = filteredNotes.length > 0;
  notesGrid.hidden = !hasNotes;
  emptyState.hidden = hasNotes;
  if (notes.length > 0 && !hasNotes) {
    emptyState.querySelector("h3").textContent = "No matching notes";
    emptyState.querySelector("p").textContent = "Try another search term.";
    emptyState.querySelector("button").hidden = true;
  } else {
    emptyState.querySelector("h3").textContent = "No notes yet";
    emptyState.querySelector("p").textContent = "Create your first note and keep your ideas close.";
    emptyState.querySelector("button").hidden = false;
  }
}

function createOrUpdateNote(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    showToast("Please enter both a title and note.");
    return;
  }

  const now = new Date().toISOString();
  if (editingId) {
    notes = notes.map((note) => note.id === editingId
      ? { ...note, title, content, updatedAt: now }
      : note);
    if (!saveNotes()) return;
    showToast("Note updated successfully.");
  } else {
    notes.push({ id: makeId(), title, content, createdAt: now, updatedAt: now });
    if (!saveNotes()) {
      notes.pop();
      return;
    }
    showToast("Note saved successfully.");
  }

  closeForm();
  renderNotes();
}

function handleNoteAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const note = notes.find((item) => item.id === button.dataset.id);
  if (!note) return;

  if (button.dataset.action === "edit") {
    openForm(note);
  } else if (button.dataset.action === "delete") {
    const confirmed = window.confirm(`Delete "${note.title}"? This cannot be undone.`);
    if (!confirmed) return;
    const previousNotes = notes;
    notes = notes.filter((item) => item.id !== note.id);
    if (!saveNotes()) {
      notes = previousNotes;
      return;
    }
    renderNotes();
    showToast("Note deleted.");
  }
}

document.getElementById("new-note-top").addEventListener("click", () => openForm());
document.getElementById("empty-new-note").addEventListener("click", () => openForm());
document.getElementById("cancel-form").addEventListener("click", closeForm);
form.addEventListener("submit", createOrUpdateNote);
notesGrid.addEventListener("click", handleNoteAction);
searchInput.addEventListener("input", renderNotes);
document.getElementById("year").textContent = new Date().getFullYear();

renderNotes();
