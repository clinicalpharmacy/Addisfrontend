import React, { useState } from 'react';
import {
    FaPills, FaSearch, FaSortAlphaDown, FaSortAlphaUp, FaPlus, FaBookMedical,
    FaEdit, FaTrash, FaTimes, FaSave, FaSpinner, FaExclamationTriangle,
    FaCheckCircle, FaPrescriptionBottleAlt
} from 'react-icons/fa';

export const AdminMedications = ({
    medications,
    loading,
    error,
    onAdd,
    onUpdate,
    onDelete,
    getMedicationClassColor, // Optional: if we want to pass this helper or define it here
    getPregnancyCategoryColor // Optional
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [localSuccess, setLocalSuccess] = useState('');
    const [localError, setLocalError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '', generic_name: '', brand_names: '', dosage_forms: '',
        strength: '', route: '', class: '', indications: '',
        contraindications: '', side_effects: '', interactions: '',
        storage: '', pregnancy_category: '', schedule: '', notes: ''
    });

    // Local helpers if not passed
    const getClassColor = getMedicationClassColor || ((cls) => 'bg-gray-100 text-gray-800');
    const getPregColor = getPregnancyCategoryColor || ((cat) => 'bg-gray-100 text-gray-800');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredMedications = medications.filter(med => {
        const term = searchTerm.toLowerCase();
        return (
            med.name.toLowerCase().includes(term) ||
            med.generic_name.toLowerCase().includes(term) ||
            (med.class && med.class.toLowerCase().includes(term)) ||
            (med.brand_names && med.brand_names.toLowerCase().includes(term))
        );
    }).sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        return sortDirection === 'asc'
            ? aVal.toString().localeCompare(bVal.toString())
            : bVal.toString().localeCompare(aVal.toString());
    });

    const resetForm = () => {
        setFormData({
            name: '', generic_name: '', brand_names: '', dosage_forms: '',
            strength: '', route: '', class: '', indications: '',
            contraindications: '', side_effects: '', interactions: '',
            storage: '', pregnancy_category: '', schedule: '', notes: ''
        });
        setEditingMedication(null);
        setShowAddForm(false);
        setLocalError('');
    };

    const handleEditClick = (med) => {
        setEditingMedication(med);
        setFormData({
            name: med.name || '',
            generic_name: med.generic_name || '',
            brand_names: med.brand_names || '',
            dosage_forms: med.dosage_forms || '',
            strength: med.strength || '',
            route: med.route || '',
            class: med.class || '',
            indications: med.indications || '',
            contraindications: med.contraindications || '',
            side_effects: med.side_effects || '',
            interactions: med.interactions || '',
            storage: med.storage || '',
            pregnancy_category: med.pregnancy_category || '',
            schedule: med.schedule || '',
            notes: med.notes || ''
        });
        setShowAddForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setLocalError('');

        if (!formData.name || !formData.generic_name) {
            setLocalError('Name and Generic Name are required.');
            setSubmitting(false);
            return;
        }

        let result;
        if (editingMedication) {
            result = await onUpdate(editingMedication.id, formData);
        } else {
            result = await onAdd(formData);
        }

        if (result.success) {
            setLocalSuccess(editingMedication ? 'Medication updated!' : 'Medication added!');
            resetForm();
            setTimeout(() => setLocalSuccess(''), 3000);
        } else {
            setLocalError(result.error || 'Operation failed');
        }
        setSubmitting(false);
    };

    const handleDeleteClick = async (id, name) => {
        if (window.confirm(`Delete ${name}?`)) {
            const result = await onDelete(id);
            if (result.success) {
                setLocalSuccess('Medication deleted.');
                setTimeout(() => setLocalSuccess(''), 3000);
            } else {
                setLocalError(result.error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FaBookMedical className="text-purple-600" /> Medication Knowledge Base
                        </h2>
                        <p className="text-gray-600 text-sm">Manage comprehensive drug information</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowAddForm(true); }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                        <FaPlus /> Add Medication
                    </button>
                </div>

                {/* Messages */}
                {localSuccess && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 flex items-center gap-2">
                        <FaCheckCircle className="text-green-500" />
                        <span className="text-green-700">{localSuccess}</span>
                    </div>
                )}
                {localError && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 flex items-center gap-2">
                        <FaExclamationTriangle className="text-red-500" />
                        <span className="text-red-700">{localError}</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Search Bar */}
                <div className="relative mb-6">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, generic name, brand, or class..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-12">
                        <FaSpinner className="animate-spin text-4xl text-purple-500 mx-auto" />
                        <p className="mt-2 text-gray-500">Loading medications...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredMedications.map(med => (
                            <div key={med.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-gray-800">{med.name}</h3>
                                            <span className="text-sm text-gray-500">({med.generic_name})</span>
                                            <span className={`text-xs px-2 py-1 rounded ${getClassColor(med.class)}`}>
                                                {med.class || 'Unclassified'}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-600 space-y-1">
                                            <p><strong>Brand Names:</strong> {med.brand_names || 'N/A'}</p>
                                            <p><strong>Dose:</strong> {med.strength} {med.dosage_forms} ({med.route})</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(med)}
                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(med.id, med.name)}
                                            className="text-red-600 hover:bg-red-50 p-2 rounded"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-gray-50 p-3 rounded">
                                    <div>
                                        <span className="font-semibold block text-gray-500">Pregnancy Category</span>
                                        <span className={`inline-block px-2 py-0.5 rounded mt-1 font-bold ${getPregColor(med.pregnancy_category)}`}>
                                            {med.pregnancy_category || 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-semibold block text-gray-500">Schedule</span>
                                        <span className="text-gray-700">{med.schedule || 'N/A'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="font-semibold block text-gray-500">Indications</span>
                                        <span className="text-gray-700 truncate block" title={med.indications}>
                                            {med.indications || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredMedications.length === 0 && (
                            <p className="text-center text-gray-500 py-8">No medications found.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingMedication ? 'Edit Medication' : 'Add New Medication'}
                            </h3>
                            <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">
                                <FaTimes className="text-xl" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-purple-700 border-b pb-2">Basic Information</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name *</label>
                                        <input
                                            type="text" required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="e.g. Amoxicillin"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name *</label>
                                        <input
                                            type="text" required
                                            value={formData.generic_name}
                                            onChange={e => setFormData({ ...formData, generic_name: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="e.g. Amoxicillin"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand Names</label>
                                        <input
                                            type="text"
                                            value={formData.brand_names}
                                            onChange={e => setFormData({ ...formData, brand_names: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="e.g. Amoxil, Moxatag"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Drug Class</label>
                                        <input
                                            type="text"
                                            value={formData.class}
                                            onChange={e => setFormData({ ...formData, class: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="e.g. Antibiotic"
                                        />
                                    </div>
                                </div>

                                {/* Clinical Info */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-purple-700 border-b pb-2">Clinical Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pregnancy Cat.</label>
                                            <select
                                                value={formData.pregnancy_category}
                                                onChange={e => setFormData({ ...formData, pregnancy_category: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                            >
                                                <option value="">Select</option>
                                                <option value="A">A (Safe)</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                                <option value="X">X (Contraindicated)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                                            <select
                                                value={formData.schedule}
                                                onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                            >
                                                <option value="">Select</option>
                                                <option value="OTC">OTC</option>
                                                <option value="Prescription">Prescription</option>
                                                <option value="Controlled">Controlled</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Indications</label>
                                        <textarea
                                            value={formData.indications}
                                            onChange={e => setFormData({ ...formData, indications: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                            rows="2"
                                            placeholder="What does it treat?"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraindications</label>
                                        <textarea
                                            value={formData.contraindications}
                                            onChange={e => setFormData({ ...formData, contraindications: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                            rows="2"
                                            placeholder="When should it NOT be used?"
                                        />
                                    </div>
                                </div>

                                {/* More Details */}
                                <div className="space-y-4 md:col-span-2">
                                    <h4 className="font-semibold text-purple-700 border-b pb-2">Additional Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Forms</label>
                                            <input
                                                type="text"
                                                value={formData.dosage_forms}
                                                onChange={e => setFormData({ ...formData, dosage_forms: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="Tablets, Syrup..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
                                            <input
                                                type="text"
                                                value={formData.strength}
                                                onChange={e => setFormData({ ...formData, strength: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="500mg, 10ml..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                                            <input
                                                type="text"
                                                value={formData.route}
                                                onChange={e => setFormData({ ...formData, route: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="Oral, IV..."
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Side Effects</label>
                                            <textarea
                                                value={formData.side_effects}
                                                onChange={e => setFormData({ ...formData, side_effects: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                rows="2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Interactions</label>
                                            <textarea
                                                value={formData.interactions}
                                                onChange={e => setFormData({ ...formData, interactions: e.target.value })}
                                                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                                rows="2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t sticky bottom-0 bg-white">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                                >
                                    {submitting ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                    {editingMedication ? 'Update Medication' : 'Save Medication'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
