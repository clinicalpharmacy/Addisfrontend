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
    FaInfoCircle,
    FaSearch,
    FaVial
} from 'react-icons/fa';

const LabSettings = ({ onUpdate }) => {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingLab, setEditingLab] = useState(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    const [formData, setFormData] = useState({
        name: '',
        unit: '',
        category: 'General',
        is_active: true,
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
                .order('category', { ascending: true })
                .order('name', { ascending: true });

            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('not found')) {
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
                setSuccess('Lab definition updated!');
            } else {
                const { error } = await supabase
                    .from('lab_tests')
                    .insert([formData]);
                if (error) throw error;
                setSuccess('New lab definition created!');
            }

            setFormData({
                name: '',
                unit: '',
                category: 'General',
                is_active: true,
                description: ''
            });
            setShowAddForm(false);
            setEditingLab(null);
            fetchLabs();
            if (onUpdate) onUpdate();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving lab:', err);
            setError(err.message);
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
            description: lab.description || ''
        });
        setShowAddForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this definition? This affects future entries but preserves historical data.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('lab_tests')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSuccess('Definition removed');
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

    const filteredLabs = labs.filter(lab => {
        const matchesSearch = lab.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || lab.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryStyles = (category) => {
        switch (category) {
            case 'Hematology': return 'bg-red-50 text-red-600 border-red-100';
            case 'Biochemistry': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Electrolytes': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Endocrine': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Infectious Disease': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Urinalysis': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex-1 w-full md:max-w-md relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search laboratory tests..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full md:w-48 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-bold cursor-pointer transition-all"
                    >
                        <option value="All">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <button
                        onClick={() => {
                            setEditingLab(null);
                            setFormData({ name: '', unit: '', category: 'General', is_active: true, reference_range: '', description: '' });
                            setShowAddForm(true);
                        }}
                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md font-bold text-sm active:scale-95"
                    >
                        <FaPlus /> Add Definition
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Tests</div>
                    <div className="text-2xl font-black text-gray-800">{labs.length}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-1">Active Now</div>
                    <div className="text-2xl font-black text-gray-800">{labs.filter(l => l.is_active).length}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Categories</div>
                    <div className="text-2xl font-black text-gray-800">{new Set(labs.map(l => l.category)).size}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Status</div>
                    <div className="text-2xl font-black text-gray-800">Live</div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center gap-3 animate-shake">
                    <FaExclamationCircle className="flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto"><FaTimes /></button>
                </div>
            )}

            {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 flex items-center gap-3 animate-slideIn">
                    <FaCheckCircle className="flex-shrink-0" />
                    <p className="text-sm font-bold">{success}</p>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="relative">
                        <FaSpinner className="animate-spin text-5xl text-indigo-600 mb-4" />
                        <FaFlask className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl text-indigo-400 opacity-50" />
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Lab Framework...</p>
                </div>
            ) : filteredLabs.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaFlask className="text-4xl text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 mb-2">No Definitions Found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto text-sm">
                        {searchTerm ? "Your search criteria didn't match any records." : "Get started by defining your first laboratory test for the clinical platform."}
                    </p>
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="mt-4 text-indigo-600 font-black text-sm hover:underline">
                            Clear Search
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLabs.map((lab) => (
                        <div key={lab.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getCategoryStyles(lab.category)}`}>
                                        {lab.category}
                                    </div>
                                    <button
                                        onClick={() => toggleStatus(lab)}
                                        className={`transition-all duration-300 transform active:scale-90 ${lab.is_active ? 'text-green-500' : 'text-gray-300'}`}
                                        title={lab.is_active ? 'Disable Test' : 'Enable Test'}
                                    >
                                        {lab.is_active ? <FaToggleOn size={32} /> : <FaToggleOff size={32} />}
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-black text-gray-900 leading-tight mb-2 flex items-center gap-2">
                                        {lab.name}
                                        {!lab.is_active && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase">Inactive</span>}
                                    </h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] italic">
                                        {lab.description || "No detailed description provided for this definition."}
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 group-hover:bg-indigo-50/30 transition-colors">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Measurement Unit</div>
                                    <div className="text-sm font-bold text-gray-800">{lab.unit || "N/A"}</div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={() => handleEdit(lab)}
                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                                >
                                    <FaEdit /> Edit Setup
                                </button>
                                <button
                                    onClick={() => handleDelete(lab.id)}
                                    className="text-red-500 hover:text-red-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                                >
                                    <FaTrash /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-fadeIn">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp border border-indigo-100">
                        <div className="p-8 pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">
                                    {editingLab ? 'Edit Setup' : 'New Definition'}
                                </h3>
                                <p className="text-sm text-gray-500">Global laboratory test configuration.</p>
                            </div>
                            <button onClick={() => setShowAddForm(false)} className="p-3 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                                <FaTimes className="text-xl" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                        Lab Test Identity
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Hemoglobin A1c"
                                        className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-0 focus:border-indigo-500 outline-none transition-all font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                            Unit (SI)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            placeholder="mg/dL"
                                            className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-0 focus:border-indigo-500 outline-none transition-all font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                            Category
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-0 focus:border-indigo-500 outline-none transition-all appearance-none bg-gray-50 font-bold"
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>



                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Clinical significance..."
                                        rows="3"
                                        className="w-full border-2 border-gray-100 rounded-3xl px-5 py-3.5 focus:ring-0 focus:border-indigo-500 outline-none transition-all resize-none font-medium h-24"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-3xl transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                            >
                                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                {editingLab ? 'Save Changes' : 'Confirm Definition'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabSettings;
