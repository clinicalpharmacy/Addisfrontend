import React, { useState } from 'react';
import PatientList from '../../pages/PatientList';
import PatientDetails from '../../pages/PatientDetails';
import { FaUserShield, FaNotesMedical, FaCheckCircle } from 'react-icons/fa';

/**
 * ClinicalPharmacySkill Component
 *
 * Implements the Medication Review module inside the Education section of Clinical Pharmacy Skills.
 * Allows pharmacy students and pharmacists to review, create, and manage Medication Review (MR) cases
 * organized by Patient Code.
 */
const ClinicalPharmacySkill = () => {
    const [selectedPatientCode, setSelectedPatientCode] = useState(null);

    const handleSelectPatient = (patientId, edit = false) => {
        setSelectedPatientCode(patientId);
    };

    const handleNewPatient = () => {
        setSelectedPatientCode('new');
    };

    const handleBackToList = () => {
        setSelectedPatientCode(null);
    };

    const handlePatientCreated = (newId) => {
        setSelectedPatientCode(newId);
    };

    return (
        <div className="space-y-6">
            {/* Context Badge & Info Header */}
            {!selectedPatientCode && (
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <FaUserShield className="text-2xl" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                                    Medication Review (MR) with Patient Code
                                </h3>
                                <span className="bg-indigo-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Clinical Skill
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 max-w-2xl font-medium">
                                Review individual patient cases identified by unique Patient Codes. Analyze drug therapy regimens, CDSS alerts, drug-related needs (DRN), pharmaceutical care plans, and clinical outcomes.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* When a patient code is selected (or 'new'), display the full Medication Review (PatientDetails) */}
            {selectedPatientCode ? (
                <div className="animate-fadeIn">
                    <PatientDetails
                        patientCode={selectedPatientCode}
                        onBack={handleBackToList}
                        onPatientCreated={handlePatientCreated}
                    />
                </div>
            ) : (
                /* Patient list with Patient Code display and selection */
                <div className="animate-fadeIn">
                    <PatientList
                        embedded={true}
                        onSelectPatient={handleSelectPatient}
                        onNewPatient={handleNewPatient}
                    />
                </div>
            )}
        </div>
    );
};

export default ClinicalPharmacySkill;
