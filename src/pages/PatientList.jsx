import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaSearch, 
    FaPlus, 
    FaFilter, 
    FaUserInjured, 
    FaCalendarAlt,
    FaEdit,
    FaEye,
    FaTrash,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaUserMd,
    FaIdCard,
    FaPhone,
    FaBirthdayCake,
    FaVenusMars,
    FaMapMarkerAlt,
    FaNotesMedical,
    FaExclamationTriangle
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API Configuration - Use your Vercel backend URL
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://addis-backend-ten.vercel.app';

const PatientList = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [userRole, setUserRole] = useState('');
    const [userAccountType, setUserAccountType] = useState('');
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        pediatric: 0,
        adult: 0,
        male: 0,
        female: 0
    });
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        // Get user info from token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role || 'user');
                setUserAccountType(payload.account_type || 'individual');
            } catch (e) {
                console.error('Error parsing token:', e);
            }
        } else {
            navigate('/login');
            return;
        }
        
        fetchPatients();
    }, [navigate]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/login');
                return;
            }
            
            console.log('Fetching patients from:', `${API_BASE_URL}/api/patients`);
            
            const response = await fetch(`${API_BASE_URL}/api/patients`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Patients API response:', result);
                
                if (result.success && Array.isArray(result.patients)) {
                    const patientsData = result.patients;
                    setPatients(patientsData);
                    setFilteredPatients(patientsData);
                    
                    // Calculate statistics
                    calculateStats(patientsData);
                    
                    // Set total pages
                    setTotalPages(Math.ceil(patientsData.length / pageSize));
                } else {
                    setPatients([]);
                    setFilteredPatients([]);
                    toast.warning(result.error || 'No patients found');
                }
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                toast.error('Session expired. Please login again.');
                navigate('/login');
            } else if (response.status === 403) {
                const errorData = await response.json();
                toast.error(errorData.error || 'Access denied');
                setPatients([]);
                setFilteredPatients([]);
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to fetch patients');
                setPatients([]);
                setFilteredPatients([]);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
            toast.error('Network error. Please check your connection.');
            setError('Failed to load patients. Please try again.');
            setPatients([]);
            setFilteredPatients([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (patientsData) => {
        const stats = {
            total: patientsData.length,
            active: patientsData.filter(p => p.is_active !== false).length,
            pediatric: patientsData.filter(p => p.patient_type === 'pediatric').length,
            adult: patientsData.filter(p => p.patient_type === 'adult').length,
            male: patientsData.filter(p => p.gender === 'male').length,
            female: patientsData.filter(p => p.gender === 'female').length,
            withDiagnosis: patientsData.filter(p => p.diagnosis && p.diagnosis.trim() !== '').length,
            withPhone: patientsData.filter(p => p.contact_number && p.contact_number.trim() !== '').length
        };
        setStats(stats);
    };

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        
        let filtered = patients;
        
        if (term) {
            filtered = filtered.filter(patient => 
                (patient.patient_code && patient.patient_code.toLowerCase().includes(term)) ||
                (patient.diagnosis && patient.diagnosis.toLowerCase().includes(term)) ||
                (patient.full_name && patient.full_name.toLowerCase().includes(term)) ||
                (patient.contact_number && patient.contact_number.toLowerCase().includes(term)) ||
                (patient.address && patient.address.toLowerCase().includes(term))
            );
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(patient => 
                statusFilter === 'active' 
                    ? patient.is_active !== false
                    : patient.is_active === false
            );
        }
        
        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(patient => patient.patient_type === typeFilter);
        }
        
        // Apply sorting
        const sorted = sortPatients(filtered, sortConfig.key, sortConfig.direction);
        
        setFilteredPatients(sorted);
        setTotalPages(Math.ceil(sorted.length / pageSize));
        setPage(1);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        
        setSortConfig({ key, direction });
        
        const sorted = sortPatients(filteredPatients, key, direction);
        setFilteredPatients(sorted);
    };

    const sortPatients = (patientsArray, key, direction) => {
        return [...patientsArray].sort((a, b) => {
            let aValue = a[key];
            let bValue = b[key];
            
            // Handle null/undefined values
            if (aValue == null) aValue = '';
            if (bValue == null) bValue = '';
            
            // Handle dates
            if (key.includes('date') || key.includes('created') || key.includes('updated')) {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }
            
            // Handle numbers
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
            
            // Handle strings
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const handleDelete = async (patientId, patientCode) => {
        if (!window.confirm(`Are you sure you want to delete patient ${patientCode}? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    toast.success(`Patient ${patientCode} deleted successfully`);
                    fetchPatients(); // Refresh the list
                } else {
                    toast.error(result.error || 'Failed to delete patient');
                }
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Error deleting patient');
            }
        } catch (error) {
            console.error('Error deleting patient:', error);
            toast.error('Error deleting patient');
        }
    };

    const getStatusColor = (isActive) => {
        return isActive !== false 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-gray-100 text-gray-800 border border-gray-200';
    };

    const getStatusText = (isActive) => {
        return isActive !== false ? 'Active' : 'Inactive';
    };

    const getTypeColor = (type) => {
        switch(type) {
            case 'pediatric': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'adult': return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'geriatric': return 'bg-orange-100 text-orange-800 border border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const getGenderColor = (gender) => {
        switch(gender) {
            case 'male': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'female': return 'bg-pink-100 text-pink-800 border border-pink-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className="text-gray-400 text-sm" />;
        return sortConfig.direction === 'asc' 
            ? <FaSortUp className="text-blue-500" /> 
            : <FaSortDown className="text-blue-500" />;
    };

    const generatePatientCode = () => {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PAT${year}${month}${day}${random}`;
    };

    const handleNewPatient = () => {
        const newPatientCode = generatePatientCode();
        navigate(`/patients/${newPatientCode}`);
    };

    const handleEditClick = (patient) => {
        // Store patient data temporarily
        sessionStorage.setItem('editPatientData', JSON.stringify(patient));
        navigate(`/patients/${patient.patient_code}?edit=true`);
    };

    const handleViewClick = (patientCode) => {
        // Clear any edit data
        sessionStorage.removeItem('editPatientData');
        navigate(`/patients/${patientCode}`);
    };

    const handleQuickView = (patient) => {
        // Show quick view modal with patient details
        const details = `
Patient Code: ${patient.patient_code}
Name: ${patient.full_name || 'N/A'}
Age: ${patient.age || 'N/A'} years
Gender: ${patient.gender || 'N/A'}
Diagnosis: ${patient.diagnosis || 'N/A'}
Phone: ${patient.contact_number || 'N/A'}
Address: ${patient.address || 'N/A'}
Created: ${patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
Status: ${getStatusText(patient.is_active)}
        `;
        alert(details);
    };

    const getCurrentUserId = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId;
        } catch (e) {
            return null;
        }
    };

    const getPagedPatients = () => {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredPatients.slice(startIndex, endIndex);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading patients...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ToastContainer position="top-right" autoClose={3000} />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Patient Management</h1>
                    <p className="text-gray-600">Manage your patients and medical records</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {userRole === 'admin' ? '👑 Admin' : userRole === 'company_admin' ? '🏢 Company Admin' : '👤 User'}
                        </span>
                        <span className="text-sm px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                            {userAccountType === 'company_user' ? 'Company User' : 'Individual Account'}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        {viewMode === 'table' ? '📱 Card View' : '📊 Table View'}
                    </button>
                    <button
                        onClick={handleNewPatient}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-md"
                    >
                        <FaPlus /> New Patient
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Search by code, name, diagnosis, phone..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setTimeout(() => handleSearch({ target: { value: searchTerm } }), 0);
                        }}
                        className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                    
                    <select
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            setTimeout(() => handleSearch({ target: { value: searchTerm } }), 0);
                        }}
                        className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Types</option>
                        <option value="adult">Adult</option>
                        <option value="pediatric">Pediatric</option>
                        <option value="geriatric">Geriatric</option>
                    </select>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={fetchPatients}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors flex-1"
                        >
                            <FaFilter /> Refresh
                        </button>
                    </div>
                </div>
                
                {/* Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2">
                            <FaUserInjured className="text-blue-600" />
                            <p className="text-blue-600 font-medium">Total Patients</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-800 mt-2">{stats.total}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-green-600" />
                            <p className="text-green-600 font-medium">Active</p>
                        </div>
                        <p className="text-2xl font-bold text-green-800 mt-2">{stats.active}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-2">
                            <FaBirthdayCake className="text-purple-600" />
                            <p className="text-purple-600 font-medium">Pediatric</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-800 mt-2">{stats.pediatric}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <div className="flex items-center gap-2">
                            <FaUserMd className="text-orange-600" />
                            <p className="text-orange-600 font-medium">Adult</p>
                        </div>
                        <p className="text-2xl font-bold text-orange-800 mt-2">{stats.adult}</p>
                    </div>
                    <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                        <div className="flex items-center gap-2">
                            <FaVenusMars className="text-pink-600" />
                            <p className="text-pink-600 font-medium">Female</p>
                        </div>
                        <p className="text-2xl font-bold text-pink-800 mt-2">{stats.female}</p>
                    </div>
                    <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
                        <div className="flex items-center gap-2">
                            <FaNotesMedical className="text-cyan-600" />
                            <p className="text-cyan-600 font-medium">With Diagnosis</p>
                        </div>
                        <p className="text-2xl font-bold text-cyan-800 mt-2">{stats.withDiagnosis}</p>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800">
                        <FaExclamationTriangle />
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* Patients Display */}
            {viewMode === 'table' ? (
                /* Table View */
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-gray-700">
                                    <th 
                                        className="border p-3 text-left cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('patient_code')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FaIdCard className="text-gray-500" />
                                            Patient Code
                                            {getSortIcon('patient_code')}
                                        </div>
                                    </th>
                                    <th className="border p-3 text-left">Patient Details</th>
                                    <th className="border p-3 text-left">Contact</th>
                                    <th 
                                        className="border p-3 text-left cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FaCalendarAlt className="text-gray-500" />
                                            Created
                                            {getSortIcon('created_at')}
                                        </div>
                                    </th>
                                    <th className="border p-3 text-left">Status/Type</th>
                                    <th className="border p-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getPagedPatients().length > 0 ? (
                                    getPagedPatients().map((patient) => {
                                        const currentUserId = getCurrentUserId();
                                        const canDelete = userRole === 'admin' || (patient.user_id && patient.user_id === currentUserId);
                                        
                                        return (
                                            <tr key={patient.id} className="border-b hover:bg-gray-50 transition-colors">
                                                <td className="border p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <FaUserInjured className="text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800">{patient.patient_code}</p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                ID: {patient.id?.substring(0, 8)}...
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="border p-4">
                                                    <div>
                                                        <p className="font-medium text-gray-800">
                                                            {patient.full_name || 'Unnamed Patient'}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {patient.age && (
                                                                <span className="text-sm text-gray-600">
                                                                    {patient.age} years
                                                                </span>
                                                            )}
                                                            {patient.gender && (
                                                                <span className={`text-xs px-2 py-1 rounded ${getGenderColor(patient.gender)}`}>
                                                                    {patient.gender}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-2 truncate max-w-xs" title={patient.diagnosis}>
                                                            {patient.diagnosis || 'No diagnosis recorded'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="border p-4">
                                                    <div className="space-y-2">
                                                        {patient.contact_number && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <FaPhone className="text-gray-400" />
                                                                <span>{patient.contact_number}</span>
                                                            </div>
                                                        )}
                                                        {patient.address && (
                                                            <div className="flex items-start gap-2 text-sm">
                                                                <FaMapMarkerAlt className="text-gray-400 mt-1" />
                                                                <span className="text-gray-600 truncate max-w-xs">
                                                                    {patient.address}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="border p-4">
                                                    <div className="text-sm text-gray-600">
                                                        <p>{formatDate(patient.created_at)}</p>
                                                        {patient.updated_at && patient.updated_at !== patient.created_at && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Updated: {formatDate(patient.updated_at)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="border p-4">
                                                    <div className="space-y-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.is_active)}`}>
                                                            {getStatusText(patient.is_active)}
                                                        </span>
                                                        {patient.patient_type && (
                                                            <span className={`block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getTypeColor(patient.patient_type)}`}>
                                                                {patient.patient_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="border p-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleViewClick(patient.patient_code)}
                                                            className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View Full Details"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditClick(patient)}
                                                            className="text-yellow-500 hover:text-yellow-700 p-2 hover:bg-yellow-50 rounded-lg transition-colors"
                                                            title="Edit Patient"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleQuickView(patient)}
                                                            className="text-green-500 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Quick View"
                                                        >
                                                            <FaSearch />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(patient.id, patient.patient_code)}
                                                            className={`p-2 rounded-lg transition-colors ${canDelete 
                                                                ? 'text-red-500 hover:text-red-700 hover:bg-red-50' 
                                                                : 'text-gray-300 cursor-not-allowed'}`}
                                                            title={canDelete ? "Delete Patient" : "Cannot delete this patient"}
                                                            disabled={!canDelete}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="border p-8 text-center">
                                            <div className="py-12">
                                                <FaUserInjured className="text-6xl text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-500 text-lg mb-2">
                                                    {searchTerm ? 'No patients found matching your search.' : 'No patients found.'}
                                                </p>
                                                <button
                                                    onClick={handleNewPatient}
                                                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-lg"
                                                >
                                                    + Create Your First Patient
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredPatients.length > 0 && (
                        <div className="p-4 border-t flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50">
                            <div className="text-sm text-gray-600">
                                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredPatients.length)} of {filteredPatients.length} patients
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className={`px-4 py-2 border rounded text-sm transition-colors ${page === 1 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'hover:bg-gray-100 text-gray-700'}`}
                                >
                                    ← Previous
                                </button>
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`px-3 py-2 rounded text-sm ${page === pageNum 
                                                    ? 'bg-blue-500 text-white' 
                                                    : 'border hover:bg-gray-100 text-gray-700'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className={`px-4 py-2 border rounded text-sm transition-colors ${page === totalPages 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'hover:bg-gray-100 text-gray-700'}`}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Card View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getPagedPatients().length > 0 ? (
                        getPagedPatients().map((patient) => {
                            const currentUserId = getCurrentUserId();
                            const canDelete = userRole === 'admin' || (patient.user_id && patient.user_id === currentUserId);
                            
                            return (
                                <div key={patient.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <FaUserInjured className="text-blue-600 text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">{patient.patient_code}</h3>
                                                <p className="text-sm text-gray-500">{patient.full_name || 'Unnamed Patient'}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.is_active)}`}>
                                            {getStatusText(patient.is_active)}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-500">Age/Gender</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {patient.age && (
                                                        <span className="text-gray-800">{patient.age} years</span>
                                                    )}
                                                    {patient.gender && (
                                                        <span className={`px-2 py-1 rounded text-xs ${getGenderColor(patient.gender)}`}>
                                                            {patient.gender}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-500">Type</p>
                                                {patient.patient_type && (
                                                    <span className={`px-2 py-1 rounded text-xs mt-1 inline-block ${getTypeColor(patient.patient_type)}`}>
                                                        {patient.patient_type}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {patient.diagnosis && (
                                            <div>
                                                <p className="text-sm text-gray-500">Diagnosis</p>
                                                <p className="text-gray-800 text-sm mt-1 line-clamp-2">{patient.diagnosis}</p>
                                            </div>
                                        )}
                                        
                                        {patient.contact_number && (
                                            <div className="flex items-center gap-2">
                                                <FaPhone className="text-gray-400" />
                                                <span className="text-gray-800">{patient.contact_number}</span>
                                            </div>
                                        )}
                                        
                                        <div className="text-xs text-gray-500">
                                            Created: {formatDate(patient.created_at)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 pt-4 border-t">
                                        <button
                                            onClick={() => handleViewClick(patient.patient_code)}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm transition-colors"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleEditClick(patient)}
                                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg text-sm transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(patient.id, patient.patient_code)}
                                            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${canDelete 
                                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                            disabled={!canDelete}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full">
                            <div className="bg-white rounded-xl shadow p-12 text-center">
                                <FaUserInjured className="text-6xl text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg mb-2">
                                    {searchTerm ? 'No patients found matching your search.' : 'No patients found.'}
                                </p>
                                <button
                                    onClick={handleNewPatient}
                                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium"
                                >
                                    + Create Your First Patient
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Card View Pagination */}
            {viewMode === 'card' && filteredPatients.length > 0 && (
                <div className="flex justify-center items-center gap-4">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className={`px-4 py-2 border rounded ${page === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                        ← Previous
                    </button>
                    <span className="text-gray-600">
                        Page {page} of {totalPages}
                    </span>
                    <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className={`px-4 py-2 border rounded ${page === totalPages 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};

export default PatientList;