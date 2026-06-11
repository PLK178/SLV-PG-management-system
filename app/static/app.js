document.addEventListener('DOMContentLoaded', () => {
    // API base URL
    const API_BASE = '/api';

    // State Variables
    let skills = [];
    let currentCategoryFilter = 'All';
    let editMode = false;

    // Elements
    const skillsGrid = document.getElementById('skills-grid');
    const skillForm = document.getElementById('skill-form');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const emptyState = document.getElementById('empty-state');
    
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

    // Fetch and Display Skills
    async function fetchSkills() {
        try {
            const response = await fetch(`${API_BASE}/skills`);
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
        // Clear previous list but preserve empty state
        const skillCards = skillsGrid.querySelectorAll('.skill-card');
        skillCards.forEach(card => card.remove());

        const filtered = currentCategoryFilter === 'All' 
            ? skills 
            : skills.filter(s => s.category === currentCategoryFilter);

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        filtered.forEach(skill => {
            const card = document.createElement('article');
            const statusClass = skill.status.toLowerCase().replace(' ', '-');
            card.className = `skill-card status-${statusClass}`;
            card.innerHTML = `
                <div>
                    <div class="card-header">
                        <span class="skill-category">${skill.category}</span>
                        <span class="skill-level level-${skill.level.toLowerCase()}">${skill.level}</span>
                    </div>
                    <h3 class="skill-title">${escapeHTML(skill.title)}</h3>
                    <p class="skill-description">${escapeHTML(skill.description || 'No notes added yet.')}</p>
                </div>
                
                <div>
                    <div class="progress-container">
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
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(skillData)
                });
                
                if (!response.ok) throw new Error('Failed to update skill');
                showToast('Skill updated successfully');
                resetForm();
            } else {
                const response = await fetch(`${API_BASE}/skills`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(skillData)
                });
                
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
                method: 'DELETE'
            });
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

    // Initial Fetch
    fetchSkills();
});
