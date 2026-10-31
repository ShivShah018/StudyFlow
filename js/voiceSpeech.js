const VoiceSpeech = (() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;
  let currentUtterance = null;
  let voiceResponsesEnabled = true;

  function init() {
    try {
      const savedPref = localStorage.getItem('studyflow_voice_response_enabled');
      if (savedPref !== null) {
        voiceResponsesEnabled = savedPref === 'true';
      }

      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false; // Single-utterance mode for fast command-and-control
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Indian English acoustic model (handles English & Hinglish transliterations)
      }
    } catch (e) {
      console.warn('VoiceSpeech init warning:', e);
    }
  }

  function isSupported() {
    return !!SpeechRecognition;
  }

  function startListening(callbacks = {}) {
    if (!recognition) {
      if (callbacks.onError) callbacks.onError('unsupported', 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    if (isListening) return;

    recognition.onstart = () => {
      isListening = true;
      if (callbacks.onStart) callbacks.onStart();
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript && callbacks.onInterim) {
        callbacks.onInterim(interimTranscript);
      }
      if (finalTranscript && callbacks.onFinal) {
        callbacks.onFinal(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      isListening = false;
      const err = event.error;
      let msg = 'Voice recognition error';
      if (err === 'not-allowed') {
        msg = 'Microphone permission was denied. Please allow microphone access in site settings.';
      } else if (err === 'no-speech') {
        msg = 'No speech was detected. Please try speaking again.';
      } else if (err === 'network') {
        msg = 'Voice recognition requires an internet connection in Chrome/Edge.';
      } else if (err === 'audio-capture') {
        msg = 'No microphone was detected on this device. Please connect a microphone.';
      }
      if (callbacks.onError) callbacks.onError(err, msg);
    };

    recognition.onend = () => {
      isListening = false;
      if (callbacks.onEnd) callbacks.onEnd();
    };

    try {
      isListening = true;
      recognition.start();
    } catch (e) {
      isListening = false;
      if (callbacks.onError) callbacks.onError('start-failed', e.message);
    }
  }

  function stopListening() {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch {}
      isListening = false;
    }
  }

  function speak(text) {
    if (!voiceResponsesEnabled || typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined' || !text) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterances
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';

      // Store in module variable to prevent premature browser garbage collection
      currentUtterance = utterance;
      utterance.onend = () => { currentUtterance = null; };
      utterance.onerror = () => { currentUtterance = null; };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis notice:', e);
    }
  }

  function toggleVoiceResponses() {
    voiceResponsesEnabled = !voiceResponsesEnabled;
    localStorage.setItem('studyflow_voice_response_enabled', String(voiceResponsesEnabled));
    return voiceResponsesEnabled;
  }

  function isVoiceResponsesEnabled() {
    return voiceResponsesEnabled;
  }

  return {
    init,
    isSupported,
    startListening,
    stopListening,
    speak,
    toggleVoiceResponses,
    isVoiceResponsesEnabled
  };
})();
