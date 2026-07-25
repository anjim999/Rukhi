import React, { useState } from 'react';
import Header from './components/common/Header';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'editor'
  const [activeProjectId, setActiveProjectId] = useState(null);

  const handleSelectProject = (projectId) => {
    setActiveProjectId(projectId);
    setCurrentView('editor');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Header
        currentView={currentView}
        setView={setCurrentView}
        activeProject={activeProjectId ? { id: activeProjectId, title: 'Active Reel' } : null}
      />

      <main className="flex-1 pb-12">
        {currentView === 'dashboard' ? (
          <DashboardPage onSelectProject={handleSelectProject} />
        ) : (
          <EditorPage
            projectId={activeProjectId}
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </main>
    </div>
  );
}
