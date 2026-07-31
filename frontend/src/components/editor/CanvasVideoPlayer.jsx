import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Loader2, Gauge, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { THEME_PRESETS, ANIMATION_TYPES } from '../../../../shared/constants/timeline';
import { exportProjectMP4, remuxRecordedBlob, getFullMediaUrl } from '../../services/projectService';

/**
 * CanvasVideoPlayer — Broadcast-Grade Smooth Player & Exporter
 * 100% Stutter-Free Fluid Video Playback & Lossless 4K Recording Engine
 */

import { getSanitizedFilename, drawCover } from './utils/canvasUtils';
import { renderCanvasSubtitles } from './utils/canvasRenderEngine';


export default function CanvasVideoPlayer({ projectId, videoUrl, timeline, setTimeline, currentTime, setCurrentTime, projectTitle, aspectRatio = '9:16', setAspectRatio }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const resolvedVideoUrl = getFullMediaUrl(videoUrl);
  const isVideoUrlAnImage = resolvedVideoUrl && (resolvedVideoUrl.includes('image.pollinations.ai') || /\.(png|jpe?g|webp|gif)($|\?)/i.test(resolvedVideoUrl));
  const activeVideoSrc = (resolvedVideoUrl && !isVideoUrlAnImage) ? resolvedVideoUrl : '';
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [videoError, setVideoError] = useState(null);
  const [isDraggingCaption, setIsDraggingCaption] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sfxEnabled, setSfxEnabled] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [exportQuality, setExportQuality] = useState('1080p');
  const [isQualityOpen, setIsQualityOpen] = useState(false);

  const handleRateChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const isRecordingRef = useRef(false);
  const exportAbortControllerRef = useRef(null);
  const activeProgressIntervalRef = useRef(null);
  const activeMediaRecorderRef = useRef(null);
  const activeSafetyTimerRef = useRef(null);
  const activeCheckEndRef = useRef(null);
  const origCanvasDimsRef = useRef(null);
  const lastSegIdRef = useRef(null);
  const segStartTimeRef = useRef(0);
  const lastUiUpdateRef = useRef(0);

  const handleCancelExport = (e, silent = false) => {
    if (e) e.stopPropagation();

    // 1. Abort active network request immediately
    if (exportAbortControllerRef.current) {
      try { exportAbortControllerRef.current.abort(); } catch (_e) {}
      exportAbortControllerRef.current = null;
    }

    // 2. Clear all active timers
    if (activeProgressIntervalRef.current) {
      clearInterval(activeProgressIntervalRef.current);
      activeProgressIntervalRef.current = null;
    }
    if (activeCheckEndRef.current) {
      clearInterval(activeCheckEndRef.current);
      activeCheckEndRef.current = null;
    }
    if (activeSafetyTimerRef.current) {
      clearTimeout(activeSafetyTimerRef.current);
      activeSafetyTimerRef.current = null;
    }

    // 3. Halt media recorder if running
    if (activeMediaRecorderRef.current) {
      try {
        if (activeMediaRecorderRef.current.state !== 'inactive') {
          activeMediaRecorderRef.current.stop();
        }
      } catch (_e) {}
      activeMediaRecorderRef.current = null;
    }

    // 4. Restore original canvas buffer dimensions if altered
    if (origCanvasDimsRef.current && canvasRef.current) {
      try {
        canvasRef.current.width = origCanvasDimsRef.current.width;
        canvasRef.current.height = origCanvasDimsRef.current.height;
      } catch (_e) {}
      origCanvasDimsRef.current = null;
    }

    // 5. Complete state cleanup
    isRecordingRef.current = false;
    setIsRecording(false);
    setRecordProgress(0);

    toast.dismiss('export-toast');
    if (!silent) {
      toast.info('Video export cancelled.');
    }
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const posYPercent = Math.min(85, Math.max(20, Math.round((clickY / rect.height) * 100)));

    if (timeline?.segments && setTimeline) {
      const updated = {
        ...timeline,
        globalTheme: {
          ...(timeline.globalTheme || {}),
          position: { x: 50, y: posYPercent },
        },
        segments: timeline.segments.map((seg) => ({
          ...seg,
          position: { ...(seg.position || { x: 50, y: 75 }), y: posYPercent },
        })),
      };
      setTimeline(updated);
    }
    setIsDraggingCaption(true);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDraggingCaption) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const posYPercent = Math.min(85, Math.max(20, Math.round((clickY / rect.height) * 100)));

    if (timeline?.segments && setTimeline) {
      const updated = {
        ...timeline,
        globalTheme: {
          ...(timeline.globalTheme || {}),
          position: { x: 50, y: posYPercent },
        },
        segments: timeline.segments.map((seg) => ({
          ...seg,
          position: { ...(seg.position || { x: 50, y: 75 }), y: posYPercent },
        })),
      };
      setTimeline(updated);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCaption(false);
  };

  // Broadcast-grade 60FPS Hardware-Synced Render Loop (requestVideoFrameCallback)
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    let handle;
    let isSubscribed = true;

    const drawFrame = () => {
      if (!isSubscribed) return;

      const masterTime = (dubbedAudioRef.current && !dubbedAudioRef.current.paused)
        ? dubbedAudioRef.current.currentTime
        : video.currentTime;

      const activeAspect = aspectRatio || timeline?.aspectRatio || '9:16';
      const targetWidth = activeAspect === '16:9' ? 1920 : (activeAspect === '1:1' || activeAspect === '4:5') ? 1080 : 1080;
      const targetHeight = activeAspect === '16:9' ? 1080 : activeAspect === '1:1' ? 1080 : activeAspect === '4:5' ? 1350 : 1920;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. Draw Active Full-Screen B-Roll Cutaway Clip or Base Video
      let drawnOverlay = false;
      if (timeline?.brollOverlays && Array.isArray(timeline.brollOverlays)) {
        const activeOverlay = timeline.brollOverlays.find(
          (o) => masterTime >= o.start && masterTime <= o.end
        );

        // Explicitly pause any non-active B-Roll video element or when master player is paused
        if (brollElementsRef.current) {
          const isMasterPaused = !isPlaying && (!dubbedAudioRef.current || dubbedAudioRef.current.paused) && video.paused;
          Object.entries(brollElementsRef.current).forEach(([url, el]) => {
            if (el && el.tagName === 'VIDEO') {
              const isActive = activeOverlay && (activeOverlay.clip?.videoUrl === url || activeOverlay.clip?.thumbnailUrl === url);
              if (!isActive || isMasterPaused) {
                if (!el.paused) {
                  try { el.pause(); } catch (_) {}
                }
              }
            }
          });
        }

        if (activeOverlay) {
          const rawUrl = activeOverlay.clip?.videoUrl || activeOverlay.clip?.thumbnailUrl;
          const url = getFullMediaUrl(rawUrl);
          let el = brollElementsRef.current[url] || brollElementsRef.current[rawUrl];

          if (!el && url) {
            const isImg = activeOverlay.clip?.isAIImage || 
                          url.includes('pollinations.ai') || 
                          /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(url) || 
                          (rawUrl && /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(rawUrl));

            if (isImg) {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = url;
              brollElementsRef.current[url] = img;
              if (rawUrl) brollElementsRef.current[rawUrl] = img;
              el = img;
            } else {
              const v = document.createElement('video');
              v.src = url;
              v.crossOrigin = 'anonymous';
              v.muted = true;
              v.loop = true;
              v.playsInline = true;
              v.load();
              brollElementsRef.current[url] = v;
              if (rawUrl) brollElementsRef.current[rawUrl] = v;
              el = v;
            }
          }

          if (el) {
            try {
              if (el.tagName === 'VIDEO') {
                const isMasterPlaying = isPlaying || (dubbedAudioRef.current && !dubbedAudioRef.current.paused) || (!video.paused);
                if (isMasterPlaying) {
                  if (el.paused) {
                    el.play().catch(() => {});
                  }
                } else {
                  if (!el.paused) {
                    try { el.pause(); } catch (_) {}
                  }
                }

                if (el.readyState >= 1) {
                  drawCover(ctx, el, width, height);
                  drawnOverlay = true;
                }
              } else if (el.tagName === 'IMG') {
                if (el.complete && (el.naturalWidth > 0 || el.width > 0)) {
                  drawCover(ctx, el, width, height);
                  drawnOverlay = true;
                }
              }
            } catch (_) {}
          }
        }
      }

      if (!drawnOverlay) {
        if (video && video.readyState >= 2 && video.videoWidth > 0) {
          try {
            drawCover(ctx, video, width, height);
            drawnOverlay = true;
          } catch (_e) {}
        }
      }

      if (!drawnOverlay) {
        // Fallback dark cinematic gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#09090b');
        grad.addColorStop(0.5, '#18181b');
        grad.addColorStop(1, '#09090b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Master End Stop Check: When video/audio reaches timeline duration, stop completely!
      const maxTimelineDuration = timeline?.duration || 30;
      if (masterTime >= maxTimelineDuration && !video.paused) {
        console.log('[CANVAS PLAYER] 🏁 Reached end of timeline. Stopping all playback.');
        video.pause();
        video.currentTime = 0;
        if (dubbedAudioRef.current) {
          dubbedAudioRef.current.pause();
          dubbedAudioRef.current.currentTime = 0;
        }
        if (brollElementsRef.current) {
          Object.values(brollElementsRef.current).forEach((el) => {
            if (el && el.tagName === 'VIDEO') {
              try { el.pause(); el.currentTime = 0; } catch (_) {}
            }
          });
        }
        setIsPlaying(false);
        setCurrentTime(0);
        return;
      }

      // Auto resync base video element clock with master voiceover time
      if (dubbedAudioRef.current && !video.paused) {
        video.muted = true;
        const drift = Math.abs(video.currentTime - masterTime);
        if (drift > 0.3) {
          video.currentTime = masterTime % (video.duration || 5);
        }
      }

      // Throttle UI slider updates (100ms) for smooth slider feedback without thrashing react state
      if (!isRecordingRef.current && Date.now() - lastUiUpdateRef.current > 100) {
        lastUiUpdateRef.current = Date.now();
        setCurrentTime(masterTime);
      }

      // 2. Render Top Hook Banner
      if (timeline?.topBanner?.enabled) {
        renderTopHookBanner(ctx, timeline.topBanner, width, height);
      }

      // 3. Render Submagic Kinetic Subtitles
      if (timeline?.segments) {
        const activeSegment = timeline.segments.find(
          (seg) => masterTime >= (seg.start - 0.05) && masterTime <= (seg.end + 0.05)
        );

        if (activeSegment) {
          if (lastSegIdRef.current !== activeSegment.id) {
            lastSegIdRef.current = activeSegment.id;
            segStartTimeRef.current = masterTime;
          }
          const segAge = masterTime - segStartTimeRef.current;
          renderSubmagicCaptions(ctx, activeSegment, masterTime, width, height, segAge, timeline);
        }
      }

      handle = requestAnimationFrame(drawFrame);
    };

    handle = requestAnimationFrame(drawFrame);

    return () => {
      isSubscribed = false;
      if ('requestVideoFrameCallback' in video && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(handle);
      } else {
        cancelAnimationFrame(handle);
      }
    };
  }, [timeline, setCurrentTime]);

  const dubbedAudioRef = useRef(null);

  useEffect(() => {
    if (!timeline?.dubbedAudioUrl) {
      if (dubbedAudioRef.current) {
        dubbedAudioRef.current.pause();
        dubbedAudioRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.muted = isMuted;
        console.log('[CANVAS PLAYER] 🔊 Restored original video audio track (unmuted).');
      }
      return;
    }

    const fullDubbedUrl = getFullMediaUrl(timeline.dubbedAudioUrl);
    const audio = new Audio(fullDubbedUrl);
    audio.preload = 'auto';
    dubbedAudioRef.current = audio;

    audio.onended = () => {
      console.log('[CANVAS PLAYER] 🛑 Voiceover completed. Stopping playback.');
      setIsPlaying(false);
      setCurrentTime(0);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      if (dubbedAudioRef.current) {
        dubbedAudioRef.current.pause();
        dubbedAudioRef.current.currentTime = 0;
      }
      if (brollElementsRef.current) {
        Object.values(brollElementsRef.current).forEach((el) => {
          if (el && el.tagName === 'VIDEO') {
            try {
              el.pause();
              el.currentTime = 0;
            } catch (_) {}
          }
        });
      }
    };

    if (videoRef.current) {
      videoRef.current.loop = false;
    }

    console.log('[CANVAS PLAYER] 🎙️ Loaded dubbed audio track & enabled seamless background video loop:', fullDubbedUrl);

    return () => {
      audio.pause();
      dubbedAudioRef.current = null;
      if (videoRef.current) {
        videoRef.current.muted = isMuted;
      }
    };
  }, [timeline?.dubbedAudioUrl, isMuted]);

  useEffect(() => {
    if (timeline?.duration && timeline.duration > 0) {
      setDuration(timeline.duration);
      console.log('[CANVAS PLAYER] ⏱️ Set player duration to timeline duration:', timeline.duration);
    }
  }, [timeline?.duration]);

  const brollElementsRef = useRef({});

  // Reset and reload background video element when videoUrl changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      console.log('[CANVAS PLAYER] 🔄 Loaded new video asset:', videoUrl);
    }
  }, [videoUrl]);

  // Preload and cache current project B-Roll elements
  useEffect(() => {
    brollElementsRef.current = {};

    if (!timeline?.brollOverlays || timeline.brollOverlays.length === 0) return;

    timeline.brollOverlays.forEach((overlay) => {
      const rawUrl = overlay.clip?.videoUrl || overlay.clip?.thumbnailUrl;
      const url = getFullMediaUrl(rawUrl);
      if (url && !brollElementsRef.current[url]) {
        const isImage = overlay.clip?.isAIImage || url.includes('pollinations.ai') || /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(url);
        if (!isImage && (overlay.clip?.isRealAIVideo || /\.mp4($|\?)/i.test(url))) {
          const v = document.createElement('video');
          v.src = url;
          v.crossOrigin = 'anonymous';
          v.muted = true;
          v.loop = true;
          v.playsInline = true;
          v.load();
          brollElementsRef.current[url] = v;
          if (rawUrl) brollElementsRef.current[rawUrl] = v;
        } else {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = url;
          brollElementsRef.current[url] = img;
          if (rawUrl) brollElementsRef.current[rawUrl] = img;
        }
      }
    });
  }, [projectId, timeline?.brollOverlays]);

  const togglePlay = (e) => {
    if (isRecording || (videoError && !timeline?.dubbedAudioUrl)) return;

    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(15);
    }

    const video = videoRef.current;
    const isAudioPlaying = dubbedAudioRef.current && !dubbedAudioRef.current.paused;
    const isVideoPlaying = video && !video.paused;

    if (!isAudioPlaying && !isVideoPlaying && !isPlaying) {
      if (dubbedAudioRef.current) {
        if (video) video.muted = true;
        if (video) dubbedAudioRef.current.currentTime = video.currentTime;
        dubbedAudioRef.current.play().catch((err) => console.warn('[PLAYBACK] Audio play warning:', err));
      }

      if (video && video.src && video.src.trim() !== '') {
        video.play().catch((err) => {
          console.warn('[PLAYBACK] Base video element play warning:', err);
        });
      }

      setIsPlaying(true);
    } else {
      if (dubbedAudioRef.current) {
        try { dubbedAudioRef.current.pause(); } catch (_) {}
      }
      if (video) {
        try { video.pause(); } catch (_) {}
      }
      if (brollElementsRef.current) {
        Object.values(brollElementsRef.current).forEach((el) => {
          if (el && el.tagName === 'VIDEO') {
            try { el.pause(); } catch (_) {}
          }
        });
      }
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    if (dubbedAudioRef.current) {
      dubbedAudioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  // Direct manual seek slider handler
  const handleSeek = (e) => {
    const targetTime = parseFloat(e.target.value);
    if (dubbedAudioRef.current) {
      try { dubbedAudioRef.current.currentTime = targetTime; } catch (_) {}
    }
    if (videoRef.current && videoRef.current.src) {
      try { videoRef.current.currentTime = targetTime; } catch (_) {}
    }

    if (timeline?.brollOverlays && Array.isArray(timeline.brollOverlays) && brollElementsRef.current) {
      const activeOverlay = timeline.brollOverlays.find(
        (o) => targetTime >= o.start && targetTime <= o.end
      );
      if (activeOverlay) {
        const rawUrl = activeOverlay.clip?.videoUrl || activeOverlay.clip?.thumbnailUrl;
        const url = getFullMediaUrl(rawUrl);
        const el = brollElementsRef.current[url] || brollElementsRef.current[rawUrl];
        if (el && el.tagName === 'VIDEO' && el.duration) {
          try {
            const relTime = (targetTime - activeOverlay.start) % el.duration;
            el.currentTime = Math.max(0, relTime);
          } catch (_) {}
        }
      }
    }

    setCurrentTime(targetTime);
  };

function getExportDimensions(qualityKey, aspect, nativeW, nativeH) {
  const baseSpecs = {
    '480p': { short: 480, long: 854, bitrate: 4000000 },
    '720p': { short: 720, long: 1280, bitrate: 8000000 },
    '1080p': { short: 1080, long: 1920, bitrate: 20000000 },
    '2K': { short: 1440, long: 2560, bitrate: 35000000 },
    '4K': { short: 2160, long: 3840, bitrate: 50000000 },
  };

  // If 4K quality is selected and video has higher native resolution, preserve original dimensions
  if (nativeW && nativeH && (qualityKey === '4K' || qualityKey === 'Original')) {
    if (nativeW >= 1920 || nativeH >= 1920) {
      return { width: nativeW, height: nativeH, bitrate: 50000000 };
    }
  }

  const spec = baseSpecs[qualityKey] || baseSpecs['1080p'];

  if (aspect === '16:9') {
    return { width: spec.long, height: spec.short, bitrate: spec.bitrate };
  } else if (aspect === '1:1') {
    return { width: spec.short, height: spec.short, bitrate: spec.bitrate };
  } else {
    return { width: spec.short, height: spec.long, bitrate: spec.bitrate };
  }
}

  // Lossless Broadcast Video Exporter (100% WYSIWYG Pixel-Perfect Live Canvas Stream Recording)
  const exportCaptionedVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || isRecording) return;

    if (!videoUrl) {
      toast.error('Video URL is missing.', { id: 'export-toast' });
      return;
    }

    // Completely clear & reset any previous export/cancel state quietly before starting fresh
    handleCancelExport(null, true);

    try { video.pause(); } catch (_e) {}
    setIsPlaying(false);

    toast.dismiss('export-toast');

    const controller = new AbortController();
    exportAbortControllerRef.current = controller;

    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordProgress(0);

    toast.loading(`Capturing ${exportQuality} Ultra-HD Pixel-Perfect Reel...`, { id: 'export-toast' });

    console.log('🎥 [EXPORT ENGINE] Initiating 100% WYSIWYG Pixel-Perfect Canvas Stream Recording...');

    const nativeW = video.videoWidth || 1080;
    const nativeH = video.videoHeight || 1920;
    const dims = getExportDimensions(exportQuality, aspectRatio, nativeW, nativeH);
    const origW = canvas.width;
    const origH = canvas.height;

    origCanvasDimsRef.current = { width: origW, height: origH };

    // Dynamically scale canvas buffer to target resolution (480p, 720p, 1080p, 2K, 4K)
    canvas.width = dims.width;
    canvas.height = dims.height;

    try {
      video.currentTime = 0;
      setCurrentTime(0);
      await new Promise((r) => setTimeout(r, 400));
      if (!isRecordingRef.current) return;

      const stream = canvas.captureStream(60);
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const dest = audioCtx.createMediaStreamDestination();
        let hasAudioSource = false;

        if (dubbedAudioRef.current) {
          try {
            const audioSource = audioCtx.createMediaElementSource(dubbedAudioRef.current);
            audioSource.connect(dest);
            audioSource.connect(audioCtx.destination);
            hasAudioSource = true;
          } catch (_) {}
        }

        if (video && video.src && video.src.trim() !== '') {
          try {
            const videoSource = audioCtx.createMediaElementSource(video);
            videoSource.connect(dest);
            videoSource.connect(audioCtx.destination);
            hasAudioSource = true;
          } catch (_) {}
        }

        if (hasAudioSource) {
          const audioTrack = dest.stream.getAudioTracks()[0];
          if (audioTrack) {
            stream.addTrack(audioTrack);
            console.log('🎙️ [EXPORT ENGINE] Mixed audio stream attached successfully!');
          }
        }
      } catch (audioErr) {
        console.warn('⚠️ [EXPORT ENGINE] AudioContext stream capture warning:', audioErr);
      }

      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
        mimeType = 'video/mp4;codecs=h264';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: dims.bitrate,
      });
      activeMediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (!isRecordingRef.current) return;

        if (origCanvasDimsRef.current && canvasRef.current) {
          canvasRef.current.width = origCanvasDimsRef.current.width;
          canvasRef.current.height = origCanvasDimsRef.current.height;
          origCanvasDimsRef.current = null;
        }

        const blob = new Blob(chunks, { type: mimeType });
        const exportFilename = getSanitizedFilename(projectTitle, `reel_${exportQuality}`, 'mp4');

        toast.loading('Packaging Instagram Reels MP4 (+faststart metadata)...', { id: 'export-toast' });

        try {
          // Send recorded stream to server for fast H.264 + +faststart moov atom header remux
          console.log('📦 [EXPORT ENGINE] Sending recorded stream to server for H.264 +faststart remuxing...');
          const remuxRes = await remuxRecordedBlob(blob, projectTitle);
          if (!isRecordingRef.current) return;

          const outputUrl = remuxRes.data?.outputUrl || remuxRes.data?.data?.outputUrl || remuxRes.outputUrl;
          if (outputUrl) {
            const downloadUrl = getFullMediaUrl(outputUrl);
            console.log('📥 [EXPORT ENGINE] Downloading H.264 remuxed MP4:', downloadUrl);
            const blobRes = await fetch(downloadUrl, { signal: controller.signal });
            if (!isRecordingRef.current || controller.signal.aborted) return;

            if (blobRes.ok) {
              const remuxBlob = await blobRes.blob();
              if (!isRecordingRef.current || controller.signal.aborted) return;
              if (remuxBlob && remuxBlob.size > 10000) {
                const url = URL.createObjectURL(remuxBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = exportFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 5000);

                isRecordingRef.current = false;
                setIsRecording(false);
                setRecordProgress(100);
                exportAbortControllerRef.current = null;
                console.log('✅ [EXPORT SUCCESS] 100% WYSIWYG Reel exported successfully as:', exportFilename);
                toast.success(`🎉 Ultra-HD ${exportQuality} MP4 exported successfully as "${exportFilename}"!`, { id: 'export-toast' });
                return;
              }
            }
          }
        } catch (remuxErr) {
          if (!isRecordingRef.current) return;
          console.error('❌ [EXPORT ERROR] Server MP4 remuxing failed:', remuxErr);
          toast.error(`Export failed: ${remuxErr.message || 'Server encoding failed.'}`, { id: 'export-toast' });
          isRecordingRef.current = false;
          setIsRecording(false);
          setRecordProgress(0);
          exportAbortControllerRef.current = null;
        }
      };

      mediaRecorder.start(100);

      if (dubbedAudioRef.current) {
        try { dubbedAudioRef.current.currentTime = 0; } catch (_) {}
        dubbedAudioRef.current.play().catch((e) => console.warn('[EXPORT] Dubbed audio play error:', e));
      }
      if (video && video.src && video.src.trim() !== '') {
        try { video.currentTime = 0; } catch (_) {}
        video.play().catch((e) => console.warn('[EXPORT] Base video play warning:', e));
      }

      setIsPlaying(true);

      let stopTriggered = false;

      const stopRecording = () => {
        if (stopTriggered) return;
        stopTriggered = true;
        if (activeCheckEndRef.current) {
          clearInterval(activeCheckEndRef.current);
          activeCheckEndRef.current = null;
        }
        if (activeSafetyTimerRef.current) {
          clearTimeout(activeSafetyTimerRef.current);
          activeSafetyTimerRef.current = null;
        }
        if (dubbedAudioRef.current) {
          try { dubbedAudioRef.current.pause(); } catch (_e) {}
        }
        if (video) {
          try { video.pause(); } catch (_e) {}
        }
        setIsPlaying(false);
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      const checkEnd = setInterval(() => {
        if (!isRecordingRef.current) {
          stopRecording();
          return;
        }

        const currentProgressTime = (dubbedAudioRef.current && !dubbedAudioRef.current.paused)
          ? dubbedAudioRef.current.currentTime
          : (video ? video.currentTime : 0);
        const maxDuration = (timeline?.duration && Number(timeline.duration) > 0)
          ? Number(timeline.duration)
          : (dubbedAudioRef.current?.duration || video?.duration || 60);

        if (maxDuration > 0) {
          const pct = Math.min(99, Math.round((currentProgressTime / maxDuration) * 100));
          setRecordProgress(pct);
          toast.loading(`🎬 Exporting ${exportQuality} Reel (${pct}%)... [${currentProgressTime.toFixed(1)}s / ${maxDuration.toFixed(1)}s]`, { id: 'export-toast' });
        }
        if (currentProgressTime >= maxDuration - 0.12) {
          stopRecording();
        }
      }, 50);
      activeCheckEndRef.current = checkEnd;

      const actualVideoDuration = (timeline?.duration && Number(timeline.duration) > 0)
        ? Number(timeline.duration)
        : (dubbedAudioRef.current?.duration || video?.duration || 60);
      const maxTimeoutMs = Math.max(60000, Math.round((actualVideoDuration + 15) * 1000));

      const safetyTimer = setTimeout(() => {
        console.warn('[EXPORT WATCHDOG] Max duration safety timeout reached, completing export cleanly...');
        stopRecording();
      }, maxTimeoutMs);
      activeSafetyTimerRef.current = safetyTimer;
    } catch (err) {
      if (isRecordingRef.current) {
        console.error('Export error:', err);
        toast.error(`Export failed: ${err.message || 'Unknown error'}`, { id: 'export-toast' });
      }
      handleCancelExport(null, true);
    }
  };

  const targetStyleMap = {
    english: { label: '🇬🇧 Pure English', desc: 'Auto-Translated' },
    telugu: { label: '🇮🇳 Pure Telugu', desc: 'తెలుగు Native Script' },
    hindi: { label: '🇮🇳 Pure Hindi', desc: 'हिंदी Native Script' },
    tel_eng: { label: '⚡ Tel + Eng', desc: 'Bilingual Tanglish' },
    hin_eng: { label: '⚡ Hin + Eng', desc: 'Bilingual Hinglish' },
    hin_tel: { label: '🌶️ Hin + Tel', desc: 'Bilingual Hin + Tel' },
    chatting: { label: '💬 Chat Script', desc: 'em chestunnav raa' },
    auto: { label: '🌐 As Spoken', desc: 'Auto Script' },
  };

  const activeStyleInfo = targetStyleMap[timeline?.targetStyle] || targetStyleMap['auto'];

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        className={`relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-black shadow-2xl transition-all ${
          aspectRatio === '16:9'
            ? 'aspect-[16/9] max-w-[680px] w-full'
            : aspectRatio === '1:1'
            ? 'aspect-square max-h-[45vh] sm:max-h-[580px] w-auto'
            : aspectRatio === '4:5'
            ? 'aspect-[4/5] max-h-[48vh] sm:max-h-[640px] w-auto'
            : 'aspect-[9/16] max-h-[48vh] sm:max-h-[680px] w-auto'
        } group mx-auto`}
      >
        <video
          ref={videoRef}
          src={activeVideoSrc}
          crossOrigin="anonymous"
          playsInline={true}
          webkit-playsinline="true"
          preload="auto"
          muted={isMuted}
          onLoadedMetadata={(e) => {
            const totalDuration = timeline?.duration || (dubbedAudioRef.current && dubbedAudioRef.current.duration) || e.target.duration;
            setDuration(totalDuration);
            setVideoError(null);
          }}
          onCanPlay={(e) => {
            const totalDuration = timeline?.duration || (dubbedAudioRef.current && dubbedAudioRef.current.duration) || e.target.duration;
            if (totalDuration) setDuration(totalDuration);
          }}
          onError={() => {
            if (!timeline?.dubbedAudioUrl && !timeline?.brollOverlays?.length) {
              setVideoError('Media file unavailable on server.');
              setIsPlaying(false);
            } else {
              console.warn('[CANVAS PLAYER] Base video element error. Continuing playback with audio & AI overlays.');
              setVideoError(null);
            }
          }}
          onEnded={() => {
            if (dubbedAudioRef.current && !dubbedAudioRef.current.paused && dubbedAudioRef.current.currentTime < (timeline?.duration || 180)) {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => {});
              }
            } else {
              setIsPlaying(false);
            }
          }}
          className="absolute top-0 left-0 opacity-0 pointer-events-none w-1 h-1"
        />
        <canvas
          ref={canvasRef}
          onClick={togglePlay}
          onTouchEnd={togglePlay}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
          title="Click to play/pause • Click and drag up/down to reposition subtitles"
        />

        {videoError && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <p className="text-sm font-bold text-white">Media File Unavailable (HTTP 404)</p>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              This video file was cleared when the cloud server restarted. Please upload a new video to generate captions.
            </p>
          </div>
        )}

        {!isPlaying && !isRecording && (
          <div
            onClick={togglePlay}
            onTouchEnd={togglePlay}
            className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer backdrop-blur-[2px] transition-all hover:bg-black/20"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-xl shadow-yellow-500/20 scale-100 active:scale-95 sm:hover:scale-110 transition-transform">
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-black ml-1" />
            </div>
          </div>
        )}

        {isRecording && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 z-20">
            <Loader2 className="w-10 h-10 animate-spin text-yellow-400 mb-2" />
            <p className="text-sm font-bold text-white mb-1">Exporting Smooth {exportQuality} Reel...</p>
            <p className="text-xs text-yellow-400 font-mono mb-3">{recordProgress}% completed ({exportQuality} Ultra-HD Engine)</p>
            <button
              onClick={handleCancelExport}
              className="px-4 py-2 min-h-[40px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition"
            >
              Cancel / Close Overlay
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-md flex flex-col gap-2.5 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl transition-colors mx-auto">
        <input type="range" min="0" max={duration || 100} step="0.01" value={currentTime} onChange={handleSeek} disabled={isRecording}
          className="w-full h-2.5 sm:h-1.5 bg-slate-200 dark:bg-zinc-800 accent-yellow-500 dark:accent-yellow-400 rounded-lg cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button onClick={togglePlay} disabled={isRecording}
              className="p-2 sm:p-2 min-h-[38px] min-w-[38px] rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700/60 transition flex items-center justify-center gap-1 font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
              {isPlaying ? <Pause className="w-4 h-4 text-yellow-500 dark:text-yellow-400" /> : <Play className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />}
              <span className="hidden xs:inline">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button onClick={toggleMute} disabled={isRecording}
              className="p-2 sm:p-2 min-h-[38px] min-w-[38px] rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-700/60 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-500 dark:text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Custom Collapsible / Expandable Styled Speed Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSpeedOpen(!isSpeedOpen)}
                disabled={isRecording}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs border border-slate-200 dark:border-zinc-700/60 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Toggle playback speed menu"
              >
                <Gauge className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
                <span>{playbackRate}x</span>
              </button>

              {isSpeedOpen && (
                <div className="absolute bottom-full mb-2.5 left-0 z-30 p-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl flex items-center gap-1 animate-fadeIn">
                  {[0.25, 0.5, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        handleRateChange(rate);
                        setIsSpeedOpen(false);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition border ${
                        playbackRate === rate
                          ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 shadow-sm'
                          : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-600 dark:text-zinc-400 text-[11px] bg-slate-100 dark:bg-zinc-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-800">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Multi-Resolution Quality Split Dropdown Selector (480p, 720p, 1080p, 2K, 4K) */}
            <div className="relative flex items-center">
              <div className="flex items-center rounded-xl bg-yellow-500 dark:bg-yellow-400 text-black font-bold text-xs shadow-md shadow-yellow-500/10 overflow-hidden">
                <button
                  onClick={exportCaptionedVideo}
                  disabled={isRecording}
                  className="px-3 py-1.5 hover:bg-yellow-400 dark:hover:bg-yellow-300 transition flex items-center gap-1.5 border-r border-black/10 disabled:opacity-50"
                  title={`Export reel in ${exportQuality} resolution`}
                >
                  {isRecording ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Export {exportQuality}</span>
                </button>
                <button
                  onClick={() => setIsQualityOpen(!isQualityOpen)}
                  disabled={isRecording}
                  className="px-2 py-1.5 hover:bg-yellow-400 dark:hover:bg-yellow-300 transition flex items-center justify-center disabled:opacity-50"
                  title="Choose export resolution (480p to 4K)"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {isQualityOpen && (
                <div className="absolute bottom-full mb-2.5 right-0 z-30 p-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col gap-1 min-w-[150px] animate-fadeIn">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Export Resolution
                  </div>
                  {[
                    { key: '480p', label: '📱 480p SD (Fast)' },
                    { key: '720p', label: '🎬 720p HD' },
                    { key: '1080p', label: '✨ 1080p Full HD' },
                    { key: '2K', label: '🌟 2K QHD' },
                    { key: '4K', label: '🔥 4K Ultra HD' },
                  ].map((q) => (
                    <button
                      key={q.key}
                      type="button"
                      onClick={() => {
                        setExportQuality(q.key);
                        setIsQualityOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-between ${
                        exportQuality === q.key
                          ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold border border-yellow-500/40'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <span>{q.label}</span>
                      {exportQuality === q.key && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TRUE SUBMAGIC PRODUCTION RENDER ENGINE (Exact Box Layout Math)
// ═══════════════════════════════════════════════════════════════════════

const SOLID_BOX_PRESETS = {
  [THEME_PRESETS.HORMOZI]: '#22C55E',
  [THEME_PRESETS.HORMOZI_YELLOW]: '#EAB308',
  [THEME_PRESETS.HORMOZI_RED]: '#EF4444',
  [THEME_PRESETS.MRBEAST_PUNCH]: '#FACC15',
  [THEME_PRESETS.FIRE_RED]: '#EF4444',
  [THEME_PRESETS.ELECTRIC_CYAN]: '#06B6D4',
  [THEME_PRESETS.COMIC_YELLOW]: '#EAB308',
  [THEME_PRESETS.VIOLET_DREAM]: '#8B5CF6',
  [THEME_PRESETS.HOT_PINK]: '#EC4899',
  [THEME_PRESETS.ROYAL_BLUE]: '#2563EB',
  [THEME_PRESETS.TEAL_BREEZE]: '#0D9488',
  [THEME_PRESETS.ELECTRIC_LIME]: '#84CC16',
  [THEME_PRESETS.INDIGO_SKY]: '#4F46E5',
  [THEME_PRESETS.MINT_FRESH]: '#10B981',
  [THEME_PRESETS.TANGERINE_POP]: '#F97316',
  [THEME_PRESETS.CORAL_CRUSH]: '#F43F5E',
  [THEME_PRESETS.SUNSET_BURST]: '#EA580C',
  [THEME_PRESETS.ALI_ABDAAL]: '#0D9488',
  [THEME_PRESETS.DEV_INFLUENCER]: '#06B6D4',
  [THEME_PRESETS.TELUGU_RAMA]: '#22C55E',
  [THEME_PRESETS.SOUTH_ACTION]: '#EF4444',
};

const GLOW_PRESETS = {
  [THEME_PRESETS.NEON_GLOW]: '#06B6D4',
  [THEME_PRESETS.CYBER_PURPLE]: '#D946EF',
  [THEME_PRESETS.MATRIX_GREEN]: '#22C55E',
  [THEME_PRESETS.ICE_BLUE]: '#38BDF8',
  [THEME_PRESETS.AMBER_GLOW]: '#F59E0B',
  [THEME_PRESETS.RUBY_GLOW]: '#E11D48',
  [THEME_PRESETS.NEON_LEMON]: '#FACC15',
  [THEME_PRESETS.ROSE_GOLD]: '#FB7185',
  [THEME_PRESETS.SUBMAGIC_GLOW]: '#06B6D4',
  [THEME_PRESETS.NEON_ORANGE]: '#F97316',
  [THEME_PRESETS.NEON_LIME]: '#84CC16',
  [THEME_PRESETS.GOLD_LUXURY]: '#EAB308',
  [THEME_PRESETS.BOLLYWOOD_GOLD]: '#EAB308',
  [THEME_PRESETS.CYBER_PUNK_2077]: '#FACC15',
};

function renderTopHookBanner(ctx, topBanner, canvasW, canvasH) {
  if (!topBanner || !topBanner.enabled || !topBanner.text || !topBanner.text.trim()) return;

  const text = topBanner.text.trim().toUpperCase();
  const scaleRatio = (topBanner.fontSize || 48) / 48;
  const baseSize = Math.max(16, Math.round(canvasW * 0.045));
  const fontSize = Math.max(14, Math.round(baseSize * scaleRatio));

  const fontFamily = topBanner.fontFamily || 'Montserrat';
  const fontWeight = topBanner.fontWeight || '900';
  const bgColor = topBanner.backgroundColor || '#FFE600';
  const textColor = topBanner.textColor || '#000000';
  const textAlign = topBanner.textAlign || 'center';
  const posPctY = typeof topBanner.positionY === 'number' ? topBanner.positionY : 12;

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px '${fontFamily}', 'Noto Sans Telugu', 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const textW = metrics.width || (fontSize * text.length * 0.6);
  const padX = fontSize * 0.6;
  const padY = fontSize * 0.35;
  const rectW = Math.min(canvasW * 0.92, textW + padX * 2);
  const rectH = fontSize + padY * 2;

  const centerY = canvasH * (posPctY / 100);
  let centerX = canvasW / 2;

  if (textAlign === 'left') {
    centerX = (rectW / 2) + (canvasW * 0.04);
  } else if (textAlign === 'right') {
    centerX = canvasW - (rectW / 2) - (canvasW * 0.04);
  }

  const rectX = centerX - rectW / 2;
  const rectY = centerY - rectH / 2;
  const radius = Math.min(16, rectH / 2);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(rectX, rectY, rectW, rectH, radius);
  } else {
    ctx.rect(rectX, rectY, rectW, rectH);
  }
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = textColor;
  ctx.fillText(text, centerX, centerY);
  ctx.restore();
}

function renderSubmagicCaptions(ctx, segment, time, canvasW, canvasH, segAge, timeline) {
  if (!segment || !Array.isArray(segment.words) || segment.words.length === 0) return;
  renderCanvasSubtitles(ctx, canvasW, canvasH, time, [segment], timeline);
}


function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00.00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms < 10 ? '0' : ''}${ms}`;
}
