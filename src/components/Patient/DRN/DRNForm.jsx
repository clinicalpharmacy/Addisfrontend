import React, { useState } from 'react';
import {
    FaSave, FaTrash, FaCheckCircle, FaExclamationCircle,
    FaChevronDown, FaChevronUp, FaCheck
} from 'react-icons/fa';
import { drnCategories, menuItemsData } from '../../constants/drnConstants';

export const DRNForm = ({
    selectedCategory, setSelectedCategory,
    selectedCauses, setSelectedCauses,
    writeUps, setWriteUps,
    onSave, editId, setEditId
}) => {

    const handleCauseToggle = (causeName) => {
        setSelectedCauses(prev =>
            prev.includes(causeName)
                ? prev.filter(c => c !== causeName)
                : [...prev, causeName]
        );
    };

    const handleWriteUpChange = (cause, field, value) => {
        setWriteUps(prev => ({
            ...prev,
            [cause]: { ...prev[cause], [field]: value }
        }));
    };

    return (
        <div id="assessment-form" className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2">
                {editId ? 'Edit Assessment' : 'New Assessment'}
            </h3>

            {/* Category Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(drnCategories).map(([catKey, catData]) => {
                    const Icon = catData.icon;
                    const isSelected = selectedCategory === catKey;
                    return (
                        <button
                            key={catKey}
                            onClick={() => {
                                setSelectedCategory(catKey);
                                // If changing categories during create, might want to clear causes? 
                                // But keeps simplistic for now.
                            }}
                            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 text-center h-full ${isSelected
                                    ? `bg-${catData.color}-50 border-${catData.color}-500 ring-2 ring-${catData.color}-200 shadow-md transform -translate-y-1`
                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                }`}
                        >
                            <div className={`p-2 rounded-full ${isSelected ? `bg-${catData.color}-100 text-${catData.color}-600` : 'bg-gray-100 text-gray-500'}`}>
                                <Icon className="text-xl" />
                            </div>
                            <span className={`text-xs font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                                {catKey}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Causes List */}
            {selectedCategory && (
                <div className="animate-fade-in bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-800">Select Cause for {selectedCategory}</h4>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {menuItemsData[selectedCategory]?.map((item) => {
                            const isSelected = selectedCauses.includes(item.name);
                            return (
                                <div
                                    key={item.name}
                                    onClick={() => handleCauseToggle(item.name)}
                                    className={`cursor-pointer p-3 rounded-lg border transition-all flex items-center justify-between ${isSelected
                                            ? 'bg-blue-50 border-blue-500 shadow-sm'
                                            : 'hover:bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">{item.name}</p>
                                        <span className="text-xs text-gray-500 inline-block bg-white px-1.5 py-0.5 rounded border mt-1">
                                            {item.dtpType}
                                        </span>
                                    </div>
                                    {isSelected && <FaCheckCircle className="text-blue-600" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Write-up Forms */}
            {selectedCauses.map(cause => (
                <div key={cause} className="animate-slide-up bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b flex justify-between items-center">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">Assessment</span>
                            {cause}
                        </h4>
                        <button
                            onClick={() => onSave(cause)}
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm transition"
                        >
                            <FaSave /> {editId ? 'Update' : 'Save'}
                        </button>
                    </div>

                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Specific Case</label>
                            <textarea
                                rows={3}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 focus:bg-white transition"
                                placeholder="Describe specific rules or observation..."
                                value={writeUps[cause]?.specificCase || ''}
                                onChange={e => handleWriteUpChange(cause, 'specificCase', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Medical Condition</label>
                            <textarea
                                rows={3}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 focus:bg-white transition"
                                placeholder="Relevant diagnosis..."
                                value={writeUps[cause]?.medicalCondition || ''}
                                onChange={e => handleWriteUpChange(cause, 'medicalCondition', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Medication Involved</label>
                            <textarea
                                rows={3}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 focus:bg-white transition"
                                placeholder="Drug name, dose..."
                                value={writeUps[cause]?.medication || ''}
                                onChange={e => handleWriteUpChange(cause, 'medication', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
