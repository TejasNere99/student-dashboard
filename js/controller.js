/**
 * CONTROLLER LAYER
 * Handles events, user interactions, and communication between Model and View
 * MVC Pattern: Controller
 */

class StudentController {
    constructor() {
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.updateDashboard();
        view.switchPage('dashboard');
        
        // Add sample data if no students exist
        if (model.getTotalStudents() === 0) {
            this.addSampleData();
        }

        console.log('Student Management Dashboard initialized!');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Navigation
        view.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.handlePageChange(page);
            });
        });

        // Sidebar toggle
        view.sidebarToggle.addEventListener('click', () => {
            view.sidebar.classList.toggle('active');
        });

        // Theme toggle
        view.themeToggle.addEventListener('click', () => this.toggleTheme());
        view.darkModeToggle.addEventListener('change', (e) => this.setDarkMode(e.target.checked));

        // Form navigation
        view.nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleNextStep();
        });

        view.prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handlePrevStep();
        });

        // Form submission
        view.studentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Real-time form validation (blur)
        this.setupFormValidation();

        // Age display from DOB
        if (view.dobInput) {
            view.dobInput.addEventListener('input', () => view.updateAgeDisplay());
            view.dobInput.addEventListener('change', () => view.updateAgeDisplay());
        }

        // Image preview
        view.profileImage.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                view.handleImagePreview(e.target.files[0]);
            }
        });

        // Students table filters
        view.searchInput.addEventListener('input', () => {
            if (view.globalSearch) view.globalSearch.value = view.searchInput.value;
            this.updateStudentsTable();
        });
        view.departmentFilter.addEventListener('change', () => this.updateStudentsTable());
        view.yearFilter.addEventListener('change', () => this.updateStudentsTable());
        view.genderFilter.addEventListener('change', () => this.updateStudentsTable());
        if (view.tagFilter) view.tagFilter.addEventListener('change', () => this.updateStudentsTable());
        view.sortSelect.addEventListener('change', () => this.updateStudentsTable());

        // Global header search: sync when on students page; from any page, Enter navigates to Students with search
        if (view.globalSearch) {
            view.globalSearch.addEventListener('input', () => {
                if (view.searchInput) view.searchInput.value = view.globalSearch.value;
                const studentsPage = document.getElementById('students-page');
                if (studentsPage && studentsPage.classList.contains('active')) {
                    this.updateStudentsTable();
                }
            });
            view.globalSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const term = (view.globalSearch.value || '').trim();
                    if (view.searchInput) view.searchInput.value = term;
                    view.globalSearch.value = term;
                    this.handlePageChange('students');
                }
            });
        }

        // Edit modal
        view.editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditSubmit();
        });

        // Edit modal: add tag from dropdown
        if (view.editTagAddBtn && view.editTagSelect) {
            view.editTagAddBtn.addEventListener('click', () => this.handleEditTagAdd());
        }
        // Edit modal: remove tag (delegated)
        if (view.editTagsList) {
            view.editTagsList.addEventListener('click', (e) => {
                const btn = e.target.closest('.tag-badge-remove');
                if (btn && btn.dataset.index !== undefined) {
                    const index = parseInt(btn.dataset.index, 10);
                    let tags = [];
                    try {
                        tags = JSON.parse(view.editTagsHidden.value || '[]');
                    } catch (_) {}
                    tags.splice(index, 1);
                    view.renderEditModalTags(tags);
                }
            });
        }
        // Add form: add tag from dropdown
        if (view.addTagAddBtn && view.addTagSelect) {
            view.addTagAddBtn.addEventListener('click', () => this.handleAddTagAdd());
        }
        // Add form: remove tag (delegated)
        if (view.addTagsList) {
            view.addTagsList.addEventListener('click', (e) => {
                const btn = e.target.closest('.tag-badge-remove-add');
                if (btn && btn.dataset.index !== undefined) {
                    const index = parseInt(btn.dataset.index, 10);
                    view.addFormSelectedTags.splice(index, 1);
                    view.renderAddFormTags(view.addFormSelectedTags);
                }
            });
        }

        if (view.closeEditModalBtn) view.closeEditModalBtn.addEventListener('click', () => view.closeEditModal());
        if (view.cancelEditBtn) view.cancelEditBtn.addEventListener('click', () => view.closeEditModal());
        if (view.editModal) view.editModal.addEventListener('click', (e) => { if (e.target === view.editModal) view.closeEditModal(); });

        // Delete modal
        if (view.closeDeleteModalBtn) view.closeDeleteModalBtn.addEventListener('click', () => view.closeDeleteModal());
        if (view.cancelDeleteBtn) view.cancelDeleteBtn.addEventListener('click', () => view.closeDeleteModal());
        if (view.confirmDeleteBtn) view.confirmDeleteBtn.addEventListener('click', () => this.handleDeleteConfirm());
        if (view.deleteModal) view.deleteModal.addEventListener('click', (e) => { if (e.target === view.deleteModal) view.closeDeleteModal(); });

        // Student detail modal (row click)
        if (view.studentsTableBody) {
            view.studentsTableBody.addEventListener('click', (e) => {
                const row = e.target.closest('tr.student-row.clickable');
                if (!row) return;
                if (e.target.closest('.action-buttons')) return; // Edit/Delete handled separately
                const id = row.dataset.id;
                const student = model.getStudentById(id);
                if (student) view.openStudentDetailModal(student);
            });
        }
        if (view.closeStudentDetailModalBtn) view.closeStudentDetailModalBtn.addEventListener('click', () => view.closeStudentDetailModal());
        if (view.closeStudentDetailBtn) view.closeStudentDetailBtn.addEventListener('click', () => view.closeStudentDetailModal());
        if (view.studentDetailModal) view.studentDetailModal.addEventListener('click', (e) => { if (e.target === view.studentDetailModal) view.closeStudentDetailModal(); });
        if (view.editFromDetailBtn) view.editFromDetailBtn.addEventListener('click', () => {
            if (view.currentDetailStudentId) {
                const student = model.getStudentById(view.currentDetailStudentId);
                if (student) {
                    view.closeStudentDetailModal();
                    view.openEditModal(student);
                }
            }
        });

        // Reports
        view.exportBtn.addEventListener('click', () => this.handleExport());
        view.importBtn.addEventListener('click', () => view.importFile.click());
        view.importFile.addEventListener('change', (e) => this.handleImport(e));
        view.clearAllBtn.addEventListener('click', () => this.handleClearAll());

        // History page
        if (view.historySearch) view.historySearch.addEventListener('input', () => this.refreshHistoryPage());
        if (view.historyActionFilter) view.historyActionFilter.addEventListener('change', () => this.refreshHistoryPage());
        if (view.historyDateFilter) view.historyDateFilter.addEventListener('change', () => this.refreshHistoryPage());
        if (view.clearHistoryBtn) view.clearHistoryBtn.addEventListener('click', () => view.openClearHistoryModal());
        if (view.closeClearHistoryModalBtn) view.closeClearHistoryModalBtn.addEventListener('click', () => view.closeClearHistoryModal());
        if (view.cancelClearHistoryBtn) view.cancelClearHistoryBtn.addEventListener('click', () => view.closeClearHistoryModal());
        if (view.confirmClearHistoryBtn) view.confirmClearHistoryBtn.addEventListener('click', () => this.handleConfirmClearHistory());
        if (view.clearHistoryModal) view.clearHistoryModal.addEventListener('click', (e) => { if (e.target === view.clearHistoryModal) view.closeClearHistoryModal(); });
    }

    /**
     * Handle page change
     */
    handlePageChange(page) {
        view.switchPage(page);

        if (page === 'dashboard') {
            this.updateDashboard();
        } else if (page === 'reports') {
            this.updateDashboard();
            // Re-initialize charts after Reports page is visible so canvas dimensions are correct
            setTimeout(() => {
                chartManager.destroyAllCharts();
                chartManager.initializeCharts(model.getStatistics());
            }, 150);
        } else if (page === 'students') {
            view.currentPage = 1;
            if (view.globalSearch && view.searchInput) view.searchInput.value = view.globalSearch.value;
            this.updateStudentsTable();
        } else if (page === 'add-student') {
            view.initializeForm();
            view.updateAgeDisplay();
        } else if (page === 'settings') {
            this.updateSettings();
        } else if (page === 'history') {
            this.refreshHistoryPage();
        }
    }

    /**
     * Handle next step in form
     */
    handleNextStep() {
        if (view.validateFormStep(view.currentStep)) {
            if (view.currentStep === 3) {
                view.renderReview();
            }
            view.showFormStep(view.currentStep + 1);
        } else {
            view.showToast('Please fill all required fields', 'error');
        }
    }

    /**
     * Handle previous step in form
     */
    handlePrevStep() {
        view.showFormStep(view.currentStep - 1);
    }

    /**
     * Setup real-time validation on form fields (blur)
     */
    setupFormValidation() {
        const form = view.studentForm;
        if (!form) return;
        form.querySelectorAll('input:not([type="file"]), select').forEach(input => {
            input.addEventListener('blur', () => {
                const msg = view.validateField(input.name, input.value);
                if (msg) view.showFieldError(input.name, msg);
                else view.clearFieldError(input.name);
            });
            input.addEventListener('input', () => {
                view.clearFieldError(input.name);
            });
        });
    }

    /**
     * Handle form submission (with duplicate check and loading state)
     */
    handleFormSubmit() {
        const formData = view.getFormData();

        // Full validation
        if (!model.validateStudent(formData)) {
            view.showToast('Please fix the errors in the form', 'error');
            return;
        }

        // Strict duplicate check: same email (go to step 2 so user sees the field)
        if (model.emailExists(formData.email)) {
            view.showFormStep(2);
            view.showFieldError('email', 'This email is already registered');
            view.showToast('A student with this email already exists', 'error');
            return;
        }

        // Strict duplicate check: same first name + last name + DOB
        if (model.duplicateByNameAndDob(formData.firstName, formData.lastName, formData.dob)) {
            view.showToast('A student with the same name and date of birth already exists', 'error');
            return;
        }

        view.setSubmitLoading(true);

        setTimeout(() => {
            try {
                const student = model.addStudent(formData);
                const fullName = (student.firstName + ' ' + student.lastName).trim();
                activityModel.log('student_added', fullName, 'Registered new student.');
                view.setSubmitLoading(false);
                view.showToast('Student registered successfully!', 'success');
                view.clearForm();
                this.handlePageChange('students');
                this.updateStudentsTable();
                this.updateDashboard();
            } catch (error) {
                view.setSubmitLoading(false);
                view.showToast(error.message || 'Invalid student data', 'error');
            }
        }, 600);
    }

    /**
     * Update students table (search -> filter -> sort -> paginate -> render)
     */
    updateStudentsTable() {
        let students = model.getAllStudents();

        // Apply search (from table search or global search when on this page)
        const searchTerm = (view.searchInput && view.searchInput.value ? view.searchInput.value : '').trim();
        if (searchTerm) {
            students = model.searchStudents(searchTerm);
        }

        // Apply filters on the current list (department, year, gender, tag)
        const filters = {};
        if (view.departmentFilter && view.departmentFilter.value) filters.department = view.departmentFilter.value;
        if (view.yearFilter && view.yearFilter.value) filters.year = view.yearFilter.value;
        if (view.genderFilter && view.genderFilter.value) filters.gender = view.genderFilter.value;
        if (view.tagFilter && view.tagFilter.value) filters.tag = view.tagFilter.value;
        if (Object.keys(filters).length > 0) {
            students = Utils.filterArray(students, filters);
        }

        // Apply sort
        const sortBy = view.sortSelect ? view.sortSelect.value : 'name-asc';
        students = Utils.sortStudentsList(students, sortBy);

        // Render table (view handles pagination slice)
        view.renderStudentsTable(students);

        // Attach table action handlers and pagination handlers
        this.attachTableActionHandlers();
        this.attachPaginationHandlers();
    }

    /**
     * Attach table action handlers (Edit, Delete)
     */
    attachTableActionHandlers() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const student = model.getStudentById(btn.dataset.id);
                if (student) {
                    view.openEditModal(student);
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                view.openDeleteModal(btn.dataset.id);
            });
        });
    }

    /**
     * Attach pagination button handlers (re-render table for selected page)
     */
    attachPaginationHandlers() {
        if (!view.pagination) return;
        view.pagination.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page, 10);
                if (page >= 1) {
                    view.currentPage = page;
                    this.updateStudentsTable();
                }
            });
        });
    }

    /**
     * Go to a specific page on All Students (used by pagination)
     */
    goToStudentsPage(pageNum) {
        view.currentPage = pageNum;
        this.updateStudentsTable();
    }

    /**
     * Handle edit submission
     */
    handleEditTagAdd() {
        const select = view.editTagSelect;
        const val = (select && select.value || '').trim();
        if (!val) return;
        let tags = [];
        try {
            tags = JSON.parse(view.editTagsHidden.value || '[]');
        } catch (_) {}
        const canonical = Utils.normalizeTag(val);
        if (tags.some(t => t.toLowerCase() === canonical.toLowerCase())) {
            view.showToast('Tag already added', 'info');
            return;
        }
        tags.push(canonical);
        view.renderEditModalTags(tags);
        if (select) select.selectedIndex = 0;
    }

    handleAddTagAdd() {
        const select = view.addTagSelect;
        const val = (select && select.value || '').trim();
        if (!val) return;
        const canonical = Utils.normalizeTag(val);
        const current = view.addFormSelectedTags || [];
        if (current.some(t => t.toLowerCase() === canonical.toLowerCase())) {
            view.showToast('Tag already added', 'info');
            return;
        }
        view.addFormSelectedTags = current.concat(canonical);
        view.renderAddFormTags(view.addFormSelectedTags);
        if (select) select.selectedIndex = 0;
    }

    handleEditSubmit() {
        const formData = new FormData(view.editForm);
        const updates = Object.fromEntries(formData);
        // Parse tags from hidden input (JSON array)
        try {
            updates.tags = JSON.parse(updates.tags || '[]');
        } catch (_) {
            updates.tags = [];
        }

        const oldStudent = model.getStudentById(view.currentEditingId);
        const oldTags = Utils.normalizeTags(Array.isArray(oldStudent.tags) ? oldStudent.tags : []);
        const newTags = Utils.normalizeTags(updates.tags || []);
        const tagsAdded = newTags.filter(t => !oldTags.some(ot => ot.toLowerCase() === t.toLowerCase()));
        const tagsRemoved = oldTags.filter(t => !newTags.some(nt => nt.toLowerCase() === t.toLowerCase()));
        const gpaChanged = String(oldStudent.gpa) !== String(updates.gpa);
        const attendanceChanged = String(oldStudent.attendance) !== String(updates.attendance);
        const assignmentScoreChanged = String(oldStudent.assignmentScore ?? '') !== String(updates.assignmentScore ?? '');
        const performanceChanged = gpaChanged || attendanceChanged || assignmentScoreChanged;
        const fullName = (oldStudent.firstName + ' ' + oldStudent.lastName).trim();

        view.showLoading();

        setTimeout(() => {
            try {
                model.updateStudent(view.currentEditingId, updates);
                if (tagsAdded.length) {
                    activityModel.log('tag_added', fullName, 'Tag(s) added: ' + tagsAdded.join(', '));
                }
                if (tagsRemoved.length) {
                    activityModel.log('tag_removed', fullName, 'Tag(s) removed: ' + tagsRemoved.join(', '));
                }
                if (performanceChanged) {
                    const parts = [];
                    if (gpaChanged) parts.push('GPA');
                    if (attendanceChanged) parts.push('attendance');
                    if (assignmentScoreChanged) parts.push('assignment score');
                    activityModel.log('performance_updated', fullName, parts.join(' and ') + ' updated.');
                }
                if (!tagsAdded.length && !tagsRemoved.length && !performanceChanged) {
                    activityModel.log('student_edited', fullName, 'Profile details updated.');
                }
                view.hideLoading();
                view.closeEditModal();
                view.showToast('Student updated successfully!', 'success');
                this.updateStudentsTable();
                this.updateDashboard();
            } catch (error) {
                view.hideLoading();
                view.showToast(error.message, 'error');
            }
        }, 500);
    }

    /**
     * Handle delete confirmation (with Undo)
     */
    handleDeleteConfirm() {
        const student = model.getStudentById(view.currentDeletingId);
        const fullName = student ? (student.firstName + ' ' + student.lastName).trim() : '—';
        view.showLoading();

        setTimeout(() => {
            try {
                model.deleteStudent(view.currentDeletingId);
                activityModel.log('student_deleted', fullName, 'Student removed from records.');
                view.hideLoading();
                view.closeDeleteModal();
                view.showToast('Student deleted.', 'success', {
                    undoLabel: 'Undo',
                    onUndo: () => this.handleUndo()
                });
                this.updateStudentsTable();
                this.updateDashboard();
            } catch (error) {
                view.hideLoading();
                view.showToast(error.message, 'error');
            }
        }, 400);
    }

    /**
     * Restore state from Undo backup (after delete or clear all)
     */
    handleUndo() {
        if (!model.restoreUndoBackup()) return;
        view.showToast('Changes reverted.', 'success');
        this.updateStudentsTable();
        this.updateDashboard();
        if (document.getElementById('settings-page').classList.contains('active')) {
            this.updateSettings();
        }
    }

    /**
     * Update dashboard
     */
    updateDashboard() {
        const stats = model.getStatistics();
        view.updateDashboardStats(stats);
        view.renderDepartmentCards(stats.departmentDistribution);
        chartManager.destroyAllCharts();
        chartManager.initializeCharts(stats);
    }

    /**
     * Refresh History page (apply filters and render timeline)
     */
    refreshHistoryPage() {
        const filters = view.getHistoryFilters();
        const activities = activityModel.getFiltered(filters);
        view.renderHistoryTimeline(activities);
    }

    /**
     * Confirm clear activity history
     */
    handleConfirmClearHistory() {
        activityModel.clearAll();
        view.closeClearHistoryModal();
        view.renderHistoryTimeline([]);
        view.showToast('Activity history cleared.', 'success');
    }

    /**
     * Update settings
     */
    updateSettings() {
        const lastModified = model.getLastModified();
        const totalRecords = model.getTotalStudents();
        view.updateSettingsDisplay(lastModified, totalRecords);
    }

    /**
     * Handle export
     */
    handleExport() {
        try {
            const data = model.exportToJSON();
            const filename = `students_${new Date().toISOString().split('T')[0]}.json`;
            Utils.downloadJSON(data, filename);
            view.showToast('Data exported successfully!', 'success');
        } catch (error) {
            view.showToast('Error exporting data', 'error');
        }
    }

    /**
     * Handle import
     */
    async handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            view.showLoading();
            const data = await Utils.readJSONFile(file);

            if (model.importFromJSON(data)) {
                activityModel.log('data_imported', '—', 'Student data imported from file.');
                view.hideLoading();
                view.showToast('Data imported successfully!', 'success');
                this.updateStudentsTable();
                this.updateDashboard();
            } else {
                view.hideLoading();
                view.showToast('Error importing data', 'error');
            }
        } catch (error) {
            view.hideLoading();
            view.showToast('Invalid JSON file', 'error');
        }

        view.importFile.value = '';
    }

    /**
     * Handle clear all data (with Undo)
     */
    handleClearAll() {
        if (!confirm('Are you sure you want to delete ALL student records? You can Undo within a few seconds.')) return;
        view.showLoading();

        setTimeout(() => {
            try {
                model.clearAllData();
                activityModel.log('data_cleared', '—', 'All student data cleared.');
                view.hideLoading();
                view.showToast('All data cleared.', 'success', {
                    undoLabel: 'Undo',
                    onUndo: () => this.handleUndo()
                });
                this.updateStudentsTable();
                this.updateDashboard();
            } catch (error) {
                view.hideLoading();
                view.showToast('Error clearing data', 'error');
            }
        }, 400);
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        this.setDarkMode(!isDarkMode);
    }

    /**
     * Set dark mode
     */
    setDarkMode(enabled) {
        view.setDarkMode(enabled);

        // Save settings
        const settings = model.getSettings();
        settings.darkMode = enabled;
        model.saveSettings(settings);

        // Update charts
        chartManager.updateChartTheme();
        this.updateDashboard();
    }

    /**
     * Load settings
     */
    loadSettings() {
        const settings = model.getSettings();
        if (settings) {
            view.setDarkMode(settings.darkMode);
            view.autoSaveInterval.value = settings.autoSaveInterval;
        }
    }

    /**
     * Add sample data for demo
     */
    addSampleData() {
        const sampleStudents = [
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@university.edu',
                dob: '2002-05-15',
                gender: 'Male',
                department: 'Computer Science',
                year: '2nd Year',
                gpa: '3.8',
                attendance: '92',
                assignmentScore: '85',
                phone: '+1 (555) 123-4567',
                address: '123 Main St',
                city: 'New York',
                state: 'NY',
                zipcode: '10001',
                country: 'USA'
            },
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@university.edu',
                dob: '2003-08-22',
                gender: 'Female',
                department: 'Engineering',
                year: '1st Year',
                gpa: '3.6',
                attendance: '88',
                assignmentScore: '78',
                phone: '+1 (555) 234-5678',
                address: '456 Oak Ave',
                city: 'Los Angeles',
                state: 'CA',
                zipcode: '90001',
                country: 'USA'
            },
            {
                firstName: 'Michael',
                lastName: 'Johnson',
                email: 'michael.j@university.edu',
                dob: '2001-12-10',
                gender: 'Male',
                department: 'Business',
                year: '3rd Year',
                gpa: '3.4',
                attendance: '85',
                assignmentScore: '72',
                phone: '+1 (555) 345-6789',
                address: '789 Pine Rd',
                city: 'Chicago',
                state: 'IL',
                zipcode: '60601',
                country: 'USA'
            },
            {
                firstName: 'Sarah',
                lastName: 'Williams',
                email: 'sarah.w@university.edu',
                dob: '2002-03-18',
                gender: 'Female',
                department: 'Computer Science',
                year: '2nd Year',
                gpa: '3.9',
                attendance: '95',
                assignmentScore: '90',
                phone: '+1 (555) 456-7890',
                address: '321 Elm St',
                city: 'Houston',
                state: 'TX',
                zipcode: '77001',
                country: 'USA'
            },
            {
                firstName: 'David',
                lastName: 'Brown',
                email: 'david.b@university.edu',
                dob: '2003-07-25',
                gender: 'Male',
                department: 'Arts',
                year: '1st Year',
                gpa: '3.2',
                attendance: '80',
                assignmentScore: '68',
                phone: '+1 (555) 567-8901',
                address: '654 Maple Dr',
                city: 'Phoenix',
                state: 'AZ',
                zipcode: '85001',
                country: 'USA'
            }
        ];

        sampleStudents.forEach(student => {
            try {
                model.addStudent(student);
            } catch (error) {
                console.log('Sample data already exists');
            }
        });

        this.updateDashboard();
        this.updateStudentsTable();
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const controller = new StudentController();
    window.controller = controller;
});
