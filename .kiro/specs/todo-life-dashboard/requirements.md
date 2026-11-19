# Requirements Document

## Introduction

The To-Do List Life Dashboard is a client-side web application built with HTML, CSS and Vanilla JavaScript. It stores all data in the browser's Local Storage and needs no backend. One page combines a greeting with the current time, a focus timer, a to-do list and a quick-links launcher. The goal is a clean, minimal tool that helps a user stay focused and organized with zero setup.

## Glossary

- **Dashboard_App**: The single-page web application described here.
- **Greeting_Widget**: Shows the current time, date and a time-of-day greeting.
- **Timer**: The Pomodoro-style focus timer (default 25 minutes).
- **Todo_List**: The widget that manages the user's tasks.
- **Task**: One to-do item with an id, text and done flag.
- **Quick_Links**: The widget that shows saved shortcut buttons to websites.
- **Link**: One quick-link item with an id, name and URL.
- **Local_Storage**: The browser `localStorage` API, the only persistence layer.

---

## Requirements

### Requirement 1: Greeting Widget (Time and Date)

**User Story:** As a user, I want to see the current time, date and a greeting, so that I know where my day stands at a glance.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM:SS format and the current date in a human-readable format (e.g. "Monday, January 1, 2025"), refreshing both values every 1 second.
2. WHEN the hour of the day is between 0 and 4 (inclusive), THE Greeting_Widget SHALL display the greeting "Good night". WHEN the hour is between 5 and 11 (inclusive), THE Greeting_Widget SHALL display "Good morning". WHEN the hour is between 12 and 17 (inclusive), THE Greeting_Widget SHALL display "Good afternoon". WHEN the hour is 18 or later, THE Greeting_Widget SHALL display "Good evening".
3. WHERE a custom name is set, THE Greeting_Widget SHALL append the name to the greeting in the format "[Greeting], [name]!"; IF no custom name is set, THEN THE Greeting_Widget SHALL display the greeting in the format "[Greeting]!".
4. THE Dashboard_App SHALL save the custom name to Local_Storage and retrieve it on page load, so that the name persists across browser sessions.
5. WHEN the user submits a new name, IF the trimmed input exceeds 30 characters, THEN THE Greeting_Widget SHALL truncate the value to 30 characters before saving it to Local_Storage.

#### Pseudocode

```
FUNCTION getGreeting(hour):
    IF hour < 5:   RETURN "Good night"
    IF hour < 12:  RETURN "Good morning"
    IF hour < 18:  RETURN "Good afternoon"
    RETURN "Good evening"

FUNCTION updateClock():
    now = currentDateTime()
    show time(now) in clock element
    show date(now) in date element
    greet = getGreeting(now.hour)
    IF userName is not empty:
        show greet + ", " + userName + "!"
    ELSE:
        show greet + "!"

ON page load:
    userName = load("name", "")
    updateClock()
    EVERY 1 second: updateClock()

ON click "Change name":
    input = askUser("What should I call you?")
    IF input was cancelled: STOP
    userName = trim(input), max 30 characters
    save("name", userName)
    updateClock()
```

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute focus timer, so that I can work in focused sessions.

#### Acceptance Criteria

1. THE Timer SHALL start at 25:00 by default.
2. WHEN the user presses Start, THE Timer SHALL count down once per second, displaying the remaining time in MM:SS format with two-digit zero-padded minutes and seconds.
3. WHEN the user presses Stop, THE Timer SHALL pause at the current value and the Start button SHALL become available.
4. WHEN the user presses Reset, THE Timer SHALL stop counting and return to the configured length in MM:SS format.
5. WHEN the timer reaches 00:00, THE Timer SHALL stop counting and display a notification to the user.
6. IF the user presses Start while the timer is already running, THEN THE Timer SHALL ignore the input and continue counting without resetting or duplicating the countdown.
7. IF the user presses Start while the remaining time is 00:00, THEN THE Timer SHALL ignore the input.
8. WHERE the user changes the minutes field to a value between 1 and 120 inclusive, THE Timer SHALL reset to the new length and save the value to Local_Storage.
9. IF the user enters a value outside the range 1 to 120 in the minutes field, THEN THE Timer SHALL clamp the value to the nearest bound (1 or 120) and save the clamped value to Local_Storage.
10. WHEN the page loads, THE Timer SHALL restore the minutes value from Local_Storage if present, or default to 25 minutes if no saved value exists.

#### Pseudocode

```
STATE: minutes = load("minutes", 25)
       remaining = minutes * 60
       timerId = null

FUNCTION start():
    IF timerId exists OR remaining <= 0: RETURN
    timerId = EVERY 1 second:
        remaining = remaining - 1
        render()
        IF remaining <= 0:
            stop()
            alert("Time is up!")

FUNCTION stop():
    cancel timerId
    timerId = null

FUNCTION reset():
    stop()
    remaining = minutes * 60
    render()

FUNCTION render():
    mm = floor(remaining / 60), padded to 2 digits
    ss = remaining MOD 60, padded to 2 digits
    show mm + ":" + ss

ON change minutes field:
    value = clamp(parseInt(input), 1, 120), default 25
    minutes = value
    save("minutes", value)
    reset()
```

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, complete and delete tasks, so that I can organize my day.

#### Acceptance Criteria

1. WHEN the user submits non-empty text of 1–200 characters, THE Todo_List SHALL add a new Task with a unique identifier equal to the submission timestamp in milliseconds.
2. WHEN the user saves an edit, IF the new text is empty, THEN THE Todo_List SHALL discard the change and restore the original Task text without modifying Local_Storage.
3. WHEN the user saves an edit with non-empty text of 1–200 characters, THE Todo_List SHALL update the Task text, persist the change to Local_Storage, and re-render the list.
4. WHEN the user ticks a Task, THE Todo_List SHALL mark it done and show it struck through.
5. WHEN the user unticks a Task, THE Todo_List SHALL mark it pending and remove the strikethrough.
6. WHEN the user presses Delete on a Task, THE Todo_List SHALL remove that Task from the list and persist the updated list to Local_Storage.
7. THE Todo_List SHALL save every change to Local_Storage and restore all tasks and the chosen sort order on page load within 300 ms of the page load event firing.
8. IF the submitted text matches an existing Task text (ignoring case and surrounding whitespace), THEN THE Todo_List SHALL reject the submission, retain the input field value, and show an error message indicating the duplicate.
9. IF the edited text matches any other Task's text (ignoring case and surrounding whitespace), THEN THE Todo_List SHALL reject the edit, retain the edited field value, and show an error message indicating the duplicate.
10. WHEN the user selects a sort order, THE Todo_List SHALL re-render the task list immediately using that order and save the chosen sort order to Local_Storage; the supported orders are: newest (by creation time descending), oldest (by creation time ascending), A to Z (alphabetical ascending), Z to A (alphabetical descending), pending first (incomplete before complete, then newest), and done first (complete before incomplete, then newest).
11. IF Local_Storage is unavailable or returns a parse error on page load, THEN THE Todo_List SHALL start with an empty task list and the default sort order of newest.

#### Pseudocode

```
STATE: tasks = load("tasks", [])      // each: {id, text, done}
       sortMode = load("sort", "newest")

FUNCTION isDuplicate(text, ignoreId):
    t = lowercase(trim(text))
    RETURN ANY task IN tasks WHERE task.id != ignoreId
                              AND lowercase(trim(task.text)) == t

ON submit add form:
    text = trim(input)
    IF text is empty: RETURN
    IF isDuplicate(text): show error "That task already exists."; RETURN
    append {id: now(), text: text, done: false} to tasks
    save("tasks", tasks)
    render()

ON tick checkbox(task):
    task.done = checkbox.checked
    save("tasks", tasks); render()

ON save edit(task, newText):
    IF newText is empty: RETURN
    IF isDuplicate(newText, task.id): show error; RETURN
    task.text = newText
    save("tasks", tasks); render()

ON click Delete(task):
    tasks = tasks WITHOUT task
    save("tasks", tasks); render()

FUNCTION sortedTasks():
    copy = clone(tasks)
    SWITCH sortMode:
        "oldest":  sort by id ascending
        "az":      sort by text ascending
        "za":      sort by text descending
        "pending": sort by done ascending, then id descending
        "done":    sort by done descending, then id descending
        default:   sort by id descending
    RETURN copy
```

---

### Requirement 4: Quick Links

**User Story:** As a user, I want buttons for my favourite websites, so that I can open them in one click.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL show each saved Link as a button that opens its URL in a new tab.
2. THE Quick_Links widget SHALL let the user add a Link with a name of 1–50 characters and a URL of 1–2000 characters.
3. THE Quick_Links widget SHALL let the user remove a Link.
4. WHEN the Dashboard_App loads for the first time with no saved Links, THE Quick_Links widget SHALL display three default Links: Google (https://google.com), GitHub (https://github.com), and YouTube (https://youtube.com).
5. WHEN the user adds or removes a Link, THE Dashboard_App SHALL save the updated Links list to Local_Storage.
6. WHEN the Dashboard_App loads and Local_Storage contains a saved Links list, THE Dashboard_App SHALL restore and display those Links.
7. IF the user submits the add-Link form with an empty name, THEN THE Quick_Links widget SHALL show an error message indicating that a name is required and SHALL NOT add the Link.
8. IF the URL entered is not valid after normalisation, THEN THE Quick_Links widget SHALL show an error message indicating the URL is invalid and SHALL NOT add the Link.
9. WHEN the user enters a URL without `http://` or `https://`, THE Quick_Links widget SHALL prepend `https://` before validation.

#### Pseudocode

```
STATE: links = load("links", [Google, GitHub, YouTube])

FUNCTION normalizeUrl(value):
    url = trim(value)
    IF url does not start with "http://" or "https://":
        url = "https://" + url
    TRY parse url
        IF hostname has no ".": RETURN null
        RETURN parsed url
    ON failure: RETURN null

ON submit link form:
    name = trim(nameInput)
    url = normalizeUrl(urlInput)
    IF name is empty: RETURN
    IF url is null: show error "Please enter a valid URL."; RETURN
    append {id: now(), name, url} to links
    save("links", links); render()

ON click remove(link):
    links = links WITHOUT link
    save("links", links); render()
```

---

### Requirement 5: Light and Dark Mode

**User Story:** As a user, I want to switch between light and dark themes, so that the dashboard is comfortable to read.

#### Acceptance Criteria

1. THE Dashboard_App SHALL provide a toggle button that displays the current active theme name ("Light" or "Dark") and switches to the other theme when clicked.
2. WHEN the user clicks the toggle button, THE Dashboard_App SHALL apply the new theme to all visible UI elements within 100 milliseconds.
3. WHEN the user clicks the toggle button, THE Dashboard_App SHALL save the selected theme value ("light" or "dark") to Local_Storage under a single dedicated key.
4. WHEN the Dashboard_App loads and Local_Storage contains a saved theme value, THE Dashboard_App SHALL apply that saved theme before rendering any visible content.
5. WHEN the Dashboard_App loads and Local_Storage contains no saved theme value, THE Dashboard_App SHALL apply the theme matching the operating system's current color-scheme preference (dark if the OS prefers dark, light otherwise).
6. IF Local_Storage is unavailable, THEN THE Dashboard_App SHALL apply the operating system's color-scheme preference for the session without persisting the selection.

#### Pseudocode

```
theme = load("theme", systemPrefersDark() ? "dark" : "light")
apply(theme)

ON click toggle:
    theme = (theme == "dark") ? "light" : "dark"
    apply(theme)
    save("theme", theme)
```

---

### Requirement 6: Technical Architecture and Constraints

**User Story:** As a developer, I want a strict single-file-per-type structure, so that the project stays simple and easy to maintain.

#### Acceptance Criteria

1. THE Dashboard_App SHALL be delivered as exactly one HTML file named `index.html` at the project root, exactly one CSS file named `style.css` inside `css/`, and exactly one JavaScript file named `script.js` inside `js/`.
2. THE Dashboard_App SHALL use only Vanilla JavaScript with no third-party frameworks or libraries, including those loaded via CDN or inline script tags referencing external origins.
3. THE Dashboard_App SHALL NOT require a backend server, build tool or package manager.
4. THE Dashboard_App SHALL store all data client-side in Local_Storage.
5. THE Dashboard_App SHALL function correctly in the two most recent major releases of Chrome, Firefox, Edge and Safari available at the time of delivery.
6. THE Dashboard_App SHALL present all interactive controls and content using a minimum body font size of 14px, at least two distinct heading levels to establish visual hierarchy, and a maximum page width of 1200px to maintain line readability.

#### Project Structure

```
CodingCamp-[batchdate]-[name]/
    .kiro/specs/todo-life-dashboard/
        .config.kiro
        requirements.md
    index.html
    css/style.css
    js/script.js
```
