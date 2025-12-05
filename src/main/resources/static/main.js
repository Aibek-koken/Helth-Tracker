// Health Tracker with Backend API - DAILY TRACKER ONLY
console.log('Health Tracker started - Daily Tracker Only');

// Configuration
const API_BASE_URL = '/api';
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Global state
let habits = [];
let completedHabits = new Set();

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
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    console.log('Initializing daily tracker...');
    console.log('Current user:', currentUser);

    try {
        // NEW: Check for page parameter in URL FIRST
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');

        if (pageParam) {
            // Show the requested page immediately
            showPage(pageParam);
        }

        // Update user greeting
        document.getElementById('userGreeting').textContent = currentUser.username;

        // Test backend connection
        await apiService.test();
        console.log('Backend connection successful');

        // Load habits from backend
        await loadHabits();

        // Setup UI
        setupEventListeners();
        updateProgress();
        updateStats();

        console.log('Daily tracker initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Backend connection failed. Using demo mode.');
        loadDemoData();
    }
}

async function loadHabits() {
    try {
        habits = await apiService.getHabits();
        renderTodayView();
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
    renderTodayView();
    updateProgress();
    updateStats();
}

function setupEventListeners() {
    // Add habit
    const addBtn = document.getElementById('addHabitBtn');
    const habitInput = document.getElementById('habitInput');

    // Add post
    const addPostBtn = document.getElementById('addPostBtn');
    if (addPostBtn) {
        addPostBtn.addEventListener('click', addNewPost);
    }

    addBtn.addEventListener('click', addNewHabit);
    habitInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addNewHabit();
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        if (!item.id && !item.onclick) {
            item.addEventListener('click', function() {
                const page = this.getAttribute('data-page');
                if (page) showPage(page);
            });
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    });
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(event) {
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');

        if (pageParam) {
            showPage(pageParam);
        } else {
            showPage('tracker');
        }
    });
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

        renderTodayView();
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

        renderTodayView();
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

    // NEW: Update URL without reloading page
    const newUrl = `${window.location.pathname}?page=${page}`;
    window.history.pushState({ page: page }, '', newUrl);

    // NEW: Load specific page data if needed
    if (page === 'posts') {
        loadPosts();
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

// Community functionality (unchanged)
let posts = [];
let postStats = {};

// Load posts from backend
async function loadPosts() {
    try {
        posts = await apiService.request('/posts');
        await loadPostsStats();
        renderPosts();
    } catch (error) {
        console.error('Failed to load posts:', error);
        // For demo, load some sample posts
        loadDemoPosts();
    }
}

async function loadPostsStats() {
    for (const post of posts) {
        try {
            const stats = await apiService.request(`/posts/${post.id}/stats`);
            postStats[post.id] = stats;

            // Check if current user liked this post
            const likeCheck = await apiService.request(`/likes/check?postId=${post.id}&userId=${currentUser.id}`);
            post.likedByCurrentUser = likeCheck.liked;
        } catch (error) {
            console.error(`Failed to load stats for post ${post.id}:`, error);
            postStats[post.id] = { likeCount: 0, commentCount: 0 };
            post.likedByCurrentUser = false;
        }
    }
}

function loadDemoPosts() {
    posts = [
        {
            id: 1,
            title: "30 Days of Meditation",
            body: "Just completed 30 days of daily meditation! Started with just 5 minutes and now up to 20 minutes. The mental clarity is amazing! 🧘‍♂️",
            topic: "mental",
            user: { username: "MindfulMax", id: 2 },
            createdAt: "2024-01-15T08:00:00",
            likedByCurrentUser: false
        },
        {
            id: 2,
            title: "Meal Prep Sunday Success",
            body: "Spent 2 hours on Sunday preparing healthy lunches for the week. Chicken, quinoa, and roasted veggies! So worth it for staying on track during busy weekdays. 🥗",
            topic: "nutrition",
            user: { username: "HealthyHannah", id: 3 },
            createdAt: "2024-01-14T18:30:00",
            likedByCurrentUser: true
        }
    ];

    postStats = {
        1: { likeCount: 12, commentCount: 3 },
        2: { likeCount: 24, commentCount: 7 }
    };

    renderPosts();
}

function renderPosts() {
    const postsFeed = document.getElementById('postsFeed');
    if (!postsFeed) return;

    if (posts.length === 0) {
        postsFeed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>No posts yet. Be the first to share your achievement!</p>
            </div>
        `;
        return;
    }

    postsFeed.innerHTML = posts.map(post => {
        const stats = postStats[post.id] || { likeCount: 0, commentCount: 0 };
        const postDate = new Date(post.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-category ${post.topic}">${getCategoryDisplayName(post.topic)}</div>
            </div>
            <div class="post-title">${post.title}</div>
            <div class="post-content">${post.body}</div>
            <div class="post-meta">
                <div class="post-author">
                    <i class="fas fa-user"></i>
                    ${post.user.username}
                </div>
                <div class="post-date">
                    <i class="fas fa-clock"></i>
                    ${postDate}
                </div>
            </div>
            <div class="post-actions">
                <button class="action-btn like-btn ${post.likedByCurrentUser ? 'active' : ''}" 
                        onclick="toggleLike(${post.id})">
                    <i class="${post.likedByCurrentUser ? 'fas' : 'far'} fa-heart"></i>
                    <span class="like-count">${stats.likeCount}</span>
                </button>
                <button class="action-btn comment-btn" onclick="toggleComments(${post.id})">
                    <i class="far fa-comment"></i>
                    <span class="comment-count">${stats.commentCount}</span>
                </button>
            </div>
            <div class="comments-section" id="comments-${post.id}" style="display: none;">
                <div class="comments-list" id="comments-list-${post.id}">
                    <div class="no-comments">Loading comments...</div>
                </div>
                <div class="add-comment">
                    <input type="text" class="comment-input" id="comment-input-${post.id}" 
                           placeholder="Add a comment..." onkeypress="handleCommentKeypress(event, ${post.id})">
                    <button class="add-comment-btn" onclick="addComment(${post.id})">
                        <i class="fas fa-paper-plane"></i> Post
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    // Update posts count
    document.getElementById('postsCount').textContent = `${posts.length} posts`;
}

function getCategoryDisplayName(topic) {
    const categories = {
        fitness: "🏃 Fitness & Sport",
        nutrition: "🥗 Nutrition",
        sleep: "😴 Sleep & Rest",
        mental: "🧠 Mental Health",
        other: "💭 Other"
    };
    return categories[topic] || topic;
}

async function toggleLike(postId) {
    try {
        const response = await apiService.request('/likes', {
            method: 'POST',
            body: JSON.stringify({
                postId: postId,
                userId: currentUser.id
            })
        });

        if (response.success) {
            // Update UI
            const post = posts.find(p => p.id === postId);
            const likeBtn = document.querySelector(`.post-card[data-post-id="${postId}"] .like-btn`);
            const likeIcon = likeBtn.querySelector('i');
            const likeCount = likeBtn.querySelector('.like-count');

            if (response.liked) {
                post.likedByCurrentUser = true;
                likeBtn.classList.add('active');
                likeIcon.className = 'fas fa-heart';
                likeCount.textContent = parseInt(likeCount.textContent) + 1;
            } else {
                post.likedByCurrentUser = false;
                likeBtn.classList.remove('active');
                likeIcon.className = 'far fa-heart';
                likeCount.textContent = parseInt(likeCount.textContent) - 1;
            }

            showSuccess(response.message);
        }
    } catch (error) {
        console.error('Failed to toggle like:', error);
        showError('Failed to update like. Please try again.');
    }
}

async function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const isVisible = commentsSection.style.display !== 'none';

    if (!isVisible) {
        // Load comments for this post
        await loadComments(postId);
    }

    commentsSection.style.display = isVisible ? 'none' : 'block';
}

async function loadComments(postId) {
    try {
        const comments = await apiService.request(`/comments/post/${postId}`);
        renderComments(postId, comments);
    } catch (error) {
        console.error('Failed to load comments:', error);
        renderComments(postId, []);
    }
}

function renderComments(postId, comments) {
    const commentsList = document.getElementById(`comments-list-${postId}`);

    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
        return;
    }

    commentsList.innerHTML = comments.map(comment => {
        const commentDate = new Date(comment.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
        <div class="comment">
            <div class="comment-header">
                <div class="comment-author">${comment.user.username}</div>
                <div class="comment-date">${commentDate}</div>
            </div>
            <div class="comment-content">${comment.body}</div>
        </div>
        `;
    }).join('');
}

function handleCommentKeypress(event, postId) {
    if (event.key === 'Enter') {
        addComment(postId);
    }
}

async function addComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const content = commentInput.value.trim();

    if (!content) {
        showError('Please enter a comment');
        return;
    }

    const addBtn = document.querySelector(`#comments-${postId} .add-comment-btn`);
    const originalText = addBtn.innerHTML;
    addBtn.disabled = true;
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const response = await apiService.request('/comments', {
            method: 'POST',
            body: JSON.stringify({
                postId: postId,
                userId: currentUser.id,
                content: content
            })
        });

        if (response.success) {
            commentInput.value = '';

            // Update comment count
            const commentBtn = document.querySelector(`.post-card[data-post-id="${postId}"] .comment-btn`);
            const commentCount = commentBtn.querySelector('.comment-count');
            commentCount.textContent = parseInt(commentCount.textContent) + 1;

            // Reload comments to show the new one
            await loadComments(postId);

            showSuccess('Comment added successfully!');
        }
    } catch (error) {
        console.error('Failed to add comment:', error);
        showError('Failed to add comment. Please try again.');
    } finally {
        addBtn.disabled = false;
        addBtn.innerHTML = originalText;
    }
}

async function addNewPost() {
    const categorySelect = document.getElementById('postCategory');
    const titleInput = document.getElementById('postTitle');
    const contentInput = document.getElementById('postContent');

    const category = categorySelect.value;
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title) {
        showError('Please enter a post title');
        return;
    }

    if (!content) {
        showError('Please enter post content');
        return;
    }

    const addBtn = document.getElementById('addPostBtn');
    addBtn.disabled = true;
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sharing...';

    try {
        const response = await apiService.request('/posts', {
            method: 'POST',
            body: JSON.stringify({
                userId: currentUser.id,
                title: title,
                content: content,
                category: category
            })
        });

        if (response.success) {
            // Add new post to the beginning of the list
            posts.unshift(response.post);
            postStats[response.post.id] = { likeCount: 0, commentCount: 0 };

            renderPosts();

            // Clear inputs
            titleInput.value = '';
            contentInput.value = '';

            showSuccess('Post shared successfully!');
        }
    } catch (error) {
        console.error('Failed to add post:', error);
        showError('Failed to share post. Please try again.');
    } finally {
        addBtn.disabled = false;
        addBtn.innerHTML = '<i class="fas fa-share"></i> Share with Community';
    }
}

// Update showPage function to load posts when community page is shown
const originalShowPage = window.showPage;
window.showPage = function(page) {
    originalShowPage(page);

    if (page === 'posts') {
        loadPosts();
    }
};

// Make functions global
window.toggleLike = toggleLike;
window.toggleComments = toggleComments;
window.addComment = addComment;
window.handleCommentKeypress = handleCommentKeypress;
window.addNewPost = addNewPost;