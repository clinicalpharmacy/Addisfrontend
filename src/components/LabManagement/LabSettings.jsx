import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import {
    FaFlask,
    FaPlus,
    FaTrash,
    FaEdit,
    FaSave,
    FaTimes,
    FaCheckCircle,
    FaExclamationCircle,
    FaSpinner,
    FaToggleOn,
    FaToggleOff,
    FaInfoCircle
} from 'react-icons/fa';

const LabSettings = ({ onUpdate }) => {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingLab, setEditingLab] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        unit: '',
        category: 'General',
        is_active: true,
        reference_range: '',
        description: ''
    });

    const categories = [
        'General',
        'Hematology',
        'Biochemistry',
        'Electrolytes',
        'Endocrine',
        'Infectious Disease',
        'Urinalysis',
        'Other'
    ];

    useEffect(() => {
        fetchLabs();
    }, []);

    const fetchLabs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('lab_tests')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                // If table doesn't exist, we might get an error. 
                // In a real app, we'd handle migration.
                if (error.code === 'PGRST116' || error.message.includes('not found')) {
                    console.log('lab_tests table likely not created yet');
                    setLabs([]);
                } else {
                    throw error;
                }
            } else {
                setLabs(data || []);
            }
        } catch (err) {
            console.error('Error fetching labs:', err);
            setError('Failed to load lab definitions.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (editingLab) {
                const { error } = await supabase
                    .from('lab_tests')
                    .update(formData)
                    .eq('id', editingLab.id);
                if (error) throw error;
                setSuccess('Lab updated successfully!');
                if (onUpdate) onUpdate();
            } else {
                const { error } = await supabase
                    .from('lab_tests')
                    .insert([formData]);
                if (error) throw error;
                setSuccess('Lab created successfully!');
                if (onUpdate) onUpdate();
            }

            setFormData({
                name: '',
                unit: '',
                category: 'General',
                is_active: true,
                reference_range: '',
                description: ''
            });
            setShowAddForm(false);
            setEditingLab(null);
            fetchLabs();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving lab:', err);
            setError(`Error: ${err.message}. Make sure the 'lab_tests' table exists in your database.`);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (lab) => {
        setEditingLab(lab);
        setFormData({
            name: lab.name,
            unit: lab.unit || '',
            category: lab.category || 'General',
            is_active: lab.is_active,
            reference_range: lab.reference_range || '',
            description: lab.description || ''
        });
        setShowAddForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this lab definition? This will NOT remove historic data from patients but will hide the field for new input.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('lab_tests')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSuccess('Lab deleted successfully');
            fetchLabs();
            if (onUpdate) onUpdate();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const toggleStatus = async (lab) => {
        try {
            const { error } = await supabase
                .from('lab_tests')
                .update({ is_active: !lab.is_active })
                .eq('id', lab.id);

            if (error) throw error;
            fetchLabs();
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                        <FaFlask className="text-indigo-600" /> Global Lab Definitions
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Define lab tests that should appear for all users to input across all patients.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingLab(null);
                        setFormData({ name: '', unit: '', category: 'General', is_active: true, reference_range: '', description: '' });
                        setShowAddForm(true);
                    }}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                    <FaPlus /> New Lab Test Definition
                </button>
            </div>

            {error && (
                <div className="m-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 animate-shake">
                    <FaExclamationCircle className="flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto"><FaTimes /></button>
                </div>
            )}

            {success && (
                <div className="m-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center gap-3">
                    <FaCheckCircle className="flex-shrink-0" />
                    <p className="text-sm font-medium">{success}</p>
                </div>
            )}

            <div className="p-4 md:p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <FaSpinner className="animate-spin text-4xl text-indigo-500 mb-4" />
                        <p className="text-gray-500">Loading lab definitions...</p>
                    </div>
                ) : labs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <FaFlask className="text-5xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">No Global Labs Defined</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2">
                            Add lab tests here and they will automatically appear in the patient details page for all users to fill in.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {labs.map((lab) => (
                                <div key={lab.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleStatus(lab)}
                                                className={`text-2xl transition-colors ${lab.is_active ? 'text-green-500' : 'text-gray-300'}`}
                                            >
                                                {lab.is_active ? <FaToggleOn /> : <FaToggleOff />}
                                            </button>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg">{lab.name}</h3>
                                                {lab.description && <p className="text-xs text-gray-500 line-clamp-1">{lab.description}</p>}
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                                            {lab.category}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
                                        <div>
                                            <span className="block text-xs font-bold text-gray-400 uppercase">Unit</span>
                                            <span className="font-medium text-gray-800">{lab.unit || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-400 uppercase">Ref Range</span>
                                            <span className="font-medium text-gray-800">{lab.reference_range || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                        <button
                                            onClick={() => handleEdit(lab)}
                                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-100"
                                        >
                                            <FaEdit /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(lab.id)}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-100"
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold tracking-wider">
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Lab Name</th>
                                        <th className="px-6 py-4">Unit</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {labs.map((lab) => (
                                        <tr key={lab.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleStatus(lab)}
                                                    className={`text-2xl transition-colors ${lab.is_active ? 'text-green-500' : 'text-gray-300'}`}
                                                >
                                                    {lab.is_active ? <FaToggleOn /> : <FaToggleOff />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{lab.name}</div>
                                                {lab.description && <div className="text-xs text-gray-500 truncate max-w-xs">{lab.description}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-medium">{lab.unit || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                                                    {lab.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(lab)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                                        title="Edit Definition"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(lab.id)}
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Delete Definition"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {showAddForm && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <FaFlask /> {editingLab ? 'Edit Lab Definition' : 'Add New Lab Definition'}
                            </h3>
                            <button onClick={() => setShowAddForm(false)} className="hover:rotate-90 transition-transform">
                                <FaTimes className="text-xl" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Lab Test Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Vitamin D, CRP, Fasting Blood Sugar"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Unit
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        placeholder="e.g. mg/dL, mmol/L"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none bg-white"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Reference Range
                                </label>
                                <input
                                    type="text"
                                    value={formData.reference_range}
                                    onChange={(e) => setFormData({ ...formData, reference_range: e.target.value })}
                                    placeholder="e.g. 70 - 110 mg/dL"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief explanation for users..."
                                    rows="2"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                    {editingLab ? 'Update Definition' : 'Create Definition'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabSettings;
