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
        <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        All Users ({filteredUsers.length})
                    </h2>
                    <button
                        onClick={onRefresh}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-3 text-gray-400" />
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admins</option>
                            <option value="pharmacist">Pharmacists</option>
                            <option value="company_admin">Company Admins</option>
                        </select>
                    </div>
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-3 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        >
                            <option value="all">All Statuses</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">User</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Role</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Institution</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <FaSpinner className="animate-spin text-3xl text-blue-500 mx-auto" />
                                    <p className="mt-2 text-gray-500">Loading users...</p>
                                </td>
                            </tr>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-full">
                                                <FaUserCircle className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{user.full_name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {user.institution || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(user.approved, user.role)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {formatDate(user.created_at)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    No users found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
