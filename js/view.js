/**
 * VIEW LAYER
 * Handles UI rendering, DOM updates, and user interface management
 * MVC Pattern: View
 */

class StudentView {
    constructor() {
        // Navigation
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebar = document.querySelector('.sidebar');
        this.pageTitle = document.getElementById('pageTitle');

        // Theme
        this.themeToggle = document.getElementById('themeToggle');
        this.darkModeToggle = document.getElementById('darkModeToggle');

        // Form
        this.studentForm = document.getElementById('studentForm');
        this.formSteps = document.querySelectorAll('.form-step');
        this.steps = document.querySelectorAll('.step');
        this.nextBtn = document.getElementById('nextBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.submitBtn = document.getElementById('submitBtn');
        this.profileImage = document.getElementById('profileImage');
        this.imagePreview = document.getElementById('imagePreview');
        this.dobInput = document.getElementById('dob');
        this.ageDisplay = document.getElementById('ageDisplay');
        this.currentStep = 1;

        // Students Table
        this.searchInput = document.getElementById('searchInput');
        this.departmentFilter = document.getElementById('departmentFilter');
        this.yearFilter = document.getElementById('yearFilter');
        this.genderFilter = document.getElementById('genderFilter');
        this.tagFilter = document.getElementById('tagFilter');
        this.sortSelect = document.getElementById('sortSelect');
        this.studentsTableBody = document.getElementById('studentsTableBody');
        this.pagination = document.getElementById('pagination');
        this.currentPage = 1;
        this.itemsPerPage = 10;

        // Reports
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');
        this.clearAllBtn = document.getElementById('clearAllBtn');

        // Settings
        this.autoSaveInterval = document.getElementById('autoSaveInterval');
        this.lastUpdated = document.getElementById('lastUpdated');
        this.totalRecords = document.getElementById('totalRecords');

        // Modals (button refs named *Btn so they don't shadow closeEditModal/closeDeleteModal methods)
        this.editModal = document.getElementById('editModal');
        this.deleteModal = document.getElementById('deleteModal');
        this.studentDetailModal = document.getElementById('studentDetailModal');
        this.studentDetailBody = document.getElementById('studentDetailBody');
        this.editForm = document.getElementById('editForm');
        this.editTagSelect = document.getElementById('editTagSelect');
        this.editTagAddBtn = document.getElementById('editTagAddBtn');
        this.editTagsHidden = document.getElementById('editTagsHidden');
        this.editTagsList = document.getElementById('editTagsList');
        this.addTagSelect = document.getElementById('addTagSelect');
        this.addTagAddBtn = document.getElementById('addTagAddBtn');
        this.addTagsList = document.getElementById('addTagsList');
        this.closeEditModalBtn = document.getElementById('closeEditModal');
        this.addFormSelectedTags = [];
        this.closeDeleteModalBtn = document.getElementById('closeDeleteModal');
        this.closeStudentDetailModalBtn = document.getElementById('closeStudentDetailModal');
        this.closeStudentDetailBtn = document.getElementById('closeStudentDetailBtn');
        this.editFromDetailBtn = document.getElementById('editFromDetailBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        // Notifications
        this.toast = document.getElementById('toast');
        this.loadingOverlay = document.getElementById('loadingOverlay');

        // Dashboard
        this.totalStudents = document.getElementById('totalStudents');
        this.activeStudents = document.getElementById('activeStudents');
        this.departmentCount = document.getElementById('departmentCount');
        this.avgAttendance = document.getElementById('avgAttendance');
        this.departmentCards = document.getElementById('departmentCards');

        // Global search (header) - syncs with students table when on that page
        this.globalSearch = document.getElementById('globalSearch');

        // History page
        this.historyTimeline = document.getElementById('historyTimeline');
        this.historyEmpty = document.getElementById('historyEmpty');
        this.historySearch = document.getElementById('historySearch');
        this.historyActionFilter = document.getElementById('historyActionFilter');
        this.historyDateFilter = document.getElementById('historyDateFilter');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.clearHistoryModal = document.getElementById('clearHistoryModal');
        this.closeClearHistoryModalBtn = document.getElementById('closeClearHistoryModal');
        this.cancelClearHistoryBtn = document.getElementById('cancelClearHistoryBtn');
        this.confirmClearHistoryBtn = document.getElementById('confirmClearHistoryBtn');

        this.currentEditingId = null;
        this.currentDeletingId = null;
        this.currentDetailStudentId = null;

        /** Sparkline Chart.js instances for table rows (student id -> chart) */
        this.sparklineCharts = {};
        this.detailSparklineChart = null;

        this.loadTheme();
    }

    /**
     * Switch page
     */
    switchPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const page = document.getElementById(`${pageName}-page`);
        if (page) {
            page.classList.add('active');
        }

        // Update nav links
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageName) {
                link.classList.add('active');
            }
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            'add-student': 'Register New Student',
            students: 'All Students',
            reports: 'Reports & Analytics',
            settings: 'Settings',
            history: 'History'
        };
        this.pageTitle.textContent = titles[pageName] || 'Dashboard';

        // Close mobile sidebar
        this.closeMobileSidebar();
    }

    /**
     * Close mobile sidebar
     */
    closeMobileSidebar() {
        if (window.innerWidth <= 768) {
            this.sidebar.classList.remove('active');
        }
    }

    /**
     * Show form step (step indicators and form step content)
     */
    showFormStep(stepNumber) {
        // Hide all form step content panels
        this.formSteps.forEach(step => step.classList.remove('active'));
        this.steps.forEach(step => step.classList.remove('active'));

        // Show the correct form step content (use .form-step to avoid matching .step)
        const formStepEl = document.querySelector('.form-step[data-step="' + stepNumber + '"]');
        if (formStepEl) formStepEl.classList.add('active');
        const stepIndicator = document.querySelector('.step[data-step="' + stepNumber + '"]');
        if (stepIndicator) stepIndicator.classList.add('active');

        // Update buttons
        this.prevBtn.style.display = stepNumber > 1 ? 'block' : 'none';
        this.nextBtn.style.display = stepNumber < 4 ? 'block' : 'none';
        this.submitBtn.style.display = stepNumber === 4 ? 'block' : 'none';

        this.currentStep = stepNumber;
    }

    /**
     * Get form data (includes profile image base64 if uploaded)
     */
    getFormData() {
        const formData = new FormData(this.studentForm);
        const data = Object.fromEntries(formData);
        if (this.profileImage && this.profileImage.dataset.base64) {
            data.profileImage = this.profileImage.dataset.base64;
        }
        // Optional tags from Add form selection (predefined dropdown)
        data.tags = Utils.normalizeTags(this.addFormSelectedTags || []);
        return data;
    }

    /**
     * Validate form step (uses validateField for proper messages)
     */
    validateFormStep(step) {
        const stepEl = document.querySelector('.form-step[data-step="' + step + '"]');
        if (!stepEl) return true;
        const inputs = stepEl.querySelectorAll('input:not([type="file"]), select');
        let isValid = true;

        inputs.forEach(input => {
            // Skip optional tag select (tags are optional)
            if (input.id === 'addTagSelect') return;
            const value = (input.value || '').trim();
            const msg = this.validateField(input.name, value);
            if (msg) {
                this.showFieldError(input.name, msg);
                isValid = false;
            } else {
                this.clearFieldError(input.name);
            }
        });

        return isValid;
    }

    /**
     * Show field error
     */
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`error-${fieldName}`);
        const inputElement = document.getElementById(fieldName);

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }

        if (inputElement) {
            inputElement.classList.add('error');
        }
    }

    /**
     * Clear field error
     */
    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`error-${fieldName}`);
        const inputElement = document.getElementById(fieldName);

        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }

        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }

    /**
     * Validate a single field (real-time); returns error message or ''
     */
    validateField(fieldName, value) {
        const v = (value || '').trim();
        switch (fieldName) {
            case 'firstName':
            case 'lastName':
                return v.length < 2 ? 'Enter at least 2 characters' : '';
            case 'dob':
                if (!v) return 'Date of birth is required';
                return Utils.isValidDOB(v) ? '' : 'Student must be between 16 and 100 years old';
            case 'gender':
                return v ? '' : 'Please select gender';
            case 'email':
                if (!v) return 'Email is required';
                return Utils.isValidEmail(v) ? '' : 'Enter a valid email address';
            case 'department':
            case 'year':
                return v ? '' : 'This field is required';
            case 'gpa':
                if (v === '') return 'GPA is required';
                return Utils.isValidGPA(v) ? '' : 'GPA must be between 0.0 and 4.0';
            case 'attendance':
                if (v === '') return 'Attendance is required';
                return Utils.isValidAttendance(v) ? '' : 'Attendance must be between 0 and 100';
            case 'assignmentScore':
                if (v === '') return 'Assignment score is required';
                return Utils.isValidAssignmentScore(v) ? '' : 'Assignment score must be between 0 and 100';
            case 'phone':
                if (!v) return 'Phone is required';
                return Utils.isValidPhone(v) ? '' : 'Enter a valid phone number (at least 10 digits)';
            case 'address':
            case 'city':
            case 'state':
            case 'country':
                return v.length < 2 ? 'Enter at least 2 characters' : '';
            case 'zipcode':
                return v.length < 2 ? 'Enter a valid zip code' : '';
            default:
                return v ? '' : 'This field is required';
        }
    }

    /**
     * Set submit button loading state
     */
    setSubmitLoading(loading) {
        if (!this.submitBtn) return;
        if (loading) {
            this.submitBtn.disabled = true;
            this.submitBtn.dataset.originalText = this.submitBtn.innerHTML;
            this.submitBtn.innerHTML = '<span class="btn-spinner"></span> Submitting...';
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = this.submitBtn.dataset.originalText || 'Submit ✓';
        }
    }

    /**
     * Update age display from DOB (call on input/change of dob)
     */
    updateAgeDisplay() {
        if (!this.ageDisplay || !this.dobInput) return;
        const dob = (this.dobInput.value || '').trim();
        if (!dob) {
            this.ageDisplay.textContent = '';
            this.ageDisplay.classList.remove('show');
            return;
        }
        const age = Utils.calculateAge(dob);
        if (isNaN(age) || age < 0 || age > 120) {
            this.ageDisplay.textContent = '';
            this.ageDisplay.classList.remove('show');
            return;
        }
        this.ageDisplay.textContent = age === 1 ? '1 year old' : age + ' years old';
        this.ageDisplay.classList.add('show');
    }

    /**
     * Clear form and all validation state
     */
    clearForm() {
        this.studentForm.reset();
        this.imagePreview.innerHTML = '';
        if (this.profileImage) this.profileImage.dataset.base64 = '';
        this.addFormSelectedTags = [];
        this.renderAddFormTags([]);
        this.showFormStep(1);
        this.updateAgeDisplay();
        document.querySelectorAll('.error-message').forEach(msg => {
            msg.classList.remove('show');
            msg.textContent = '';
        });
        this.studentForm.querySelectorAll('input, select').forEach(el => el.classList.remove('error'));
    }

    /**
     * Initialize form
     */
    initializeForm() {
        this.clearForm();
        this.showFormStep(1);
    }

    /**
     * Render review step
     */
    renderReview() {
        const data = this.getFormData();
        const reviewContent = document.getElementById('reviewContent');
        const e = Utils.escapeHtml;
        const age = (data.dob && Utils.calculateAge(data.dob)) || '';

        const html = `
            <div class="review-grid">
                <div class="review-item">
                    <span class="review-label">Full Name</span>
                    <span class="review-value">${e(data.firstName)} ${e(data.lastName)}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Date of Birth</span>
                    <span class="review-value">${e(data.dob)} ${age ? '(' + age + ' years)' : ''}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Gender</span>
                    <span class="review-value">${e(data.gender)}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Email</span>
                    <span class="review-value">${e(data.email)}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Department</span>
                    <span class="review-value">${e(data.department)}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Year</span>
                    <span class="review-value">${e(data.year)}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">GPA</span>
                    <span class="review-value">${e(data.gpa)}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Attendance</span>
                    <span class="review-value">${e(data.attendance)}%</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Assignment Score</span>
                    <span class="review-value">${e(data.assignmentScore != null && data.assignmentScore !== '' ? data.assignmentScore : '0')}%</span>
                </div>
                <div class="review-item review-item-full">
                    <span class="review-label">Phone</span>
                    <span class="review-value">${e(data.phone)}</span>
                </div>
                <div class="review-item review-item-full">
                    <span class="review-label">Address</span>
                    <span class="review-value">${e(data.address)}, ${e(data.city)}, ${e(data.state)} ${e(data.zipcode)}, ${e(data.country)}</span>
                </div>
                ${(this.addFormSelectedTags && this.addFormSelectedTags.length) ? `<div class="review-item review-item-full"><span class="review-label">Tags</span><span class="review-value">${(this.addFormSelectedTags || []).map(t => e(t)).join(', ')}</span></div>` : ''}
            </div>
        `;

        reviewContent.innerHTML = html;
    }

    /**
     * Get tags as badge HTML for a student (normalized for display)
     */
    getStudentTagsBadges(student) {
        const tags = Utils.normalizeTags(Array.isArray(student.tags) ? student.tags : []);
        if (tags.length === 0) return '<span class="tags-none">—</span>';
        const e = Utils.escapeHtml;
        return tags.map(t => `<span class="tag-badge">${e(t)}</span>`).join('');
    }

    /**
     * Get avatar HTML for a student (profile image or initials)
     */
    getStudentAvatar(student) {
        const e = Utils.escapeHtml;
        const initials = ((student.firstName || '').charAt(0) + (student.lastName || '').charAt(0)).toUpperCase() || '?';
        if (student.profileImage) {
            return `<img src="${student.profileImage}" alt="" class="student-table-avatar" />`;
        }
        return `<span class="student-table-avatar student-table-avatar-initials">${e(initials)}</span>`;
    }

    /**
     * Render students table
     */
    renderStudentsTable(students) {
        if (students.length === 0) {
            this.studentsTableBody.innerHTML = '<tr class="empty-row"><td colspan="10">No students found.</td></tr>';
            this.pagination.innerHTML = '';
            return;
        }

        // Pagination
        const totalPages = Math.ceil(students.length / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageStudents = students.slice(start, end);

        // Destroy previous table sparklines before re-render
        this.destroyTableSparklines();

        // Render rows (escape text to prevent XSS)
        const e = Utils.escapeHtml;
        const html = pageStudents.map(student => `
            <tr class="student-row clickable" data-id="${e(student.id)}" title="Click to view full profile">
                <td class="col-photo">${this.getStudentAvatar(student)}</td>
                <td>${e(student.id)}</td>
                <td>${e(student.firstName)} ${e(student.lastName)}</td>
                <td>${e(student.email)}</td>
                <td>${e(student.department)}</td>
                <td>${e(student.year)}</td>
                <td class="col-tags">${this.getStudentTagsBadges(student)}</td>
                <td><span class="status-badge status-${e((student.status || 'Active').toLowerCase())}">${e(student.status)}</span></td>
                <td>${e(student.gpa)}</td>
                <td class="col-sparkline"><div class="sparkline-wrap"><canvas class="sparkline-canvas" data-id="${e(student.id)}" width="80" height="28"></canvas></div></td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="action-btn edit-btn" data-id="${e(student.id)}" title="Edit">✏️</button>
                        <button type="button" class="action-btn delete-btn" data-id="${e(student.id)}" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.studentsTableBody.innerHTML = html;

        this.renderTableSparklines(pageStudents);
        // Render pagination
        this.renderPagination(totalPages);
    }

    /**
     * Destroy all table sparkline charts (call before re-rendering table)
     */
    destroyTableSparklines() {
        Object.keys(this.sparklineCharts).forEach(id => {
            if (this.sparklineCharts[id]) {
                this.sparklineCharts[id].destroy();
            }
        });
        this.sparklineCharts = {};
    }

    /**
     * Get line color for trend (up=green, down=red, stable=blue)
     */
    getSparklineColor(trend) {
        if (trend === 'up') return 'rgb(16, 185, 129)';
        if (trend === 'down') return 'rgb(239, 68, 68)';
        return 'rgb(99, 102, 241)';
    }

    /**
     * Render mini sparklines for each visible student row (Chart.js)
     */
    renderTableSparklines(students) {
        if (!students || !window.Chart) return;
        const selId = (id) => (id || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        students.forEach(student => {
            const row = this.studentsTableBody.querySelector('tr.student-row[data-id="' + selId(student.id) + '"]');
            const canvas = row ? row.querySelector('.sparkline-canvas') : null;
            if (!canvas) return;
            const history = Array.isArray(student.performanceHistory) ? student.performanceHistory : [];
            const trend = model.getPerformanceTrend(history);
            const color = this.getSparklineColor(trend);
            const data = history.length ? history : [0];
            const minVal = Math.min(...data);
            const maxVal = Math.max(...data);
            const yMin = Math.max(0, minVal - 2);
            const yMax = Math.min(100, maxVal + 2);
            const chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: data.map((_, i) => i),
                    datasets: [{
                        data: data,
                        borderColor: color,
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        fill: false,
                        tension: 0.2,
                        pointRadius: 0,
                        pointHoverRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: true } },
                    scales: {
                        x: { display: false },
                        y: { display: false, min: yMin, max: yMax }
                    }
                }
            });
            this.sparklineCharts[student.id] = chart;
        });
    }

    /**
     * Render pagination (controller must set window.controller for goToStudentsPage)
     */
    renderPagination(totalPages) {
        if (totalPages <= 1) {
            this.pagination.innerHTML = '';
            return;
        }

        let html = '';

        // Previous button
        if (this.currentPage > 1) {
            html += '<button type="button" class="pagination-btn" data-page="' + (this.currentPage - 1) + '">← Previous</button>';
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                html += '<button type="button" class="pagination-btn active" data-page="' + i + '">' + i + '</button>';
            } else {
                html += '<button type="button" class="pagination-btn" data-page="' + i + '">' + i + '</button>';
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            html += '<button type="button" class="pagination-btn" data-page="' + (this.currentPage + 1) + '">Next →</button>';
        }

        this.pagination.innerHTML = html;
    }

    /**
     * Render tags list in Add form (optional tags)
     */
    renderAddFormTags(tagsArray) {
        const tags = Array.isArray(tagsArray) ? tagsArray : [];
        this.addFormSelectedTags = tags.slice();
        if (!this.addTagsList) return;
        const e = Utils.escapeHtml;
        this.addTagsList.innerHTML = tags.length === 0
            ? ''
            : tags.map((t, i) => `<span class="tag-badge tag-badge-edit"><span class="tag-badge-text">${e(t)}</span><button type="button" class="tag-badge-remove tag-badge-remove-add" data-index="${i}" title="Remove tag">&times;</button></span>`).join('');
    }

    /**
     * Render tags list in edit modal (updates hidden input and tag badges)
     */
    renderEditModalTags(tagsArray) {
        const tags = Utils.normalizeTags(Array.isArray(tagsArray) ? tagsArray : []);
        if (this.editTagsHidden) this.editTagsHidden.value = JSON.stringify(tags);
        if (!this.editTagsList) return;
        const e = Utils.escapeHtml;
        this.editTagsList.innerHTML = tags.length === 0
            ? ''
            : tags.map((t, i) => `<span class="tag-badge tag-badge-edit"><span class="tag-badge-text">${e(t)}</span><button type="button" class="tag-badge-remove" data-index="${i}" title="Remove tag">&times;</button></span>`).join('');
    }

    /**
     * Open edit modal
     */
    openEditModal(student) {
        this.currentEditingId = student.id;
        document.getElementById('editFirstName').value = student.firstName;
        document.getElementById('editLastName').value = student.lastName;
        document.getElementById('editEmail').value = student.email;
        document.getElementById('editDepartment').value = student.department;
        document.getElementById('editYear').value = student.year;
        document.getElementById('editGPA').value = student.gpa;
        document.getElementById('editAttendance').value = student.attendance;
        const editAssignmentEl = document.getElementById('editAssignmentScore');
        if (editAssignmentEl) editAssignmentEl.value = student.assignmentScore != null && student.assignmentScore !== '' ? student.assignmentScore : '0';
        const tags = Utils.normalizeTags(Array.isArray(student.tags) ? student.tags : []);
        this.renderEditModalTags(tags);
        if (this.editTagSelect) this.editTagSelect.selectedIndex = 0;
        this.editModal.classList.add('active');
    }

    /**
     * Close edit modal
     */
    closeEditModal() {
        this.editModal.classList.remove('active');
        this.editForm.reset();
        this.currentEditingId = null;
    }

    /**
     * Open delete modal
     */
    openDeleteModal(studentId) {
        this.currentDeletingId = studentId;
        this.deleteModal.classList.add('active');
    }

    /**
     * Close delete modal
     */
    closeDeleteModal() {
        this.deleteModal.classList.remove('active');
        this.currentDeletingId = null;
    }

    /**
     * Open student detail modal with full profile
     */
    openStudentDetailModal(student) {
        this.currentDetailStudentId = student.id;
        this.destroyDetailSparkline();
        const e = Utils.escapeHtml;
        const age = (student.dob && Utils.calculateAge(student.dob)) ? Utils.calculateAge(student.dob) + ' years' : '—';
        const avatarHtml = student.profileImage
            ? `<img src="${student.profileImage}" alt="" class="student-detail-photo" />`
            : `<span class="student-detail-photo student-detail-photo-initials">${e((student.firstName || '').charAt(0) + (student.lastName || '').charAt(0)).toUpperCase() || '?'}</span>`;

        const analysis = model.getPerformanceAnalysis(student);
        const history = analysis.history || [];
        const trendClass = analysis.trend === 'up' ? 'trend-up' : (analysis.trend === 'down' ? 'trend-down' : 'trend-stable');

        this.studentDetailBody.innerHTML = `
            <div class="student-detail-header">
                <div class="student-detail-avatar-wrap">${avatarHtml}</div>
                <div class="student-detail-title">
                    <h3>${e(student.firstName)} ${e(student.lastName)}</h3>
                    <span class="student-detail-id">${e(student.id)}</span>
                    <span class="status-badge status-${e((student.status || 'Active').toLowerCase())}">${e(student.status || 'Active')}</span>
                </div>
            </div>
            <div class="student-detail-grid">
                <div class="detail-item"><span class="detail-label">Date of Birth</span><span class="detail-value">${e(student.dob || '—')} ${age !== '—' ? '(' + age + ')' : ''}</span></div>
                <div class="detail-item"><span class="detail-label">Gender</span><span class="detail-value">${e(student.gender || '—')}</span></div>
                <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${e(student.email || '—')}</span></div>
                <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">${e(student.phone || '—')}</span></div>
                <div class="detail-item"><span class="detail-label">Department</span><span class="detail-value">${e(student.department || '—')}</span></div>
                <div class="detail-item"><span class="detail-label">Year</span><span class="detail-value">${e(student.year || '—')}</span></div>
                <div class="detail-item"><span class="detail-label">GPA</span><span class="detail-value">${e(student.gpa != null ? student.gpa : '—')}</span></div>
                <div class="detail-item"><span class="detail-label">Attendance</span><span class="detail-value">${student.attendance != null ? e(student.attendance) + '%' : '—'}</span></div>
                <div class="detail-item"><span class="detail-label">Assignment Score</span><span class="detail-value">${student.assignmentScore != null && student.assignmentScore !== '' ? e(student.assignmentScore) + '%' : '—'}</span></div>
                <div class="detail-item"><span class="detail-label">Enrollment Date</span><span class="detail-value">${e(student.enrollmentDate || '—')}</span></div>
                ${(Array.isArray(student.tags) && student.tags.length) ? `<div class="detail-item detail-item-full"><span class="detail-label">Tags</span><span class="detail-value detail-tags">${student.tags.map(t => `<span class="tag-badge">${e(t)}</span>`).join('')}</span></div>` : ''}
                <div class="detail-item detail-item-full"><span class="detail-label">Address</span><span class="detail-value">${e([student.address, student.city, student.state, student.zipcode, student.country].filter(Boolean).join(', ') || '—')}</span></div>
            </div>
            <div class="detail-performance">
                <h4 class="detail-performance-title">Performance Trend</h4>
                <div class="detail-sparkline-wrap"><canvas id="detailSparklineCanvas"></canvas></div>
                <p class="detail-performance-summary ${e(trendClass)}">${e(analysis.trendLabel)}</p>
                <p class="detail-consistency">${e(analysis.consistencyLabel)}</p>
            </div>
        `;
        this.studentDetailModal.classList.add('active');
        this.renderDetailSparkline(student);
    }

    /**
     * Close student detail modal
     */
    closeStudentDetailModal() {
        this.destroyDetailSparkline();
        this.studentDetailModal.classList.remove('active');
        this.currentDetailStudentId = null;
    }

    /**
     * Destroy detail modal sparkline chart
     */
    destroyDetailSparkline() {
        if (this.detailSparklineChart) {
            this.detailSparklineChart.destroy();
            this.detailSparklineChart = null;
        }
    }

    /**
     * Render larger sparkline in student detail modal (Chart.js)
     */
    renderDetailSparkline(student) {
        const canvas = document.getElementById('detailSparklineCanvas');
        if (!canvas || !window.Chart) return;
        const history = Array.isArray(student.performanceHistory) ? student.performanceHistory : [];
        const trend = model.getPerformanceTrend(history);
        const color = this.getSparklineColor(trend);
        const data = history.length ? history : [0];
        const minVal = data.length ? Math.min(...data) : 0;
        const maxVal = data.length ? Math.max(...data) : 100;
        const yMin = Math.max(0, minVal - 2);
        const yMax = Math.min(100, maxVal + 2);
        this.detailSparklineChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.map((_, i) => (i + 1).toString()),
                datasets: [{
                    label: 'Performance',
                    data: data,
                    borderColor: color,
                    backgroundColor: trend === 'up' ? 'rgba(16, 185, 129, 0.1)' : (trend === 'down' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)'),
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: color,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.2,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(ctx) {
                                return 'Score: ' + (ctx.raw != null ? Number(ctx.raw).toFixed(2) : '—');
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: { display: true, text: 'Update' },
                        ticks: { maxTicksLimit: 6 }
                    },
                    y: { display: true, title: { display: true, text: 'Score' }, min: yMin, max: yMax }
                }
            }
        });
    }

    /**
     * Update dashboard stats
     */
    updateDashboardStats(stats) {
        this.totalStudents.textContent = stats.totalStudents;
        this.activeStudents.textContent = stats.activeStudents;
        this.departmentCount.textContent = stats.departmentCount;
        this.avgAttendance.textContent = stats.avgAttendance + '%';
    }

    /**
     * Render department cards
     */
    renderDepartmentCards(departments) {
        const html = departments.map(dept => `
            <div class="dept-card">
                <div class="dept-name">${dept.name}</div>
                <div class="dept-count">${dept.count}</div>
            </div>
        `).join('');

        this.departmentCards.innerHTML = html;
    }

    /**
     * Update settings display
     */
    updateSettingsDisplay(lastModified, totalRecords) {
        this.lastUpdated.textContent = lastModified;
        this.totalRecords.textContent = totalRecords;
    }

    /**
     * Get icon for activity type (History timeline)
     */
    getActivityIcon(actionType) {
        const icons = {
            student_added: '➕',
            student_edited: '✏️',
            student_deleted: '🗑️',
            tag_added: '🏷️',
            tag_removed: '🏷️',
            performance_updated: '📊',
            data_imported: '📥',
            data_cleared: '🗑️'
        };
        return icons[actionType] || '•';
    }

    /**
     * Get display label for activity type
     */
    getActivityLabel(actionType) {
        const labels = {
            student_added: 'Student Added',
            student_edited: 'Student Edited',
            student_deleted: 'Student Deleted',
            tag_added: 'Tag Added',
            tag_removed: 'Tag Removed',
            performance_updated: 'Performance Updated',
            data_imported: 'Data Imported',
            data_cleared: 'Data Cleared'
        };
        return labels[actionType] || actionType;
    }

    /**
     * Get date group label for timeline (Today, Yesterday, Older)
     */
    getDateGroupLabel(isoString) {
        const d = new Date(isoString);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
        const t = d.getTime();
        if (t >= todayStart) return 'Today';
        if (t >= yesterdayStart) return 'Yesterday';
        return 'Older';
    }

    /**
     * Format time for timeline (e.g. "2:30 PM" or "Jan 15, 2:30 PM" for older)
     */
    formatActivityTime(isoString) {
        const d = new Date(isoString);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const t = d.getTime();
        const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        if (t >= todayStart) return timeStr;
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' + timeStr;
    }

    /**
     * Render History timeline (grouped by Today / Yesterday / Older, most recent first)
     */
    renderHistoryTimeline(activities) {
        if (!this.historyTimeline || !this.historyEmpty) return;

        if (activities.length === 0) {
            this.historyTimeline.innerHTML = '';
            this.historyTimeline.style.display = 'none';
            this.historyEmpty.style.display = 'block';
            return;
        }

        this.historyEmpty.style.display = 'none';
        this.historyTimeline.style.display = 'block';

        const e = Utils.escapeHtml;
        const groups = { Today: [], Yesterday: [], Older: [] };
        activities.forEach(act => {
            const group = this.getDateGroupLabel(act.timestamp);
            if (groups[group]) groups[group].push(act);
        });

        let html = '';
        ['Today', 'Yesterday', 'Older'].forEach(groupLabel => {
            const items = groups[groupLabel];
            if (items.length === 0) return;
            html += `<div class="history-group" data-group="${e(groupLabel)}">`;
            html += `<div class="history-group-title">${e(groupLabel)}</div>`;
            items.forEach((act, idx) => {
                const icon = this.getActivityIcon(act.actionType);
                const label = this.getActivityLabel(act.actionType);
                const timeStr = this.formatActivityTime(act.timestamp);
                html += `
                    <div class="history-item" data-id="${e(act.id)}" role="listitem">
                        <div class="history-item-icon history-icon-${e(act.actionType)}">${icon}</div>
                        <div class="history-item-content">
                            <div class="history-item-header">
                                <span class="history-item-action">${e(label)}</span>
                                <span class="history-item-time">${e(timeStr)}</span>
                            </div>
                            <div class="history-item-student">${e(act.studentName)}</div>
                            ${act.description ? `<div class="history-item-desc">${e(act.description)}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        });

        this.historyTimeline.innerHTML = html;
    }

    /**
     * Open Clear History confirmation modal
     */
    openClearHistoryModal() {
        if (this.clearHistoryModal) this.clearHistoryModal.classList.add('active');
    }

    /**
     * Close Clear History modal
     */
    closeClearHistoryModal() {
        if (this.clearHistoryModal) this.clearHistoryModal.classList.remove('active');
    }

    /**
     * Get current History filters (for controller to pass to activityModel.getFiltered)
     */
    getHistoryFilters() {
        return {
            search: this.historySearch ? this.historySearch.value : '',
            actionType: this.historyActionFilter ? this.historyActionFilter.value : '',
            dateGroup: this.historyDateFilter ? this.historyDateFilter.value : ''
        };
    }

    /**
     * Show toast notification (optionally with Undo button)
     * @param {string} message
     * @param {string} type - 'info' | 'success' | 'error'
     * @param {Object} options - { undoLabel, onUndo } for undo toast
     */
    showToast(message, type = 'info', options) {
        this.toast.innerHTML = '';
        this.toast.className = 'toast ' + type + ' show';
        this.toast.appendChild(document.createTextNode(message));

        if (options && options.undoLabel && typeof options.onUndo === 'function') {
            const undoBtn = document.createElement('button');
            undoBtn.type = 'button';
            undoBtn.className = 'toast-undo-btn';
            undoBtn.textContent = options.undoLabel;
            undoBtn.addEventListener('click', () => {
                options.onUndo();
                this.toast.classList.remove('show');
            });
            this.toast.appendChild(undoBtn);
        }

        const duration = options && options.undoLabel ? 8000 : 3000;
        clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => {
            this.toast.classList.remove('show');
        }, duration);
    }

    /**
     * Show loading overlay
     */
    showLoading() {
        this.loadingOverlay.classList.add('active');
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }

    /**
     * Set dark mode
     */
    setDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark-mode');
            this.themeToggle.textContent = '☀️';
            this.darkModeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            this.themeToggle.textContent = '🌙';
            this.darkModeToggle.checked = false;
        }
    }

    /**
     * Load theme from settings
     */
    loadTheme() {
        const settings = model.getSettings();
        this.setDarkMode(settings.darkMode);
    }

    /**
     * Handle image preview
     */
    async handleImagePreview(file) {
        if (file && file.type.startsWith('image/')) {
            const base64 = await Utils.fileToBase64(file);
            this.profileImage.dataset.base64 = base64;
            this.imagePreview.innerHTML = `<img src="${base64}" alt="Profile">`;
        }
    }
}

// Create global instance
const view = new StudentView();
