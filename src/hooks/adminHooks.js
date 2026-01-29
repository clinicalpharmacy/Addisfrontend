import { useState, useCallback } from 'react';
import api from '../utils/api';

// Hook for Dashboard Overview Data
export const useAdminDashboardData = (currentUser) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_users: 0,
        pending_approvals: 0,
        total_companies: 0,
        active_subscriptions: 0,
        total_revenue: 0,
        currency: 'ETB',
        last_updated: null
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [error, setError] = useState('');

    const loadDashboardData = useCallback(async () => {
        if (!currentUser) return;

        try {
            setLoading(true);
            setError('');

            // Parallel fetching for dashboard data
            const [pendingData, statsData, activityData] = await Promise.allSettled([
                api.get('/admin/pending-approvals'),
                api.get('/admin/stats'),
                api.get('/admin/recent-activities')
            ]);

            // Handle Stats
            if (statsData.status === 'fulfilled' && statsData.value.stats) {
                setStats(prev => ({ ...prev, ...statsData.value.stats }));
            }

            // Handle Pending Approvals Count override
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
        }
    }, [currentUser]);

    return { loading, stats, recentActivities, error, loadDashboardData, setStats, setRecentActivities };
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

    return {
        users, pendingUsers, loading, error, processingId,
        loadUsers, approveUser, rejectUser
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

// Hook for Medication Management
export const useAdminMedications = (currentUser) => {
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadMedications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get('/admin/medications');
            setMedications(data.medications || data || []);
        } catch (err) {
            console.warn('Error loading medications, using empty list.');
            setMedications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const addMedication = async (medData) => {
        try {
            const data = await api.post('/admin/medications', medData);
            setMedications(prev => [data.medication || data, ...prev]);
            return { success: true, data: data.medication || data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const updateMedication = async (id, medData) => {
        try {
            const data = await api.put(`/admin/medications/${id}`, medData);
            setMedications(prev => prev.map(m => m.id === id ? (data.medication || data) : m));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const deleteMedication = async (id) => {
        try {
            await api.delete(`/admin/medications/${id}`);
            setMedications(prev => prev.filter(m => m.id !== id));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    return {
        medications, loading, error, loadMedications,
        addMedication, updateMedication, deleteMedication
    };
};

// Hook for Patient Management
export const useAdminPatients = (currentUser) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadPatients = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get('/admin/all-patients');
            setPatients(data.patients || []);
        } catch (err) {
            console.warn('Error loading patients:', err);
            setPatients([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const addPatient = async (patientData) => {
        try {
            // Ensure patient code is generated if missing
            const dataToSend = {
                ...patientData,
                patient_code: patientData.patient_code || `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
            };

            const data = await api.post('/patients', dataToSend);
            const newPatient = data.patient || data;
            setPatients(prev => [newPatient, ...prev]);
            return { success: true, data: newPatient };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const updatePatient = async (id, patientData) => {
        try {
            const data = await api.put(`/patients/${id}`, patientData);
            setPatients(prev => prev.map(p => p.id === id ? (data.patient || data) : p));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const deletePatient = async (id) => {
        try {
            await api.delete(`/patients/${id}`);
            setPatients(prev => prev.filter(p => p.id !== id));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    return {
        patients, loading, error, loadPatients,
        addPatient, updatePatient, deletePatient
    };
};
