import React from 'react';
import LabSettings from '../components/LabManagement/LabSettings';
import { FaFlask, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LabSettingsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-transparent pb-10">
            <div className="mx-auto py-4 px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 bg-white hover:bg-gray-100 rounded-xl shadow-sm border border-gray-100 transition-all text-gray-600 flex-shrink-0 group"
                            title="Go Back"
                        >
                            <FaArrowLeft className="text-lg group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="bg-indigo-600 p-1.5 rounded-lg">
                                    <FaFlask className="text-white text-base" />
                                </div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                    Lab Configuration
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className="flex -space-x-1.5">
                            {[1, 2].map(i => (
                                <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center">
                                    <span className="text-[9px] font-bold text-indigo-600">AD</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-[10px]">
                            <span className="block font-black text-gray-800 leading-none">Global Tool</span>
                            <span className="text-gray-400 font-medium uppercase tracking-tighter">Admin Access</span>
                        </div>
                    </div>
                </div>

                <div className="bg-transparent">
                    <LabSettings />
                </div>
            </div>
        </div>
    );
};

export default LabSettingsPage;
