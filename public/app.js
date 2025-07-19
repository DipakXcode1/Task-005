// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');
const API_BASE_URL = 'http://localhost:3000/api';

// DOM elements
const authPages = document.getElementById('authPages');
const appPages = document.getElementById('appPages');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');
const navLinks = document.querySelectorAll('.nav-link');
const pageContents = document.querySelectorAll('.page-content');
const loadingSpinner = document.getElementById('loadingSpinner');
const toastContainer = document.getElementById('toastContainer');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    if (authToken) {
        // Verify token and load user data
        verifyToken();
    } else {
        showAuthPages();
    }
}

function setupEventListeners() {
    // Auth form events
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
    logoutBtn.addEventListener('click', handleLogout);

    // Navigation events
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateToPage(page);
        });
    });

    // Post creation events
    document.getElementById('createPostBtn').addEventListener('click', createPost);
    document.getElementById('postMedia').addEventListener('change', handleMediaUpload);

    // Search events
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Profile events
    document.getElementById('editProfileBtn').addEventListener('click', showEditProfileModal);
    document.getElementById('closeEditProfileModal').addEventListener('click', hideEditProfileModal);
    document.getElementById('cancelEditProfile').addEventListener('click', hideEditProfileModal);
    document.getElementById('editProfileForm').addEventListener('submit', updateProfile);
    document.getElementById('avatarUpload').addEventListener('change', handleAvatarUpload);

    // Profile tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchProfileTab(tab);
        });
    });
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    showLoading();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showAppPages();
            loadFeed();
            showToast('Login successful!', 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Login failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    showLoading();

    const username = document.getElementById('registerUsername').value;
    const fullName = document.getElementById('registerFullName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const bio = document.getElementById('registerBio').value;

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, fullName, email, password, bio })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showAppPages();
            loadFeed();
            showToast('Account created successfully!', 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Registration failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser?.id || 'me'}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showAppPages();
            loadFeed();
        } else {
            handleLogout();
        }
    } catch (error) {
        handleLogout();
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showAuthPages();
    showToast('Logged out successfully', 'success');
}

// UI Navigation functions
function showAuthPages() {
    authPages.classList.add('active');
    appPages.classList.remove('active');
}

function showAppPages() {
    authPages.classList.remove('active');
    appPages.classList.add('active');
    updateUserAvatar();
}

function showLoginForm() {
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
}

function showRegisterForm() {
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
}

function navigateToPage(page) {
    // Update navigation
    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Update content
    pageContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${page}Page`).classList.add('active');

    // Load page-specific content
    switch (page) {
        case 'feed':
            loadFeed();
            break;
        case 'explore':
            loadExplore();
            break;
        case 'notifications':
            loadNotifications();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Post functions
async function createPost() {
    const content = document.getElementById('postContent').value;
    const mediaFile = document.getElementById('postMedia').files[0];

    if (!content && !mediaFile) {
        showToast('Please add some content or media to your post', 'warning');
        return;
    }

    showLoading();

    const formData = new FormData();
    formData.append('content', content);
    if (mediaFile) {
        formData.append('media', mediaFile);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('postContent').value = '';
            document.getElementById('postMedia').value = '';
            loadFeed();
            showToast('Post created successfully!', 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to create post. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function loadFeed() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const posts = await response.json();
        renderPosts(posts, 'postsContainer');
    } catch (error) {
        showToast('Failed to load feed', 'error');
    }
}

function renderPosts(posts, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (posts.length === 0) {
        container.innerHTML = '<p class="no-posts">No posts to show</p>';
        return;
    }

    posts.forEach(post => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    postDiv.innerHTML = `
        <div class="post-header">
            <img src="${post.user.avatar || ''}" alt="Avatar" class="post-user-avatar" onerror="this.style.display='none'">
            <div class="post-user-info">
                <h4>${post.user.fullName}</h4>
                <p>@${post.user.username} • ${formatDate(post.createdAt)}</p>
            </div>
        </div>
        <div class="post-content">
            ${post.content}
        </div>
        ${post.media ? `
            <div class="post-media">
                ${post.media.match(/\.(mp4|mov|avi)$/i) ? 
                    `<video controls><source src="${post.media}" type="video/mp4"></video>` :
                    `<img src="${post.media}" alt="Post media">`
                }
            </div>
        ` : ''}
        ${post.tags && post.tags.length > 0 ? `
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
            </div>
        ` : ''}
        <div class="post-actions-bar">
            <div class="post-action ${post.isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                <i class="fas fa-heart"></i>
                <span>${post.likesCount || 0}</span>
            </div>
            <div class="post-action" onclick="toggleComments('${post.id}')">
                <i class="fas fa-comment"></i>
                <span>${post.commentsCount || 0}</span>
            </div>
        </div>
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
            <div class="comments-list" id="comments-list-${post.id}"></div>
            <div class="add-comment">
                <textarea class="comment-input" placeholder="Write a comment..." id="comment-input-${post.id}"></textarea>
                <button class="btn-comment" onclick="addComment('${post.id}')">Comment</button>
            </div>
        </div>
    `;
    return postDiv;
}

async function toggleLike(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            // Update the like button
            const likeButton = document.querySelector(`[onclick="toggleLike('${postId}')"]`);
            const likeCount = likeButton.querySelector('span');
            
            if (data.isLiked) {
                likeButton.classList.add('liked');
            } else {
                likeButton.classList.remove('liked');
            }
            
            likeCount.textContent = data.likesCount;
        }
    } catch (error) {
        showToast('Failed to like post', 'error');
    }
}

async function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const isVisible = commentsSection.style.display !== 'none';

    if (!isVisible) {
        commentsSection.style.display = 'block';
        await loadComments(postId);
    } else {
        commentsSection.style.display = 'none';
    }
}

async function loadComments(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const comments = await response.json();
        renderComments(comments, postId);
    } catch (error) {
        showToast('Failed to load comments', 'error');
    }
}

function renderComments(comments, postId) {
    const container = document.getElementById(`comments-list-${postId}`);
    container.innerHTML = '';

    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <img src="${comment.user.avatar || ''}" alt="Avatar" class="comment-avatar" onerror="this.style.display='none'">
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-username">${comment.user.fullName}</span>
                    <span class="comment-time">${formatDate(comment.createdAt)}</span>
                </div>
                <div class="comment-text">${comment.content}</div>
            </div>
        `;
        container.appendChild(commentElement);
    });
}

async function addComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const content = commentInput.value.trim();

    if (!content) {
        showToast('Please enter a comment', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ content })
        });

        const data = await response.json();

        if (response.ok) {
            commentInput.value = '';
            await loadComments(postId);
            showToast('Comment added successfully!', 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to add comment', 'error');
    }
}

// Explore functions
async function loadExplore() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/trending`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const posts = await response.json();
        renderTrendingPosts(posts);
    } catch (error) {
        showToast('Failed to load trending posts', 'error');
    }
}

function renderTrendingPosts(posts) {
    const container = document.getElementById('trendingPosts');
    container.innerHTML = '';

    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'trending-post';
        postElement.innerHTML = `
            ${post.media ? `
                <div class="trending-post-media">
                    ${post.media.match(/\.(mp4|mov|avi)$/i) ? 
                        `<video controls><source src="${post.media}" type="video/mp4"></video>` :
                        `<img src="${post.media}" alt="Post media">`
                    }
                </div>
            ` : ''}
            <div class="trending-post-content">
                <div class="trending-post-header">
                    <img src="${post.user.avatar || ''}" alt="Avatar" class="trending-post-avatar" onerror="this.style.display='none'">
                    <span class="trending-post-username">${post.user.fullName}</span>
                </div>
                <div class="trending-post-text">${post.content}</div>
                <div class="trending-post-stats">
                    <span><i class="fas fa-heart"></i> ${post.likesCount}</span>
                    <span><i class="fas fa-comment"></i> ${post.commentsCount}</span>
                </div>
            </div>
        `;
        container.appendChild(postElement);
    });
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        showToast('Please enter a search term', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();
        renderSearchResults(data);
    } catch (error) {
        showToast('Search failed', 'error');
    }
}

function renderSearchResults(data) {
    const container = document.getElementById('searchResults');
    const trendingSection = document.querySelector('.trending-section');
    
    container.style.display = 'block';
    trendingSection.style.display = 'none';

    let html = '<h3>Search Results</h3>';

    if (data.users.length > 0) {
        html += '<div class="search-section"><h4>Users</h4>';
        data.users.forEach(user => {
            html += `
                <div class="search-user">
                    <img src="${user.avatar || ''}" alt="Avatar" class="search-user-avatar" onerror="this.style.display='none'">
                    <div class="search-user-info">
                        <h5>${user.fullName}</h5>
                        <p>@${user.username}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    if (data.posts.length > 0) {
        html += '<div class="search-section"><h4>Posts</h4>';
        data.posts.forEach(post => {
            html += `
                <div class="search-post">
                    <div class="search-post-header">
                        <img src="${post.user.avatar || ''}" alt="Avatar" class="search-post-avatar" onerror="this.style.display='none'">
                        <div class="search-post-info">
                            <h5>${post.user.fullName}</h5>
                            <p>@${post.user.username}</p>
                        </div>
                    </div>
                    <div class="search-post-content">${post.content}</div>
                </div>
            `;
        });
        html += '</div>';
    }

    if (data.users.length === 0 && data.posts.length === 0) {
        html += '<p>No results found</p>';
    }

    container.innerHTML = html;
}

// Notification functions
async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const notifications = await response.json();
        renderNotifications(notifications);
        updateNotificationBadge(notifications.filter(n => !n.read).length);
    } catch (error) {
        showToast('Failed to load notifications', 'error');
    }
}

function renderNotifications(notifications) {
    const container = document.getElementById('notificationsContainer');
    container.innerHTML = '';

    if (notifications.length === 0) {
        container.innerHTML = '<p class="no-notifications">No notifications</p>';
        return;
    }

    notifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.read ? '' : 'unread'}`;
        notificationElement.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${formatDate(notification.createdAt)}</div>
            </div>
        `;
        container.appendChild(notificationElement);
    });
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// Profile functions
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();
        updateProfileUI(data);
    } catch (error) {
        showToast('Failed to load profile', 'error');
    }
}

function updateProfileUI(data) {
    document.getElementById('profileFullName').textContent = data.user.fullName;
    document.getElementById('profileUsername').textContent = `@${data.user.username}`;
    document.getElementById('profileBio').textContent = data.user.bio || 'No bio yet';
    document.getElementById('profilePostsCount').textContent = data.user.postsCount;
    document.getElementById('profileFollowersCount').textContent = data.user.followersCount;
    document.getElementById('profileFollowingCount').textContent = data.user.followingCount;

    const avatar = document.getElementById('profileAvatar');
    if (data.user.avatar) {
        avatar.src = data.user.avatar;
    }

    // Load profile posts
    renderPosts(data.posts, 'profilePosts');
}

function showEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    const fullNameInput = document.getElementById('editFullName');
    const bioInput = document.getElementById('editBio');

    fullNameInput.value = currentUser.fullName;
    bioInput.value = currentUser.bio || '';

    modal.classList.add('active');
}

function hideEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('active');
}

async function updateProfile(e) {
    e.preventDefault();
    showLoading();

    const fullName = document.getElementById('editFullName').value;
    const bio = document.getElementById('editBio').value;

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('bio', bio);

    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            loadProfile();
            hideEditProfileModal();
            showToast('Profile updated successfully!', 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to update profile', 'error');
    } finally {
        hideLoading();
    }
}

async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    showLoading();

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserAvatar();
            loadProfile();
            showToast('Avatar updated successfully!', 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to update avatar', 'error');
    } finally {
        hideLoading();
    }
}

function updateUserAvatar() {
    const avatars = document.querySelectorAll('.user-avatar, .user-avatar-small');
    avatars.forEach(avatar => {
        if (currentUser.avatar) {
            avatar.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar">`;
        } else {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }
    });
}

function switchProfileTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(`profile${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
}

// Utility functions
function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }
}

function handleMediaUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const fileName = file.name;
        const mediaLabel = document.querySelector('.btn-media span');
        mediaLabel.textContent = fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName;
    }
} 