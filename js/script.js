/* ============================================================
   Life Dashboard — vanilla JS, no framework, no build step
   All state persisted in localStorage under the ld_ prefix
   ============================================================ */

// ============================================================
// Section 1 — Storage helpers
// ============================================================

/** All localStorage keys used by the app. */
const KEYS = {
  ld_name:    'ld_name',
  ld_theme:   'ld_theme',
  ld_minutes: 'ld_minutes',
  ld_tasks:   'ld_tasks',
  ld_sort:    'ld_sort',
  ld_links:   'ld_links'
};

/**
 * Read a JSON value from localStorage.
 * Returns `fallback` when the key is absent, the value is null,
 * or JSON.parse throws (corrupt data or storage unavailable).
 *
 * @param {string} key
 * @param {*}      fallback
 * @returns {*}
 */
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

/**
 * Persist a JSON-serialisable value to localStorage.
 * Silently swallows any errors (e.g. storage quota exceeded,
 * private-browsing restriction).  The app continues to work
 * in-memory for the current session.
 *
 * @param {string} key
 * @param {*}      value
 */
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* storage unavailable — session-only, no crash */
  }
}

// ============================================================
// Section 2 — DOM helper
// ============================================================

/** Shorthand for document.getElementById. */
const $ = (id) => document.getElementById(id);

// ============================================================
// === 3. Greeting & Clock ===
// ============================================================

/**
 * Return a time-of-day greeting for the given hour (0–23).
 *   0–4   → "Good night"
 *   5–11  → "Good morning"
 *  12–17  → "Good afternoon"
 *  18–23  → "Good evening"
 *
 * @param {number} hour  Integer in [0, 23]
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour < 5)  return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** The user's display name; loaded once and kept in sync via the edit-name button. */
var userName = load(KEYS.ld_name, '');

/**
 * Refresh the clock, date, and greeting elements from the current time.
 * Called once on startup and then every second by setInterval.
 */
function updateClock() {
  var now      = new Date();
  var greeting = getGreeting(now.getHours());

  $('clock').textContent    = now.toLocaleTimeString();
  $('date').textContent     = now.toLocaleDateString();
  $('greeting').textContent = userName
    ? greeting + ', ' + userName + '!'
    : greeting + '!';
}

// Register the edit-name button listener.
$('edit-name').addEventListener('click', function () {
  var input = prompt('What should I call you?');
  if (input === null) return;           // user cancelled — do nothing
  var trimmed = input.trim().slice(0, 30);
  save(KEYS.ld_name, trimmed);
  userName = trimmed;
  updateClock();
});

// ============================================================
// === 4. Theme ===
// ============================================================

/**
 * Apply `theme` ('light' or 'dark') to the document and update the toggle
 * button label to reflect the action that clicking it will perform next.
 *   dark  → button reads "Light mode"  (next click switches to light)
 *   light → button reads "Dark mode"   (next click switches to dark)
 *
 * @param {string} theme  'light' or 'dark'
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  $('theme-toggle').textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
}

/**
 * Determine the initial theme:
 * 1. Persisted preference in localStorage (ld_theme).
 * 2. OS/browser colour-scheme preference via matchMedia.
 * 3. Fall back to 'light'.
 */
var theme = load(KEYS.ld_theme,
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
);

// Apply immediately so there is no flash of the wrong theme before paint.
applyTheme(theme);

// Toggle handler: flip the current theme, persist, and re-apply.
$('theme-toggle').addEventListener('click', function () {
  theme = theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  save(KEYS.ld_theme, theme);
});

// ============================================================
// === 5. Focus Timer ===
// ============================================================

var timerMinutes = load(KEYS.ld_minutes, 25);
var remaining    = timerMinutes * 60;
var timerId      = null;

/**
 * Format a number of seconds as a zero-padded "MM:SS" string.
 * Pure function — extracted so property tests can call it directly.
 *
 * @param {number} n  Total seconds (integer ≥ 0)
 * @returns {string}  e.g. "25:00", "04:07"
 */
function formatTime(n) {
  var mm = String(Math.floor(n / 60)).padStart(2, '0');
  var ss = String(n % 60).padStart(2, '0');
  return mm + ':' + ss;
}

/**
 * Write the current `remaining` value to `#timer-display` and update
 * `document.title`:
 *   - While running (timerId !== null): "MM:SS - Focus"
 *   - When stopped:                     "Life Dashboard"
 */
function renderTimer() {
  var formatted = formatTime(remaining);
  $('timer-display').textContent = formatted;
  document.title = timerId !== null ? formatted + ' - Focus' : 'Life Dashboard';
}

/**
 * Start the countdown.
 * No-op if the timer is already running (`timerId !== null`) or if
 * there is no time left (`remaining ≤ 0`).
 */
function startTimer() {
  if (timerId !== null || remaining <= 0) return;
  timerId = setInterval(function () {
    remaining -= 1;
    renderTimer();
    if (remaining <= 0) {
      stopTimer();
      alert('Time is up!');
    }
  }, 1000);
  renderTimer(); // update title immediately when started
}

/**
 * Pause the countdown.
 * Clears the interval, sets `timerId` to null, and re-renders so the
 * title reverts to "Life Dashboard".
 */
function stopTimer() {
  clearInterval(timerId);
  timerId = null;
  renderTimer();
}

/**
 * Stop the timer and restore `remaining` to the full configured length.
 */
function resetTimer() {
  stopTimer();
  remaining = timerMinutes * 60;
  renderTimer();
}

// Button listeners
$('timer-start').addEventListener('click', startTimer);
$('timer-stop').addEventListener('click', stopTimer);
$('timer-reset').addEventListener('click', resetTimer);

// Restore saved minutes value into the input, then watch for changes.
$('timer-minutes').value = timerMinutes;
$('timer-minutes').addEventListener('change', function (e) {
  var parsed  = parseInt(e.target.value, 10) || 25;
  var clamped = Math.min(120, Math.max(1, parsed));
  e.target.value = clamped;          // reflect clamped value back to the UI
  timerMinutes   = clamped;
  save(KEYS.ld_minutes, clamped);
  resetTimer();
});

// ============================================================
// === 6. To-Do List ===
// ============================================================

var tasks     = load(KEYS.ld_tasks, []);
var sortMode  = load(KEYS.ld_sort, 'newest');
var editingId = null;

/**
 * Persist the current `tasks` array to localStorage.
 */
function saveTasks() {
  save(KEYS.ld_tasks, tasks);
}

/**
 * Return `true` if any task in `tasks` has text that matches `text` after
 * normalisation (trim + toLowerCase), skipping the task whose id equals
 * `ignoreId` (used when checking edits against the task being edited).
 *
 * @param {string}        text      The candidate text to check.
 * @param {number|undefined} ignoreId  Optional id of the task to exclude.
 * @returns {boolean}
 */
function isDuplicate(text, ignoreId) {
  var normalised = text.trim().toLowerCase();
  return tasks.some(function (task) {
    return task.id !== ignoreId &&
           task.text.trim().toLowerCase() === normalised;
  });
}

/**
 * Return a sorted shallow copy of `tasks` for the current `sortMode`.
 *
 * Sort modes and their comparators:
 *   "newest"  — b.id - a.id                               (creation desc)
 *   "oldest"  — a.id - b.id                               (creation asc)
 *   "az"      — a.text.localeCompare(b.text)              (alpha asc)
 *   "za"      — b.text.localeCompare(a.text)              (alpha desc)
 *   "pending" — (a.done - b.done) then (b.id - a.id)      (pending first, newest)
 *   "done"    — (b.done - a.done) then (b.id - a.id)      (done first, newest)
 *
 * @returns {Array<{id: number, text: string, done: boolean}>}
 */
function sortedTasks() {
  var copy = tasks.slice();
  copy.sort(function (a, b) {
    switch (sortMode) {
      case 'oldest':
        return a.id - b.id;
      case 'az':
        return a.text.localeCompare(b.text);
      case 'za':
        return b.text.localeCompare(a.text);
      case 'pending':
        return (a.done - b.done) || (b.id - a.id);
      case 'done':
        return (b.done - a.done) || (b.id - a.id);
      default: // 'newest'
        return b.id - a.id;
    }
  });
  return copy;
}

/**
 * Re-render the entire #todo-list from the current `tasks` array.
 *
 * For every task a <li class="todo-item"> is built containing:
 *   - A checkbox reflecting task.done
 *   - Either an inline-edit row (when editingId === task.id) or a text span
 *   - Edit and Delete icon buttons (hidden during inline edit)
 *
 * Also updates #todo-count with the number of pending (done === false) tasks.
 */
function renderTasks() {
  var list  = $('todo-list');
  var count = $('todo-count');
  list.innerHTML = '';

  var sorted = sortedTasks();

  sorted.forEach(function (task) {
    var li = document.createElement('li');
    li.className = 'todo-item';

    // ── Checkbox ──────────────────────────────────────────────
    var cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.checked = task.done;
    cb.setAttribute('aria-label', 'Mark task done');
    cb.addEventListener('change', function () {
      task.done = cb.checked;
      saveTasks();
      renderTasks();
    });
    li.appendChild(cb);

    // ── Inline-edit row OR text span ──────────────────────────
    if (editingId === task.id) {
      // Inline edit input
      var editInput = document.createElement('input');
      editInput.type      = 'text';
      editInput.className = 'todo-edit-input';
      editInput.value     = task.text;
      editInput.setAttribute('aria-label', 'Edit task text');
      editInput.setAttribute('maxlength', '200');

      var editError = document.createElement('span');
      editError.className = 'edit-error error-msg';

      // Save action
      var commitEdit = function () {
        var newText = editInput.value.trim();
        if (!newText) {
          // Discard empty edit, restore view (req 3.2)
          editingId = null;
          renderTasks();
          return;
        }
        if (isDuplicate(newText, task.id)) {
          editError.textContent = 'That task already exists.';
          return;
        }
        task.text = newText;
        editingId = null;
        saveTasks();
        renderTasks();
      };

      // Cancel action
      var cancelEdit = function () {
        editingId = null;
        renderTasks();
      };

      // Keyboard shortcuts: Enter saves, Escape cancels
      editInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
        if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
      });

      // Clear inline error on typing
      editInput.addEventListener('input', function () {
        editError.textContent = '';
      });

      var saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.textContent = 'Save';
      saveBtn.addEventListener('click', commitEdit);

      var cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', cancelEdit);

      li.appendChild(editInput);
      li.appendChild(saveBtn);
      li.appendChild(cancelBtn);
      li.appendChild(editError);

      // Focus the input so the user can type immediately
      // (deferred so the element is in the DOM first)
      setTimeout(function () { editInput.focus(); }, 0);

    } else {
      // Normal text span — textContent used (never innerHTML) for XSS safety
      var span = document.createElement('span');
      span.className = 'todo-text';
      if (task.done) span.classList.add('done');
      span.textContent = task.text;
      li.appendChild(span);

      // Edit button
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.setAttribute('aria-label', 'Edit task');
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', function () {
        editingId = task.id;
        renderTasks();
      });

      // Delete button
      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.setAttribute('aria-label', 'Delete task');
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', function () {
        tasks = tasks.filter(function (t) { return t.id !== task.id; });
        if (editingId === task.id) editingId = null;
        saveTasks();
        renderTasks();
      });

      li.appendChild(editBtn);
      li.appendChild(delBtn);
    }

    list.appendChild(li);
  });

  // Update pending count
  var pending = tasks.filter(function (t) { return !t.done; }).length;
  count.textContent = pending + ' task' + (pending === 1 ? '' : 's') + ' remaining';
}

// ── Form submit: add a new task ────────────────────────────────────────────────
$('todo-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var input    = $('todo-input');
  var errorEl  = $('todo-error');
  var text     = input.value.trim();

  if (!text) return;

  if (isDuplicate(text)) {
    errorEl.textContent = 'That task already exists.';
    return;
  }

  tasks.push({ id: Date.now(), text: text, done: false });
  input.value         = '';
  errorEl.textContent = '';
  saveTasks();
  renderTasks();
});

// ── Sort change ────────────────────────────────────────────────────────────────
$('todo-sort').addEventListener('change', function (e) {
  sortMode = e.target.value;
  save(KEYS.ld_sort, sortMode);
  renderTasks();
});

// ── Clear error while user is typing ──────────────────────────────────────────
$('todo-input').addEventListener('input', function () {
  $('todo-error').textContent = '';
});

// ============================================================
// === 7. Quick Links ===
// ============================================================

var DEFAULT_LINKS = [
  { id: 1, name: 'Google',  url: 'https://www.google.com' },
  { id: 2, name: 'GitHub',  url: 'https://github.com' },
  { id: 3, name: 'YouTube', url: 'https://www.youtube.com' }
];
var links = load(KEYS.ld_links, null);
if (links === null) { links = DEFAULT_LINKS.slice(); }

/**
 * Normalise a user-supplied URL string into an absolute href, or return
 * `null` if the input cannot be parsed as a valid URL.
 *
 * Steps:
 *  1. Trim surrounding whitespace.
 *  2. Prepend "https://" when no protocol prefix is present.
 *  3. Attempt `new URL()` construction; return `null` on failure.
 *  4. Return `null` when the parsed hostname contains no "." (bare host).
 *  5. Otherwise return the normalised `href` string.
 *
 * @param {string} value  Raw URL string from the user.
 * @returns {string|null} Normalised absolute URL, or null if invalid.
 */
function normalizeUrl(value) {
  var url = value.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  try {
    var parsed = new URL(url);
    if (parsed.hostname.indexOf('.') === -1) return null;
    return parsed.href;
  } catch (e) {
    return null;
  }
}

/**
 * Re-render the entire #links container from the current `links` array.
 *
 * For every link a <div class="link-chip"> is built containing:
 *   - An <a> that opens in a new tab with rel="noopener noreferrer"
 *   - A remove <button> that filters the link out and re-renders
 *
 * When `links` is empty a plain <p> with an empty-state message is shown.
 * All user-supplied text is written via textContent (never innerHTML).
 */
function renderLinks() {
  var container = $('links');
  container.innerHTML = '';

  if (links.length === 0) {
    var empty = document.createElement('p');
    empty.textContent = 'No links saved.';
    container.appendChild(empty);
    return;
  }

  links.forEach(function (link) {
    var chip = document.createElement('div');
    chip.className = 'link-chip';

    // Anchor — href set via property (never innerHTML) for XSS safety
    var a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = link.name;  // textContent only — never innerHTML
    chip.appendChild(a);

    // Remove button — closure captures `link`
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', 'Remove ' + link.name);
    removeBtn.addEventListener('click', function () {
      links = links.filter(function (l) { return l.id !== link.id; });
      save(KEYS.ld_links, links);
      renderLinks();
    });
    chip.appendChild(removeBtn);

    container.appendChild(chip);
  });
}

// ── Form submit: add a new link ────────────────────────────────────────────────
$('link-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var errorEl = $('link-error');

  var name = $('link-name').value.trim();
  if (!name) {
    errorEl.textContent = 'Name is required.';
    return;
  }

  var url = normalizeUrl($('link-url').value);
  if (url === null) {
    errorEl.textContent = 'Please enter a valid URL.';
    return;
  }

  links.push({ id: Date.now(), name: name, url: url });
  $('link-name').value    = '';
  $('link-url').value     = '';
  errorEl.textContent     = '';
  save(KEYS.ld_links, links);
  renderLinks();
});

// ============================================================
// === Init ===
// ============================================================

updateClock();
setInterval(updateClock, 1000);
renderTimer();

// Restore persisted sort selection in the <select> element
$('todo-sort').value = sortMode;
renderTasks();
renderLinks();
