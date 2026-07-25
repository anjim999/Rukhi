import React, { useState, useRef } from 'react';
import { UploadCloud, Film, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { uploadVideo } from '../../services/projectService';

export default function VideoDropzone({ onProjectCreated }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
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
      setError('Please upload a valid video file (MP4, MOV, WebM).');
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const response = await uploadVideo(file, file.name, (percent) => {
        setProgress(percent);
      });

      if (response.success && onProjectCreated) {
        onProjectCreated(response.data);
      }
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
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
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-yellow-400 bg-yellow-400/10 scale-[1.01]'
            : file
            ? 'border-zinc-700 bg-zinc-900/90'
            : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80'
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
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-yellow-400 shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Drop your video clip here
              </h3>
              <p className="text-sm text-zinc-400">
                Supports MP4, MOV, WebM (Up to 500MB, 9:16 vertical reels recommended)
              </p>
            </div>
            <span className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
              Browse File
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <Film className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-white truncate max-w-md">
                {file.name}
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
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
