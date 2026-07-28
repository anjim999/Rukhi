import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Film, LifeBuoy, ShieldCheck, Search, RefreshCw, Crown, Award, CheckCircle } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
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

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">Master SaaS Control</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">rukhi.in Admin & Registration Analytics</h1>
          <p className="text-xs text-slate-400">Monitor live user registrations, subscriptions, and platform metrics</p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Registered Users</p>
              <h3 className="text-2xl font-extrabold text-white">{metrics.totalUsers}</h3>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">New Signups Today</p>
              <h3 className="text-2xl font-extrabold text-white">+{metrics.signupsToday}</h3>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Video Projects</p>
              <h3 className="text-2xl font-extrabold text-white">{metrics.totalProjects}</h3>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Open Support Tickets</p>
              <h3 className="text-2xl font-extrabold text-white">{metrics.openTickets}</h3>
            </div>
          </div>
        </div>
      )}

      {/* User Registration Table Section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Registered Users Management</span>
          </h2>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
              />
            </div>

            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro Unlimited</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">User Name & Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Current Plan</th>
                <th className="py-3.5 px-4">Credits Remaining</th>
                <th className="py-3.5 px-4">Registration Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No users found matching filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider ${
                        u.plan === 'pro'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : u.plan === 'starter'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.plan || 'free'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {u.credits >= 9000 ? '∞ Unlimited' : u.credits}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={u.plan || 'free'}
                        onChange={(e) => handleUpdateUserPlan(u.id, e.target.value)}
                        className="px-2 py-1 text-[11px] rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="free">Free Plan</option>
                        <option value="starter">Starter Plan (₹199)</option>
                        <option value="pro">Pro Plan (₹399)</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
