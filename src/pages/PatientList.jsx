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
        <div className="page-container w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 lg:px-8 space-y-6">
            {/* 🏥 Premium Header: Clinical Analysis */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <FaUserInjured className="text-blue-600 text-xl" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Clinical Analysis</h1>
                        </div>
                        <p className="text-gray-500 font-medium">Manage and track patient medication safety profiles</p>
                        <div className="flex items-center gap-2 pt-1">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">System Status: Refresh Active</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleManualRefresh}
                            disabled={loading}
                            className="p-3 text-gray-500 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-all border border-gray-200 flex items-center gap-2 group"
                            title="Synchronize Patient List"
                        >
                            <FaSync className={`${loading ? 'animate-spin' : ''} transition-transform group-hover:rotate-180`} />
                            <span className="hidden sm:inline text-sm font-semibold">Sync</span>
                        </button>
                        
                        <button
                            onClick={handleNewPatient}
                            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-blue-200/50 transition-all transform active:scale-95 ${
                                isIndividual && userRole !== 'admin' && patients.length >= 5
                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                            }`}
                        >
                            <FaPlus className="text-sm" />
                            <span>New Case MR</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 🔍 Advanced Search & Filters (Visible for Teams/Admins) */}
            {!isIndividual && (
                <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="relative group">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                placeholder="Search by name, ID or diagnosis..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-700"
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
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-700 appearance-none"
                            >
                                <option value="all">Active & Inactive Cases</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* 📊 Main Content Area: Patients Table/List */}
            <div className="w-full">
                {currentPatients.length > 0 ? (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                                        {!isRestrictedIndividual && (
                                            <th className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('id')}>
                                                <div className="flex items-center gap-2">MR Code {getSortIcon('id')}</div>
                                            </th>
                                        )}
                                        <th className="px-6 py-4 text-left">Patient Details</th>
                                        <th className="px-6 py-4 text-left">Clinical Diagnosis</th>
                                        <th className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('created_at')}>
                                            <div className="flex items-center gap-2">Record Date {getSortIcon('created_at')}</div>
                                        </th>
                                        {!isIndividual && <th className="px-6 py-4 text-left">Status</th>}
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {currentPatients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-blue-50/30 transition-colors group">
                                            {!isRestrictedIndividual && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">{patient.id}</span>
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                        {patient.full_name ? patient.full_name.charAt(0) : '?'}
                                                    </div>
                                                    <span className="font-bold text-gray-800">{patient.full_name || 'Anonymous Patient'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 max-w-xs truncate" title={patient.diagnosis}>{patient.diagnosis || 'No Diagnosis Recorded'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            {!isIndividual && (
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getStatusColor(patient.is_active)}`}>
                                                        {getStatusText(patient.is_active)}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleViewClick(patient.id)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="View Details"><FaEye /></button>
                                                    <button onClick={() => handleEditClick(patient)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors" title="Edit Record"><FaEdit /></button>
                                                    <button onClick={() => handleDelete(patient.id)} disabled={userRole === 'healthcare_client'} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-20" title="Delete"><FaTrash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Grid View */}
                        <div className="md:hidden space-y-4">
                            {currentPatients.map((patient) => (
                                <div key={patient.id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><FaUserInjured /></div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{patient.full_name || 'Anonymous'}</h3>
                                                <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{patient.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm bg-gray-50 p-3 rounded-xl text-gray-700 italic">" {patient.diagnosis || 'No Diagnosis' } "</p>
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleViewClick(patient.id)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">View</button>
                                                <button onClick={() => handleEditClick(patient)} className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold">Edit</button>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(patient.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    /* 🏜️ Empty State & Diagnostics */
                    <div className="bg-white rounded-3xl shadow-sm p-16 text-center border border-gray-100">
                        <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-8 relative">
                            <FaUserInjured className="text-blue-200 text-5xl" />
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <FaSearch className="text-blue-500 text-xs animate-bounce" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">No Patients Identified</h3>
                        <p className="text-gray-500 font-medium mb-10 max-w-md mx-auto leading-relaxed">
                            {searchTerm ? `No records matching "${searchTerm}" were detected in your clinical database.` : 'The analysis engine is ready but no patient profiles have been established yet.'}
                        </p>
                        
                        {/* 🛠️ Diagnostic "X-Ray" View */}
                        <div className="mt-4 mb-10 p-6 bg-slate-900 text-slate-300 text-[11px] rounded-2xl border border-slate-800 shadow-2xl max-w-lg mx-auto overflow-hidden text-left font-mono">
                           <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                               <span className="text-blue-400 font-bold uppercase tracking-widest text-[9px]">🔍 Patient Visibility Diagnostic</span>
                               <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                           </div>
                           <div className="space-y-1.5 opacity-80">
                                <p><span className="text-slate-500">AUTH_ROLE:</span> <span className="text-amber-400">"{userRole || 'UNKNOWN'}"</span></p>
                                <p><span className="text-slate-500">ACC_TYPE:</span> <span className="text-emerald-400">"{userAccountType || 'INDIVIDUAL'}"</span></p>
                                <p><span className="text-slate-500">MASTER_KEY:</span> <span className={localStorage.getItem('enc_key_raw') ? "text-emerald-400" : "text-rose-400"}>{localStorage.getItem('enc_key_raw') ? "INSTALLED (SECURE)" : "MISSING (ACTION REQUIRED)"}</span></p>
                                <p><span className="text-slate-500">COMPANY_ID:</span> <span className="text-blue-400">{userCompanyId ? `"${userCompanyId}"` : "NULL (PERSONAL SCOPE)"}</span></p>
                           </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                onClick={handleNewPatient}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-200/50 transition-all hover:-translate-y-1"
                            >
                                <FaPlus /> Start New Clinical Case
                            </button>
                            <button
                                onClick={handleManualRefresh}
                                className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-8 py-4 rounded-2xl font-bold border border-gray-200 transition-all"
                            >
                                <FaSync className={loading ? 'animate-spin' : ''} /> Force Sync Cloud
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 📈 Pagination (Only if records exist) */}
            {filteredPatients.length > itemsPerPage && (
                <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Displaying {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length} Cases
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed">←</button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg text-[10px] font-black uppercase transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}>{i + 1}</button>
                            ))}
                        </div>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed">→</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientList;
