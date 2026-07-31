import React from 'react';
import toast from 'react-hot-toast';
import SocialPackGeneratorModal from './SocialPackGeneratorModal';
import DubbingVoiceModal from './DubbingVoiceModal';
import FacelessGeneratorModal from './FacelessGeneratorModal';

export default function EditorModals({
  showSocialModal,
  setShowSocialModal,
  socialLoading,
  socialData,
  handleCopyAll,
  handleCopyIg,
  handleCopyYt,
  copiedIg,
  copiedYt,
  showDubbingModal,
  setShowDubbingModal,
  timeline,
  setTimeline,
  projectId,
  updateProjectTimeline,
  showFacelessModal,
  setShowFacelessModal,
}) {
  return (
    <>
      <SocialPackGeneratorModal
        isOpen={showSocialModal}
        onClose={() => setShowSocialModal(false)}
        socialLoading={socialLoading}
        socialData={socialData}
        handleCopyAll={handleCopyAll}
        handleCopyIg={handleCopyIg}
        handleCopyYt={handleCopyYt}
        copiedIg={copiedIg}
        copiedYt={copiedYt}
      />

      {/* AI Voice Studio & Dubbing Modal */}
      <DubbingVoiceModal
        isOpen={showDubbingModal}
        onClose={() => setShowDubbingModal(false)}
        initialText={timeline?.segments?.map((s) => s.text).join(' ') || ''}
        projectId={projectId}
        onApplyAudio={async (dubbingResult) => {
          if (!timeline) return;

          let updatedSegments = timeline.segments;
          if (dubbingResult.scriptText && Array.isArray(timeline.segments) && timeline.segments.length > 0) {
            const words = dubbingResult.scriptText.split(/\s+/).filter(Boolean);
            if (words.length > 0) {
              const totalSegs = timeline.segments.length;
              const baseWordsPerSeg = Math.floor(words.length / totalSegs);
              const remainder = words.length % totalSegs;

              let wordIndex = 0;
              updatedSegments = timeline.segments.map((seg, idx) => {
                const count = baseWordsPerSeg + (idx < remainder ? 1 : 0);
                const segWords = count > 0 && wordIndex < words.length 
                  ? words.slice(wordIndex, wordIndex + count) 
                  : (wordIndex < words.length ? [words[wordIndex++]] : [words[words.length - 1]]);

                if (count > 0 && wordIndex < words.length) {
                  wordIndex += count;
                }

                const segText = segWords.join(' ');
                const segDuration = Math.max(0.5, seg.end - seg.start);
                const wordDuration = segDuration / Math.max(1, segWords.length);

                return {
                  ...seg,
                  text: segText,
                  words: segWords.map((w, wIdx) => ({
                    id: `w_${seg.id}_${wIdx}_${Date.now()}`,
                    word: w,
                    start: Number((seg.start + wIdx * wordDuration).toFixed(2)),
                    end: Number((seg.start + (wIdx + 1) * wordDuration).toFixed(2)),
                  })),
                };
              });
            }
          }

          const updatedTimeline = {
            ...timeline,
            segments: updatedSegments,
            dubbedAudioUrl: dubbingResult.audioUrl,
            dubbedLanguage: dubbingResult.language,
            dubbedProvider: dubbingResult.provider,
          };
          setTimeline(updatedTimeline);

          try {
            await updateProjectTimeline(projectId, updatedTimeline);
            toast.success(`✨ Dubbed voiceover (${dubbingResult.language.toUpperCase()}) applied & saved to timeline!`);
          } catch (err) {
            console.error(err);
            toast.error(`Applied locally, but DB save failed: ${err.message}`);
          }
        }}
      />

      {/* Prompt-to-Video Faceless Reel Generator Modal */}
      <FacelessGeneratorModal
        isOpen={showFacelessModal}
        onClose={() => setShowFacelessModal(false)}
        onProjectCreated={(newProjectId) => {
          window.location.href = `/editor/${newProjectId}`;
        }}
      />
    </>
  );
}
