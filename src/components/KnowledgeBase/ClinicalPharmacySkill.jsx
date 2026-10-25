import React, { useState } from 'react';
import PatientList from '../../pages/PatientList';
import PatientDetails from '../../pages/PatientDetails';
import { FaUserShield, FaNotesMedical, FaCheckCircle } from 'react-icons/fa';

/**
 * ClinicalPharmacySkill Component
 *
 * Implements the Medication Review module inside the Education section of Clinical Pharmacy Skills.
 * Allows pharmacy students and pharmacists to review, create, and manage Medication Review (MR) cases
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
            {/* Info Header */}
            {!selectedPatientCode && (
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <p className="text-sm text-gray-600 mt-1 max-w-2xl font-medium">
                        Review hypothetical cases to acquire clinical pharmacy skill. Exercise collecting comprehensive medication history, perform drug related need assessment, identify drug therapy problems, and develop care plans.
                    </p>
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
