const API = "/api/notes";

let notes = [];
let activeNoteId = null;

const notesList = document.getElementById("notes-list");
const noteEditor = document.getElementById("note-editor");
const emptyState = document.getElementById("empty-state");
const noteTitleInput = document.getElementById("note-title");
const noteContentInput = document.getElementById("note-content");
const searchInput = document.getElementById("search-input");
const btnNewNote = document.getElementById("btn-new-note");
const btnSave = document.getElementById("btn-save");
const btnDelete = document.getElementById("btn-delete");
const toast = document.getElementById("toast");

function showToast(msg, type = "success") {
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    setTimeout(() => { toast.className = "toast hidden"; }, 3000);
}

function renderNotesList(data) {
    const query = searchInput.value.toLowerCase();
    const filtered = data.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
    );

    notesList.innerHTML = "";
    if (filtered.length === 0) {
        notesList.innerHTML = `<li style="padding:16px;color:#6c7086;font-size:0.85rem;">No notes found.</li>`;
        return;
    }

    filtered.forEach(note => {
        const li = document.createElement("li");
        li.className = "note-item" + (note.id === activeNoteId ? " active" : "");
        li.dataset.id = note.id;
        li.innerHTML = `
            <div class="note-item-title">${escapeHtml(note.title)}</div>
            <div class="note-item-preview">${escapeHtml(note.content.slice(0, 60))}</div>
            <div class="note-item-date">${formatDate(note.updated_at)}</div>
        `;
        li.addEventListener("click", () => openNote(note.id));
        notesList.appendChild(li);
    });
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function openNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    activeNoteId = id;
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
    emptyState.style.display = "none";
    noteEditor.classList.remove("hidden");
    renderNotesList(notes);
}

function clearEditor() {
    activeNoteId = null;
    noteTitleInput.value = "";
    noteContentInput.value = "";
    noteEditor.classList.add("hidden");
    emptyState.style.display = "";
    renderNotesList(notes);
}


async function fetchNotes() {
    const res = await fetch(API);
    notes = await res.json();
    renderNotesList(notes);
}

async function createNote() {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    if (!title) { showToast("Title is required", "error"); return; }

    const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
    });
    if (!res.ok) { showToast("Failed to create note", "error"); return; }
    const created = await res.json();
    notes.unshift(created);
    activeNoteId = created.id;
    renderNotesList(notes);
    showToast("Note created!");
}

async function saveNote() {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    if (!title) { showToast("Title is required", "error"); return; }

    if (activeNoteId === null) {
        await createNote();
        return;
    }

    const res = await fetch(`${API}/${activeNoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
    });
    if (!res.ok) { showToast("Failed to save note", "error"); return; }
    const updated = await res.json();
    notes = notes.map(n => n.id === updated.id ? updated : n);
    renderNotesList(notes);
    showToast("Note saved!");
}

async function deleteNote() {
    if (activeNoteId === null) return;
    const res = await fetch(`${API}/${activeNoteId}`, { method: "DELETE" });
    if (!res.ok) { showToast("Failed to delete", "error"); return; }
    notes = notes.filter(n => n.id !== activeNoteId);
    clearEditor();
    showToast("Note deleted!");
}

btnNewNote.addEventListener("click", () => {
    activeNoteId = null;
    noteTitleInput.value = "";
    noteContentInput.value = "";
    emptyState.style.display = "none";
    noteEditor.classList.remove("hidden");
    noteTitleInput.focus();
    renderNotesList(notes);
});

btnSave.addEventListener("click", saveNote);
btnDelete.addEventListener("click", deleteNote);
searchInput.addEventListener("input", () => renderNotesList(notes));

fetchNotes();