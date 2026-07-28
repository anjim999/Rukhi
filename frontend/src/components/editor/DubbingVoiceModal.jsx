import React, { useState, useEffect, useRef } from 'react';
import { getAvailableEngines, generateDubbedAudio, transcribeVoiceAudio } from '../../services/dubbingService';
import { getFullMediaUrl } from '../../services/projectService';

const LANGUAGES = [
  { code: 'te', label: 'Telugu (తెలుగు)', flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi (हिंदी)', flag: '🇮🇳' },
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
  { code: 'en-IN', label: 'Indian English', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil (தமிழ்)', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada (కన్నడ)', flag: '🇮🇳' },
];

export default function DubbingVoiceModal({ isOpen, onClose, initialText = '', projectId, onApplyAudio }) {
  const [targetLanguage, setTargetLanguage] = useState('te');
  const [selectedEngine, setSelectedEngine] = useState('edge');
  const [scriptText, setScriptText] = useState(initialText);
  const [engines, setEngines] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioResultUrl, setAudioResultUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Mic Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (initialText) {
      setScriptText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (isOpen) {
      getAvailableEngines()
        .then((res) => {
          if (res?.success && res.engines) {
            setEngines(res.engines);
          }
        })
        .catch((err) => console.warn('Failed to load engines:', err));
    } else {
      stopAndCleanupRecording();
    }
  }, [isOpen]);

  const stopAndCleanupRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingSeconds(0);
  };

  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);
      setStatusMessage('🎙️ Recording spoken audio... Speak in any language!');

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setStatusMessage(`❌ Microphone access error: ${err.message}`);
    }
  };

  const pauseMicRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
      setStatusMessage('⏸️ Recording paused. Take your time, click Resume when ready.');
    }
  };

  const resumeMicRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      setStatusMessage('🎙️ Recording resumed...');
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopAndTranscribeMicRecording = () => {
    console.log('[MIC RECORDING] ⏹️ "Done & Transcribe" clicked. MediaRecorder state:', mediaRecorderRef.current?.state);

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      console.warn('[MIC RECORDING] MediaRecorder is not active or already stopped.');
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      console.log('[MIC RECORDING] 🛑 MediaRecorder stopped. Audio chunks count:', audioChunksRef.current.length);
      const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      console.log(`[MIC RECORDING] 📦 Created Audio Blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

      // Stop all active mic tracks
      if (recorder.stream) {
        recorder.stream.getTracks().forEach((t) => {
          t.stop();
          console.log('[MIC RECORDING] 🔇 Stopped track:', t.label);
        });
      }

      setIsRecording(false);
      setIsPaused(false);

      if (audioBlob.size === 0) {
        setStatusMessage('⚠️ Recorded audio is empty. Please speak again.');
        console.warn('[MIC RECORDING] Audio blob size is 0!');
        return;
      }

      setIsTranscribing(true);
      setStatusMessage('✨ Transcribing audio & autocorrecting grammar via Gemini 2.5 Flash ($0 Cost)...');

      try {
        console.log('[MIC RECORDING] 🚀 Sending audio blob to /api/dubbing/transcribe-speech...');
        const res = await transcribeVoiceAudio(audioBlob, targetLanguage);
        console.log('[MIC RECORDING] 📥 Received transcription response:', res);

        if (res?.success && res.script) {
          setScriptText(res.script);
          setStatusMessage('✅ Voice transcribed & autocorrected perfectly! Review script below.');
        } else {
          setStatusMessage('⚠️ Transcription completed but empty script returned. Please review.');
        }
      } catch (err) {
        console.error('[MIC RECORDING ERROR]', err);
        setStatusMessage(`❌ Transcription error: ${err?.response?.data?.error || err.message}`);
      } finally {
        setIsTranscribing(false);
      }
    };

    // If recorder is paused, resume to flush final chunks
    if (recorder.state === 'paused') {
      console.log('[MIC RECORDING] Recorder was paused. Resuming before stop to flush chunks...');
      try {
        recorder.resume();
      } catch (e) {
        console.warn('[MIC RECORDING] Resume failed:', e.message);
      }
    }

    try {
      if (typeof recorder.requestData === 'function') {
        recorder.requestData();
      }
      recorder.stop();
    } catch (err) {
      console.error('[MIC RECORDING ERROR] Failed to stop MediaRecorder:', err);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const handleGenerateAudio = async () => {
    if (!scriptText.trim()) {
      setStatusMessage('⚠️ Please enter or speak a text script to synthesize audio.');
      return;
    }

    setIsGenerating(true);
    setStatusMessage('🎙️ Synthesizing voiceover audio with chosen engine...');
    setAudioResultUrl('');
    setIsPlaying(false);

    try {
      const res = await generateDubbedAudio({
        text: scriptText,
        targetLanguage,
        provider: selectedEngine,
        projectId,
      });

      if (res?.success && res.audioUrl) {
        const fullUrl = getFullMediaUrl(res.audioUrl);
        setAudioResultUrl(fullUrl);
        setStatusMessage('✅ Voiceover audio synthesized successfully!');
      } else {
        setStatusMessage('❌ Audio generation failed. Please try another provider.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage(`❌ Error: ${err?.response?.data?.error || err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayPreview = () => {
    if (!audioResultUrl) return;

    if (!audioElement) {
      const audio = new Audio(audioResultUrl);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  const handleApplyToTimeline = () => {
    if (audioResultUrl && onApplyAudio) {
      onApplyAudio({
        audioUrl: audioResultUrl,
        language: targetLanguage,
        provider: selectedEngine,
        scriptText,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-xl">🎙️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">AI Voice Studio & Multi-Lingual Dubbing</h2>
              <p className="text-xs text-slate-400">Speak or type in any language • Zero-cost neural voice dubbing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Language Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Target Output Language
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setTargetLanguage(lang.code)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all ${
                    targetLanguage === lang.code
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-500/10 scale-[1.02]'
                      : 'bg-slate-850 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xl mb-1">{lang.flag}</span>
                  <span className="truncate w-full text-center">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Engine Selection Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              2. Select Voice Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {engines.map((engine) => (
                <div
                  key={engine.id}
                  onClick={() => setSelectedEngine(engine.id)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all relative overflow-hidden ${
                    selectedEngine === engine.id
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                      : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      {engine.name}
                    </h3>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                      {engine.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{engine.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {engine.features?.map((feat, idx) => (
                      <span key={idx} className="text-[9px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mic Recording Voice Toolbar & Text Prompt Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                3. Voice Script Input (Speak or Type)
              </label>
              <span className="text-[10px] text-indigo-400 font-semibold">✨ Gemini 2.5 Flash Autocorrect Active</span>
            </div>

            {/* Mic Voice Input Recording Bar */}
            <div className="mb-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={startMicRecording}
                    disabled={isTranscribing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-red-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <span>🎙️</span> Speak Script (Mic)
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Pause / Resume Button */}
                    {!isPaused ? (
                      <button
                        onClick={pauseMicRecording}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <span>⏸️</span> Pause Take
                      </button>
                    ) : (
                      <button
                        onClick={resumeMicRecording}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <span>▶️</span> Resume Take
                      </button>
                    )}

                    {/* Finish & Transcribe Button */}
                    <button
                      onClick={stopAndTranscribeMicRecording}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                    >
                      <span>✨</span> Done & Transcribe
                    </button>
                  </div>
                )}

                {/* Timer & Status Badge */}
                {isRecording && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800">
                    <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse'}`} />
                    <span className="text-xs font-mono font-bold text-white">{formatTimer(recordingSeconds)}</span>
                    <span className="text-[10px] text-slate-400">{isPaused ? '(Paused)' : '(Recording)'}</span>
                  </div>
                )}

                {isTranscribing && (
                  <div className="flex items-center gap-2 text-xs text-indigo-300">
                    <span className="animate-spin">⏳</span> AI Autocorrecting Speech...
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400">
                Multi-take pauses supported • Auto-fixes spelling & grammar
              </span>
            </div>

            {/* Editable Text Area */}
            <textarea
              rows={3}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Speak via Mic above or type script manually in any language..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 flex items-center gap-2">
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Audio Preview Component */}
          {audioResultUrl && (
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPreview}
                  className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-all"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <div>
                  <h4 className="text-xs font-semibold text-white">Audio Preview Generated</h4>
                  <p className="text-[10px] text-indigo-300">Click to listen before adding to timeline</p>
                </div>
              </div>
              <button
                onClick={handleApplyToTimeline}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-md shadow-emerald-500/20 transition-all"
              >
                ✨ Apply to Timeline
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateAudio}
            disabled={isGenerating || !scriptText.trim()}
            className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50 shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin text-sm">⏳</span> Synthesizing Audio...
              </>
            ) : (
              <>
                <span>⚡</span> Generate Audio
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
