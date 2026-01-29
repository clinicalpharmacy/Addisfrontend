import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaUser, FaHeartbeat, FaFlask, FaPills, FaBrain, FaFileMedical,
    FaChartLine, FaMoneyBillWave, FaSave, FaArrowLeft, FaEdit,
    FaTrash, FaPrint, FaSpinner
} from 'react-icons/fa';

// Hooks
import { usePatientLogic } from '../hooks/usePatientLogic';

// Components
import { PatientDemographics } from '../components/Patient/Forms/PatientDemographics';
import { PatientVitals } from '../components/Patient/Forms/PatientVitals';
import { PatientLabs } from '../components/Patient/Forms/PatientLabs';
import MedicationHistory from '../components/Patient/MedicationHistory';
import DRNAssessment from '../components/Patient/DRNAssessment';
import PhAssistPlan from '../components/Patient/PhAssistPlan';
import PatientOutcome from '../components/Patient/PatientOutcome';
import CostSection from '../components/Patient/CostSection';
import CDSSDisplay from '../components/CDSS/CDSSDisplay';

const PatientDetails = () => {
    const { patientCode } = useParams();
    const navigate = useNavigate();

    // Core Logic Hook
    const {
        patient, loading, error, isNewPatient, isEditing, setIsEditing,
        formData, handleInputChange, handleLabChange,
        ageMode, showPediatricLabs, customLabs,
        handleSave, vitalsHistory
    } = usePatientLogic(patientCode);

    // Tab Logic (kept local as it's UI state)
    const [activeTab, setActiveTab] = React.useState('overview');

    const tabs = useMemo(() => [
        { id: 'overview', label: 'Overview', icon: FaUser },
        { id: 'demographics', label: 'Demographics', icon: FaUser },
        { id: 'vitals', label: 'Vitals', icon: FaHeartbeat },
        { id: 'labs', label: 'Labs', icon: FaFlask },
        { id: 'medications', label: 'Medications', icon: FaPills },
        { id: 'analysis', label: 'Clinical Analysis', icon: FaBrain },
        { id: 'drn', label: 'DRN Assessment', icon: FaBrain },
        { id: 'plan', label: 'PharmAssist Plan', icon: FaFileMedical },
        { id: 'outcome', label: 'Outcome', icon: FaChartLine },
        { id: 'cost', label: 'Cost', icon: FaMoneyBillWave }
    ], []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading Patient Data...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={() => navigate('/patients')} className="px-4 py-2 bg-gray-200 rounded">Back to List</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/patients')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <FaArrowLeft />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {isNewPatient ? 'New Patient Registration' : formData.full_name || 'Patient Details'}
                                </h1>
                                {!isNewPatient && (
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-mono">{patientCode}</span>
                                        <span>{formData.age} yrs / {formData.gender}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow-sm">
                                        <FaSave /> Save Changes
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => window.print()} className="p-2 text-gray-600 hover:text-gray-900"><FaPrint /></button>
                                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
                                        <FaEdit /> Edit
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mt-6 border-b overflow-x-auto">
                        <nav className="flex space-x-1 min-w-max pb-1">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200
                                            ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                        `}
                                    >
                                        <Icon className={isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'} />
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Overview: Shows Demographics + Vitals summary */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <PatientDemographics formData={formData} handleChange={handleInputChange} isEditing={isEditing} />
                            <PatientVitals formData={formData} handleChange={handleLabChange} isEditing={isEditing} history={vitalsHistory} />
                        </div>
                        <div className="space-y-6">
                            {/* Quick Actions or Summary Card could go here */}
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <h3 className="font-bold text-blue-800 mb-2">Quick Summary</h3>
                                <div className="space-y-2 text-sm text-blue-700">
                                    <p><strong>Status:</strong> {formData.is_active ? 'Active' : 'Inactive'}</p>
                                    <p><strong>Type:</strong> <span className="capitalize">{formData.patient_type}</span></p>
                                    <p><strong>Allergies:</strong> {formData.allergies?.length > 0 ? formData.allergies.join(', ') : 'None recorded'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'demographics' && (
                    <PatientDemographics formData={formData} handleChange={handleInputChange} isEditing={isEditing} />
                )}

                {activeTab === 'vitals' && (
                    <PatientVitals formData={formData} handleChange={handleLabChange} isEditing={isEditing} history={vitalsHistory} />
                )}

                {activeTab === 'labs' && (
                    <PatientLabs
                        formData={formData}
                        handleChange={handleLabChange}
                        isEditing={isEditing}
                        showPediatricLabs={showPediatricLabs}
                        customLabs={customLabs}
                    />
                )}

                {/* Sub-Components */}
                {activeTab === 'medications' && <MedicationHistory patientCode={patientCode} />}

                {activeTab === 'analysis' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaBrain className="text-purple-600" /> Clinical Analysis (CDSS)</h2>
                            <CDSSDisplay patientCode={patientCode} />
                        </div>
                    </div>
                )}

                {activeTab === 'drn' && <DRNAssessment patientCode={patientCode} />}
                {activeTab === 'plan' && <PhAssistPlan patientCode={patientCode} />}
                {activeTab === 'outcome' && <PatientOutcome patientCode={patientCode} />}
                {activeTab === 'cost' && <CostSection patientCode={patientCode} />}

            </main>
        </div>
    );
};

export default PatientDetails;