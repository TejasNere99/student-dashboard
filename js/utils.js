/**
 * UTILITY FUNCTIONS
 * Helper functions for validation, formatting, and common operations
 */

/** Predefined tags for students (single source of truth) */
const PREDEFINED_TAGS = [
    'Scholarship Candidate',
    'Sports Captain',
    'Placement Ready',
    'Needs Attention',
    "Dean's List",
    'Research Assistant',
    'Club Leader',
    'Mentorship Program'
];

const Utils = {
    /**
     * Get predefined tag list (read-only)
     */
    getPredefinedTags() {
        return PREDEFINED_TAGS.slice();
    },

    /**
     * Normalize tag to canonical form from predefined list (case-insensitive match)
     */
    normalizeTag(tag) {
        if (tag == null || String(tag).trim() === '') return '';
        const t = String(tag).trim();
        const found = PREDEFINED_TAGS.find(p => p.toLowerCase() === t.toLowerCase());
        return found || t;
    },

    /**
     * Normalize array of tags to canonical predefined values
     */
    normalizeTags(tags) {
        if (!Array.isArray(tags)) return [];
        return tags
            .map(t => Utils.normalizeTag(t))
            .filter(Boolean)
            .filter((t, i, arr) => arr.indexOf(t) === i);
    },

    /**
     * Escape HTML for safe display
     */
    escapeHtml(str) {
        if (str == null) return '';
        const s = String(str);
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Validate phone number
     */
    isValidPhone(phone) {
        const regex = /^[\d\s\-\+\(\)]{10,}$/;
        return regex.test(phone.replace(/\s/g, ''));
    },

    /**
     * Validate GPA (0-4.0)
     */
    isValidGPA(gpa) {
        const num = parseFloat(gpa);
        return !isNaN(num) && num >= 0 && num <= 4.0;
    },

    /**
     * Validate attendance (0-100)
     */
    isValidAttendance(attendance) {
        const num = parseInt(attendance);
        return !isNaN(num) && num >= 0 && num <= 100;
    },

    /**
     * Validate assignment score (0-100) for performance trend
     */
    isValidAssignmentScore(score) {
        const num = parseFloat(score);
        return !isNaN(num) && num >= 0 && num <= 100;
    },

    /**
     * Validate date of birth (must be at least 16 years old)
     */
    isValidDOB(dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age >= 16 && age <= 100;
    },

    /**
     * Format date to readable format
     */
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    },

    /**
     * Format date to ISO format (YYYY-MM-DD)
     */
    formatDateISO(date) {
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return d.getFullYear() + '-' + month + '-' + day;
    },

    /**
     * Generate Student ID
     */
    generateStudentID(index) {
        const year = new Date().getFullYear();
        const number = String(index).padStart(3, '0');
        return `STU-${year}-${number}`;
    },

    /**
     * Get initials from name
     */
    getInitials(firstName, lastName) {
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    },

    /**
     * Calculate age from date of birth
     */
    calculateAge(dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    },

    /**
     * Convert image file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Download JSON file
     */
    downloadJSON(data, filename) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Read JSON file
     */
    readJSONFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    resolve(json);
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Sort array of objects
     */
    sortArray(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return order === 'asc' ? 1 : -1;
            if (bVal == null) return order === 'asc' ? -1 : 1;
            if (typeof aVal === 'string') {
                return order === 'asc'
                    ? String(aVal).localeCompare(String(bVal))
                    : String(bVal).localeCompare(String(aVal));
            }
            return order === 'asc' ? aVal - bVal : bVal - aVal;
        });
    },

    /**
     * Sort a list of students by given criteria (for filtered lists)
     */
    sortStudentsList(students, sortBy) {
        const list = [...students];
        switch (sortBy) {
            case 'name-asc':
                return list.sort((a, b) => (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName));
            case 'name-desc':
                return list.sort((a, b) => (b.firstName + ' ' + b.lastName).localeCompare(a.firstName + ' ' + a.lastName));
            case 'date-new':
                return this.sortArray(list, 'enrollmentDate', 'desc');
            case 'date-old':
                return this.sortArray(list, 'enrollmentDate', 'asc');
            default:
                return this.sortArray(list, 'firstName', 'asc');
        }
    },

    /**
     * Filter array by multiple conditions (supports special 'tag' for student tags array)
     */
    filterArray(array, conditions) {
        return array.filter(item => {
            return Object.keys(conditions).every(key => {
                if (!conditions[key]) return true;
                if (key === 'tag') {
                    const tags = item.tags;
                    const filterTag = String(conditions[key] || '').trim().toLowerCase();
                    if (!filterTag) return true;
                    return Array.isArray(tags) && tags.some(t => String(t).toLowerCase() === filterTag);
                }
                return item[key] === conditions[key];
            });
        });
    },

    /**
     * Search in array
     */
    searchArray(array, searchTerm, fields) {
        const term = searchTerm.toLowerCase();
        return array.filter(item => {
            return fields.some(field => {
                const value = item[field];
                return value && value.toString().toLowerCase().includes(term);
            });
        });
    },

    /**
     * Get chart colors
     */
    getChartColors() {
        return [
            '#667eea',
            '#764ba2',
            '#f093fb',
            '#f5576c',
            '#4facfe',
            '#00f2fe',
            '#43e97b',
            '#38f9d7'
        ];
    },

    /**
     * Calculate statistics
     */
    calculateStats(students) {
        const stats = {
            total: students.length,
            active: students.filter(s => s.status === 'Active').length,
            departments: [...new Set(students.map(s => s.department))].length,
            avgAttendance: students.length > 0 
                ? Math.round(students.reduce((sum, s) => sum + parseInt(s.attendance), 0) / students.length)
                : 0
        };
        return stats;
    },

    /**
     * Get department distribution
     */
    getDepartmentDistribution(students) {
        const depts = {};
        students.forEach(s => {
            depts[s.department] = (depts[s.department] || 0) + 1;
        });
        return Object.entries(depts).map(([name, count]) => ({ name, count }));
    },

    /**
     * Get year distribution
     */
    getYearDistribution(students) {
        const years = {};
        students.forEach(s => {
            years[s.year] = (years[s.year] || 0) + 1;
        });
        return Object.entries(years).map(([name, count]) => ({ name, count }));
    },

    /**
     * Get gender distribution
     */
    getGenderDistribution(students) {
        const genders = {};
        students.forEach(s => {
            genders[s.gender] = (genders[s.gender] || 0) + 1;
        });
        return Object.entries(genders).map(([name, count]) => ({ name, count }));
    },

    /**
     * Get GPA distribution
     */
    getGPADistribution(students) {
        const ranges = {
            '3.5-4.0': 0,
            '3.0-3.5': 0,
            '2.5-3.0': 0,
            '2.0-2.5': 0
        };
        
        students.forEach(s => {
            const gpa = parseFloat(s.gpa);
            if (gpa >= 3.5) ranges['3.5-4.0']++;
            else if (gpa >= 3.0) ranges['3.0-3.5']++;
            else if (gpa >= 2.5) ranges['2.5-3.0']++;
            else ranges['2.0-2.5']++;
        });
        
        return Object.entries(ranges).map(([name, count]) => ({ name, count }));
    },

    /**
     * Get attendance distribution
     */
    getAttendanceDistribution(students) {
        const ranges = {
            '90-100%': 0,
            '80-90%': 0,
            '70-80%': 0,
            'Below 70%': 0
        };
        
        students.forEach(s => {
            const att = parseInt(s.attendance);
            if (att >= 90) ranges['90-100%']++;
            else if (att >= 80) ranges['80-90%']++;
            else if (att >= 70) ranges['70-80%']++;
            else ranges['Below 70%']++;
        });
        
        return Object.entries(ranges).map(([name, count]) => ({ name, count }));
    },

    /**
     * Get registration trend (last 7 days)
     */
    getRegistrationTrend(students) {
        const trend = {};
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDateISO(date);
            trend[dateStr] = 0;
        }
        
        students.forEach(s => {
            const dateStr = this.formatDateISO(s.enrollmentDate);
            if (trend.hasOwnProperty(dateStr)) {
                trend[dateStr]++;
            }
        });
        
        return Object.entries(trend).map(([date, count]) => ({ 
            date: this.formatDate(date), 
            count 
        }));
    }
};
