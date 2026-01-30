import React from 'react';
import LabSettings from '../components/LabManagement/LabSettings';
import { FaFlask, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LabSettingsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="container mx-auto py-10 px-4 md:px-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 bg-white hover:bg-gray-100 rounded-2xl shadow-sm border border-gray-100 transition-all text-gray-600 flex-shrink-0 group"
                            title="Go Back"
                        >
                            <FaArrowLeft className="text-xl group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="bg-indigo-600 p-2 rounded-lg">
                                    <FaFlask className="text-white text-xl" />
                                </div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                                    Lab Configuration
                                </h1>
                            </div>
                            <p className="text-gray-500 font-medium max-w-lg">
                                Orchestrate global laboratory standard definitions for the clinical intelligence platform.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-indigo-600">DR</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-xs">
                            <span className="block font-black text-gray-800">Global System Tool</span>
                            <span className="text-gray-400 font-medium text-[10px] uppercase tracking-widest">Administrator Access</span>
                        </div>
                    </div>
                </div>

                <div className="bg-transparent">
                    <LabSettings />
                </div>

                <div className="mt-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] p-8 md:p-10 shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700">
                        <FaFlask size={200} />
                    </div>


                </div>
            </div>
        </div>
    );
};

export default LabSettingsPage;
