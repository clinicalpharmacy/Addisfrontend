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
    FaClock
} from 'react-icons/fa';

import api from '../utils/api';

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

            const result = await api.get('/patients');

            if (result.success && result.patients) {
                setPatients(result.patients);
                setFilteredPatients(result.patients);
            } else {
                setPatients([]);
                setFilteredPatients([]);
            }
        } catch (error) {
            setPatients([]);
            setFilteredPatients([]);
        } finally {
            setLoading(false);
        }
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
                (patient.phone && patient.phone.toLowerCase().includes(term))
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(patient =>
                statusFilter === 'active'
                    ? patient.is_active !== false
                    : patient.is_active === false
            );
        }

        setFilteredPatients(filtered);
        setCurrentPage(1); // Reset to first page on search
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
        if (!window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            return;
        }

        try {
            // Using centralized api utility
            const result = await api.delete(`/patients/${id}`);

            if (result.success) {
                fetchPatients();
            } else {
                alert('Failed to delete patient');
            }
        } catch (error) {
            alert('Error deleting patient');
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

    const generatePatientCode = () => {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PAT${year}${month}${random}`;
    };

    const handleNewPatient = () => {
        // Individual accounts without a company can only create one patient
        const isIndividual = userAccountType === 'individual' && !userCompanyId;
        if (isIndividual && userRole !== 'admin' && patients.length >= 1) {
            alert('Individual subscription plan is limited to 1 patient record. Please upgrade to a Professional or Enterprise plan to manage more patients.');
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
            return null;
        }
    };

    const handleEditClick = (patient) => {
        // Store patient data in localStorage instead of sessionStorage
        localStorage.setItem('editPatientData', JSON.stringify(patient));
        localStorage.setItem('editPatientCode', patient.patient_code);
        localStorage.setItem('editMode', 'true');

        // Navigate to patient details with edit mode
        navigate(`/patients/${patient.patient_code}?edit=true`);
    };

    const handleViewClick = (patientCode) => {
        // Clear any edit data
        localStorage.removeItem('editPatientData');
        localStorage.removeItem('editPatientCode');
        localStorage.removeItem('editMode');

        // Navigate without edit mode
        navigate(`/patients/${patientCode}`);
    };

    // Pagination logic
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 px-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Comprehensive Medication Management</h1>
                    <p className="text-gray-600">Manage medication safety and effectiveness</p>
                </div>
                <button
                    onClick={handleNewPatient}
                    className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${(userAccountType === 'individual' && !userCompanyId) && userRole !== 'admin' && patients.length >= 1
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                    title={(userAccountType === 'individual' && !userCompanyId) && userRole !== 'admin' && patients.length >= 1 ? "Limit reached for Individual plan" : "Add New Patient"}
                >
                    <FaPlus /> New Patient
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Search patients..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            handleSearch({ target: { value: searchTerm } });
                        }}
                        className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>

                    <button
                        onClick={fetchPatients}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <FaFilter /> Refresh
                    </button>
                </div>
            </div> 
            
            {/* Patients Table (Desktop) */}
            <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th
                                    className="border p-3 text-left cursor-pointer hover:bg-gray-200"
                                    onClick={() => handleSort('patient_code')}
                                >
                                    <div className="flex items-center gap-2">
                                        Patient Code
                                        {getSortIcon('patient_code')}
                                    </div>
                                </th>
                                <th className="border p-3 text-left">Name</th>
                                <th className="border p-3 text-left">Diagnosis</th>
                                <th
                                    className="border p-3 text-left cursor-pointer hover:bg-gray-200"
                                    onClick={() => handleSort('created_at')}
                                >
                                    <div className="flex items-center gap-2">
                                        Created
                                        {getSortIcon('created_at')}
                                    </div>
                                </th>
                                <th className="border p-3 text-left">Status</th>
                                <th className="border p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPatients.length > 0 ? (
                                currentPatients.map((patient) => {
                                    const currentUserId = getCurrentUserId();
                                    const isIndividual = (userAccountType === 'individual' || userRole === 'individual_user' || userRole === 'pharmacist') && !userCompanyId;
                                    const isAdmin = userRole === 'admin';
                                    const canDelete = isAdmin || (patient.user_id === currentUserId && !isIndividual);

                                    return (
                                        <tr key={patient.id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="border p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <FaUserInjured className="text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{patient.patient_code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="border p-3">
                                                {patient.full_name || 'No name'}
                                            </td>
                                            <td className="border p-3">
                                                <div className="max-w-xs truncate" title={patient.diagnosis}>
                                                    {patient.diagnosis || 'No diagnosis'}
                                                </div>
                                            </td>
                                            <td className="border p-3 text-sm text-gray-600">
                                                {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="border p-3">
                                                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(patient.is_active)}`}>
                                                    {getStatusText(patient.is_active)}
                                                </span>
                                            </td>
                                            <td className="border p-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleViewClick(patient.patient_code)}
                                                        className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded"
                                                        title="View Patient"
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditClick(patient)}
                                                        className="text-yellow-500 hover:text-yellow-700 p-2 hover:bg-yellow-50 rounded"
                                                        title="Edit Patient"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(patient.id)}
                                                        className={`p-2 rounded ${canDelete ? 'text-red-500 hover:text-red-700 hover:bg-red-50' : 'text-gray-300 cursor-not-allowed'}`}
                                                        title={isAdmin ? "Delete Patient" : (isIndividual ? "Individual accounts cannot delete records" : (canDelete ? "Delete Patient" : "Cannot delete this patient"))}
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
                                        <div className="py-8">
                                            <FaUserInjured className="text-4xl text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">
                                                {searchTerm ? 'No patients found matching your search.' : 'No patients found.'}
                                            </p>
                                            <button
                                                onClick={handleNewPatient}
                                                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                + Add New Patient
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stats Section - Moved outside the map and before mobile patient list */}
            <div className="md:hidden bg-white rounded-xl shadow p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                    <p className="text-blue-600">Total Patients</p>
                    <p className="text-lg font-bold text-blue-800">{patients.length}</p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                    <p className="text-green-600">Active</p>
                    <p className="text-lg font-bold text-green-800">
                        {patients.filter(p => p.is_active !== false).length}
                    </p>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-yellow-600">With Appointments</p>
                    <p className="text-lg font-bold text-yellow-800">
                        {patients.filter(p => p.appointmentDate).length}
                    </p>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                    <p className="text-purple-600">Access Level</p>
                    <p className="text-lg font-bold text-purple-800">
                        {userRole === 'admin' ? 'Full' : userRole === 'company_admin' ? 'Company' : 'Personal'}
                    </p>
                </div>
            </div>

            {/* Patients List (Mobile) */}
            <div className="md:hidden space-y-4">
                {currentPatients.length > 0 ? (
                    currentPatients.map((patient) => {
                        const currentUserId = getCurrentUserId();
                        const isIndividual = (userAccountType === 'individual' || userRole === 'individual_user' || userRole === 'pharmacist') && !userCompanyId;
                        const isAdmin = userRole === 'admin';
                        const canDelete = isAdmin || (patient.user_id === currentUserId && !isIndividual);

                        return (
                            <div key={patient.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <FaUserInjured className="text-blue-600 text-xl" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{patient.full_name || 'No Name'}</h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                <FaIdCard />
                                                <span className="font-mono">{patient.patient_code}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(patient.is_active)}`}>
                                        {getStatusText(patient.is_active)}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {patient.diagnosis && (
                                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                            <span className="font-medium">Diagnosis:</span> {patient.diagnosis}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <FaClock /> Created: {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleViewClick(patient.patient_code)}
                                        className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-blue-100 transition"
                                    >
                                        <FaEye /> View
                                    </button>
                                    <button
                                        onClick={() => handleEditClick(patient)}
                                        className="flex-1 bg-yellow-50 text-yellow-700 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-yellow-100 transition"
                                    >
                                        <FaEdit /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(patient.id)}
                                        disabled={!canDelete}
                                        className={`w-10 flex items-center justify-center rounded-lg transition ${canDelete
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                            }`}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white rounded-xl shadow p-8 text-center">
                        <FaUserInjured className="text-4xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">
                            {searchTerm ? 'No patients found matching your search.' : 'No patients found.'}
                        </p>
                        <button
                            onClick={handleNewPatient}
                            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            + Add New Patient
                        </button>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {filteredPatients.length > itemsPerPage && (
                <div className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-600">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length} patients
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 border rounded-lg text-sm transition-colors ${currentPage === 1
                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                            ← Previous
                        </button>

                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${currentPage === i + 1
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 border rounded-lg text-sm transition-colors ${currentPage === totalPages
                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientList;
