import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, Video, FolderOpen, Sun, Moon, Menu, X, LogOut, ChevronDown, HelpCircle, Pencil, User, Check, Wand2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SupportModal from './SupportModal';
import PricingModal from '../pricing/PricingModal';
import LogoutConfirmModal from './LogoutConfirmModal';
import CreatorGuideModal from './CreatorGuideModal';
import FeedbackModal from './FeedbackModal';
import UserProfileDropdown from './UserProfileDropdown';
import HeaderNavLinks from './HeaderNavLinks';
import HeaderMobileDrawer from './HeaderMobileDrawer';

export default function Header({ activeProject, onOpenTour }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, openAuthModal, logout, updateProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
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
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between w-full">
        {/* Brand Logo & Title */}
        <Link 
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <img
            src="/favicon.svg"
            alt="rukhi.in logo"
            className="w-11 h-11 rounded-2xl shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform object-cover"
          />
          <h1 className="font-black text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white flex items-center">
            rukhi<span className="text-yellow-500">.in</span>
          </h1>
        </Link>

        <HeaderNavLinks
          isDashboard={isDashboard}
          isAITools={isAITools}
          navigate={navigate}
          setShowPricingModal={setShowPricingModal}
          setShowGuideModal={setShowGuideModal}
        />

        {/* Right Section: Controls & Profile */}
        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700/80 text-slate-600 dark:text-zinc-300 transition cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>

          {/* User Profile Dropdown */}
          {user ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700/60 bg-slate-100/80 dark:bg-zinc-800/80 hover:border-yellow-500/50 transition cursor-pointer"
              >
                {(user.avatar_url || user.avatar || user.picture) ? (
                  <img
                    src={user.avatar_url || user.avatar || user.picture}
                    alt={user.name || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-amber-400/50"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                {!(user.avatar_url || user.avatar || user.picture) && (
                  <div className="w-7 h-7 rounded-full bg-yellow-500 text-black font-extrabold text-xs flex items-center justify-center shadow-sm">
                    {getInitials(user.name)}
                  </div>
                )}

                <span className="text-xs font-bold text-slate-900 dark:text-white max-w-[90px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              </button>

              {userDropdownOpen && (
                <UserProfileDropdown
                  user={user}
                  onClose={() => setUserDropdownOpen(false)}
                  navigate={navigate}
                  setShowPricingModal={setShowPricingModal}
                  setShowFeedbackModal={setShowFeedbackModal}
                  onOpenTour={onOpenTour}
                  setShowSupportModal={setShowSupportModal}
                  handleOpenProfileModal={handleOpenProfileModal}
                  setShowLogoutModal={setShowLogoutModal}
                />
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

      <HeaderMobileDrawer
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        navigate={navigate}
        user={user}
        setShowLogoutModal={setShowLogoutModal}
        openAuthModal={openAuthModal}
      />
      {/* Profile Display Name Edit Modal */}
      {showProfileModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
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
        </div>,
        document.body
      )}

      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        user={user}
      />

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        user={user}
      />

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
      />

      <CreatorGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        user={user}
      />
    </header>
  );
}
