(function () {
    // 1. Prevent multiple injections if the script is loaded twice
    if (document.getElementById('chat-widget-launcher')) return;

    // 2. Inject scoped CSS
    const style = document.createElement('style');
    style.innerHTML = `
        /* ── Launcher Button ── */
        #chat-widget-launcher {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #3b82f6;
            box-shadow: 0 4px 16px rgba(59,130,246,0.45);
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2147483647;
            transition: background 0.2s, transform 0.2s;
        }
        #chat-widget-launcher:hover {
            background: #2563eb;
            transform: scale(1.08);
        }
        #chat-widget-launcher svg {
            width: 26px;
            height: 26px;
            fill: #ffffff;
        }

        /* ── Chat Window ── */
        #chat-widget-window {
            position: fixed;
            bottom: 92px;
            right: 24px;
            width: 340px;
            height: 480px;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18);
            display: flex;
            flex-direction: column;
            z-index: 2147483646;
            font-family: system-ui, -apple-system, sans-serif;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            transition: opacity 0.2s, transform 0.2s;
        }
        #chat-widget-window.chat-hidden {
            opacity: 0;
            pointer-events: none;
            transform: translateY(12px);
        }
        #chat-widget-window * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        /* ── Header ── */
        #chat-widget-header {
            background: #3b82f6;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
        }
        #chat-widget-header-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #chat-widget-avatar {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #ffffff33;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #chat-widget-avatar svg {
            width: 20px;
            height: 20px;
            fill: #ffffff;
        }
        #chat-widget-title {
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
        }
        #chat-widget-subtitle {
            color: #bfdbfe;
            font-size: 11px;
            margin-top: 1px;
        }
        #chat-widget-close {
            background: none;
            border: none;
            cursor: pointer;
            color: #ffffff;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: background 0.15s;
        }
        #chat-widget-close:hover {
            background: rgba(255,255,255,0.2);
        }
        #chat-widget-close svg {
            width: 18px;
            height: 18px;
            stroke: #ffffff;
            fill: none;
            stroke-width: 2.5;
            stroke-linecap: round;
        }

        /* ── Messages Area ── */
        #chat-widget-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: #f9fafb;
        }
        #chat-widget-messages::-webkit-scrollbar {
            width: 4px;
        }
        #chat-widget-messages::-webkit-scrollbar-track {
            background: transparent;
        }
        #chat-widget-messages::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
        }

        /* ── Message Bubbles ── */
        .chat-msg-row {
            display: flex;
            align-items: flex-end;
            gap: 8px;
        }
        .chat-msg-row.user {
            flex-direction: row-reverse;
        }
        .chat-bubble {
            max-width: 75%;
            padding: 10px 14px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.45;
            word-wrap: break-word;
        }
        .chat-msg-row.user .chat-bubble {
            background: #3b82f6;
            color: #ffffff;
            border-bottom-right-radius: 4px;
        }
        .chat-msg-row.bot .chat-bubble {
            background: #ffffff;
            color: #1f2937;
            border-bottom-left-radius: 4px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
            border: 1px solid #e5e7eb;
        }

        /* ── Typing Indicator ── */
        .chat-typing {
            display: flex;
            gap: 4px;
            align-items: center;
            padding: 12px 14px;
        }
        .chat-typing span {
            width: 7px;
            height: 7px;
            background: #9ca3af;
            border-radius: 50%;
            display: inline-block;
            animation: chat-bounce 1.2s infinite ease-in-out;
        }
        .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .chat-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes chat-bounce {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40%            { transform: scale(1.2); opacity: 1; }
        }

        /* ── Input Row ── */
        #chat-widget-input-row {
            padding: 12px 12px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 8px;
            background: #ffffff;
            flex-shrink: 0;
        }
        #chat-widget-input {
            flex: 1;
            padding: 10px 14px;
            border: 1px solid #d1d5db;
            border-radius: 24px;
            font-size: 14px;
            outline: none;
            font-family: system-ui, -apple-system, sans-serif;
            transition: border-color 0.15s;
            color: #1f2937;
        }
        #chat-widget-input:focus {
            border-color: #3b82f6;
        }
        #chat-widget-input::placeholder {
            color: #9ca3af;
        }
        #chat-widget-send {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #3b82f6;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
            flex-shrink: 0;
        }
        #chat-widget-send:hover {
            background: #2563eb;
        }
        #chat-widget-send:disabled {
            background: #93c5fd;
            cursor: not-allowed;
        }
        #chat-widget-send svg {
            width: 18px;
            height: 18px;
            fill: #ffffff;
        }
    `;
    document.head.appendChild(style);

    // 3. Generic bot response (swap this for a real API call later)
    const GENERIC_RESPONSE =
        "Hi there! Thanks for reaching out. Our agent has received your message and will respond shortly.";

    // 4. Build the launcher button
    const launcher = document.createElement('button');
    launcher.id = 'chat-widget-launcher';
    launcher.setAttribute('aria-label', 'Open chat');
    launcher.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>`;
    document.body.appendChild(launcher);

    // 5. Build the chat window
    const chatWindow = document.createElement('div');
    chatWindow.id = 'chat-widget-window';
    chatWindow.classList.add('chat-hidden');
    chatWindow.innerHTML = `
        <div id="chat-widget-header">
            <div id="chat-widget-header-info">
                <div id="chat-widget-avatar">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10
                                 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3
                                 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3
                                 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99
                                 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29
                                 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                </div>
                <div>
                    <div id="chat-widget-title">Chat Assistant</div>
                    <div id="chat-widget-subtitle">Ask me anything</div>
                </div>
            </div>
            <button id="chat-widget-close" aria-label="Close chat">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div id="chat-widget-messages"></div>
        <div id="chat-widget-input-row">
            <input id="chat-widget-input" type="text" placeholder="Type a message…" autocomplete="off"/>
            <button id="chat-widget-send" aria-label="Send message">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
            </button>
        </div>
    `;
    document.body.appendChild(chatWindow);

    // 6. Grab references
    const messagesEl  = chatWindow.querySelector('#chat-widget-messages');
    const inputEl     = chatWindow.querySelector('#chat-widget-input');
    const sendBtn     = chatWindow.querySelector('#chat-widget-send');
    const closeBtn    = chatWindow.querySelector('#chat-widget-close');

    // 7. Helper — scroll messages to bottom
    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // 8. Helper — append a message bubble
    function appendMessage(text, sender /* 'user' | 'bot' */) {
        const row = document.createElement('div');
        row.className = 'chat-msg-row ' + sender;
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.textContent = text;
        row.appendChild(bubble);
        messagesEl.appendChild(row);
        scrollToBottom();
    }

    // 9. Helper — show/hide typing indicator
    function showTyping() {
        const row = document.createElement('div');
        row.className = 'chat-msg-row bot';
        row.id = 'chat-widget-typing';
        row.innerHTML = `<div class="chat-bubble chat-typing">
            <span></span><span></span><span></span>
        </div>`;
        messagesEl.appendChild(row);
        scrollToBottom();
    }
    function hideTyping() {
        const el = document.getElementById('chat-widget-typing');
        if (el) el.remove();
    }

    // 10. Send message logic
    function sendMessage() {
        const text = inputEl.value.trim();
        if (!text) return;

        // Show user message
        appendMessage(text, 'user');
        inputEl.value = '';
        sendBtn.disabled = true;

        // Show typing indicator then reply with generic response
        showTyping();
        setTimeout(function () {
            hideTyping();
            appendMessage(GENERIC_RESPONSE, 'bot');
            sendBtn.disabled = false;
            inputEl.focus();
        }, 900);
    }

    // 11. Toggle open/close
    function openChat() {
        chatWindow.classList.remove('chat-hidden');
        inputEl.focus();
    }
    function closeChat() {
        chatWindow.classList.add('chat-hidden');
    }

    // 12. Event listeners
    launcher.addEventListener('click', function () {
        if (chatWindow.classList.contains('chat-hidden')) {
            openChat();
        } else {
            closeChat();
        }
    });

    closeBtn.addEventListener('click', closeChat);

    sendBtn.addEventListener('click', sendMessage);

    inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 13. Show a welcome message when the window first opens
    let welcomed = false;
    launcher.addEventListener('click', function () {
        if (!welcomed && !chatWindow.classList.contains('chat-hidden')) {
            welcomed = true;
            setTimeout(function () {
                appendMessage("Hello! 👋 How can I help you today?", 'bot');
            }, 300);
        }
    });

})();
