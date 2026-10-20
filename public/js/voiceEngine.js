// High-Performance Interactive Voice Engine
// Handles: Speech Recognition, Speech Synthesis, Web Audio Analysis, and 2-Way Audio Recording

class VoiceEngine {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.currentLanguage = 'en-US'; // 'en-US', 'hi-IN', 'te-IN'
    this.isListening = false;
    this.isSpeaking = false;
    this.isMuted = false;
    this.isSpeakerMuted = false;

    // Web Audio & Recording
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.audioBlob = null;
    this.audioUrl = null;

    // Callbacks
    this.onUserSpeech = null;        // (finalText) => {}
    this.onInterimSpeech = null;     // (interimText) => {}
    this.onBotSpeechStart = null;    // () => {}
    this.onBotSpeechEnd = null;      // () => {}
    this.onStatusChange = null;      // (statusText) => {}
    this.onError = null;             // (err) => {}
    this.onAudioLevel = null;        // (level 0-100) => {}

    this.callActive = false;
    this.availableVoices = [];
    this.initVoices();
  }

  initVoices() {
    if (!this.synthesis) return;
    const update = () => {
      this.availableVoices = this.synthesis.getVoices();
    };
    update();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = update;
    }
  }

  setLanguage(langCode) {
    // Map friendly names to BCP-47 codes
    const map = {
      'English': 'en-IN',
      'Hindi': 'hi-IN',
      'Telugu': 'te-IN',
      'en': 'en-IN',
      'hi': 'hi-IN',
      'te': 'te-IN'
    };
    this.currentLanguage = map[langCode] || langCode || 'en-IN';
    if (this.recognition) {
      this.recognition.lang = this.currentLanguage;
    }
  }

  // Get best matching voice for current language
  getVoiceForLanguage(langCode) {
    if (!this.availableVoices || this.availableVoices.length === 0) {
      this.availableVoices = this.synthesis.getVoices();
    }
    const langPrefix = (langCode || this.currentLanguage).split('-')[0].toLowerCase();

    // Specific matching
    let voice = this.availableVoices.find(v => v.lang.toLowerCase() === this.currentLanguage.toLowerCase());
    if (!voice) {
      voice = this.availableVoices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
    }
    // Fallback for Telugu or Hindi if specific not installed
    if (!voice && (langPrefix === 'te' || langPrefix === 'hi')) {
      voice = this.availableVoices.find(v => v.lang.includes('IN') || v.name.includes('India'));
    }
    if (!voice && this.availableVoices.length > 0) {
      voice = this.availableVoices[0];
    }
    return voice;
  }

  // Initialize Microphone & Web Audio recording
  async initAudioStream() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Setup Web Audio Analyser
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // Setup MediaRecorder
      this.recordedChunks = [];
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      }
      this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(250); // Slice every 250ms
      return true;
    } catch (err) {
      console.warn('Microphone stream access error:', err);
      if (this.onError) {
        this.onError('Microphone access denied or not available. Interactive simulation mode is active.');
      }
      return false;
    }
  }

  // Initialize Speech Recognition
  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.currentLanguage;
    this.recognition.maxAlternatives = 1;

    let finalTranscript = '';

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStatusChange) this.onStatusChange('Listening...');
    };

    this.recognition.onresult = (event) => {
      if (this.isMuted) return;

      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (interim && this.onInterimSpeech) {
        this.onInterimSpeech(interim);
      }

      // If user starts speaking while bot is talking, cancel bot speech immediately (interruption)
      if ((interim.length > 2 || finalTranscript.length > 2) && this.isSpeaking) {
        this.interruptSpeech();
      }

      if (finalTranscript.trim().length > 0) {
        const text = finalTranscript.trim();
        finalTranscript = '';
        if (this.onUserSpeech) {
          this.onUserSpeech(text);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        if (this.onError) this.onError('Microphone permission blocked. Please allow mic access in your browser.');
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Auto restart if call is still active and bot is not talking
      if (this.callActive && !this.isSpeaking) {
        try {
          this.recognition.start();
        } catch (e) {
          // ignore already started error
        }
      }
    };

    return true;
  }

  // Start Voice Session
  async startSession() {
    this.callActive = true;
    this.audioBlob = null;
    this.audioUrl = null;

    // Init Mic & Recorder
    await this.initAudioStream();

    // Init Speech Recognition
    const hasRecognition = this.initRecognition();
    if (hasRecognition && this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  }

  // Stop Voice Session & finalize recording
  async stopSession() {
    this.callActive = false;
    this.interruptSpeech();

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    let recordingPromise = Promise.resolve(null);

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      recordingPromise = new Promise((resolve) => {
        this.mediaRecorder.onstop = () => {
          const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
          this.audioBlob = new Blob(this.recordedChunks, { type: mimeType });
          this.audioUrl = URL.createObjectURL(this.audioBlob);
          resolve({ blob: this.audioBlob, url: this.audioUrl });
        };
        this.mediaRecorder.stop();
      });
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }

    const recordingResult = await recordingPromise;
    return recordingResult;
  }

  // Bot Speaks
  speak(text) {
    return new Promise((resolve) => {
      if (!text || !this.synthesis || this.isSpeakerMuted) {
        resolve();
        return;
      }

      this.interruptSpeech();

      // Temporarily pause recognition to prevent bot hearing itself
      if (this.recognition && this.isListening) {
        try {
          this.recognition.stop();
        } catch (e) {}
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.currentLanguage;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voice = this.getVoiceForLanguage(this.currentLanguage);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (this.onBotSpeechStart) this.onBotSpeechStart();
        if (this.onStatusChange) this.onStatusChange('Bot Speaking...');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (this.onBotSpeechEnd) this.onBotSpeechEnd();
        if (this.callActive) {
          if (this.onStatusChange) this.onStatusChange('Listening to Customer...');
          // Resume recognition
          if (this.recognition) {
            try {
              this.recognition.start();
            } catch (e) {}
          }
        }
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        this.isSpeaking = false;
        if (this.onBotSpeechEnd) this.onBotSpeechEnd();
        if (this.callActive && this.recognition) {
          try {
            this.recognition.start();
          } catch (err) {}
        }
        resolve();
      };

      this.synthesis.speak(utterance);
    });
  }

  // Interrupt bot when user speaks
  interruptSpeech() {
    if (this.synthesis && (this.synthesis.speaking || this.synthesis.pending)) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      if (this.onBotSpeechEnd) this.onBotSpeechEnd();
    }
  }

  // Mute / Unmute Mic
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMuted;
      });
    }
    return this.isMuted;
  }

  // Toggle Speaker
  toggleSpeaker() {
    this.isSpeakerMuted = !this.isSpeakerMuted;
    if (this.isSpeakerMuted) {
      this.interruptSpeech();
    }
    return this.isSpeakerMuted;
  }

  // Get frequency data for visualizer canvas
  getVisualizerData() {
    if (!this.analyser) {
      // Simulate synthetic audio levels if bot is speaking or simulated voice
      if (this.isSpeaking) {
        const dummy = new Uint8Array(32);
        for (let i = 0; i < dummy.length; i++) {
          dummy[i] = Math.floor(Math.random() * 180) + 40;
        }
        return dummy;
      }
      return null;
    }
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

// Global instance
window.voiceEngine = new VoiceEngine();
