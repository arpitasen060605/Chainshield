import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import {
  getPlatformStats,
  getPlatformCompanies,
  getPendingCompanyAdmins,
  updateCompanyAdminStatus,
} from '../../services/platformService';
import {
  Building2,
  UserCheck,
  UserX,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Calendar,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function PlatformAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, companiesRes, pendingRes] = await Promise.all([
        getPlatformStats(),
        getPlatformCompanies(),
        getPendingCompanyAdmins(),
      ]);

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
      if (companiesRes.success && Array.isArray(companiesRes.companies)) {
        setCompanies(companiesRes.companies);
      }
      if (pendingRes.success && Array.isArray(pendingRes.pendingAdmins)) {
        setPendingAdmins(pendingRes.pendingAdmins);
      }
    } catch (err) {
      console.error('[PlatformAdminDashboard] Fetch error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load platform statistics and company list.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (adminId, name, newStatus, companyCode, companyId) => {
    try {
      setUpdatingId(adminId);
      const res = await updateCompanyAdminStatus(adminId, newStatus);
      if (res.success) {
        showToast(
          newStatus === 'active'
            ? `Company Admin ${name} approved successfully.`
            : `Company Admin ${name} updated to ${newStatus}.`,
          'success'
        );

        // Remove from pendingAdmins list
        setPendingAdmins((prev) => prev.filter((adm) => (adm._id || adm.id) !== adminId));

        // Update companies list in React state
        setCompanies((prevCompanies) =>
          prevCompanies.map((comp) => {
            const matchesComp =
              (companyId && (comp._id === companyId || comp.id === companyId)) ||
              (companyCode && comp.code === companyCode);

            const hasMatchingAdmin =
              comp.companyAdmins?.some((a) => (a._id || a.id) === adminId) ||
              (comp.companyAdmin && (comp.companyAdmin._id || comp.companyAdmin.id) === adminId);

            if (matchesComp || hasMatchingAdmin) {
              const updatedAdmins = comp.companyAdmins?.map((a) =>
                (a._id || a.id) === adminId ? { ...a, status: newStatus, isApproved: newStatus === 'active' } : a
              );

              return {
                ...comp,
                status: newStatus === 'active' ? 'active' : comp.status,
                adminStatus: newStatus,
                ...(updatedAdmins ? { companyAdmins: updatedAdmins } : {}),
                ...(comp.companyAdmin && (comp.companyAdmin._id || comp.companyAdmin.id) === adminId
                  ? { companyAdmin: { ...comp.companyAdmin, status: newStatus, isApproved: newStatus === 'active' } }
                  : {}),
              };
            }
            return comp;
          })
        );

        // Update stats state
        setStats((prev) => {
          if (!prev) return prev;
          const isAct = newStatus === 'active';
          const isRej = newStatus === 'rejected';
          return {
            ...prev,
            pendingCompanyAdmins: Math.max(0, (prev.pendingCompanyAdmins || 0) - 1),
            activeCompanyAdmins: isAct ? (prev.activeCompanyAdmins || 0) + 1 : prev.activeCompanyAdmins,
            inactiveCompanyAdmins: isRej ? (prev.inactiveCompanyAdmins || 0) + 1 : prev.inactiveCompanyAdmins,
          };
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to update ${name}.`;
      showToast(msg, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalCompanies = stats?.totalCompanies ?? 0;
  const activeCompanyAdmins = stats?.activeCompanyAdmins ?? 0;
  const inactiveCompanyAdmins = stats?.inactiveCompanyAdmins ?? 0;
  const pendingCompanyAdmins = stats?.pendingCompanyAdmins ?? 0;

  const statCards = [
    {
      title: 'Total Companies',
      value: totalCompanies,
      icon: Building2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Active Company Admins',
      value: activeCompanyAdmins,
      icon: UserCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      title: 'Inactive Company Admins',
      value: inactiveCompanyAdmins,
      icon: UserX,
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20',
    },
    {
      title: 'Pending Company Admins',
      value: pendingCompanyAdmins,
      icon: UserPlus,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
  ];

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Clock size={12} />
          Pending
        </span>
      );
    }
    if (s === 'inactive' || s === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30">
          Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30">
        {status || 'N/A'}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-blue-500" size={32} />
              Platform Administration Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
              Global multi-company management & platform admin telemetry
            </p>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-[#0c1929] hover:bg-[#13243a] text-slate-300 hover:text-white border border-[#1e344f] rounded-xl text-xs font-mono transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Telemetry
          </button>
        </div>

        {/* Toast Alert Banner */}
        {toast && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between transition shadow-lg ${
              toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{toast.msg}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-8 bg-[#07111e] border border-[#1b2b40] rounded-2xl text-slate-400 flex items-center justify-center gap-3 font-mono text-xs">
            <RefreshCw size={18} className="animate-spin text-blue-400" />
            Loading Platform Telemetry & Companies...
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono flex items-center gap-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Top Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={card.title}
                    className={`p-5 rounded-2xl bg-[#07111e] border ${card.borderColor} flex items-center justify-between transition hover:border-blue-500/40`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-400 font-mono">
                        {card.title}
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {card.value}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center ${card.color}`}
                    >
                      <IconComponent size={24} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pending Company Admin Approvals Section */}
            <div className="bg-[#0b1b2d] border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-amber-300 flex items-center gap-2">
                    <Clock size={18} className="text-amber-400" />
                    Pending Company Admin Registrations
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Company Admin accounts awaiting Platform Admin verification and activation
                  </p>
                </div>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-mono font-bold">
                  {pendingAdmins.length} Pending
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1b2b40] bg-[#07111e] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-5">Admin Name</th>
                      <th className="py-3.5 px-5">Admin Email</th>
                      <th className="py-3.5 px-5">Target Company</th>
                      <th className="py-3.5 px-5">Company Code</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1b2b40] text-xs font-mono">
                    {pendingAdmins.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 px-5 text-center text-slate-400 italic">
                          No pending Company Admin registrations currently awaiting approval.
                        </td>
                      </tr>
                    ) : (
                      pendingAdmins.map((adm) => {
                        const targetId = adm._id || adm.id;
                        const isUpdating = updatingId === targetId;

                        return (
                          <tr key={targetId} className="hover:bg-[#0e223b]/50 transition">
                            <td className="py-4 px-5 font-semibold text-white">{adm.name}</td>
                            <td className="py-4 px-5 text-slate-300">{adm.email}</td>
                            <td className="py-4 px-5 text-slate-200">{adm.companyName}</td>
                            <td className="py-4 px-5">
                              <span className="px-2 py-0.5 bg-[#0e1e33] border border-[#233a59] rounded text-blue-300 font-bold">
                                {adm.companyCode}
                              </span>
                            </td>
                            <td className="py-4 px-5">{getStatusBadge(adm.status)}</td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleUpdateStatus(targetId, adm.name, 'active', adm.companyCode, adm.companyId);
                                  }}
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={14} />
                                  )}
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleUpdateStatus(targetId, adm.name, 'rejected', adm.companyCode, adm.companyId);
                                  }}
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                  ) : (
                                    <XCircle size={14} />
                                  )}
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Company List Table Section */}
            <div className="bg-[#07111e] border border-[#1b2b40] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-[#1b2b40] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Building2 size={18} className="text-blue-400" />
                    Registered Companies Directory
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Showing all registered corporate entities on the ChainShield platform
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-mono">
                  {companies.length} Companies
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1b2b40] bg-[#050d18] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-5">Company Name</th>
                      <th className="py-3.5 px-5">Company Code</th>
                      <th className="py-3.5 px-5">Company Status</th>
                      <th className="py-3.5 px-5">Company Admin</th>
                      <th className="py-3.5 px-5">Admin Email</th>
                      <th className="py-3.5 px-5">Admin Status</th>
                      <th className="py-3.5 px-5">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1b2b40] text-xs font-mono">
                    {companies.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 px-5 text-center text-slate-500"
                        >
                          No companies registered in the platform database yet.
                        </td>
                      </tr>
                    ) : (
                      companies.map((c) => (
                        <tr
                          key={c._id || c.id}
                          className="hover:bg-[#0a1829]/50 transition"
                        >
                          <td className="py-4 px-5 font-semibold text-white">
                            {c.name}
                          </td>
                          <td className="py-4 px-5">
                            <span className="px-2 py-0.5 bg-[#0e1e33] border border-[#233a59] rounded text-blue-300 font-bold">
                              {c.code}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            {getStatusBadge(c.status)}
                          </td>
                          <td className="py-4 px-5 text-slate-200">
                            {(() => {
                              const admins = c.companyAdmins && c.companyAdmins.length > 0 ? c.companyAdmins : (c.companyAdmin ? [c.companyAdmin] : []);
                              if (admins.length === 0) {
                                return <span className="text-slate-500 italic">No Admin Assigned</span>;
                              }
                              return (
                                <div className="space-y-2">
                                  {admins.map((adm) => (
                                    <div key={adm._id || adm.id || adm.email} className="flex items-center gap-1.5">
                                      <Shield size={13} className="text-blue-400 shrink-0" />
                                      <span className="truncate">{adm.name}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-4 px-5 text-slate-400">
                            {(() => {
                              const admins = c.companyAdmins && c.companyAdmins.length > 0 ? c.companyAdmins : (c.companyAdmin ? [c.companyAdmin] : []);
                              if (admins.length === 0) {
                                return 'N/A';
                              }
                              return (
                                <div className="space-y-2">
                                  {admins.map((adm) => (
                                    <div key={adm._id || adm.id || adm.email} className="flex items-center gap-1.5">
                                      <Mail size={13} className="text-slate-500 shrink-0" />
                                      <span className="truncate">{adm.email}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-4 px-5">
                            {(() => {
                              const admins = c.companyAdmins && c.companyAdmins.length > 0 ? c.companyAdmins : (c.companyAdmin ? [c.companyAdmin] : []);
                              if (admins.length === 0) {
                                return getStatusBadge(c.adminStatus);
                              }
                              return (
                                <div className="space-y-2">
                                  {admins.map((adm) => (
                                    <div key={adm._id || adm.id || adm.email}>
                                      {getStatusBadge(adm.status)}
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-4 px-5 text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-500" />
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
