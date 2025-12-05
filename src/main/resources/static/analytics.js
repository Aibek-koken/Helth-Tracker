// analytics.js (fixed) - Robust date handling, correct checkbox mapping, stable stats rendering
console.log('Analytics Dashboard (fixed) started');

const API_BASE_URL = '/api';
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

let habits = [];
let habitLogs = []; // array of objects { habit: {id}, date: "YYYY-MM-DD", status: "COMPLETED" }

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

if (!currentUser) {
    window.location.href = '/login.html';
}

/* ---------- Helpers: date formatting / normalization ---------- */

// Return YYYY-MM-DD for Date object or accepted strings.
// If input is already "YYYY-MM-DD" return as-is.
function formatDateForAPI(dateInput) {
    if (!dateInput) return null;

    // If it's already a YYYY-MM-DD string
    if (typeof dateInput === 'string') {
        // If contains T (datetime) -> split
        if (/^\d{4}-\d{2}-\d{2}T/.test(dateInput)) {
            return dateInput.split('T')[0];
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            return dateInput;
        }
        // If it's some other string, try to parse
        const parsed = new Date(dateInput);
        if (!isNaN(parsed)) {
            return parsed.toISOString().split('T')[0];
        }
        return null;
    }

    // Date object
    if (dateInput instanceof Date) {
        // Use local date (avoid timezone shifts): build from components
        const y = dateInput.getFullYear();
        const m = String(dateInput.getMonth() + 1).padStart(2, '0');
        const d = String(dateInput.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    return null;
}

// Clean string like "2024-12-02T00:00:00" -> "2024-12-02"
function cleanDateStr(s) {
    if (!s) return null;
    if (typeof s !== 'string') return formatDateForAPI(s);
    return s.split('T')[0];
}

/* ---------- API service ---------- */
const apiService = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: { 'Content-Type': 'application/json', ...options.headers },
                ...options
            });

            if (response.status === 204) return { success: true };

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (e) {
            console.error('API request failed', e);
            throw e;
        }
    },
    async getHabits() {
        if (!currentUser || !currentUser.id) throw new Error('User not authenticated');
        return this.request(`/habits/user/${currentUser.id}`);
    },
    async getHabitLogs(year, month) {
        if (!currentUser || !currentUser.id) throw new Error('User not authenticated');
        return this.request(`/habit-logs?user_id=${currentUser.id}&year=${year}&month=${month}`);
    },
    async saveHabitLog(habitLogData) {
        return this.request('/habit-logs', {
            method: 'POST',
            body: JSON.stringify(habitLogData)
        });
    },
    async deleteHabitLog(habitId, date) {
        const dateStr = typeof date === 'string' ? date : formatDateForAPI(date);
        return this.request(`/habit-logs?habit_id=${habitId}&date=${dateStr}`, {
            method: 'DELETE'
        });
    },
    async getUserStats() {
        if (!currentUser || !currentUser.id) throw new Error('User not authenticated');
        return this.request(`/users/${currentUser.id}/stats`);
    }
};

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', initializeAnalytics);

async function initializeAnalytics() {
    try {
        await loadHabits();
        await loadHabitLogsForCurrentMonth();
        await loadUserStats();
        setupEventListeners();
        renderWeekView();
        renderMonthView();
        console.log('Analytics initialized');
    } catch (e) {
        console.error('Analytics init failed', e);
        showError('Failed to load analytics. Using demo data.');
        loadDemoData();
    }
}

/* ---------- Loaders ---------- */

async function loadHabits() {
    try {
        habits = await apiService.getHabits();
        console.log('Loaded habits', habits);
    } catch (e) {
        console.error('Failed to load habits', e);
        throw e;
    }
}

async function loadHabitLogsForCurrentMonth() {
    try {
        // backend expects month as 1-based
        const res = await apiService.getHabitLogs(currentYear, currentMonth + 1);
        // ensure habitLogs normalized to YYYY-MM-DD strings
        habitLogs = Array.isArray(res) ? res.map(l => ({
            habit: l.habit || { id: l.habitId || l.habit?.id },
            date: cleanDateStr(l.date || l.createdAt || l.loggedAt),
            status: l.status || 'COMPLETED'
        })) : [];
        console.log('Loaded habit logs', habitLogs);
    } catch (e) {
        console.error('Failed to load habit logs', e);
        habitLogs = [];
    }
}

async function loadUserStats() {
    try {
        const stats = await apiService.getUserStats();
        updateStatsDisplay(stats);
    } catch (e) {
        console.error('Failed to load user stats', e);
    }
}

function updateStatsDisplay(stats = {}) {
    document.getElementById('currentStreakStat').textContent = stats.currentStreak || 0;
    document.getElementById('totalHabitsStat').textContent = stats.totalHabits || 0;

    // handle completionRate being in fraction (0.12) or percent (12)
    const completionRate = stats.completionRate == null ? 0 : stats.completionRate;
    const displayRate = (completionRate <= 1 ? completionRate * 100 : completionRate);
    document.getElementById('completionRateStat').textContent = Math.round(displayRate) + '%';

    document.getElementById('bestStreakStat').textContent = stats.bestStreak || 0;
}

/* ---------- Demo fallback ---------- */
function loadDemoData() {
    habits = [
        { id: 1, title: 'Morning Exercise' },
        { id: 2, title: 'Drink Water' },
        { id: 3, title: 'Meditation' }
    ];
    habitLogs = [];
    renderWeekView();
    renderMonthView();
}

/* ---------- UI Helpers ---------- */

function showError(message) {
    const el = document.createElement('div');
    el.className = 'error-message';
    el.style.cssText = 'position:fixed;top:20px;right:20px;background:#f44336;color:#fff;padding:12px 16px;border-radius:6px;z-index:9999';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}
// вставь эту функцию в analytics.js (например перед setupEventListeners или сразу после него)

// Показывает вкладку: 'week' или 'month'
function showTab(tabName) {
    // кнопки табов
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    // контент табов
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });

    // Если переключились на month — убедимся что данные загружены и отрендерим
    if (tabName === 'month') {
        // загрузим логи (без падения, если уже загружены) и отрендерим
        loadHabitLogsForCurrentMonth()
            .then(() => renderMonthView())
            .catch(err => {
                console.error('Ошибка при загрузке логов для месяца', err);
                // всё равно попытаемся отрендерить (локальные данные)
                renderMonthView();
            });
    } else if (tabName === 'week') {
        // для недели просто рендер
        renderWeekView();
    }
}

/* ---------- Event listeners ---------- */
function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => showTab(tab.getAttribute('data-tab')));
    });

    // Logout (keep redirect to login for now)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = '/login.html';
        });
    }

    // Delegate change events for dynamically created checkboxes (week + month)
    document.addEventListener('change', function (e) {
        const target = e.target;
        if (!target) return;

        if (target.classList.contains('table-checkbox') || target.classList.contains('month-checkbox')) {
            const habitId = parseInt(target.getAttribute('data-habit-id'), 10);
            const dateStrRaw = target.getAttribute('data-date');
            // Normalize date - if data-date already YYYY-MM-DD, keep it
            const formattedDate = (typeof dateStrRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStrRaw))
                ? dateStrRaw
                : formatDateForAPI(dateStrRaw);
            toggleHabitCompletion(habitId, formattedDate, target.checked);
        }
    });
}

/* ---------- Week View ---------- */

function getStartOfWeek(date) {
    // Make Monday the first day of week
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // 0..6 where 0 = Monday
    d.setDate(d.getDate() - day);
    d.setHours(0,0,0,0);
    return d;
}

function renderWeekView() {
    const weekTableBody = document.getElementById('weekTableBody');
    if (!weekTableBody) return;

    if (!habits || habits.length === 0) {
        weekTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px">No habits yet.</td></tr>`;
        return;
    }

    const today = new Date();
    const start = getStartOfWeek(today);
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const dt = new Date(start);
        dt.setDate(start.getDate() + i);
        weekDates.push(dt);
    }

    weekTableBody.innerHTML = habits.map(habit => {
        let cells = `<td>${escapeHtml(habit.title || '')}</td>`;
        for (let i = 0; i < 7; i++) {
            const date = weekDates[i];
            const dateStr = formatDateForAPI(date);
            const isCompleted = isHabitCompletedOnDate(habit.id, dateStr);
            cells += `<td><input type="checkbox" class="table-checkbox" data-habit-id="${habit.id}" data-date="${dateStr}" ${isCompleted ? 'checked' : ''}></td>`;
        }
        return `<tr>${cells}</tr>`;
    }).join('');
}

/* ---------- Month View ---------- */

function renderMonthView() {
    const monthTableHead = document.querySelector('#monthTable thead tr');
    const monthTableBody = document.getElementById('monthTableBody');
    if (!monthTableHead || !monthTableBody) return;

    if (!habits || habits.length === 0) {
        monthTableBody.innerHTML = `<tr><td colspan="32" style="text-align:center;padding:40px">No habits yet.</td></tr>`;
        return;
    }

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Build header
    monthTableHead.innerHTML = '<th>Habits</th>';
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        monthTableHead.innerHTML += `<th title="${date.toDateString()}">${day}<br><small>${dayName}</small></th>`;
    }

    // Build body rows
    monthTableBody.innerHTML = habits.map(habit => {
        let row = `<td>${escapeHtml(habit.title || '')}</td>`;
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = formatDateForAPI(date);
            const isCompleted = isHabitCompletedOnDate(habit.id, dateStr);
            row += `<td><input type="checkbox" class="month-checkbox" data-habit-id="${habit.id}" data-date="${dateStr}" ${isCompleted ? 'checked' : ''}></td>`;
        }
        return `<tr>${row}</tr>`;
    }).join('');
    // Update month label
    document.getElementById('currentMonthYear').textContent =
        new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/* ---------- Utilities ---------- */

function isHabitCompletedOnDate(habitId, dateInput) {
    const dateStr = formatDateForAPI(dateInput);
    if (!dateStr) return false;
    return habitLogs.some(log =>
        log.habit &&
        Number(log.habit.id) === Number(habitId) &&
        cleanDateStr(log.date) === dateStr &&
        (log.status || '').toUpperCase() === 'COMPLETED'
    );
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function (m) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
}

/* ---------- Toggle habit completion (save / delete) ---------- */

async function toggleHabitCompletion(habitId, dateStr, completed) {
    try {
        // dateStr expected in YYYY-MM-DD already
        const formattedDate = formatDateForAPI(dateStr);
        if (!formattedDate) throw new Error('Invalid date');

        if (completed) {
            // create
            await apiService.saveHabitLog({
                habitId: habitId,
                date: formattedDate,
                status: 'COMPLETED'
            });
            // push to local logs (avoid duplicates)
            const exists = habitLogs.some(l => Number(l.habit.id) === Number(habitId) && cleanDateStr(l.date) === formattedDate);
            if (!exists) {
                habitLogs.push({ habit: { id: habitId }, date: formattedDate, status: 'COMPLETED' });
            }
        } else {
            // delete
            await apiService.deleteHabitLog(habitId, formattedDate);
            const index = habitLogs.findIndex(l => Number(l.habit.id) === Number(habitId) && cleanDateStr(l.date) === formattedDate);
            if (index > -1) habitLogs.splice(index, 1);
        }

        // Update stats & views
        await loadUserStats();
        if (document.querySelector('[data-tab="week"]').classList.contains('active')) renderWeekView();
        if (document.querySelector('[data-tab="month"]').classList.contains('active')) renderMonthView();

    } catch (err) {
        console.error('toggleHabitCompletion failed', err);
        showError('Failed to update habit: ' + (err.message || err));
        // revert checkbox UI (best-effort)
        const selector = `.table-checkbox[data-habit-id="${habitId}"][data-date="${dateStr}"], .month-checkbox[data-habit-id="${habitId}"][data-date="${dateStr}"]`;
        const cb = document.querySelector(selector);
        if (cb) cb.checked = !completed;
    }
}

/* ---------- Month navigation ---------- */

async function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }

    await loadHabitLogsForCurrentMonth();
    renderMonthView();
    await loadUserStats();
}

/* Expose changeMonth for inline HTML handlers */
window.changeMonth = changeMonth;
