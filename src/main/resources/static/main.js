// Health Tracker with Backend API
console.log('Health Tracker started');

// Configuration
const API_BASE_URL = '/api';
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Global state
let habits = [];
let completedHabits = new Set();
let currentView = 'today';
let sleepStart = 22 * 60; // 22:00 in minutes
let sleepEnd = 7 * 60;    // 07:00 in minutes

// Monthly View Data
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let monthlyCompletions = JSON.parse(localStorage.getItem('monthlyCompletions')) || {};

// Check authentication
if (!currentUser) {
    window.location.href = '/login.html';
}

// API Service
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

    async createHabit(habitData) {
        return this.request('/habits', {
            method: 'POST',
            body: JSON.stringify({
                ...habitData,
                user: { id: currentUser.id }
            })
        });
    },

    async updateHabit(habitId, habitData) {
        return this.request(`/habits/${habitId}`, {
            method: 'PUT',
            body: JSON.stringify(habitData)
        });
    },

    async deleteHabit(habitId) {
        const response = await fetch(`${API_BASE_URL}/habits/${habitId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { success: true };
        }

        return await response.json();
    },

    async test() {
        return this.request('/test');
    },

    // НОВЫЕ МЕТОДЫ ДЛЯ HABIT LOGS
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

// Initialize monthly data
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

function getDayKey(day) {
    return `${currentYear}-${currentMonth + 1}-${day}`;
}

// НОВАЯ ФУНКЦИЯ: Загрузка логов привычек с сервера
async function loadHabitLogsForCurrentMonth() {
    try {
        const logs = await apiService.getHabitLogs(currentYear, currentMonth + 1);
        const monthKey = `${currentYear}-${currentMonth}`;

        // Преобразуем данные с сервера в наш формат
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

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    console.log('Initializing app...');
    console.log('Current user:', currentUser);

    try {
        // Update user greeting
        document.getElementById('userGreeting').textContent = currentUser.username;

        // Test backend connection
        await apiService.test();
        console.log('Backend connection successful');

        // Load habits from backend
        await loadHabits();

        // Setup UI
        setupEventListeners();
        setupSleepTracker();
        updateProgress();
        updateStats();

        // Initialize monthly data
        initializeMonthlyData();

        console.log('App initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Backend connection failed. Using demo mode.');
        loadDemoData();
    }
}

async function loadHabits() {
    try {
        habits = await apiService.getHabits();
        renderCurrentView();
        updateProgress();
        updateStats();
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
    renderCurrentView();
    updateProgress();
    updateStats();
}

function setupEventListeners() {
    // Add habit
    const addBtn = document.getElementById('addHabitBtn');
    const habitInput = document.getElementById('habitInput');

    addBtn.addEventListener('click', addNewHabit);
    habitInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addNewHabit();
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        if (!item.id) {
            item.addEventListener('click', function() {
                const page = this.getAttribute('data-page');
                if (page) showPage(page);
            });
        }
    });

    // Dropdown
    const dropdownButton = document.getElementById('dropdownButton');
    const dropdownMenu = document.getElementById('dropdownMenu');

    dropdownButton.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    document.addEventListener('click', function() {
        dropdownMenu.classList.remove('show');
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const view = this.getAttribute('data-view');
            const text = this.querySelector('i') ? this.innerHTML : this.textContent;
            dropdownButton.innerHTML = text;
            dropdownMenu.classList.remove('show');
            showView(view);
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('monthlyCompletions');
        window.location.href = '/login.html';
    });
}

function setupSleepTracker() {
    const timelineTrack = document.getElementById('timelineTrack');
    const startHandle = document.getElementById('startHandle');
    const endHandle = document.getElementById('endHandle');
    const timelineSelection = document.getElementById('timelineSelection');
    const saveSleepBtn = document.getElementById('saveSleepBtn');

    let isDragging = false;
    let activeHandle = null;

    function updateSleepDisplay() {
        const startTime = formatTime(sleepStart);
        const endTime = formatTime(sleepEnd);
        const duration = calculateSleepDuration();

        document.getElementById('bedtime').textContent = startTime;
        document.getElementById('waketime').textContent = endTime;
        document.getElementById('sleepDuration').textContent = duration;

        updateTimelineVisuals();
    }

    function updateTimelineVisuals() {
        const startPercent = (sleepStart / (24 * 60)) * 100;
        const endPercent = (sleepEnd / (24 * 60)) * 100;

        timelineSelection.style.left = Math.min(startPercent, endPercent) + '%';
        timelineSelection.style.width = Math.abs(endPercent - startPercent) + '%';

        startHandle.style.left = startPercent + '%';
        endHandle.style.left = endPercent + '%';
    }

    function formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    function calculateSleepDuration() {
        let duration = sleepEnd - sleepStart;
        if (duration < 0) duration += 24 * 60; // Overnight sleep

        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;

        return `${hours}h ${minutes}m`;
    }

    function handleDragStart(e, handle) {
        isDragging = true;
        activeHandle = handle;
        e.preventDefault();
    }

    function handleDrag(e) {
        if (!isDragging || !activeHandle) return;

        const rect = timelineTrack.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        const minutes = Math.round((percent / 100) * (24 * 60));

        if (activeHandle === startHandle) {
            sleepStart = minutes;
        } else {
            sleepEnd = minutes;
        }

        updateSleepDisplay();
    }

    function handleDragEnd() {
        isDragging = false;
        activeHandle = null;
    }

    // Event listeners for handles
    [startHandle, endHandle].forEach(handle => {
        handle.addEventListener('mousedown', (e) => handleDragStart(e, handle));
        handle.addEventListener('touchstart', (e) => handleDragStart(e.touches[0], handle));
    });

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('touchmove', (e) => handleDrag(e.touches[0]));
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);

    saveSleepBtn.addEventListener('click', function() {
        showSuccess('Sleep time saved successfully!');
        // Here you would typically save to backend
    });

    updateSleepDisplay();
}

async function addNewHabit() {
    const input = document.getElementById('habitInput');
    const descriptionInput = document.getElementById('habitDescription');
    const frequencyInput = document.getElementById('habitFrequency');

    const title = input.value.trim();
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const frequency = frequencyInput ? frequencyInput.value : 'DAILY';

    if (!title) {
        showError('Please enter a habit name');
        return;
    }

    const addBtn = document.getElementById('addHabitBtn');
    addBtn.disabled = true;
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    try {
        const newHabit = await apiService.createHabit({
            title,
            description,
            frequency
        });

        habits.push(newHabit);
        input.value = '';
        if (descriptionInput) descriptionInput.value = '';

        renderCurrentView();
        updateProgress();
        updateStats();

        showSuccess('Habit added successfully!');
    } catch (error) {
        console.error('Failed to add habit:', error);
        showError('Failed to add habit. Please try again.');
    } finally {
        addBtn.disabled = false;
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Habit';
    }
}

function showView(view) {
    currentView = view;

    document.querySelectorAll('.view-container').forEach(container => {
        container.classList.remove('active');
    });

    const targetView = document.getElementById(`${view}View`);
    if (targetView) {
        targetView.classList.add('active');
    }

    renderCurrentView();
}

function renderCurrentView() {
    switch (currentView) {
        case 'today':
            renderTodayView();
            break;
        case 'week':
            renderWeekView();
            break;
        case 'month':
            renderMonthView();
            break;
    }
}

function renderTodayView() {
    const habitsList = document.getElementById('habitsList');
    if (!habitsList) return;

    if (habits.length === 0) {
        habitsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No habits yet. Add your first habit above!</p>
            </div>
        `;
        return;
    }

    habitsList.innerHTML = habits.map(habit => `
        <div class="habit-item" data-habit-id="${habit.id}">
            <input type="checkbox" class="habit-checkbox" ${completedHabits.has(habit.id) ? 'checked' : ''} 
                   onchange="toggleHabitCompletion(${habit.id})">
            <div class="habit-content">
                <div class="habit-text">${habit.title}</div>
                ${habit.description ? `<div class="habit-description">${habit.description}</div>` : ''}
                <div class="habit-frequency">${habit.frequency}</div>
            </div>
            <button class="delete-habit-btn" onclick="deleteHabit(${habit.id})">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `).join('');
}

function renderWeekView() {
    const weekTableBody = document.getElementById('weekTableBody');
    if (!weekTableBody) return;

    weekTableBody.innerHTML = habits.map(habit => {
        let cells = `<td>${habit.title}</td>`;
        for (let i = 0; i < 7; i++) {
            cells += `<td><input type="checkbox" class="table-checkbox"></td>`;
        }
        return `<tr>${cells}</tr>`;
    }).join('');
}

function renderMonthView() {
    initializeMonthlyData();
    updateMonthlyProgress();
}

// Update monthly progress
async function updateMonthlyProgress() {
    await loadHabitLogsForCurrentMonth();
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

    // Adjust Monday as first day (0 = Sunday, 1 = Monday, etc.)
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
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
        `;

        const dayKey = getDayKey(day);
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

    // Header row with days
    const headerRow = document.createElement('div');
    headerRow.className = 'completion-header';
    headerRow.textContent = 'Habits/Days';
    completionGrid.appendChild(headerRow);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= 31; day++) {
        const dayHeader = document.createElement('div');
        dayHeader.className = `completion-header ${day > daysInMonth ? 'empty' : ''}`;
        dayHeader.textContent = day > daysInMonth ? '' : day;
        completionGrid.appendChild(dayHeader);
    }

    // Habits rows
    const monthKey = `${currentYear}-${currentMonth}`;
    habits.forEach(habit => {
        // Habit name
        const habitName = document.createElement('div');
        habitName.className = 'completion-habit-name';
        habitName.textContent = habit.title;
        completionGrid.appendChild(habitName);

        // Completion cells
        for (let day = 1; day <= 31; day++) {
            const dayCell = document.createElement('div');

            if (day > daysInMonth) {
                dayCell.className = 'completion-day empty';
            } else {
                const dayKey = getDayKey(day);
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

    // Calculate streaks and completions
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCompletions = monthData[day] || {};
        const completedCount = Object.values(dayCompletions).filter(Boolean).length;
        const totalHabits = habits.length;

        totalCompletions += completedCount;

        // Streak calculation (all habits completed)
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

    // Update DOM
    document.getElementById('monthCurrentStreak').textContent = currentStreak;
    document.getElementById('monthBestStreak').textContent = bestStreak;
    document.getElementById('monthCompletionRate').textContent = completionRate + '%';
    document.getElementById('currentMonthYear').textContent =
        new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Add animation for high streaks
    if (currentStreak >= 7) {
        document.getElementById('monthCurrentStreak').classList.add('streak-high');
    } else {
        document.getElementById('monthCurrentStreak').classList.remove('streak-high');
    }
}

// ИЗМЕНЕННАЯ ФУНКЦИЯ: Переключение выполнения всех привычек за день
async function toggleDayCompletion(day) {
    const monthKey = `${currentYear}-${currentMonth}`;
    if (!monthlyCompletions[monthKey][day]) {
        monthlyCompletions[monthKey][day] = {};
    }

    const dayCompletions = monthlyCompletions[monthKey][day];
    const allCompleted = habits.every(habit => dayCompletions[habit.id]);

    // Для каждой привычки вызываем toggleHabitDayCompletion
    for (const habit of habits) {
        const shouldComplete = !allCompleted;
        if (shouldComplete !== dayCompletions[habit.id]) {
            await toggleHabitDayCompletion(habit.id, day);
        }
    }
}

// ИЗМЕНЕННАЯ ФУНКЦИЯ: Переключение выполнения привычки за конкретный день
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
        updateMonthlyProgress();

    } catch (error) {
        console.error('Failed to update habit log:', error);
        showError('Failed to update habit completion. Please try again.');
    }
}

// Navigation between months
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
    updateMonthlyProgress();
}

function updateProgress() {
    const total = habits.length;
    const completed = completedHabits.size;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update progress circle
    const progressCircle = document.getElementById('progressCircle');
    if (progressCircle) {
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (progress / 100) * circumference;
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = offset;
    }

    // Update progress text
    document.getElementById('progressPercent').textContent = progress + '%';
    document.getElementById('totalHabits').textContent = total;
    document.getElementById('completedHabits').textContent = completed;
}

function updateStats() {
    const total = habits.length;
    const completed = completedHabits.size;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('completedToday').textContent = `${completed}/${total}`;
    document.getElementById('completionRate').textContent = progress + '%';
    document.getElementById('habitsCount').textContent = `${total} habits`;

    // Simple streak calculation (always increment if all completed)
    let streak = parseInt(document.getElementById('currentStreak').textContent) || 0;
    if (completed === total && total > 0) {
        streak++;
    } else if (completed < total) {
        streak = 0;
    }
    document.getElementById('currentStreak').textContent = streak;
}

function toggleHabitCompletion(habitId) {
    if (completedHabits.has(habitId)) {
        completedHabits.delete(habitId);
    } else {
        completedHabits.add(habitId);
    }
    updateProgress();
    updateStats();
}

async function deleteHabit(habitId) {
    console.log('Deleting habit:', habitId);
    console.log('All habits:', habits.map(h => h.id));

    if (!confirm('Are you sure you want to delete this habit?')) return;

    try {
        await apiService.deleteHabit(habitId);

        habits = habits.filter(habit => {
            return Number(habit.id) !== Number(habitId);
        });

        completedHabits.delete(habitId);

        renderCurrentView();
        updateProgress();
        updateStats();

        showSuccess('Habit deleted successfully!');
    } catch (error) {
        console.error('Failed to delete habit:', error);
        showError('Failed to delete habit. Please try again.');
    }
}

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });

    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const activeNav = document.querySelector(`[data-page="${page}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
}

function showError(message) {
    // Simple notification - you can replace with a better notification system
    alert('Error: ' + message);
}

function showSuccess(message) {
    // Simple notification - you can replace with a better notification system
    alert('Success: ' + message);
}

// Make functions global for HTML onclick
window.deleteHabit = deleteHabit;
window.toggleHabitCompletion = toggleHabitCompletion;
window.changeMonth = changeMonth;
window.toggleDayCompletion = toggleDayCompletion;
window.toggleHabitDayCompletion = toggleHabitDayCompletion;