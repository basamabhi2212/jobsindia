// Static version for GitHub Pages
let currentJobs = [];
let filteredJobs = [];

// DOM elements
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
const menuToggle = document.querySelector('.menu-toggle');
const navbar = document.querySelector('.navbar');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadJobsFromFile();
    showSection('home');
}

function setupEventListeners() {
    // Navigation
    setupNavigation();
    
    // Category buttons
    setupCategoryButtons();
    
    // Search and filters
    setupSearchAndFilters();
    
    // Contact form
    setupContactForm();
    
    // Mobile menu
    setupMobileMenu();
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
                        applyFilters();
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
                        applyFilters();
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
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
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
        applyFilters();
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
async function loadJobsFromFile() {
    try {
        const response = await fetch('./jobs.json');
        const jobs = await response.json();
        currentJobs = jobs;
        displayRecentJobs(jobs.slice(0, 6));
        applyFilters();
    } catch (error) {
        console.error('Error loading jobs:', error);
        currentJobs = [];
        displayRecentJobs([]);
    }
}

function applyFilters() {
    let filtered = [...currentJobs];
    
    // Apply search filter
    const searchTerm = document.getElementById('job-search')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(job => 
            job.title.toLowerCase().includes(searchTerm) ||
            job.company.toLowerCase().includes(searchTerm) ||
            job.location.toLowerCase().includes(searchTerm) ||
            job.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply category filter
    const category = document.getElementById('category-filter')?.value || 'all';
    if (category !== 'all') {
        filtered = filtered.filter(job => job.category === category);
    }
    
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
}

function createJobCard(job, isRecent = false) {
    const postedDate = job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'Recently';
    const description = job.description ? 
        (job.description.length > 150 ? job.description.substring(0, 150) + '...' : job.description) 
        : 'No description available';
    
    return `
        <div class="job-card" onclick="showJobDetails(${job.id})">
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

function showJobDetails(jobId) {
    const job = currentJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const postedDate = job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'Recently';
    const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Not specified';
    
    const detailsHtml = `
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
                <p>${escapeHtml(job.description).replace(/\\n/g, '<br>')}</p>
            </div>
            
            ${job.requirements ? `
            <div class="job-details-section">
                <h3>Requirements</h3>
                <p>${escapeHtml(job.requirements).replace(/\\n/g, '<br>')}</p>
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
                        `<button class="btn primary-btn" onclick="alert('Contact information provided above')">
                            <i class="fas fa-envelope"></i> Contact Employer
                        </button>`
                    }
                    <button class="btn secondary-btn" onclick="goBackToJobs()" style="margin-left: 1rem;">
                        <i class="fas fa-arrow-left"></i> Back to Jobs
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Create a modal for job details
    const modal = document.createElement('div');
    modal.className = 'job-modal';
    modal.innerHTML = `
        <div class="job-modal-content">
            <div class="job-modal-header">
                <button class="job-modal-close" onclick="closeJobModal()">&times;</button>
            </div>
            ${detailsHtml}
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeJobModal() {
    const modal = document.querySelector('.job-modal');
    if (modal) {
        modal.remove();
    }
}

function goBackToJobs() {
    closeJobModal();
    showSection('jobs');
}

// Search and filter functions
function handleSearch() {
    applyFilters();
}

function resetFilters() {
    const searchInput = document.getElementById('job-search');
    const categoryFilter = document.getElementById('category-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = 'all';
    if (dateFilter) dateFilter.value = 'newest';
    
    applyFilters();
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
            alert(`${key.toUpperCase()} is required`);
            return;
        }
    }
    
    // Simulate form submission
    alert('Thank you for your message! We will get back to you soon.');
    document.getElementById('contact-form').reset();
}

// Utility functions
function escapeHtml(text) {
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

// Initialize ads when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure ads are loaded
    setTimeout(() => {
        try {
            if (typeof window.adsbygoogle !== 'undefined') {
                const ads = document.querySelectorAll('.adsbygoogle');
                ads.forEach(ad => {
                    if (!ad.hasAttribute('data-adsbygoogle-status')) {
                        (window.adsbygoogle = window.adsbygoogle || []).push({});
                    }
                });
            }
        } catch (error) {
            console.log('Ad initialization note:', error.message);
        }
    }, 1000);
});