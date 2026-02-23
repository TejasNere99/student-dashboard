/**
 * SMART ADMIN ASSISTANT - VIEW LAYER
 * Chat UI rendering, message display, typing animation.
 * MVC Pattern: View (Assistant)
 */

class AssistantView {
    constructor() {
        this.fab = null;
        this.panel = null;
        this.messagesContainer = null;
        this.inputEl = null;
        this.sendBtn = null;
        this.closeBtn = null;
        this.typingIndicator = null;
        this.isOpen = false;
        this.typingTimeout = null;
    }

    /**
     * Initialize DOM references (call after HTML is present)
     */
    init() {
        this.fab = document.getElementById('assistantFab');
        this.panel = document.getElementById('assistantPanel');
        this.messagesContainer = document.getElementById('assistantMessages');
        this.inputEl = document.getElementById('assistantInput');
        this.sendBtn = document.getElementById('assistantSendBtn');
        this.closeBtn = document.getElementById('assistantCloseBtn');
        this.typingIndicator = document.getElementById('assistantTyping');
    }

    /**
     * Render the floating action button (if not already in DOM)
     */
    renderFab() {
        if (document.getElementById('assistantFab')) return;
        const fab = document.createElement('button');
        fab.id = 'assistantFab';
        fab.className = 'assistant-fab';
        fab.setAttribute('aria-label', 'Open Smart Admin Assistant');
        fab.innerHTML = '<span class="assistant-fab-icon">◆</span>';
        document.body.appendChild(fab);
        this.fab = fab;
    }

    /**
     * Toggle chat panel open/close
     */
    togglePanel() {
        this.isOpen = !this.isOpen;
        if (this.panel) {
            this.panel.classList.toggle('assistant-panel-open', this.isOpen);
            if (this.isOpen) {
                this.inputEl && this.inputEl.focus();
                this.scrollToBottom();
            }
        }
        if (this.fab) {
            this.fab.classList.toggle('assistant-fab-open', this.isOpen);
        }
    }

    openPanel() {
        if (!this.isOpen) this.togglePanel();
    }

    closePanel() {
        if (this.isOpen) this.togglePanel();
    }

    /**
     * Render a single message bubble (user or assistant)
     * content: string (may contain **bold** markdown-like)
     */
    renderMessage(role, content) {
        if (!this.messagesContainer) return;
        const div = document.createElement('div');
        div.className = 'assistant-msg assistant-msg-' + role;
        const text = this._formatMessageContent(content);
        const bubble = document.createElement('div');
        bubble.className = 'assistant-msg-bubble';
        bubble.innerHTML = text;
        div.appendChild(bubble);
        this.messagesContainer.appendChild(div);
        this.scrollToBottom();
    }

    /**
     * Simple **bold** to <strong> for message content; escape HTML otherwise
     */
    _formatMessageContent(text) {
        if (!text || typeof text !== 'string') return '';
        const escaped = Utils.escapeHtml(text);
        return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    }

    /**
     * Show typing indicator (animated dots)
     */
    showTyping() {
        if (!this.typingIndicator) return;
        this.typingIndicator.classList.add('assistant-typing-visible');
        this.scrollToBottom();
    }

    hideTyping() {
        if (!this.typingIndicator) return;
        this.typingIndicator.classList.remove('assistant-typing-visible');
        this.scrollToBottom();
    }

    /**
     * Simulate typing delay then show response (for premium feel)
     */
    showResponseWithTypingDelay(responseText, delayMs, callback) {
        const delay = typeof delayMs === 'number' && delayMs >= 0 ? delayMs : 400;
        this.showTyping();
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.typingTimeout = null;
            this.hideTyping();
            this.renderMessage('assistant', responseText);
            if (typeof callback === 'function') callback();
        }, delay);
    }

    /**
     * Scroll messages area to bottom
     */
    scrollToBottom() {
        if (!this.messagesContainer) return;
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    /**
     * Get current input value and optionally clear
     */
    getInput(clearAfter) {
        if (!this.inputEl) return '';
        const v = (this.inputEl.value || '').trim();
        if (clearAfter) this.inputEl.value = '';
        return v;
    }

    /**
     * Load and render chat history from model
     */
    loadAndRenderHistory(messages) {
        if (!this.messagesContainer || !Array.isArray(messages)) return;
        this.messagesContainer.innerHTML = '';
        messages.forEach(m => {
            if (m.role && m.content) this.renderMessage(m.role, m.content);
        });
        this.scrollToBottom();
    }

    /**
     * Render welcome message if no history
     */
    ensureWelcomeMessage() {
        if (!this.messagesContainer || this.messagesContainer.querySelector('.assistant-msg')) return;
        const suggestion = assistantModel && assistantModel.getAutoAlertSuggestion();
        const welcome = 'Hi! I\'m your Smart Admin Assistant. Ask me about at-risk students, departments, GPA, attendance, or type **/summary** for a quick overview.' +
            (suggestion ? '\n\n' + suggestion : '');
        this.renderMessage('assistant', welcome);
    }
}

// Global instance
const assistantView = new AssistantView();
