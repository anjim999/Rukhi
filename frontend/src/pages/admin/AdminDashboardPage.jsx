import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Film,
  LifeBuoy,
  ShieldCheck,
  Search,
  RefreshCw,
  Crown,
  Award,
  CheckCircle,
  Sparkles,
  Video,
  Mic,
  Filter,
  XCircle,
  DollarSign,
  Zap,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const PLAN_BADGES = {
  free: {
    label: 'Free (₹0)',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: Users,
    color: 'text-slate-400',
  },
  basic: {
    label: 'Basic Captions (₹79)',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: Sparkles,
    color: 'text-blue-400',
  },
  plus: {
    label: 'Plus 30s Reel (₹199)',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: Video,
    color: 'text-purple-400',
  },
  starter: {
    label: 'Plus 30s Reel (₹199)',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: Video,
    color: 'text-purple-400',
  },
  pro: {
    label: 'Pro 60s Reel (₹299)',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Crown,
    color: 'text-amber-400',
  },
  dubbing_studio: {
    label: 'Dubbing Studio (₹399)',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: Mic,
    color: 'text-emerald-400',
  },
};

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, usersRes] = await Promise.all([
        axiosClient.get('/admin/analytics'),
        axiosClient.get(`/admin/users?search=${encodeURIComponent(search)}&plan=${selectedPlan}`),
      ]);

      if (analyticsRes.data?.success) {
        setMetrics(analyticsRes.data.metrics);
      }
      if (usersRes.data?.success) {
        setUsers(usersRes.data.users);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load admin analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [search, selectedPlan]);

  const handleUpdateUserPlan = async (userId, newPlan) => {
    try {
      const res = await axiosClient.patch(`/admin/users/${userId}`, { plan: newPlan });
      if (res.data?.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert('Failed to update user plan');
    }
  };

  const handleToggleAdminRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await axiosClient.patch(`/admin/users/${userId}`, { role: newRole });
      if (res.data?.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert('Failed to toggle admin role');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedPlan('');
    setSelectedRole('');
  };

  const filteredUsers = users.filter((u) => {
    if (selectedRole && (u.role || 'user') !== selectedRole) return false;
    return true;
  });

  const calculateMRR = () => {
    if (!metrics?.planBreakdown) return 0;
    const { free = 0, basic = 0, starter = 0, plus = 0, pro = 0, dubbing_studio = 0 } = metrics.planBreakdown;
    return basic * 79 + (starter + plus) * 199 + pro * 299 + dubbing_studio * 399;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">Rukhi.in Master SaaS Control</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Admin & Platform Control Center</h1>
          <p className="text-xs text-slate-400">Monitor live user signups, subscription revenue, GCP credit protection, and active tier badges</p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Analytics</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Financial & Platform Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Est. Monthly Revenue</p>
              <h3 className="text-2xl font-extrabold text-white">₹{calculateMRR().toLocaleString()}</h3>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Registered Users</p>
              <h3 className="text-2xl font-extrabold text-white">{metrics.totalUsers}</h3>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">New Signups Today</p>
              <h3 className="text-2xl font-extrabold text-white">+{metrics.signupsToday}</h3>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Video Projects</p>
              <h3 className="text-2xl font-extrabold text-white">{metrics.totalProjects}</h3>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Credit Guard Status</p>
              <h3 className="text-sm font-extrabold text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle className="w-4 h-4" /> 100% Protected
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* User Management Section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>User Accounts & Tier Gating Directory</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage user tiers, badges, access controls, and administrative roles</p>
          </div>

          {/* Advanced Multi-Filter Control Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="bg-transparent py-1 pr-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">All Plan Tiers</option>
                <option value="free" className="bg-slate-900">Free Plan (₹0)</option>
                <option value="basic" className="bg-slate-900">Basic Captions (₹79)</option>
                <option value="plus" className="bg-slate-900">Plus 30s Reel (₹199)</option>
                <option value="starter" className="bg-slate-900">Plus 30s Reel (₹199)</option>
                <option value="pro" className="bg-slate-900">Pro 60s Reel (₹299)</option>
                <option value="dubbing_studio" className="bg-slate-900">Dubbing Studio (₹399)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-transparent py-1 px-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">All Roles</option>
                <option value="user" className="bg-slate-900">Customers (User)</option>
                <option value="admin" className="bg-slate-900">Admins</option>
              </select>
            </div>

            {(search || selectedPlan || selectedRole) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">Role Badge</th>
                <th className="py-3.5 px-4">Subscription Tier Badge</th>
                <th className="py-3.5 px-4">Account Credits</th>
                <th className="py-3.5 px-4">Registration Date</th>
                <th className="py-3.5 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No registered users match your selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const planKey = (u.plan || 'free').toLowerCase();
                  const badge = PLAN_BADGES[planKey] || PLAN_BADGES.free;
                  const IconComp = badge.icon;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{u.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleAdminRole(u.id, u.role)}
                          title="Click to toggle admin role"
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                            u.role === 'admin'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{u.role === 'admin' ? 'Master Admin' : 'Customer User'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-extrabold border ${badge.badgeClass}`}
                        >
                          <IconComp className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {u.credits >= 9000 ? '∞ Unlimited' : `${u.credits} credits`}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={planKey}
                          onChange={(e) => handleUpdateUserPlan(u.id, e.target.value)}
                          className="px-2.5 py-1 text-[11px] rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                        >
                          <option value="free">Free (₹0)</option>
                          <option value="basic">Basic Captions (₹79)</option>
                          <option value="plus">Plus 30s Reel (₹199)</option>
                          <option value="pro">Pro 60s Reel (₹299)</option>
                          <option value="dubbing_studio">Dubbing Studio (₹399)</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
