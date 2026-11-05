import React, { useState, useMemo } from 'react';
import { FaBuilding, FaUser, FaCheckCircle, FaClock, FaSearch, FaRedo, FaSpinner, FaCheck, FaTimes, FaMoneyBillWave } from 'react-icons/fa';

export const AdminSubscriptions = ({ subscriptions, loading, onRefresh, users, companies, payments, pendingPayments, processingId, onApprovePayment, onRejectPayment }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired

    // Map user_id -> user and company_id -> company for fast lookup
    const usersMap = useMemo(() => {
        const m = new Map();
        (users || []).forEach(u => m.set(String(u.id), u));
        return m;
    }, [users]);

    const companiesMap = useMemo(() => {
        const m = new Map();
        (companies || []).forEach(c => m.set(String(c.id), c));
        return m;
    }, [companies]);

    const subscriptionData = useMemo(() => {
        if (!subscriptions || !Array.isArray(subscriptions)) return [];

        const seen = new Set(); // dedupe by entity (user or company)
        const data = [];

        subscriptions.forEach(sub => {
            // Only consider PAID records.
            // A record qualifies as paid if it has a payment method other than
            // an admin override, OR it explicitly records a positive amount.
            const amount = Number(sub.amount) || 0;
            const method = (sub.payment_method || '').toLowerCase();
            const isPaid = amount > 0 && method !== 'admin_override';
            if (!isPaid) return;

            // Resolve entity
            const isCompany = !!sub.company_id;
            const entityId = isCompany ? String(sub.company_id) : String(sub.user_id || '');
            if (!entityId) return;

            // Dedupe: only one row per entity
            if (seen.has(entityId)) return;
            seen.add(entityId);

            let name = 'N/A';
            let email = 'N/A';
            let type = isCompany ? 'Company' : 'Individual';

            if (isCompany) {
                const comp = sub.companies || companiesMap.get(entityId);
                if (comp) {
                    name = comp.company_name || name;
                    email = comp.email || email;
                } else {
                    name = `Company ID: ${sub.company_id}`;
                }
            } else {
                const usr = sub.users || usersMap.get(entityId);
                if (usr) {
                    name = usr.full_name || 'Individual User';
                    email = usr.email || email;
                }
            }

            data.push({
                id: sub.id,
                entityId,
                name,
                email,
                type,
                plan: sub.plan_name || sub.plan_id || 'Pro',
                status: sub.status || 'inactive',
                expiry: sub.expiry_date || sub.end_date,
                created_at: sub.created_at,
                amount
            });
        });

        return data;
    }, [subscriptions, usersMap, companiesMap]);

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
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Paid account oversight.</p>
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


            {/* Pending Bank & Mobile Payments */}
            {pendingPayments && pendingPayments.length > 0 && (
                <div className="bg-white rounded-[24px] shadow-sm border border-orange-100 overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-100 rounded-xl">
                                <FaMoneyBillWave className="text-orange-600 text-base" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900">Pending CBE Payments</h3>
                                <p className="text-[9px] text-orange-500 font-bold uppercase tracking-widest">{pendingPayments.length} awaiting approval</p>
                            </div>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {pendingPayments.map((payment) => (
                            <div key={payment.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-gray-900 text-sm truncate">{payment.user_name || 'N/A'}</h4>
                                        <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-orange-100 shrink-0">
                                            {(payment.payment_method || 'CBE').toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium truncate mb-1.5">{payment.user_email || 'N/A'}</p>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            Plan: <span className="text-gray-700">{payment.plan_name || 'N/A'}</span>
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            Amount: <span className="text-gray-700 font-black">{payment.amount} ETB</span>
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            Ref: <span className="text-indigo-600 font-black">{payment.tx_ref || 'N/A'}</span>
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => onApprovePayment(payment.id)}
                                        disabled={processingId === payment.id}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-green-100 active:scale-95"
                                    >
                                        {processingId === payment.id ? (
                                            <FaSpinner className="animate-spin text-[10px]" />
                                        ) : (
                                            <FaCheck className="text-[10px]" />
                                        )}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => onRejectPayment(payment.id)}
                                        disabled={processingId === payment.id}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-100 active:scale-95"
                                    >
                                        {processingId === payment.id ? (
                                            <FaSpinner className="animate-spin text-[10px]" />
                                        ) : (
                                            <FaTimes className="text-[10px]" />
                                        )}
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {pendingPayments && pendingPayments.length === 0 && (
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 px-5 sm:px-6 py-4 flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 rounded-xl">
                        <FaCheckCircle className="text-green-500 text-base" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-gray-700">No Pending Payments</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">All bank & mobile transfer payments have been processed</p>
                    </div>
                </div>
            )}

            {/* Performance Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="min-w-0">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 truncate">Active Paid</p>
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
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 truncate">Total Paid</p>
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
                        No paid subscription records detected within the selected parameters.
                    </p>
                </div>
            )}
        </div>
    );
};
