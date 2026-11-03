import React, { useState, useEffect } from 'react';
import {
    FaSearch, FaUserPlus, FaPhone, FaCalendarAlt, FaUserFriends,
    FaIdCard, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
    FaSyncAlt, FaTimes, FaSpinner, FaExclamationTriangle
} from 'react-icons/fa';
import { formatDate } from '../../utils/adminUtils';

// ─────────────────────────────────────────────────────────────────────────
// Role catalogue
// ─────────────────────────────────────────────────────────────────────────
const ROLE_GROUPS = [
    {
        label: 'Health Professionals',
        options: [
            { value: 'pharmacist',                label: 'Pharmacist' },
            { value: 'physician',                 label: 'Physician' },
            { value: 'nurse',                     label: 'Nurse' },
            { value: 'other_health_professional', label: 'Other Health Professional' }
        ]
    },
    {
        label: 'Students',
        options: [
            { value: 'pharmacy_student',             label: 'Pharmacy Student' },
            { value: 'other_health_science_student', label: 'Other Health Science Student' }
        ]
    },
    {
        label: 'Clients & Staff',
        options: [
            { value: 'healthcare_client', label: 'Healthcare Client' },
            { value: 'staff',             label: 'Staff' },
            { value: 'company_admin',     label: 'Company Admin' }
        ]
    }
];

const STUDENT_ROLES = ['pharmacy_student', 'other_health_science_student'];

const generateHealthcareClientId = () => {
    const prefix = 'HCC';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};

// ─────────────────────────────────────────────────────────────────────────
// Inline Add User modal
// ─────────────────────────────────────────────────────────────────────────
function AddUserModal({ onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'pharmacist',
        client_id: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isHealthcareClient = formData.role === 'healthcare_client';
    const isStudent = STUDENT_ROLES.includes(formData.role);

    useEffect(() => {
        if (isHealthcareClient && !formData.client_id) {
            setFormData(prev => ({ ...prev, client_id: generateHealthcareClientId() }));
        }
        if (!isHealthcareClient && formData.client_id) {
            setFormData(prev => ({ ...prev, client_id: '' }));
        }
    }, [formData.role]); // eslint-disable-line react-hooks/exhaustive-deps

    const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload = isHealthcareClient
                ? {
                    full_name: formData.full_name.trim(),
                    name: formData.full_name.trim(),
                    email: formData.email.trim() ||
                           `${formData.client_id}@hcc.addis-med.com`,
                    phone: formData.phone.trim() || 'N/A',
                    password: formData.password,
                    role: null,
                    individual_type: 'client',
                    is_healthcare_client: true,
                    user_id: formData.client_id,
                    client_id: formData.client_id,
                    pricing_category: 'student_or_client'
                }
                : {
                    full_name: formData.full_name.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    password: formData.password,
                    role: formData.role,
                    pricing_category: isStudent ? 'student_or_client' : 'professional'
                };
            await onSubmit(payload);
        } catch (err) {
            const msg = err?.error || err?.message || 'Failed to create user';
            setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">Add New User</h2>
                    <button type="button" onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 p-1" aria-label="Close">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                            <FaExclamationTriangle className="text-red-500 mt-1 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* ── Role * (NEW ROLES HERE) ──────────────────────── */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role <span className="text-red-500">*</span>
                        </label>
                        <select required value={formData.role}
                            onChange={e => set('role', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            {ROLE_GROUPS.map(group => (
                                <optgroup key={group.label} label={group.label}>
                                    {group.options.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {isStudent && (
                            <p className="mt-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                🎓 Student pricing will apply automatically.
                            </p>
                        )}
                    </div>

                    {/* Healthcare client ID */}
                    {isHealthcareClient && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaIdCard className="inline mr-1" /> Client ID *
                            </label>
                            <div className="flex gap-2">
                                <input type="text" required value={formData.client_id}
                                    onChange={e => set('client_id', e.target.value)}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-pink-500 outline-none" />
                                <button type="button"
                                    onClick={() => set('client_id', generateHealthcareClientId())}
                                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                                    title="Regenerate ID">
                                    <FaSyncAlt />
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Used for this client's login.
                            </p>
                        </div>
                    )}

                    {/* Full name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FaUser className="inline mr-1" /> Full Name *
                        </label>
                        <input type="text" required value={formData.full_name}
                            onChange={e => set('full_name', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Enter full name" />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FaEnvelope className="inline mr-1" /> Email {isHealthcareClient ? '(optional)' : '*'}
                        </label>
                        <input type="email" required={!isHealthcareClient}
                            value={formData.email}
                            onChange={e => set('email', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder={isHealthcareClient ? 'Auto-generated from client ID if blank' : 'Enter email address'} />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FaPhone className="inline mr-1" /> Phone {isHealthcareClient ? '(optional)' : '*'}
                        </label>
                        <input type="tel" required={!isHealthcareClient}
                            value={formData.phone}
                            onChange={e => set('phone', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Enter phone number" />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FaLock className="inline mr-1" /> Password *
                        </label>
                        <div className="relative">
                            <input type={showPassword ? 'text' : 'password'}
                                required minLength={6} value={formData.password}
                                onChange={e => set('password', e.target.value)}
                                className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Create a password" />
                            <button type="button"
                                onClick={() => setShowPassword(s => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
                            {loading ? (<><FaSpinner className="animate-spin" /> Creating...</>) : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────
export const CompanyUserManagement = ({
    users,
    stats,
    companyName,
    onAddUser,       // legacy fallback
    onCreateUser,    // preferred: modal submit handler
    onEditUser,
    onDeleteUser,
    onApproveUser,
    onToggleBlock
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const itemsPerPage = 10;

    // ── Helpers ──────────────────────────────────────────────────────────
    const isHealthcareClient = (user) =>
        user.individual_type === 'client' ||
        user.is_healthcare_client === true ||
        user.role === 'healthcare_client';

    const getUserName = (user) => user.full_name || user.name || 'Unknown User';
    const getClientId = (user) => user.user_id || user.userId || user.client_id || user.id;

    const getRoleBadge = (user) => {
        if (isHealthcareClient(user)) {
            return (
                <span className="px-3 py-1 text-xs rounded-full font-medium bg-pink-100 text-pink-800">
                    Healthcare Client
                </span>
            );
        }

        const styles = {
            pharmacist:                   'bg-blue-100 text-blue-800',
            physician:                    'bg-green-100 text-green-800',
            doctor:                       'bg-green-100 text-green-800',
            nurse:                        'bg-purple-100 text-purple-800',
            staff:                        'bg-gray-100 text-gray-800',
            company_admin:                'bg-red-100 text-red-800',
            pharmacy_student:             'bg-orange-100 text-orange-800',
            other_health_science_student: 'bg-amber-100 text-amber-800',
            other_health_professional:    'bg-teal-100 text-teal-800'
        };
        const labels = {
            physician:                    'Physician',
            company_admin:                'Admin',
            pharmacy_student:             'Pharmacy Student',
            other_health_science_student: 'Health Science Student',
            other_health_professional:    'Other Professional'
        };
        const role = user.role;
        if (!role) {
            return <span className="px-3 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-600">—</span>;
        }
        return (
            <span className={`px-3 py-1 text-xs rounded-full font-medium ${styles[role] || styles.staff}`}>
                {labels[role] || role}
            </span>
        );
    };

    const getStatusBadge = (user) => {
        if (user.is_blocked) return <span className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">Blocked</span>;
        return user.approved
            ? <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">Active</span>
            : <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">Pending</span>;
    };

    // ── Filtering ────────────────────────────────────────────────────────
    const filteredUsers = users.filter(user => {
        const s = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
            user.email?.toLowerCase().includes(s) ||
            user.full_name?.toLowerCase().includes(s) ||
            user.name?.toLowerCase().includes(s) ||
            getClientId(user)?.toLowerCase?.().includes(s);

        const matchesRole =
            filterRole === 'all' ||
            (filterRole === 'healthcare_client' && isHealthcareClient(user)) ||
            (filterRole !== 'healthcare_client' && !isHealthcareClient(user) && user.role === filterRole);

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && user.approved && !user.is_blocked) ||
            (filterStatus === 'pending' && !user.approved) ||
            (filterStatus === 'blocked' && user.is_blocked);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddUserClick = () => {
        if (onCreateUser) {
            setShowAddModal(true);
        } else {
            onAddUser?.();
        }
    };

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
                    <button onClick={handleAddUserClick}
                        className="px-6 py-3 rounded-lg flex items-center gap-2 font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:from-blue-600 hover:to-purple-700 transition">
                        <FaUserPlus className="text-lg" /> Add User
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text"
                            placeholder="Search by name, email, or client ID..."
                            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                    </div>
                    <div className="flex gap-2">
                        <select className="border rounded-lg px-4 py-3 outline-none"
                            value={filterRole}
                            onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }}>
                            <option value="all">All Roles</option>
                            {ROLE_GROUPS.map(group => (
                                <optgroup key={group.label} label={group.label}>
                                    {group.options.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <select className="border rounded-lg px-4 py-3 outline-none"
                            value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {filteredUsers.length > 0 ? (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
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
                                    {currentUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition">
                                            <td className="border-b p-4">
                                                <div>
                                                    <p className="font-medium text-gray-800">{getUserName(user)}</p>
                                                    <p className="text-sm text-gray-600">{user.email}</p>
                                                    {user.phone && (
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            <FaPhone className="text-xs" />{user.phone}
                                                        </p>
                                                    )}
                                                    {isHealthcareClient(user) && (
                                                        <p className="text-xs text-pink-600 font-mono flex items-center gap-1 mt-1">
                                                            <FaIdCard className="text-xs" /> ID: {getClientId(user)}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="border-b p-4">{getRoleBadge(user)}</td>
                                            <td className="border-b p-4">{getStatusBadge(user)}</td>
                                            <td className="border-b p-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-2">
                                                    <FaCalendarAlt className="text-gray-400" /> {formatDate(user.created_at)}
                                                </span>
                                            </td>
                                            <td className="border-b p-4">
                                                <div className="flex gap-2 flex-wrap">
                                                    {!user.approved && !user.is_blocked && (
                                                        <button onClick={() => onApproveUser(user.id)}
                                                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                                                            Approve
                                                        </button>
                                                    )}
                                                    {user.id !== users.find(u => u.role === 'company_admin')?.id && (
                                                        <button
                                                            onClick={() => onToggleBlock(user.id, user.is_blocked)}
                                                            disabled={user.is_blocked && user.blocked_by === 'superadmin'}
                                                            className={`px-3 py-1 text-white rounded text-sm transition-all ${user.is_blocked
                                                                ? (user.blocked_by === 'superadmin' ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-orange-500 hover:bg-orange-600')
                                                                : 'bg-gray-700 hover:bg-gray-800'}`}
                                                            title={user.is_blocked && user.blocked_by === 'superadmin'
                                                                ? 'Blocked by a System Admin and cannot be unblocked here.'
                                                                : ''}>
                                                            {user.is_blocked
                                                                ? (user.blocked_by === 'superadmin' ? 'Blocked by Admin' : 'Unblock')
                                                                : 'Block'}
                                                        </button>
                                                    )}
                                                    <button onClick={() => onEditUser(user)}
                                                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                                                        Edit
                                                    </button>
                                                    <button onClick={() => onDeleteUser(user.id, user.email)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {currentUsers.map(user => (
                                <div key={user.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900">{getUserName(user)}</p>
                                            <p className="text-sm text-gray-600">{user.email}</p>
                                            {isHealthcareClient(user) && (
                                                <p className="text-xs text-pink-600 font-mono mt-1">
                                                    ID: {getClientId(user)}
                                                </p>
                                            )}
                                        </div>
                                        <div>{getStatusBadge(user)}</div>
                                    </div>

                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Role:</span>
                                            <span>{getRoleBadge(user)}</span>
                                        </div>
                                        {user.phone && (
                                            <div className="flex justify-between items-center text-gray-500">
                                                <span className="flex items-center gap-1"><FaPhone className="text-xs" /> Phone:</span>
                                                <span>{user.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-xs text-gray-400">
                                            <span className="flex items-center gap-1"><FaCalendarAlt /> Joined:</span>
                                            <span>{formatDate(user.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t border-dashed flex-wrap">
                                        {!user.approved && !user.is_blocked && (
                                            <button onClick={() => onApproveUser(user.id)}
                                                className="flex-1 min-w-[80px] py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 border border-green-200">
                                                Approve
                                            </button>
                                        )}
                                        {user.id !== users.find(u => u.role === 'company_admin')?.id && (
                                            <button
                                                onClick={() => onToggleBlock(user.id, user.is_blocked)}
                                                disabled={user.is_blocked && user.blocked_by === 'superadmin'}
                                                className={`flex-1 min-w-[80px] py-2 rounded-lg text-sm font-medium border transition-all ${user.is_blocked
                                                    ? (user.blocked_by === 'superadmin'
                                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                        : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100')
                                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}>
                                                {user.is_blocked ? (user.blocked_by === 'superadmin' ? 'Locked' : 'Unblock') : 'Block'}
                                            </button>
                                        )}
                                        <button onClick={() => onEditUser(user)}
                                            className="flex-1 min-w-[80px] py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 border border-blue-200">
                                            Edit
                                        </button>
                                        <button onClick={() => onDeleteUser(user.id, user.email)}
                                            className="flex-1 min-w-[80px] py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 border border-red-200">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {filteredUsers.length > itemsPerPage && (
                            <div className="p-6 border-t bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-sm text-gray-600">
                                    Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of <span className="font-semibold text-gray-900">{filteredUsers.length}</span> users
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                            : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-300'}`}>
                                        Previous
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button key={i + 1}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${currentPage === i + 1
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'}`}>
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${currentPage === totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                            : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-300'}`}>
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <FaUserFriends className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-800">No Users Found</h3>
                        <p className="text-gray-600 mb-4">Try adjusting your filters or add a new user.</p>
                        <button onClick={handleAddUserClick}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg">
                            Add User
                        </button>
                    </div>
                )}
            </div>

            {/* Inline Add User Modal */}
            {showAddModal && (
                <AddUserModal
                    onClose={() => setShowAddModal(false)}
                    onSubmit={async (payload) => {
                        await onCreateUser(payload);
                        setShowAddModal(false);
                    }}
                />
            )}
        </div>
    );
};
