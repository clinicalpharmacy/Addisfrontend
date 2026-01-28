import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBrain, FaSearch, FaUserInjured, FaSync,
    FaFilter, FaArrowLeft, FaExclamationTriangle
} from 'react-icons/fa';
import api from '../utils/api';
import CDSSDisplay from '../components/CDSS/CDSSDisplay';

const CDSSAnalysisPage = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const result = await api.get('/patients');
            if (result.success && result.patients) {
                setPatients(result.patients);
            }
        } catch (err) {
            console.error('Error fetching patients:', err);
            setError('Failed to load patients for analysis');
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.patient_code?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
    };

    if (error) {
        return (
            <div className="p-8 text-center">
                <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">{error}</h2>
                <button
                    onClick={fetchPatients}
                    className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => selectedPatient ? setSelectedPatient(null) : navigate(-1)}
                            className="bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                        >
                            <FaArrowLeft className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <FaBrain className="text-purple-600" />
                                Clinical Decision Support (CDSS)
                            </h1>
                            <p className="text-gray-600">
                                {selectedPatient
                                    ? `Analyzing: ${selectedPatient.full_name} (${selectedPatient.patient_code})`
                                    : 'Select a patient to perform clinical analysis'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {!selectedPatient ? (
                    <div className="space-y-6">
                        {/* Search Bar */}
                        <div className="bg-white p-4 rounded-xl shadow-sm relative">
                            <FaSearch className="absolute left-7 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search patients by name, code or diagnosis..."
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                        </div>

                        {/* Patient List Grid */}
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map(patient => (
                                        <div
                                            key={patient.id}
                                            onClick={() => handleSelectPatient(patient)}
                                            className="bg-white p-6 rounded-xl shadow-sm border border-transparent hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                                                    <FaUserInjured className="text-purple-600 group-hover:text-white text-xl" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                                                        {patient.full_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">{patient.patient_code}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Gender/Age:</span>
                                                    <span className="text-gray-700 font-medium">{patient.gender || 'N/A'} / {patient.age || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Diagnosis:</span>
                                                    <span className="text-gray-700 font-medium truncate max-w-[150px]" title={patient.diagnosis}>
                                                        {patient.diagnosis || 'None'}
                                                    </span>
                                                </div>
                                            </div>

                                            <button className="w-full bg-purple-50 text-purple-600 py-2 rounded-lg font-semibold group-hover:bg-purple-600 group-hover:text-white transition-all">
                                                Run Analysis
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 text-center bg-white rounded-xl">
                                        <p className="text-gray-500">No patients found.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* CDSS Display Component */
                    <div className="animate-in fade-in duration-500">
                        <CDSSDisplay patientData={selectedPatient} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CDSSAnalysisPage;
