import { useState, useCallback, useRef } from 'react';
import api from '../utils/api';

// Hook for Dashboard Overview Data
export const useAdminDashboardData = (currentUser) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_users: 0,
        pending_approvals: 0,
        total_companies: 0,
        active_subscriptions: 0,
        active_support_count: 0,
        total_revenue: 0,
        currency: 'ETB',
        last_updated: null
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [error, setError] = useState('');
    const isFetchingRef = useRef(false);

    const loadDashboardData = useCallback(async () => {
        if (!currentUser) return;
        // Prevent concurrent duplicate requests
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        try {
            setLoading(true);
            setError('');

            // Parallel fetching — NOTE: active-support is intentionally excluded here.
            // It has N+1 DB queries and is only needed for the Support Access tab.
            // It is loaded lazily by SupportVault itself.
            const results = await Promise.allSettled([
                api.get('/admin/pending-approvals'),
                api.get('/admin/stats'),
                api.get('/admin/recent-activities')
            ]);

            const [pendingData, statsData, activityData] = results;

            // Handle Stats
            if (statsData.status === 'fulfilled' && statsData.value.stats) {
                setStats(prev => ({ ...prev, ...statsData.value.stats }));
            }

            // Handle Pending Approvals
            if (pendingData.status === 'fulfilled' && pendingData.value.users) {
                setStats(prev => ({ ...prev, pending_approvals: pendingData.value.users.length }));
            }

            // Handle Activities
            if (activityData.status === 'fulfilled' && activityData.value.activities) {
                setRecentActivities(activityData.value.activities);
            }

        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError('Failed to load dashboard overview.');
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [currentUser]);

    // Separate loader for support count (called only when support tab is active)
    const loadSupportCount = useCallback(async () => {
        try {
            const res = await api.get('/access/active-support');
            if (res?.success && res?.support_patients) {
                setStats(prev => ({ ...prev, active_support_count: res.support_patients.length }));
            }
        } catch (_) {}
    }, []);

    return { loading, stats, recentActivities, error, loadDashboardData, loadSupportCount, setStats, setRecentActivities };
};

// Hook for User Management (Approvals & List)
export const useAdminUsers = (currentUser) => {
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState(null);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const [usersData, pendingData] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/pending-approvals')
            ]);

            if (usersData.users) setUsers(usersData.users);
            if (pendingData.users) setPendingUsers(pendingData.users);

        } catch (err) {
            console.error('Error loading users:', err);
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, []);

    const approveUser = async (userId, userEmail, onSuccess) => {
        try {
            setProcessingId(userId);
            const response = await api.post(`/admin/users/${userId}/approve`);

            if (response.success) {
                // Optimistic update
                setPendingUsers(prev => prev.filter(u => u.id !== userId));
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: true } : u));
                if (onSuccess) onSuccess();
                return true;
            }
            return false;
        } catch (err) {
            setError(`Approval failed: ${err.message}`);
            return false;
        } finally {
            setProcessingId(null);
        }
    };

    const rejectUser = async (userId, userEmail, onSuccess) => {
        try {
            setProcessingId(userId);
            await api.delete(`/admin/users/${userId}/reject`);

            // Optimistic update
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
            setUsers(prev => prev.filter(u => u.id !== userId));
            if (onSuccess) onSuccess();
            return true;
        } catch (err) {
            setError(`Rejection failed: ${err.message}`);
            return false;
        } finally {
            setProcessingId(null);
        }
    };

    const toggleBlockUser = async (userId) => {
        try {
            setProcessingId(userId);
            const response = await api.post(`/admin/users/${userId}/toggle-block`);

            if (response.success) {
                // Optimistic update
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, is_blocked: response.is_blocked, blocked_by: response.blocked_by } : u
                ));
                return { success: true, message: response.message };
            }
            return { success: false, error: response.error };
        } catch (err) {
            setError(`Block/Unblock failed: ${err.message}`);
            return { success: false, error: err.message };
        } finally {
            setProcessingId(null);
        }
    };

    return {
        users, pendingUsers, loading, error, processingId,
        loadUsers, approveUser, rejectUser, toggleBlockUser
    };
};

// Hook for Company Management
export const useAdminCompanies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadCompanies = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get('/admin/companies');
            if (data.success) {
                setCompanies(data.companies || []);
            } else {
                setError(data.error || 'Failed to load companies');
            }
        } catch (err) {
            setError('Network error while loading companies');
        } finally {
            setLoading(false);
        }
    }, []);

    return { companies, loading, error, loadCompanies };
};

// Hook for Subscriptions
export const useAdminSubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadSubscriptions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get('/admin/subscriptions');
            if (data.success) {
                setSubscriptions(data.subscriptions || []);
            } else {
                setError(data.error || 'Failed to load subscriptions');
            }
        } catch (err) {
            setError('Network error while loading subscriptions');
        } finally {
            setLoading(false);
        }
    }, []);

    return { subscriptions, loading, error, loadSubscriptions };
};
