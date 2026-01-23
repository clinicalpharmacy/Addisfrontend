import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    FaSortDown
} from 'react-icons/fa';

const PatientList = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        // Get user role from token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role || 'user');
            } catch (e) {
                console.log('Error parsing token:', e);
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
            
            const response = await fetch('http://localhost:3000/api/patients', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.patients) {
                    setPatients(result.patients);
                    setFilteredPatients(result.patients);
                }
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
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
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            
            const response = await fetch(`http://localhost:3000/api/patients/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    fetchPatients();
                } else {
                    alert('Failed to delete patient');
                }
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Error deleting patient');
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
        const newPatientCode = generatePatientCode();
        navigate(`/patients/${newPatientCode}`);
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

    // **FIXED: Simplified Edit Click Handler**
    const handleEditClick = (patient) => {
        console.log('🔵 Edit clicked for patient:', patient.patient_code);
        
        // Store patient data in localStorage instead of sessionStorage
        localStorage.setItem('editPatientData', JSON.stringify(patient));
        localStorage.setItem('editPatientCode', patient.patient_code);
        localStorage.setItem('editMode', 'true');
        
        // Navigate to patient details with edit mode
        navigate(`/patients/${patient.patient_code}?edit=true`);
    };

    // **FIXED: View Click Handler**
    const handleViewClick = (patientCode) => {
        console.log('🔵 View clicked for patient:', patientCode);
        
        // Clear any edit data
        localStorage.removeItem('editPatientData');
        localStorage.removeItem('editPatientCode');
        localStorage.removeItem('editMode');
        
        // Navigate without edit mode
        navigate(`/patients/${patientCode}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Patient Management</h1>
                    <p className="text-gray-600">Manage your patients</p>
                </div>
                <button
                    onClick={handleNewPatient}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
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
                
                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
            </div>

            {/* Patients Table */}
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
                            {filteredPatients.length > 0 ? (
                                filteredPatients.map((patient) => {
                                    const currentUserId = getCurrentUserId();
                                    const canDelete = userRole === 'admin' || patient.user_id === currentUserId;
                                    
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

                {/* Pagination/Info */}
                {filteredPatients.length > 0 && (
                    <div className="p-4 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-gray-600">
                            Showing {filteredPatients.length} of {patients.length} patients
                        </div>
                        <div className="flex gap-2">
                            <button 
                                className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                                disabled
                            >
                                ← Previous
                            </button>
                            <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
                                1
                            </button>
                            <button 
                                className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                                disabled
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientList;