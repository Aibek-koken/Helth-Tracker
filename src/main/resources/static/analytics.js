// Analytics Dashboard
console.log('Analytics Dashboard started');

// Configuration
const API_BASE_URL = '/api';
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Global state
let habits = [];
let monthlyCompletions = JSON.parse(localStorage.getItem('monthlyCompletions')) || {};

// Monthly View Data
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Check authentication
if (!currentUser) {
    window.location.href = '/login.html';
}

// API Service (same as main.js)
const apiService = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    async getHabits() {
        if (!currentUser || !currentUser.id) {
            throw new Error('User not authenticated');
        }
        return this.request(`/habits/user/${currentUser.id}`);
    },

    async getHabitLogs(year, month) {
        if (!currentUser || !currentUser.id) {
            throw new Error('User not authenticated');
        }
        return this.request(`/habit-logs?user_id=${currentUser.id}&year=${year}&month=${month}`);
    },

    async saveHabitLog(habitLogData) {
        return this.request('/habit-logs', {
            method: 'POST',
            body: JSON.stringify(habitLogData)
        });
    },

    async deleteHabitLog(habitId, date) {
        const response = await fetch(`${API_BASE_URL}/habit-logs?habit_id=${habitId}&date=${date}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { success: true };
        }

        return await response.json();
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeAnalytics();
});

async function initializeAnalytics() {
    console.log('Initializing analytics...');

    try {
        await loadHabits();
        setupEventListeners();

        // Initialize monthly data
        initializeMonthlyData();

        // Load initial view
        showTab('week');
        updateStatsSummary();

        console.log('Analytics initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize analytics:', error);
        showError('Failed to load analytics data.');
        loadDemoData();
    }
}

async function loadHabits() {
    try {
        habits = await apiService.getHabits();
        await loadHabitLogsForCurrentMonth();
        renderWeekView();
        updateMonthView();
    } catch (error) {
        console.error('Failed to load habits:', error);
        throw error;
    }
}

function loadDemoData() {
    habits = [
        { id: 1, title: 'Morning Exercise', description: '30 min workout', frequency: 'DAILY' },
        { id: 2, title: 'Drink Water', description: '8 glasses daily', frequency: 'DAILY' },
        { id: 3, title: 'Meditation', description: '10 min mindfulness', frequency: 'DAILY' }
    ];
    renderWeekView();
    updateMonthView();
    updateStatsSummary();
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('monthlyCompletions');
        window.location.href = '/login.html';
    });
}

function showTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Show active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Load specific tab data
    switch(tabName) {
        case 'week':
            renderWeekView();
            break;
        case 'month':
            updateMonthView();
            break;
    }
}

function updateStatsSummary() {
    // Calculate stats from habits data
    const totalHabits = habits.length;
    const completionRate = calculateAverageCompletion();
    const streak = calculateCurrentStreak();
    const bestStreak = calculateBestStreak();

    // Update DOM
    document.getElementById('currentStreakStat').textContent = streak;
    document.getElementById('completionRateStat').textContent = completionRate + '%';
    document.getElementById('totalHabitsStat').textContent = totalHabits;
    document.getElementById('bestStreakStat').textContent = bestStreak;
}

function calculateAverageCompletion() {
    const monthKey = `${currentYear}-${currentMonth}`;
    const monthData = monthlyCompletions[monthKey] || {};
    let totalCompletions = 0;
    let totalPossible = 0;

    for (const day in monthData) {
        const dayCompletions = monthData[day];
        totalCompletions += Object.values(dayCompletions).filter(Boolean).length;
        totalPossible += habits.length;
    }

    return totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
}

function calculateCurrentStreak() {
    // Simple streak calculation
    // You can implement more sophisticated streak tracking
    return 5; // Example value
}

function calculateBestStreak() {
    return 10; // Example value
}

// WEEK VIEW FUNCTIONS
function renderWeekView() {
    const weekTableBody = document.getElementById('weekTableBody');
    if (!weekTableBody) return;

    if (habits.length === 0) {
        weekTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <i class="fas fa-clipboard-list" style="font-size: 48px; opacity: 0.5; margin-bottom: 16px;"></i>
                    <p>No habits yet. Add habits in Daily Tracker!</p>
                </td>
            </tr>
        `;
        return;
    }

    weekTableBody.innerHTML = habits.map(habit => {
        let cells = `<td>${habit.title}</td>`;
        for (let i = 0; i < 7; i++) {
            const isCompleted = checkDayCompletion(habit.id, i);
            cells += `
                <td>
                    <input type="checkbox" class="table-checkbox" 
                           ${isCompleted ? 'checked' : ''}
                           onchange="toggleWeekCompletion(${habit.id}, ${i})">
                </td>`;
        }
        return `<tr>${cells}</tr>`;
    }).join('');
}

function checkDayCompletion(habitId, dayOffset) {
    // Check if habit was completed on specific day of current week
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - today.getDay() + dayOffset);

    const dateKey = `${targetDate.getFullYear()}-${targetDate.getMonth() + 1}-${targetDate.getDate()}`;
    const monthKey = `${targetDate.getFullYear()}-${targetDate.getMonth()}`;
    const day = targetDate.getDate();

    return monthlyCompletions[monthKey]?.[day]?.[habitId] || false;
}

function toggleWeekCompletion(habitId, dayOffset) {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - today.getDay() + dayOffset);

    const dateStr = `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}-${targetDate.getDate().toString().padStart(2, '0')}`;
    const monthKey = `${targetDate.getFullYear()}-${targetDate.getMonth()}`;
    const day = targetDate.getDate();

    const currentStatus = checkDayCompletion(habitId, dayOffset);

    if (currentStatus) {
        // Remove completion
        if (monthlyCompletions[monthKey] && monthlyCompletions[monthKey][day]) {
            delete monthlyCompletions[monthKey][day][habitId];
        }
        apiService.deleteHabitLog(habitId, dateStr).catch(console.error);
    } else {
        // Add completion
        if (!monthlyCompletions[monthKey]) monthlyCompletions[monthKey] = {};
        if (!monthlyCompletions[monthKey][day]) monthlyCompletions[monthKey][day] = {};
        monthlyCompletions[monthKey][day][habitId] = true;
        apiService.saveHabitLog({
            habitId: habitId,
            date: dateStr,
            status: 'COMPLETED'
        }).catch(console.error);
    }

    saveMonthlyData();
    updateStatsSummary();
}

// MONTH VIEW FUNCTIONS (copied from main.js)
function initializeMonthlyData() {
    const monthKey = `${currentYear}-${currentMonth}`;
    if (!monthlyCompletions[monthKey]) {
        monthlyCompletions[monthKey] = {};
    }
    saveMonthlyData();
}

function saveMonthlyData() {
    localStorage.setItem('monthlyCompletions', JSON.stringify(monthlyCompletions));
}

async function loadHabitLogsForCurrentMonth() {
    try {
        const logs = await apiService.getHabitLogs(currentYear, currentMonth + 1);
        const monthKey = `${currentYear}-${currentMonth}`;

        logs.forEach(log => {
            const date = new Date(log.date);
            const day = date.getDate();

            if (!monthlyCompletions[monthKey][day]) {
                monthlyCompletions[monthKey][day] = {};
            }
            monthlyCompletions[monthKey][day][log.habit.id] = true;
        });

        saveMonthlyData();
    } catch (error) {
        console.error('Failed to load habit logs:', error);
    }
}

function updateMonthView() {
    updateCalendar();
    updateCompletionGrid();
    updateMonthlyStats();
}

function updateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;

    const today = new Date();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let startDay = firstDay === 0 ? 6 : firstDay - 1;
    calendarGrid.innerHTML = '';

    // Empty days at start
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }

    // Calendar days
    const monthKey = `${currentYear}-${currentMonth}`;
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day current-month';
        dayElement.innerHTML = `<div class="day-number">${day}</div>`;

        const dayCompletions = monthlyCompletions[monthKey]?.[day] || {};
        const completedCount = Object.values(dayCompletions).filter(Boolean).length;
        const totalHabits = habits.length;

        if (completedCount > 0) {
            if (completedCount === totalHabits && totalHabits > 0) {
                dayElement.classList.add('completed');
            } else {
                dayElement.classList.add('partial');
            }
            dayElement.innerHTML += `<div class="completion-count">${completedCount}/${totalHabits}</div>`;
        }

        // Highlight today
        if (today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear) {
            dayElement.classList.add('today');
        }

        dayElement.addEventListener('click', () => {
            toggleDayCompletion(day);
        });

        calendarGrid.appendChild(dayElement);
    }
}

function updateCompletionGrid() {
    const completionGrid = document.getElementById('completionGrid');
    if (!completionGrid) return;

    completionGrid.innerHTML = '';
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthKey = `${currentYear}-${currentMonth}`;

    // Header row
    const headerRow = document.createElement('div');
    headerRow.className = 'completion-header';
    headerRow.textContent = 'Habits/Days';
    completionGrid.appendChild(headerRow);

    for (let day = 1; day <= 31; day++) {
        const dayHeader = document.createElement('div');
        dayHeader.className = `completion-header ${day > daysInMonth ? 'empty' : ''}`;
        dayHeader.textContent = day > daysInMonth ? '' : day;
        completionGrid.appendChild(dayHeader);
    }

    // Habits rows
    habits.forEach(habit => {
        const habitName = document.createElement('div');
        habitName.className = 'completion-habit-name';
        habitName.textContent = habit.title;
        completionGrid.appendChild(habitName);

        for (let day = 1; day <= 31; day++) {
            const dayCell = document.createElement('div');

            if (day > daysInMonth) {
                dayCell.className = 'completion-day empty';
            } else {
                const isCompleted = monthlyCompletions[monthKey]?.[day]?.[habit.id] || false;
                dayCell.className = `completion-day ${isCompleted ? 'completed' : ''}`;
                dayCell.innerHTML = `
                    <div class="day-number">${day}</div>
                    <div class="habit-status">${isCompleted ? '✓' : '○'}</div>
                `;

                dayCell.addEventListener('click', () => {
                    toggleHabitDayCompletion(habit.id, day);
                });
            }

            completionGrid.appendChild(dayCell);
        }
    });
}

async function toggleHabitDayCompletion(habitId, day) {
    const monthKey = `${currentYear}-${currentMonth}`;
    const date = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    if (!monthlyCompletions[monthKey][day]) {
        monthlyCompletions[monthKey][day] = {};
    }

    const currentStatus = monthlyCompletions[monthKey][day][habitId];
    const newStatus = !currentStatus;

    try {
        if (newStatus) {
            await apiService.saveHabitLog({
                habitId: habitId,
                date: date,
                status: 'COMPLETED'
            });
        } else {
            await apiService.deleteHabitLog(habitId, date);
        }

        monthlyCompletions[monthKey][day][habitId] = newStatus;
        saveMonthlyData();
        updateMonthView();
        updateStatsSummary();

    } catch (error) {
        console.error('Failed to update habit log:', error);
        showError('Failed to update habit completion. Please try again.');
    }
}

async function toggleDayCompletion(day) {
    const monthKey = `${currentYear}-${currentMonth}`;
    if (!monthlyCompletions[monthKey][day]) {
        monthlyCompletions[monthKey][day] = {};
    }

    const dayCompletions = monthlyCompletions[monthKey][day];
    const allCompleted = habits.every(habit => dayCompletions[habit.id]);

    for (const habit of habits) {
        const shouldComplete = !allCompleted;
        if (shouldComplete !== dayCompletions[habit.id]) {
            await toggleHabitDayCompletion(habit.id, day);
        }
    }
}

function updateMonthlyStats() {
    const monthKey = `${currentYear}-${currentMonth}`;
    const monthData = monthlyCompletions[monthKey] || {};
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let totalCompletions = 0;
    let totalPossible = habits.length * daysInMonth;
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    const currentDay = today.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCompletions = monthData[day] || {};
        const completedCount = Object.values(dayCompletions).filter(Boolean).length;
        const totalHabits = habits.length;

        totalCompletions += completedCount;

        if (completedCount === totalHabits && totalHabits > 0) {
            tempStreak++;
            if (day <= currentDay) {
                currentStreak = tempStreak;
            }
            bestStreak = Math.max(bestStreak, tempStreak);
        } else {
            tempStreak = 0;
        }
    }

    const completionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;

    document.getElementById('monthCurrentStreak').textContent = currentStreak;
    document.getElementById('monthBestStreak').textContent = bestStreak;
    document.getElementById('monthCompletionRate').textContent = completionRate + '%';
    document.getElementById('currentMonthYear').textContent =
        new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (currentStreak >= 7) {
        document.getElementById('monthCurrentStreak').classList.add('streak-high');
    } else {
        document.getElementById('monthCurrentStreak').classList.remove('streak-high');
    }
}

function changeMonth(direction) {
    currentMonth += direction;

    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }

    initializeMonthlyData();
    updateMonthView();
}

function showError(message) {
    alert('Error: ' + message);
}

// Make functions global
window.changeMonth = changeMonth;
window.toggleDayCompletion = toggleDayCompletion;
window.toggleHabitDayCompletion = toggleHabitDayCompletion;
window.toggleWeekCompletion = toggleWeekCompletion;