import React, { useState, useEffect } from 'react';
import VideoDropzone from '../components/upload/VideoDropzone';
import { listProjects } from '../services/projectService';
import { Film, Clock, Sparkles, Plus, PlayCircle } from 'lucide-react';

export default function DashboardPage({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const response = await listProjects();
      if (response.success) {
        setProjects(response.data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Hero Welcome Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          AI Kinetic Caption Generator
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Create Viral Reels & Shorts with AI Subtitles
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Upload any vertical clip. Our speech intelligence engine extracts timestamps, handles bilingual speech (Telugu / Hindi / English), and renders studio-quality kinetic captions.
        </p>
      </div>

      {/* Video Dropzone */}
      <VideoDropzone
        onProjectCreated={(project) => {
          onSelectProject(project.id);
        }}
      />

      {/* Recent Projects Section */}
      <div className="space-y-4 pt-6 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Film className="w-4 h-4 text-yellow-400" />
            Recent Projects
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            {projects.length} videos
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-center text-zinc-400 text-xs">
            No projects yet. Drop a video clip above to generate your first AI caption reel!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="group p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-500/40 hover:bg-zinc-850 transition cursor-pointer space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-yellow-400 transition">
                    {project.title}
                  </h4>
                  <StatusBadge status={project.status} />
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pt-2 border-t border-zinc-800/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {project.duration ? `${Math.round(project.duration)}s` : '--'}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <span
      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
        isCompleted
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : isFailed
          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse'
      }`}
    >
      {status}
    </span>
  );
}
