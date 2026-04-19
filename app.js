// ═══════════════════════════════════════════════════════════
// WealthWise — Chat Application JS
// ═══════════════════════════════════════════════════════════

// Use environment variable if available, otherwise fallback to localhost
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : 'https://rag-backend-q7cc.onrender.com/api';

// ── State ──────────────────────────────────────────────────
let currentThreadId = null;
let threads = [];

// ── DOM ────────────────────────────────────────────────────
const welcomeScreen = document.getElementById('welcomeScreen');
const chatMessages = document.getElementById('chatMessages');
const messagesContainer = document.getElementById('messagesContainer');
const messagesScroll = document.getElementById('messagesScroll');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const newThreadBtn = document.getElementById('newThreadBtn');
const threadList = document.getElementById('threadList');
const statusText = document.getElementById('statusText');
const statusPill = document.getElementById('statusPill');
const threadInfo = document.getElementById('threadInfo');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    checkBackendHealth();
    setupEventListeners();
    loadThreads();
});

// ── Events ─────────────────────────────────────────────────
function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener('input', () => {
        sendBtn.disabled = !messageInput.value.trim();
        autoResize();
    });

    newThreadBtn.addEventListener('click', createNewThread);

    document.querySelectorAll('.prompt-card').forEach(card => {
        card.addEventListener('click', () => {
            messageInput.value = card.dataset.question;
            sendBtn.disabled = false;
            sendMessage();
        });
    });

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

// ── Health Check ───────────────────────────────────────────
async function checkBackendHealth() {
    try {
        const res = await fetch(`${API_BASE_URL}/health`);
        const data = await res.json();
        if (data.status === 'healthy') {
            statusText.textContent = `Connected · ${data.chunks_indexed} chunks`;
            statusPill.className = 'status-pill connected';
        } else {
            statusText.textContent = 'Degraded';
            statusPill.className = 'status-pill error';
        }
    } catch {
        statusText.textContent = 'Disconnected';
        statusPill.className = 'status-pill error';
    }
}

// ── Threads ────────────────────────────────────────────────
function loadThreads() {
    const stored = localStorage.getItem('ww_threads');
    if (stored) {
        threads = JSON.parse(stored);
        renderThreadList();
    }
}

function saveThreads() {
    localStorage.setItem('ww_threads', JSON.stringify(threads));
}

function createNewThread() {
    currentThreadId = null;
    messagesContainer.innerHTML = '';
    chatMessages.style.display = 'none';
    welcomeScreen.style.display = 'flex';
    threadInfo.textContent = '';
    renderThreadList();
    sidebar.classList.remove('open');
}

function switchThread(threadId) {
    currentThreadId = threadId;
    welcomeScreen.style.display = 'none';
    chatMessages.style.display = 'flex';
    messagesContainer.innerHTML = '';

    const thread = threads.find(t => t.id === threadId);
    if (thread) {
        threadInfo.textContent = truncateText(thread.title, 40);
    }
    renderThreadList();
    sidebar.classList.remove('open');
}

function renderThreadList() {
    if (threads.length === 0) {
        threadList.innerHTML = `
            <div class="thread-empty">
                <div class="thread-empty-icon">💬</div>
                <div class="thread-empty-text">No conversations yet.<br>Start a new one!</div>
            </div>`;
        return;
    }

    threadList.innerHTML = threads.map(t => `
        <div class="thread-item ${t.id === currentThreadId ? 'active' : ''}" onclick="switchThread('${t.id}')">
            <div class="thread-item-icon">💬</div>
            <div class="thread-item-body">
                <div class="thread-item-title">${escapeHtml(truncateText(t.title, 32))}</div>
                <div class="thread-item-meta">${formatDate(t.created_at)} · ${t.message_count} msgs</div>
            </div>
        </div>`).join('');
}

// ── Send Message ───────────────────────────────────────────
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    welcomeScreen.style.display = 'none';
    chatMessages.style.display = 'flex';

    addMessage('user', message);

    messageInput.value = '';
    sendBtn.disabled = true;
    messageInput.style.height = 'auto';

    loadingIndicator.style.display = 'block';

    try {
        const res = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, thread_id: currentThreadId }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!currentThreadId && data.thread_id) {
            currentThreadId = data.thread_id;
            threads.unshift({
                id: currentThreadId,
                title: message.substring(0, 60),
                created_at: new Date().toISOString(),
                message_count: 1,
                confidence: data.confidence_score,
            });
            saveThreads();
            renderThreadList();
            threadInfo.textContent = truncateText(message, 40);
        }

        addMessage('assistant', data.response, {
            sourceUrl: data.source_url,
            isRefusal: data.is_refusal,
            confidence: data.confidence_score,
            processingTime: data.processing_time_ms,
        });

        // Update thread
        const thread = threads.find(t => t.id === currentThreadId);
        if (thread) {
            thread.message_count += 2;
            thread.confidence = data.confidence_score;
            saveThreads();
            renderThreadList();
        }
    } catch (err) {
        console.error('Send error:', err);
        addMessage('assistant', 'Unable to reach the backend. Please make sure the server is running.', { isRefusal: true });
    } finally {
        loadingIndicator.style.display = 'none';
        sendBtn.disabled = !messageInput.value.trim();
    }
}

// ── Render Message ─────────────────────────────────────────
function addMessage(role, text, opts = {}) {
    const { sourceUrl, isRefusal, confidence, processingTime } = opts;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const div = document.createElement('div');
    div.className = `message ${role}${isRefusal ? ' refusal' : ''}`;

    // Avatar SVG
    const avatarSvg = role === 'assistant'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

    // Source citation
    let sourceHtml = '';
    if (sourceUrl && role === 'assistant' && !isRefusal) {
        sourceHtml = `
            <div class="msg-source">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">${truncateUrl(sourceUrl)}</a>
            </div>`;
    }

    // Confidence badge
    let confidenceHtml = '';
    if (confidence && role === 'assistant' && !isRefusal) {
        confidenceHtml = `<span class="msg-confidence">${Math.round(confidence * 100)}% match</span>`;
    }

    div.innerHTML = `
        <div class="msg-avatar">${avatarSvg}</div>
        <div class="msg-content">
            <div class="msg-bubble">
                <div class="msg-text">${formatText(text)}</div>
                ${sourceHtml}
            </div>
            <div class="msg-meta">
                <span class="msg-time">${time}</span>
                ${confidenceHtml}
            </div>
        </div>`;

    messagesContainer.appendChild(div);
    scrollToBottom();
}

// ── Utilities ──────────────────────────────────────────────
function formatText(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function truncateUrl(url, max = 55) {
    return url.length <= max ? url : url.substring(0, max) + '…';
}

function truncateText(text, max) {
    return text.length <= max ? text : text.substring(0, max) + '…';
}

function formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}

function scrollToBottom() {
    if (messagesScroll) {
        messagesScroll.scrollTop = messagesScroll.scrollHeight;
    }
}

function autoResize() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}
