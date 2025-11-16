// Profile functionality
let userSettings = JSON.parse(localStorage.getItem('userSettings')) || {
    habitReminders: true,
    weeklyReports: true,
    goalAchievements: false,
    publicProfile: false,
    shareProgress: true
};

function loadProfileData() {
    if (!currentUser) return;

    // Update user info
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userAvatar').textContent = (currentUser.username || 'U')[0].toUpperCase();

    // Update statistics
    updateProfileStatistics();

    // Load settings
    loadUserSettings();
}

function updateProfileStatistics() {
    const totalHabits = habits.length;

    // Calculate completion rate for current month
    const monthKey = `${currentYear}-${currentMonth}`;
    const monthData = monthlyCompletions[monthKey] || {};
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let totalCompletions = 0;
    let totalPossible = totalHabits * daysInMonth;

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCompletions = monthData[day] || {};
        totalCompletions += Object.values(dayCompletions).filter(Boolean).length;
    }

    const completionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;

    // Update DOM
    document.getElementById('profileCurrentStreak').textContent = document.getElementById('currentStreak').textContent;
    document.getElementById('profileTotalHabits').textContent = totalHabits;
    document.getElementById('profileCompletionRate').textContent = completionRate + '%';
}

function loadUserSettings() {
    document.getElementById('habitReminders').checked = userSettings.habitReminders;
    document.getElementById('weeklyReports').checked = userSettings.weeklyReports;
    document.getElementById('goalAchievements').checked = userSettings.goalAchievements;
    document.getElementById('publicProfile').checked = userSettings.publicProfile;
    document.getElementById('shareProgress').checked = userSettings.shareProgress;
}

function setupProfileEventListeners() {
    // Settings toggle functionality
    document.getElementById('habitReminders').addEventListener('change', function() {
        userSettings.habitReminders = this.checked;
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
        showSuccess('Habit reminders ' + (this.checked ? 'enabled' : 'disabled'));
    });

    document.getElementById('weeklyReports').addEventListener('change', function() {
        userSettings.weeklyReports = this.checked;
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
        showSuccess('Weekly reports ' + (this.checked ? 'enabled' : 'disabled'));
    });

    document.getElementById('goalAchievements').addEventListener('change', function() {
        userSettings.goalAchievements = this.checked;
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
        showSuccess('Goal achievements ' + (this.checked ? 'enabled' : 'disabled'));
    });

    document.getElementById('publicProfile').addEventListener('change', function() {
        userSettings.publicProfile = this.checked;
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
        showSuccess('Public profile ' + (this.checked ? 'enabled' : 'disabled'));
    });

    document.getElementById('shareProgress').addEventListener('change', function() {
        userSettings.shareProgress = this.checked;
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
        showSuccess('Progress sharing ' + (this.checked ? 'enabled' : 'disabled'));
    });
}

// Update showPage function to load profile data when profile page is shown
const originalShowPage = window.showPage;
window.showPage = function(page) {
    originalShowPage(page);

    if (page === 'profile') {
        loadProfileData();
    }
};

// Initialize profile when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupProfileEventListeners();
});