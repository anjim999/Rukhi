import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Wand2, 
  Film, 
  Mic, 
  Languages, 
  Search, 
  ArrowRight, 
  Play, 
  Sliders, 
  Upload, 
  Loader2, 
  Volume2, 
  Layers, 
  Globe, 
  Video, 
  Check 
} from 'lucide-react';
import toast from 'react-hot-toast';
import FacelessGeneratorModal from '../components/editor/FacelessGeneratorModal';
import DubbingVoiceModal from '../components/editor/DubbingVoiceModal';
import DemucsIsolatorModal from '../components/editor/DemucsIsolatorModal';
import VoiceCloningModal from '../components/editor/VoiceCloningModal';
import { searchStockBroll } from '../services/brollService';
import { uploadVideo } from '../services/projectService';

export default function AIToolsPage() {
  const navigate = useNavigate();

  // Modals state
  const [facelessModalOpen, setFacelessModalOpen] = useState(false);
  const [dubbingModalOpen, setDubbingModalOpen] = useState(false);
  const [demucsModalOpen, setDemucsModalOpen] = useState(false);
  const [voiceCloningModalOpen, setVoiceCloningModalOpen] = useState(false);

  // Live Stock B-Roll Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingBroll, setIsSearchingBroll] = useState(false);
  const [brollResults, setBrollResults] = useState([]);
  const [activeMediaPreview, setActiveMediaPreview] = useState(null);

  // Direct Audio/Video Quick Upload state for Reframer & Transcriber
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Search B-Roll
  const handleSearchBroll = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchingBroll(true);
    try {
      const res = await searchStockBroll(searchQuery.trim());
      const resultsList = Array.isArray(res?.results) ? res.results : (Array.isArray(res?.data) ? res.data : []);
      setBrollResults(resultsList);
      if (resultsList.length > 0) {
        toast.success(`Found ${resultsList.length} stock media clips!`);
      } else {
        toast.error('No stock media found for this query.');
      }
    } catch (_err) {
      toast.error('Failed to search stock B-Roll media.');
    } finally {
      setIsSearchingBroll(false);
    }
  };

  // Quick Direct Upload for Transcriber & Reframer
  const handleQuickUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('targetStyle', 'auto');

      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 300);

      const res = await uploadVideo(formData);
      clearInterval(interval);
      setUploadProgress(100);

      if (res?.success && res.project?.id) {
        toast.success('Media uploaded successfully! Opening Studio Editor...');
        navigate(`/editor/${res.project.id}`);
      } else {
        toast.error('Upload failed. Please try again.');
      }
    } catch (_err) {
      toast.error('Failed to upload video file.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen text-slate-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* PAGE HEADER HERO */}
      <section className="relative pt-10 pb-12 px-4 max-w-7xl mx-auto text-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-yellow-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs font-extrabold mb-6 backdrop-blur">
          <Wand2 className="w-4 h-4 text-yellow-500" />
          <span>AI POWER SUITE & MEDIA GENERATORS</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-4xl mx-auto leading-tight mb-4">
          Launch Top-Grade <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent">AI Video & Voice Tools</span> Instantly
        </h1>

        <p className="text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium text-sm sm:text-base mb-8">
          Access all standalone AI generators without waiting to upload a video first. Generate faceless reels, synthesize voice dubs, search stock B-Roll overlays, and isolate audio vocals.
        </p>

        {/* Quick Launch Action Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
          <button
            onClick={() => setFacelessModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>Faceless Reel Generator</span>
          </button>

          <button
            onClick={() => setDubbingModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-zinc-800 border border-slate-700 dark:border-zinc-700 text-white font-extrabold text-xs hover:border-yellow-500/50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Languages className="w-4 h-4 text-yellow-400" />
            <span>Voice Dubbing Studio</span>
          </button>

          <button
            onClick={() => setVoiceCloningModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-extrabold text-xs hover:bg-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-amber-500" />
            <span>1-2 Min AI Voice Cloning</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('broll-search-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Film className="w-4 h-4 text-yellow-500" />
            <span>Stock B-Roll Explorer</span>
          </button>
        </div>
      </section>

      {/* FEATURE GENERATOR SUITE GRID */}
      <section className="px-4 max-w-7xl mx-auto pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* TOOL 1: FACELESS REEL GENERATOR */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-yellow-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 fill-yellow-500" />
                </div>
                <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-black uppercase tracking-wider">
                  Top Rated AI
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Faceless Video Reel Generator
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Generate complete viral shorts from a single topic prompt. Auto-creates AI scripts, selects stock video footage, synthesizes voiceover audio, and syncs kinetic subtitles.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 mt-6">
              <button
                onClick={() => setFacelessModalOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold text-xs shadow-md shadow-yellow-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Generator Modal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TOOL 2: MULTILINGUAL VOICE DUBBING STUDIO */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-yellow-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  <Languages className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
                  Voice Synth
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Multilingual Voice Dubbing Studio
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Type text or record your voice to generate neural voice dubs in Telugu, Hindi, English, Spanish, Tamil, and Kannada using EdgeTTS, ElevenLabs, or Google TTS models.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 mt-6">
              <button
                onClick={() => setDubbingModalOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-zinc-800 border border-slate-700 dark:border-zinc-700 text-white font-extrabold text-xs hover:border-yellow-500/50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open Dubbing Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TOOL 3: DEMUCS VOCAL SEPARATOR & TRANSCRIBER */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-yellow-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
                  <Mic className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-black uppercase tracking-wider">
                  Demucs AI
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Audio Vocal Isolation & Transcriber
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Upload raw video or audio files up to 1GB. Meta Demucs strips background music while Deepgram Nova-2 & Gemini 2.5 Flash transcribe speech with 100% sync precision.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 mt-6 space-y-2">
              <button
                onClick={() => setDemucsModalOpen(true)}
                className="w-full py-3 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs shadow-md shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Open Demucs Isolator</span>
              </button>

              <label className="w-full py-2.5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs hover:border-yellow-500 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" />
                    <span>Uploading... ({uploadProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-yellow-500" />
                    <span>Direct Upload to Studio</span>
                  </>
                )}
                <input
                  type="file"
                  accept="video/*,audio/*"
                  onChange={handleQuickUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* TOOL 4: 1-2 MIN AI VOICE CLONING STUDIO */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-amber-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  <Volume2 className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
                  XTTS & ElevenLabs
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                1-2 Min AI Voice Cloning Studio
              </h3>
              <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Upload a 1-2 minute voice recording sample in Telugu (తెలుగు), English, or Hindi. XTTS v2 & ElevenLabs clone your exact voice accent, tone, and inflection to speak any text script prompt.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 mt-6">
              <button
                onClick={() => setVoiceCloningModalOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Open Voice Cloning Studio</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* LIVE STOCK B-ROLL SEARCH EXPLORER SECTION */}
      <section id="broll-search-section" className="py-16 bg-slate-100/60 dark:bg-zinc-900/60 border-t border-slate-200 dark:border-zinc-800 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-yellow-500 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              Live Stock Media Suite
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Pexels & Pixabay Stock B-Roll Search Engine
            </h2>
            <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto">
              Search millions of stock footage clips and images to overlay onto your short video reels.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchBroll} className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stock video clips (e.g. 'flying car', 'cyberpunk rain', 'nature')..."
                className="w-full bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 focus:border-yellow-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white font-medium focus:outline-none shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingBroll || !searchQuery.trim()}
              className="px-6 py-3.5 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-sm transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSearchingBroll ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Quick Search Tag Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto text-xs font-semibold text-slate-600 dark:text-zinc-400">
            <span>Popular Keywords:</span>
            {['Tech Founder', 'Cyberpunk City', 'Black Hole Space', 'Stoic Gym', 'College Student', 'Nature River'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  searchStockBroll(tag).then((res) => {
                    const list = Array.isArray(res?.results) ? res.results : (Array.isArray(res?.data) ? res.data : []);
                    setBrollResults(list);
                  });
                }}
                className="px-3 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-yellow-500 text-slate-800 dark:text-zinc-300 text-[11px] transition cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* B-Roll Results Grid */}
          {(brollResults || []).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6">
              {(brollResults || []).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveMediaPreview(item)}
                  className="group relative rounded-2xl bg-zinc-950 border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-md cursor-pointer hover:border-yellow-500 transition"
                >
                  <img
                    src={item.previewUrl || item.thumbnailUrl}
                    alt={item.title || 'Stock B-Roll'}
                    className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                    <span className="text-[10px] font-bold text-white truncate w-full">
                      {item.title || 'Stock Media'}
                    </span>
                  </div>
                  {item.isVideo && (
                    <div className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-yellow-400 backdrop-blur">
                      <Play className="w-3 h-3 fill-current" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MEDIA PREVIEW MODAL */}
      {activeMediaPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm truncate">{activeMediaPreview.title || 'Stock B-Roll Preview'}</h3>
              <button
                onClick={() => setActiveMediaPreview(null)}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black flex justify-center max-h-[400px]">
              {activeMediaPreview.isVideo ? (
                <video
                  src={activeMediaPreview.videoUrl || activeMediaPreview.previewUrl}
                  controls
                  autoPlay
                  className="max-h-[400px] object-contain"
                />
              ) : (
                <img
                  src={activeMediaPreview.previewUrl || activeMediaPreview.thumbnailUrl}
                  alt="Stock B-Roll"
                  className="max-h-[400px] object-contain"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveMediaPreview(null)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FACELESS REEL GENERATOR MODAL */}
      <FacelessGeneratorModal
        isOpen={facelessModalOpen}
        onClose={() => setFacelessModalOpen(false)}
        onReelGenerated={(newProject) => {
          setFacelessModalOpen(false);
          toast.success('Faceless Reel Generated! Opening Studio Editor...');
          navigate(`/editor/${newProject.id}`);
        }}
      />

      {/* DUBBING VOICE MODAL */}
      <DubbingVoiceModal
        isOpen={dubbingModalOpen}
        onClose={() => setDubbingModalOpen(false)}
        onApplyAudio={(audioUrl) => {
          setDubbingModalOpen(false);
          toast.success('Voice Dubbing Audio Generated!');
        }}
      />

      {/* DEMUCS VOCAL ISOLATOR MODAL */}
      <DemucsIsolatorModal
        isOpen={demucsModalOpen}
        onClose={() => setDemucsModalOpen(false)}
      />

      {/* 1-2 MIN AI VOICE CLONING MODAL */}
      <VoiceCloningModal
        isOpen={voiceCloningModalOpen}
        onClose={() => setVoiceCloningModalOpen(false)}
      />
    </div>
  );
}
