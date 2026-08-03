import React, { useState, useEffect } from 'react';
import { Sparkles, UploadCloud, Wand2, Video, X, ChevronRight, ChevronLeft, CheckCircle2, HelpCircle } from 'lucide-react';

const TOUR_STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to AutoCaptions Pro Studio",
    badge: "STEP 1 OF 4",
    description: "Create viral Instagram Reels, YouTube Shorts, and TikTok clips with studio-quality kinetic captions in seconds.",
    highlight: "Bilingual Speech Recognition (English, Telugu, Hindi) & Auto-Timestamps",
  },
  {
    icon: UploadCloud,
    title: "Drop Your Video Clip",
    badge: "STEP 2 OF 4",
    description: "Upload any 9:16 vertical video up to 500MB. Our media worker processes audio streams with ultra-low latency.",
    highlight: "Supports MP4, MOV, WebM formats with automatic audio extraction",
  },
  {
    icon: Wand2,
    title: "Zero-Hallucination Social Pack",
    badge: "STEP 3 OF 4",
    description: "Generate post-ready Instagram & YouTube captions, titles, and viral hashtags strictly derived from spoken transcript.",
    highlight: "100% transcript accuracy with zero AI hallucinations",
  },
  {
    icon: Video,
    title: "Broadcast 60FPS MP4 Export",
    badge: "STEP 4 OF 4",
    description: "Render high-frame-rate H.264 MP4 videos directly using our FFmpeg hardware rendering pipeline.",
    highlight: "Custom style presets, font colors, animations, and position memory",
  },
];

export default function ProductTour({ isOpen, onClose, onOpenGuide }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const stepData = TOUR_STEPS[currentStep];
  const StepIcon = stepData.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem('rukhi_studio_tour_seen', 'true');
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden transition-all">
        
        {/* Top Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              {stepData.badge}
            </span>
          </div>

          <button
            onClick={() => {
              localStorage.setItem('rukhi_studio_tour_seen', 'true');
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center text-black shadow-lg shadow-yellow-500/20 shrink-0">
              <StepIcon className="w-6 h-6 fill-black" />
            </div>

            <div className="space-y-1.5 flex-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {stepData.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                {stepData.description}
              </p>
            </div>
          </div>

          {/* Highlight Callout */}
          <div className="p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0" />
            <span>{stepData.highlight}</span>
          </div>

          {/* Step Progress Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {TOUR_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-6 bg-yellow-500'
                    : 'w-2 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {onOpenGuide && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGuide();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-extrabold text-[11px] hover:bg-yellow-500/20 transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Know More</span>
              </button>
            )}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold text-xs shadow-md shadow-yellow-500/20 hover:brightness-105 transition cursor-pointer"
          >
            {isLastStep ? (
              'Start Creating'
            ) : (
              <>
                Next Step <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
