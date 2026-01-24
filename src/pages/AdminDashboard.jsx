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
    FaPhone
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL;

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
    const [apiErrors, setApiErrors] = useState({});
    const [forceRefresh, setForceRefresh] = useState(0);
    const [processingApproval, setProcessingApproval] = useState({});
    const [realPendingUsers, setRealPendingUsers] = useState([]);
    const [approvalLogs, setApprovalLogs] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [showUserDetails, setShowUserDetails] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [approvalIssueDetected, setApprovalIssueDetected] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

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

    // Patient Management States
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
    }, [selectedTab, currentUser]);

    // Load patients when patients tab is selected
    useEffect(() => {
        if (selectedTab === 'patients' && currentUser) {
            loadPatients();
        }
    }, [selectedTab, currentUser]);

    // Check if user is admin
    const checkAdminAccess = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (!token || !userData) {
                navigate('/login');
                return;
            }

            const user = JSON.parse(userData);

            if (user.role !== 'admin') {
                // Redirect non-admin users to their dashboard
                if (user.role === 'company_admin') {
                    navigate('/company/dashboard');
                } else {
                    navigate('/dashboard');
                }
                return;
            }

            setCurrentUser(user);

            // Verify with backend
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setCurrentUser(data.user);
                }
            } else if (response.status === 403 || response.status === 401) {
                setError('Authentication failed. Please login again.');
                setTimeout(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                }, 3000);
            } else {
                console.warn('Backend connection issue. Some features may be limited.');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setError('Network error. Please check backend connection.');
        }
    };

    // Load medications
    const loadMedications = async () => {
        try {
            setLoadingMedications(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`${API_URL}/api/admin/medications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMedications(data.medications || data || []);
                calculateMedicationStats(data.medications || data || []);
            } else if (response.status === 403) {
                setError('Access denied. Admin access required.');
            } else {
                console.warn('Could not load medications, using sample data');
                setMedications(sampleMedications);
                calculateMedicationStats(sampleMedications);
            }
        } catch (error) {
            console.error('Error loading medications:', error);
            setMedications(sampleMedications);
            calculateMedicationStats(sampleMedications);
        } finally {
            setLoadingMedications(false);
        }
    };

    const loadPatients = async () => {
        try {
            setLoadingPatients(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`${API_URL}/api/admin/all-patients`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPatients(data.patients || []);
                calculatePatientStats(data.patients || []);
            } else if (response.status === 403) {
                setError('Access denied. You must be an admin to view this page.');
            } else {
                setPatients([]);
            }
        } catch (error) {
            console.error('Error loading patients:', error);
            setPatients([]);
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
            patient.patient_code.toLowerCase().includes(searchTermLower) ||
            patient.diagnosis.toLowerCase().includes(searchTermLower) ||
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
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`${API_URL}/api/admin/medications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMedication)
            });

            if (response.ok) {
                const data = await response.json();
                setMedications([data.medication, ...medications]);
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
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add medication');
            }
        } catch (error) {
            console.error('Error adding medication:', error);
            setError(`Failed to add medication: ${error.message}`);
        }
    };

    // Add new patient (admin can add for any user)
    const handleAddPatient = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }

            const patientData = {
                ...newPatient,
                patient_code: `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                user_id: currentUser?.id || 'admin'
            };

            const response = await fetch(`${API_URL}/api/patients`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientData)
            });

            if (response.ok) {
                const data = await response.json();
                setPatients([data.patient, ...patients]);
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
                    description: `Added patient: ${data.patient.full_name}`,
                    created_at: new Date().toISOString()
                };
                setRecentActivities(prev => [newActivity, ...prev]);
                
                setSuccessMessage('Patient added successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add patient');
            }
        } catch (error) {
            console.error('Error adding patient:', error);
            setError(`Failed to add patient: ${error.message}`);
        }
    };

    // Update medication
    const handleUpdateMedication = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`${API_URL}/api/admin/medications/${editingMedication.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editingMedication)
            });

            if (response.ok) {
                const data = await response.json();
                setMedications(medications.map(med => 
                    med.id === editingMedication.id ? data.medication : med
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
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update medication');
            }
        } catch (error) {
            console.error('Error updating medication:', error);
            setError(`Failed to update medication: ${error.message}`);
        }
    };

    // Update patient
    const handleUpdatePatient = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`${API_URL}/api/patients/${editingPatient.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editingPatient)
            });

            if (response.ok) {
                const data = await response.json();
                setPatients(patients.map(patient => 
                    patient.id === editingPatient.id ? data.patient : patient
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
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update patient');
            }
        } catch (error) {
            console.error('Error updating patient:', error);
            setError(`Failed to update patient: ${error.message}`);
        }
    };

    // Delete medication
    const handleDeleteMedication = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`${API_URL}/api/admin/medications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
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
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete medication');
            }
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
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`${API_URL}/api/patients/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setPatients(patients.filter(patient => patient.id !== id));
                
                const newActivity = {
                    id: Date.now(),
                    user_name: currentUser?.full_name || 'Admin',
                    action_type: 'delete',
                    description: `Deleted patient: ${name}`,
                    created_at: new Date().toISOString()
                };
                setRecentActivities(prev => [newActivity, ...prev]);
                
                setSuccessMessage('Patient deleted successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete patient');
            }
        } catch (error) {
            console.error('Error deleting patient:', error);
            setError(`Failed to delete patient: ${error.message}`);
        }
    };

    // Check drug interactions
    const checkInteractions = async () => {
        if (!interactionCheck.medication1 || !interactionCheck.medication2) {
            setError('Please select both medications');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }

            const response = await fetch(`${API_URL}/api/admin/check-interaction`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    med1: interactionCheck.medication1,
                    med2: interactionCheck.medication2
                })
            });

            if (response.ok) {
                const data = await response.json();
                setInteractionCheck(prev => ({ ...prev, result: data }));
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to check interactions');
            }
        } catch (error) {
            console.error('Error checking interactions:', error);
            setError(`Failed to check interactions: ${error.message}`);
        }
    };

    // Load dashboard data
    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Not authenticated. Please login again.');
                navigate('/login');
                return;
            }

            console.log('🔄 Loading dashboard data...');

            // First, test the connection using /api/health endpoint
            try {
                const testResponse = await fetch(`${API_URL}/api/health`);
                if (!testResponse.ok) {
                    throw new Error(`Backend connection failed: ${testResponse.status}`);
                }
                console.log('✅ Backend connection successful');
            } catch (testError) {
                console.error('❌ Backend connection error:', testError);
                setError(`Cannot connect to backend server. Make sure it's running at ${API_URL}`);
                return;
            }

            // Load pending approvals
            try {
                const pendingResponse = await fetch(`${API_URL}/api/admin/pending-approvals`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (pendingResponse.ok) {
                    const pendingData = await pendingResponse.json();
                    const usersList = pendingData.users || [];
                    
                    console.log(`📋 Found ${usersList.length} pending approvals`);
                    
                    setPendingUsers(usersList);
                    setRealPendingUsers(usersList);
                    
                    setStats(prev => ({
                        ...prev,
                        pending_approvals: usersList.length
                    }));
                } else {
                    console.warn('Pending approvals fetch failed:', pendingResponse.status);
                }
            } catch (pendingError) {
                console.error('Error loading pending approvals:', pendingError);
            }

            // Load stats
            try {
                const statsResponse = await fetch(`${API_URL}/api/admin/stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    if (statsData.stats) {
                        console.log('📊 Stats loaded:', statsData.stats);
                        setStats(prev => ({
                            ...prev,
                            ...statsData.stats
                        }));
                    }
                }
            } catch (statsError) {
                console.error('Error loading stats:', statsError);
            }

            // Load all users
            try {
                const usersResponse = await fetch(`${API_URL}/api/admin/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    if (usersData.users) {
                        console.log(`👥 Loaded ${usersData.users.length} users`);
                        setUserManagement(usersData.users);
                    }
                }
            } catch (usersError) {
                console.error('Error loading users:', usersError);
            }

            // Add a sample activity
            const sampleActivity = {
                id: Date.now(),
                user_name: currentUser?.full_name || 'Admin',
                action_type: 'view_dashboard',
                description: 'Viewed admin dashboard',
                created_at: new Date().toISOString()
            };
            setRecentActivities(prev => [sampleActivity, ...prev.slice(0, 9)]);

        } catch (error) {
            console.error('Dashboard load error:', error);
            setError(`Failed to load dashboard data: ${error.message}`);
            
            // Show helpful error message
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="position: fixed; top: 20px; right: 20px; background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; z-index: 1000; border: 1px solid #f5c6cb;">
                <strong>Connection Error</strong><br>
                ${error.message}<br>
                <small>API URL: ${API_URL}</small>
                </div>
            `;
            document.body.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    
    // Handle user approval
    const handleApproveUser = async (userId, userEmail) => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }

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

            const approveResponse = await fetch(`${API_URL}/api/admin/users/${userToApprove.id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            let responseData;
            try {
                responseData = await approveResponse.json();
            } catch (parseError) {
                responseData = { error: 'Invalid response from server' };
            }
            
            if (approveResponse.ok && responseData.success) {
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
                
                setApprovalIssueDetected(false);
                
                setTimeout(() => {
                    setForceRefresh(prev => prev + 1);
                }, 1000);
                
            } else {
                setError(`Approval failed: ${responseData.error || 'Unknown error'}`);
                setApprovalIssueDetected(true);
            }
        } catch (error) {
            setError(`Network error: ${error.message}`);
            setApprovalIssueDetected(true);
        } finally {
            setProcessingApproval(prev => ({ ...prev, [userId]: false }));
        }
    };

    // Handle user rejection
    const handleRejectUser = async (userId, userEmail) => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required');
                return;
            }

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

            const response = await fetch(`${API_URL}/api/admin/users/${userToReject.id}/reject`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
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
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                setError(`Error: ${errorData.error || 'Failed to reject user'}`);
            }
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
            audit_logs: auditLogs,
            activities: recentActivities,
            approval_logs: approvalLogs,
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
        switch(actionType) {
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
        switch(role) {
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
        switch(gender) {
            case 'male': return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Male</span>;
            case 'female': return <span className="px-2 py-1 text-xs bg-pink-100 text-pink-800 rounded">Female</span>;
          
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
        switch(category) {
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
                        {['overview', 'approvals', 'users', 'medications', 'patients'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setSelectedTab(tab);
                                    if (tab === 'medications') loadMedications();
                                    if (tab === 'patients') loadPatients();
                                }}
                                className={`py-2 px-4 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
                                    selectedTab === tab
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
                                                                <span className={`text-xs px-2 py-1 rounded ${
                                                                    user.account_type === 'company' 
                                                                        ? 'bg-purple-100 text-purple-800' 
                                                                        : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                    {user.account_type === 'company' ? 'Company Admin' : 'Individual'}
                                                                </span>
                                                                <span className={`text-xs px-2 py-1 rounded ${
                                                                    user.role === 'company_admin' 
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
                                                                    className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                                                                        processingApproval[user.id] ? 'opacity-50 cursor-not-allowed' : ''
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
                                                <th className="border p-3 text-left">Type</th>
                                                <th className="border p-3 text-left">Status</th>
                                                <th className="border p-3 text-left">Institution</th>
                                                <th className="border p-3 text-left">Registered</th>
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
                                                        <span className={`text-xs px-2 py-1 rounded ${
                                                            user.account_type === 'company' 
                                                                ? 'bg-purple-100 text-purple-800' 
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {user.account_type === 'company' ? 'Company' : 'Individual'}
                                                        </span>
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
                                                        <div className="flex items-center gap-2">
                                                            <FaCalendarAlt className="text-gray-400" />
                                                            <span className="text-sm">
                                                                {formatDate(user.created_at)}
                                                            </span>
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
                                            {medicationFilter ? 'No medications match your search. Try a different search term.' : 'No medications in the database. Click "Add Medication" to get started.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Drug Classes Summary */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Drug Classes Summary</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(medicationStats.by_class).map(([className, count]) => (
                                    <div key={className} className="p-3 border rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">{className}</span>
                                            <span className="text-lg font-bold text-blue-600">{count}</span>
                                        </div>
                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-500 h-2 rounded-full" 
                                                style={{ width: `${(count / medicationStats.total) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
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
                                        <p className="text-xs text-gray-500 mt-1">All system patients</p>
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
                                        <p className="text-sm text-gray-600">Gender Distribution</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-xl font-bold text-blue-600">{patientStats.male}</p>
                                            <span className="text-sm text-gray-500">Male</span>
                                            <span className="text-sm text-gray-300">/</span>
                                            <p className="text-xl font-bold text-pink-600">{patientStats.female}</p>
                                            <span className="text-sm text-gray-500">Female</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-full">
                                        <FaUserCircle className="text-purple-600 text-xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Age Groups</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-xl font-bold text-yellow-600">{patientStats.pediatric}</p>
                                            <span className="text-sm text-gray-500">Pediatric</span>
                                            <span className="text-sm text-gray-300">/</span>
                                            <p className="text-xl font-bold text-blue-600">{patientStats.adult}</p>
                                            <span className="text-sm text-gray-500">Adult</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-yellow-100 rounded-full">
                                        <FaUsers className="text-yellow-600 text-xl" />
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
                                        <div className="flex border rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => setPatientViewMode('table')}
                                                className={`px-3 py-2 ${patientViewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                                            >
                                                <FaTable />
                                            </button>
                                            <button
                                                onClick={() => setPatientViewMode('card')}
                                                className={`px-3 py-2 ${patientViewMode === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                                            >
                                                <FaThLarge />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Patients Table/Cards View */}
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
                                                        <th className="border p-3 text-left">Patient Code</th>
                                                        <th className="border p-3 text-left">Age/Gender</th>
                                                        <th className="border p-3 text-left">Diagnosis</th>
                                                        <th className="border p-3 text-left">Status</th>
                                                        <th className="border p-3 text-left">Created By</th>
                                                        <th className="border p-3 text-left">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredPatients.map((patient) => (
                                                        <tr key={patient.id} className="border-b hover:bg-gray-50 transition-colors">
                                                            <td className="border p-3">
                                                                <div>
                                                                    <p className="font-medium text-gray-800">{patient.full_name}</p>
                                                                    <p className="text-sm text-gray-600">{patient.contact_number}</p>
                                                                </div>
                                                            </td>
                                                            <td className="border p-3">
                                                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{patient.patient_code}</code>
                                                            </td>
                                                            <td className="border p-3">
                                                                <div className="flex items-center gap-2">
                                                                    {patient.age && <span className="text-sm">{patient.age} years</span>}
                                                                    {getGenderBadge(patient.gender)}
                                                                </div>
                                                            </td>
                                                            <td className="border p-3">
                                                                <p className="text-sm line-clamp-2">{patient.diagnosis || 'No diagnosis'}</p>
                                                            </td>
                                                            <td className="border p-3">
                                                                {getPatientStatusBadge(patient.is_active)}
                                                            </td>
                                                            <td className="border p-3">
                                                                <div className="text-sm">
                                                                    <p className="text-gray-600">{patient.user_email}</p>
                                                                    <p className="text-xs text-gray-500">{formatDate(patient.created_at)}</p>
                                                                </div>
                                                            </td>
                                                            <td className="border p-3">
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => setSelectedPatient(patient)}
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
                                        // Card View
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredPatients.map((patient) => (
                                                <div key={patient.id} className="border rounded-xl p-4 hover:shadow-lg transition-shadow bg-white">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-800">{patient.full_name}</h4>
                                                            <p className="text-sm text-gray-600">{patient.patient_code}</p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {getGenderBadge(patient.gender)}
                                                            {getPatientStatusBadge(patient.is_active)}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <FaCalendarAlt className="text-gray-400" />
                                                            <span className="text-sm">{patient.age ? `${patient.age} years` : 'Age not specified'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <FaPhone className="text-gray-400" />
                                                            <span className="text-sm">{patient.contact_number || 'No contact'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <FaStethoscope className="text-gray-400" />
                                                            <span className="text-sm truncate">{patient.diagnosis || 'No diagnosis'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <FaUserCircle className="text-gray-400" />
                                                            <span className="text-sm truncate">{patient.user_email}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex gap-2 pt-3 border-t">
                                                        <button
                                                            onClick={() => setSelectedPatient(patient)}
                                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1"
                                                        >
                                                            <FaEye /> View
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingPatient(patient)}
                                                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1"
                                                        >
                                                            <FaEdit /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePatient(patient.id, patient.full_name)}
                                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1"
                                                        >
                                                            <FaTrash /> Delete
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
                                            {patientFilter ? 'No patients match your search. Try a different search term.' : 'No patients in the database. Click "Add Patient" to get started.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Medication Modal */}
                {showAddMedication && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b sticky top-0 bg-white">
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
                                            placeholder="e.g., Amoxicillin trihydrate"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Drug Class *</label>
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
                                            placeholder="e.g., Tablet, Capsule, Suspension"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newMedication.strength}
                                            onChange={(e) => setNewMedication(prev => ({ ...prev, strength: e.target.value }))}
                                            placeholder="e.g., 500mg, 250mg/5mL"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Indications *</label>
                                        <textarea
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newMedication.indications}
                                            onChange={(e) => setNewMedication(prev => ({ ...prev, indications: e.target.value }))}
                                            placeholder="What conditions does this medication treat?"
                                            rows="2"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraindications</label>
                                        <textarea
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newMedication.contraindications}
                                            onChange={(e) => setNewMedication(prev => ({ ...prev, contraindications: e.target.value }))}
                                            placeholder="When should this medication NOT be used?"
                                            rows="2"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Side Effects</label>
                                        <textarea
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newMedication.side_effects}
                                            onChange={(e) => setNewMedication(prev => ({ ...prev, side_effects: e.target.value }))}
                                            placeholder="Common and serious side effects"
                                            rows="2"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Interactions</label>
                                        <textarea
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newMedication.interactions}
                                            onChange={(e) => setNewMedication(prev => ({ ...prev, interactions: e.target.value }))}
                                            placeholder="Drug-drug, drug-food interactions"
                                            rows="2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pregnancy Category</label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newMedication.pregnancy_category}
                                            onChange={(e) => setNewMedication(prev => ({ ...prev, pregnancy_category: e.target.value }))}
                                        >
                                            <option value="">Select category</option>
                                            <option value="A">A - Safe</option>
                                            <option value="B">B - Probably safe</option>
                                            <option value="C">C - Use with caution</option>
                                            <option value="D">D - Evidence of risk</option>
                                            <option value="X">X - Contraindicated</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newMedication.schedule}
                                            onChange={(e) => setNewMedication(prev => ({ ...prev, schedule: e.target.value }))}
                                        >
                                            <option value="">Select schedule</option>
                                            <option value="OTC">Over-the-counter</option>
                                            <option value="Prescription">Prescription</option>
                                            <option value="Controlled">Controlled substance</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => setShowAddMedication(false)}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddMedication}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                                        disabled={!newMedication.name || !newMedication.generic_name}
                                    >
                                        <FaSave /> Add Medication
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
                            <div className="p-6 border-b sticky top-0 bg-white">
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
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newPatient.full_name}
                                            onChange={(e) => setNewPatient(prev => ({ ...prev, full_name: e.target.value }))}
                                            placeholder="e.g., John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                        <input
                                            type="number"
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newPatient.age}
                                            onChange={(e) => setNewPatient(prev => ({ ...prev, age: e.target.value }))}
                                            placeholder="e.g., 45"
                                            min="0"
                                            max="120"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newPatient.gender}
                                            onChange={(e) => setNewPatient(prev => ({ ...prev, gender: e.target.value }))}
                                        >
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newPatient.contact_number}
                                            onChange={(e) => setNewPatient(prev => ({ ...prev, contact_number: e.target.value }))}
                                            placeholder="e.g., +251911234567"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <textarea
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newPatient.address}
                                            onChange={(e) => setNewPatient(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="e.g., Addis Ababa, Ethiopia"
                                            rows="2"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis/Condition</label>
                                        <textarea
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newPatient.diagnosis}
                                            onChange={(e) => setNewPatient(prev => ({ ...prev, diagnosis: e.target.value }))}
                                            placeholder="e.g., Hypertension, Diabetes Type 2"
                                            rows="2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <div className="flex gap-4 mt-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    className="mr-2"
                                                    checked={newPatient.is_active}
                                                    onChange={() => setNewPatient(prev => ({ ...prev, is_active: true }))}
                                                />
                                                <span className="text-sm">Active</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    className="mr-2"
                                                    checked={!newPatient.is_active}
                                                    onChange={() => setNewPatient(prev => ({ ...prev, is_active: false }))}
                                                />
                                                <span className="text-sm">Inactive</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => setShowPatientForm(false)}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddPatient}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                                        disabled={!newPatient.full_name}
                                    >
                                        <FaSave /> Add Patient
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Medication Details Modal */}
                {selectedMedication && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b sticky top-0 bg-white">
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
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <FaInfoCircle className="text-blue-500" /> Basic Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-600">Generic Name</p>
                                                <p className="font-medium">{selectedMedication.generic_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Brand Names</p>
                                                <p className="font-medium">{selectedMedication.brand_names}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Drug Class</p>
                                                <span className={`text-xs px-2 py-1 rounded ${getMedicationClassColor(selectedMedication.class)}`}>
                                                    {selectedMedication.class}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Dosage Forms</p>
                                                <p className="font-medium">{selectedMedication.dosage_forms}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Strength</p>
                                                <p className="font-medium">{selectedMedication.strength}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <FaExclamationTriangle className="text-yellow-500" /> Safety Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-600">Pregnancy Category</p>
                                                <span className={`text-xs px-2 py-1 rounded ${getPregnancyCategoryColor(selectedMedication.pregnancy_category)}`}>
                                                    Category {selectedMedication.pregnancy_category}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Schedule</p>
                                                <p className="font-medium">{selectedMedication.schedule}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Storage</p>
                                                <p className="font-medium">{selectedMedication.storage || 'Room temperature'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <h4 className="font-semibold text-gray-700 mb-2">Indications</h4>
                                        <p className="text-gray-700">{selectedMedication.indications}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">Contraindications</h4>
                                        <p className="text-gray-700">{selectedMedication.contraindications || 'No specific contraindications listed.'}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">Side Effects</h4>
                                        <p className="text-gray-700">{selectedMedication.side_effects || 'No specific side effects listed.'}</p>
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <h4 className="font-semibold text-gray-700 mb-2">Interactions</h4>
                                        <p className="text-gray-700">{selectedMedication.interactions || 'No significant drug interactions reported.'}</p>
                                    </div>
                                    
                                    {selectedMedication.notes && (
                                        <div className="md:col-span-2">
                                            <h4 className="font-semibold text-gray-700 mb-2">Additional Notes</h4>
                                            <p className="text-gray-700">{selectedMedication.notes}</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingMedication(selectedMedication);
                                            setSelectedMedication(null);
                                        }}
                                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        <FaEdit /> Edit Medication
                                    </button>
                                    <button
                                        onClick={() => setSelectedMedication(null)}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Patient Details Modal */}
                {selectedPatient && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b sticky top-0 bg-white">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">{selectedPatient.full_name}</h3>
                                    <button
                                        onClick={() => setSelectedPatient(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <FaUserCircle className="text-blue-500" /> Patient Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-600">Patient Code</p>
                                                <p className="font-medium font-mono">{selectedPatient.patient_code}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Age</p>
                                                <p className="font-medium">{selectedPatient.age ? `${selectedPatient.age} years` : 'Not specified'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Gender</p>
                                                <div className="mt-1">{getGenderBadge(selectedPatient.gender)}</div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Status</p>
                                                <div className="mt-1">{getPatientStatusBadge(selectedPatient.is_active)}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <FaPhone className="text-green-500" /> Contact Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-600">Contact Number</p>
                                                <p className="font-medium">{selectedPatient.contact_number || 'Not specified'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Address</p>
                                                <p className="font-medium">{selectedPatient.address || 'Not specified'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <FaStethoscope className="text-red-500" /> Medical Information
                                        </h4>
                                        <div>
                                            <p className="text-sm text-gray-600">Diagnosis/Condition</p>
                                            <p className="font-medium mt-1">{selectedPatient.diagnosis || 'No diagnosis recorded'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <FaUserMd className="text-purple-500" /> Created By
                                        </h4>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-sm text-gray-600">Healthcare Provider</p>
                                                <p className="font-medium">{selectedPatient.user_email}</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-600">Created</p>
                                                    <p className="font-medium text-sm">{formatDate(selectedPatient.created_at)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Last Updated</p>
                                                    <p className="font-medium text-sm">{formatDate(selectedPatient.updated_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingPatient(selectedPatient);
                                            setSelectedPatient(null);
                                        }}
                                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        <FaEdit /> Edit Patient
                                    </button>
                                    <button
                                        onClick={() => setSelectedPatient(null)}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Medication Modal */}
                {editingMedication && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b sticky top-0 bg-white">
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
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Indications *</label>
                                        <textarea
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editingMedication.indications}
                                            onChange={(e) => setEditingMedication(prev => ({ ...prev, indications: e.target.value }))}
                                            rows="3"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Side Effects</label>
                                        <textarea
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editingMedication.side_effects}
                                            onChange={(e) => setEditingMedication(prev => ({ ...prev, side_effects: e.target.value }))}
                                            rows="3"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Interactions</label>
                                        <textarea
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editingMedication.interactions}
                                            onChange={(e) => setEditingMedication(prev => ({ ...prev, interactions: e.target.value }))}
                                            rows="3"
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => setEditingMedication(null)}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateMedication}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        <FaSave /> Update Medication
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
                            <div className="p-6 border-b sticky top-0 bg-white">
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
                                    <div className="md:col-span-2">
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
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
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
                                            value={editingPatient.address}
                                            onChange={(e) => setEditingPatient(prev => ({ ...prev, address: e.target.value }))}
                                            rows="2"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis/Condition</label>
                                        <textarea
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editingPatient.diagnosis}
                                            onChange={(e) => setEditingPatient(prev => ({ ...prev, diagnosis: e.target.value }))}
                                            rows="2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <div className="flex gap-4 mt-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    className="mr-2"
                                                    checked={editingPatient.is_active}
                                                    onChange={() => setEditingPatient(prev => ({ ...prev, is_active: true }))}
                                                />
                                                <span className="text-sm">Active</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    className="mr-2"
                                                    checked={!editingPatient.is_active}
                                                    onChange={() => setEditingPatient(prev => ({ ...prev, is_active: false }))}
                                                />
                                                <span className="text-sm">Inactive</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => setEditingPatient(null)}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdatePatient}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
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
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Full Name</p>
                                        <p className="font-medium">{showUserDetails.full_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium">{showUserDetails.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Role</p>
                                        <div className="mt-1">{getRoleBadge(showUserDetails.role)}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Account Type</p>
                                        <p className="font-medium capitalize">{showUserDetails.account_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <div className="mt-1">{getStatusBadge(showUserDetails.approved, showUserDetails.role)}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Institution</p>
                                        <p className="font-medium">{showUserDetails.institution}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Registered</p>
                                        <p className="font-medium">{formatDate(showUserDetails.created_at)}</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => setShowUserDetails(null)}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        Close
                                    </button>
                                    {!showUserDetails.approved && (
                                        <button
                                            onClick={() => {
                                                handleApproveUser(showUserDetails.id, showUserDetails.email);
                                                setShowUserDetails(null);
                                            }}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                                        >
                                            Approve User
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;