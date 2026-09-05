// ClinicalPharmacySkill.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    FaUserMd,
    FaSearch,
    FaSpinner,
    FaExclamationTriangle,
    FaSync,
    FaUser,
    FaArrowLeft,
    FaPlus
} from 'react-icons/fa';
import api from '../../utils/api';
// Remove the PatientDetails import or replace with the correct path
// import PatientDetails from '../Patient/PatientDetails';

const ClinicalPharmacySkill = () => {
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [viewMode, setViewMode] = useState('list');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
            } catch (e) {
                console.error('Failed to parse user:', e);
            }
        }
    }, []);

    const fetchPatients = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let endpoint = '/patients';
            const isCompanyUser = user?.company_id || 
                user?.account_type === 'company' ||
                ['company_admin', 'company_user'].includes(user?.role);
            
            const isHealthcareClient = user?.role === 'healthcare_client' || 
                user?.account_type === 'healthcare_client';
            
            const isIndividual = user?.account_type === 'individual' && 
                user?.role !== 'admin';

            if (isIndividual) {
                endpoint = '/patients/my-patients';
            } else if (isHealthcareClient) {
                endpoint = '/patients/assigned';
            } else if (isCompanyUser) {
                endpoint = '/patients/company';
            }

            const response = await api.get(endpoint);
            
            // Fix: Handle response structure correctly
            // The API interceptor returns response.data, so check if data exists
            const patientData = response?.patients || response || [];
            setPatients(Array.isArray(patientData) ? patientData : []);
        } catch (err) {
            console.error('Failed to fetch patients:', err);
            setError('Failed to load patients. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchPatients();
        }
    }, [user, fetchPatients]);

    const handlePatientSelect = (patientId) => {
        setSelectedPatientId(patientId);
        setViewMode('patient');
    };

    const handleBackToList = () => {
        setSelectedPatientId(null);
        setViewMode('list');
        fetchPatients();
    };

    const filteredPatients = patients.filter(patient => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (patient.full_name && patient.full_name.toLowerCase().includes(searchLower)) ||
            (patient.id && patient.id.toLowerCase().includes(searchLower)) ||
            (patient.diagnosis && patient.diagnosis.toLowerCase().includes(searchLower))
        );
    });

    const renderPatientList = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
                    <span className="ml-3 text-gray-600 font-medium">Loading patients...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center">
                    <FaExclamationTriangle className="inline-block mr-2" />
                    {error}
                    <button
                        onClick={fetchPatients}
                        className="ml-4 bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                    >
                        <FaSync /> Retry
                    </button>
                </div>
            );
        }

        if (patients.length === 0) {
            return (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUserMd className="text-indigo-600 text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Patients Found</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        {user?.account_type === 'individual' 
                            ? 'You don\'t have any patients assigned. You can create a new patient record to begin.'
                            : 'No patients are currently available. You can create a new patient record to begin clinical pharmacy review.'}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search patients by name, ID, or diagnosis..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 bg-gray-50/50 transition-all outline-none"
                    />
                    <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.map((patient) => (
                        <div
                            key={patient.id}
                            onClick={() => handlePatientSelect(patient.id)}
                            className="bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                                    <FaUser className="text-indigo-600 group-hover:text-white text-lg transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors truncate">
                                        {patient.full_name || `Patient ${patient.id}`}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {patient.id} • {patient.age || 'Age N/A'} • {patient.gender || 'N/A'}
                                    </p>
                                    {patient.diagnosis && (
                                        <p className="text-xs text-gray-600 mt-1 truncate">
                                            {patient.diagnosis}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    patient.is_active 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {patient.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <span className="text-xs text-indigo-600 font-medium group-hover:underline">
                                    Review Case →
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredPatients.length === 0 && searchTerm && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-gray-500 font-medium">
                            No patients found matching "{searchTerm}"
                        </p>
                    </div>
                )}
            </div>
        );
    };

    const renderPatientView = () => {
        if (!selectedPatientId) return null;

        return (
            <div className="space-y-4">
                <button
                    onClick={handleBackToList}
                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors font-medium text-sm bg-gray-100 hover:bg-indigo-50 px-4 py-2 rounded-lg"
                >
                    <FaArrowLeft /> Back to Patient List
                </button>

                {/* TODO: Import and use the actual PatientDetails component 
                    Replace this with the correct PatientDetails component once it's available
                */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-blue-700">Patient Details for: {selectedPatientId}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="clinical-pharmacy-skill">
            {viewMode === 'list' ? renderPatientList() : renderPatientView()}
        </div>
    );
};

export default ClinicalPharmacySkill;
