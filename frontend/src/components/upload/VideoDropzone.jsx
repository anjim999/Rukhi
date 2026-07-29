import React, { useState, useRef } from 'react';
import { UploadCloud, Film, AlertCircle, CheckCircle2, Loader2, Sparkles, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadVideo } from '../../services/projectService';

export default function VideoDropzone({ onProjectCreated }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [targetStyle, setTargetStyle] = useState('auto'); // 'auto' | 'chatting' | 'english' | 'telugu' | 'hindi'
  const [applyEmojis, setApplyEmojis] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    setError(null);
    if (!selectedFile.type.startsWith('video/')) {
      const msg = 'Please upload a valid video file (MP4, MOV, WebM).';
      setError(msg);
      toast.error(msg, { id: 'upload-toast' });
      return;
    }
    const maxBytes = 1024 * 1024 * 1024; // 1 GB
    if (selectedFile.size > maxBytes) {
      const msg = 'Video file size exceeds maximum 1GB limit. Please select a smaller clip.';
      setError(msg);
      toast.error(msg, { id: 'upload-toast' });
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    const targetStyleLabels = {
      english: '🇬🇧 Pure English',
      telugu: '🇮🇳 Pure Telugu',
      hindi: '🇮🇳 Pure Hindi',
      tel_eng: '⚡ Tel + Eng',
      chatting: '💬 Chat Script',
      auto: '🌐 As Spoken',
    };
    const styleLabel = targetStyleLabels[targetStyle];

    setUploading(true);
    setProgress(0);
    setError(null);
    toast.loading(`Uploading video & initializing AI engine (${styleLabel})...`, { id: 'upload-toast' });

    try {
      const response = await uploadVideo(file, file.name, targetStyle, applyEmojis, (percent) => {
        setProgress(percent);
      });

      if (response && response.success && onProjectCreated) {
        toast.success(`🎉 Video uploaded! Processing in ${styleLabel} style.`, { id: 'upload-toast' });
        onProjectCreated(response.data);
      } else {
        const errMsg = response?.error?.message || response?.error || response?.message || 'Video processing failed. Please try again.';
        setError(errMsg);
        toast.error(errMsg, { id: 'upload-toast' });
      }
    } catch (err) {
      const errMsg = err.message || 'Upload failed. Please check network connection and try again.';
      setError(errMsg);
      toast.error(errMsg, { id: 'upload-toast' });
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && !file && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
          isDragging
            ? 'border-yellow-400 bg-yellow-400/10 scale-[1.01]'
            : file
            ? 'border-slate-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 shadow-xl'
            : 'border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-slate-400 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900/80 cursor-pointer shadow-md'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          className="hidden"
          disabled={uploading}
        />

        {!file ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/50 flex items-center justify-center text-yellow-500 shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Drop your video clip here
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Supports MP4, MOV, WebM (Up to 500MB, 9:16 vertical reels recommended)
              </p>
            </div>
            <span className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
              Browse File
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
              <Film className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate max-w-md">
                {file.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            {/* Target Caption Language & Script Style Selector */}
            <div className="w-full max-w-md space-y-2 text-left bg-slate-50 dark:bg-zinc-950/80 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <label className="text-xs font-bold text-slate-800 dark:text-zinc-300 flex items-center justify-between">
                <span>Caption Script & Language Style</span>
                <span className="text-[10px] text-yellow-500 font-normal">AI Powered</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'english', label: '🇬🇧 Pure English', desc: 'Auto-Translated' },
                  { id: 'telugu', label: '🇮🇳 Pure Telugu', desc: 'తెలుగు Native Script' },
                  { id: 'hindi', label: '🇮🇳 Pure Hindi', desc: 'हिंदी Native Script' },
                  { id: 'tel_eng', label: '⚡ Tel + Eng', desc: 'Bilingual Tanglish' },
                  { id: 'hin_eng', label: '⚡ Hin + Eng', desc: 'Bilingual Hinglish' },
                  { id: 'hin_tel', label: '🌶️ Hin + Tel', desc: 'Bilingual Hin + Tel' },
                  { id: 'chatting', label: '💬 Chat Script', desc: 'em chestunnav raa' },
                  { id: 'auto', label: '🌐 As Spoken', desc: 'Auto Detected' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setTargetStyle(style.id)}
                    className={`p-2.5 min-h-[48px] rounded-xl border text-left transition flex flex-col justify-between active:scale-[0.98] ${
                      targetStyle === style.id
                        ? 'border-yellow-500 bg-yellow-500/10 text-slate-900 dark:text-white font-bold shadow-sm'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-bold truncate">{style.label}</span>
                    <span className="text-[10px] opacity-75 truncate">{style.desc}</span>
                  </button>
                ))}
              </div>

              {/* Viral Emojis Toggle Button */}
              <button
                type="button"
                onClick={() => setApplyEmojis(!applyEmojis)}
                className={`w-full mt-2 p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer active:scale-[0.98] ${
                  applyEmojis
                    ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-bold shadow-sm'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${applyEmojis ? 'text-amber-500' : 'text-slate-400'}`} />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold">✨ Add Viral Emojis</span>
                    <span className="text-[10px] opacity-75">Attach 🔥 ⚡ 💰 💀 emojis to key words</span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${applyEmojis ? 'border-amber-500 bg-amber-500 text-black' : 'border-slate-400'}`}>
                  {applyEmojis && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            </div>

            {uploading ? (
              <div className="w-full max-w-xs space-y-2">
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-400" />
                    Uploading video...
                  </span>
                  <span>{progress}%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setFile(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition"
                >
                  Change File
                </button>
                <button
                  onClick={handleUpload}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 transition shadow-lg shadow-yellow-500/20 flex items-center gap-1.5"
                >
                  Generate AI Captions
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
