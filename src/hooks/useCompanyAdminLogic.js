import { useState, useCallback } from 'react';
import api from '../utils/api';

/**
 * Hook for managing Company Admin Logic
 * Handles Dashboard Data Loading, User Management (Add/Edit/Delete), and general state.
 */
export const useCompanyAdminLogic = (currentUser) => {
    // State
    const [companyInfo, setCompanyInfo] = useState(null);
    const [companyUsers, setCompanyUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_users: 0, active_users: 0, pending_users: 0 });
    const [recentActivities, setRecentActivities] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // UI Logic (Modals)
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUserData, setNewUserData] = useState({
        email: '', password: '', full_name: '', phone: '', role: 'pharmacist'
    });

    // --- Loading Logic ---
    const loadDashboardData = useCallback(async (companyId) => {
        try {
            setLoading(true);
            setError('');

            // Parallel loading for better perf
            const [companyRes, usersRes] = await Promise.allSettled([
                api.get('/company/info'),
                api.get('/company/users') // Assumes backend handles filtering by current user's company
            ]);

            // Handle Company Info
            if (companyRes.status === 'fulfilled' && companyRes.value.success) {
                setCompanyInfo(companyRes.value.company);
            }

            // Handle Users
            let users = [];
            if (usersRes.status === 'fulfilled') {
                const data = usersRes.value;
                if (data.success && Array.isArray(data.users)) users = data.users;
                else if (Array.isArray(data)) users = data;
            }

            // Double check filtering
            const filteredUsers = users.filter(u => u.company_id === companyId);
            setCompanyUsers(filteredUsers);
            updateStats(filteredUsers);

            // Mock Activities (Future backend integration point)
            setRecentActivities([
                { id: 1, action: 'dashboard', details: 'Dashboard Accessed', created_at: new Date().toISOString() },
            ]);

        } catch (err) {
            console.error('Error loading company dashboard:', err);
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    const updateStats = (users) => {
        setStats({
            total_users: users.length,
            active_users: users.filter(u => u.approved).length,
            pending_users: users.filter(u => !u.approved).length
        });
    };

    // --- CRUD Operations ---
    const handleAddUser = async (e) => {
        e.preventDefault();
        if (isAddingUser) return;

        try {
            setIsAddingUser(true);
            setError(''); setSuccess('');

            if (!currentUser?.company_id) throw new Error('No company ID found');

            const payload = { ...newUserData, company_id: currentUser.company_id };
            if (!payload.phone) payload.phone = '+251000000000'; // Default if empty

            const res = await api.post('/company/users', payload);

            if (res.success || res.id) {
                setSuccess(`User ${newUserData.email} added!`);
                setShowAddUserModal(false);
                setNewUserData({ email: '', password: '', full_name: '', phone: '', role: 'pharmacist' });
                // Refresh list
                loadDashboardData(currentUser.company_id);
            } else {
                setError(res.error || 'Failed to add user');
            }
        } catch (err) {
            setError(err.message || 'Error adding user');
        } finally {
            setIsAddingUser(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const res = await api.put(`/company/users/${editingUser.id}`, {
                full_name: editingUser.full_name,
                phone: editingUser.phone,
                role: editingUser.role
            });

            if (res.success || res.id) {
                setSuccess('User updated successfully');
                setEditingUser(null);
                loadDashboardData(currentUser.company_id);
            } else {
                setError(res.error || 'Failed to update');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`Delete ${userEmail}?`)) return;
        try {
            const res = await api.delete(`/company/users/${userId}`);
            if (res.success || res.message === 'User deleted') {
                setSuccess('User deleted');
                loadDashboardData(currentUser.company_id);
            } else {
                setError(res.error || 'Delete failed');
            }
        } catch (err) { setError(err.message); }
    };

    const handleApproveUser = async (userId) => {
        try {
            const res = await api.post(`/company/users/${userId}/approve`);
            if (res.success) {
                setSuccess('User approved');
                loadDashboardData(currentUser.company_id);
            } else {
                setError(res.error || 'Approval failed');
            }
        } catch (err) { setError(err.message); }
    };

    return {
        companyInfo, companyUsers, loading, stats, recentActivities, error, success,
        showAddUserModal, setShowAddUserModal,
        editingUser, setEditingUser,
        isAddingUser, newUserData, setNewUserData,
        loadDashboardData, handleAddUser, handleUpdateUser, handleDeleteUser, handleApproveUser,
        setError, setSuccess
    };
};
