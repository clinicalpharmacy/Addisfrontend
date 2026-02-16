import React, { useState, useMemo } from 'react';
import { FaBuilding, FaUser, FaCheckCircle, FaTimesCircle, FaClock, FaSearch, FaRedo } from 'react-icons/fa';

export const AdminSubscriptions = ({ subscriptions, loading, onRefresh, users, companies }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired

    // Receive users and companies as well to perform a "deep check" for active subs without history records
    const subscriptionData = useMemo(() => {
        const data = [];
        const processedEntityIds = new Set();

        // 1. Process formal subscription history records
        if (subscriptions && Array.isArray(subscriptions)) {
            subscriptions.forEach(sub => {
                let name = 'N/A';
                let email = 'N/A';
                let type = 'Individual';

                if (sub.users) {
                    name = sub.users.full_name || 'Individual User';
                    email = sub.users.email;
                    type = 'Individual';
                }

                if (sub.companies) {
                    name = sub.companies.company_name || name;
                    email = sub.companies.email || email;
                    type = 'Company';
                } else if (sub.company_id && !sub.users) {
                    name = `Company ID: ${sub.company_id}`;
                    type = 'Company';
                }

                data.push({
                    id: sub.id,
                    entityId: sub.user_id || sub.company_id,
                    name,
                    email,
                    type,
                    plan: sub.plan_name || sub.plan_id || 'Pro',
                    status: sub.status || 'inactive',
                    expiry: sub.expiry_date || sub.end_date,
                    created_at: sub.created_at
                });
                processedEntityIds.add(sub.user_id || sub.company_id);
            });
        }

        // 2. Perform "Deep Check": Find active users/companies who might not have a record in the subscriptions table
        if (users && Array.isArray(users)) {
            users.filter(u => u.subscription_status === 'active' && !processedEntityIds.has(u.id)).forEach(user => {
                data.push({
                    id: `user-active-${user.id}`,
                    entityId: user.id,
                    name: user.full_name,
                    email: user.email,
                    type: 'Individual',
                    plan: user.subscription_plan || 'Active',
                    status: 'active',
                    expiry: user.subscription_end_date,
                    created_at: user.created_at
                });
            });
        }

        if (companies && Array.isArray(companies)) {
            companies.filter(c => c.subscription_status === 'active' && !processedEntityIds.has(c.id)).forEach(company => {
                data.push({
                    id: `comp-active-${company.id}`,
                    entityId: company.id,
                    name: company.company_name,
                    email: company.email,
                    type: 'Company',
                    plan: company.subscription_plan || 'Active',
                    status: 'active',
                    expiry: company.subscription_end_date,
                    created_at: company.created_at
                });
            });
        }

        return data;
    }, [subscriptions, users, companies]);

    // Filter Logic
    const filteredData = subscriptionData.filter(item => {
        const matchesSearch =
            (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && item.status === 'active') ||
            (filterStatus === 'inactive' && item.status !== 'active');

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'trial': return 'bg-blue-100 text-blue-800';
            case 'expired': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const calculateDaysRemaining = (expiryDate) => {
        if (!expiryDate) return null;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading && (!subscriptions || subscriptions.length === 0)) {
        return (
            <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100 font-medium">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Fetching all subscription records...
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-12">
            {/* Subscription Control Center */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-5 sm:p-6 rounded-[24px] shadow-sm border border-gray-100">
                <div className="flex-1 w-full">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <FaClock className="text-indigo-600 text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">Revenue Governance</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active account oversight.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col xs:flex-row items-center gap-2.5 w-full sm:w-auto">
                    <div className="relative w-full sm:w-56 group">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors text-[10px]" />
                        <input
                            type="text"
                            placeholder="Filter by name, email..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full xs:w-auto">
                        <div className="relative flex-1 xs:flex-none">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-3 pr-8 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs font-black appearance-none cursor-pointer uppercase tracking-tighter"
                            >
                                <option value="all">Every Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Expired Only</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">▼</div>
                        </div>

                        <button
                            onClick={onRefresh}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-100 active:scale-95"
                            title="Refresh Ledger"
                        >
                            <FaRedo className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="min-w-0">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 truncate">Active Nodes</p>
                        <p className="text-2xl sm:text-4xl font-black text-gray-900 leading-none">
                            {subscriptionData.filter(i => i.status === 'active').length}
                        </p>
                    </div>
                    <div className="p-3.5 bg-green-50 text-green-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner">
                        <FaCheckCircle className="text-lg" />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="min-w-0">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 truncate">Enterprise</p>
                        <p className="text-2xl sm:text-4xl font-black text-gray-900 leading-none">
                            {subscriptionData.filter(i => i.type === 'Company').length}
                        </p>
                    </div>
                    <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner">
                        <FaBuilding className="text-lg" />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all hover:-translate-y-1 col-span-2 sm:col-span-1">
                    <div className="min-w-0">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 truncate">Total History</p>
                        <p className="text-2xl sm:text-4xl font-black text-gray-900 leading-none">{subscriptionData.length}</p>
                    </div>
                    <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner">
                        <FaUser className="text-lg" />
                    </div>
                </div>
            </div>

            {/* Subscriptions Grid */}
            {filteredData.length > 0 ? (
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredData.map((item) => {
                        const daysRemaining = calculateDaysRemaining(item.expiry);
                        const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7;

                        return (
                            <div key={item.id} className="group bg-white rounded-[28px] shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col hover:-translate-y-1">
                                <div className="p-5 sm:p-6 flex-1">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-4 rounded-2xl shadow-inner transition-transform group-hover:scale-110 ${item.type === 'Company' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {item.type === 'Company' ? <FaBuilding size={20} /> : <FaUser size={20} />}
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                {item.status === 'active' ? 'Operational' : 'Terminated'}
                                            </span>
                                            <span className="text-[9px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-lg font-black uppercase tracking-widest border border-gray-100">
                                                {item.type}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-6 min-w-0">
                                        <h4 className="font-black text-gray-900 text-base leading-tight truncate mb-1" title={item.name}>
                                            {item.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 font-medium truncate" title={item.email}>
                                            {item.email}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-2xl p-4 mb-6 border border-gray-50 group-hover:bg-white transition-colors">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Plan Integrity</span>
                                            <span className={`text-[11px] font-black ${daysRemaining <= 0 ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-blue-600'}`}>
                                                {daysRemaining !== null ? (
                                                    daysRemaining <= 0 ? 'Expired' : `${daysRemaining} Days`
                                                ) : 'Infinite'}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-200/50 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full transition-all duration-1000 ${daysRemaining <= 0 ? 'bg-red-500 w-full' : isExpiringSoon ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                                                style={{ width: daysRemaining !== null ? `${Math.min(100, Math.max(5, (daysRemaining / 365) * 100))}%` : '100%' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-gray-400 font-black uppercase tracking-tighter">Current Plan</span>
                                            <span className="text-gray-900 font-black px-2 py-0.5 bg-gray-100 rounded-lg">{item.plan}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-gray-400 font-black uppercase tracking-tighter">Expiration</span>
                                            <span className="text-gray-700 font-bold">
                                                {item.expiry ? new Date(item.expiry).toLocaleDateString() : 'Continuous'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 sm:px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                                        REF: {item.id.toString().slice(-8).toUpperCase()}
                                    </span>
                                    <div className="text-[9px] text-gray-400 font-bold flex items-center gap-1.5 uppercase tracking-tighter">
                                        <FaClock className="text-[8px] opacity-50" />
                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-[40px] shadow-sm p-16 sm:p-24 text-center border-2 border-dashed border-gray-100">
                    <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                        <FaClock size={40} className="text-gray-200" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Ledger Vacuum</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium leading-relaxed">
                        No subscription nodes detected within the selected parameters. All systems monitoring.
                    </p>
                </div>
            )}
        </div>
    );
};
