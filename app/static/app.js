function initApp() {
    console.log("SkillCraft app.js: initializing event listeners...");
    // API base URL
    const API_BASE = '/api';

    // State Variables
    let skills = [];
    let currentCategoryFilter = 'All';
    let editMode = false;
    let authMode = 'login'; // 'login' or 'signup'
    let token = localStorage.getItem('token') || null;
    let currentUserEmail = localStorage.getItem('user_email') || null;
    let searchQuery = '';
    let currentSort = 'updated';
    let currentTheme = localStorage.getItem('theme') || 'default';

    // Elements
    const authView = document.getElementById('auth-view');
    const appView = document.getElementById('app-view');
    const authForm = document.getElementById('auth-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authToggleLink = document.getElementById('auth-toggle-link');
    const authToggleText = document.getElementById('auth-toggle-text');
    const userEmailEl = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');

    const skillsGrid = document.getElementById('skills-grid');
    const skillForm = document.getElementById('skill-form');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const emptyState = document.getElementById('empty-state');
    
    // Controls Elements
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const themeButtons = document.querySelectorAll('.theme-btn');
    
    // Form Inputs
    const skillIdInput = document.getElementById('skill-id');
    const titleInput = document.getElementById('title');
    const categorySelect = document.getElementById('category');
    const levelSelect = document.getElementById('level');
    const statusSelect = document.getElementById('status');
    const progressInput = document.getElementById('progress');
    const progressVal = document.getElementById('progress-val');
    const descriptionInput = document.getElementById('description');

    // Stats
    const totalSkillsEl = document.getElementById('total-skills');
    const masteredSkillsEl = document.getElementById('mastered-skills');

    // Category Filters
    const filterChips = document.querySelectorAll('.filter-chip');

    // Theme Manager
    function applyTheme(themeName) {
        currentTheme = themeName;
        localStorage.setItem('theme', themeName);
        document.body.removeAttribute('data-theme');
        if (themeName !== 'default') {
            document.body.setAttribute('data-theme', themeName);
        }
        themeButtons.forEach(btn => {
            if (btn.getAttribute('data-theme-id') === themeName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Initialize Theme
    applyTheme(currentTheme);

    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTheme = btn.getAttribute('data-theme-id');
            applyTheme(selectedTheme);
        });
    });

    // Search and Sort Logic
    if (searchInput) {
        searchInput.value = searchQuery;
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderSkills();
        });
    }

    if (sortSelect) {
        sortSelect.value = currentSort;
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderSkills();
        });
    }

    // Initialize Lucide Icons
    function updateIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Toast Notifications
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const text = document.createElement('span');
        text.textContent = message;
        toast.appendChild(text);

        container.appendChild(toast);

        // Remove toast after 3.5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    }

    // Sync status and progress sliders
    progressInput.addEventListener('input', (e) => {
        const val = e.target.value;
        progressVal.textContent = `${val}%`;
        
        // Auto update status based on progress
        if (val == 0) {
            statusSelect.value = 'Not Started';
        } else if (val == 100) {
            statusSelect.value = 'Mastered';
        } else {
            statusSelect.value = 'In Progress';
        }
    });

    statusSelect.addEventListener('change', (e) => {
        const status = e.target.value;
        if (status === 'Mastered') {
            progressInput.value = 100;
            progressVal.textContent = '100%';
        } else if (status === 'Not Started') {
            progressInput.value = 0;
            progressVal.textContent = '0%';
        } else if (status === 'In Progress' && (progressInput.value == 0 || progressInput.value == 100)) {
            progressInput.value = 50;
            progressVal.textContent = '50%';
        }
    });

    // Check if query parameter "registered=true" is present to show success toast
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        showToast('Registration successful! Please sign in.');
        // Clean up URL parameter to avoid showing toast again on page reload
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Handle Authentication submission (Login only now, signup has its own page)
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value.trim();
        const password = authPassword.value;

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Authentication failed');
            }

            token = data.access_token;
            currentUserEmail = email;
            localStorage.setItem('token', token);
            localStorage.setItem('user_email', currentUserEmail);
            showToast('Successfully logged in');
            checkAuth();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        token = null;
        currentUserEmail = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user_email');
        showToast('Logged out successfully');
        checkAuth();
    });

    // Check Auth State
    function checkAuth() {
        if (token) {
            authView.style.display = 'none';
            appView.style.display = 'block';
            userEmailEl.textContent = currentUserEmail;
            fetchSkills();
        } else {
            authView.style.display = 'flex';
            appView.style.display = 'none';
            skills = [];
            renderSkills();
        }
        updateIcons();
    }

    // Helper for authorization headers
    function getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    // Fetch and Display Skills
    async function fetchSkills() {
        try {
            const response = await fetch(`${API_BASE}/skills`, {
                headers: getHeaders()
            });
            if (response.status === 401) {
                // Token expired or invalid
                token = null;
                localStorage.removeItem('token');
                checkAuth();
                return;
            }
            if (!response.ok) throw new Error('Failed to load skills from server');
            skills = await response.json();
            renderSkills();
            updateStats();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    // Update statistics dashboard
    function updateStats() {
        totalSkillsEl.textContent = skills.length;
        const mastered = skills.filter(s => s.status === 'Mastered').length;
        masteredSkillsEl.textContent = mastered;
    }

    // Filter Chips Event Listener
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCategoryFilter = chip.getAttribute('data-category');
            renderSkills();
        });
    });

    // Render skills items to DOM
    function renderSkills() {
        const skillCards = skillsGrid.querySelectorAll('.skill-card');
        skillCards.forEach(card => card.remove());

        let filtered = currentCategoryFilter === 'All' 
            ? skills 
            : skills.filter(s => s.category === currentCategoryFilter);

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(s => 
                s.title.toLowerCase().includes(searchQuery) || 
                (s.description && s.description.toLowerCase().includes(searchQuery))
            );
        }

        // Sorting
        filtered.sort((a, b) => {
            if (currentSort === 'title') {
                return a.title.localeCompare(b.title);
            } else if (currentSort === 'progress-desc') {
                return b.progress - a.progress;
            } else if (currentSort === 'progress-asc') {
                return a.progress - b.progress;
            } else if (currentSort === 'level') {
                const levels = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
                return (levels[a.level] || 0) - (levels[b.level] || 0);
            } else { // default: updated
                return new Date(b.updated_at) - new Date(a.updated_at);
            }
        });

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        filtered.forEach(skill => {
            const card = document.createElement('article');
            const statusClass = skill.status.toLowerCase().replace(' ', '-');
            card.className = `skill-card status-${statusClass}`;
            
            // Subtasks HTML construction
            let subtasksHTML = '';
            if (skill.subtasks && skill.subtasks.length > 0) {
                const listItems = skill.subtasks.map(sub => `
                    <div class="subtask-item ${sub.is_completed ? 'completed' : ''}">
                        <div class="subtask-left" onclick="toggleSubtask(${sub.id}, ${!sub.is_completed})">
                            <div class="subtask-checkbox">
                                <i data-lucide="check" style="width: 10px; height: 10px;"></i>
                            </div>
                            <span class="subtask-text">${escapeHTML(sub.title)}</span>
                        </div>
                        <button class="subtask-delete-btn" onclick="deleteSubtask(${sub.id})" title="Delete milestone">
                            <i data-lucide="x" style="width: 12px; height: 12px;"></i>
                        </button>
                    </div>
                `).join('');
                
                subtasksHTML = `
                    <div class="subtasks-section">
                        <div class="subtasks-title">
                            <span>Milestones</span>
                            <span>${skill.subtasks.filter(s => s.is_completed).length}/${skill.subtasks.length}</span>
                        </div>
                        <div class="subtasks-list">
                            ${listItems}
                        </div>
                    </div>
                `;
            }

            const addSubtaskFormHTML = `
                <div class="subtask-add-form-container" style="margin-top: 0.75rem;">
                    <form class="subtask-add-form" onsubmit="handleAddSubtask(event, ${skill.id})">
                        <input type="text" class="subtask-add-input" placeholder="Add milestone..." required>
                        <button type="submit" class="subtask-add-btn" title="Add milestone">
                            <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                        </button>
                    </form>
                </div>
            `;

            card.innerHTML = `
                <div>
                    <div class="card-header">
                        <span class="skill-category">${skill.category}</span>
                        <span class="skill-level level-${skill.level.toLowerCase()}">${skill.level}</span>
                    </div>
                    <h3 class="skill-title">${escapeHTML(skill.title)}</h3>
                    <p class="skill-description">${escapeHTML(skill.description || 'No notes added yet.')}</p>
                    
                    ${subtasksHTML}
                    ${addSubtaskFormHTML}
                </div>
                
                <div>
                    <div class="progress-container" style="margin-top: 1.25rem;">
                        <div class="progress-header">
                            <span>${skill.status}</span>
                            <span>${skill.progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${skill.progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="card-actions">
                        <button class="action-btn btn-edit-active" onclick="editSkill(${skill.id})" title="Edit Skill">
                            <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                        </button>
                        <button class="action-btn btn-delete-active" onclick="deleteSkill(${skill.id})" title="Delete Skill">
                            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                </div>
            `;
            skillsGrid.appendChild(card);
        });

        updateIcons();
    }

    // Form submission (Create & Update)
    skillForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const skillData = {
            title: titleInput.value.trim(),
            category: categorySelect.value,
            level: levelSelect.value,
            status: statusSelect.value,
            progress: parseInt(progressInput.value),
            description: descriptionInput.value.trim() || null
        };

        try {
            if (editMode) {
                const id = skillIdInput.value;
                const response = await fetch(`${API_BASE}/skills/${id}`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify(skillData)
                });
                
                if (response.status === 401) {
                    token = null;
                    localStorage.removeItem('token');
                    checkAuth();
                    return;
                }
                if (!response.ok) throw new Error('Failed to update skill');
                showToast('Skill updated successfully');
                resetForm();
            } else {
                const response = await fetch(`${API_BASE}/skills`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(skillData)
                });
                
                if (response.status === 401) {
                    token = null;
                    localStorage.removeItem('token');
                    checkAuth();
                    return;
                }
                if (!response.ok) throw new Error('Failed to add skill');
                showToast('Skill added successfully');
                resetForm();
            }
            fetchSkills();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // Edit skill helper loaded onto global namespace for inline onclick
    window.editSkill = function(id) {
        const skill = skills.find(s => s.id === id);
        if (!skill) return;

        editMode = true;
        formTitle.innerHTML = `<i data-lucide="edit-3" style="color: var(--primary);"></i> Edit Skill`;
        submitBtn.innerHTML = `<i data-lucide="save"></i> Update Skill`;
        cancelBtn.style.display = 'inline-flex';

        skillIdInput.value = skill.id;
        titleInput.value = skill.title;
        categorySelect.value = skill.category;
        levelSelect.value = skill.level;
        statusSelect.value = skill.status;
        progressInput.value = skill.progress;
        progressVal.textContent = `${skill.progress}%`;
        descriptionInput.value = skill.description || '';

        // Scroll form into view if on mobile
        document.querySelector('aside').scrollIntoView({ behavior: 'smooth' });
        updateIcons();
    };

    // Delete skill
    window.deleteSkill = async function(id) {
        if (!confirm('Are you sure you want to remove this skill?')) return;
        
        try {
            const response = await fetch(`${API_BASE}/skills/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (response.status === 401) {
                token = null;
                localStorage.removeItem('token');
                checkAuth();
                return;
            }
            if (!response.ok) throw new Error('Failed to delete skill');
            showToast('Skill removed successfully');
            if (editMode && skillIdInput.value == id) {
                resetForm();
            }
            fetchSkills();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    // Toggle Subtask Completion
    window.toggleSubtask = async function(subtaskId, isCompleted) {
        try {
            const response = await fetch(`${API_BASE}/subtasks/${subtaskId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ is_completed: isCompleted })
            });
            if (response.status === 401) {
                token = null;
                localStorage.removeItem('token');
                checkAuth();
                return;
            }
            if (!response.ok) throw new Error('Failed to update milestone');
            
            await fetchSkills();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    // Delete Subtask
    window.deleteSubtask = async function(subtaskId) {
        if (!confirm('Are you sure you want to remove this milestone?')) return;
        try {
            const response = await fetch(`${API_BASE}/subtasks/${subtaskId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (response.status === 401) {
                token = null;
                localStorage.removeItem('token');
                checkAuth();
                return;
            }
            if (!response.ok) throw new Error('Failed to delete milestone');
            
            await fetchSkills();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    // Add Subtask Handler
    window.handleAddSubtask = async function(event, skillId) {
        event.preventDefault();
        const form = event.target;
        const input = form.querySelector('.subtask-add-input');
        const title = input.value.trim();
        if (!title) return;

        try {
            const response = await fetch(`${API_BASE}/skills/${skillId}/subtasks`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ title })
            });
            if (response.status === 401) {
                token = null;
                localStorage.removeItem('token');
                checkAuth();
                return;
            }
            if (!response.ok) throw new Error('Failed to add milestone');
            
            input.value = '';
            await fetchSkills();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    // Cancel edit
    cancelBtn.addEventListener('click', resetForm);

    function resetForm() {
        editMode = false;
        formTitle.innerHTML = `<i data-lucide="plus-circle" style="color: var(--primary);"></i> Add New Skill`;
        submitBtn.innerHTML = `<i data-lucide="save"></i> Save Skill`;
        cancelBtn.style.display = 'none';
        
        skillForm.reset();
        skillIdInput.value = '';
        progressVal.textContent = '0%';
        updateIcons();
    }

    // HTML Escaping utility
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Run initial authorization check
    checkAuth();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
