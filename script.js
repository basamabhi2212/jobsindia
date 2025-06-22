// Global variables
let currentJobs = [];
let filteredJobs = [];
let isAdminLoggedIn = false;
let currentJobDetails = null;

// DOM elements
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
const menuToggle = document.querySelector('.menu-toggle');
const navbar = document.querySelector('.navbar');
const loadingOverlay = document.getElementById('loading-overlay');
const toast = document.getElementById('toast');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadRecentJobs();
    showSection('home');
}

function setupEventListeners() {
    // Navigation
    setupNavigation();
    
    // Category buttons
    setupCategoryButtons();
    
    // Search and filters
    setupSearchAndFilters();
    
    // Admin functionality
    setupAdminFunctionality();
    
    // Contact form
    setupContactForm();
    
    // Mobile menu
    setupMobileMenu();
    
    // Toast close
    setupToast();
}

function setupNavigation() {
    // Navigation links
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-section]')) {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            const category = e.target.getAttribute('data-category');
            
            showSection(section);
            
            if (section === 'jobs' && category) {
                // Set category filter and load jobs
                setTimeout(() => {
                    const categoryFilter = document.getElementById('category-filter');
                    if (categoryFilter) {
                        categoryFilter.value = category;
                        loadJobs();
                    }
                }, 100);
            }
        }
    });
    
    // Update active nav link
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
}

function setupCategoryButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('.category-btn') || e.target.closest('.category-btn')) {
            e.preventDefault();
            const button = e.target.closest('.category-btn') || e.target;
            const category = button.getAttribute('data-category');
            const section = button.getAttribute('data-section');
            
            if (section === 'jobs') {
                showSection('jobs');
                // Small delay to ensure section is visible before filtering
                setTimeout(() => {
                    const categoryFilter = document.getElementById('category-filter');
                    if (categoryFilter) {
                        categoryFilter.value = category;
                        loadJobs();
                    }
                }, 100);
            }
        }
    });
}

function setupSearchAndFilters() {
    const searchInput = document.getElementById('job-search');
    const searchBtn = document.getElementById('search-btn');
    const categoryFilter = document.getElementById('category-filter');
    const dateFilter = document.getElementById('date-filter');
    const resetFiltersBtn = document.getElementById('reset-filters');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', debounce(handleSearch, 300));
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadJobs);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', loadJobs);
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
}

function setupAdminFunctionality() {
    // Add delay to ensure DOM is fully loaded
    setTimeout(() => {
        const adminLoginForm = document.getElementById('admin-login-form');
        const jobForm = document.getElementById('job-form');
        const adminLogoutBtn = document.getElementById('admin-logout');
        const tabBtns = document.querySelectorAll('.tab-btn');
        const exportExcelBtn = document.getElementById('export-excel');
        
        if (adminLoginForm) {
            console.log('Admin login form found, adding event listener');
            adminLoginForm.addEventListener('submit', handleAdminLogin);
        } else {
            console.log('Admin login form not found');
        }
        
        if (jobForm) {
            jobForm.addEventListener('submit', handleJobSubmission);
        }
        
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', handleAdminLogout);
        }
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                switchTab(this.getAttribute('data-tab'));
            });
        });
        
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', handleExcelExport);
        }
        
        // User management
        const addUserBtn = document.getElementById('add-user-btn');
        const cancelAddUserBtn = document.getElementById('cancel-add-user');
        const userForm = document.getElementById('user-form');
        const changePasswordForm = document.getElementById('change-password-form');
        
        if (addUserBtn) {
            addUserBtn.addEventListener('click', showAddUserForm);
        }
        
        if (cancelAddUserBtn) {
            cancelAddUserBtn.addEventListener('click', hideAddUserForm);
        }
        
        if (userForm) {
            userForm.addEventListener('submit', handleUserSubmission);
        }
        
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', handlePasswordChange);
        }
    }, 100);
}

function setupContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

function setupMobileMenu() {
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navbar.classList.toggle('active');
        });
    }
}

function setupToast() {
    const toastClose = document.querySelector('.toast-close');
    if (toastClose) {
        toastClose.addEventListener('click', hideToast);
    }
}

// Navigation functions
function showSection(sectionId) {
    // Hide all sections
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation
    updateActiveNavLink(sectionId);
    
    // Load section-specific content
    if (sectionId === 'jobs') {
        loadJobs();
    } else if (sectionId === 'admin' && isAdminLoggedIn) {
        loadAdminJobs();
    }
    
    // Close mobile menu
    if (navbar) {
        navbar.classList.remove('active');
    }
}

function updateActiveNavLink(sectionId) {
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
}

// Jobs functions
async function loadRecentJobs() {
    try {
        showLoading();
        const response = await fetch('/api/jobs?limit=6');
        const jobs = await response.json();
        
        if (response.ok) {
            displayRecentJobs(jobs);
        } else {
            console.error('Failed to load recent jobs:', jobs.error);
        }
    } catch (error) {
        console.error('Error loading recent jobs:', error);
    } finally {
        hideLoading();
    }
}

async function loadJobs() {
    try {
        showLoading();
        const searchTerm = document.getElementById('job-search')?.value || '';
        const category = document.getElementById('category-filter')?.value || 'all';
        
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (category !== 'all') params.append('category', category);
        
        const response = await fetch(`/api/jobs?${params.toString()}`);
        const jobs = await response.json();
        
        if (response.ok) {
            currentJobs = jobs;
            applyFilters();
        } else {
            console.error('Failed to load jobs:', jobs.error);
            showToast('Failed to load jobs', 'error');
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        showToast('Error loading jobs', 'error');
    } finally {
        hideLoading();
    }
}

function applyFilters() {
    let filtered = [...currentJobs];
    
    // Apply date filter
    const dateFilter = document.getElementById('date-filter')?.value;
    if (dateFilter === 'oldest') {
        filtered.sort((a, b) => new Date(a.posted_date) - new Date(b.posted_date));
    } else {
        filtered.sort((a, b) => new Date(b.posted_date) - new Date(a.posted_date));
    }
    
    filteredJobs = filtered;
    displayJobs(filteredJobs);
}

function displayRecentJobs(jobs) {
    const container = document.getElementById('recent-jobs-list');
    if (!container) return;
    
    if (jobs.length === 0) {
        container.innerHTML = '<p class="no-jobs">No recent jobs available</p>';
        return;
    }
    
    container.innerHTML = jobs.map(job => createJobCard(job, true)).join('');
    
    // Add click handlers for job cards
    container.querySelectorAll('.job-card').forEach(card => {
        card.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            showJobDetails(jobId);
        });
    });
    
    // Refresh ads after loading recent jobs
    refreshAds();
}

function displayJobs(jobs) {
    const container = document.getElementById('jobs-list');
    const noJobsMessage = document.getElementById('no-jobs-message');
    
    if (!container || !noJobsMessage) return;
    
    if (jobs.length === 0) {
        container.innerHTML = '';
        noJobsMessage.style.display = 'block';
        return;
    }
    
    noJobsMessage.style.display = 'none';
    container.innerHTML = jobs.map(job => createJobCard(job)).join('');
    
    // Add click handlers for job cards
    container.querySelectorAll('.job-card').forEach(card => {
        card.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            showJobDetails(jobId);
        });
    });
    
    // Refresh ads after loading jobs
    refreshAds();
}

function createJobCard(job, isRecent = false) {
    const postedDate = job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'Recently';
    const description = job.description ? 
        (job.description.length > 150 ? job.description.substring(0, 150) + '...' : job.description) 
        : 'No description available';
    
    return `
        <div class="job-card" data-job-id="${job.id}">
            <div class="job-header">
                <div>
                    <h3 class="job-title">${escapeHtml(job.title)}</h3>
                    <p class="job-company">${escapeHtml(job.company)}</p>
                </div>
                <span class="job-category">${escapeHtml(job.category)}</span>
            </div>
            
            <div class="job-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(job.location)}</span>
                <span><i class="fas fa-briefcase"></i> ${escapeHtml(job.job_type || 'Full-time')}</span>
                <span><i class="fas fa-layer-group"></i> ${escapeHtml(job.experience || 'Entry Level')}</span>
                ${job.salary ? `<span><i class="fas fa-rupee-sign"></i> ${escapeHtml(job.salary)}</span>` : ''}
            </div>
            
            <div class="job-description">
                ${escapeHtml(description)}
            </div>
            
            <div class="job-footer">
                <span>Posted: ${postedDate}</span>
                <span class="view-details">Click to view details</span>
            </div>
        </div>
    `;
}

async function showJobDetails(jobId) {
    try {
        showLoading();
        const response = await fetch(`/api/jobs/${jobId}`);
        const job = await response.json();
        
        if (response.ok) {
            currentJobDetails = job;
            displayJobDetails(job);
            showSection('job-details');
        } else {
            showToast('Job not found', 'error');
        }
    } catch (error) {
        console.error('Error loading job details:', error);
        showToast('Error loading job details', 'error');
    } finally {
        hideLoading();
    }
}

function displayJobDetails(job) {
    const container = document.getElementById('job-details-content');
    if (!container) return;
    
    const postedDate = job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'Recently';
    const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Not specified';
    
    container.innerHTML = `
        <div class="job-details-card">
            <div class="job-details-header">
                <h1 class="job-details-title">${escapeHtml(job.title)}</h1>
                <p class="job-details-company">${escapeHtml(job.company)}</p>
                
                <div class="job-details-meta">
                    <div class="job-details-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${escapeHtml(job.location)}</span>
                    </div>
                    <div class="job-details-meta-item">
                        <i class="fas fa-briefcase"></i>
                        <span>${escapeHtml(job.job_type || 'Full-time')}</span>
                    </div>
                    <div class="job-details-meta-item">
                        <i class="fas fa-layer-group"></i>
                        <span>${escapeHtml(job.experience || 'Entry Level')}</span>
                    </div>
                    <div class="job-details-meta-item">
                        <i class="fas fa-tag"></i>
                        <span>${escapeHtml(job.category)}</span>
                    </div>
                    ${job.salary ? `
                    <div class="job-details-meta-item">
                        <i class="fas fa-rupee-sign"></i>
                        <span>${escapeHtml(job.salary)}</span>
                    </div>
                    ` : ''}
                    <div class="job-details-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>Posted: ${postedDate}</span>
                    </div>
                </div>
            </div>
            
            <div class="job-details-section">
                <h3>Job Description</h3>
                <p>${escapeHtml(job.description).replace(/\n/g, '<br>')}</p>
            </div>
            
            ${job.requirements ? `
            <div class="job-details-section">
                <h3>Requirements</h3>
                <p>${escapeHtml(job.requirements).replace(/\n/g, '<br>')}</p>
            </div>
            ` : ''}
            
            <div class="job-apply-section">
                <h3>Application Details</h3>
                <p><strong>Deadline:</strong> ${deadline}</p>
                ${job.contact_email ? `<p><strong>Contact:</strong> ${escapeHtml(job.contact_email)}</p>` : ''}
                
                <div style="margin-top: 2rem;">
                    ${job.application_url ? 
                        `<a href="${escapeHtml(job.application_url)}" target="_blank" class="btn primary-btn">
                            <i class="fas fa-external-link-alt"></i> Apply Now
                        </a>` :
                        `<button class="btn primary-btn" onclick="showToast('Contact information provided above', 'info')">
                            <i class="fas fa-envelope"></i> Contact Employer
                        </button>`
                    }
                </div>
            </div>
        </div>
    `;
    
    // Refresh ads after loading job details
    refreshAds();
}

// Search and filter functions
function handleSearch() {
    loadJobs();
}

function resetFilters() {
    const searchInput = document.getElementById('job-search');
    const categoryFilter = document.getElementById('category-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = 'all';
    if (dateFilter) dateFilter.value = 'newest';
    
    loadJobs();
}

// Admin functions
async function handleAdminLogin(e) {
    e.preventDefault();
    console.log('Admin login form submitted');
    
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password-login').value;
    
    console.log('Username:', username, 'Password length:', password ? password.length : 0);
    
    if (!username || !password) {
        showToast('Please enter username and password', 'error');
        return;
    }
    
    try {
        showLoading();
        console.log('Sending login request...');
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        console.log('Login response:', result);
        
        if (response.ok && result.success) {
            isAdminLoggedIn = true;
            showAdminPanel();
            showToast('Login successful!', 'success');
        } else {
            showToast(result.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showToast('Network error - please try again', 'error');
    } finally {
        hideLoading();
    }
}

async function handleAdminLogout() {
    try {
        await fetch('/api/admin/logout', { method: 'POST' });
        isAdminLoggedIn = false;
        hideAdminPanel();
        showToast('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function showAdminPanel() {
    const loginContainer = document.getElementById('admin-login-container');
    const adminFormContainer = document.getElementById('admin-job-form-container');
    
    if (loginContainer) loginContainer.style.display = 'none';
    if (adminFormContainer) adminFormContainer.style.display = 'block';
    
    loadAdminJobs();
}

function hideAdminPanel() {
    const loginContainer = document.getElementById('admin-login-container');
    const adminFormContainer = document.getElementById('admin-job-form-container');
    
    if (loginContainer) loginContainer.style.display = 'block';
    if (adminFormContainer) adminFormContainer.style.display = 'none';
    
    // Clear login form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) loginForm.reset();
}

async function handleJobSubmission(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('job-title').value,
        company: document.getElementById('job-company').value,
        location: document.getElementById('job-location').value,
        category: document.getElementById('job-category').value,
        job_type: document.getElementById('job-type').value,
        experience: document.getElementById('job-experience').value,
        salary: document.getElementById('job-salary').value,
        description: document.getElementById('job-description').value,
        requirements: document.getElementById('job-requirements').value,
        application_url: document.getElementById('job-application-url').value,
        contact_email: document.getElementById('job-contact-email').value,
        deadline: document.getElementById('job-deadline').value
    };
    
    // Validate required fields
    const requiredFields = ['title', 'company', 'location', 'category', 'description'];
    for (const field of requiredFields) {
        if (!formData[field]) {
            showToast(`${field.replace('_', ' ').toUpperCase()} is required`, 'error');
            return;
        }
    }
    
    try {
        showLoading();
        const response = await fetch('/api/admin/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Job posted successfully!', 'success');
            document.getElementById('job-form').reset();
            loadAdminJobs();
            // Refresh recent jobs on home page
            loadRecentJobs();
        } else {
            showToast(result.error || 'Failed to post job', 'error');
        }
    } catch (error) {
        console.error('Job submission error:', error);
        showToast('Failed to post job', 'error');
    } finally {
        hideLoading();
    }
}

async function loadAdminJobs() {
    if (!isAdminLoggedIn) return;
    
    try {
        const response = await fetch('/api/jobs');
        const jobs = await response.json();
        
        if (response.ok) {
            displayAdminJobs(jobs);
        } else {
            console.error('Failed to load admin jobs:', jobs.error);
        }
    } catch (error) {
        console.error('Error loading admin jobs:', error);
    }
}

function displayAdminJobs(jobs) {
    const container = document.getElementById('admin-jobs-list');
    if (!container) return;
    
    if (jobs.length === 0) {
        container.innerHTML = '<p class="no-jobs">No jobs posted yet</p>';
        return;
    }
    
    container.innerHTML = jobs.map(job => {
        const postedDate = job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'Recently';
        return `
            <div class="admin-job-card">
                <div class="admin-job-header">
                    <div>
                        <h4>${escapeHtml(job.title)}</h4>
                        <p>${escapeHtml(job.company)} - ${escapeHtml(job.location)}</p>
                        <small>Posted: ${postedDate} | Category: ${escapeHtml(job.category)}</small>
                    </div>
                    <div class="admin-job-actions">
                        <button class="edit-btn" onclick="editJob(${job.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="deleteAdminJob(${job.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
        showLoading();
        const response = await fetch(`/api/admin/jobs/${jobId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Job deleted successfully', 'success');
            loadAdminJobs();
            loadRecentJobs();
        } else {
            showToast(result.error || 'Failed to delete job', 'error');
        }
    } catch (error) {
        console.error('Delete job error:', error);
        showToast('Failed to delete job', 'error');
    } finally {
        hideLoading();
    }
}

async function handleExcelExport() {
    if (!isAdminLoggedIn) return;
    
    try {
        showLoading();
        const response = await fetch('/api/export/excel');
        const result = await response.json();
        
        if (response.ok) {
            showToast('Excel file generated successfully!', 'success');
        } else {
            showToast(result.error || 'Failed to export Excel file', 'error');
        }
    } catch (error) {
        console.error('Excel export error:', error);
        showToast('Failed to export Excel file', 'error');
    } finally {
        hideLoading();
    }
}

// Tab functions
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // Load content if needed
    if (tabId === 'manage-jobs') {
        loadAdminJobs();
    } else if (tabId === 'user-management') {
        loadUsers();
    }
}

// Contact form
function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        subject: document.getElementById('contact-subject').value,
        message: document.getElementById('contact-message').value
    };
    
    // Validate required fields
    for (const [key, value] of Object.entries(formData)) {
        if (!value) {
            showToast(`${key.toUpperCase()} is required`, 'error');
            return;
        }
    }
    
    // Simulate form submission
    showToast('Thank you for your message! We will get back to you soon.', 'success');
    document.getElementById('contact-form').reset();
}

// Utility functions
function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showToast(message, type = 'info') {
    if (!toast) return;
    
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Set icon based on type
    let iconClass = 'fas fa-info-circle';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    else if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    else if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';
    
    toastIcon.className = `toast-icon ${iconClass}`;
    toastMessage.textContent = message;
    
    // Set toast type class
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(hideToast, 5000);
}

function hideToast() {
    if (toast) {
        toast.style.display = 'none';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Ad refresh function
function refreshAds() {
    try {
        // Refresh AdSense ads if available
        if (typeof window.adsbygoogle !== 'undefined') {
            const ads = document.querySelectorAll('.adsbygoogle');
            ads.forEach(ad => {
                // Only push if not already processed
                if (!ad.hasAttribute('data-adsbygoogle-status')) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            });
        }
    } catch (error) {
        console.log('Ad refresh note:', error.message);
    }
}

// Initialize ads when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure ads are loaded
    setTimeout(refreshAds, 1000);
});

// User Management Functions
function showAddUserForm() {
    document.getElementById('add-user-form').style.display = 'block';
    document.getElementById('add-user-btn').style.display = 'none';
}

function hideAddUserForm() {
    document.getElementById('add-user-form').style.display = 'none';
    document.getElementById('add-user-btn').style.display = 'inline-block';
    document.getElementById('user-form').reset();
}

async function handleUserSubmission(e) {
    e.preventDefault();
    
    try {
        showLoading();
        
        const formData = {
            username: document.getElementById('user-username').value,
            email: document.getElementById('user-email').value,
            password: document.getElementById('user-password').value,
            is_admin: document.getElementById('user-admin').value === 'true'
        };
        
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(result.message, 'success');
            hideAddUserForm();
            loadUsers();
        } else {
            showToast(result.error || 'Failed to create user', 'error');
        }
    } catch (error) {
        console.error('User creation error:', error);
        showToast('Failed to create user', 'error');
    } finally {
        hideLoading();
    }
}

async function loadUsers() {
    if (!isAdminLoggedIn) return;
    
    try {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
        
        if (response.ok) {
            displayUsers(users);
        } else {
            console.error('Failed to load users:', users.error);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const container = document.getElementById('users-list');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = '<p class="no-users">No users found</p>';
        return;
    }
    
    container.innerHTML = users.map(user => {
        const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown';
        return `
            <div class="admin-user-card">
                <div class="admin-user-header">
                    <div>
                        <h4>${escapeHtml(user.username)} ${user.is_admin ? '<span class="admin-status">Admin</span>' : '<span class="user-status">User</span>'}</h4>
                        <p>Email: ${escapeHtml(user.email)}</p>
                        <small>Created: ${createdDate}</small>
                    </div>
                    <div class="admin-user-actions">
                        <button class="edit-btn" onclick="editUser(${user.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="deleteUser(${user.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        showLoading();
        
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(result.message, 'success');
            loadUsers();
        } else {
            showToast(result.error || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('User deletion error:', error);
        showToast('Failed to delete user', 'error');
    } finally {
        hideLoading();
    }
}

function editUser(userId) {
    // For now, show a simple prompt for editing
    showToast('User editing feature coming soon. Use delete and recreate for now.', 'info');
}

async function deleteAdminJob(jobId) {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    
    try {
        showLoading();
        
        const response = await fetch(`/api/admin/jobs/${jobId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(result.message, 'success');
            loadAdminJobs();
        } else {
            showToast(result.error || 'Failed to delete job', 'error');
        }
    } catch (error) {
        console.error('Job deletion error:', error);
        showToast('Failed to delete job', 'error');
    } finally {
        hideLoading();
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch('/api/admin/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(result.message, 'success');
            document.getElementById('change-password-form').reset();
        } else {
            showToast(result.error || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showToast('Failed to change password', 'error');
    } finally {
        hideLoading();
    }
}

// Global functions for admin actions (called from HTML)
window.editJob = function(jobId) {
    showToast('Edit functionality coming soon!', 'info');
};

window.deleteJob = deleteJob;
