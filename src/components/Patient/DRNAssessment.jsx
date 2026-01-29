import React, { useEffect } from 'react';
import { FaStethoscope, FaSpinner, FaExclamationCircle, FaDatabase } from 'react-icons/fa';

import { useDRNLogic } from '../../hooks/useDRNLogic';
import { DRNAnalysis } from './DRN/DRNAnalysis';
import { DRNForm } from './DRN/DRNForm';
import { DRNHistory } from './DRN/DRNHistory';

const DRNAssessment = ({ patientCode }) => {
    // Logic extraction
    const logic = useDRNLogic(patientCode);

    // Auto-scroll logic if editId changes (handled inside hook actually?)
    // The hook returns `prepareEdit` which sets state. We can effect on it if needed.
    useEffect(() => {
        if (logic.editId) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [logic.editId]);

    // Handle Review Finding wrapper to scroll
    const handleReviewFinding = (finding) => {
        if (logic.prepareFromFinding(finding)) {
            setTimeout(() => {
                document.getElementById('assessment-form')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    if (logic.authError) return (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <FaExclamationCircle className="text-4xl text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800">Authentication Required</h3>
            <p className="text-gray-600 mb-4">{logic.authError}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-500 text-white rounded-lg">Refresh</button>
        </div>
    );

    if (!logic.patientData || !logic.userId) return (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Initializing DRN Assessment...</p>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 border-b pb-6">
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-full shadow-lg">
                    <FaStethoscope className="text-white text-xl" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">DRN Assessment - 9 Categories</h2>
                    <p className="text-gray-600 text-sm">Clinical Decision Support System (CDSS) Integration</p>
                </div>
            </div>

            {/* Analysis Section */}
            <DRNAnalysis
                results={logic.analysisResults}
                isAnalyzing={logic.isAnalyzing}
                onRunAnalysis={logic.runAnalysis}
                onReviewFinding={handleReviewFinding}
            />

            {/* Assessment UI */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Form */}
                <div className="lg:col-span-7 space-y-8">
                    <DRNForm
                        selectedCategory={logic.selectedCategory}
                        setSelectedCategory={logic.setSelectedCategory}
                        selectedCauses={logic.selectedCauses}
                        setSelectedCauses={logic.setSelectedCauses}
                        writeUps={logic.writeUps}
                        setWriteUps={logic.setWriteUps}
                        onSave={async (cause) => {
                            const res = await logic.handleSaveAssessment(cause);
                            if (res.error) alert(res.error);
                            else alert(logic.editId ? 'Updated' : 'Saved');
                        }}
                        editId={logic.editId}
                        setEditId={logic.setEditId}
                    />
                </div>

                {/* Right: History */}
                <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l lg:pl-8">
                    <DRNHistory
                        assessments={logic.assessments}
                        onEdit={logic.prepareEdit}
                        onDelete={logic.handleDeleteAssessment}
                    />
                </div>
            </div>
        </div>
    );
};

export default DRNAssessment;
