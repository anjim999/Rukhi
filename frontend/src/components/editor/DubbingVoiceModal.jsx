import React, { useState, useEffect, useRef } from 'react';
import { getAvailableEngines, generateDubbedAudio, transcribeVoiceAudio } from '../../services/dubbingService';
import { getFullMediaUrl } from '../../services/projectService';
import DubbingLanguageSelector from './DubbingLanguageSelector';
import DubbingRecorderSection from './DubbingRecorderSection';
import DubbingEngineSelector from './DubbingEngineSelector';
import DubbingResultPreview from './DubbingResultPreview';

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
          <DubbingLanguageSelector
            targetLanguage={targetLanguage}
            setTargetLanguage={setTargetLanguage}
          />

          <DubbingEngineSelector
            engines={engines}
            selectedEngine={selectedEngine}
            setSelectedEngine={setSelectedEngine}
          />

          <DubbingRecorderSection
            isRecording={isRecording}
            isPaused={isPaused}
            isTranscribing={isTranscribing}
            startMicRecording={startMicRecording}
            pauseMicRecording={pauseMicRecording}
            resumeMicRecording={resumeMicRecording}
            stopAndTranscribeMicRecording={stopAndTranscribeMicRecording}
            recordingSeconds={recordingSeconds}
            formatTimer={formatTimer}
            scriptText={scriptText}
            setScriptText={setScriptText}
          />

          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 flex items-center gap-2">
              <span>{statusMessage}</span>
            </div>
          )}

          <DubbingResultPreview
            audioResultUrl={audioResultUrl}
            isPlaying={isPlaying}
            togglePlayPreview={togglePlayPreview}
            handleApplyToTimeline={handleApplyToTimeline}
          />
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
