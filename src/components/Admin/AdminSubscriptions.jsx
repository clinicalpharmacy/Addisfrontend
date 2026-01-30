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
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex-1 w-full">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Subscription Overview</h2>
                    <p className="text-sm text-gray-500">Monitor active accounts across all user types.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full md:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Expired Only</option>
                    </select>

                    <button
                        onClick={onRefresh}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition shadow-sm font-bold text-sm"
                    >
                        <FaRedo className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
                    <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Accounts</div>
                        <div className="text-3xl font-black text-gray-800">
                            {subscriptionData.filter(i => i.status === 'active').length}
                        </div>
                    </div>
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <FaCheckCircle size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-orange-200 transition-colors">
                    <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Company Subs</div>
                        <div className="text-3xl font-black text-gray-800">
                            {subscriptionData.filter(i => i.type === 'Company').length}
                        </div>
                    </div>
                    <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <FaBuilding size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-purple-200 transition-colors">
                    <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Records</div>
                        <div className="text-3xl font-black text-gray-800">{subscriptionData.length}</div>
                    </div>
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <FaUser size={24} />
                    </div>
                </div>
            </div>

            {/* Subscriptions Grid */}
            {filteredData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredData.map((item) => {
                        const daysRemaining = calculateDaysRemaining(item.expiry);
                        const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7;

                        return (
                            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-all">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${item.type === 'Company' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {item.type === 'Company' ? <FaBuilding size={20} /> : <FaUser size={20} />}
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(item.status)} shadow-sm`}>
                                                {item.status === 'active' ? 'Active' : 'Expired'}
                                            </span>
                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                {item.type}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-bold text-gray-900 leading-tight mb-1 truncate" title={item.name}>
                                            {item.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 truncate" title={item.email}>
                                            {item.email}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Plan Validity</span>
                                            <span className={`text-xs font-black ${daysRemaining <= 0 ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-blue-600'}`}>
                                                {daysRemaining !== null ? (
                                                    daysRemaining <= 0 ? 'Expired' : `${daysRemaining} Days Left`
                                                ) : 'N/A'}
                                            </span>
                                        </div>
                                        {/* Simple Progress Bar */}
                                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${daysRemaining <= 0 ? 'bg-red-500 w-full' : isExpiringSoon ? 'bg-orange-500' : 'bg-blue-500'}`}
                                                style={{ width: daysRemaining !== null ? `${Math.min(100, Math.max(0, (daysRemaining / 365) * 100))}%` : '0%' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400 italic">Current Plan</span>
                                            <span className="text-gray-700 font-bold">{item.plan}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400 italic">Expiry Date</span>
                                            <span className="text-gray-700 font-medium">
                                                {item.expiry ? new Date(item.expiry).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        ID: ...{item.id.toString().slice(-6)}
                                    </span>
                                    <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                        <FaClock size={8} />
                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm p-24 text-center border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaClock size={36} className="text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No Records Found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        We couldn't find any subscriptions matching your criteria. Try adjusting your filters.
                    </p>
                </div>
            )}
        </div>
    );
};
