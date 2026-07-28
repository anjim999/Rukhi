import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, Upload, Mic, X, Loader2, Sparkles, CheckCircle2, Play, Pause, AlertCircle } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const LANGUAGES = [
  { code: 'tenglish', label: 'Tenglish (Telugu + English)', flag: '🇮🇳' },
  { code: 'te', label: 'Pure Telugu (తెలుగు)', flag: '🇮🇳' },
  { code: 'hinglish', label: 'Hinglish (Hindi + English)', flag: '🇮🇳' },
  { code: 'hintel', label: 'Hin-Tel (Hindi + Telugu)', flag: '🇮🇳' },
  { code: 'en-IN', label: 'Indian English', flag: '🇮🇳' },
  { code: 'en', label: 'Pure English (US)', flag: '🇺🇸' },
  { code: 'hi', label: 'Pure Hindi (हिंदी)', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil (தமிழ்)', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada (కన్నడ)', flag: '🇮🇳' },
];

export default function VoiceCloningModal({ isOpen, onClose }) {
  const [sampleFile, setSampleFile] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('te');
  const [promptText, setPromptText] = useState('');
  const [voiceName, setVoiceName] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [resultAudioUrl, setResultAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElem, setAudioElem] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSampleFile(file);
      setError(null);
    }
  };

  const handleCloneVoice = async (e) => {
    e.preventDefault();
    if (!sampleFile) {
      setError('Please upload a 1-2 minute voice sample WAV or MP3 file.');
      return;
    }
    if (!promptText.trim()) {
      setError('Please enter the text script you want your cloned voice to speak.');
      return;
    }

    try {
      setIsCloning(true);
      setError(null);

      // First upload the 1-2 min voice sample to server to get speakerWavPath
      const formData = new FormData();
      formData.append('audio', sampleFile);
      formData.append('targetLanguage', targetLanguage);

      const uploadRes = await axiosClient.post('/dubbing/transcribe-speech', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const speakerWavPath = uploadRes.data?.audioUrl || (uploadRes.data?.fileName ? `/uploads/${uploadRes.data.fileName}` : null);

      // Synthesize speech in target language using XTTS v2 Cross-Lingual Voice Cloning Engine
      const cloneRes = await axiosClient.post('/dubbing/generate', {
        text: promptText.trim(),
        targetLanguage,
        provider: 'xtts',
        speakerWavPath,
      });

      if (cloneRes.data?.success && cloneRes.data?.audioUrl) {
        setResultAudioUrl(cloneRes.data.audioUrl);
      } else {
        setError(cloneRes.data?.error || 'Voice cloning speech synthesis failed.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Voice cloning failed. Please check voice sample quality.');
    } finally {
      setIsCloning(false);
    }
  };

  const togglePlayAudio = () => {
    if (!resultAudioUrl) return;
    if (audioElem) {
      if (isPlaying) {
        audioElem.pause();
        setIsPlaying(false);
      } else {
        audioElem.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(resultAudioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioElem(audio);
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    setSampleFile(null);
    setPromptText('');
    setVoiceName('');
    setResultAudioUrl(null);
    setError(null);
    if (audioElem) {
      audioElem.pause();
      setAudioElem(null);
    }
    setIsPlaying(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center min-h-screen">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col my-auto">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">1-2 Min AI Voice Cloning Studio</h3>
              <p className="text-xs text-slate-400">Clone your voice from a 1-2 min sample & speak any prompt</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCloneVoice} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resultAudioUrl ? (
            <div className="space-y-5 text-center py-4">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-white">Voice Cloned Successfully!</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Your cloned voice model synthesized speech for your custom script with identical tone & cadence.
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-black" />}
                  <span>{isPlaying ? 'Pause Speech' : 'Listen Cloned Audio'}</span>
                </button>
                <a
                  href={resultAudioUrl}
                  download="cloned_voice.wav"
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs border border-slate-700 transition"
                >
                  Download WAV
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Upload 1-2 min sample */}
              <div>
                <label className="block text-xs font-extrabold text-amber-400 uppercase tracking-wider mb-2">
                  Step 1: Upload 1-2 Min Voice Sample (WAV / MP3 / M4A)
                </label>
                <label className="block border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-slate-950/50">
                  <Mic className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                  <span className="block text-xs font-bold text-white mb-1">
                    {sampleFile ? sampleFile.name : 'Click to Upload 1-2 Min Voice Audio Sample'}
                  </span>
                  <span className="block text-[11px] text-amber-400 font-semibold">
                    Upload voice sample in Telugu (తెలుగు), English, or Hindi
                  </span>
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Step 2: Target Output Language */}
              <div>
                <label className="block text-xs font-extrabold text-amber-400 uppercase tracking-wider mb-2">
                  Step 2: Select Target Output Language
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setTargetLanguage(lang.code)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        targetLanguage === lang.code
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Script Text */}
              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1.5">
                  Step 3: Script Prompt (AI Speaks in Cloned Voice in {LANGUAGES.find(l => l.code === targetLanguage)?.label})
                </label>
                <textarea
                  rows={4}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Enter the exact script you want your cloned voice to speak..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl p-4 text-xs text-white font-medium focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!sampleFile || !promptText.trim() || isCloning}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCloning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cloning Voice & Synthesizing Speech...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-black" />
                    <span>Clone Voice & Synthesize Audio Now</span>
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}
