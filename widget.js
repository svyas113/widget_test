(function () {
    // ── 1. Prevent multiple injections ──────────────────────────────────────
    if (document.getElementById('chat-widget-launcher')) return;

    // ── 2. Configuration ────────────────────────────────────────────────────
    const API_BASE = 'https://custivox-agent-512321808055.asia-south1.run.app';

    // Persistent channel ID across page refreshes (localStorage as recommended
    // by the API docs so the user's session survives navigation).
    const CHANNEL_ID = (function () {
        const key = 'chat_widget_channel_id';
        let id = localStorage.getItem(key);
        if (!id) {
            id = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : 'widget-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now();
            localStorage.setItem(key, id);
        }
        return id;
    })();

    // ── 3. Session state ─────────────────────────────────────────────────────
    let selectedLanguage = null;   // 'hindi' | 'gujarati'
    let isInitialized    = false;  // true after /select_language succeeds
    let isBusy           = false;  // blocks send while agent is processing

    // ── 4. Inject scoped CSS ─────────────────────────────────────────────────
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
            height: 500px;
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
        #chat-widget-close:hover { background: rgba(255,255,255,0.2); }
        #chat-widget-close svg {
            width: 18px;
            height: 18px;
            stroke: #ffffff;
            fill: none;
            stroke-width: 2.5;
            stroke-linecap: round;
        }

        /* ── Language Picker Screen ── */
        #chat-widget-lang-screen {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 24px;
            background: #f9fafb;
        }
        #chat-widget-lang-screen.chat-hidden { display: none; }
        #chat-widget-lang-title {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
            text-align: center;
        }
        #chat-widget-lang-subtitle {
            font-size: 13px;
            color: #6b7280;
            text-align: center;
            line-height: 1.5;
        }
        #chat-widget-lang-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
        }
        .chat-lang-btn {
            width: 100%;
            padding: 14px 18px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            background: #ffffff;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
            text-align: left;
        }
        .chat-lang-btn:hover {
            border-color: #3b82f6;
            background: #eff6ff;
            box-shadow: 0 2px 8px rgba(59,130,246,0.12);
        }
        .chat-lang-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .chat-lang-flag {
            font-size: 26px;
            flex-shrink: 0;
        }
        .chat-lang-info-title {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
        }
        .chat-lang-info-hint {
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
        }
        #chat-widget-lang-loading {
            font-size: 13px;
            color: #6b7280;
            display: none;
        }
        #chat-widget-lang-loading.chat-visible { display: block; }

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
        #chat-widget-messages.chat-hidden { display: none; }
        #chat-widget-messages::-webkit-scrollbar { width: 4px; }
        #chat-widget-messages::-webkit-scrollbar-track { background: transparent; }
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
        .chat-msg-row.user { flex-direction: row-reverse; }
        .chat-bubble {
            max-width: 78%;
            padding: 10px 14px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.55;
            word-wrap: break-word;
            white-space: pre-wrap;
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
        .chat-msg-row.bot.chat-error .chat-bubble {
            background: #fef2f2;
            color: #b91c1c;
            border-color: #fecaca;
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
            padding: 12px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 8px;
            background: #ffffff;
            flex-shrink: 0;
        }
        #chat-widget-input-row.chat-hidden { display: none; }
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
        #chat-widget-input:focus { border-color: #3b82f6; }
        #chat-widget-input::placeholder { color: #9ca3af; }
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
        #chat-widget-send:hover { background: #2563eb; }
        #chat-widget-send:disabled {
            background: #93c5fd;
            cursor: not-allowed;
        }
        #chat-widget-send svg {
            width: 18px;
            height: 18px;
            fill: #ffffff;
        }

        /* ── Change Language link ── */
        #chat-widget-change-lang {
            padding: 6px 16px 8px;
            background: #ffffff;
            border-top: 1px solid #f3f4f6;
            text-align: center;
            flex-shrink: 0;
        }
        #chat-widget-change-lang.chat-hidden { display: none; }
        #chat-widget-change-lang button {
            background: none;
            border: none;
            color: #6b7280;
            font-size: 11px;
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 4px;
            transition: color 0.15s;
        }
        #chat-widget-change-lang button:hover { color: #3b82f6; }
    `;
    document.head.appendChild(style);

    // ── 5. Build launcher button ─────────────────────────────────────────────
    const launcher = document.createElement('button');
    launcher.id = 'chat-widget-launcher';
    launcher.setAttribute('aria-label', 'Open chat');
    launcher.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>`;
    document.body.appendChild(launcher);

    // ── 6. Build chat window ─────────────────────────────────────────────────
    const chatWindow = document.createElement('div');
    chatWindow.id = 'chat-widget-window';
    chatWindow.classList.add('chat-hidden');
    chatWindow.innerHTML = `
        <!-- Header -->
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
                    <div id="chat-widget-subtitle">Chat in Hindi or Gujarati</div>
                </div>
            </div>
            <button id="chat-widget-close" aria-label="Close chat">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>

        <!-- Language Picker Screen -->
        <div id="chat-widget-lang-screen">
            <div id="chat-widget-lang-title">Select your language</div>
            <div id="chat-widget-lang-subtitle">
                Type in romanized Hindi or Gujarati<br>
                and get replies in native script.
            </div>
            <div id="chat-widget-lang-buttons">
                <button class="chat-lang-btn" data-lang="hindi">
                    <span class="chat-lang-flag">🇮🇳</span>
                    <div>
                        <div class="chat-lang-info-title">Hindi</div>
                        <div class="chat-lang-info-hint">e.g. "mujhe shoes chahiye"</div>
                    </div>
                </button>
                <button class="chat-lang-btn" data-lang="gujarati">
                    <span class="chat-lang-flag">🇮🇳</span>
                    <div>
                        <div class="chat-lang-info-title">Gujarati</div>
                        <div class="chat-lang-info-hint">e.g. "mane shoes joiye"</div>
                    </div>
                </button>
            </div>
            <div id="chat-widget-lang-loading">Connecting… please wait ⏳</div>
        </div>

        <!-- Messages Area (hidden until language is selected) -->
        <div id="chat-widget-messages" class="chat-hidden"></div>

        <!-- Change Language link (hidden until language is selected) -->
        <div id="chat-widget-change-lang" class="chat-hidden">
            <button id="chat-widget-change-lang-btn">🔄 Change language</button>
        </div>

        <!-- Input Row (hidden until language is selected) -->
        <div id="chat-widget-input-row" class="chat-hidden">
            <input id="chat-widget-input" type="text"
                   placeholder="Type in romanized Hindi or Gujarati…"
                   autocomplete="off"/>
            <button id="chat-widget-send" aria-label="Send message">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
            </button>
        </div>
    `;
    document.body.appendChild(chatWindow);

    // ── 7. Grab element references ───────────────────────────────────────────
    const langScreen     = chatWindow.querySelector('#chat-widget-lang-screen');
    const langLoading    = chatWindow.querySelector('#chat-widget-lang-loading');
    const langButtons    = chatWindow.querySelectorAll('.chat-lang-btn');
    const messagesEl     = chatWindow.querySelector('#chat-widget-messages');
    const inputRow       = chatWindow.querySelector('#chat-widget-input-row');
    const changeLangBar  = chatWindow.querySelector('#chat-widget-change-lang');
    const changeLangBtn  = chatWindow.querySelector('#chat-widget-change-lang-btn');
    const inputEl        = chatWindow.querySelector('#chat-widget-input');
    const sendBtn        = chatWindow.querySelector('#chat-widget-send');
    const closeBtn       = chatWindow.querySelector('#chat-widget-close');

    // ── 8. UI helpers ────────────────────────────────────────────────────────
    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function appendMessage(text, sender /* 'user' | 'bot' */, isError) {
        const row = document.createElement('div');
        row.className = 'chat-msg-row ' + sender + (isError ? ' chat-error' : '');
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.textContent = text;
        row.appendChild(bubble);
        messagesEl.appendChild(row);
        scrollToBottom();
    }

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

    function setBusy(busy) {
        isBusy = busy;
        sendBtn.disabled = busy;
        inputEl.disabled = busy;
    }

    /** Show the language picker; hide chat UI */
    function showLangScreen() {
        langScreen.classList.remove('chat-hidden');
        messagesEl.classList.add('chat-hidden');
        inputRow.classList.add('chat-hidden');
        changeLangBar.classList.add('chat-hidden');
        langLoading.classList.remove('chat-visible');
        langButtons.forEach(function (b) { b.disabled = false; });
        isInitialized = false;
        selectedLanguage = null;
    }

    /** Show the chat UI; hide language picker */
    function showChatScreen() {
        langScreen.classList.add('chat-hidden');
        messagesEl.classList.remove('chat-hidden');
        inputRow.classList.remove('chat-hidden');
        changeLangBar.classList.remove('chat-hidden');
        inputEl.focus();
    }

    // ── 9. API calls ─────────────────────────────────────────────────────────

    /**
     * POST /select_language — initialises the session for this channel+language.
     * The Translation API handles JWT tokens internally; we don't touch them.
     */
    async function selectLanguage(language) {
        const res = await fetch(API_BASE + '/select_language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel_id: CHANNEL_ID,
                language: language
            })
        });
        if (!res.ok) {
            const status = res.status;
            if (status === 422) throw new Error('invalid_language');
            if (status === 502) throw new Error('backend_unreachable');
            throw new Error('select_lang_error:' + status);
        }
        const data = await res.json();
        if (data.status !== 'ok') throw new Error('select_lang_not_ok');
        selectedLanguage = language;
        isInitialized = true;
    }

    /**
     * POST /chat — sends the user message and returns the native-script reply.
     * On 401 the Translation API session has expired → re-initialise and retry.
     */
    async function callAgent(message) {
        async function doRequest() {
            return fetch(API_BASE + '/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel_id: CHANNEL_ID,
                    message: message
                })
            });
        }

        let res = await doRequest();

        // ── FastWorkflow JWT expired inside the Translation API → re-init ──
        if (res.status === 401) {
            await selectLanguage(selectedLanguage);
            res = await doRequest();
        }

        if (!res.ok) {
            if (res.status === 404) throw new Error('session_not_found');
            if (res.status === 500) throw new Error('translation_failed');
            if (res.status === 502) throw new Error('backend_unreachable');
            throw new Error('chat_error:' + res.status);
        }

        const data = await res.json();
        return data.response || 'I received your message but could not parse the response.';
    }

    // ── 10. Language selection handler ───────────────────────────────────────
    async function handleLanguageSelect(language) {
        langButtons.forEach(function (b) { b.disabled = true; });
        langLoading.classList.add('chat-visible');

        try {
            await selectLanguage(language);

            // Transition to chat
            showChatScreen();

            const langLabel = language === 'hindi' ? 'Hindi 🇮🇳' : 'Gujarati 🇮🇳';
            appendMessage(
                'Hello! 👋 Language set to ' + langLabel + '.\nType your message in romanized ' +
                (language === 'hindi' ? 'Hindi (e.g. "mujhe help chahiye").' : 'Gujarati (e.g. "mane madad joiye").'),
                'bot'
            );
        } catch (err) {
            langLoading.classList.remove('chat-visible');
            langButtons.forEach(function (b) { b.disabled = false; });
            const msg = err.message || '';
            if (msg === 'backend_unreachable') {
                // Show error inside the lang screen itself
                langLoading.textContent = '⚠️ Could not reach the agent. Please try again.';
                langLoading.style.color = '#b91c1c';
                langLoading.classList.add('chat-visible');
            } else {
                langLoading.textContent = '⚠️ Something went wrong. Please try again.';
                langLoading.style.color = '#b91c1c';
                langLoading.classList.add('chat-visible');
            }
        }
    }

    // ── 11. Send message flow ────────────────────────────────────────────────
    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text || isBusy) return;

        appendMessage(text, 'user');
        inputEl.value = '';
        setBusy(true);
        showTyping();

        try {
            const reply = await callAgent(text);
            hideTyping();
            appendMessage(reply, 'bot');
        } catch (err) {
            hideTyping();
            const msg = err.message || '';
            if (msg === 'session_not_found') {
                appendMessage('⚠️ Session expired. Please select your language again.', 'bot', true);
                showLangScreen();
            } else if (msg === 'translation_failed') {
                appendMessage('⚠️ Translation failed. Please rephrase your message and try again.', 'bot', true);
            } else if (msg === 'backend_unreachable') {
                appendMessage('⚠️ The agent is unreachable right now. Please try again later.', 'bot', true);
            } else {
                appendMessage('⚠️ Something went wrong. Please try again.', 'bot', true);
            }
        } finally {
            setBusy(false);
            inputEl.focus();
        }
    }

    // ── 12. Open / close ─────────────────────────────────────────────────────
    function openChat() {
        chatWindow.classList.remove('chat-hidden');
        if (!isInitialized) {
            // Reset lang screen state cleanly on open
            langLoading.classList.remove('chat-visible');
            langLoading.style.color = '#6b7280';
            langLoading.textContent = 'Connecting… please wait ⏳';
            langButtons.forEach(function (b) { b.disabled = false; });
        } else {
            inputEl.focus();
        }
    }

    function closeChat() {
        chatWindow.classList.add('chat-hidden');
    }

    // ── 13. Event listeners ──────────────────────────────────────────────────
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

    // Language buttons
    langButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            handleLanguageSelect(btn.getAttribute('data-lang'));
        });
    });

    // "Change language" link — wipe messages and return to picker
    changeLangBtn.addEventListener('click', function () {
        messagesEl.innerHTML = '';
        showLangScreen();
    });

})();
