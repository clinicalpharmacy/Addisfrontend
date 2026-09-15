import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHardHat, FaArrowLeft, FaCogs } from 'react-icons/fa';

const UnderDevelopment = ({ title = 'This Feature' }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="text-center max-w-lg">
                {/* Title */}
                <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
                    Under Development
                </h1>

                {/* Subtitle */}
                <p className="text-lg text-slate-500 mb-2 font-medium">
                    {title}
                </p>

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-green-100 hover:shadow-xl hover:shadow-green-200"
                >
                    <FaArrowLeft className="text-sm" />
                    Go Back
                </button>
            </div>
        </div>
    );
};

export default UnderDevelopment;
