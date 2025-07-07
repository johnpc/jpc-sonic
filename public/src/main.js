import { AudioPlayer } from './lib/play/AudioPlayer.js';
import { ChatHistoryManager } from "./lib/util/ChatHistoryManager.js";
import { logger } from './lib/util/Logger.js';
import { audioUtils } from './lib/util/AudioUtils.js';

// Get WebSocket server URL from environment or use current origin as fallback
const getWebSocketServerUrl = () => {
    // Check if there's a global config (can be set by build process)
    if (typeof window !== 'undefined' && window.WEBSOCKET_SERVER_URL) {
        return window.WEBSOCKET_SERVER_URL;
    }

    // Check for meta tag configuration
    const metaTag = document.querySelector('meta[name="websocket-server-url"]');
    if (metaTag && metaTag.content) {
        return metaTag.content;
    }

    // Fallback to current origin (original behavior)
    return window.location.origin;
};

const WEBSOCKET_SERVER_URL = getWebSocketServerUrl();
logger.info('Connecting to WebSocket server:', WEBSOCKET_SERVER_URL);

// Connect to the server with configurable URL
const socket = io(WEBSOCKET_SERVER_URL);

// Monitor WebSocket connection
logger.monitorWebSocket(socket);

// DOM elements
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const statusElement = document.getElementById('status');
const chatContainer = document.getElementById('chat-container');

// Chat history management
let chat = { history: [] };
const chatRef = { current: chat };
const chatHistoryManager = ChatHistoryManager.getInstance(
    chatRef,
    (newChat) => {
        chat = { ...newChat };
        chatRef.current = chat;
        updateChatUI();
    }
);

// Audio processing variables
let audioContext;
let audioStream;
let isStreaming = false;
let processor;
let sourceNode;
let waitingForAssistantResponse = false;
let waitingForUserTranscription = false;
let userThinkingIndicator = null;
let assistantThinkingIndicator = null;
let transcriptionReceived = false;
let displayAssistantText = false;
let role;
const audioPlayer = new AudioPlayer();
let sessionInitialized = false;

let samplingRatio = 1;
let audioProcessorCleanup = null;

// System prompt - will be loaded from server
let SYSTEM_PROMPT = "You are a friend. The user and you will engage in a spoken " +
    "dialog exchanging the transcripts of a natural real-time conversation. Keep your responses short, " +
    "generally two or three sentences for chatty scenarios.";

// Load system prompt from server
async function loadSystemPrompt() {
    try {
        const response = await fetch(`${WEBSOCKET_SERVER_URL}/api/system-prompt`);
        const data = await response.json();
        SYSTEM_PROMPT = data.systemPrompt;
        logger.info('System prompt loaded from server:', SYSTEM_PROMPT);
    } catch (error) {
        logger.warn('Failed to load system prompt from server, using default:', error);
    }
}

// Initialize system prompt on page load
loadSystemPrompt();

// Initialize WebSocket audio with enhanced error handling
async function initAudio() {
    try {
        statusElement.textContent = "Initializing audio system...";
        statusElement.className = "connecting";

        logger.info('Starting audio initialization...');

        // Check audio permissions first
        const permissionStatus = await audioUtils.checkAudioPermissions();
        logger.info('Audio permission status:', permissionStatus);

        // Initialize audio using enhanced utilities
        const audioConfig = await audioUtils.initializeAudio();

        audioStream = audioConfig.audioStream;
        audioContext = audioConfig.audioContext;
        samplingRatio = audioConfig.samplingRatio;

        // Resume audio context if needed (common on mobile)
        if (audioContext) {
            await audioUtils.resumeAudioContext(audioContext);
        } else {
            logger.error('Audio context is undefined after initialization');
            throw new Error('Failed to create audio context');
        }

        // Start audio player
        await audioPlayer.start();

        // Get audio device information
        const audioDevices = await audioUtils.getAudioDeviceInfo();
        if (audioDevices) {
            logger.info('Available audio devices:', audioDevices);
        }

        statusElement.textContent = "Microphone ready. Click Start to begin.";
        statusElement.className = "ready";
        startButton.disabled = false;

        logger.info('Audio initialization completed successfully');

    } catch (error) {
        logger.error("Error initializing audio:", error);
        statusElement.textContent = "Error: " + error.message;
        statusElement.className = "error";

        // Provide user-friendly error messages
        if (error.message.includes('permission')) {
            statusElement.textContent = "Please allow microphone access and refresh the page.";
        } else if (error.message.includes('not found')) {
            statusElement.textContent = "No microphone found. Please connect a microphone.";
        } else if (error.message.includes('not supported')) {
            statusElement.textContent = "Audio recording not supported in this browser.";
        }
    }
}

// Initialize the session with Bedrock
async function initializeSession() {
    if (sessionInitialized) return;

    statusElement.textContent = "Initializing session...";
    logger.info('Initializing Bedrock session...');

    try {
        // Send events in sequence
        socket.emit('promptStart');
        socket.emit('systemPrompt', SYSTEM_PROMPT);
        socket.emit('audioStart');

        // Mark session as initialized
        sessionInitialized = true;
        statusElement.textContent = "Session initialized successfully";
        logger.info('Bedrock session initialized successfully');
    } catch (error) {
        logger.error("Failed to initialize session:", error);
        statusElement.textContent = "Error initializing session";
        statusElement.className = "error";
    }
}

async function startStreaming() {
    if (isStreaming) return;

    try {
        logger.info('Starting audio streaming...');

        // First, make sure the session is initialized
        if (!sessionInitialized) {
            await initializeSession();
        }

        // Resume audio context if suspended
        if (audioContext) {
            await audioUtils.resumeAudioContext(audioContext);
        } else {
            throw new Error('Audio context is not initialized. Please refresh and try again.');
        }

        // Validate audio stream
        if (!audioStream) {
            throw new Error('Audio stream is not available. Please refresh and try again.');
        }

        // Validate audio stream is still active
        if (!audioStream.active) {
            throw new Error('Audio stream is no longer active. Please refresh and try again.');
        }

        // Create audio processor using enhanced utilities
        const audioProcessor = audioUtils.createAudioProcessor(
            audioContext,
            audioStream,
            samplingRatio,
            (base64Data) => {
                if (isStreaming) {
                    socket.emit('audioInput', base64Data);
                }
            }
        );

        // Store references for cleanup
        sourceNode = audioProcessor.sourceNode;
        processor = audioProcessor.processor;
        audioProcessorCleanup = audioProcessor.cleanup;

        isStreaming = true;
        startButton.disabled = true;
        stopButton.disabled = false;
        statusElement.textContent = "Streaming... Speak now";
        statusElement.className = "recording";

        // Show user thinking indicator when starting to record
        transcriptionReceived = false;
        showUserThinkingIndicator();

        logger.info('Audio streaming started successfully');

    } catch (error) {
        logger.error("Error starting audio streaming:", error);
        statusElement.textContent = "Error: " + error.message;
        statusElement.className = "error";

        // Reset state on error
        isStreaming = false;
        startButton.disabled = false;
        stopButton.disabled = true;
    }
}

// Base64 to Float32Array conversion using enhanced utilities
function base64ToFloat32Array(base64String) {
    return audioUtils.base64ToFloat32Array(base64String);
}

// Process message data and add to chat history
function handleTextOutput(data) {
    logger.debug("Processing text output:", data);
    if (data.content) {
        const messageData = {
            role: data.role,
            message: data.content
        };
        chatHistoryManager.addTextMessage(messageData);
    }
}

// Update the UI based on the current chat history
function updateChatUI() {
    if (!chatContainer) {
        logger.error("Chat container not found");
        return;
    }

    // Clear existing chat messages
    chatContainer.innerHTML = '';

    // Add all messages from history
    chat.history.forEach(item => {
        if (item.endOfConversation) {
            const endDiv = document.createElement('div');
            endDiv.className = 'message system';
            endDiv.textContent = "Conversation ended";
            chatContainer.appendChild(endDiv);
            return;
        }

        if (item.role) {
            const messageDiv = document.createElement('div');
            const roleLowerCase = item.role.toLowerCase();
            messageDiv.className = `message ${roleLowerCase}`;

            const roleLabel = document.createElement('div');
            roleLabel.className = 'role-label';
            roleLabel.textContent = item.role;
            messageDiv.appendChild(roleLabel);

            const content = document.createElement('div');
            content.textContent = item.message || "No content";
            messageDiv.appendChild(content);

            chatContainer.appendChild(messageDiv);
        }
    });

    // Re-add thinking indicators if we're still waiting
    if (waitingForUserTranscription) {
        showUserThinkingIndicator();
    }

    if (waitingForAssistantResponse) {
        showAssistantThinkingIndicator();
    }

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Show the "Listening" indicator for user
function showUserThinkingIndicator() {
    hideUserThinkingIndicator();

    waitingForUserTranscription = true;
    userThinkingIndicator = document.createElement('div');
    userThinkingIndicator.className = 'message user thinking';

    const roleLabel = document.createElement('div');
    roleLabel.className = 'role-label';
    roleLabel.textContent = 'USER';
    userThinkingIndicator.appendChild(roleLabel);

    const listeningText = document.createElement('div');
    listeningText.className = 'thinking-text';
    listeningText.textContent = 'Listening';
    userThinkingIndicator.appendChild(listeningText);

    const dotContainer = document.createElement('div');
    dotContainer.className = 'thinking-dots';

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dotContainer.appendChild(dot);
    }

    userThinkingIndicator.appendChild(dotContainer);
    chatContainer.appendChild(userThinkingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Show the "Thinking" indicator for assistant
function showAssistantThinkingIndicator() {
    hideAssistantThinkingIndicator();

    waitingForAssistantResponse = true;
    assistantThinkingIndicator = document.createElement('div');
    assistantThinkingIndicator.className = 'message assistant thinking';

    const roleLabel = document.createElement('div');
    roleLabel.className = 'role-label';
    roleLabel.textContent = 'ASSISTANT';
    assistantThinkingIndicator.appendChild(roleLabel);

    const thinkingText = document.createElement('div');
    thinkingText.className = 'thinking-text';
    thinkingText.textContent = 'Thinking';
    assistantThinkingIndicator.appendChild(thinkingText);

    const dotContainer = document.createElement('div');
    dotContainer.className = 'thinking-dots';

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dotContainer.appendChild(dot);
    }

    assistantThinkingIndicator.appendChild(dotContainer);
    chatContainer.appendChild(assistantThinkingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Hide the user thinking indicator
function hideUserThinkingIndicator() {
    waitingForUserTranscription = false;
    if (userThinkingIndicator && userThinkingIndicator.parentNode) {
        userThinkingIndicator.parentNode.removeChild(userThinkingIndicator);
    }
    userThinkingIndicator = null;
}

// Hide the assistant thinking indicator
function hideAssistantThinkingIndicator() {
    waitingForAssistantResponse = false;
    if (assistantThinkingIndicator && assistantThinkingIndicator.parentNode) {
        assistantThinkingIndicator.parentNode.removeChild(assistantThinkingIndicator);
    }
    assistantThinkingIndicator = null;
}

// EVENT HANDLERS
// --------------

// Handle content start from the server
socket.on('contentStart', (data) => {
    logger.debug('Content start received:', data);

    if (data.type === 'TEXT') {
        // Below update will be enabled when role is moved to the contentStart
        role = data.role;
        if (data.role === 'USER') {
            // When user's text content starts, hide user thinking indicator
            hideUserThinkingIndicator();
        }
        else if (data.role === 'ASSISTANT') {
            // When assistant's text content starts, hide assistant thinking indicator
            hideAssistantThinkingIndicator();
            let isSpeculative = false;
            try {
                if (data.additionalModelFields) {
                    const additionalFields = JSON.parse(data.additionalModelFields);
                    isSpeculative = additionalFields.generationStage === "SPECULATIVE";
                    if (isSpeculative) {
                        logger.debug("Received speculative content");
                        displayAssistantText = true;
                    }
                    else {
                        displayAssistantText = false;
                    }
                }
            } catch (e) {
                logger.error("Error parsing additionalModelFields:", e);
            }
        }
    }
    else if (data.type === 'AUDIO') {
        // When audio content starts, we may need to show user thinking indicator
        if (isStreaming) {
            showUserThinkingIndicator();
        }
    }
});

// Handle text output from the server
socket.on('textOutput', (data) => {
    logger.debug('Received text output:', data);

    if (role === 'USER') {
        // When user text is received, show thinking indicator for assistant response
        transcriptionReceived = true;
        //hideUserThinkingIndicator();

        // Add user message to chat
        handleTextOutput({
            role: data.role,
            content: data.content
        });

        // Show assistant thinking indicator after user text appears
        showAssistantThinkingIndicator();
    }
    else if (role === 'ASSISTANT') {
        //hideAssistantThinkingIndicator();
        if (displayAssistantText) {
            handleTextOutput({
                role: data.role,
                content: data.content
            });
        }
    }
});

// Handle audio output
socket.on('audioOutput', (data) => {
    if (data.content) {
        try {
            const audioData = base64ToFloat32Array(data.content);
            audioPlayer.playAudio(audioData);
        } catch (error) {
            logger.error('Error processing audio data:', error);
        }
    }
});

// Handle content end events
socket.on('contentEnd', (data) => {
    logger.debug('Content end received:', data);

    if (data.type === 'TEXT') {
        if (role === 'USER') {
            // When user's text content ends, make sure assistant thinking is shown
            hideUserThinkingIndicator();
            showAssistantThinkingIndicator();
        }
        else if (role === 'ASSISTANT') {
            // When assistant's text content ends, prepare for user input in next turn
            hideAssistantThinkingIndicator();
        }

        // Handle stop reasons
        if (data.stopReason && data.stopReason.toUpperCase() === 'END_TURN') {
            chatHistoryManager.endTurn();
        } else if (data.stopReason && data.stopReason.toUpperCase() === 'INTERRUPTED') {
            logger.info("Interrupted by user");
            audioPlayer.bargeIn();
        }
    }
    else if (data.type === 'AUDIO') {
        // When audio content ends, we may need to show user thinking indicator
        if (isStreaming) {
            showUserThinkingIndicator();
        }
    }
});

// Stream completion event
socket.on('streamComplete', () => {
    if (isStreaming) {
        stopStreaming();
    }
    statusElement.textContent = "Ready";
    statusElement.className = "ready";
});

// Handle connection status updates
socket.on('connect', () => {
    statusElement.textContent = "Connected to server";
    statusElement.className = "connected";
    sessionInitialized = false;
    logger.info('WebSocket connected to server');
});

socket.on('disconnect', () => {
    statusElement.textContent = "Disconnected from server";
    statusElement.className = "disconnected";
    startButton.disabled = true;
    stopButton.disabled = true;
    sessionInitialized = false;
    hideUserThinkingIndicator();
    hideAssistantThinkingIndicator();
    logger.warn('WebSocket disconnected from server');
});

// Handle errors
socket.on('error', (error) => {
    logger.error("Server error:", error);
    statusElement.textContent = "Error: " + (error.message || JSON.stringify(error).substring(0, 100));
    statusElement.className = "error";
    hideUserThinkingIndicator();
    hideAssistantThinkingIndicator();
});

// Button event listeners - moved to after all functions are defined
// startButton.addEventListener('click', startStreaming);
// stopButton.addEventListener('click', stopStreaming);

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    function stopStreaming() {
        if (!isStreaming) return;

        isStreaming = false;

        // Clean up audio processing
        if (processor) {
            processor.disconnect();
            sourceNode.disconnect();
        }

        startButton.disabled = false;
        stopButton.disabled = true;
        statusElement.textContent = "Processing...";
        statusElement.className = "processing";

        audioPlayer.stop();
        // Tell server to finalize processing
        socket.emit('stopAudio');

        // End the current turn in chat history
        chatHistoryManager.endTurn();
    }
    try {
        // Add button event listeners after all functions are defined
        startButton.addEventListener('click', startStreaming);
        stopButton.addEventListener('click', stopStreaming);

        initAudio();
    } catch (error) {
        logger.error('Failed to initialize app:', error);
        if (statusElement) {
            statusElement.textContent = "Initialization failed: " + error.message;
            statusElement.className = "error";
        }
    }
});

// Add global error handler for undefined object errors
window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('undefined is not an object')) {
        logger.error('Undefined object error detected:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
        });

        // Provide user-friendly error message
        if (statusElement) {
            statusElement.textContent = "Audio system error. Please refresh the page.";
            statusElement.className = "error";
        }

        // Reset audio state
        if (isStreaming) {
            stopStreaming();
        }

        // Disable buttons to prevent further errors
        if (startButton) startButton.disabled = true;
        if (stopButton) stopButton.disabled = true;
    }
});