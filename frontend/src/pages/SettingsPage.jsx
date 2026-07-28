import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Sparkles, Key, Check, AlertCircle, Save, Settings as SettingsIcon, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import PricingModal from '../components/pricing/PricingModal';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();

  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // Preference state
  const [defaultLang, setDefaultLang] = useState('te');
  const [defaultResolution, setDefaultResolution] = useState('1080p');
  const [defaultFont, setDefaultFont] = useState('Montserrat');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.error('Display Name cannot be empty.');
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateProfile({ name: nameInput.trim() });
      toast.success('Profile details updated successfully!');
    } catch (_err) {
      toast.error('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (_err) {
      toast.error('Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const planBadgeColors = {
    pro: 'bg-gradient-to-r from-amber-500 to-indigo-500 text-black border-amber-500/40',
    starter: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    free: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 space-y-8 text-slate-900 dark:text-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon className="w-5 h-5 text-amber-500" />
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-500">Account & AI Settings</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Profile & Preferences</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Manage your personal profile, subscription plan, export credits, and default AI video settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: User Summary & Plan Card */}
        <div className="space-y-6 md:col-span-1">
          {/* User Info Box */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-yellow-500 to-amber-500 text-black font-black text-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{user?.name || 'User'}</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{user?.email || 'user@rukhi.in'}</p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <span className={`px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${planBadgeColors[user?.plan] || planBadgeColors.free}`}>
                {user?.plan === 'pro' ? '👑 Pro Unlimited' : user?.plan === 'starter' ? '⚡ Starter Creator' : 'Free Tier'}
              </span>
              {user?.role === 'admin' && (
                <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-black uppercase">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Current Active Subscription & Credits */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-zinc-950 border border-slate-800 text-white shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white">Active Subscription</h3>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Current Plan:</span>
                <span className="font-bold text-amber-400 capitalize">{user?.plan || 'Free Tier'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Available Credits:</span>
                <span className="font-bold text-emerald-400">{user?.credits !== undefined ? user.credits : 3} Videos</span>
              </div>
            </div>

            <button
              onClick={() => setPricingModalOpen(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>Upgrade Plan & Credits</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Profile Form & AI Preferences */}
        <div className="space-y-6 md:col-span-2">
          
          {/* Profile Name Edit */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Profile Information</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Update your account display name</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-amber-500 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'user@rukhi.in'}
                  className="w-full bg-slate-100 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800/60 rounded-2xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile || !nameInput.trim()}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* AI Default Preferences */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Video Preferences</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Set default parameters for automatic transcription & export</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Default Speech Language
                </label>
                <select
                  value={defaultLang}
                  onChange={(e) => setDefaultLang(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-amber-500 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
                >
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="tenglish">Tenglish (Telugu + English)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="hinglish">Hinglish (Hindi + English)</option>
                  <option value="en">English (US)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Default Export Quality
                </label>
                <select
                  value={defaultResolution}
                  onChange={(e) => setDefaultResolution(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-amber-500 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
                >
                  <option value="1080p">1080p Full HD (Fast)</option>
                  <option value="2K">2K Quad HD</option>
                  <option value="4K">4K 60FPS Ultra HD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password Security */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Security & Password</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Update your login security password</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters..."
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-amber-500 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || newPassword.length < 6}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 text-white font-extrabold text-xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  <Shield className="w-4 h-4" />
                  <span>{isUpdatingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        user={user}
      />
    </div>
  );
}
