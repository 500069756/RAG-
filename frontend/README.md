# Mutual Fund FAQ Assistant - Testing UI

A lightweight HTML/CSS/JavaScript frontend for testing the Mutual Fund FAQ Assistant backend API.

## 🎯 Purpose

This is a **testing UI** designed to validate the backend functionality quickly without the complexity of a full Next.js build. It provides:

- ✅ Chat interface with real-time responses
- ✅ Thread management (create, switch between conversations)
- ✅ Welcome screen with example questions
- ✅ Source citation display
- ✅ Refusal/advisory warning styling
- ✅ Mobile responsive design
- ✅ Backend health monitoring

## 🚀 Quick Start

### Prerequisites

- Backend server running on `http://localhost:5000`
- Python 3.6+ (for the HTTP server)
- Modern web browser

### Step 1: Start the Backend

```bash
cd backend
python app.py
```

You should see:
```
🟢 Flask app running on http://localhost:5000
```

### Step 2: Start the Frontend

```bash
cd frontend
python serve.py
```

You should see:
```
============================================================
💼 Mutual Fund FAQ Assistant - Testing UI
============================================================
🌐 Server running at: http://localhost:3000
📁 Serving files from: C:\Users\bansa\Downloads\rag\frontend
🔗 Backend API: http://localhost:5000/api
============================================================
```

### Step 3: Open in Browser

Navigate to: **http://localhost:3000**

## 🎨 Features

### 1. Welcome Screen

When you first open the app, you'll see:

- **App introduction** with capability list
- **4 example question cards** that you can click to test:
  - 📊 "What is the expense ratio of HDFC Top 100 Fund?"
  - 🔒 "What is the lock-in period for ELSS Tax Saver Fund?"
  - 📄 "How do I download my mutual fund account statement?"
  - 💰 "What is the minimum SIP amount for HDFC Mid Cap Fund?"

### 2. Chat Interface

- **User messages** appear on the right (blue bubbles)
- **Assistant responses** appear on the left (gray bubbles)
- **Refusal messages** shown with amber/yellow styling
- **Source citations** displayed below assistant responses with clickable links
- **Timestamps** shown for each message

### 3. Thread Management

- **"+ New Thread" button** creates a fresh conversation
- **Sidebar** shows list of past conversations
- **Thread metadata** displays:
  - Conversation title (truncated from first message)
  - Time ago (e.g., "5m ago", "2h ago")
  - Message count
  - Confidence score (after first response)
- **Click any thread** to switch to that conversation
- **Thread data stored in localStorage** (persists across browser refreshes)

### 4. Input Area

- **Textarea** for multi-line input (auto-resizes)
- **Send button** with paper airplane icon
- **Keyboard shortcuts**:
  - `Enter` - Send message
  - `Shift + Enter` - New line
- **Input hint** below the input area

### 5. Status Bar

Shows at the bottom of the page:
- **🟢 Backend connected** - Backend is running
- **🟡 Backend status unknown** - Uncertain connection
- **🔴 Backend disconnected** - Backend not running

Also displays current thread info.

### 6. Loading State

While waiting for a response:
- **Animated typing dots** (3 bouncing dots)
- **"Searching facts..."** text
- Input is disabled until response arrives

## 📁 File Structure

```
frontend/
├── index.html          # Main HTML structure
├── style.css           # Complete CSS styling
├── app.js              # JavaScript logic
├── serve.py            # Simple HTTP server with CORS
└── README.md           # This file
```

## 🎯 Testing Checklist

Use this UI to test the following backend features:

### Basic Functionality
- [ ] Backend health check on page load
- [ ] Send a message and receive a response
- [ ] Click example question cards
- [ ] Create new threads
- [ ] Switch between threads

### Guardrails & Compliance
- [ ] Ask an advisory question (e.g., "Which fund should I invest in?")
  - Should show amber refusal message
- [ ] Enter PII data (e.g., PAN number: `ABCDE1234F`)
  - Should be blocked by input guardrail
- [ ] Ask a factual question
  - Should show response with source citation

### RAG Pipeline
- [ ] Ask about fund NAV, expense ratio, minimum SIP
  - Should retrieve from Chroma Cloud
  - Should cite source URL
- [ ] Ask about a fund that doesn't exist
  - Should handle gracefully with low confidence

### Performance
- [ ] Note response time (should be < 2s)
- [ ] Check confidence scores in thread list
- [ ] Verify source URLs are correct

## 🔧 Customization

### Change Backend URL

Edit `app.js` line 2:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

Change to your backend URL (e.g., production Render URL).

### Change Example Questions

Edit `index.html` lines 48-67:

```html
<button class="example-card" data-question="Your question here?">
    <div class="example-icon">🎯</div>
    <div class="example-text">Your question here?</div>
</button>
```

### Change Port

```bash
python serve.py --port 8080
```

### Modify Colors

Edit `style.css` lines 2-20 (CSS Variables):

```css
:root {
    --primary-color: #2563eb;        /* Blue for user messages */
    --success-color: #10b981;        /* Green for assistant */
    --warning-color: #f59e0b;        /* Amber for refusals */
    ...
}
```

## 🐛 Troubleshooting

### "🔴 Backend disconnected"

**Problem:** Backend server is not running.

**Solution:**
```bash
cd backend
python app.py
```

### No Response After Sending Message

**Problem:** Message sent but no response appears.

**Solution:**
1. Check browser console for errors (F12)
2. Verify backend is running on port 5000
3. Check backend terminal for error logs
4. Verify CORS is enabled in Flask app

### Example Questions Don't Work

**Problem:** Clicking example cards doesn't send message.

**Solution:**
1. Check browser console for JavaScript errors
2. Verify `app.js` is loaded (check Network tab)
3. Make sure backend health check passed

### Thread List Empty After Refresh

**Problem:** Threads disappear after page reload.

**Solution:** This is expected if localStorage is cleared. Threads are stored in browser localStorage.

## 🔌 API Integration

The frontend communicates with the backend via these endpoints:

### `GET /api/health`

Check backend status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-19T10:30:00Z"
}
```

### `POST /api/chat`

Send a message and get a response.

**Request:**
```json
{
  "message": "What is the expense ratio of HDFC Top 100?",
  "thread_id": "thread_abc123"  // Optional for first message
}
```

**Response:**
```json
{
  "thread_id": "thread_abc123",
  "response": "The expense ratio of HDFC Top 100 Fund is 1.04%...",
  "source_url": "https://www.hdfcfund.com/...",
  "confidence_score": 0.85,
  "processing_time_ms": 1250,
  "is_refusal": false
}
```

## 📱 Mobile Support

The UI is fully responsive:

- **Desktop (>768px):** Sidebar + chat side-by-side
- **Mobile (≤768px):** Sidebar stacks above chat
- **Touch-friendly:** Large tap targets for buttons and example cards

## 🚀 Future Enhancements

For production deployment, consider:

1. **Next.js + Tailwind CSS** (as per architecture.md)
2. **Streaming responses** via Server-Sent Events (SSE)
3. **Dark mode toggle**
4. **Export conversation** as PDF/text
5. **Feedback buttons** (thumbs up/down)
6. **Advanced search** in thread history
7. **Authentication** for persistent sessions
8. **WebSocket** for real-time updates

## 📄 License

Part of the Mutual Fund FAQ Assistant project.

---

**⚠️ Disclaimer:** This UI is for testing purposes only. It does not provide investment advice. Always consult a SEBI-registered financial advisor before making investment decisions.
