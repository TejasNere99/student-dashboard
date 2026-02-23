/**
 * SMART ADMIN ASSISTANT - CONTROLLER LAYER
 * Event handling, message parsing, communication between Assistant Model and View.
 * Triggers dashboard actions (filters, page change) via main controller.
 * MVC Pattern: Controller (Assistant)
 */

class AssistantController {
    constructor() {
        this.init();
    }

    init() {
        // View DOM is in HTML; init refs after DOM ready
        assistantView.init();
        this.setupEventListeners();
        this.loadHistory();
        assistantView.ensureWelcomeMessage();
    }

    setupEventListeners() {
        // FAB click
        if (assistantView.fab) {
            assistantView.fab.addEventListener('click', () => this.handleFabClick());
        }
        // Close panel
        if (assistantView.closeBtn) {
            assistantView.closeBtn.addEventListener('click', () => assistantView.closePanel());
        }
        // Send: button and Enter key
        if (assistantView.sendBtn) {
            assistantView.sendBtn.addEventListener('click', () => this.handleSend());
        }
        if (assistantView.inputEl) {
            assistantView.inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSend();
                }
            });
        }
    }

    handleFabClick() {
        assistantView.togglePanel();
    }

    /**
     * Send user message, get response from model, render, optionally apply dashboard action
     */
    handleSend() {
        const raw = assistantView.getInput(true);
        if (!raw) return;

        // Add user message
        assistantView.renderMessage('user', raw);
        this.appendToHistory('user', raw);

        // Interpret and get response (slight delay for typing effect)
        const interpreted = assistantModel.interpretQuery(raw);
        const result = assistantModel.getResponse(interpreted);

        assistantView.showResponseWithTypingDelay(result.text, 500, () => {
            this.appendToHistory('assistant', result.text);
            assistantModel.saveHistory(this.getHistory());

            // Apply dashboard action if present
            if (result.action) {
                this.applyDashboardAction(result.action);
            }
        });
    }

    /**
     * Apply action from assistant (filter students, switch page)
     */
    applyDashboardAction(action) {
        if (!action || !window.controller) return;
        const main = window.controller;
        const v = window.view;

        switch (action.type) {
            case 'filter_department':
                if (v.departmentFilter && action.payload.department) {
                    v.departmentFilter.value = action.payload.department;
                    if (v.globalSearch) v.globalSearch.value = '';
                    if (v.searchInput) v.searchInput.value = '';
                    main.handlePageChange('students');
                    main.updateStudentsTable();
                }
                break;
            case 'filter_at_risk':
                if (v.tagFilter) {
                    v.tagFilter.value = 'Needs Attention';
                    if (v.departmentFilter) v.departmentFilter.value = '';
                    if (v.searchInput) v.searchInput.value = '';
                    if (v.globalSearch) v.globalSearch.value = '';
                    main.handlePageChange('students');
                    main.updateStudentsTable();
                }
                break;
            case 'filter_tag':
                if (v.tagFilter && action.payload.tag) {
                    v.tagFilter.value = action.payload.tag;
                    if (v.departmentFilter) v.departmentFilter.value = '';
                    main.handlePageChange('students');
                    main.updateStudentsTable();
                }
                break;
            default:
                break;
        }
    }

    loadHistory() {
        const messages = assistantModel.loadHistory();
        assistantView.loadAndRenderHistory(messages);
    }

    getHistory() {
        const list = [];
        if (!assistantView.messagesContainer) return list;
        assistantView.messagesContainer.querySelectorAll('.assistant-msg').forEach(el => {
            const role = el.classList.contains('assistant-msg-user') ? 'user' : 'assistant';
            const content = (el.querySelector('.assistant-msg-bubble') || {}).innerHTML || '';
            const text = content.replace(/<br>/g, '\n').replace(/<strong>|<\/strong>/g, '**').replace(/<[^>]+>/g, '');
            list.push({ role, content: text });
        });
        return list;
    }

    appendToHistory(role, content) {
        const messages = this.getHistory();
        messages.push({ role, content });
        assistantModel.saveHistory(messages);
    }
}

// Initialize when DOM is ready (after main controller, so view/controller exist)
document.addEventListener('DOMContentLoaded', () => {
    if (typeof assistantModel !== 'undefined' && typeof assistantView !== 'undefined') {
        window.assistantController = new AssistantController();
    }
});
