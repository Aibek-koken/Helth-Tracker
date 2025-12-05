// analytics.js (patched: minimal fallback stats calculation)
// Replace your current analytics.js with this file.

console.log('Analytics Dashboard (patched) started');

const API_BASE_URL = '/api';
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

let habits = [];
let habitLogs = [];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

if (!currentUser) {
    window.location.href = '/login.html';
}

/* ---------- Helpers ---------- */

function formatDateForAPI(dateInput) {
    if (!dateInput) return null;

    if (typeof dateInput === 'string') {
        if (/^\d{4}-\d{2}-\d{2}T/.test(dateInput)) return dateInput.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
        const parsed = new Date(dateInput);
        if (!isNaN(parsed)) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        return null;
    }

    if (dateInput instanceof Date) {
        const y = dateInput.getFullYear();
        const m = String(dateInput.getMonth() + 1).padStart(2, '0');
        const d = String(dateInput.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    return null;
}

function cleanDateStr(s) {
    if (!s) return null;
    if (typeof s !== 'string') return formatDateForAPI(s);
    return s.split('T')[0];
}

/* ---------- NEW — showTab() (fix for monthly tab not opening) ---------- */

function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });

    if (tabName === 'month') {
        loadHabitLogsForCurrentMonth()
            .then(() => renderMonthView())
            .catch(err => {
                console.error('Month load error:', err);
                renderMonthView();
            });
    } else {
        renderWeekView();
    }
}

/* ---------- Normalization ---------- */

function normalizeLog(l) {
    if (!l) return null;
    const habitId = (l?.habit?.id ?? l?.habitId ?? l?.habit);
    const id = (l?.id ?? l?.logId ?? l?.habitLogId ?? null);
    return {
        id: id ? Number(id) : null,
        habit: { id: Number(habitId) || 0 },
        date: cleanDateStr(l.date || l.createdAt || l.loggedAt),
        status: (l.status || 'COMPLETED').toUpperCase()
    };
}

/* ---------- API service ---------- */

const apiService = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: { 'Content-Type': 'application/json', ...options.headers },
                ...options
            });

            const text = await response.text();
            let data = null;
            try { data = text ? JSON.parse(text) : null; }
            catch { data = text || null; }

            if (response.status === 204) return { success: true };

            if (!response.ok) {
                const msg = (data && (data.message || data.error || data.msg)) || text || `HTTP ${response.status}`;
                const err = new Error(msg);
                err.status = response.status;
                err.response = data;
                throw err;
            }

            return data;
        } catch (e) {
            console.error('API request failed', e);
            throw e;
        }
    },

    getHabits() {
        return this.request(`/habits/user/${currentUser.id}`);
    },

    getHabitLogs(year, month) {
        return this.request(`/habit-logs?user_id=${currentUser.id}&year=${year}&month=${month}`);
    },

    saveHabitLog(habitLogData) {
        return this.request('/habit-logs', {
            method: 'POST',
            body: JSON.stringify(habitLogData)
        });
    },

    deleteHabitLog(habitId, date) {
        const dateStr = typeof date === 'string' ? date : formatDateForAPI(date);
        const endpoint = `/habit-logs?habit_id=${habitId}&date=${dateStr}`;
        console.log('[apiService] DELETE', endpoint);
        return this.request(endpoint, { method: 'DELETE' });
    },

    getUserStats() {
        return this.request(`/users/${currentUser.id}/stats`);
    }
};

/* ---------- UI helpers ---------- */

function showError(message) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:20px;right:20px;background:#f44336;color:white;padding:10px;border-radius:6px;z-index:9999';
    el.textContent = message || 'Error';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

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
        console.error('Init failed', e);
        showError(e.message || 'Initialization error');
    }
}

/* ---------- Loaders ---------- */

async function loadHabits() {
    try { habits = await apiService.getHabits(); console.log('Loaded habits', habits); }
    catch (e) { console.error('Failed to load habits', e); habits = []; }
}

async function loadHabitLogsForCurrentMonth() {
    try {
        const res = await apiService.getHabitLogs(currentYear, currentMonth + 1);
        habitLogs = Array.isArray(res) ? res.map(normalizeLog).filter(Boolean) : [];
        console.log('Loaded habit logs', habitLogs);
    } catch (e) {
        console.error('Failed to load habit logs', e);
        habitLogs = [];
    }
}

/* ---------- New: fallback stats calculation ---------- */

function computeFallbackStats() {
    const totalHabits = Array.isArray(habits) ? habits.length : 0;

    // count completed logs in current month
    const completedLogs = habitLogs.filter(l => (l.status || '').toUpperCase() === 'COMPLETED');
    const completedCount = completedLogs.length;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // completionRate: completed logs vs possible (habits * daysInMonth)
    let completionRate = 0;
    if (totalHabits > 0 && daysInMonth > 0) {
        completionRate = (completedCount / (totalHabits * daysInMonth)) * 100;
    }

    // Completed dates set (at least one habit completed that day)
    const completedDatesSet = new Set(completedLogs.map(l => cleanDateStr(l.date)));

    // bestStreak: longest consecutive days in month with at least one completion
    let bestStreak = 0;
    let cur = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = formatDateForAPI(new Date(currentYear, currentMonth, d));
        if (completedDatesSet.has(dateStr)) {
            cur++;
            if (cur > bestStreak) bestStreak = cur;
        } else {
            cur = 0;
        }
    }

    // currentStreak: consecutive days up to today (or last day of month if in future)
    let currentStreak = 0;
    const today = new Date();
    const lastDay = new Date(currentYear, currentMonth, Math.min(today.getDate(), daysInMonth));
    for (let i = 0; i < daysInMonth; i++) {
        const d = new Date(lastDay);
        d.setDate(lastDay.getDate() - i);
        if (d.getMonth() !== currentMonth) break;
        const ds = formatDateForAPI(d);
        if (completedDatesSet.has(ds)) currentStreak++;
        else break;
    }

    return {
        currentStreak,
        totalHabits,
        completionRate: Math.round(completionRate),
        bestStreak
    };
}

/* ---------- Stats UI (uses server stats or fallback) ---------- */

async function loadUserStats() {
    try {
        const stats = await apiService.getUserStats();
        updateStatsDisplay(stats);
    } catch (e) {
        console.error('Failed to load user stats', e);
        // fallback if server fails
        updateStatsDisplay(null);
    }
}

function updateStatsDisplay(stats = {}) {
    console.log('updateStatsDisplay — server stats:', stats);

    // determine whether server gave meaningful stats
    const hasServerValues = stats && (
        (typeof stats.currentStreak === 'number' && stats.currentStreak > 0) ||
        (typeof stats.totalHabits === 'number' && stats.totalHabits > 0) ||
        (typeof stats.completionRate === 'number' && stats.completionRate > 0) ||
        (typeof stats.bestStreak === 'number' && stats.bestStreak > 0)
    );

    const computed = (!hasServerValues) ? computeFallbackStats() : null;
    const final = hasServerValues ? stats : computed;

    // safe defaults
    const currentStreakVal = final?.currentStreak ?? 0;
    const totalHabitsVal = final?.totalHabits ?? 0;
    let completionRateVal = final?.completionRate ?? 0;
    if (completionRateVal <= 1 && completionRateVal > 0) completionRateVal = completionRateVal * 100;
    completionRateVal = Math.round(completionRateVal);

    const bestStreakVal = final?.bestStreak ?? 0;

    const currentEl = document.getElementById('currentStreakStat');
    const totalEl = document.getElementById('totalHabitsStat');
    const rateEl = document.getElementById('completionRateStat');
    const bestEl = document.getElementById('bestStreakStat');

    if (currentEl) currentEl.textContent = currentStreakVal;
    if (totalEl) totalEl.textContent = totalHabitsVal;
    if (rateEl) rateEl.textContent = `${completionRateVal}%`;
    if (bestEl) bestEl.textContent = bestStreakVal;
}

/* ---------- Events (unchanged) ---------- */

function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => showTab(tab.getAttribute('data-tab')));
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/login.html';
    });

    document.addEventListener('change', e => {
        const target = e.target;
        if (!target) return;

        if (target.classList.contains('table-checkbox') || target.classList.contains('month-checkbox')) {
            const habitId = Number(target.dataset.habitId);
            const dateRaw = target.dataset.date;
            const formatted = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : formatDateForAPI(dateRaw);

            if (!formatted) {
                target.checked = !target.checked;
                return showError('Invalid date');
            }

            toggleHabitCompletion(habitId, formatted, target.checked)
                .catch(err => console.error(err));
        }
    });
}

/* ---------- Rendering (unchanged) ---------- */

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d;
}

function escapeHtml(str) {
    return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])) : '';
}

function isHabitCompletedOnDate(habitId, dateInput) {
    const dateStr = formatDateForAPI(dateInput);
    return habitLogs.some(log => Number(log.habit.id) === Number(habitId)
        && cleanDateStr(log.date) === dateStr
        && log.status === 'COMPLETED');
}

function renderWeekView() {
    const body = document.getElementById('weekTableBody');
    if (!body) return;

    if (!habits || habits.length === 0) {
        body.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px">No habits yet.</td></tr>`;
        return;
    }

    const start = getStartOfWeek(new Date());
    const week = [...Array(7).keys()].map(i => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));

    body.innerHTML = habits.map(habit => {
        let row = `<td>${escapeHtml(habit.title)}</td>`;
        week.forEach(d => {
            const dateStr = formatDateForAPI(d);
            const checked = isHabitCompletedOnDate(habit.id, dateStr) ? 'checked' : '';
            row += `<td><input type="checkbox" class="table-checkbox" data-habit-id="${habit.id}" data-date="${dateStr}" ${checked}></td>`;
        });
        return `<tr>${row}</tr>`;
    }).join('');
}

function renderMonthView() {
    const head = document.querySelector('#monthTable thead tr');
    const body = document.getElementById('monthTableBody');
    if (!head || !body) return;

    const days = new Date(currentYear, currentMonth + 1, 0).getDate();

    head.innerHTML = '<th>Habits</th>';
    for (let d = 1; d <= days; d++) {
        const date = new Date(currentYear, currentMonth, d);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        head.innerHTML += `<th>${d}<br><small>${dayName}</small></th>`;
    }

    body.innerHTML = habits.map(habit => {
        let row = `<td>${escapeHtml(habit.title || '')}</td>`;
        for (let d = 1; d <= days; d++) {
            const date = new Date(currentYear, currentMonth, d);
            const dateStr = formatDateForAPI(date);
            const isCompleted = isHabitCompletedOnDate(habit.id, dateStr);
            row += `<td><input type="checkbox" class="month-checkbox" data-habit-id="${habit.id}" data-date="${dateStr}" ${isCompleted ? 'checked' : ''}></td>`;
        }
        return `<tr>${row}</tr>`;
    }).join('');

    const label = document.getElementById('currentMonthYear');
    if (label) label.textContent = new Date(currentYear, currentMonth)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/* ---------- Toggle habit completion ---------- */

async function toggleHabitCompletion(habitId, dateStr, completed) {
    try {
        const formatted = formatDateForAPI(dateStr);
        if (!formatted) throw new Error('Invalid date');

        if (completed) {
            await apiService.saveHabitLog({ habitId, date: formatted, status: 'COMPLETED' });
            if (!habitLogs.some(l => Number(l.habit.id) === Number(habitId) && cleanDateStr(l.date) === formatted)) {
                habitLogs.push({ habit: { id: habitId }, date: formatted, status: 'COMPLETED' });
            }
        } else {
            await apiService.deleteHabitLog(habitId, formatted);

            const index = habitLogs.findIndex(l =>
                Number(l.habit.id) === habitId && cleanDateStr(l.date) === formatted
            );
            if (index > -1) habitLogs.splice(index, 1);
        }

        await loadUserStats();
        if (document.querySelector('[data-tab="month"]').classList.contains('active')) renderMonthView();
        if (document.querySelector('[data-tab="week"]').classList.contains('active')) renderWeekView();

    } catch (err) {
        showError(err.message || 'Failed to update habit');
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

window.changeMonth = changeMonth;
