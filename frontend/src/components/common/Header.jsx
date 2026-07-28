import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, Video, FolderOpen, Sun, Moon, Menu, X, LogOut, ChevronDown, HelpCircle, Pencil, User, Check, Wand2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function Header({ activeProject, onOpenTour }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, openAuthModal, logout, updateProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  // Profile Edit modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const isDashboard = location.pathname === '/dashboard';
  const isHome = location.pathname === '/';
  const isAITools = location.pathname === '/ai-studio';

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleOpenProfileModal = () => {
    setUserDropdownOpen(false);
    setProfileNameInput(user?.name || '');
    setShowProfileModal(true);
  };

  const handleSaveProfileName = async () => {
    if (!profileNameInput.trim()) return;
    setUpdatingProfile(true);
    try {
      await updateProfile(profileNameInput.trim());
      setShowProfileModal(false);
    } catch (_err) {
      // Toast handles error
    } finally {
      setUpdatingProfile(false);
    }
  };

  return (
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur sticky top-0 z-50 transition-colors duration-300 w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between w-full">
        <Link 
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center text-black font-black shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-black" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              RoCaps
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
            onClick={() => navigate('/')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              isHome
                ? 'bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              isDashboard
                ? 'bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-yellow-500" />
            Studio Dashboard
          </button>

          <button
            onClick={() => navigate('/ai-studio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              isAITools
                ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold border border-yellow-500/30'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Wand2 className="w-4 h-4 text-yellow-500" />
            <span>AI Studio Hub</span>
            <span className="bg-yellow-500 text-black text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full">NEW</span>
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
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700/60 bg-slate-100/80 dark:bg-zinc-800/80 hover:border-yellow-500/50 transition cursor-pointer"
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
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={handleOpenProfileModal}
                      className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-yellow-500" />
                      Change Profile Name
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
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
            aria-label="Toggle Theme"
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 active:scale-95 transition"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open Menu"
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 active:scale-95 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-4 space-y-3 shadow-2xl animate-fadeIn">
          <button
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-3.5 min-h-[48px] rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold text-sm active:scale-[0.99] transition"
          >
            <span className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              Home Page
            </span>
          </button>

          <button
            onClick={() => {
              navigate('/dashboard');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-3.5 min-h-[48px] rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold text-sm active:scale-[0.99] transition"
          >
            <span className="flex items-center gap-2.5">
              <FolderOpen className="w-5 h-5 text-yellow-500" />
              Studio Dashboard & Projects
            </span>
          </button>

          <button
            onClick={() => {
              navigate('/ai-studio');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-3.5 min-h-[48px] rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-extrabold text-sm active:scale-[0.99] transition"
          >
            <span className="flex items-center gap-2.5">
              <Wand2 className="w-5 h-5 text-yellow-500" />
              AI Studio Hub
            </span>
            <span className="bg-yellow-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
              NEW
            </span>
          </button>

          {user ? (
            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="px-4 py-2 min-h-[40px] text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-500/20 rounded-xl active:scale-95 transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="flex-1 py-3 min-h-[44px] rounded-2xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200 text-center active:scale-95 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('register');
                }}
                className="flex-1 py-3 min-h-[44px] rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-extrabold text-center shadow-lg shadow-yellow-500/20 active:scale-95 transition"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      )}
      {/* Profile Display Name Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
              <User className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Change Profile Name</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Update your public display name for your account.</p>
            </div>

            <input
              type="text"
              value={profileNameInput}
              onChange={(e) => setProfileNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveProfileName();
                if (e.key === 'Escape') setShowProfileModal(false);
              }}
              autoFocus
              placeholder="Enter your name..."
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-yellow-500 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none"
            />

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowProfileModal(false)}
                disabled={updatingProfile}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-white font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfileName}
                disabled={updatingProfile || !profileNameInput.trim()}
                className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs transition shadow-lg shadow-yellow-500/10 disabled:opacity-50"
              >
                {updatingProfile ? 'Saving...' : 'Update Name'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
