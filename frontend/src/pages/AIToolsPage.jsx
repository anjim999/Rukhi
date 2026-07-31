import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacelessGeneratorModal from '../components/editor/FacelessGeneratorModal';
import DubbingVoiceModal from '../components/editor/DubbingVoiceModal';
import DemucsIsolatorModal from '../components/editor/DemucsIsolatorModal';
import VoiceCloningModal from '../components/editor/VoiceCloningModal';
import AIToolCardGrid from '../components/tools/AIToolCardGrid';
import AIToolsHeroSection from '../components/tools/AIToolsHeroSection';

export default function AIToolsPage() {
  const navigate = useNavigate();

  // Modals state
  const [facelessModalOpen, setFacelessModalOpen] = useState(false);
  const [dubbingModalOpen, setDubbingModalOpen] = useState(false);
  const [demucsModalOpen, setDemucsModalOpen] = useState(false);
  const [voiceCloningModalOpen, setVoiceCloningModalOpen] = useState(false);

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen text-slate-900 dark:text-zinc-100 transition-colors duration-300">
      <AIToolsHeroSection
        setFacelessModalOpen={setFacelessModalOpen}
        setDubbingModalOpen={setDubbingModalOpen}
        setVoiceCloningModalOpen={setVoiceCloningModalOpen}
      />

      {/* FEATURE GENERATOR SUITE GRID */}
      <section className="px-4 max-w-7xl mx-auto pb-16">
        <AIToolCardGrid
          setFacelessModalOpen={setFacelessModalOpen}
          setDubbingModalOpen={setDubbingModalOpen}
          setDemucsModalOpen={setDemucsModalOpen}
          setVoiceCloningModalOpen={setVoiceCloningModalOpen}
        />
      </section>

      {/* MODALS */}
      {facelessModalOpen && (
        <FacelessGeneratorModal
          isOpen={facelessModalOpen}
          onClose={() => setFacelessModalOpen(false)}
          onSuccess={(projId) => navigate(`/editor/${projId}`)}
        />
      )}

      {dubbingModalOpen && (
        <DubbingVoiceModal
          isOpen={dubbingModalOpen}
          onClose={() => setDubbingModalOpen(false)}
        />
      )}

      {demucsModalOpen && (
        <DemucsIsolatorModal
          isOpen={demucsModalOpen}
          onClose={() => setDemucsModalOpen(false)}
        />
      )}

      {voiceCloningModalOpen && (
        <VoiceCloningModal
          isOpen={voiceCloningModalOpen}
          onClose={() => setVoiceCloningModalOpen(false)}
        />
      )}
    </div>
  );
}
