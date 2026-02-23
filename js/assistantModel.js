/**
 * SMART ADMIN ASSISTANT - MODEL LAYER
 * Data analysis, query interpretation, and rule-based response generation.
 * Uses existing Student Model only — no external APIs or backend.
 * MVC Pattern: Model (Assistant)
 */

class AssistantModel {
    constructor() {
        this.storageKey = 'assistant_chat_history';
        /** At-risk: attendance < 70% OR GPA < 2.5 */
        this.riskAttendanceThreshold = 70;
        this.riskGPAThreshold = 2.5;
    }

    /**
     * Get current student data from main model (read-only)
     */
    getStudents() {
        if (typeof model === 'undefined') return [];
        return model.getAllStudents();
    }

    /**
     * Get statistics from main model
     */
    getStats() {
        if (typeof model === 'undefined') return null;
        return model.getStatistics();
    }

    /**
     * Get students at risk (low attendance or low GPA)
     */
    getAtRiskStudents() {
        const students = this.getStudents();
        return students.filter(s => {
            const att = parseInt(s.attendance, 10);
            const gpa = parseFloat(s.gpa);
            return (!isNaN(att) && att < this.riskAttendanceThreshold) ||
                   (!isNaN(gpa) && gpa < this.riskGPAThreshold);
        });
    }

    /**
     * Get students by department name (case-insensitive partial match)
     */
    getStudentsByDepartment(deptName) {
        const students = this.getStudents();
        const term = (deptName || '').trim().toLowerCase();
        if (!term) return students;
        return students.filter(s =>
            (s.department || '').toLowerCase().includes(term)
        );
    }

    /**
     * Get student(s) with highest GPA (may be multiple ties)
     */
    getHighestGPAStudents() {
        const students = this.getStudents();
        if (students.length === 0) return [];
        const maxGpa = Math.max(...students.map(s => parseFloat(s.gpa) || 0));
        return students.filter(s => parseFloat(s.gpa) === maxGpa);
    }

    /**
     * Get students with attendance below given percentage (default 70)
     */
    getLowAttendanceStudents(threshold) {
        const t = threshold != null ? parseInt(threshold, 10) : 70;
        const students = this.getStudents();
        return students.filter(s => {
            const att = parseInt(s.attendance, 10);
            return !isNaN(att) && att < t;
        });
    }

    /**
     * Get placement-ready students (tag "Placement Ready" or high performers: GPA >= 3.5, attendance >= 85)
     */
    getPlacementReadyStudents() {
        const students = this.getStudents();
        const placementTag = 'Placement Ready';
        return students.filter(s => {
            const hasTag = Array.isArray(s.tags) && s.tags.some(t =>
                String(t).toLowerCase() === placementTag.toLowerCase()
            );
            const gpa = parseFloat(s.gpa) || 0;
            const att = parseInt(s.attendance, 10) || 0;
            const highPerformer = gpa >= 3.5 && att >= 85;
            return hasTag || highPerformer;
        });
    }

    /**
     * Find student by first name (case-insensitive, partial match)
     */
    findStudentByName(firstName) {
        const term = (firstName || '').trim().toLowerCase();
        if (!term) return null;
        const students = this.getStudents();
        return students.find(s =>
            (s.firstName || '').toLowerCase().includes(term) ||
            (s.lastName || '').toLowerCase().includes(term)
        ) || null;
    }

    /**
     * Get performance trend summary for a student (last 3 performanceHistory values)
     */
    getStudentTrendSummary(student) {
        if (!student || typeof model === 'undefined') return null;
        const history = model._ensurePerformanceHistory
            ? model._ensurePerformanceHistory(student)
            : (student.performanceHistory || []).slice(-3);
        const trend = model.getPerformanceTrend
            ? model.getPerformanceTrend(history)
            : this._localTrend(history);
        const name = (student.firstName + ' ' + student.lastName).trim();
        if (trend === 'up') {
            return name + ' is improving. Performance has gone up over recent updates.';
        }
        if (trend === 'down') {
            return name + ' shows a declining trend in the last few records. Consider reaching out.';
        }
        return name + ' has been stable recently with no significant change in performance.';
    }

    _localTrend(history) {
        const arr = Array.isArray(history) ? history.slice(-3) : [];
        if (arr.length < 2) return 'stable';
        const diff = arr[arr.length - 1] - arr[0];
        if (diff > 0.05) return 'up';
        if (diff < -0.05) return 'down';
        return 'stable';
    }

    /**
     * Department comparison: count per department and optional comparison message
     */
    getDepartmentComparison() {
        const stats = this.getStats();
        if (!stats || !stats.departmentDistribution || stats.departmentDistribution.length === 0) {
            return { summary: 'No department data available.', distribution: [] };
        }
        const dist = stats.departmentDistribution;
        const total = dist.reduce((s, d) => s + d.count, 0);
        const top = dist.slice().sort((a, b) => b.count - a.count)[0];
        const summary = `There are ${dist.length} department(s) with ${total} total students. ` +
            (top ? `${top.name} has the most students (${top.count}).` : '');
        return { summary, distribution: dist };
    }

    /**
     * Overall performance summary (for /summary or "overall performance summary")
     */
    getOverallPerformanceSummary() {
        const students = this.getStudents();
        const stats = this.getStats();
        if (!stats || students.length === 0) {
            return 'There are no students in the system yet. Add students to see analytics.';
        }
        const atRisk = this.getAtRiskStudents().length;
        const placementReady = this.getPlacementReadyStudents().length;
        let msg = `You have **${stats.totalStudents}** students across **${stats.departmentCount}** departments. ` +
            `Average attendance is **${stats.avgAttendance}%**. `;
        if (atRisk > 0) {
            msg += `${atRisk} student(s) are currently at risk (low GPA or attendance). `;
        }
        if (placementReady > 0) {
            msg += `${placementReady} are placement-ready or high performers.`;
        } else {
            msg += 'Consider tagging placement-ready students for tracking.';
        }
        return msg;
    }

    /**
     * Auto alert suggestion: if high-risk students exist, return a suggestion message
     */
    getAutoAlertSuggestion() {
        const atRisk = this.getAtRiskStudents();
        if (atRisk.length === 0) return null;
        const n = atRisk.length;
        return `There ${n === 1 ? 'is' : 'are'} **${n}** student${n === 1 ? '' : 's'} needing mentor attention. Ask me "Who is at risk?" or use **/risk** to see them.`;
    }

    /**
     * Interpret user message: detect intent and extract parameters (rule-based keywords)
     * Returns { intent, params, rawQuery }
     */
    interpretQuery(rawQuery) {
        const q = (rawQuery || '').trim();
        const lower = q.toLowerCase();

        // Quick commands
        if (lower === '/summary') {
            return { intent: 'summary', params: {}, rawQuery: q };
        }
        if (lower === '/risk') {
            return { intent: 'at_risk', params: {}, rawQuery: q };
        }
        if (lower === '/top') {
            return { intent: 'highest_gpa', params: {}, rawQuery: q };
        }
        if (lower === '/alerts') {
            return { intent: 'alerts', params: {}, rawQuery: q };
        }

        // Natural language patterns
        if (/\bhow many\b.*\b(at )?risk\b|\bat risk\b|\bstudents at risk\b|\brisk count\b/i.test(lower)) {
            return { intent: 'at_risk', params: {}, rawQuery: q };
        }
        if (/\bshow\b.*\bengineering\b|\bengineering\s+students\b|\b(computer\s+science|business|arts|science)\s+students\b/i.test(lower)) {
            const dept = this._extractDepartment(lower);
            return { intent: 'department', params: { department: dept }, rawQuery: q };
        }
        if (/\bwho\s+has\s+(the\s+)?highest\s+gpa\b|\bhighest\s+gpa\b|\btop\s+gpa\b|\bbest\s+gpa\b/i.test(lower)) {
            return { intent: 'highest_gpa', params: {}, rawQuery: q };
        }
        if (/\battendance\s+below\s+(\d+)\s*%?|\bbelow\s+(\d+)\s*%\s*attendance\b|\blow\s+attendance\b/i.test(lower)) {
            const match = lower.match(/(\d+)\s*%?/);
            const threshold = match ? parseInt(match[1], 10) : 70;
            return { intent: 'low_attendance', params: { threshold }, rawQuery: q };
        }
        if (/\boverall\s+performance\s+summary\b|\bperformance\s+summary\b|\bsummary\b/i.test(lower) && !lower.startsWith('/')) {
            return { intent: 'summary', params: {}, rawQuery: q };
        }
        if (/\bplacement\s+ready\b|\bplacement\s+students\b/i.test(lower)) {
            return { intent: 'placement_ready', params: {}, rawQuery: q };
        }
        if (/\bis\s+(\w+)\s+improving\b|\b(\w+)\s+improvement\b|\bhow\s+is\s+(\w+)\s+doing\b/i.test(lower)) {
            const nameMatch = lower.match(/\b(is\s+)?(\w+)\s+improving\b|\b(\w+)\s+improvement\b|\bhow\s+is\s+(\w+)\s+doing\b/);
            const name = (nameMatch && (nameMatch[2] || nameMatch[3] || nameMatch[4])) || '';
            return { intent: 'student_trend', params: { firstName: name }, rawQuery: q };
        }
        if (/\bdepartment\s+comparison\b|\bcompare\s+departments\b|\bwhich\s+department\s+has\s+most\b/i.test(lower)) {
            return { intent: 'department_comparison', params: {}, rawQuery: q };
        }
        if (/\balerts?\b|\battention\b|\bneed\s+mentor\b/i.test(lower)) {
            return { intent: 'alerts', params: {}, rawQuery: q };
        }

        return { intent: 'unknown', params: {}, rawQuery: q };
    }

    _extractDepartment(lower) {
        const map = {
            'engineering': 'Engineering',
            'computer science': 'Computer Science',
            'cs': 'Computer Science',
            'business': 'Business',
            'arts': 'Arts',
            'science': 'Science'
        };
        for (const [key, value] of Object.entries(map)) {
            if (lower.includes(key)) return value;
        }
        return 'Engineering'; // default for "show engineering students"
    }

    /**
     * Generate response and optional dashboard action from interpreted intent
     * Returns { text, action?: { type, payload } }
     */
    getResponse(interpreted) {
        const { intent, params } = interpreted;

        switch (intent) {
            case 'summary': {
                const text = this.getOverallPerformanceSummary();
                return { text };
            }
            case 'at_risk': {
                const list = this.getAtRiskStudents();
                if (list.length === 0) {
                    return { text: 'No students are currently at risk. Great job!' };
                }
                const names = list.slice(0, 10).map(s => `${s.firstName} ${s.lastName} (${s.id})`);
                const more = list.length > 10 ? ` ... and ${list.length - 10} more.` : '';
                const text = `**${list.length}** student(s) are at risk (attendance < 70% or GPA < 2.5):\n\n` +
                    names.join('\n') + more + '\n\nI can apply the "Needs Attention" filter on the Students page if you’d like.';
                return {
                    text,
                    action: { type: 'filter_at_risk', payload: {} }
                };
            }
            case 'department': {
                const dept = params.department || 'Engineering';
                const list = this.getStudentsByDepartment(dept);
                if (list.length === 0) {
                    return { text: `No students found in **${dept}**.` };
                }
                const text = `Found **${list.length}** student(s) in **${dept}**:\n\n` +
                    list.slice(0, 8).map(s => `${s.firstName} ${s.lastName} (${s.id})`).join('\n') +
                    (list.length > 8 ? `\n... and ${list.length - 8} more.` : '') +
                    '\n\nI can show them on the Students page.';
                return {
                    text,
                    action: { type: 'filter_department', payload: { department: dept } }
                };
            }
            case 'highest_gpa': {
                const list = this.getHighestGPAStudents();
                if (list.length === 0) {
                    return { text: 'No student data available.' };
                }
                const gpa = list[0].gpa;
                const names = list.map(s => `${s.firstName} ${s.lastName} (${s.id})`);
                const text = `Highest GPA is **${gpa}** — ${names.join(', ')}.`;
                return { text };
            }
            case 'low_attendance': {
                const threshold = params.threshold != null ? params.threshold : 70;
                const list = this.getLowAttendanceStudents(threshold);
                if (list.length === 0) {
                    return { text: `No students have attendance below ${threshold}%.` };
                }
                const text = `**${list.length}** student(s) have attendance below **${threshold}%**:\n\n` +
                    list.slice(0, 8).map(s => `${s.firstName} ${s.lastName} — ${s.attendance}%`).join('\n') +
                    (list.length > 8 ? `\n... and ${list.length - 8} more.` : '');
                return { text };
            }
            case 'placement_ready': {
                const list = this.getPlacementReadyStudents();
                if (list.length === 0) {
                    return { text: 'No placement-ready students found. Tag students as "Placement Ready" or look for GPA ≥ 3.5 and attendance ≥ 85%.' };
                }
                const text = `**${list.length}** placement-ready student(s):\n\n` +
                    list.slice(0, 8).map(s => `${s.firstName} ${s.lastName} (${s.id})`).join('\n') +
                    (list.length > 8 ? `\n... and ${list.length - 8} more.` : '');
                return {
                    text,
                    action: { type: 'filter_tag', payload: { tag: 'Placement Ready' } }
                };
            }
            case 'student_trend': {
                const firstName = (params.firstName || '').trim();
                if (!firstName) {
                    return { text: 'Please mention a student\'s first name, e.g. "Is Rahul improving?"' };
                }
                const student = this.findStudentByName(firstName);
                if (!student) {
                    return { text: `I couldn't find a student named "${firstName}". Try another name.` };
                }
                const text = this.getStudentTrendSummary(student);
                return { text };
            }
            case 'department_comparison': {
                const { summary, distribution } = this.getDepartmentComparison();
                const lines = distribution.length
                    ? '\n\n' + distribution.map(d => `• ${d.name}: ${d.count}`).join('\n')
                    : '';
                return { text: summary + lines };
            }
            case 'alerts': {
                const suggestion = this.getAutoAlertSuggestion();
                if (suggestion) return { text: suggestion };
                return { text: 'No urgent alerts. All students are within safe thresholds.' };
            }
            default:
                return {
                    text: 'I can help with:\n\n• **At risk** — "How many students are at risk?" or /risk\n' +
                        '• **Department** — "Show Engineering students"\n' +
                        '• **Top performer** — "Who has highest GPA?" or /top\n' +
                        '• **Attendance** — "Students with attendance below 70%"\n' +
                        '• **Summary** — "Overall performance summary" or /summary\n' +
                        '• **Placement** — "Show placement ready students"\n' +
                        '• **Trend** — "Is Rahul improving?"\n' +
                        '• **Departments** — "Department comparison"\n' +
                        '• **Alerts** — /alerts'
                };
        }
    }

    /**
     * Load chat history from LocalStorage
     */
    loadHistory() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Save chat history to LocalStorage
     */
    saveHistory(messages) {
        try {
            const toSave = Array.isArray(messages) ? messages.slice(-100) : [];
            localStorage.setItem(this.storageKey, JSON.stringify(toSave));
        } catch (e) {
            console.warn('Assistant: could not save chat history', e);
        }
    }
}

// Global instance (depends on model being loaded first)
const assistantModel = new AssistantModel();
