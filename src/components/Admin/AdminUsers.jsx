import React, { useState } from 'react';
import {
    FaSync, FaSearch, FaFilter, FaUserCircle, FaSpinner
} from 'react-icons/fa';

export const AdminUsers = ({
    users,
    loading,
    onRefresh,
    formatDate,
    getStatusBadge,
    getRoleBadge
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredUsers = users.filter(user => {
        const matchesSearch = searchTerm === '' ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.institution && user.institution.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = filterRole === 'all' || user.role === filterRole;

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'approved' && user.approved) ||
            (filterStatus === 'pending' && !user.approved);

        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">User Management</h2>
                        <p className="text-sm text-gray-500">Manage and monitor all application users.</p>
                    </div>
                    <button
                        onClick={onRefresh}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} /> Refresh Users
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or institution..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-3 text-gray-400" />
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admins</option>
                            <option value="pharmacist">Pharmacists</option>
                            <option value="doctor">Doctors</option>
                            <option value="nurse">Nurses</option>
                            <option value="laboratory">Laboratory</option>
                            <option value="student">Students</option>
                            <option value="company_admin">Company Admins</option>
                        </select>
                    </div>
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-3 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="approved">Approved Only</option>
                            <option value="pending">Pending Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading && users.length === 0 ? (
                <div className="py-20 text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Fetching users...</p>
                </div>
            ) : filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col overflow-hidden group">
                            <div className="p-5 flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-blue-50 p-3 rounded-full group-hover:bg-blue-100 transition-colors">
                                        <FaUserCircle className="text-blue-500 text-2xl" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {getStatusBadge(user.approved, user.role)}
                                        {getRoleBadge(user.role)}
                                    </div>
                                </div>

                                <div className="mb-4 min-w-0">
                                    <h4 className="font-bold text-gray-800 text-lg truncate" title={user.full_name}>
                                        {user.full_name}
                                    </h4>
                                    <p className="text-sm text-gray-500 truncate" title={user.email}>
                                        {user.email}
                                    </p>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-gray-50">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400 uppercase tracking-wider font-semibold">Institution</span>
                                        <span className="text-gray-700 font-medium truncate ml-4">
                                            {user.institution || '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400 uppercase tracking-wider font-semibold">Account Type</span>
                                        <span className="text-gray-600 capitalize">{user.account_type || 'individual'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400 uppercase tracking-wider font-semibold">Joined</span>
                                        <span className="text-gray-600">{formatDate(user.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-5 py-3 border-t flex justify-between items-center">
                                <span className="text-[10px] text-gray-400 font-medium">ID: ...{user.id.slice(-8)}</span>
                                <button
                                    className="text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors"
                                    onClick={() => {/* View Details */ }}
                                >
                                    View Profile
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-20 text-center border border-dashed border-gray-300">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No users found</h3>
                    <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    );
};
