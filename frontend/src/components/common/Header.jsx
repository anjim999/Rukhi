import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, Video, FolderOpen, Sun, Moon, Menu, X, LogOut, ChevronDown, HelpCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function Header({ activeProject, onOpenTour }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, openAuthModal, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          to="/dashboard"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center text-black font-black shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-black" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              AutoCaptions
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                PRO STUDIO
              </span>
            </h1>
          </div>
        </Link>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-3">
          {activeProject && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/50 text-xs text-slate-700 dark:text-zinc-300">
              <Video className="w-3.5 h-3.5 text-yellow-500" />
              <span className="max-w-[180px] truncate font-medium">{activeProject.title}</span>
            </div>
          )}

          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              isDashboard
                ? 'bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-yellow-500" />
            Projects
          </button>

          {/* Product Tour Trigger */}
          <button
            onClick={onOpenTour}
            title="Product Tour"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/50 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-yellow-500 transition"
          >
            <HelpCircle className="w-4 h-4 text-yellow-500" />
            Tour
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Light/Dark Theme"
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/50 text-slate-700 dark:text-zinc-300 hover:text-yellow-500 transition group"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-yellow-400 group-hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 group-hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Auth Controls / User Profile Dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700/60 bg-slate-100/80 dark:bg-zinc-800/80 hover:border-yellow-500/50 transition"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-amber-400/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-yellow-500 text-black font-extrabold text-xs flex items-center justify-center shadow-sm">
                    {getInitials(user.name)}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-900 dark:text-white max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              </button>

              {userDropdownOpen && (
                <div
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-md shadow-yellow-500/20 hover:brightness-105 transition"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 shadow-xl">
          <button
            onClick={() => {
              navigate('/dashboard');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold text-sm"
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-yellow-500" />
              All Projects & Studio
            </span>
          </button>

          {user ? (
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200 text-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('register');
                }}
                className="flex-1 py-2 rounded-xl bg-yellow-500 text-black text-xs font-extrabold text-center"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
