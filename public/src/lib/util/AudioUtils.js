import { logger } from './Logger.js';

/**
 * Enhanced audio utilities for Capacitor iOS with better error handling
 */
export class AudioUtils {
    constructor() {
        this.isCapacitor = !!window.Capacitor;
        this.isNative = window.Capacitor?.isNativePlatform();
        this.platform = window.Capacitor?.getPlatform();
        this.TARGET_SAMPLE_RATE = 16000;
        this.isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    }

    /**
     * Initialize audio with comprehensive error handling and logging
     */
    async initializeAudio() {
        logger.info('Initializing audio system...');
        
        try {
            // First, diagnose the environment
            logger.diagnoseMediaDevices();
            
            // Check if we're in a secure context
            if (!window.isSecureContext) {
                logger.warn('Not in secure context - getUserMedia may not work properly');
            }

            // Test microphone access
            const microphoneAvailable = await logger.testMicrophoneAccess();
            if (!microphoneAvailable) {
                throw new Error('Microphone access test failed');
            }

            // Request microphone access with enhanced constraints
            logger.info('Requesting microphone stream with enhanced constraints...');
            
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    // Add iOS-specific constraints
                    sampleRate: this.TARGET_SAMPLE_RATE,
                    channelCount: 1,
                    latency: 0.01 // Request low latency
                }
            });

            logger.info('Audio stream obtained successfully');

            // Create audio context with appropriate settings
            let audioContext;
            if (this.isFirefox) {
                // Firefox doesn't allow different sample rates
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                logger.info('Created Firefox-compatible AudioContext');
            } else {
                audioContext = new (window.AudioContext || window.webkitAudioContext)({
                    sampleRate: this.TARGET_SAMPLE_RATE,
                    latencyHint: 'interactive'
                });
                logger.info('Created AudioContext with target sample rate');
            }

            // Log audio context details
            logger.logAudioContextInfo(audioContext);

            // Calculate sampling ratio
            const samplingRatio = audioContext.sampleRate / this.TARGET_SAMPLE_RATE;
            logger.info('Audio configuration:', {
                contextSampleRate: audioContext.sampleRate,
                targetSampleRate: this.TARGET_SAMPLE_RATE,
                samplingRatio: samplingRatio,
                isFirefox: this.isFirefox
            });

            return {
                audioStream,
                audioContext,
                samplingRatio
            };

        } catch (error) {
            logger.error('Failed to initialize audio:', error);
            
            // Provide specific guidance based on error
            if (error.name === 'NotAllowedError') {
                throw new Error('Microphone permission denied. Please allow microphone access and try again.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No microphone found. Please connect a microphone and try again.');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('Audio recording not supported in this browser/environment.');
            } else if (error.name === 'SecurityError') {
                throw new Error('Security error. Please ensure the app is running in a secure context (HTTPS).');
            } else {
                throw new Error(`Audio initialization failed: ${error.message}`);
            }
        }
    }

    /**
     * Create audio processor with enhanced error handling
     */
    createAudioProcessor(audioContext, audioStream, samplingRatio, onAudioData) {
        logger.info('Creating audio processor...');
        
        if (!audioContext) {
            throw new Error('Audio context is required but was not provided');
        }
        
        if (!audioStream) {
            throw new Error('Audio stream is required but was not provided');
        }
        
        if (typeof onAudioData !== 'function') {
            throw new Error('onAudioData callback is required but was not provided');
        }
        
        try {
            const sourceNode = audioContext.createMediaStreamSource(audioStream);
            
            // Use ScriptProcessorNode with appropriate buffer size
            const bufferSize = 512; // Small buffer for low latency
            const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

            processor.onaudioprocess = (e) => {
                try {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const numSamples = Math.round(inputData.length / samplingRatio);
                    const pcmData = this.isFirefox ? 
                        new Int16Array(numSamples) : 
                        new Int16Array(inputData.length);

                    // Convert to 16-bit PCM with proper handling
                    if (this.isFirefox) {
                        // Firefox downsampling
                        for (let i = 0; i < numSamples; i++) {
                            const sampleIndex = Math.floor(i * samplingRatio);
                            pcmData[i] = Math.max(-1, Math.min(1, inputData[sampleIndex])) * 0x7FFF;
                        }
                    } else {
                        // Direct conversion for other browsers
                        for (let i = 0; i < inputData.length; i++) {
                            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                        }
                    }

                    // Convert to base64 for transmission
                    const base64Data = this.arrayBufferToBase64(pcmData.buffer);
                    onAudioData(base64Data);

                } catch (error) {
                    logger.error('Error in audio processing:', error);
                }
            };

            // Connect the audio graph
            sourceNode.connect(processor);
            processor.connect(audioContext.destination);

            logger.info('Audio processor created and connected successfully');

            return {
                sourceNode,
                processor,
                cleanup: () => {
                    try {
                        if (processor) {
                            processor.disconnect();
                        }
                        if (sourceNode) {
                            sourceNode.disconnect();
                        }
                        logger.info('Audio processor cleaned up');
                    } catch (error) {
                        logger.warn('Error during audio processor cleanup:', error);
                    }
                }
            };

        } catch (error) {
            logger.error('Failed to create audio processor:', error);
            throw error;
        }
    }

    /**
     * Convert ArrayBuffer to base64 string with error handling
     */
    arrayBufferToBase64(buffer) {
        try {
            const binary = [];
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary.push(String.fromCharCode(bytes[i]));
            }
            return btoa(binary.join(''));
        } catch (error) {
            logger.error('Error converting ArrayBuffer to base64:', error);
            throw error;
        }
    }

    /**
     * Convert base64 to Float32Array with error handling
     */
    base64ToFloat32Array(base64String) {
        try {
            const binaryString = window.atob(base64String);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const int16Array = new Int16Array(bytes.buffer);
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
                float32Array[i] = int16Array[i] / 32768.0;
            }

            return float32Array;
        } catch (error) {
            logger.error('Error converting base64 to Float32Array:', error);
            throw error;
        }
    }

    /**
     * Check audio permissions status
     */
    async checkAudioPermissions() {
        logger.info('Checking audio permissions...');
        
        try {
            if (navigator.permissions && navigator.permissions.query) {
                const permission = await navigator.permissions.query({ name: 'microphone' });
                logger.info('Microphone permission status:', permission.state);
                return permission.state;
            } else {
                logger.warn('Permissions API not available');
                return 'unknown';
            }
        } catch (error) {
            logger.warn('Failed to check audio permissions:', error);
            return 'unknown';
        }
    }

    /**
     * Resume audio context if suspended (common on mobile)
     */
    async resumeAudioContext(audioContext) {
        if (!audioContext) {
            logger.warn('Audio context is null or undefined, skipping resume');
            return;
        }
        
        if (audioContext.state === 'suspended') {
            logger.info('Audio context is suspended, attempting to resume...');
            try {
                await audioContext.resume();
                logger.info('Audio context resumed successfully');
            } catch (error) {
                logger.error('Failed to resume audio context:', error);
                throw error;
            }
        } else {
            logger.debug(`Audio context state is: ${audioContext.state}`);
        }
    }

    /**
     * Get detailed audio device information
     */
    async getAudioDeviceInfo() {
        try {
            if (!navigator.mediaDevices?.enumerateDevices) {
                logger.warn('Device enumeration not supported');
                return null;
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            
            logger.info('Audio input devices found:', audioInputs.length);
            
            return audioInputs.map(device => ({
                deviceId: device.deviceId,
                label: device.label || 'Unknown Microphone',
                groupId: device.groupId
            }));
        } catch (error) {
            logger.error('Failed to get audio device info:', error);
            return null;
        }
    }

    /**
     * Test audio recording capability
     */
    async testAudioRecording(duration = 1000) {
        logger.info(`Testing audio recording for ${duration}ms...`);
        
        try {
            const { audioStream, audioContext } = await this.initializeAudio();
            
            // Record for specified duration
            await new Promise(resolve => setTimeout(resolve, duration));
            
            // Clean up
            audioStream.getTracks().forEach(track => track.stop());
            await audioContext.close();
            
            logger.info('Audio recording test completed successfully');
            return true;
        } catch (error) {
            logger.error('Audio recording test failed:', error);
            return false;
        }
    }
}

// Create global instance
export const audioUtils = new AudioUtils();
