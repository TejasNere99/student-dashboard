/**
 * ACTIVITY MODEL (separate from Student Model)
 * Handles admin activity history: store, retrieve, filter, clear.
 * MVC: dedicated model for activity logs only.
 */

const ACTIVITY_STORAGE_KEY = 'admin_activity_history';

const ACTION_TYPES = {
    STUDENT_ADDED: 'student_added',
    STUDENT_EDITED: 'student_edited',
    STUDENT_DELETED: 'student_deleted',
    TAG_ADDED: 'tag_added',
    TAG_REMOVED: 'tag_removed',
    PERFORMANCE_UPDATED: 'performance_updated',
    DATA_IMPORTED: 'data_imported',
    DATA_CLEARED: 'data_cleared'
};

class ActivityModel {
    constructor() {
        this.storageKey = ACTIVITY_STORAGE_KEY;
    }

    /**
     * Generate unique activity ID
     */
    _generateId() {
        return 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
    }

    /**
     * Load activities from LocalStorage (most recent first)
     */
    loadFromStorage() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            const list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Save activities to LocalStorage
     */
    _saveToStorage(activities) {
        localStorage.setItem(this.storageKey, JSON.stringify(activities));
    }

    /**
     * Log a new activity (called by controller after admin actions)
     * @param {string} actionType - one of ACTION_TYPES
     * @param {string} studentName - display name of student (or "—" for system actions)
     * @param {string} description - short description
     */
    log(actionType, studentName, description) {
        const activity = {
            id: this._generateId(),
            actionType: actionType,
            studentName: String(studentName || '—').trim() || '—',
            description: String(description || '').trim(),
            timestamp: new Date().toISOString()
        };
        const list = this.loadFromStorage();
        list.unshift(activity);
        this._saveToStorage(list);
        return activity;
    }

    /**
     * Get all activities (most recent first)
     */
    getAll() {
        return this.loadFromStorage();
    }

    /**
     * Get filtered activities (by action type, date, search term)
     * @param {Object} filters - { actionType: string, dateGroup: string, search: string }
     */
    getFiltered(filters) {
        let list = this.loadFromStorage();
        if (!filters) return list;

        if (filters.actionType) {
            list = list.filter(a => a.actionType === filters.actionType);
        }

        if (filters.dateGroup) {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
            const olderStart = yesterdayStart - 24 * 60 * 60 * 1000;

            list = list.filter(a => {
                const t = new Date(a.timestamp).getTime();
                if (filters.dateGroup === 'today') return t >= todayStart;
                if (filters.dateGroup === 'yesterday') return t >= yesterdayStart && t < todayStart;
                if (filters.dateGroup === 'older') return t < yesterdayStart;
                return true;
            });
        }

        if (filters.search && filters.search.trim()) {
            const term = filters.search.trim().toLowerCase();
            list = list.filter(a =>
                (a.studentName && a.studentName.toLowerCase().includes(term)) ||
                (a.description && a.description.toLowerCase().includes(term))
            );
        }

        return list;
    }

    /**
     * Clear all activity history
     */
    clearAll() {
        this._saveToStorage([]);
    }

    /**
     * Get action type constants (for UI labels and filtering)
     */
    getActionTypes() {
        return { ...ACTION_TYPES };
    }
}

const activityModel = new ActivityModel();
