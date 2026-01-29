import React from 'react';
import { FaDatabase, FaCalendarDay, FaPills, FaFlask } from 'react-icons/fa';

export const AlertDetails = ({ alert }) => {
    return (
        <div className="mt-4 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FaDatabase /> Triggering Evidence
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Age Information */}
                    {alert.evidence.age_in_days > 0 && (
                        <div>
                            <h5 className="font-medium text-gray-600 mb-2 flex items-center gap-2">
                                <FaCalendarDay className="text-blue-500" /> Age Information
                            </h5>
                            <div className="space-y-1">
                                <div className="text-sm pl-4">
                                    • <span className="font-medium">Age in Days:</span>
                                    <span className="ml-2 text-blue-600">{alert.evidence.age_in_days}</span>
                                </div>
                                {alert.evidence.patient_type && (
                                    <div className="text-sm pl-4">
                                        • <span className="font-medium">Patient Type:</span>
                                        <span className="ml-2 text-blue-600 capitalize">{alert.evidence.patient_type}</span>
                                    </div>
                                )}
                                {alert.evidence.is_pediatric && (
                                    <div className="text-sm pl-4">
                                        • <span className="font-medium">Pediatric:</span>
                                        <span className="ml-2 text-green-600">Yes</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Medications */}
                    {alert.evidence.medications && alert.evidence.medications.length > 0 && (
                        <div>
                            <h5 className="font-medium text-gray-600 mb-2 flex items-center gap-2">
                                <FaPills className="text-purple-500" /> Medications Involved
                            </h5>
                            <div className="space-y-1">
                                {alert.evidence.medications.map((med, idx) => (
                                    <div key={idx} className="text-sm pl-4">
                                        • <span className="font-medium">{med}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Labs */}
                    {alert.evidence.labs && Object.keys(alert.evidence.labs).length > 0 && (
                        <div>
                            <h5 className="font-medium text-gray-600 mb-2 flex items-center gap-2">
                                <FaFlask className="text-green-500" /> Lab Values
                            </h5>
                            <div className="space-y-1">
                                {Object.entries(alert.evidence.labs).slice(0, 5).map(([key, value]) => (
                                    <div key={key} className="text-sm pl-4">
                                        • <span className="font-medium">{key}:</span>
                                        <span className={`ml-2 ${value > 5 ? 'text-red-600' : 'text-gray-700'}`}>
                                            {typeof value === 'number' ? value.toFixed(1) : value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
