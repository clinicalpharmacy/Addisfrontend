import React, { useState } from 'react';
import { FaFlask, FaFilter, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import LabInputField from '../LabInputField'; // Assuming it's in parent dir relative to Forms, checking path below
// Actually LabInputField is in ../LabInputField from Forms (src/components/Patient/LabInputField)

export const PatientLabs = ({
    formData, handleChange, isEditing,
    showPediatricLabs, customLabs
}) => {

    // Group definitions (can be moved to constants if reused)
    const labGroups = {
        hematology: {
            title: "Hematology (CBC)",
            fields: [
                { id: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', range: '13-17 (M), 12-15 (F)' },
                { id: 'wbc_count', label: 'WBC Count', unit: 'x10³/µL', range: '4.5-11.0' },
                { id: 'platelet_count', label: 'Platelet Count', unit: 'x10³/µL', range: '150-450' },
                { id: 'hematocrit', label: 'Hematocrit', unit: '%', range: '40-50 (M), 36-46 (F)' },
                { id: 'rbc_count', label: 'RBC Count', unit: 'x10⁶/µL', range: '4.5-5.9 (M), 4.1-5.1 (F)' },
                { id: 'mcv', label: 'MCV', unit: 'fL', range: '80-100' }
            ]
        },
        biochemistry: {
            title: "Biochemistry",
            fields: [
                { id: 'blood_sugar', label: 'Blood Glucose', unit: 'mg/dL', range: '70-99' },
                { id: 'hba1c', label: 'HbA1c', unit: '%', range: '< 5.7' },
                { id: 'creatinine', label: 'Creatinine', unit: 'mg/dL', range: '0.7-1.3 (M), 0.6-1.1 (F)' },
                { id: 'urea', label: 'Urea', unit: 'mg/dL', range: '10-50' },
                { id: 'alt', label: 'ALT (SGPT)', unit: 'U/L', range: '7-56' },
                { id: 'ast', label: 'AST (SGOT)', unit: 'U/L', range: '10-40' },
                { id: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', range: '< 200' },
                { id: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', range: '< 150' }
            ]
        }
    };

    // Filter logic
    const [searchTerm, setSearchTerm] = useState('');

    const labsToRender = customLabs?.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // Helper to render sections
    const renderSection = (title, fields) => (
        <div className="bg-white rounded-lg border p-4 mb-4 shadow-sm">
            <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">{title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.map(field => (
                    <LabInputField
                        key={field.id}
                        label={field.label}
                        value={formData[field.id]}
                        unit={field.unit}
                        isEditing={isEditing}
                        handleChange={(val) => handleChange(field.id, val)}
                        normalRange={field.range}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {showPediatricLabs && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4 flex items-center gap-3">
                    <FaExclamationTriangle className="text-blue-500" />
                    <div>
                        <h4 className="font-bold text-blue-800">Pediatric Mode Active</h4>
                        <p className="text-sm text-blue-700">Lab reference ranges and fields adjusted for pediatric patient.</p>
                    </div>
                </div>
            )}

            {/* Core Panels */}
            {renderSection(labGroups.hematology.title, labGroups.hematology.fields)}
            {renderSection(labGroups.biochemistry.title, labGroups.biochemistry.fields)}

            {/* Dynamic / Custom Labs */}
            {customLabs.length > 0 && (
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h4 className="font-bold text-gray-700">Additional Labs</h4>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search labs..."
                                className="pl-8 pr-2 py-1 text-sm border rounded"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <FaSearch className="absolute left-2.5 top-2 text-gray-400 text-xs" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {labsToRender.map(lab => (
                            <LabInputField
                                key={lab.id}
                                label={lab.name}
                                value={formData[lab.name] || lab.value}
                                // Note: Custom labs storage logic in hook manages mapping 'name' to the formData key or value
                                unit={lab.unit}
                                isEditing={isEditing}
                                handleChange={(val) => handleChange(lab.name, val)}
                                normalRange={lab.reference_range}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
