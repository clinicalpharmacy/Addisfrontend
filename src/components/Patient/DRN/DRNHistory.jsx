import React, { useState } from 'react';
import { FaEdit, FaTrash, FaHistory, FaCheck, FaSortAmountDown, FaFileAlt } from 'react-icons/fa';
import { drnCategories } from '../../../constants/drnConstants';

export const DRNHistory = ({ assessments, onEdit, onDelete }) => {

    // Sort logic removed for brevity but can be re-added inside component if needed
    // Assuming assessments are passed pre-sorted

    if (!assessments || assessments.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                <FaFileAlt className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No assessments recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <FaHistory className="text-blue-600" /> Assessment History
            </h3>

            <div className="grid gap-4">
                {assessments.map(item => {
                    const catData = drnCategories[item.category] || {};
                    const Icon = catData.icon || FaFileAlt;

                    return (
                        <div key={item.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-full flex-shrink-0 ${catData.color ? `bg-${catData.color}-100 text-${catData.color}-600` : 'bg-gray-100'}`}>
                                        <Icon className="text-xl" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded border ${catData.color ? `bg-${catData.color}-50 text-${catData.color}-700 border-${catData.color}-200` : 'bg-gray-100'}`}>
                                                {item.category}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-lg mb-2">{item.cause_name}</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-8 text-sm">
                                            <div>
                                                <span className="text-gray-500 block text-xs uppercase tracking-wide">Specific Case</span>
                                                <span className="font-medium text-gray-800">{item.specific_case}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block text-xs uppercase tracking-wide">Condition</span>
                                                <span className="font-medium text-gray-800">{item.medical_condition}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block text-xs uppercase tracking-wide">Medication</span>
                                                <span className="font-medium text-gray-800">{item.medication}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="Edit"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => onDelete(item.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Delete"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
