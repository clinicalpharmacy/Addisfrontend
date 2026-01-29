import React from 'react';
import {
    FaHeartbeat, FaWeight, FaRulerVertical, FaThermometerHalf, FaLungs, FaClock, FaBaby
} from 'react-icons/fa';

export const PatientVitals = ({ formData, handleChange, isEditing, history = [] }) => {

    // Grouping vitals for cleaner UI
    const vitalFields = [
        { key: 'weight', label: 'Weight (kg)', icon: FaWeight, type: 'number', step: '0.1' },
        { key: 'height', label: 'Height (cm)', icon: FaRulerVertical, type: 'number', step: '0.1' },
        { key: 'bmi', label: 'BMI', icon: FaWeight, type: 'number', readOnly: true, className: 'bg-gray-100' },
        { key: 'temperature', label: 'Temp (°C)', icon: FaThermometerHalf, type: 'number', step: '0.1' },
        { key: 'blood_pressure', label: 'BP (mmHg)', icon: FaHeartbeat, type: 'text', placeholder: '120/80' },
        { key: 'heart_rate', label: 'HR (bpm)', icon: FaHeartbeat, type: 'number' },
        { key: 'respiratory_rate', label: 'RR (bpm)', icon: FaLungs, type: 'number' },
        { key: 'oxygen_saturation', label: 'O2 Sat (%)', icon: FaLungs, type: 'number' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaHeartbeat className="text-red-500" /> Vitals Signs
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FaClock /> Last Measured:
                        <input
                            type="date"
                            value={formData.last_measured || ''}
                            onChange={e => handleChange('last_measured', e.target.value)}
                            disabled={!isEditing}
                            className="border rounded px-2 py-1 ml-2 disabled:bg-transparent disabled:border-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {vitalFields.map(field => {
                        const Icon = field.icon;
                        return (
                            <div key={field.key} className="bg-gray-50 p-3 rounded-lg border border-gray-100 hover:shadow-sm transition">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{field.label}</label>
                                <div className="relative">
                                    <Icon className="absolute left-3 top-2.5 text-gray-400" />
                                    <input
                                        type={field.type}
                                        step={field.step}
                                        placeholder={field.placeholder}
                                        value={formData[field.key] || ''}
                                        onChange={e => handleChange(field.key, e.target.value)}
                                        disabled={!isEditing || field.readOnly}
                                        readOnly={field.readOnly}
                                        className={`w-full pl-9 pr-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition ${field.className || 'bg-white disabled:bg-gray-100'}`}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pregnancy Status (Females Only) */}
            {formData.gender === 'Female' && (
                <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6 border-b pb-2">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FaBaby className="text-pink-500" /> Pregnancy Status
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Is Pregnant?</label>
                            <select
                                value={formData.pregnancy_status || 'No'}
                                onChange={e => handleChange('pregnancy_status', e.target.value)}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
                            >
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                                <option value="Unknown">Unknown</option>
                            </select>
                        </div>
                        {formData.pregnancy_status === 'Yes' && (
                            <>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weeks</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 12"
                                        value={formData.pregnancy_weeks || ''}
                                        onChange={e => handleChange('pregnancy_weeks', e.target.value)}
                                        disabled={!isEditing}
                                        className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition bg-white disabled:bg-gray-100"
                                    />
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trimester</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={formData.pregnancy_trimester || ''}
                                        placeholder="Auto-calc"
                                        className="w-full px-3 py-2 border rounded-md outline-none bg-gray-100 text-gray-600"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}


            {/* Simple history chart or list could go here if needed, utilizing `history` prop */}
            {history.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold text-gray-700 mb-4">History</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">BP</th>
                                    <th className="px-4 py-2">HR</th>
                                    <th className="px-4 py-2">Temp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {history.slice(0, 5).map((h, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-2">{new Date(h.date_recorded || h.created_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-2">{h.blood_pressure || '--'}</td>
                                        <td className="px-4 py-2">{h.heart_rate || '--'}</td>
                                        <td className="px-4 py-2">{h.temperature || '--'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
