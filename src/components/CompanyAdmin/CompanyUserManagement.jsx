import React, { useState } from 'react';
import {
    FaSearch, FaUserPlus, FaUsers, FaPhone, FaCalendarAlt, FaUserFriends
} from 'react-icons/fa';
import { formatDate } from '../../utils/adminUtils'; // Reuse general admin utils where possible

export const CompanyUserManagement = ({
    users,
    stats,
    companyName,
    onAddUser,
    onEditUser,
    onDeleteUser,
    onApproveUser
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Reuse badges logic locally or import from utils if standardized
    const getRoleBadge = (role) => {
        const styles = {
            pharmacist: 'bg-blue-100 text-blue-800',
            doctor: 'bg-green-100 text-green-800',
            nurse: 'bg-purple-100 text-purple-800',
            staff: 'bg-gray-100 text-gray-800',
            company_admin: 'bg-red-100 text-red-800'
        };
        return <span className={`px-3 py-1 text-xs rounded-full font-medium ${styles[role] || styles.staff}`}>{role}</span>;
    };

    const getStatusBadge = (approved) => approved ?
        <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">Active</span> :
        <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">Pending</span>;

    const filteredUsers = users.filter(user => {
        const matchesSearch = !searchTerm ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && user.approved) ||
            (filterStatus === 'pending' && !user.approved);
        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                        <p className="text-gray-600">Manage users in {companyName || 'your company'}</p>
                        {stats.total_users > 0 && (
                            <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-gray-500">Total: {stats.total_users}</span>
                                <span className="text-green-600">Active: {stats.active_users}</span>
                                {stats.pending_users > 0 && <span className="text-yellow-600">Pending: {stats.pending_users}</span>}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onAddUser}
                        className="px-6 py-3 rounded-lg flex items-center gap-2 font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:from-blue-600 hover:to-purple-700 transition"
                    >
                        <FaUserPlus className="text-lg" /> Add User
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select className="border rounded-lg px-4 py-3 outline-none" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                            <option value="all">All Roles</option>
                            <option value="pharmacist">Pharmacist</option>
                            <option value="doctor">Doctor</option>
                            <option value="nurse">Nurse</option>
                            <option value="staff">Staff</option>
                            <option value="company_admin">Admin</option>
                        </select>
                        <select className="border rounded-lg px-4 py-3 outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {filteredUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-700">
                                    <th className="border-b p-4 text-left">User</th>
                                    <th className="border-b p-4 text-left">Role</th>
                                    <th className="border-b p-4 text-left">Status</th>
                                    <th className="border-b p-4 text-left">Joined</th>
                                    <th className="border-b p-4 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                        <td className="border-b p-4">
                                            <div>
                                                <p className="font-medium text-gray-800">{user.full_name}</p>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                                {user.phone && <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><FaPhone className="text-xs" />{user.phone}</p>}
                                            </div>
                                        </td>
                                        <td className="border-b p-4">{getRoleBadge(user.role)}</td>
                                        <td className="border-b p-4">{getStatusBadge(user.approved)}</td>
                                        <td className="border-b p-4 text-sm text-gray-600 flex items-center gap-2">
                                            <FaCalendarAlt className="text-gray-400" /> {formatDate(user.created_at)}
                                        </td>
                                        <td className="border-b p-4">
                                            <div className="flex gap-2">
                                                {!user.approved && (
                                                    <button onClick={() => onApproveUser(user.id)} className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">Approve</button>
                                                )}
                                                <button onClick={() => onEditUser(user)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">Edit</button>
                                                <button onClick={() => onDeleteUser(user.id, user.email)} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FaUserFriends className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-800">No Users Found</h3>
                        <p className="text-gray-600 mb-4">Try adjusting your filters or add a new user.</p>
                        <button onClick={onAddUser} className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg">Add User</button>
                    </div>
                )}
            </div>
        </div>
    );
};
