import React, { useState } from 'react';
import {
    FaUserInjured, FaSearch, FaPlus, FaEdit, FaTrash,
    FaTimes, FaSave, FaSpinner, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';

export const AdminPatients = ({
    patients,
    loading,
    onAdd,
    onUpdate,
    onDelete,
    getPatientStatusBadge,
    getGenderBadge,
    formatDate
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [localMessage, setLocalMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        full_name: '', age: '', gender: '', contact_number: '',
        address: '', diagnosis: '', is_active: true
    });

    const filteredPatients = patients.filter(patient => {
        const term = searchTerm.toLowerCase();
        return (
            patient.full_name.toLowerCase().includes(term) ||
            (patient.patient_code && patient.patient_code.toLowerCase().includes(term)) ||
            (patient.contact_number && patient.contact_number.toLowerCase().includes(term))
        );
    });

    const resetForm = () => {
        setFormData({
            full_name: '', age: '', gender: '', contact_number: '',
            address: '', diagnosis: '', is_active: true
        });
        setEditingPatient(null);
        setShowForm(false);
        setLocalMessage({ type: '', text: '' });
    };

    const handleEditClick = (patient) => {
        setEditingPatient(patient);
        setFormData({
            full_name: patient.full_name || '',
            age: patient.age || '',
            gender: patient.gender || '',
            contact_number: patient.contact_number || '',
            address: patient.address || '',
            diagnosis: patient.diagnosis || '',
            is_active: patient.is_active !== undefined ? patient.is_active : true
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setLocalMessage({ type: '', text: '' });

        if (!formData.full_name) {
            setLocalMessage({ type: 'error', text: 'Full Name is required.' });
            setSubmitting(false);
            return;
        }

        const dataToSend = {
            ...formData,
            age: formData.age ? parseInt(formData.age) : null
        };

        let result;
        if (editingPatient) {
            result = await onUpdate(editingPatient.id, dataToSend);
        } else {
            result = await onAdd(dataToSend);
        }

        if (result.success) {
            setLocalMessage({
                type: 'success',
                text: editingPatient ? 'Patient updated successfully.' : 'Patient added successfully.'
            });
            setTimeout(() => {
                resetForm();
            }, 1000);
        } else {
            setLocalMessage({ type: 'error', text: result.error || 'Operation failed.' });
        }
        setSubmitting(false);
    };

    const handleDeleteClick = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete patient ${name}?`)) {
            const result = await onDelete(id);
            if (result.success) {
                // Success handled by parent state update usually, but we can show a flash
            } else {
                alert(`Failed to delete: ${result.error}`);
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaUserInjured className="text-blue-600" /> Patient Management (Admin)
                    </h2>
                    <p className="text-gray-600 text-sm">Manage all patients in the system</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <FaPlus /> Add New Patient
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search patients by name, code or number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Patient</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Age/Gender</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Contact</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <FaSpinner className="animate-spin text-3xl text-blue-500 mx-auto" />
                                </td>
                            </tr>
                        ) : filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{patient.full_name}</p>
                                        <p className="text-xs text-gray-500 font-mono">{patient.patient_code || 'No Code'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {patient.age ? <span className="text-sm">{patient.age} yrs</span> : <span className="text-gray-400 text-sm">-</span>}
                                            {getGenderBadge ? getGenderBadge(patient.gender) : <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{patient.gender || '?'}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {patient.contact_number || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getPatientStatusBadge ? getPatientStatusBadge(patient.is_active) : (
                                            patient.is_active ? <span className="text-green-600 text-xs font-bold">Active</span> : <span className="text-gray-400 text-xs">Inactive</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(patient)}
                                                className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(patient.id, patient.full_name)}
                                                className="text-red-600 hover:bg-red-50 p-2 rounded"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No patients found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full animate-slideUp">
                        <div className="p-6 border-b flex justify-between items-center bg-blue-600 text-white rounded-t-xl">
                            <h3 className="text-xl font-bold">
                                {editingPatient ? 'Edit Patient' : 'Add New Patient'}
                            </h3>
                            <button onClick={resetForm} className="hover:text-gray-200">
                                <FaTimes className="text-xl" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">
                                {localMessage.text && (
                                    <div className={`p-3 rounded-lg flex items-center gap-2 ${localMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                        }`}>
                                        {localMessage.type === 'error' ? <FaExclamationTriangle /> : <FaCheckCircle />}
                                        {localMessage.text}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                        <input
                                            type="text" required
                                            value={formData.full_name}
                                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                        <input
                                            type="number"
                                            value={formData.age}
                                            onChange={e => setFormData({ ...formData, age: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                        <input
                                            type="text"
                                            value={formData.contact_number}
                                            onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Initial Diagnosis/Notes</label>
                                        <textarea
                                            value={formData.diagnosis}
                                            onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                            rows="2"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 mt-4 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Active Patient</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    {submitting ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                    {editingPatient ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
