/**
 * MODEL LAYER
 * Handles student data logic, LocalStorage operations, and business rules
 * MVC Pattern: Model
 */

class StudentModel {
    constructor() {
        this.storageKey = 'students_db';
        this.settingsKey = 'app_settings';
        this.undoKey = 'students_undo_backup';
        this.students = this.loadFromStorage();
        this._migratePerformanceHistory();
        this.nextId = this._getNextAvailableId();
    }

    /**
     * One-time migration: ensure every student has performanceHistory (persist to storage)
     */
    _migratePerformanceHistory() {
        let changed = false;
        this.students.forEach(s => {
            if (!Array.isArray(s.performanceHistory) || s.performanceHistory.length === 0) {
                const score = this.calculatePerformanceScore(s.gpa, s.attendance, s.assignmentScore);
                s.performanceHistory = [score];
                changed = true;
            } else {
                s.performanceHistory = s.performanceHistory.slice(-5);
            }
        });
        if (changed) this.saveToStorage();
    }

    /**
     * Load students from LocalStorage
     */
    loadFromStorage() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Save students to LocalStorage
     */
    saveToStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.students));
        this.updateLastModified();
    }

    /**
     * Add new student
     */
    addStudent(studentData) {
        // Validate data
        if (!this.validateStudent(studentData)) {
            throw new Error('Invalid student data');
        }

        // Check for duplicate email
        if (this.emailExists(studentData.email)) {
            throw new Error('Email already registered');
        }

        // Create student object (tags: normalized predefined only)
        const tags = Utils.normalizeTags(Array.isArray(studentData.tags) ? studentData.tags : []);
        const student = {
            id: Utils.generateStudentID(this.nextId),
            ...studentData,
            tags: tags,
            status: 'Active',
            enrollmentDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };
        const initialScore = this.calculatePerformanceScore(student.gpa, student.attendance, student.assignmentScore);
        student.performanceHistory = [initialScore];

        this.students.push(student);
        this.nextId++;
        this.saveToStorage();
        return student;
    }

    /**
     * Calculate performance score from GPA, Attendance, Assignment Score.
     * Formula: (GPA*10*0.5) + (Attendance*0.3) + (AssignmentScore*0.2)
     * AssignmentScore optional (default 0).
     */
    calculatePerformanceScore(gpa, attendance, assignmentScore) {
        const g = parseFloat(gpa);
        const a = parseFloat(attendance);
        const as = parseFloat(assignmentScore);
        const score = (isNaN(g) ? 0 : g) * 10 * 0.5 +
            (isNaN(a) ? 0 : a) * 0.3 +
            (isNaN(as) ? 0 : as) * 0.2;
        return Math.round(score * 100) / 100;
    }

    /**
     * Ensure student has performanceHistory (migrate legacy records).
     * Returns array of last 5 scores.
     */
    _ensurePerformanceHistory(student) {
        let history = Array.isArray(student.performanceHistory) ? student.performanceHistory.slice() : [];
        const currentScore = this.calculatePerformanceScore(student.gpa, student.attendance, student.assignmentScore);
        if (history.length === 0) {
            history = [currentScore];
        }
        return history.slice(-5);
    }

    /**
     * Get performance trend from last 3 values: 'up' | 'down' | 'stable'
     */
    getPerformanceTrend(performanceHistory) {
        const arr = Array.isArray(performanceHistory) ? performanceHistory.slice(-3) : [];
        if (arr.length < 2) return 'stable';
        const first = arr[0];
        const last = arr[arr.length - 1];
        const diff = last - first;
        if (diff > 0.05) return 'up';
        if (diff < -0.05) return 'down';
        return 'stable';
    }

    /**
     * Get consistency from variance: low variance -> 'high', high variance -> 'low'
     */
    getPerformanceConsistency(performanceHistory) {
        const arr = Array.isArray(performanceHistory) ? performanceHistory.slice(-5) : [];
        if (arr.length < 2) return 'high';
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length;
        return variance <= 2 ? 'high' : 'low';
    }

    /**
     * Get analysis summary for detail view: { trendLabel, consistencyLabel }
     */
    getPerformanceAnalysis(student) {
        const history = this._ensurePerformanceHistory(student);
        const trend = this.getPerformanceTrend(history);
        const consistency = this.getPerformanceConsistency(history);
        let trendLabel = 'Performance is stable.';
        if (trend === 'up') {
            const n = Math.min(3, history.length);
            trendLabel = n >= 2 ? `Performance is improving over last ${n} update${n > 1 ? 's' : ''}.` : 'Performance is improving.';
        } else if (trend === 'down') {
            trendLabel = 'Performance shows slight decline.';
        }
        const consistencyLabel = consistency === 'high' ? 'Highly Consistent' : 'Inconsistent Performance';
        return { trend, trendLabel, consistency, consistencyLabel, history };
    }

    /**
     * Get all students (ensure tags array and normalized for display, performanceHistory present)
     */
    getAllStudents() {
        return Utils.deepClone(this.students).map(s => {
            const tags = Utils.normalizeTags(Array.isArray(s.tags) ? s.tags : []);
            const performanceHistory = this._ensurePerformanceHistory(s);
            return { ...s, tags, performanceHistory };
        });
    }

    /**
     * Get student by ID (ensure tags array, normalized, performanceHistory present)
     */
    getStudentById(id) {
        const s = this.students.find(s => s.id === id);
        if (!s) return undefined;
        const clone = Utils.deepClone(s);
        clone.tags = Utils.normalizeTags(Array.isArray(clone.tags) ? clone.tags : []);
        clone.performanceHistory = this._ensurePerformanceHistory(clone);
        return clone;
    }

    /**
     * Update student
     */
    updateStudent(id, updates) {
        const index = this.students.findIndex(s => s.id === id);
        if (index === -1) throw new Error('Student not found');

        // Check if email is being changed and if new email already exists (exclude current student)
        if (updates.email && updates.email !== this.students[index].email) {
            if (this.emailExists(updates.email, id)) {
                throw new Error('Email already registered');
            }
        }

        if (Array.isArray(updates.tags)) {
            updates.tags = Utils.normalizeTags(updates.tags);
        }
        const merged = {
            ...this.students[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        const newScore = this.calculatePerformanceScore(merged.gpa, merged.attendance, merged.assignmentScore);
        const prevHistory = Array.isArray(merged.performanceHistory) ? merged.performanceHistory.slice() : [];
        const lastScore = prevHistory.length ? prevHistory[prevHistory.length - 1] : null;
        if (lastScore === null || Math.abs(newScore - lastScore) > 0.001) {
            prevHistory.push(newScore);
            merged.performanceHistory = prevHistory.slice(-5);
        } else {
            merged.performanceHistory = prevHistory.slice(-5);
        }
        this.students[index] = merged;

        this.saveToStorage();
        return this.students[index];
    }

    /**
     * Save snapshot for Undo (before destructive action).
     * Enables "Undo" toast after delete or clear all - one-level restore from localStorage.
     */
    saveUndoBackup(action, deletedId) {
        try {
            localStorage.setItem(this.undoKey, JSON.stringify({
                students: Utils.deepClone(this.students),
                nextId: this.nextId,
                action: action,
                deletedId: deletedId || null,
                savedAt: new Date().toISOString()
            }));
        } catch (e) {
            console.warn('Could not save undo backup', e);
        }
    }

    /**
     * Restore from Undo backup (returns true if restored)
     */
    restoreUndoBackup() {
        try {
            const raw = localStorage.getItem(this.undoKey);
            if (!raw) return false;
            const backup = JSON.parse(raw);
            if (!backup.students || !Array.isArray(backup.students)) return false;
            this.students = backup.students;
            this.nextId = backup.nextId != null ? backup.nextId : this._getNextAvailableId();
            this.saveToStorage();
            localStorage.removeItem(this.undoKey);
            return true;
        } catch (e) {
            console.warn('Could not restore undo backup', e);
            return false;
        }
    }

    /**
     * Check if an Undo is available
     */
    hasUndoBackup() {
        return !!localStorage.getItem(this.undoKey);
    }

    /**
     * Delete student (saves backup for Undo)
     */
    deleteStudent(id) {
        const index = this.students.findIndex(s => s.id === id);
        if (index === -1) throw new Error('Student not found');

        this.saveUndoBackup('delete', id);
        this.students.splice(index, 1);
        this.saveToStorage();
        return true;
    }

    /**
     * Search students
     */
    searchStudents(searchTerm) {
        return Utils.searchArray(this.students, searchTerm, [
            'id', 'firstName', 'lastName', 'email'
        ]);
    }

    /**
     * Filter students
     */
    filterStudents(filters) {
        return Utils.filterArray(this.students, filters);
    }

    /**
     * Sort students
     */
    sortStudents(sortBy = 'name-asc') {
        let sorted = [...this.students];

        switch (sortBy) {
            case 'name-asc':
                sorted = Utils.sortArray(sorted, 'firstName', 'asc');
                break;
            case 'name-desc':
                sorted = Utils.sortArray(sorted, 'firstName', 'desc');
                break;
            case 'date-new':
                sorted = Utils.sortArray(sorted, 'enrollmentDate', 'desc');
                break;
            case 'date-old':
                sorted = Utils.sortArray(sorted, 'enrollmentDate', 'asc');
                break;
        }

        return sorted;
    }

    /**
     * Get total number of students
     */
    getTotalStudents() {
        return this.students.length;
    }

    /**
     * Check if email exists (optionally exclude a student ID for edit mode)
     */
    emailExists(email, excludeId) {
        return this.students.some(s => {
            if (excludeId && s.id === excludeId) return false;
            return s.email && s.email.toLowerCase() === String(email).toLowerCase();
        });
    }

    /**
     * Check for potential duplicate by first name, last name, and DOB
     */
    duplicateByNameAndDob(firstName, lastName, dob, excludeId) {
        const f = (String(firstName || '').trim()).toLowerCase();
        const l = (String(lastName || '').trim()).toLowerCase();
        const d = String(dob || '').trim();
        if (!f || !l || !d) return false;
        return this.students.some(s => {
            if (excludeId && s.id === excludeId) return false;
            return s.firstName && s.lastName && s.dob &&
                s.firstName.toLowerCase() === f &&
                s.lastName.toLowerCase() === l &&
                String(s.dob).trim() === d;
        });
    }

    /**
     * Validate student data
     */
    validateStudent(data) {
        if (!data.firstName || !data.firstName.trim()) return false;
        if (!data.lastName || !data.lastName.trim()) return false;
        if (!Utils.isValidEmail(data.email)) return false;
        if (!Utils.isValidDOB(data.dob)) return false;
        if (!data.gender) return false;
        if (!Utils.isValidPhone(data.phone)) return false;
        if (!data.department) return false;
        if (!data.year) return false;
        if (!Utils.isValidGPA(data.gpa)) return false;
        if (!Utils.isValidAttendance(data.attendance)) return false;
        if (!Utils.isValidAssignmentScore(data.assignmentScore !== undefined && data.assignmentScore !== null && data.assignmentScore !== '' ? data.assignmentScore : NaN)) return false;
        if (!data.address || !data.address.trim()) return false;
        if (!data.city || !data.city.trim()) return false;
        if (!data.state || !data.state.trim()) return false;
        if (!data.zipcode || !data.zipcode.trim()) return false;
        if (!data.country || !data.country.trim()) return false;
        return true;
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const stats = Utils.calculateStats(this.students);
        return {
            totalStudents: stats.total,
            activeStudents: stats.active,
            departmentCount: stats.departments,
            avgAttendance: stats.avgAttendance,
            departmentDistribution: Utils.getDepartmentDistribution(this.students),
            yearDistribution: Utils.getYearDistribution(this.students),
            genderDistribution: Utils.getGenderDistribution(this.students),
            gpaDistribution: Utils.getGPADistribution(this.students),
            attendanceDistribution: Utils.getAttendanceDistribution(this.students),
            registrationTrend: Utils.getRegistrationTrend(this.students)
        };
    }

    /**
     * Export to JSON
     */
    exportToJSON() {
        return {
            exportDate: new Date().toISOString(),
            totalRecords: this.students.length,
            students: this.students
        };
    }

    /**
     * Import from JSON (preserves unique IDs by setting nextId from max existing)
     */
    importFromJSON(data) {
        try {
            if (!Array.isArray(data.students)) {
                throw new Error('Invalid data format');
            }

            this.students = data.students;
            this._migratePerformanceHistory();
            this.nextId = this._getNextAvailableId();
            this.saveToStorage();
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    /**
     * Get next available numeric ID from existing students (e.g. STU-2025-003 -> 4)
     */
    _getNextAvailableId() {
        if (this.students.length === 0) return 1;
        let max = 0;
        this.students.forEach(s => {
            if (s.id && typeof s.id === 'string') {
                const parts = s.id.split('-');
                const num = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(num) && num > max) max = num;
            }
        });
        return max + 1;
    }

    /**
     * Clear all data (saves backup for Undo)
     */
    clearAllData() {
        this.saveUndoBackup('clear', null);
        this.students = [];
        this.nextId = 1;
        this.saveToStorage();
    }

    /**
     * Get settings
     */
    getSettings() {
        const settings = localStorage.getItem(this.settingsKey);
        return settings ? JSON.parse(settings) : {
            darkMode: false,
            autoSaveInterval: 10000
        };
    }

    /**
     * Save settings
     */
    saveSettings(settings) {
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    }

    /**
     * Update last modified timestamp
     */
    updateLastModified() {
        const settings = this.getSettings();
        settings.lastModified = new Date().toISOString();
        this.saveSettings(settings);
    }

    /**
     * Get last modified date
     */
    getLastModified() {
        const settings = this.getSettings();
        if (!settings.lastModified) return 'Never';
        return Utils.formatDate(settings.lastModified);
    }
}

// Create global instance
const model = new StudentModel();
