import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    // User icons
    FaUsers, FaUserMd, FaUserCheck, FaUserTimes, FaUserCircle,
    // Medication icons
    FaPills, FaCapsules, FaBookMedical, FaPrescriptionBottleAlt,
    FaStethoscope, FaHistory,
    // Chart and system icons
    FaChartLine, FaCogs, FaServer, FaDatabase, FaSignOutAlt,
    // Alert and status icons
    FaExclamationTriangle, FaCheckCircle, FaClock, FaSpinner, FaRegSadTear,
    FaExclamationCircle,
    // Action icons
    FaSearch, FaDownload, FaEye, FaEdit, FaTrash, FaCalendarAlt,
    FaSync, FaTable, FaChartBar, FaClipboardList, FaTools, FaCode,
    // Navigation icons
    FaHome, FaFileAlt,
    // Security and settings
    FaShieldAlt, FaListAlt, FaRedo, FaTerminal, FaWrench,
    // Other icons
    FaPlus, FaBook, FaBell, FaSyringe, FaPrescription, FaFilter, FaHospital,
    FaUserLock, FaUserPlus,
    FaFileInvoice, FaFolderOpen, FaTasks, FaCog,
    // New icons for medication features
    FaInfoCircle, FaSort, FaSortUp, FaSortDown, FaTimes, FaSave,
    FaSortAlphaDown, FaSortAlphaUp, FaSortAmountDown, FaSortAmountUp,
    FaMedkit, FaAllergies, FaBrain, FaHeart,
    // Patient icons
    FaUserInjured, FaBed, FaHeartbeat, FaNotesMedical,
    // Card view icon
    FaThLarge,
    // Additional icons
    FaPhone, FaFlask
} from 'react-icons/fa';
import api from '../utils/api';
import LabSettings from '../components/LabManagement/LabSettings';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
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
    const [userManagement, setUserManagement] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [selectedTab, setSelectedTab] = useState('overview');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [forceRefresh, setForceRefresh] = useState(0);
    const [processingApproval, setProcessingApproval] = useState({});
    const [realPendingUsers, setRealPendingUsers] = useState([]);
    const [showUserDetails, setShowUserDetails] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [companies, setCompanies] = useState([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);

    // Medication Knowledge Base States
    const [medications, setMedications] = useState([]);
    const [medicationFilter, setMedicationFilter] = useState('');
    const [showAddMedication, setShowAddMedication] = useState(false);
    const [newMedication, setNewMedication] = useState({
        name: '',
        generic_name: '',
        brand_names: '',
        dosage_forms: '',
        strength: '',
        route: '',
        class: '',
        indications: '',
        contraindications: '',
        side_effects: '',
        interactions: '',
        storage: '',
        pregnancy_category: '',
        schedule: '',
        notes: ''
    });
    const [editingMedication, setEditingMedication] = useState(null);
    const [loadingMedications, setLoadingMedications] = useState(false);
    const [medicationSortField, setMedicationSortField] = useState('name');
    const [medicationSortDirection, setMedicationSortDirection] = useState('asc');
    const [selectedMedication, setSelectedMedication] = useState(null);
    const [medicationStats, setMedicationStats] = useState({
        total: 0,
        by_class: {},
        schedule_counts: {}
    });
    const [interactionCheck, setInteractionCheck] = useState({
        medication1: '',
        medication2: '',
        result: null
    });

    const getRemainingDays = (endDate) => {
        if (!endDate) return 'N/A';
        const now = new Date();
        const expiry = new Date(endDate);
        const diffTime = expiry - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? `${diffDays} days` : 'Expired';
    };

    const [companyError, setCompanyError] = useState('');
    const loadCompanies = async () => {
        try {
            setLoadingCompanies(true);
            setCompanyError('');
            const data = await api.get('/admin/companies');
            if (data.success) {
                const companyList = data.companies || [];
                setCompanies(companyList);
                setStats(prev => ({
                    ...prev,
                    total_companies: data.count || companyList.length
                }));
            } else {
                setCompanyError(data.error || 'Failed to load companies');
            }
        } catch (err) {
            console.error('Error loading companies:', err);
            setCompanyError('Network error while loading companies');
        } finally {
            setLoadingCompanies(false);
        }
    };

    // Load user management data
    const [patients, setPatients] = useState([]);
    const [patientFilter, setPatientFilter] = useState('');
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [patientStats, setPatientStats] = useState({
        total: 0,
        active: 0,
        male: 0,
        female: 0,
        pediatric: 0,
        adult: 0,
        pregnant: 0
    });
    const [patientSortField, setPatientSortField] = useState('created_at');
    const [patientSortDirection, setPatientSortDirection] = useState('desc');
    const [showPatientForm, setShowPatientForm] = useState(false);
    const [newPatient, setNewPatient] = useState({
        full_name: '',
        age: '',
        gender: '',
        contact_number: '',
        address: '',
        diagnosis: '',
        is_active: true
    });
    const [editingPatient, setEditingPatient] = useState(null);
    const [patientViewMode, setPatientViewMode] = useState('table');

    // Sample medication data for fallback
    const sampleMedications = [
        {
            id: 1,
            name: 'Amoxicillin',
            generic_name: 'Amoxicillin',
            brand_names: 'Amoxil, Trimox, Moxatag',
            class: 'Antibiotic (Penicillin)',
            dosage_forms: 'Capsule, Tablet, Suspension',
            strength: '250mg, 500mg',
            route: 'Oral',
            indications: 'Bacterial infections',
            contraindications: 'Penicillin allergy',
            side_effects: 'Nausea, diarrhea, rash',
            interactions: 'Warfarin, Oral contraceptives',
            pregnancy_category: 'B',
            schedule: 'Prescription',
            storage: 'Room temperature',
            notes: 'Take with food to reduce GI upset',
            created_at: '2024-01-15'
        }
    ];

    // Navigation functions
    const goToMedicationKnowledgeBase = () => {
        setSelectedTab('medications');
        loadMedications();
    };

    const goToHome = () => {
        navigate('/home');
    };

    // Check admin access on mount
    useEffect(() => {
        checkAdminAccess();
    }, []);

    // Load dashboard data when user changes or force refresh
    useEffect(() => {
        if (currentUser) {
            loadDashboardData();
        }
    }, [currentUser, forceRefresh]);

    // Load medications when medications tab is selected
    useEffect(() => {
        if (selectedTab === 'medications' && currentUser) {
            loadMedications();
        }
    }, [selectedTab, currentUser, forceRefresh]);

    // Load patients when patients tab is selected
    useEffect(() => {
        if (selectedTab === 'patients' && currentUser) {
            loadPatients();
        }
    }, [selectedTab, currentUser, forceRefresh]);

    // Check if user is admin
    const checkAdminAccess = async () => {
        try {
            const userData = localStorage.getItem('user');
            if (!userData) {
                navigate('/login');
                return;
            }

            const user = JSON.parse(userData);
            if (user.role !== 'admin') {
                if (user.role === 'company_admin') {
                    navigate('/company/dashboard');
                } else {
                    navigate('/dashboard');
                }
                return;
            }

            setCurrentUser(user);

            // Verify with backend
            try {
                const data = await api.get('/auth/me');
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setCurrentUser(data.user);
                }
            } catch (authError) {
                console.warn('Backend auth check failed:', authError);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setError('Authentication error');
        }
    };

    // Load dashboard data
    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError('');

            // Test connection first
            try {
                await api.get('/health');
                console.log('✅ Backend connection successful');
            } catch (testError) {
                console.error('❌ Backend connection error:', testError);
                setError('Cannot connect to backend server. Please make sure it\'s running.');
                setLoading(false);
                return;
            }

            // Load pending approvals
            try {
                const pendingData = await api.get('/admin/pending-approvals');
                const usersList = pendingData.users || [];
                setPendingUsers(usersList);
                setRealPendingUsers(usersList);
                setStats(prev => ({ ...prev, pending_approvals: usersList.length }));
            } catch (pendingError) {
                console.warn('Could not load pending approvals:', pendingError);
                setPendingUsers([]);
                setRealPendingUsers([]);
            }

            // Load companies
            try {
                await loadCompanies();
            } catch (companyError) {
                console.warn('Could not load companies:', companyError);
            }

            // Load stats
            try {
                const statsData = await api.get('/admin/stats');
                if (statsData.stats) {
                    setStats(prev => ({ ...prev, ...statsData.stats }));
                }
            } catch (statsError) {
                console.warn('Could not load stats:', statsError);
            }

            // Load all users
            try {
                const usersData = await api.get('/admin/users');
                if (usersData.users) {
                    setUserManagement(usersData.users);
                    setStats(prev => ({ ...prev, total_users: usersData.users.length }));
                }
            } catch (usersError) {
                console.warn('Could not load all users:', usersError);
            }

            // Load recent activities
            try {
                const activityData = await api.get('/admin/recent-activities');
                if (activityData.activities) {
                    setRecentActivities(activityData.activities);
                }
            } catch (activityError) {
                console.warn('Could not load recent activities:', activityError);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error in loadDashboardData:', error);
            setError('Failed to load dashboard data');
            setLoading(false);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Load medications
    const loadMedications = async () => {
        try {
            setLoadingMedications(true);
            setError('');

            try {
                const data = await api.get('/admin/medications');
                const meds = data.medications || data || [];
                setMedications(meds);
                calculateMedicationStats(meds);
            } catch (error) {
                console.warn('Using sample medications:', error.message);
                setMedications(sampleMedications);
                calculateMedicationStats(sampleMedications);
            }
        } catch (error) {
            console.error('Error loading medications:', error);
            setError(`Failed to load medications: ${error.message}`);
        } finally {
            setLoadingMedications(false);
        }
    };

    // Load patients
    const loadPatients = async () => {
        try {
            setLoadingPatients(true);
            setError('');

            try {
                const data = await api.get('/admin/all-patients');
                const patientsList = data.patients || [];
                setPatients(patientsList);
                calculatePatientStats(patientsList);
            } catch (error) {
                console.warn('No patients loaded:', error.message);
                setPatients([]);
                calculatePatientStats([]);
            }
        } catch (error) {
            console.error('Error loading patients:', error);
            setError(`Failed to load patients: ${error.message}`);
        } finally {
            setLoadingPatients(false);
        }
    };

    // Calculate medication statistics
    const calculateMedicationStats = (meds) => {
        const stats = {
            total: meds.length,
            by_class: {},
            schedule_counts: {}
        };

        meds.forEach(med => {
            const medClass = med.class || 'Unknown';
            stats.by_class[medClass] = (stats.by_class[medClass] || 0) + 1;

            const schedule = med.schedule || 'Unknown';
            stats.schedule_counts[schedule] = (stats.schedule_counts[schedule] || 0) + 1;
        });

        setMedicationStats(stats);
    };

    // Calculate patient statistics
    const calculatePatientStats = (patientsList) => {
        const stats = {
            total: patientsList.length,
            active: patientsList.filter(p => p.is_active).length,
            male: patientsList.filter(p => p.gender === 'male').length,
            female: patientsList.filter(p => p.gender === 'female').length,
            pediatric: patientsList.filter(p => p.age && p.age < 18).length,
            adult: patientsList.filter(p => p.age && p.age >= 18).length,
            pregnant: patientsList.filter(p => p.is_pregnant).length || 0
        };

        setPatientStats(stats);
    };

    // Filter and sort medications
    const filteredMedications = medications.filter(med => {
        const searchTermLower = medicationFilter.toLowerCase();
        return (
            med.name.toLowerCase().includes(searchTermLower) ||
            med.generic_name.toLowerCase().includes(searchTermLower) ||
            (med.class && med.class.toLowerCase().includes(searchTermLower)) ||
            (med.brand_names && med.brand_names.toLowerCase().includes(searchTermLower))
        );
    }).sort((a, b) => {
        const aValue = a[medicationSortField] || '';
        const bValue = b[medicationSortField] || '';

        if (medicationSortDirection === 'asc') {
            return aValue.toString().localeCompare(bValue.toString());
        } else {
            return bValue.toString().localeCompare(aValue.toString());
        }
    });

    // Filter and sort patients
    const filteredPatients = patients.filter(patient => {
        const searchTermLower = patientFilter.toLowerCase();
        return (
            patient.full_name.toLowerCase().includes(searchTermLower) ||
            (patient.patient_code && patient.patient_code.toLowerCase().includes(searchTermLower)) ||
            (patient.diagnosis && patient.diagnosis.toLowerCase().includes(searchTermLower)) ||
            (patient.contact_number && patient.contact_number.toLowerCase().includes(searchTermLower))
        );
    }).sort((a, b) => {
        const aValue = a[patientSortField] || '';
        const bValue = b[patientSortField] || '';

        if (patientSortDirection === 'asc') {
            return aValue.toString().localeCompare(bValue.toString());
        } else {
            return bValue.toString().localeCompare(aValue.toString());
        }
    });

    // Handle medication sorting
    const handleMedicationSort = (field) => {
        if (medicationSortField === field) {
            setMedicationSortDirection(medicationSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setMedicationSortField(field);
            setMedicationSortDirection('asc');
        }
    };

    // Handle patient sorting
    const handlePatientSort = (field) => {
        if (patientSortField === field) {
            setPatientSortDirection(patientSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setPatientSortField(field);
            setPatientSortDirection('asc');
        }
    };

    // Add new medication
    const handleAddMedication = async () => {
        try {
            setError('');

            if (!newMedication.name || !newMedication.generic_name) {
                setError('Medication name and generic name are required');
                return;
            }

            const data = await api.post('/admin/medications', newMedication);

            setMedications([data.medication || data, ...medications]);
            setShowAddMedication(false);
            setNewMedication({
                name: '',
                generic_name: '',
                brand_names: '',
                dosage_forms: '',
                strength: '',
                route: '',
                class: '',
                indications: '',
                contraindications: '',
                side_effects: '',
                interactions: '',
                storage: '',
                pregnancy_category: '',
                schedule: '',
                notes: ''
            });

            const newActivity = {
                id: Date.now(),
                user_name: currentUser?.full_name || 'Admin',
                action_type: 'create',
                description: `Added medication: ${newMedication.name}`,
                created_at: new Date().toISOString()
            };
            setRecentActivities(prev => [newActivity, ...prev]);

            setSuccessMessage('Medication added successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
            console.error('Error adding medication:', error);
            setError(`Failed to add medication: ${error.message}`);
        }
    };

    // Add new patient (admin can add for any user)
    const handleAddPatient = async () => {
        try {
            setError('');
            setLoading(true);

            if (!newPatient.full_name) {
                setError('Patient name is required');
                setLoading(false);
                return;
            }

            // Ensure age is a number or null
            const ageVal = newPatient.age === '' ? null : parseInt(newPatient.age);

            const patientData = {
                ...newPatient,
                age: ageVal,
                patient_code: newPatient.patient_code || `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                user_id: currentUser?.id
            };

            console.log('📝 Adding patient with data:', patientData);
            const data = await api.post('/patients', patientData);
            console.log('✅ Patient added successfully:', data);

            const addedPatient = data.patient || data;
            const updatedPatients = [addedPatient, ...patients];

            setPatients(updatedPatients);
            calculatePatientStats(updatedPatients);
            setShowPatientForm(false);

            setNewPatient({
                full_name: '',
                age: '',
                gender: '',
                contact_number: '',
                address: '',
                diagnosis: '',
                is_active: true
            });

            const newActivity = {
                id: Date.now(),
                user_name: currentUser?.full_name || 'Admin',
                action_type: 'create',
                description: `Added patient: ${addedPatient.full_name}`,
                created_at: new Date().toISOString()
            };
            setRecentActivities(prev => [newActivity, ...prev]);

            setSuccessMessage('Patient added successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
            console.error('❌ Error adding patient:', error);
            const errorMessage = error.error || error.message || 'An unknown error occurred';
            setError(`Failed to add patient: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Update medication
    const handleUpdateMedication = async () => {
        try {
            setError('');

            const data = await api.put(`/admin/medications/${editingMedication.id}`, editingMedication);

            setMedications(medications.map(med =>
                med.id === editingMedication.id ? (data.medication || data) : med
            ));
            setEditingMedication(null);

            const newActivity = {
                id: Date.now(),
                user_name: currentUser?.full_name || 'Admin',
                action_type: 'update',
                description: `Updated medication: ${editingMedication.name}`,
                created_at: new Date().toISOString()
            };
            setRecentActivities(prev => [newActivity, ...prev]);

            setSuccessMessage('Medication updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
            console.error('Error updating medication:', error);
            setError(`Failed to update medication: ${error.message}`);
        }
    };

    // Update patient
    const handleUpdatePatient = async () => {
        try {
            setError('');

            const data = await api.put(`/patients/${editingPatient.id}`, editingPatient);

            setPatients(patients.map(patient =>
                patient.id === editingPatient.id ? (data.patient || data) : patient
            ));
            setEditingPatient(null);

            const newActivity = {
                id: Date.now(),
                user_name: currentUser?.full_name || 'Admin',
                action_type: 'update',
                description: `Updated patient: ${editingPatient.full_name}`,
                created_at: new Date().toISOString()
            };
            setRecentActivities(prev => [newActivity, ...prev]);

            setSuccessMessage('Patient updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
            console.error('Error updating patient:', error);
            const errorMessage = error.error || error.message || 'An unknown error occurred';
            setError(`Failed to update patient: ${errorMessage}`);
        }
    };

    // Delete medication
    const handleDeleteMedication = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }

        try {
            await api.delete(`/admin/medications/${id}`);

            setMedications(medications.filter(med => med.id !== id));

            const newActivity = {
                id: Date.now(),
                user_name: currentUser?.full_name || 'Admin',
                action_type: 'delete',
                description: `Deleted medication: ${name}`,
                created_at: new Date().toISOString()
            };
            setRecentActivities(prev => [newActivity, ...prev]);

            setSuccessMessage('Medication deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
            console.error('Error deleting medication:', error);
            setError(`Failed to delete medication: ${error.message}`);
        }
    };

    // Delete patient
    const handleDeletePatient = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete patient "${name}"?`)) {
            return;
        }

        try {
            await api.delete(`/patients/${id}`);

            setPatients(patients.filter(patient => patient.id !== id));

            const newActivity = {
                id: Date.now(),
                user_name: currentUser?.full_name || 'Admin',
                action_type: 'delete',
                description: `Deleted patient: ${name}`,
                created_at: new Date().toISOString()
            };
            setRecentActivities(prev => [newActivity, ...prev]);

            // Refresh stats if we're on dashboard
            if (selectedTab === 'dashboard') {
                loadDashboardData();
            }

            setSuccessMessage('Patient deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
            console.error('Error deleting patient:', error);
            const errorMessage = error.error || error.message || 'An unknown error occurred';
            setError(`Failed to delete patient: ${errorMessage}`);
        }
    };

    // Check drug interactions
    const checkInteractions = async () => {
        if (!interactionCheck.medication1 || !interactionCheck.medication2) {
            setError('Please select both medications');
            return;
        }

        try {
            const data = await api.post('/admin/check-interaction', {
                med1: interactionCheck.medication1,
                med2: interactionCheck.medication2
            });

            setInteractionCheck(prev => ({ ...prev, result: data }));
        } catch (error) {
            console.error('Error checking interactions:', error);
            setError(`Failed to check interactions: ${error.message}`);
        }
    };

    // Handle user approval
    const handleApproveUser = async (userId, userEmail) => {
        try {
            setProcessingApproval(prev => ({ ...prev, [userId]: true }));

            const userToApprove = realPendingUsers.find(u => u.id === userId || u.email === userEmail);

            if (!userToApprove) {
                setError('User not found in pending list');
                setProcessingApproval(prev => ({ ...prev, [userId]: false }));
                return;
            }

            let confirmMessage = `APPROVE USER?\n\n` +
                `Name: ${userToApprove.full_name}\n` +
                `Email: ${userToApprove.email}\n` +
                `Institution: ${userToApprove.institution}\n\n` +
                `This will allow them to login to the system.`;

            if (!window.confirm(confirmMessage)) {
                setProcessingApproval(prev => ({ ...prev, [userId]: false }));
                return;
            }

            const responseData = await api.post(`/admin/users/${userToApprove.id}/approve`);

            if (responseData.success) {
                const newActivity = {
                    id: Date.now(),
                    user_name: currentUser?.full_name || 'Admin',
                    action_type: 'approval',
                    description: `Approved user: ${userToApprove.full_name} (${userToApprove.email})`,
                    created_at: new Date().toISOString()
                };
                setRecentActivities(prev => [newActivity, ...prev]);

                setSuccessMessage(`User approved successfully! ${userToApprove.email} can now login.`);
                setTimeout(() => setSuccessMessage(''), 5000);

                setPendingUsers(prev => prev.filter(user => user.id !== userToApprove.id));
                setRealPendingUsers(prev => prev.filter(user => user.id !== userToApprove.id));

                setUserManagement(prev => prev.map(user =>
                    user.id === userToApprove.id ? { ...user, approved: true } : user
                ));

                setStats(prev => ({
                    ...prev,
                    pending_approvals: prev.pending_approvals - 1
                }));

                setTimeout(() => {
                    setForceRefresh(prev => prev + 1);
                }, 1000);
            } else {
                setError(`Approval failed: ${responseData.error || 'Unknown error'}`);
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
        } finally {
            setProcessingApproval(prev => ({ ...prev, [userId]: false }));
        }
    };

    // Handle user rejection
    const handleRejectUser = async (userId, userEmail) => {
        try {
            const userToReject = realPendingUsers.find(u => u.id === userId || u.email === userEmail);

            if (!userToReject) {
                setError('User not found in pending list');
                return;
            }

            const confirmMessage = `Are you sure you want to REJECT and DELETE this user?\n\n` +
                `This action cannot be undone!\n\n` +
                `Name: ${userToReject.full_name}\n` +
                `Email: ${userToReject.email}\n` +
                `Institution: ${userToReject.institution}`;

            if (!window.confirm(confirmMessage)) {
                return;
            }

            await api.delete(`/admin/users/${userToReject.id}/reject`);

            const newActivity = {
                id: Date.now(),
                user_name: currentUser?.full_name || 'Admin',
                action_type: 'delete',
                description: `Rejected user: ${userToReject.full_name} (${userToReject.email})`,
                created_at: new Date().toISOString()
            };
            setRecentActivities(prev => [newActivity, ...prev]);

            setSuccessMessage(`User rejected and deleted!`);
            setTimeout(() => setSuccessMessage(''), 5000);

            setForceRefresh(prev => prev + 1);

        } catch (error) {
            console.error('Error rejecting user:', error);
            setError('Failed to reject user.');
        }
    };

    // Download report
    const downloadReport = () => {
        const report = {
            generated: new Date().toISOString(),
            generated_by: currentUser?.email,
            user_name: currentUser?.full_name,
            stats: stats,
            pending_users: pendingUsers,
            all_users: userManagement,
            medications: medications,
            medication_stats: medicationStats,
            patients: patients,
            patient_stats: patientStats,
            activities: recentActivities,
            note: 'This is an administrative report. Handle with confidentiality.'
        };

        const content = JSON.stringify(report, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PharmaCare_Admin_Report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setSuccessMessage('Report downloaded successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // ==================== HELPER FUNCTIONS ====================

    // Format date
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffHours < 1) {
                return 'Just now';
            } else if (diffHours < 24) {
                return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            } else if (diffDays < 7) {
                return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            } else {
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch {
            return 'Invalid date';
        }
    };

    // Get activity icon
    const getActivityIcon = (actionType) => {
        switch (actionType) {
            case 'login': return <FaUserLock className="text-green-500 text-lg" />;
            case 'create': return <FaFileAlt className="text-blue-500 text-lg" />;
            case 'update': return <FaEdit className="text-yellow-500 text-lg" />;
            case 'delete': return <FaTrash className="text-red-500 text-lg" />;
            case 'system': return <FaCogs className="text-purple-500 text-lg" />;
            case 'approval': return <FaUserCheck className="text-green-500 text-lg" />;
            case 'approve_user': return <FaUserCheck className="text-green-500 text-lg" />;
            case 'reject_user': return <FaUserTimes className="text-red-500 text-lg" />;
            case 'view_dashboard': return <FaChartLine className="text-blue-500 text-lg" />;
            case 'payment': return <FaFileInvoice className="text-green-500 text-lg" />;
            case 'subscription': return <FaFileInvoice className="text-blue-500 text-lg" />;
            case 'patient_create': return <FaUserInjured className="text-blue-500 text-lg" />;
            case 'patient_update': return <FaUserInjured className="text-yellow-500 text-lg" />;
            default: return <FaHistory className="text-gray-500 text-lg" />;
        }
    };

    // Get status badge
    const getStatusBadge = (approved, role) => {
        if (role === 'admin') {
            return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Admin</span>;
        }
        return approved ?
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Approved</span> :
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Pending</span>;
    };

    // Get role badge
    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Admin</span>;
            case 'pharmacist': return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Pharmacist</span>;
            case 'company_admin': return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Company Admin</span>;
            default: return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">{role}</span>;
        }
    };

    // Get patient status badge
    const getPatientStatusBadge = (is_active) => {
        return is_active ?
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span> :
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Inactive</span>;
    };

    // Get gender badge
    const getGenderBadge = (gender) => {
        switch (gender) {
            case 'male': return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Male</span>;
            case 'female': return <span className="px-2 py-1 text-xs bg-pink-100 text-pink-800 rounded">Female</span>;
            case 'other': return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Other</span>;
            default: return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Unknown</span>;
        }
    };

    // Filter users based on search and filters
    const filteredUsers = userManagement.filter(user => {
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

    // Get medication class color
    const getMedicationClassColor = (medClass) => {
        const classColors = {
            'Antibiotic': 'bg-blue-100 text-blue-800',
            'Antidiabetic': 'bg-green-100 text-green-800',
            'Antihyperlipidemic': 'bg-purple-100 text-purple-800',
            'Antihypertensive': 'bg-red-100 text-red-800',
            'Bronchodilator': 'bg-yellow-100 text-yellow-800',
            'Analgesic': 'bg-orange-100 text-orange-800',
            'Antidepressant': 'bg-indigo-100 text-indigo-800',
            'Anticoagulant': 'bg-pink-100 text-pink-800'
        };

        for (const [key, value] of Object.entries(classColors)) {
            if (medClass && medClass.includes(key)) {
                return value;
            }
        }

        return 'bg-gray-100 text-gray-800';
    };

    // Get pregnancy category color
    const getPregnancyCategoryColor = (category) => {
        switch (category) {
            case 'A': return 'bg-green-100 text-green-800';
            case 'B': return 'bg-blue-100 text-blue-800';
            case 'C': return 'bg-yellow-100 text-yellow-800';
            case 'D': return 'bg-orange-100 text-orange-800';
            case 'X': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Handle logout
    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            navigate('/login');
        }
    };

    // ==================== LOADING STATE ====================
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-3 text-gray-600">Loading Admin Dashboard...</p>
                    <p className="text-sm text-gray-400 mt-1">Fetching data from database</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 m-4 rounded-lg shadow">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <FaCheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">{successMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4 rounded-lg shadow">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white shadow-lg mb-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <FaUserCircle className="text-blue-600 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                                <p className="text-gray-600">
                                    Welcome, <span className="font-semibold">{currentUser?.full_name || 'Administrator'}</span>
                                    <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                                        {currentUser?.role || 'Admin'}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={goToHome}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm"
                            >
                                <FaHome /> Main Dashboard
                            </button>

                            <button
                                onClick={goToMedicationKnowledgeBase}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm"
                            >
                                <FaBookMedical /> Medication KB
                            </button>

                            <button
                                onClick={downloadReport}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm"
                            >
                                <FaDownload /> Export Report
                            </button>

                            <button
                                onClick={() => setForceRefresh(prev => prev + 1)}
                                disabled={refreshing}
                                className={`bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {refreshing ? (
                                    <FaSpinner className="animate-spin" />
                                ) : (
                                    <FaSync />
                                )}
                                Refresh
                            </button>

                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm"
                            >
                                <FaSignOutAlt /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs Navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <div className="bg-white rounded-xl shadow-lg p-2">
                    <nav className="flex space-x-1 overflow-x-auto">
                        {['overview', 'approvals', 'users', 'companies', 'medications', 'patients', 'labs'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setSelectedTab(tab);
                                    if (tab === 'medications') loadMedications();
                                    if (tab === 'patients') loadPatients();
                                }}
                                className={`py-2 px-4 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all ${selectedTab === tab
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                    }`}
                            >
                                {tab === 'overview' && 'Overview'}
                                {tab === 'approvals' && (
                                    <div className="flex items-center gap-2">
                                        <FaUserCheck />
                                        Approvals
                                        {realPendingUsers.length > 0 && (
                                            <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {realPendingUsers.length}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {tab === 'users' && (
                                    <div className="flex items-center gap-2">
                                        <FaUsers />
                                        Users
                                    </div>
                                )}
                                {tab === 'companies' && (
                                    <div className="flex items-center gap-2">
                                        <FaHospital />
                                        Companies
                                        {companies.length > 0 && (
                                            <span className="ml-1 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {companies.length}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {tab === 'medications' && (
                                    <div className="flex items-center gap-2">
                                        <FaPills />
                                        Medications
                                        <span className="ml-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                            {medications.length}
                                        </span>
                                    </div>
                                )}
                                {tab === 'patients' && (
                                    <div className="flex items-center gap-2">
                                        <FaUserInjured />
                                        Patients
                                        <span className="ml-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                            {patients.length}
                                        </span>
                                    </div>
                                )}
                                {tab === 'labs' && (
                                    <div className="flex items-center gap-2">
                                        <FaFlask />
                                        Global Labs
                                    </div>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                {/* Overview Tab */}
                {selectedTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Users</p>
                                        <p className="text-3xl font-bold text-gray-800">{stats.total_users || 0}</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <FaUsers className="text-blue-600 text-xl" />
                                    </div>
                                </div>
                                <div className="mt-2 text-sm">
                                    <span className="text-green-600 font-medium">
                                        {userManagement.filter(u => u.approved && u.role === 'pharmacist').length} active pharmacists
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Pending Approvals</p>
                                        <p className="text-3xl font-bold text-gray-800">{stats.pending_approvals || 0}</p>
                                        <p className="text-xs text-gray-500 mt-1">Waiting for approval</p>
                                    </div>
                                    <div className="p-3 bg-yellow-100 rounded-full">
                                        <FaClock className="text-yellow-600 text-xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Medications in KB</p>
                                        <p className="text-3xl font-bold text-green-600">{medications.length}</p>
                                        <p className="text-xs text-gray-500 mt-1">Knowledge Base Entries</p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <FaPills className="text-green-600 text-xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Companies</p>
                                        <p className="text-3xl font-bold text-purple-600">{companies.length}</p>
                                        <p className="text-xs text-gray-500 mt-1">Registered Institutions</p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-full">
                                        <FaHospital className="text-purple-600 text-xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Patients</p>
                                        <p className="text-3xl font-bold text-blue-600">{patients.length}</p>
                                        <p className="text-xs text-gray-500 mt-1">All system patients</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <FaUserInjured className="text-blue-600 text-xl" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activities and Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-xl shadow">
                                <div className="p-6 border-b">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <FaHistory /> Recent Activities
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {recentActivities.map((activity, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                                <div className="mt-1">
                                                    {getActivityIcon(activity.action_type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <p className="font-medium text-gray-800">
                                                            {activity.user_name}
                                                        </p>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(activity.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow">
                                <div className="p-6 border-b">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <FaCog /> Quick Actions
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={() => setSelectedTab('approvals')}
                                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FaUserCheck /> Review Pending Approvals
                                            </div>
                                            {realPendingUsers.length > 0 && (
                                                <span className="bg-white text-yellow-600 text-xs px-2 py-1 rounded-full">
                                                    {realPendingUsers.length} pending
                                                </span>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setSelectedTab('medications')}
                                            className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FaPills /> Medication Knowledge Base
                                            </div>
                                            <span className="text-sm">{medications.length} meds</span>
                                        </button>

                                        <button
                                            onClick={() => setSelectedTab('patients')}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FaUserInjured /> Patient Management
                                            </div>
                                            <span className="text-sm">{patients.length} patients</span>
                                        </button>

                                        <button
                                            onClick={downloadReport}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg flex items-center gap-2"
                                        >
                                            <FaDownload /> Export System Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Approvals Tab */}
                {selectedTab === 'approvals' && (
                    <div className="bg-white rounded-xl shadow">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Pending Approvals ({realPendingUsers.length})
                                </h2>
                                <button
                                    onClick={() => setForceRefresh(prev => prev + 1)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                >
                                    <FaSync /> Refresh Data
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {realPendingUsers.length > 0 ? (
                                <div className="space-y-4">
                                    {realPendingUsers.map((user) => (
                                        <div key={user.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                                                <FaUserCircle className="text-yellow-600" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="font-medium text-gray-800">{user.full_name}</h4>
                                                                    <p className="text-sm text-gray-600">{user.email}</p>
                                                                </div>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatDate(user.created_at)}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 flex gap-2">
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                    {user.institution}
                                                                </span>
                                                                <span className={`text-xs px-2 py-1 rounded ${user.account_type === 'company'
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                                    }`}>
                                                                    {user.account_type === 'company' ? 'Company Admin' : 'Individual'}
                                                                </span>
                                                                <span className={`text-xs px-2 py-1 rounded ${user.role === 'company_admin'
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : user.role === 'pharmacist'
                                                                        ? 'bg-blue-100 text-blue-800'
                                                                        : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {user.role}
                                                                </span>
                                                            </div>
                                                            <div className="mt-3 flex gap-2">
                                                                <button
                                                                    onClick={() => handleApproveUser(user.id, user.email)}
                                                                    disabled={processingApproval[user.id]}
                                                                    className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition ${processingApproval[user.id] ? 'opacity-50 cursor-not-allowed' : ''
                                                                        }`}
                                                                >
                                                                    {processingApproval[user.id] ? (
                                                                        <FaSpinner className="animate-spin" />
                                                                    ) : (
                                                                        <FaUserCheck />
                                                                    )}
                                                                    {processingApproval[user.id] ? 'Approving...' : 'Approve User'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectUser(user.id, user.email)}
                                                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                                                >
                                                                    <FaUserTimes /> Reject User
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FaCheckCircle className="text-6xl text-green-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-gray-800 mb-2">No Pending Approvals</h3>
                                    <p className="text-gray-600 max-w-md mx-auto">
                                        All users are approved. New registrations will appear here.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Companies Tab */}
                {selectedTab === 'companies' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Company Management</h2>
                                <p className="text-gray-600">Overview of all registered medical institutions and pharmacies.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={loadCompanies}
                                    className="bg-purple-100 text-purple-600 p-2 rounded-lg hover:bg-purple-200 transition"
                                    title="Refresh Companies"
                                >
                                    <FaSync className={loadingCompanies ? 'animate-spin' : ''} />
                                </button>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-purple-600">{companies.length}</p>
                                    <p className="text-sm text-gray-500">Total Registered</p>
                                </div>
                            </div>
                        </div>

                        {companyError && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center gap-3">
                                <FaExclamationTriangle className="text-red-500" />
                                <p className="text-red-700">{companyError}</p>
                                <button
                                    onClick={loadCompanies}
                                    className="ml-auto text-sm font-bold text-red-600 hover:underline"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {loadingCompanies ? (
                            <div className="flex justify-center py-12">
                                <FaSpinner className="text-4xl text-purple-500 animate-spin" />
                            </div>
                        ) : companies.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {companies.map((company) => (
                                    <div key={company.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
                                                        <FaHospital className="text-2xl" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800">{company.company_name}</h3>
                                                        <p className="text-sm text-gray-500">{company.company_type || 'Institution'}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${company.subscription_status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {company.subscription_status?.toUpperCase() || 'INACTIVE'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-6">
                                                <div className="space-y-2">
                                                    <p className="text-xs text-gray-500 uppercase font-semibold">Contact Details</p>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <FaPhone className="text-gray-400" /> {company.admin_phone || 'N/A'}
                                                    </div>
                                                    <p className="text-sm text-gray-700 flex items-center gap-2">
                                                        <FaCalendarAlt className="text-gray-400" /> Reg: {formatDate(company.created_at)}
                                                    </p>
                                                </div>
                                                <div className="space-y-2 text-right">
                                                    <p className="text-xs text-gray-500 uppercase font-semibold">Capacity & Size</p>
                                                    <p className="text-sm text-gray-700">Size: {company.company_size || 'N/A'}</p>
                                                    <p className="text-sm text-gray-700">Users: {company.user_capacity || 0}</p>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-gray-100">
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Admin User</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                                            {company.users?.full_name?.charAt(0) || 'A'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">{company.users?.full_name || 'N/A'}</p>
                                                            <p className="text-xs text-gray-500">{company.users?.email || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">View Details</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow p-12 text-center">
                                <FaHospital className="text-6xl text-gray-200 mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-gray-800 mb-2">No Companies Registered</h3>
                                <p className="text-gray-500">Registration requests from medical institutions will appear here.</p>
                            </div>
                        )}
                    </div>
                )}


                {/* Users Tab */}
                {selectedTab === 'users' && (
                    <div className="bg-white rounded-xl shadow">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    All Users ({filteredUsers.length})
                                </h2>
                                <button
                                    onClick={() => setForceRefresh(prev => prev + 1)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                >
                                    <FaSync /> Refresh
                                </button>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name, email, or institution..."
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={filterRole}
                                        onChange={(e) => setFilterRole(e.target.value)}
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="admin">Admin</option>
                                        <option value="pharmacist">Pharmacist</option>
                                        <option value="company_admin">Company Admin</option>
                                    </select>
                                    <select
                                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="approved">Approved</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {filteredUsers.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-700">
                                                <th className="border p-3 text-left">User</th>
                                                <th className="border p-3 text-left">Role</th>
                                                <th className="border p-3 text-left">Subscription</th>
                                                <th className="border p-3 text-left">Remaining</th>
                                                <th className="border p-3 text-left">Status</th>
                                                <th className="border p-3 text-left">Institution</th>
                                                <th className="border p-3 text-left">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map((user) => (
                                                <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                                                    <td className="border p-3">
                                                        <div>
                                                            <p className="font-medium text-gray-800">{user.full_name || 'No name'}</p>
                                                            <p className="text-sm text-gray-600">{user.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="border p-3">
                                                        {getRoleBadge(user.role)}
                                                    </td>
                                                    <td className="border p-3">
                                                        <span className={`text-xs px-2 py-1 rounded ${user.subscription_status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {user.subscription_status || 'inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="border p-3">
                                                        {user.role === 'admin' ? (
                                                            <span className="text-sm text-gray-400">∞ (Admin)</span>
                                                        ) : (
                                                            <span className={`text-sm font-medium ${parseInt(getRemainingDays(user.subscription_end_date)) < 7
                                                                ? 'text-red-600 animate-pulse'
                                                                : 'text-gray-700'
                                                                }`}>
                                                                {getRemainingDays(user.subscription_end_date)}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="border p-3">
                                                        {getStatusBadge(user.approved, user.role)}
                                                    </td>
                                                    <td className="border p-3">
                                                        <div>
                                                            <p className="text-sm">{user.institution}</p>
                                                        </div>
                                                    </td>
                                                    <td className="border p-3">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setShowUserDetails(user)}
                                                                className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                                                            >
                                                                <FaEye /> View
                                                            </button>
                                                            {!user.approved && (
                                                                <button
                                                                    onClick={() => handleApproveUser(user.id, user.email)}
                                                                    className="text-green-500 hover:text-green-700 text-sm flex items-center gap-1"
                                                                >
                                                                    <FaUserCheck /> Approve
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FaRegSadTear className="text-6xl text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-gray-800 mb-2">No Users Found</h3>
                                    <p className="text-gray-600 max-w-md mx-auto">
                                        No users match your search criteria.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Medications Tab */}
                {selectedTab === 'medications' && (
                    <div className="space-y-6">
                        {/* Medication Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Medications</p>
                                        <p className="text-3xl font-bold text-gray-800">{medicationStats.total}</p>
                                        <p className="text-xs text-gray-500 mt-1">Knowledge Base</p>
                                    </div>
                                    <div className="p-3 bg-indigo-100 rounded-full">
                                        <FaPills className="text-indigo-600 text-xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Classes</p>
                                        <p className="text-3xl font-bold text-gray-800">{Object.keys(medicationStats.by_class).length}</p>
                                        <p className="text-xs text-gray-500 mt-1">Different drug classes</p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <FaBookMedical className="text-green-600 text-xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Prescription Drugs</p>
                                        <p className="text-3xl font-bold text-gray-800">{medicationStats.schedule_counts['Prescription'] || 0}</p>
                                        <p className="text-xs text-gray-500 mt-1">Require prescription</p>
                                    </div>
                                    <div className="p-3 bg-red-100 rounded-full">
                                        <FaPrescriptionBottleAlt className="text-red-600 text-xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Interaction Checker</p>
                                        <p className="text-3xl font-bold text-gray-800">Ready</p>
                                        <p className="text-xs text-gray-500 mt-1">Check drug interactions</p>
                                    </div>
                                    <div className="p-3 bg-yellow-100 rounded-full">
                                        <FaExclamationTriangle className="text-yellow-600 text-xl" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Medication Search and Actions */}
                        <div className="bg-white rounded-xl shadow">
                            <div className="p-6 border-b">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800">Medication Knowledge Base</h2>
                                        <p className="text-gray-600 text-sm mt-1">Manage medications, dosages, and interactions</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search medications..."
                                                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
                                                value={medicationFilter}
                                                onChange={(e) => setMedicationFilter(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowAddMedication(true)}
                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                        >
                                            <FaPlus /> Add Medication
                                        </button>
                                        <button
                                            onClick={loadMedications}
                                            disabled={loadingMedications}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                        >
                                            {loadingMedications ? <FaSpinner className="animate-spin" /> : <FaSync />}
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Interaction Checker */}
                            <div className="p-6 border-b bg-blue-50">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <FaExclamationTriangle className="text-yellow-500" /> Drug Interaction Checker
                                </h3>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <select
                                        className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={interactionCheck.medication1}
                                        onChange={(e) => setInteractionCheck(prev => ({ ...prev, medication1: e.target.value }))}
                                    >
                                        <option value="">Select Medication 1</option>
                                        {medications.map(med => (
                                            <option key={med.id} value={med.name}>{med.name} ({med.generic_name})</option>
                                        ))}
                                    </select>
                                    <select
                                        className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={interactionCheck.medication2}
                                        onChange={(e) => setInteractionCheck(prev => ({ ...prev, medication2: e.target.value }))}
                                    >
                                        <option value="">Select Medication 2</option>
                                        {medications.map(med => (
                                            <option key={med.id} value={med.name}>{med.name} ({med.generic_name})</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={checkInteractions}
                                        disabled={!interactionCheck.medication1 || !interactionCheck.medication2}
                                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FaExclamationTriangle /> Check Interaction
                                    </button>
                                </div>

                                {interactionCheck.result && (
                                    <div className="mt-4 p-4 border rounded-lg bg-white">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FaExclamationTriangle className={`text-${interactionCheck.result.severity === 'High' ? 'red' : interactionCheck.result.severity === 'Moderate' ? 'yellow' : 'green'}-500`} />
                                            <h4 className="font-semibold">Interaction Result: {interactionCheck.result.interaction}</h4>
                                        </div>
                                        <p className="text-gray-700 mb-2">{interactionCheck.result.description}</p>
                                        <p className="text-sm text-gray-600"><strong>Recommendation:</strong> {interactionCheck.result.recommendations}</p>
                                    </div>
                                )}
                            </div>

                            {/* Medications Table */}
                            <div className="p-6">
                                {loadingMedications ? (
                                    <div className="text-center py-12">
                                        <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                                        <p className="text-gray-600">Loading medications...</p>
                                    </div>
                                ) : filteredMedications.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-700">
                                                    <th
                                                        className="border p-3 text-left cursor-pointer"
                                                        onClick={() => handleMedicationSort('name')}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            Medication
                                                            {medicationSortField === 'name' && (
                                                                medicationSortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th
                                                        className="border p-3 text-left cursor-pointer"
                                                        onClick={() => handleMedicationSort('class')}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            Class
                                                            {medicationSortField === 'class' && (
                                                                medicationSortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th className="border p-3 text-left">Dosage Forms</th>
                                                    <th className="border p-3 text-left">Indications</th>
                                                    <th className="border p-3 text-left">Pregnancy</th>
                                                    <th className="border p-3 text-left">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredMedications.map((med) => (
                                                    <tr key={med.id} className="border-b hover:bg-gray-50 transition-colors">
                                                        <td className="border p-3">
                                                            <div>
                                                                <p className="font-medium text-gray-800">{med.name}</p>
                                                                <p className="text-sm text-gray-600">{med.generic_name}</p>
                                                                <p className="text-xs text-gray-500">{med.brand_names}</p>
                                                            </div>
                                                        </td>
                                                        <td className="border p-3">
                                                            <span className={`text-xs px-2 py-1 rounded ${getMedicationClassColor(med.class)}`}>
                                                                {med.class}
                                                            </span>
                                                        </td>
                                                        <td className="border p-3">
                                                            <div>
                                                                <p className="text-sm">{med.dosage_forms}</p>
                                                                <p className="text-xs text-gray-500">{med.strength}</p>
                                                            </div>
                                                        </td>
                                                        <td className="border p-3">
                                                            <p className="text-sm line-clamp-2">{med.indications}</p>
                                                        </td>
                                                        <td className="border p-3">
                                                            <span className={`text-xs px-2 py-1 rounded ${getPregnancyCategoryColor(med.pregnancy_category)}`}>
                                                                Category {med.pregnancy_category}
                                                            </span>
                                                        </td>
                                                        <td className="border p-3">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setSelectedMedication(med)}
                                                                    className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                                                                >
                                                                    <FaEye /> View
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingMedication(med)}
                                                                    className="text-yellow-500 hover:text-yellow-700 text-sm flex items-center gap-1"
                                                                >
                                                                    <FaEdit /> Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteMedication(med.id, med.name)}
                                                                    className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                                                                >
                                                                    <FaTrash /> Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FaBookMedical className="text-6xl text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-medium text-gray-800 mb-2">No Medications Found</h3>
                                        <p className="text-gray-600 max-w-md mx-auto">
                                            {medicationFilter ? 'No medications match your search.' : 'Add your first medication to get started.'}
                                        </p>
                                        {!medicationFilter && (
                                            <button
                                                onClick={() => setShowAddMedication(true)}
                                                className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                            >
                                                <FaPlus /> Add First Medication
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Patients Tab */}
                {selectedTab === 'patients' && (
                    <div className="space-y-6">
                        {/* Patient Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Patients</p>
                                        <p className="text-3xl font-bold text-gray-800">{patientStats.total}</p>
                                        <p className="text-xs text-gray-500 mt-1">All patients</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <FaUserInjured className="text-blue-600 text-xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Active Patients</p>
                                        <p className="text-3xl font-bold text-green-600">{patientStats.active}</p>
                                        <p className="text-xs text-gray-500 mt-1">Currently active</p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <FaHeartbeat className="text-green-600 text-xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Male/Female</p>
                                        <p className="text-3xl font-bold text-gray-800">
                                            {patientStats.male}/{patientStats.female}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Gender distribution</p>
                                    </div>
                                    <div className="p-3 bg-pink-100 rounded-full">
                                        <FaUsers className="text-pink-600 text-xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Adult/Pediatric</p>
                                        <p className="text-3xl font-bold text-gray-800">
                                            {patientStats.adult}/{patientStats.pediatric}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Age distribution</p>
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-full">
                                        <FaBed className="text-orange-600 text-xl" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Patient Management */}
                        <div className="bg-white rounded-xl shadow">
                            <div className="p-6 border-b">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800">Patient Management</h2>
                                        <p className="text-gray-600 text-sm mt-1">Manage all patients in the system</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search patients..."
                                                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
                                                value={patientFilter}
                                                onChange={(e) => setPatientFilter(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setPatientViewMode(patientViewMode === 'table' ? 'card' : 'table')}
                                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                            >
                                                {patientViewMode === 'table' ? <FaThLarge /> : <FaTable />}
                                                {patientViewMode === 'table' ? 'Card View' : 'Table View'}
                                            </button>
                                            <button
                                                onClick={() => setShowPatientForm(true)}
                                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                            >
                                                <FaPlus /> Add Patient
                                            </button>
                                            <button
                                                onClick={loadPatients}
                                                disabled={loadingPatients}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                            >
                                                {loadingPatients ? <FaSpinner className="animate-spin" /> : <FaSync />}
                                                Refresh
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {loadingPatients ? (
                                    <div className="text-center py-12">
                                        <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                                        <p className="text-gray-600">Loading patients...</p>
                                    </div>
                                ) : filteredPatients.length > 0 ? (
                                    patientViewMode === 'table' ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 text-gray-700">
                                                        <th
                                                            className="border p-3 text-left cursor-pointer"
                                                            onClick={() => handlePatientSort('full_name')}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                Patient
                                                                {patientSortField === 'full_name' && (
                                                                    patientSortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th
                                                            className="border p-3 text-left cursor-pointer"
                                                            onClick={() => handlePatientSort('age')}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                Age
                                                                {patientSortField === 'age' && (
                                                                    patientSortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th className="border p-3 text-left">Gender</th>
                                                        <th className="border p-3 text-left">Contact</th>
                                                        <th className="border p-3 text-left">Diagnosis</th>
                                                        <th className="border p-3 text-left">Status</th>
                                                        <th className="border p-3 text-left">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredPatients.map((patient) => (
                                                        <tr key={patient.id} className="border-b hover:bg-gray-50 transition-colors">
                                                            <td className="border p-3">
                                                                <div>
                                                                    <p className="font-medium text-gray-800">{patient.full_name}</p>
                                                                    <p className="text-xs text-gray-500">{patient.patient_code}</p>
                                                                </div>
                                                            </td>
                                                            <td className="border p-3">
                                                                <span className="font-medium">{patient.age || 'N/A'}</span>
                                                            </td>
                                                            <td className="border p-3">
                                                                {getGenderBadge(patient.gender)}
                                                            </td>
                                                            <td className="border p-3">
                                                                <div className="flex items-center gap-1">
                                                                    <FaPhone className="text-gray-400 text-sm" />
                                                                    <span className="text-sm">{patient.contact_number || 'N/A'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="border p-3">
                                                                <p className="text-sm line-clamp-1">{patient.diagnosis || 'No diagnosis'}</p>
                                                            </td>
                                                            <td className="border p-3">
                                                                {getPatientStatusBadge(patient.is_active)}
                                                            </td>
                                                            <td className="border p-3">
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => setEditingPatient(patient)}
                                                                        className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                                                                    >
                                                                        <FaEye /> View
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingPatient(patient)}
                                                                        className="text-yellow-500 hover:text-yellow-700 text-sm flex items-center gap-1"
                                                                    >
                                                                        <FaEdit /> Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletePatient(patient.id, patient.full_name)}
                                                                        className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                                                                    >
                                                                        <FaTrash /> Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredPatients.map((patient) => (
                                                <div key={patient.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h4 className="font-medium text-gray-800">{patient.full_name}</h4>
                                                            <p className="text-xs text-gray-500">{patient.patient_code}</p>
                                                        </div>
                                                        {getPatientStatusBadge(patient.is_active)}
                                                    </div>
                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">Age:</span>
                                                            <span className="font-medium">{patient.age || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">Gender:</span>
                                                            {getGenderBadge(patient.gender)}
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">Contact:</span>
                                                            <span className="text-sm">{patient.contact_number || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mb-4">
                                                        <p className="text-sm text-gray-600 mb-1">Diagnosis:</p>
                                                        <p className="text-sm line-clamp-2">{patient.diagnosis || 'No diagnosis'}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setEditingPatient(patient)}
                                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                                                        >
                                                            <FaEye /> View Details
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingPatient(patient)}
                                                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                                                        >
                                                            <FaEdit /> Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center py-12">
                                        <FaUserInjured className="text-6xl text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-medium text-gray-800 mb-2">No Patients Found</h3>
                                        <p className="text-gray-600 max-w-md mx-auto">
                                            {patientFilter ? 'No patients match your search.' : 'Add your first patient to get started.'}
                                        </p>
                                        {!patientFilter && (
                                            <button
                                                onClick={() => setShowPatientForm(true)}
                                                className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                            >
                                                <FaPlus /> Add First Patient
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {selectedTab === 'labs' && (
                    <div className="animate-fadeIn">
                        <LabSettings />
                    </div>
                )}
            </main>

            {/* Add Medication Modal */}
            {showAddMedication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">Add New Medication</h3>
                                <button
                                    onClick={() => setShowAddMedication(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name *</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newMedication.name}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Amoxicillin"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name *</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newMedication.generic_name}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, generic_name: e.target.value }))}
                                        placeholder="e.g., Amoxicillin"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Names</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newMedication.brand_names}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, brand_names: e.target.value }))}
                                        placeholder="e.g., Amoxil, Trimox"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Drug Class</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newMedication.class}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, class: e.target.value }))}
                                        placeholder="e.g., Antibiotic (Penicillin)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Forms</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newMedication.dosage_forms}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, dosage_forms: e.target.value }))}
                                        placeholder="e.g., Capsule, Tablet, Suspension"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newMedication.strength}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, strength: e.target.value }))}
                                        placeholder="e.g., 250mg, 500mg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Route of Administration</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newMedication.route}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, route: e.target.value }))}
                                        placeholder="e.g., Oral, IV, Topical"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pregnancy Category</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newMedication.pregnancy_category}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, pregnancy_category: e.target.value }))}
                                    >
                                        <option value="">Select Category</option>
                                        <option value="A">A - Safe</option>
                                        <option value="B">B - Probably Safe</option>
                                        <option value="C">C - Caution</option>
                                        <option value="D">D - Risk</option>
                                        <option value="X">X - Contraindicated</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Indications</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="2"
                                        value={newMedication.indications}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, indications: e.target.value }))}
                                        placeholder="Medical conditions treated..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Side Effects</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="2"
                                        value={newMedication.side_effects}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, side_effects: e.target.value }))}
                                        placeholder="Common and serious side effects..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Drug Interactions</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="2"
                                        value={newMedication.interactions}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, interactions: e.target.value }))}
                                        placeholder="Known drug interactions..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraindications</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="2"
                                        value={newMedication.contraindications}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, contraindications: e.target.value }))}
                                        placeholder="When not to use this medication..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage Instructions</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="2"
                                        value={newMedication.storage}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, storage: e.target.value }))}
                                        placeholder="How to store this medication..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newMedication.schedule}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, schedule: e.target.value }))}
                                    >
                                        <option value="">Select Schedule</option>
                                        <option value="Prescription">Prescription Required</option>
                                        <option value="OTC">Over-the-Counter</option>
                                        <option value="Controlled">Controlled Substance</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="3"
                                        value={newMedication.notes}
                                        onChange={(e) => setNewMedication(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Any additional information..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddMedication(false)}
                                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddMedication}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                                >
                                    <FaSave /> Add Medication
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Medication Modal */}
            {editingMedication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">Edit Medication: {editingMedication.name}</h3>
                                <button
                                    onClick={() => setEditingMedication(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name *</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editingMedication.name}
                                        onChange={(e) => setEditingMedication(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name *</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editingMedication.generic_name}
                                        onChange={(e) => setEditingMedication(prev => ({ ...prev, generic_name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Names</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editingMedication.brand_names}
                                        onChange={(e) => setEditingMedication(prev => ({ ...prev, brand_names: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Drug Class</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editingMedication.class}
                                        onChange={(e) => setEditingMedication(prev => ({ ...prev, class: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Forms</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editingMedication.dosage_forms}
                                        onChange={(e) => setEditingMedication(prev => ({ ...prev, dosage_forms: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editingMedication.strength}
                                        onChange={(e) => setEditingMedication(prev => ({ ...prev, strength: e.target.value }))}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Indications</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="2"
                                        value={editingMedication.indications}
                                        onChange={(e) => setEditingMedication(prev => ({ ...prev, indications: e.target.value }))}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Side Effects</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="2"
                                        value={editingMedication.side_effects}
                                        onChange={(e) => setEditingMedication(prev => ({ ...prev, side_effects: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setEditingMedication(null)}
                                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateMedication}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                                >
                                    <FaSave /> Update Medication
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Patient Modal */}
            {showPatientForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">Add New Patient</h3>
                                <button
                                    onClick={() => setShowPatientForm(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newPatient.full_name}
                                        onChange={(e) => setNewPatient(prev => ({ ...prev, full_name: e.target.value }))}
                                        placeholder="Enter patient's full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newPatient.age}
                                        onChange={(e) => setNewPatient(prev => ({ ...prev, age: e.target.value }))}
                                        placeholder="Patient's age"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newPatient.gender}
                                        onChange={(e) => setNewPatient(prev => ({ ...prev, gender: e.target.value }))}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={newPatient.contact_number}
                                        onChange={(e) => setNewPatient(prev => ({ ...prev, contact_number: e.target.value }))}
                                        placeholder="Phone number"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="2"
                                        value={newPatient.address}
                                        onChange={(e) => setNewPatient(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="Patient's address"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="3"
                                        value={newPatient.diagnosis}
                                        onChange={(e) => setNewPatient(prev => ({ ...prev, diagnosis: e.target.value }))}
                                        placeholder="Medical diagnosis"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="rounded text-blue-500 focus:ring-blue-500"
                                            checked={newPatient.is_active}
                                            onChange={(e) => setNewPatient(prev => ({ ...prev, is_active: e.target.checked }))}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Active Patient</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowPatientForm(false)}
                                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddPatient}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                                >
                                    <FaSave /> Add Patient
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Patient Modal */}
            {editingPatient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">Edit Patient: {editingPatient.full_name}</h3>
                                <button
                                    onClick={() => setEditingPatient(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editingPatient.full_name}
                                        onChange={(e) => setEditingPatient(prev => ({ ...prev, full_name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editingPatient.age}
                                        onChange={(e) => setEditingPatient(prev => ({ ...prev, age: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editingPatient.gender}
                                        onChange={(e) => setEditingPatient(prev => ({ ...prev, gender: e.target.value }))}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={editingPatient.contact_number}
                                        onChange={(e) => setEditingPatient(prev => ({ ...prev, contact_number: e.target.value }))}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="2"
                                        value={editingPatient.address}
                                        onChange={(e) => setEditingPatient(prev => ({ ...prev, address: e.target.value }))}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="3"
                                        value={editingPatient.diagnosis}
                                        onChange={(e) => setEditingPatient(prev => ({ ...prev, diagnosis: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="rounded text-blue-500 focus:ring-blue-500"
                                            checked={editingPatient.is_active}
                                            onChange={(e) => setEditingPatient(prev => ({ ...prev, is_active: e.target.checked }))}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Active Patient</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setEditingPatient(null)}
                                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePatient}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                                >
                                    <FaSave /> Update Patient
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {showUserDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">User Details</h3>
                                <button
                                    onClick={() => setShowUserDetails(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <FaUserCircle className="text-blue-600 text-xl" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-800">{showUserDetails.full_name}</h4>
                                        <p className="text-sm text-gray-600">{showUserDetails.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Role</p>
                                        <p className="font-medium">{getRoleBadge(showUserDetails.role)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <p>{getStatusBadge(showUserDetails.approved, showUserDetails.role)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Account Type</p>
                                        <p className="font-medium">{showUserDetails.account_type === 'company' ? 'Company' : 'Individual'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Institution</p>
                                        <p className="font-medium">{showUserDetails.institution || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Registered</p>
                                    <p className="font-medium">{formatDate(showUserDetails.created_at)}</p>
                                </div>
                            </div>
                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={() => setShowUserDetails(null)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Medication Details Modal */}
            {selectedMedication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">{selectedMedication.name}</h3>
                                <button
                                    onClick={() => setSelectedMedication(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Generic Name:</span>
                                                <span className="font-medium">{selectedMedication.generic_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Brand Names:</span>
                                                <span className="font-medium text-right">{selectedMedication.brand_names || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Drug Class:</span>
                                                <span className={`px-2 py-1 text-xs rounded ${getMedicationClassColor(selectedMedication.class)}`}>
                                                    {selectedMedication.class}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Schedule:</span>
                                                <span className="font-medium">{selectedMedication.schedule || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Dosage & Administration</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Dosage Forms:</span>
                                                <span className="font-medium">{selectedMedication.dosage_forms || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Strength:</span>
                                                <span className="font-medium">{selectedMedication.strength || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Route:</span>
                                                <span className="font-medium">{selectedMedication.route || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Safety Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Pregnancy Category:</span>
                                                <span className={`px-2 py-1 text-xs rounded ${getPregnancyCategoryColor(selectedMedication.pregnancy_category)}`}>
                                                    Category {selectedMedication.pregnancy_category || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Indications</h4>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                            {selectedMedication.indications || 'No indications specified'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Contraindications</h4>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                            {selectedMedication.contraindications || 'No contraindications specified'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Side Effects</h4>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                            {selectedMedication.side_effects || 'No side effects specified'}
                                        </p>
                                    </div>
                                    {selectedMedication.interactions && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Drug Interactions</h4>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                                {selectedMedication.interactions}
                                            </p>
                                        </div>
                                    )}
                                    {selectedMedication.storage && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Storage Instructions</h4>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                                {selectedMedication.storage}
                                            </p>
                                        </div>
                                    )}
                                    {selectedMedication.notes && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Notes</h4>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                                {selectedMedication.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setSelectedMedication(null)}
                                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-white border-t mt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center text-gray-600 text-sm">
                        <p>PharmaCare Admin Dashboard • {new Date().getFullYear()} • Secure Administrative Interface</p>
                        <p className="mt-1 text-xs text-gray-500">Last updated: {stats.last_updated ? formatDate(stats.last_updated) : 'Never'}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AdminDashboard;