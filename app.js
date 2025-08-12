(function () {
  const STORAGE_KEY = "todo-app.tasks.v1";

  /** @typedef {{ id: string, title: string, notes: string, completed: boolean, createdAt: number, updatedAt: number }} Task */

  /** @type {Task[]} */
  let tasks = [];

  const elements = {
    form: document.getElementById("taskForm"),
    titleInput: document.getElementById("taskTitle"),
    notesInput: document.getElementById("taskNotes"),
    list: document.getElementById("taskList"),
    searchInput: document.getElementById("searchInput"),
    filterButtons: Array.from(document.querySelectorAll(".filter-button")),
    toggleAll: document.getElementById("toggleAll"),
    clearCompleted: document.getElementById("clearCompleted"),
    stats: document.getElementById("stats"),
    toast: document.getElementById("toast"),
  };

  let currentFilter = /** @type {"all"|"active"|"completed"} */ ("all");
  let currentSearch = "";
  let toastTimer = /** @type {number | null} */ (null);

  function generateId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(Boolean);
    } catch {
      return [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function createTask(title, notes) {
    const now = Date.now();
    return /** @type {Task} */ ({
      id: generateId(),
      title: title.trim(),
      notes: (notes || "").trim(),
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  function addTask(title, notes) {
    const newTask = createTask(title, notes);
    tasks.unshift(newTask);
    saveTasks();
    render();
    showToast("Task added");
  }

  function updateTask(id, update) {
    let changed = false;
    tasks = tasks.map((t) => {
      if (t.id !== id) return t;
      changed = true;
      return { ...t, ...update, updatedAt: Date.now() };
    });
    if (changed) {
      saveTasks();
      render();
    }
  }

  function deleteTask(id) {
    const before = tasks.length;
    tasks = tasks.filter((t) => t.id !== id);
    if (tasks.length !== before) {
      saveTasks();
      render();
      showToast("Task deleted");
    }
  }

  function clearCompletedTasks() {
    const before = tasks.length;
    tasks = tasks.filter((t) => !t.completed);
    if (tasks.length !== before) {
      saveTasks();
      render();
      showToast("Cleared completed");
    }
  }

  function toggleAllTasks() {
    const hasActive = tasks.some((t) => !t.completed);
    tasks = tasks.map((t) => ({ ...t, completed: hasActive }));
    saveTasks();
    render();
    showToast(hasActive ? "Marked all completed" : "Marked all active");
  }

  function setFilter(filter) {
    currentFilter = filter;
    for (const btn of elements.filterButtons) {
      const active = btn.dataset.filter === filter;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", String(active));
    }
    render();
  }

  function setSearch(query) {
    currentSearch = query.trim().toLowerCase();
    render();
  }

  function getVisibleTasks() {
    const filtered = tasks.filter((t) => {
      if (currentFilter === "active" && t.completed) return false;
      if (currentFilter === "completed" && !t.completed) return false;
      return true;
    });

    if (!currentSearch) return filtered;

    return filtered.filter((t) =>
      [t.title, t.notes].some((field) => field.toLowerCase().includes(currentSearch))
    );
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function highlightText(text, query) {
    if (!query) return escapeHtml(text);
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query);
    if (idx === -1) return escapeHtml(text);
    const before = escapeHtml(text.slice(0, idx));
    const match = escapeHtml(text.slice(idx, idx + query.length));
    const after = escapeHtml(text.slice(idx + query.length));
    return `${before}<mark>${match}</mark>${after}`;
  }

  function createTaskItem(task) {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => updateTask(task.id, { completed: checkbox.checked }));

    const content = document.createElement("div");
    content.className = "task-content";

    const title = document.createElement("div");
    title.className = "task-title" + (task.completed ? " completed" : "");
    title.innerHTML = currentSearch ? highlightText(task.title, currentSearch) : escapeHtml(task.title);

    const notes = document.createElement("div");
    notes.className = "task-notes";
    notes.innerHTML = currentSearch ? highlightText(task.notes, currentSearch) : escapeHtml(task.notes || "");
    if (!task.notes) notes.style.display = "none";

    content.appendChild(title);
    content.appendChild(notes);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => handleEdit(task));

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "danger";
    delBtn.addEventListener("click", () => animateAndDelete(li, task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(actions);

    return li;
  }

  function animateAndDelete(listItem, id) {
    listItem.classList.add("leaving");
    listItem.addEventListener(
      "animationend",
      () => {
        deleteTask(id);
      },
      { once: true }
    );
  }

  function handleEdit(task) {
    const newTitle = prompt("Edit task title:", task.title);
    if (newTitle === null) return;
    const sanitizedTitle = newTitle.trim();
    if (!sanitizedTitle) return;

    const newNotes = prompt("Edit notes (optional):", task.notes || "");
    if (newNotes === null) return;

    updateTask(task.id, { title: sanitizedTitle, notes: newNotes.trim() });
    showToast("Task updated");
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;
    if (elements.stats) {
      elements.stats.textContent = `${total} total • ${active} active • ${completed} completed`;
    }
  }

  function showToast(message) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(() => {
      elements.toast.classList.remove("show");
    }, 1600);
  }

  function render() {
    elements.list.innerHTML = "";
    const visible = getVisibleTasks();
    if (visible.length === 0) {
      const empty = document.createElement("li");
      empty.className = "task-item";
      empty.innerHTML = `<div></div><div class="task-content"><div class="task-title">No tasks</div><div class="task-notes">Add some tasks to get started.</div></div><div></div>`;
      elements.list.appendChild(empty);
      updateStats();
      return;
    }

    visible.forEach((task, index) => {
      const item = createTaskItem(task);
      item.style.animationDelay = `${Math.min(index * 40, 200)}ms`;
      elements.list.appendChild(item);
    });

    updateStats();
  }

  function onFormSubmit(event) {
    event.preventDefault();
    const title = elements.titleInput.value.trim();
    const notes = elements.notesInput.value.trim();
    if (!title) return;
    addTask(title, notes);
    elements.titleInput.value = "";
    elements.notesInput.value = "";
    elements.titleInput.focus();
  }

  function bindEvents() {
    elements.form.addEventListener("submit", onFormSubmit);

    elements.searchInput.addEventListener("input", (e) => {
      const target = /** @type {HTMLInputElement} */ (e.target);
      setSearch(target.value);
    });

    for (const btn of elements.filterButtons) {
      btn.addEventListener("click", () => setFilter(/** @type {any} */ (btn.dataset.filter)));
    }

    elements.toggleAll.addEventListener("click", toggleAllTasks);
    elements.clearCompleted.addEventListener("click", clearCompletedTasks);
  }

  function init() {
    tasks = loadTasks();
    bindEvents();
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})(); 