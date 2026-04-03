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
            } catch (e) {}

            const result = await api.get('/patients');

            if (result.success && result.patients) {
                // 🔐 HYBRID DECRYPTION: Support both Master Key (Owners) and Private Key (Support Staff)
                let decryptedPatients = result.patients;
                try {
                    const masterKey = await getEncryptionKey();
                    let privateKey = null;
                    
                    if (currentRole === 'healthcare_client' || currentRole === 'admin') {
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">Clinical Analysis Dashboard</h1>
                    <p className="text-sm text-gray-500">Manage and track your patient medication safety records</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleManualRefresh}
                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Sync List"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleNewPatient}
                        className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm ${
                            isIndividual && userRole !== 'admin' && patients.length >= 5
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        <FaPlus /> New MR
                    </button>
                </div>
            </div>

            {/* Simple Search & Global Sync Refresh */}
            {!isIndividual && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                placeholder="Search by name, code or diagnosis..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                handleSearch({ target: { value: searchTerm } });
                            }}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="all">All MR Status</option>
                            <option value="active">Active Cases Only</option>
                            <option value="inactive">Inactive Cases Only</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Standard Patients Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-700 text-xs font-bold uppercase border-b border-gray-200">
                                <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>
                                    <div className="flex items-center gap-2">MR Code {getSortIcon('id')}</div>
                                </th>
                                <th className="px-4 py-3 text-left">Patient Name</th>
                                <th className="px-4 py-3 text-left">Diagnosis</th>
                                <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                                    <div className="flex items-center gap-2">Created {getSortIcon('created_at')}</div>
                                </th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentPatients.length > 0 ? (
                                currentPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4 font-mono text-xs font-bold text-blue-700">{patient.id}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                                    {patient.full_name ? patient.full_name.charAt(0) : '?'}
                                                </div>
                                                <span className="font-semibold text-gray-800">{patient.full_name || 'Anonymous User'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">{patient.diagnosis || 'No Diagnosis'}</td>
                                        <td className="px-4 py-4 text-xs text-gray-500">
                                            {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => handleViewClick(patient.id)} className="p-2 text-blue-500 hover:bg-blue-50 rounded" title="View Detail"><FaEye /></button>
                                                <button onClick={() => handleEditClick(patient)} className="p-2 text-amber-500 hover:bg-amber-50 rounded" title="Edit MR"><FaEdit /></button>
                                                <button onClick={() => handleDelete(patient.id)} disabled={userRole === 'healthcare_client'} className="p-2 text-red-400 hover:bg-red-50 rounded disabled:opacity-30" title="Delete"><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <FaUserInjured className="text-5xl text-gray-200" />
                                            <h3 className="text-lg font-bold text-gray-700">
                                                {searchTerm ? 'No results for your search' : 'No MRs found.'}
                                            </h3>
                                            <p className="text-gray-400 text-sm max-w-sm mb-4">
                                                Records are currently empty. If you've created patients, try a refresh or synchronization.
                                            </p>
                                            
                                            {/* Discreet Diagnostic Info */}
                                            <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-[10px] font-mono text-left max-w-md w-full">
                                                <p className="font-bold text-red-600 border-b border-red-100 pb-1 mb-2">🔍 Visibility Audit (Clinical Engine):</p>
                                                <div className="space-y-1 text-red-800">
                                                    <p>ROLE: {userRole || 'UNDETECTED'}</p>
                                                    <p>KEY_STATUS: {sessionStorage.getItem('enc_key_raw') ? "√ OK (SESSION ACTIVE)" : "× MISSING (RE-LOGIN REQUIRED)"}</p>
                                                    <p>ID_MAP: {userCompanyId ? `Company(${userCompanyId})` : "Individual-Scoped"}</p>
                                                    <p>DB_HITS: {patients.length} records</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button onClick={handleNewPatient} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2"><FaPlus /> New MR</button>
                                                <button onClick={handleManualRefresh} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg border border-gray-200"><FaSync className={loading ? 'animate-spin' : ''} /> Sync Now</button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Standard Pagination */}
            {filteredPatients.length > itemsPerPage && (
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-200 gap-4">
                    <div className="text-xs font-bold text-gray-400 uppercase">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length} records
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50">Prev</button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded border text-xs font-bold ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>{i + 1}</button>
                        ))}
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientList;
