import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Clapperboard, Sparkles, CheckCircle2, AlertTriangle, Users, User, Landmark,
  Camera, Mic, Volume2, Play, Wand2, Plus, Trash2, ShieldCheck, Film, Monitor, FileText, Brain
} from 'lucide-react';
import { generateStudioAiShotList } from '../../services/studioService';

export default function DirectorTimelineTab({
  selectedSeries,
  characters,
  locations,
  onCompileBrief,
  onPreflightCheck,
  onGenerateScene
}) {
  const [sceneTitle, setSceneTitle] = useState('Rahul enters Villa A after job loss');
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [sceneNumber, setSceneNumber] = useState(1);
  const [selectedCharIds, setSelectedCharIds] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [cameraPreset, setCameraPreset] = useState('35mm Cinematic Push-In');
  const [lightingPreset, setLightingPreset] = useState('Blue Hour Mood');
  const [durationSec, setDurationSec] = useState(45);
  const [emotion, setEmotion] = useState('Intense / Angry');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [stylePack, setStylePack] = useState('Christopher Nolan');
  const [languageCode, setLanguageCode] = useState('te-IN');
  const [speechEmotion, setSpeechEmotion] = useState('Intense Shout');
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const [soundFx, setSoundFx] = useState('Door Slam');
  const [customInstruction, setCustomInstruction] = useState('Rahul enters quietly, closes door slowly, looks at the living room with intense regret.');
  
  const [dialogueLines, setDialogueLines] = useState([
    { id: 'line_1', speaker: 'Rahul', text: 'I lost everything today...', emotion: 'Regretful' }
  ]);
  const [compiledData, setCompiledData] = useState(null);
  const [preflightData, setPreflightData] = useState(null);
  const [manifestData, setManifestData] = useState(null);
  const [loading, setLoading] = useState(false);

  const addDialogueLine = () => {
    const castNames = characters.filter(c => selectedCharIds.includes(c.id)).map(c => c.name);
    const defaultSpeaker = castNames[0] || 'Character';
    setDialogueLines([
      ...dialogueLines,
      { id: `line_${Date.now()}`, speaker: defaultSpeaker, text: '', emotion: 'Normal' }
    ]);
  };

  const updateDialogueLine = (id, field, value) => {
    setDialogueLines(dialogueLines.map(line => line.id === id ? { ...line, [field]: value } : line));
  };

  const removeDialogueLine = (id) => {
    if (dialogueLines.length === 1) return;
    setDialogueLines(dialogueLines.filter(line => line.id !== id));
  };

  const handleAutoFillAI = async () => {
    const castNames = characters.filter(c => selectedCharIds.includes(c.id)).map(c => c.name);
    const locName = locations.find(l => l.id === selectedLocationId)?.name || 'Villa A';
    const scriptSummary = dialogueLines.map(d => `${d.speaker}: ${d.text}`).join(' | ');
    
    setLoading(true);
    try {
      const res = await generateStudioAiShotList({
        characterNames: castNames,
        locationName: locName,
        lightingPreset,
        emotion,
        durationSec,
        dialogueText: scriptSummary
      });
      const shotList = res.data?.data?.shotList || res.data?.shotList;
      if (shotList) {
        setCustomInstruction(shotList);
      }
    } catch (err) {
      console.warn('Live Gemini shot list generation notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCharSelection = (id) => {
    if (selectedCharIds.includes(id)) {
      setSelectedCharIds(selectedCharIds.filter((cId) => cId !== id));
    } else {
      setSelectedCharIds([...selectedCharIds, id]);
    }
  };

  const handlePreflight = async () => {
    if (!selectedSeries) {
      alert('Please select an active Series Bible first!');
      return;
    }
    setLoading(true);
    try {
      const result = await onPreflightCheck({
        seriesId: selectedSeries.id,
        characterIds: selectedCharIds,
        locationId: selectedLocationId || null,
        sceneTitle,
        cameraPreset,
        lightingPreset,
        durationSec,
        dialogue: dialogueLines.map(d => ({ speaker: d.speaker || 'Character', text: d.text, emotion: d.emotion || 'Normal' })),
        emotion,
        customPrompt: customInstruction,
        aspectRatio,
        resolution,
        stylePack,
        language: languageCode,
        speechEmotion,
        speakingRate,
        soundFx
      });

      const brief = result?.brief || result?.data?.brief || result?.data?.data?.brief || result;
      const report = result?.report || result?.data?.report || result?.data?.data?.report || result;

      setCompiledData(brief);
      setPreflightData(report);
    } catch (err) {
      alert('Preflight check failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSeries) return;
    setLoading(true);
    try {
      const result = await onGenerateScene({
        seriesId: selectedSeries.id,
        episodeNumber,
        sceneNumber,
        title: sceneTitle,
        characterIds: selectedCharIds,
        locationId: selectedLocationId || null,
        cameraPreset,
        lightingPreset,
        durationSec,
        dialogue: dialogueLines.map(d => ({ speaker: d.speaker || 'Character', text: d.text, emotion: d.emotion || 'Normal' })),
        emotion,
        customPrompt: customInstruction,
        aspectRatio,
        resolution,
        stylePack,
        language: languageCode,
        speechEmotion,
        speakingRate,
        soundFx
      });

      const manifest = result?.manifest || result?.data?.manifest || result;
      const brief = result?.compiledBrief || result?.data?.compiledBrief || result;
      const report = result?.preflightReport || result?.data?.preflightReport || result;

      setManifestData(manifest);
      setCompiledData(brief);
      setPreflightData(report);
    } catch (err) {
      alert('Scene orchestration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      {!selectedSeries ? (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center backdrop-blur-xl shadow-xl">
          <p className="text-slate-600 dark:text-slate-400">Please select an active Series Bible from the Series Bible tab to start the Multi-Agent Director engine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scene Orchestrator Controls */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Clapperboard className="w-5 h-5" />
                <span>AI Director Scene Compiler</span>
              </h3>
              <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full font-bold border border-amber-500/30">
                Ep {episodeNumber} : Scene {sceneNumber}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Scene Heading / Title</label>
              <input
                type="text"
                value={sceneTitle}
                onChange={(e) => setSceneTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Characters Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Cast Characters ({selectedCharIds.length} Selected)
              </label>
              {characters.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">No characters created. Go to Character Vault to add Rahul!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {characters.map((c) => {
                    const isSelected = selectedCharIds.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleCharSelection(c.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{c.name} (v{c.version || 1})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cinematic Style Pack & Budget Optimizer Status Banner */}
            <div className="bg-slate-50 dark:bg-slate-950/80 p-4 border border-amber-500/30 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Cinematic Style Pack (1-Click Studio Preset)</span>
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Modifies all 7 Studio Departments consistently for maximum visual immersion</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Budget Optimizer Active (SHA-256 Credit Cache)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                {['Christopher Nolan', 'Netflix Crime Thriller', 'Pixar Animation', 'Neon Noir', 'Historical Period Drama'].map((pack) => (
                  <button
                    type="button"
                    key={pack}
                    onClick={() => setStylePack(pack)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      stylePack === pack
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:border-amber-400'
                    }`}
                  >
                    {pack}
                  </button>
                ))}
              </div>
            </div>

            {/* Set Location Selection, Aspect Ratio & Resolution */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Set Location</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">Default Set Ambient</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.location_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Aspect Ratio (Format)</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-amber-600 dark:text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                >
                  <option value="16:9">16:9 (Cinematic Widescreen)</option>
                  <option value="9:16">9:16 (Vertical Reel / Shorts)</option>
                  <option value="1:1">1:1 (Square Post)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Render Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-emerald-600 dark:text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                >
                  <option value="720p">720p HD (Fast Render)</option>
                  <option value="1080p">1080p Full HD (Broadcast Master)</option>
                  <option value="4K">4K Ultra Cinema (Maximum Bitrate)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Scene Emotion / Mood</label>
                <input
                  type="text"
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Language Dialect, Voice Emotion, Speech Speed & Sound FX */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div>
                <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Cinema Language</label>
                <select
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="te-IN">Telugu (Native Script)</option>
                  <option value="telglish">Telglish (Romanized Chat)</option>
                  <option value="en-US">English (Hollywood)</option>
                  <option value="hi-IN">Hindi (Bollywood)</option>
                  <option value="ta-IN">Tamil (Kollywood)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Acting Voice Emotion</label>
                <select
                  value={speechEmotion}
                  onChange={(e) => setSpeechEmotion(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="Intense Shout">Intense Shout / Anger</option>
                  <option value="Whisper">Soft Whisper / Secretive</option>
                  <option value="Regretful">Regretful / Sad</option>
                  <option value="Normal">Normal Natural Acting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Speech Pacing Rate</label>
                <select
                  value={speakingRate}
                  onChange={(e) => setSpeakingRate(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value={0.9}>0.9x (Dramatic Pause)</option>
                  <option value={1.0}>1.0x (Normal Pace)</option>
                  <option value={1.2}>1.2x (Urgent / Fast)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Trigger Sound FX</label>
                <select
                  value={soundFx}
                  onChange={(e) => setSoundFx(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-emerald-600 dark:text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                >
                  <option value="Door Slam">Door Slam</option>
                  <option value="Thunder Clap">Thunder Clap</option>
                  <option value="Gunshot">Gunshot / Strike</option>
                  <option value="Rain & Wind">Rain & Heavy Wind</option>
                  <option value="Footsteps on Wood">Footsteps on Wood</option>
                  <option value="Car Engine Rev">Car Engine Rev</option>
                  <option value="None">None (BGM Only)</option>
                </select>
              </div>
            </div>

            {/* Cinematic Camera, Lighting Specs & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Camera Preset</label>
                <select
                  value={cameraPreset}
                  onChange={(e) => setCameraPreset(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="35mm Cinematic Push-In">35mm Cinematic Push-In (Zoom-In)</option>
                  <option value="Rapid Crane Pullback">Rapid Crane Pullback (Zoom-Out Reveal)</option>
                  <option value="Dramatic Crash Zoom">Dramatic Crash Zoom (High Emotion)</option>
                  <option value="360-Degree Arc Orbit">360-Degree Arc Orbit (Tracking Parallax)</option>
                  <option value="Depth-of-Field Rack Focus">Depth-of-Field Rack Focus</option>
                  <option value="50mm Over-The-Shoulder">50mm Over-The-Shoulder</option>
                  <option value="85mm Low-Depth Close-Up">85mm Low-Depth Close-Up</option>
                  <option value="Handheld High-Tension">Handheld High-Tension</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Lighting Preset</label>
                <select
                  value={lightingPreset}
                  onChange={(e) => setLightingPreset(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="Blue Hour Mood">Blue Hour Mood</option>
                  <option value="Low-Key High Contrast">Low-Key High Contrast</option>
                  <option value="Golden Hour Sunset">Golden Hour Sunset</option>
                  <option value="Natural Soft Softbox">Natural Soft Softbox</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Target Clip Length</label>
                <select
                  value={durationSec}
                  onChange={(e) => setDurationSec(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-amber-600 dark:text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                >
                  <option value={15}>15 Seconds (Short Scene)</option>
                  <option value={30}>30 Seconds (Standard Scene)</option>
                  <option value={45}>45 Seconds (Full Feature Scene)</option>
                  <option value={60}>60 Seconds (1-Min Extended)</option>
                  <option value={90}>90 Seconds (Long Cinematic)</option>
                </select>
              </div>
            </div>

            {/* Director Visual Instruction & Dialogue Input */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Clapperboard className="w-4 h-4 text-amber-500" />
                    <span>Director Visual Instruction & Screenplay Canvas</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-normal">Custom Multi-Shot Vision</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoFillAI}
                    className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Auto-Fill Shot List with AI</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. Medium shot of Rahul standing by the glass window in his penthouse office as rain pours outside."
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Multi-Speaker Interactive Script Builder */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Mic className="w-4 h-4 text-amber-500" />
                    <span>Multi-Character Script & Dialogue Builder</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Per-Character Lines & Acting Tone</span>
                  </label>
                  <button
                    type="button"
                    onClick={addDialogueLine}
                    className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-500" />
                    <span>Add Character Line</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {dialogueLines.map((line, idx) => {
                    const castNames = characters.filter(c => selectedCharIds.includes(c.id)).map(c => c.name);
                    return (
                      <div key={line.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 items-center">
                        {/* Speaker Picker */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Speaker #{idx + 1}</label>
                          <select
                            value={line.speaker}
                            onChange={(e) => updateDialogueLine(line.id, 'speaker', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs text-amber-600 dark:text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                          >
                            {castNames.length > 0 ? (
                              castNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))
                            ) : (
                              <option value="Character">Character</option>
                            )}
                            <option value="Narrator">Narrator (VO)</option>
                          </select>
                        </div>

                        {/* Dialogue Line Input */}
                        <div className="sm:col-span-6">
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Dialogue Text</label>
                          <input
                            type="text"
                            value={line.text}
                            onChange={(e) => updateDialogueLine(line.id, 'text', e.target.value)}
                            placeholder="Enter spoken line..."
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Emotion Delivery Tone */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Tone</label>
                          <select
                            value={line.emotion}
                            onChange={(e) => updateDialogueLine(line.id, 'emotion', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                          >
                            <option value="Normal">Normal</option>
                            <option value="Intense Shout">Shout</option>
                            <option value="Whisper">Whisper</option>
                            <option value="Regretful">Regretful</option>
                          </select>
                        </div>

                        {/* Delete Button */}
                        <div className="sm:col-span-1 text-right pt-4 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => removeDialogueLine(line.id)}
                            disabled={dialogueLines.length === 1}
                            className="p-2 bg-red-600 hover:bg-red-500 text-white font-black border border-red-500 rounded-xl text-xs shadow-md shadow-red-600/30 transition-all disabled:opacity-30 cursor-pointer"
                            title="Delete Script Line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handlePreflight}
                disabled={loading}
                className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-amber-600 dark:text-amber-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Checking...' : 'Run Preflight Check'}</span>
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{loading ? 'Processing...' : 'Orchestrate Scene'}</span>
              </button>
            </div>
          </div>

          {/* Preflight Diagnostics & Compiled Brief Panel */}
          <div className="lg:col-span-6 space-y-5">
            {/* Preflight Diagnostic Status */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-xl">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Multi-Agent Preflight Inspector</span>
                </span>
                {preflightData && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    preflightData.passed ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-700 dark:text-red-300'
                  }`}>
                    {preflightData.passed ? 'PASS 100%' : 'WARNING'}
                  </span>
                )}
              </h4>

              {!preflightData ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                  Click "Run Preflight Check" to inspect Character DNA, Set Location availability, and Canon Rules before calling Veo.
                </p>
              ) : (
                <div className="space-y-2">
                  {preflightData.checks.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <span className={c.status === 'PASS' ? 'text-emerald-500' : 'text-amber-500'}>
                          {c.status === 'PASS' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 text-right">{c.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compiled Production Brief Output */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-xl">
              <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Compiled Production Brief (Vertex Briefing)</span>
                </span>
              </h4>

              {!compiledData ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                  Compiled brief preview will appear here automatically when preflight check or scene orchestration is triggered.
                </p>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-slate-800 dark:text-slate-300 leading-relaxed overflow-x-auto">
                    {compiledData.formatted_vertex_prompt}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div><span className="text-slate-500">Series:</span> {compiledData.series_title}</div>
                    <div><span className="text-slate-500">Scene:</span> {compiledData.scene_title}</div>
                    <div><span className="text-slate-500">Camera:</span> {compiledData.visual_grammar?.camera}</div>
                    <div><span className="text-slate-500">Lighting:</span> {compiledData.visual_grammar?.lighting}</div>
                  </div>

                  {compiledData.ai_director_expansion && (
                    <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl">
                      <div className="text-amber-600 dark:text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-amber-500" />
                        <span>AI Director Vision Expansion (Gemini)</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-300 leading-relaxed text-xs font-mono whitespace-pre-wrap">
                        {compiledData.ai_director_expansion}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Production Manifest & Quality Score */}
            {manifestData && (
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-emerald-300">✅ Production Manifest Created & Rendered</h4>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-full border border-emerald-500/30">
                    Score: {manifestData.quality_score}%
                  </span>
                </div>

                {manifestData.output_video_url && (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-black">
                      <video
                        src={manifestData.output_video_url}
                        controls
                        autoPlay
                        className="w-full h-48 object-cover"
                      />
                    </div>

                    <a
                      href={manifestData.output_video_url}
                      download={`scene_${manifestData.scene_id || 'clip'}.mp4`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 uppercase tracking-wider"
                    >
                      <span>⬇️ Download MP4 Scene Clip</span>
                    </a>
                  </div>
                )}

                <p className="text-xs text-slate-300 border-t border-emerald-500/20 pt-2">
                  Manifest ID: <span className="font-mono text-emerald-400">{manifestData.id}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
