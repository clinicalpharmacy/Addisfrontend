import React, { useState } from 'react';
import {
    FaSync, FaSearch, FaFilter, FaUserCircle, FaSpinner, FaUsers
} from 'react-icons/fa';

export const AdminUsers = ({
    users,
    loading,
    onRefresh,
    formatDate,
    getStatusBadge,
    getRoleBadge,
    onToggleBlock
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Normalize user roles for consistent matching
    const normalizedUsers = users.map(user => ({
        ...user,
        role: (() => {
            switch (user.role) {
                case 'physicians':
                    return 'physician';
                case 'pharmacy_students':
                    return 'pharmacy_student';
                case 'other_health_science_students':
                    return 'other_health_science_student';
                default:
                    return user.role;
            }
        })()
    }));

    const filteredUsers = normalizedUsers.filter(user => {
        const matchesSearch = searchTerm === '' ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.institution && user.institution.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = filterRole === 'all' || user.role === filterRole;

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'approved' && user.approved && !user.is_blocked) ||
            (filterStatus === 'pending' && !user.approved) ||
            (filterStatus === 'blocked' && user.is_blocked);

        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            {/* Control Center */}
            <div className="bg-white p-5 sm:p-6 rounded-[24px] shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <FaUsers className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">Member Directory</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global platform governance.</p>
                        </div>
                    </div>
                    <button
                        onClick={onRefresh}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 text-xs font-black active:scale-95"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} /> <span>Refresh Database</span>
                    </button>
                </div>

                {/* Intelligent Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    <div className="relative group">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors text-xs" />
                        <input
                            type="text"
                            placeholder="Filter by name, email, institution..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full pl-3 pr-8 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs font-black appearance-none cursor-pointer uppercase tracking-tighter"
                            >
                                <option value="all">Every Role</option>
                                <option value="admin">Administrators</option>
                                <option value="pharmacist">Pharmacists</option>
                                <option value="physician">Physicians</option>
                                <option value="nurse">Nurses</option>
                                <option value="other_health_professional">Other Health Professionals</option>
                                <option value="healthcare_client">Healthcare Clients</option>
                                <option value="pharmacy_student">Pharmacy Students</option>
                                <option value="other_health_science_student">Other Health Science Students</option>
                                <option value="company_admin">Org Admins</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">▼</div>
                        </div>
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-3 pr-8 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs font-black appearance-none cursor-pointer uppercase tracking-tighter"
                            >
                                <option value="all">Every Status</option>
                                <option value="approved">Verified</option>
                                <option value="pending">Awaiting</option>
                                <option value="blocked">Blocked</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">▼</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Cards */}
            {loading && users.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="relative inline-block mb-4">
                        <FaSpinner className="animate-spin text-5xl text-indigo-500/20" />
                        <FaUserCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-indigo-500" />
                    </div>
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Syncing User Cluster...</p>
                </div>
            ) : filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className="group bg-white rounded-[24px] shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col overflow-hidden hover:-translate-y-1">
                            <div className="p-5 flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[16px] flex items-center justify-center transition-transform group-hover:scale-110">
                                        <FaUserCircle className="text-indigo-400 text-2xl" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <div className="scale-90 origin-right">
                                            {getStatusBadge ? getStatusBadge(user.approved, user.role, user.is_blocked) : (
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${user.is_blocked ? 'bg-red-100 text-red-700' : user.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {user.is_blocked ? 'Blocked' : user.approved ? 'Verified' : 'Pending'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="scale-90 origin-right">
                                            {getRoleBadge ? getRoleBadge(user.role) : (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-gray-100 text-gray-600">
                                                    {user.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-5 min-w-0">
                                    <h4 className="font-black text-gray-900 text-base leading-tight truncate mb-1" title={user.full_name}>
                                        {user.full_name}
                                    </h4>
                                    <p className="text-xs text-gray-500 font-medium truncate" title={user.email}>
                                        {user.email}
                                    </p>
                                </div>

                                <div className="space-y-2 mt-auto">
                                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-gray-50/50 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest shrink-0">Institution</span>
                                        <span className="text-gray-700 font-bold text-[11px] truncate ml-3 max-w-[120px]">
                                            {user.institution || 'Independent'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-gray-50/50 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest shrink-0">Joined On</span>
                                        <span className="text-gray-500 font-bold text-[11px]">{formatDate(user.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50/30 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-gray-400 font-black tracking-widest uppercase">ID: ...{user.id.slice(-6)}</span>
                                    {user.role !== 'admin' && (
                                        <button
                                            onClick={() => onToggleBlock(user.id)}
                                            className={`text-[9px] font-black uppercase tracking-tighter mt-1 transition-colors ${user.is_blocked
                                                ? 'text-orange-600 hover:text-orange-700'
                                                : 'text-gray-400 hover:text-red-500'
                                                }`}
                                        >
                                            {user.is_blocked ? 'Emergency Unblock' : 'Restrict Access'}
                                        </button>
                                    )}
                                </div>
                                <button
                                    className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black uppercase tracking-[0.1em] transition-all hover:gap-1 flex items-center gap-0.5"
                                    onClick={() => {/* View Details */ }}
                                >
                                    Governance Center
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[32px] shadow-sm p-20 text-center border-2 border-dashed border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                        <FaSearch className="text-3xl text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">No Records Found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium">
                        Your search didn't match any system members. Try broad search criteria.
                    </p>
                </div>
            )}
        </div>
    );
};
