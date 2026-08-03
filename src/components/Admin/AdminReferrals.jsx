import React, { useState, useEffect } from 'react';
import { FaSync, FaSpinner, FaSearch, FaUsers, FaMoneyBillWave, FaLink, FaChevronDown, FaChevronUp, FaCopy } from 'react-icons/fa';
import api from '../../utils/api';

export const AdminReferrals = () => {
    const [loading, setLoading] = useState(true);
    const [referralData, setReferralData] = useState([]);
    const [summary, setSummary] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUser, setExpandedUser] = useState(null);

    const loadReferrals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/referrals');
            if (res.success) {
                setReferralData(res.referral_stats || []);
                setSummary(res.summary || {});
            }
        } catch (err) {
            console.error('Failed to load referrals:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReferrals();
    }, []);

    const filtered = referralData.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.promotion_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 p-2 rounded-xl"><FaLink className="text-blue-600" /></div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Total Codes</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{summary.total_users_with_codes || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-100 p-2 rounded-xl"><FaUsers className="text-purple-600" /></div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Total Referrals</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{summary.total_referrals || 0}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-100 p-2 rounded-xl"><FaMoneyBillWave className="text-green-600" /></div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Total Paid</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{summary.total_commissions_paid || 0} ETB</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-amber-100 p-2 rounded-xl"><FaMoneyBillWave className="text-amber-600" /></div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Commission Records</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{summary.total_commission_records || 0}</p>
                </div>
            </div>

            {/* Search & Refresh */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or promotion code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>
                    <button
                        onClick={loadReferrals}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shrink-0"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <FaSpinner className="text-3xl text-blue-600 animate-spin" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">User</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Promotion Code</th>
                                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Referrals</th>
                                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Earned</th>
                                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Joined</th>
                                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-10 text-gray-400 text-sm">
                                            No referral data found.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(user => (
                                        <React.Fragment key={user.id}>
                                            <tr className="hover:bg-gray-50/50 transition">
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-sm text-gray-900">{user.full_name || 'N/A'}</p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 font-mono font-bold text-sm rounded-lg border border-blue-200">
                                                        {user.promotion_code}
                                                        <button
                                                            onClick={() => {
                                                                if (navigator.clipboard && window.isSecureContext) {
                                                                    navigator.clipboard.writeText(user.promotion_code);
                                                                } else {
                                                                    const textArea = document.createElement("textarea");
                                                                    textArea.value = user.promotion_code;
                                                                    textArea.style.position = "absolute";
                                                                    textArea.style.left = "-999999px";
                                                                    document.body.appendChild(textArea);
                                                                    textArea.select();
                                                                    try { document.execCommand('copy'); } catch(e) {}
                                                                    textArea.remove();
                                                                }
                                                            }}
                                                            className="text-blue-400 hover:text-blue-600 transition"
                                                            title="Copy code"
                                                        >
                                                            <FaCopy className="text-xs" />
                                                        </button>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${user.referrals_count > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>
                                                        {user.referrals_count}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`font-bold text-sm ${user.total_earned > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {user.total_earned} ETB
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-xs text-gray-500">
                                                    {formatDate(user.created_at)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {(user.referrals_count > 0 || user.commissions?.length > 0) ? (
                                                        <button
                                                            onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                                                            className="text-blue-600 hover:text-blue-800 transition"
                                                        >
                                                            {expandedUser === user.id ? <FaChevronUp /> : <FaChevronDown />}
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                            {/* Expanded Row */}
                                            {expandedUser === user.id && (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-4 bg-gray-50/80">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {user.referred_users?.length > 0 && (
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">Referred Users</p>
                                                                    <div className="space-y-2">
                                                                        {user.referred_users.map(ref => (
                                                                            <div key={ref.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                                                                                <div>
                                                                                    <p className="text-sm font-bold text-gray-800">{ref.full_name}</p>
                                                                                    <p className="text-xs text-gray-400">{ref.email}</p>
                                                                                </div>
                                                                                <span className="text-xs text-gray-400">{formatDate(ref.created_at)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {user.commissions?.length > 0 && (
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">Commission History</p>
                                                                    <div className="space-y-2">
                                                                        {user.commissions.map(c => (
                                                                            <div key={c.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                                                                                <div>
                                                                                    <p className="text-sm font-bold text-green-600">{c.amount} ETB</p>
                                                                                    <p className="text-xs text-gray-400">Status: {c.status}</p>
                                                                                </div>
                                                                                <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReferrals;
