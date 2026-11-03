import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBuilding, FaTimes, FaExclamationTriangle, FaCheckCircle, FaSyncAlt
} from 'react-icons/fa';

import { useCompanyAdminLogic } from '../hooks/useCompanyAdminLogic';
import { CompanyUserManagement } from '../components/CompanyAdmin/CompanyUserManagement';

// ── Role catalogue — mirrors Signup.jsx + healthcare client ─────────────
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
// User Modal — Add & Edit
// ─────────────────────────────────────────────────────────────────────────
const UserModalInternal = ({ show, isEdit, isSubmitting, data, onClose, onSubmit, onChange }) => {
    if (!show) return null;

    const isHealthcareClient =
        data.role === 'healthcare_client' || data.is_healthcare_client === true;
    const isStudent = STUDENT_ROLES.includes(data.role);

    // Show the right option in <select> even if role is null for a client
    const currentRoleValue =
        data.role || (isHealthcareClient ? 'healthcare_client' : 'pharmacist');

    const set = (field, value) => onChange({ ...data, [field]: value });

    const handleRoleChange = (newRole) => {
        if (newRole === 'healthcare_client') {
            const clientId = data.client_id || generateHealthcareClientId();
            onChange({
                ...data,
                role: newRole,
                client_id: clientId,
                // auto-fill email from client ID if user hasn't typed one
                email: data.email || `${clientId}@hcc.addis-med.com`,
                name: data.full_name || '',
                is_healthcare_client: true,
                individual_type: 'client',
                pricing_category: 'student_or_client'
            });
        } else if (STUDENT_ROLES.includes(newRole)) {
            onChange({
                ...data,
                role: newRole,
                client_id: '',
                is_healthcare_client: false,
                individual_type: 'professional',
                pricing_category: 'student_or_client'
            });
        } else {
            onChange({
                ...data,
                role: newRole,
                client_id: '',
                is_healthcare_client: false,
                individual_type: 'professional',
                pricing_category: 'professional'
            });
        }
    };

    // Keep `name` synced with `full_name` for healthcare clients
    const handleFullNameChange = (v) => {
        if (isHealthcareClient) {
            onChange({ ...data, full_name: v, name: v });
        } else {
            onChange({ ...data, full_name: v });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                        {isEdit ? 'Edit User' : 'Add New User'}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    {/* Role — now includes all 9 roles */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Role *
                        </label>
                        <select
                            value={currentRoleValue}
                            onChange={e => handleRoleChange(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg bg-white"
                        >
                            {ROLE_GROUPS.map(group => (
                                <optgroup key={group.label} label={group.label}>
                                    {group.options.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {isStudent && (
                            <p className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                                🎓 Student pricing will apply automatically.
                            </p>
                        )}
                    </div>

                    {/* Healthcare Client ID */}
                    {isHealthcareClient && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Healthcare Client ID *
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={data.client_id || ''}
                                    onChange={e => set('client_id', e.target.value)}
                                    className="flex-1 px-4 py-3 border rounded-lg font-mono text-sm"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => set('client_id', generateHealthcareClientId())}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                                    title="Regenerate ID"
                                >
                                    <FaSyncAlt />
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                This ID will be used for the client's login.
                            </p>
                        </div>
                    )}

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            value={data.full_name || ''}
                            onChange={e => handleFullNameChange(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg"
                            required
                        />
                    </div>

                    {!isEdit && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email {isHealthcareClient ? '(optional)' : '*'}
                                </label>
                                <input
                                    type="email"
                                    value={data.email || ''}
                                    onChange={e => set('email', e.target.value)}
                                    className="w-full px-4 py-3 border rounded-lg"
                                    required={!isHealthcareClient}
                                    placeholder={
                                        isHealthcareClient
                                            ? 'Auto-generated from client ID if blank'
                                            : ''
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    value={data.password || ''}
                                    onChange={e => set('password', e.target.value)}
                                    className="w-full px-4 py-3 border rounded-lg"
                                    required
                                    minLength="6"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone {isHealthcareClient ? '(optional)' : ''}
                        </label>
                        <input
                            type="tel"
                            value={data.phone || ''}
                            onChange={e => set('phone', e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────
const CompanyUsers = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);

    const logic = useCompanyAdminLogic(currentUser);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) { navigate('/login'); return; }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'company_admin' || !user.company_id) {
                console.warn('User has no company association. Redirecting to dashboard.');
                navigate('/dashboard', { replace: true });
                return;
            }
            setCurrentUser(user);
            logic.loadDashboardData(user.company_id);
        } catch (e) { navigate('/login'); }
    }, []);

    if (logic.loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        </div>
    );

    return (
        <div className="p-4 md:p-6">
            {/* Alerts */}
            {logic.error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-center gap-3 text-red-700">
                    <FaExclamationTriangle /> <p>{logic.error}</p>
                </div>
            )}
            {logic.success && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-center gap-3 text-green-700">
                    <FaCheckCircle /> <p>{logic.success}</p>
                </div>
            )}

            {/* User limit banner */}
            {logic.userLimitInfo && (
                <div
                    className={`mb-6 p-4 rounded flex items-center gap-3 border-l-4 ${
                        logic.userLimitInfo.allowed
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-amber-50 border-amber-500 text-amber-700'
                    }`}
                >
                    <FaBuilding />
                    <div className="text-sm">
                        <p className="font-medium">
                            User limit:{' '}
                            {logic.userLimitInfo.current} / {logic.userLimitInfo.limit}
                            {logic.userLimitInfo.limit > 0 && (
                                <span className="ml-2 text-xs opacity-75">
                                    ({logic.userLimitInfo.remaining} remaining)
                                </span>
                            )}
                        </p>
                        {!logic.userLimitInfo.allowed && (
                            <p className="mt-1">{logic.userLimitInfo.message}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Company User Management */}
            <CompanyUserManagement
                users={logic.companyUsers}
                stats={logic.stats}
                companyName={logic.companyInfo?.company_name}
                canAddUser={logic.userLimitInfo?.allowed}
                onAddUser={logic.openAddUserModal}
                onEditUser={logic.setEditingUser}
                onDeleteUser={logic.handleDeleteUser}
                onApproveUser={logic.handleApproveUser}
                onToggleBlock={logic.handleToggleBlock}
                onRefresh={() => logic.loadDashboardData(currentUser?.company_id)}
            />

            {/* Add User Modal */}
            <UserModalInternal
                show={logic.showAddUserModal}
                isEdit={false}
                isSubmitting={logic.isAddingUser}
                data={logic.newUserData}
                onClose={() => logic.setShowAddUserModal(false)}
                onSubmit={logic.handleAddUser}
                onChange={logic.setNewUserData}
            />

            {/* Edit User Modal */}
            <UserModalInternal
                show={!!logic.editingUser}
                isEdit={true}
                isSubmitting={false}
                data={logic.editingUser || {}}
                onClose={() => logic.setEditingUser(null)}
                onSubmit={logic.handleUpdateUser}
                onChange={logic.setEditingUser}
            />
        </div>
    );
};

export default CompanyUsers;
