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
    FaChevronRight,
    FaIdCard,
    FaClock,
    FaUserMinus,
    FaUserCheck,
    FaSync
} from 'react-icons/fa';

import api from '../utils/api';
import { getEncryptionKey, decryptPatientList, loadPrivateKey } from '../utils/encryptionUtils';

const PatientList = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [userRole, setUserRole] = useState('');
    const [userAccountType, setUserAccountType] = useState('');
    const [userCompanyId, setUserCompanyId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleManualRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
        fetchPatients();
    };

    useEffect(() => {
        // Get user role from token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role || 'user');
                setUserAccountType(payload.account_type || '');
                setUserCompanyId(payload.company_id || null);
            } catch (e) {
                console.error('Failed to parse token', e);
            }
        }

        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            // Extract role directly from token to avoid state race conditions
            let currentRole = '';
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentRole = payload.role || '';
            } catch (e) { }

            const result = await api.get('/patients');

            if (result.success && result.patients) {
                // 🔐 HYBRID DECRYPTION: Support both Master Key (Owners) and Private Key (Support Staff)
                let decryptedPatients = result.patients;
                try {
                    const masterKey = await getEncryptionKey();
                    let privateKey = null;

                    const authorizedSupportRoles = ['healthcare_client', 'admin', 'pharmacist', 'company_admin', 'company_user'];
                    if (authorizedSupportRoles.includes(currentRole)) {
                        // Only attempt to load private key if we have a master key to unwrap it
                        if (masterKey) {
                            privateKey = await loadPrivateKey(masterKey);
                        }
                    }

                    decryptedPatients = await decryptPatientList(result.patients, masterKey, privateKey);
                } catch (encErr) {
                    console.error('❌ [Decryption Error] List decryption failed:', encErr);
                    // Continue with original (encrypted) list if decryption crashes
                }

                setPatients(decryptedPatients);
                setFilteredPatients(decryptedPatients);
            } else {
                setPatients([]);
                setFilteredPatients([]);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
            setPatients([]);
            setFilteredPatients([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);

        const filtered = (patients || []).filter(patient =>
            (patient.full_name && patient.full_name.toLowerCase().includes(term)) ||
            (patient.diagnosis && patient.diagnosis.toLowerCase().includes(term)) ||
            (patient.id && String(patient.id).toLowerCase().includes(term))
        );

        setFilteredPatients(filtered);
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        setSortConfig({ key, direction });

        const sorted = [...filteredPatients].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredPatients(sorted);
        setCurrentPage(1); // Reset to first page on sort
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this MR? This action cannot be undone.')) {
            return;
        }

        try {
            const result = await api.delete(`/patients/${id}`);

            if (result.success) {
                fetchPatients();
            } else {
                alert('Failed to delete MR');
            }
        } catch (error) {
            console.error('Error deleting patient:', error);
            alert('Error deleting MR');
        }
    };

    const getStatusColor = (isActive) => {
        return isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    };

    const getStatusText = (isActive) => {
        return isActive !== false ? 'Active' : 'Inactive';
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
        return sortConfig.direction === 'asc' ? <FaSortUp className="text-blue-500" /> : <FaSortDown className="text-blue-500" />;
    };

    const handleNewPatient = () => {
        // Individual accounts without a company can only create one patient
        const isIndividual = userAccountType === 'individual' && !userCompanyId;
        if (isIndividual && userRole !== 'admin' && patients.length >= 5) {
            alert('Individual subscription plan is limited to 5 MR records. Please upgrade to a Company plan to manage more MRs.');
            navigate('/subscription');
            return;
        }

        navigate('/patients/new');
    };

    const getCurrentUserId = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId;
        } catch (e) {
            console.error('Failed to get user ID:', e);
            return null;
        }
    };

    const handleEditClick = (patient) => {
        // Store patient data in localStorage instead of sessionStorage
        localStorage.setItem('editPatientData', JSON.stringify(patient));
        localStorage.setItem('editPatientId', patient.id);
        localStorage.setItem('editMode', 'true');

        // Navigate to patient details with edit mode using UUID
        navigate(`/patients/${patient.id}?edit=true`);
    };

    const handleViewClick = (patientId) => {
        // Clear any edit data
        localStorage.removeItem('editPatientData');
        localStorage.removeItem('editPatientId');
        localStorage.removeItem('editMode');

        // Navigate without edit mode using UUID
        navigate(`/patients/${patientId}`);
    };

    // Pagination logic
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

    // Check if user is individual account type
    const isIndividual = userAccountType === 'individual' && !userCompanyId;
    // Determine if the user is an individual (who shouldn't see patient codes)
    const isRestrictedIndividual = userAccountType === 'individual' && !userCompanyId && userRole !== 'admin';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="page-container w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 lg:px-8 space-y-4">
            {/* Standard Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <FaUserInjured className="text-2xl text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">Clinical Pharmacy Tool Dashboard</h1>
                        <p className="text-sm text-gray-500 font-medium">Manage medication safety and effectiveness</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleManualRefresh}
                        className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-100"
                        title="Synchronize Data"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleNewPatient}
                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${isIndividual && userRole !== 'admin' && patients.length >= 5
                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:-translate-y-0.5 active:translate-y-0'
                            }`}
                    >
                        <FaPlus /> New MR Case
                    </button>
                </div>
            </div>

            {/* Search & Filtering for All Users */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Find by name, record ID or diagnosis..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                        />
                    </div>
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                handleSearch({ target: { value: searchTerm } });
                            }}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm font-medium appearance-none"
                        >
                            <option value="all">Record Status: All Items</option>
                            <option value="active">Active Monitoring</option>
                            <option value="inactive">Monitoring Paused</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Standard Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-blue-50 text-blue-900 text-xs font-bold border-b border-gray-200">
                                <th className="px-6 py-4 text-left w-16">#</th>
                                <th className="px-6 py-4 text-left">Review Details</th>
                                <th className="px-6 py-4 text-left">Medical Condition</th>
                                <th className="px-6 py-4 text-left cursor-pointer hover:bg-blue-100" onClick={() => handleSort('created_at')}>
                                    <div className="flex items-center gap-2">Logged On {getSortIcon('created_at')}</div>
                                </th>
                                <th className="px-6 py-4 text-right">Controls</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentPatients.length > 0 ? (
                                currentPatients.map((patient, index) => (
                                    <tr key={patient.id} className="hover:bg-blue-50/20 transition-colors group">
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-sm font-black text-gray-400">
                                                {indexOfFirstItem + index + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                    {userRole === 'healthcare_client'
                                                        ? 'P'
                                                        : (patient.full_name && typeof patient.full_name === 'string' && !patient.full_name.includes(':') && !patient.full_name.startsWith('{') ? patient.full_name.charAt(0) : '?')}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800 text-sm leading-none mb-1">
                                                        {userRole === 'healthcare_client' 
                                                            ? 'Patient Profile' 
                                                            : (patient.full_name && typeof patient.full_name === 'string' && !patient.full_name.includes(':') && !patient.full_name.startsWith('{') 
                                                                ? patient.full_name 
                                                                : 'Anonymous User')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-medium text-gray-700 italic max-w-xs truncate">
                                                "{userRole === 'healthcare_client' ? 'Clinical Data' : (patient.diagnosis && typeof patient.diagnosis === 'string' && !patient.diagnosis.includes(':') && !patient.diagnosis.startsWith('{') ? patient.diagnosis : 'Diagnosis Pending')}"
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-xs text-gray-500 font-bold">
                                            {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleViewClick(patient.id)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="View Case"><FaEye /></button>
                                                <button onClick={() => handleEditClick(patient)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-all" title="Edit Case"><FaEdit /></button>
                                                <button onClick={() => handleDelete(patient.id)} disabled={userRole === 'healthcare_client'} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all disabled:opacity-20" title="Remove Case"><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-6 max-w-lg mx-auto">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                                                <FaUserInjured className="text-4xl text-gray-200" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold text-gray-700">
                                                    {searchTerm ? `No matches for "${searchTerm}"` : 'No Clinical Cases Found'}
                                                </h3>
                                                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                                    Database returned zero records for your current profile. If this is unexpected, ensure your company affiliation is active.
                                                </p>
                                            </div>

                                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 text-[11px] font-mono text-left w-full shadow-sm">
                                                <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
                                                    <span className="font-bold text-gray-800 uppercase tracking-widest">🔍 Clinical Engine Synchronization Audit</span>
                                                    <div className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                                                </div>
                                                <div className="space-y-1.5 text-gray-600">
                                                    <p>USER_IDENTITY: <span className="text-blue-600 font-bold">{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Guest'}</span></p>
                                                    <p>ACCESS_ROLE: <span className="text-blue-600 font-bold">{userRole || 'pharmacist'}</span></p>
                                                    <p>KEY_STATUS: <span className="text-green-600 font-bold">{sessionStorage.getItem('enc_key_raw') ? "√ OK (AES-256 ACTIVE)" : "× MISSING (RE-AUTH REQ)"}</span></p>
                                                    <p>ACTIVE_ID_MAP: <span className="text-amber-600 font-bold">{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 'N/A'} {userCompanyId ? `| ORG(${userCompanyId})` : ""}</span></p>
                                                    <p>DATABASE_HITS: <span className="text-red-600 font-bold">{patients.length} records found in query</span></p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 pt-2">
                                                <button onClick={handleNewPatient} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-black shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1">Start New Case</button>
                                                <button onClick={handleManualRefresh} className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-3.5 rounded-xl font-bold border border-gray-200 transition-all">Retry Link</button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Clean Pagination */}
            {filteredPatients.length > itemsPerPage && (
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-xl border border-gray-200 gap-4 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Case Inventory: Record {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 border border-transparent hover:border-blue-100 transition-all font-bold tracking-tighter">PREV</button>
                        <div className="flex items-center gap-1.5">
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg text-[10px] font-black tracking-widest transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{i + 1}</button>
                            ))}
                        </div>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 border border-transparent hover:border-blue-100 transition-all font-bold tracking-tighter">NEXT</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientList;
