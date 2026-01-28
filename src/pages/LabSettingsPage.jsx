import React from 'react';
import LabSettings from '../components/LabManagement/LabSettings';
import { FaFlask, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LabSettingsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                        title="Go Back"
                    >
                        <FaArrowLeft className="text-xl" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <FaFlask className="text-indigo-600" /> Lab Configuration
                        </h1>
                        <p className="text-gray-500 mt-1">Manage global laboratory test definitions and categories</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <LabSettings />
            </div>

            <div className="mt-8 bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <h3 className="text-lg font-bold text-indigo-900 mb-2">How it works</h3>
                <p className="text-indigo-800 text-sm leading-relaxed">
                    Definitions added here will automatically appear in the <strong>Laboratory Results</strong> section
                    of the Patient Details page for all users. Changes here affect new data entries across the entire system.
                    Clinicians will be able to enter results for these tests, while you manage the units and reference ranges.
                </p>
            </div>
        </div>
    );
};

export default LabSettingsPage;
