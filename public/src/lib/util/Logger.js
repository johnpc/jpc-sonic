/**
 * Enhanced logging utility for Capacitor iOS debugging
 */
export class Logger {
    constructor(prefix = 'JPC-Sonic') {
        this.prefix = prefix;
        this.isCapacitor = !!window.Capacitor;
        this.isNative = window.Capacitor?.isNativePlatform();
        this.platform = window.Capacitor?.getPlatform();
        
        // Initialize error handlers
        this.initializeErrorHandlers();
        
        // Log environment info on startup
        this.logEnvironmentInfo();
    }

    /**
     * Enhanced debug logging function
     */
    debugLog(message, data = null, level = 'log') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${this.prefix}] ${message}`;
        
        // Console logging with appropriate level
        console[level](logMessage);
        if (data) {
            console[level]('Data:', this.safeStringify(data));
        }
        
        // Also log to native console if available
        if (this.isCapacitor && window.Capacitor?.Plugins?.Console) {
            try {
                window.Capacitor.Plugins.Console.log(logMessage);
                if (data) {
                    window.Capacitor.Plugins.Console.log('Data: ' + this.safeStringify(data));
                }
            } catch (e) {
                console.warn('Failed to log to native console:', e);
            }
        }
    }

    /**
     * Log info messages
     */
    info(message, data = null) {
        this.debugLog(message, data, 'info');
    }

    /**
     * Log warning messages
     */
    warn(message, data = null) {
        this.debugLog(message, data, 'warn');
    }

    /**
     * Log error messages
     */
    error(message, data = null) {
        this.debugLog(message, data, 'error');
    }

    /**
     * Log debug messages
     */
    debug(message, data = null) {
        this.debugLog(message, data, 'debug');
    }

    /**
     * Safe JSON stringify with circular reference handling
     */
    safeStringify(obj, maxDepth = 3) {
        const seen = new WeakSet();
        
        const replacer = (key, value, depth = 0) => {
            if (depth > maxDepth) return '[Max Depth Reached]';
            if (value === null) return null;
            if (typeof value !== 'object') return value;
            if (seen.has(value)) return '[Circular Reference]';
            
            seen.add(value);
            
            if (value instanceof Error) {
                return {
                    name: value.name,
                    message: value.message,
                    stack: value.stack
                };
            }
            
            return value;
        };
        
        try {
            return JSON.stringify(obj, replacer, 2);
        } catch (e) {
            return `[Stringify Error: ${e.message}]`;
        }
    }

    /**
     * Log environment and capability information
     */
    logEnvironmentInfo() {
        this.info('Environment Information:', {
            isCapacitor: this.isCapacitor,
            isNative: this.isNative,
            platform: this.platform,
            userAgent: navigator.userAgent,
            location: {
                protocol: window.location.protocol,
                host: window.location.host,
                pathname: window.location.pathname
            },
            isSecureContext: window.isSecureContext,
            mediaDevicesSupported: !!navigator.mediaDevices,
            getUserMediaSupported: !!navigator.mediaDevices?.getUserMedia,
            webkitGetUserMedia: !!navigator.webkitGetUserMedia,
            mozGetUserMedia: !!navigator.mozGetUserMedia,
            audioContextSupported: !!(window.AudioContext || window.webkitAudioContext),
            webSocketSupported: !!window.WebSocket,
            socketIOAvailable: typeof io !== 'undefined'
        });
    }

    /**
     * Diagnose media devices capabilities
     */
    diagnoseMediaDevices() {
        this.info('Media Devices Diagnosis:', {
            navigator: !!navigator,
            mediaDevices: !!navigator.mediaDevices,
            getUserMedia: !!navigator?.mediaDevices?.getUserMedia,
            webkitGetUserMedia: !!navigator.webkitGetUserMedia,
            mozGetUserMedia: !!navigator.mozGetUserMedia,
            isSecureContext: window.isSecureContext,
            protocol: window.location.protocol,
            capacitorPlatform: this.platform,
            supportedConstraints: navigator.mediaDevices?.getSupportedConstraints ? 
                navigator.mediaDevices.getSupportedConstraints() : 'Not available'
        });

        // Test if we can enumerate devices
        if (navigator.mediaDevices?.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    const audioInputs = devices.filter(device => device.kind === 'audioinput');
                    this.info('Available Audio Input Devices:', {
                        totalDevices: devices.length,
                        audioInputDevices: audioInputs.length,
                        devices: audioInputs.map(device => ({
                            deviceId: device.deviceId,
                            label: device.label || 'Unknown Device',
                            groupId: device.groupId
                        }))
                    });
                })
                .catch(error => {
                    this.error('Failed to enumerate devices:', error);
                });
        }
    }

    /**
     * Initialize global error handlers
     */
    initializeErrorHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.error('Global Error Caught:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error ? {
                    name: event.error.name,
                    message: event.error.message,
                    stack: event.error.stack
                } : null
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled Promise Rejection:', {
                reason: event.reason,
                promise: event.promise,
                stack: event.reason?.stack
            });
        });

        // Capacitor-specific error handling
        if (this.isCapacitor) {
            document.addEventListener('deviceready', () => {
                this.info('Capacitor device ready event fired');
            });

            // Listen for Capacitor plugin errors
            if (window.Capacitor?.Plugins) {
                this.info('Available Capacitor Plugins:', Object.keys(window.Capacitor.Plugins));
            }
        }
    }

    /**
     * Test microphone access with detailed logging
     */
    async testMicrophoneAccess() {
        this.info('Testing microphone access...');
        
        try {
            // First check if getUserMedia is available
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('getUserMedia not supported in this environment');
            }

            this.info('Requesting microphone permission...');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.info('Microphone access granted successfully:', {
                streamId: stream.id,
                active: stream.active,
                audioTracks: stream.getAudioTracks().map(track => ({
                    id: track.id,
                    kind: track.kind,
                    label: track.label,
                    enabled: track.enabled,
                    muted: track.muted,
                    readyState: track.readyState,
                    settings: track.getSettings ? track.getSettings() : 'Not available',
                    capabilities: track.getCapabilities ? track.getCapabilities() : 'Not available'
                }))
            });

            // Clean up the test stream
            stream.getTracks().forEach(track => track.stop());
            
            return true;
        } catch (error) {
            this.error('Microphone access failed:', {
                name: error.name,
                message: error.message,
                constraint: error.constraint,
                stack: error.stack
            });
            
            // Provide specific guidance based on error type
            if (error.name === 'NotAllowedError') {
                this.error('Permission denied - user needs to grant microphone access');
            } else if (error.name === 'NotFoundError') {
                this.error('No microphone device found');
            } else if (error.name === 'NotSupportedError') {
                this.error('getUserMedia not supported in this context');
            } else if (error.name === 'SecurityError') {
                this.error('Security error - check if running in secure context (HTTPS)');
            }
            
            return false;
        }
    }

    /**
     * Log audio context information
     */
    logAudioContextInfo(audioContext) {
        if (!audioContext) {
            this.warn('No audio context provided to logAudioContextInfo');
            return;
        }

        try {
            this.info('Audio Context Information:', {
                state: audioContext.state,
                sampleRate: audioContext.sampleRate,
                currentTime: audioContext.currentTime,
                baseLatency: audioContext.baseLatency || 'Not available',
                outputLatency: audioContext.outputLatency || 'Not available',
                destination: audioContext.destination ? {
                    channelCount: audioContext.destination.channelCount,
                    channelCountMode: audioContext.destination.channelCountMode,
                    channelInterpretation: audioContext.destination.channelInterpretation,
                    maxChannelCount: audioContext.destination.maxChannelCount
                } : 'Not available'
            });
        } catch (error) {
            this.error('Error logging audio context info:', error);
        }
    }

    /**
     * Monitor WebSocket connection with detailed logging
     */
    monitorWebSocket(socket) {
        if (!socket) {
            this.warn('No socket provided for monitoring');
            return;
        }

        this.info('Monitoring WebSocket connection...');

        socket.on('connect', () => {
            this.info('WebSocket connected successfully:', {
                id: socket.id,
                connected: socket.connected,
                disconnected: socket.disconnected
            });
        });

        socket.on('disconnect', (reason) => {
            this.warn('WebSocket disconnected:', {
                reason: reason,
                id: socket.id,
                connected: socket.connected
            });
        });

        socket.on('connect_error', (error) => {
            this.error('WebSocket connection error:', {
                message: error.message,
                description: error.description,
                context: error.context,
                type: error.type
            });
        });

        socket.on('error', (error) => {
            this.error('WebSocket error:', error);
        });

        // Log all socket events for debugging
        const originalEmit = socket.emit;
        socket.emit = function(...args) {
            if (args[0] !== 'audioInput') { // Don't log audio data
                logger.debug('Socket emit:', { event: args[0], data: args.slice(1) });
            }
            return originalEmit.apply(this, args);
        };
    }
}

// Create global logger instance
export const logger = new Logger();

// Make logger available globally for debugging
if (typeof window !== 'undefined') {
    window.logger = logger;
}
