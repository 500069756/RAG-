// === Configuration ===
const API_BASE_URL = 'http://localhost:5000/api';

// === State Management ===
let currentThreadId = null;
let threads = [];

// === DOM Elements ===
const welcomeScreen = document.getElementById('welcomeScreen');
const chatMessages = document.getElementById('chatMessages');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const newThreadBtn = document.getElementById('newThreadBtn');
const threadList = document.getElementById('threadList');
const statusText = document.getElementById('statusText');
const threadInfo = document.getElementById('threadInfo');

// === Initialize ===
document.addEventListener('DOMContentLoaded', () => {
    checkBackendHealth();
    setupEventListeners();
    loadThreads();
});

// === Event Listeners ===
function setupEventListeners() {
    // Send button click
    sendBtn.addEventListener('click', sendMessage);

    // Enter key to send
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Enable/disable send button based on input
    messageInput.addEventListener('input', () => {
        sendBtn.disabled = !messageInput.value.trim();
    });

    // New thread button
    newThreadBtn.addEventListener('click', createNewThread);

    // Example question cards
    document.querySelectorAll('.example-card').forEach(card => {
        card.addEventListener('click', () => {
            const question = card.dataset.question;
            messageInput.value = question;
            sendBtn.disabled = false;
            sendMessage();
        });
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', autoResizeTextarea);
}

// === Backend Health Check ===
async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            statusText.textContent = '🟢 Backend connected';
            statusText.style.color = '#10b981';
        } else {
            statusText.textContent = '🟡 Backend status unknown';
            statusText.style.color = '#f59e0b';
        }
    } catch (error) {
        statusText.textContent = '🔴 Backend disconnected - Please start the server';
        statusText.style.color = '#ef4444';
        console.error('Health check failed:', error);
    }
}

// === Thread Management ===
function loadThreads() {
    const stored = localStorage.getItem('mf_threads');
    if (stored) {
        threads = JSON.parse(stored);
        renderThreadList();
    }
}

function saveThreads() {
    localStorage.setItem('mf_threads', JSON.stringify(threads));
}

function createNewThread() {
    currentThreadId = null;
    messagesContainer.innerHTML = '';
    chatMessages.style.display = 'none';
    welcomeScreen.style.display = 'flex';
    threadInfo.textContent = 'No active thread';
    
    renderThreadList();
}

function switchThread(threadId) {
    currentThreadId = threadId;
    welcomeScreen.style.display = 'none';
    chatMessages.style.display = 'flex';
    
    // Load messages for this thread (would need backend support for persistence)
    messagesContainer.innerHTML = '';
    
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
        threadInfo.textContent = `Thread: ${truncateText(thread.title, 30)}`;
    }
    
    renderThreadList();
}

function renderThreadList() {
    if (threads.length === 0) {
        threadList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <div class="empty-state-text">No conversations yet. Start a new thread!</div>
            </div>
        `;
        return;
    }

    threadList.innerHTML = threads.map(thread => `
        <div class="thread-item ${thread.id === currentThreadId ? 'active' : ''}" 
             onclick="switchThread('${thread.id}')">
            <div class="thread-title">${escapeHtml(thread.title)}</div>
            <div class="thread-meta">
                ${formatDate(thread.created_at)} • ${thread.message_count} messages
                ${thread.confidence ? ` • ${Math.round(thread.confidence * 100)}% confidence` : ''}
            </div>
        </div>
    `).join('');
}

function updateThreadInfo(confidence, processingTime) {
    if (currentThreadId) {
        const thread = threads.find(t => t.id === currentThreadId);
        if (thread) {
            thread.confidence = confidence;
            thread.processing_time = processingTime;
            saveThreads();
            renderThreadList();
        }
    }
}

// === Message Sending ===
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Hide welcome screen, show chat
    welcomeScreen.style.display = 'none';
    chatMessages.style.display = 'flex';

    // Add user message to UI
    addMessageToUI('user', message);
    
    // Clear input
    messageInput.value = '';
    sendBtn.disabled = true;
    messageInput.style.height = 'auto';

    // Show loading
    loadingIndicator.style.display = 'flex';
    sendBtn.disabled = true;

    try {
        const payload = {
            message: message,
            thread_id: currentThreadId
        };

        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Update thread ID if new
        if (!currentThreadId && data.thread_id) {
            currentThreadId = data.thread_id;
            
            // Add to thread list
            threads.unshift({
                id: currentThreadId,
                title: message.substring(0, 50),
                created_at: new Date().toISOString(),
                message_count: 1,
                confidence: data.confidence_score
            });
            saveThreads();
            renderThreadList();
        }

        // Add assistant response
        addMessageToUI('assistant', data.response, data.source_url, data.is_refusal);
        
        // Update thread info
        updateThreadInfo(data.confidence_score, data.processing_time_ms);

        // Scroll to bottom
        scrollToBottom();

    } catch (error) {
        console.error('Error sending message:', error);
        addMessageToUI('assistant', '❌ Error: Unable to reach the backend. Please ensure the Flask server is running.', null, false);
    } finally {
        loadingIndicator.style.display = 'none';
        sendBtn.disabled = false;
    }
}

// === UI Message Rendering ===
function addMessageToUI(role, text, sourceUrl = null, isRefusal = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}${isRefusal ? ' refusal' : ''}`;

    const time = new Date().toLocaleTimeString();
    
    let sourceHtml = '';
    if (sourceUrl && role === 'assistant') {
        sourceHtml = `
            <div class="source-citation">
                Source: <a href="${sourceUrl}" target="_blank" rel="noopener">${truncateUrl(sourceUrl)}</a>
            </div>
        `;
    }

    messageDiv.innerHTML = `
        <div class="message-bubble">
            <div class="message-text">${formatMessageText(text)}</div>
            ${sourceHtml}
        </div>
        <div class="message-time">${time}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();

    // Update message count in current thread
    if (currentThreadId) {
        const thread = threads.find(t => t.id === currentThreadId);
        if (thread) {
            thread.message_count++;
            saveThreads();
            renderThreadList();
        }
    }
}

// === Utility Functions ===
function formatMessageText(text) {
    // Convert newlines to <br>
    return escapeHtml(text).replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateUrl(url, maxLength = 50) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}
