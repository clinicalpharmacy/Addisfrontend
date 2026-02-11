import React from 'react';
import {
    FaUser, FaCalendarAlt, FaPhone, FaHome, FaVenusMars,
    FaBaby, FaChild, FaBabyCarriage
} from 'react-icons/fa';

export const PatientDemographics = ({ formData, handleChange, isEditing }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2">
                <FaUser className="text-blue-600" /> Demographics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <div className="relative">
                        <FaUser className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            value={formData.full_name || ''}
                            onChange={(e) => handleChange('full_name', e.target.value)}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                            placeholder="Patient's Full Name"
                        />
                    </div>
                </div>

                {/* Date of Birth */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <div className="relative">
                        <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="date"
                            value={formData.date_of_birth || ''}
                            onChange={(e) => handleChange('date_of_birth', e.target.value)}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                        />
                    </div>
                </div>

                {/* Age Display (Read-only usually, or calc fields) */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age (Years)</label>
                        <input
                            type="number"
                            value={formData.age || ''}
                            onChange={(e) => handleChange('age', e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age (Days)</label>
                        <input
                            type="number"
                            value={formData.age_in_days || ''}
                            onChange={(e) => handleChange('age_in_days', e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                        />
                    </div>
                </div>

                {/* Gender */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <div className="relative">
                        <FaVenusMars className="absolute left-3 top-3 text-gray-400" />
                        <select
                            value={formData.gender || ''}
                            onChange={(e) => handleChange('gender', e.target.value)}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white disabled:bg-gray-50 outline-none"
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                </div>

                {/* Contact */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <div className="relative">
                        <FaPhone className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="tel"
                            value={formData.contact_number || ''}
                            onChange={(e) => handleChange('contact_number', e.target.value)}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            placeholder="+251..."
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <div className="relative">
                        <FaHome className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            value={formData.address || ''}
                            onChange={(e) => handleChange('address', e.target.value)}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg disabled:bg-gray-50"
                            placeholder="City, Subcity"
                        />
                    </div>
                </div>

                {/* Patient Type (Auto-calculated typically) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient Categorization</label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 border rounded-lg text-gray-600">
                        {formData.patient_type === 'neonate' && <FaBaby />}
                        {formData.patient_type === 'child' && <FaChild />}
                        <span className="capitalize">{formData.patient_type || 'Unknown'}</span>
                    </div>
                </div>
            </div>

            {/* Pregnancy Section (Conditional) */}
            {formData.gender === 'Female' && parseInt(formData.age) > 12 && (
                <div className="mt-6 pt-6 border-t bg-pink-50 rounded-lg p-4 -mx-2">
                    <div className="flex items-center gap-2 mb-4">
                        <FaBabyCarriage className="text-pink-600" />
                        <h4 className="font-bold text-pink-800">Pregnancy Information</h4>
                        <label className="flex items-center gap-2 ml-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_pregnant || false}
                                onChange={(e) => handleChange('is_pregnant', e.target.checked)}
                                disabled={!isEditing}
                                className="w-4 h-4 text-pink-600 rounded"
                            />
                            <span className="text-sm font-medium text-pink-800">Is Pregnant?</span>
                        </label>
                    </div>

                    {formData.is_pregnant && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-pink-700 uppercase">Weeks</label>
                                <input type="number" value={formData.pregnancy_weeks || ''} onChange={e => handleChange('pregnancy_weeks', e.target.value)} disabled={!isEditing} className="w-full p-2 border border-pink-200 rounded text-pink-900" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pink-700 uppercase">Trimester</label>
                                <input type="text" readOnly value={formData.pregnancy_trimester || ''} className="w-full p-2 bg-pink-100 border border-pink-200 rounded text-pink-900" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pink-700 uppercase">EDD</label>
                                <input type="date" value={formData.edd || ''} onChange={e => handleChange('edd', e.target.value)} disabled={!isEditing} className="w-full p-2 border border-pink-200 rounded text-pink-900" />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
