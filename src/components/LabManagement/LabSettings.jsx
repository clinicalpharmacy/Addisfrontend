import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import {

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
        description: '',
        range_male: '',
        range_female: ''
    });

    const categories = [
        'General',
        'Complete blood count (CBC)',
        'Liver function tests',
        'Electrolytes',
        'Lipid profile',
        'Renal function tests',
        'Urinalysis',
        'Coagulation test'
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
                description: '',
                range_male: '',
                range_female: ''
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
            description: lab.description || '',
            range_male: lab.range_male || '',
            range_female: lab.range_female || ''
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
            case 'Complete blood count (CBC)': return 'bg-red-50 text-red-600 border-red-100';
            case 'Liver function tests': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Electrolytes': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Lipid profile': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Renal function tests': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Urinalysis': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'Coagulation test': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="space-y-4 animate-fadeIn pb-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex-1 w-full md:max-w-xs relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                        type="text"
                        placeholder="Search tests..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full md:w-40 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-bold cursor-pointer transition-all"
                    >
                        <option value="All">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <button
                        onClick={() => {
                            setEditingLab(null);
                            setFormData({ name: '', unit: '', category: 'General', is_active: true, description: '', range_male: '', range_female: '' });
                            setShowAddForm(true);
                        }}
                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm font-bold text-xs active:scale-95 whitespace-nowrap"
                    >
                        <FaPlus className="text-[10px]" /> Add Test
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Total Tests</div>
                    <div className="text-lg font-black text-gray-800">{labs.length}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-[9px] font-black uppercase tracking-widest text-green-500 mb-0.5">Active</div>
                    <div className="text-lg font-black text-gray-800">{labs.filter(l => l.is_active).length}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">Categories</div>
                    <div className="text-lg font-black text-gray-800">{new Set(labs.map(l => l.category)).size}</div>
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
                        <FaVial className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl text-indigo-400 opacity-50" />
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Lab Framework...</p>
                </div>
            ) : filteredLabs.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaVial className="text-4xl text-gray-300" />
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
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredLabs.map((lab) => (
                        <div key={lab.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col">
                            <div className="p-4 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${getCategoryStyles(lab.category)}`}>
                                        {lab.category}
                                    </div>
                                    <button
                                        onClick={() => toggleStatus(lab)}
                                        className={`transition-all duration-300 transform active:scale-90 ${lab.is_active ? 'text-green-500' : 'text-gray-200'}`}
                                        title={lab.is_active ? 'Disable' : 'Enable'}
                                    >
                                        {lab.is_active ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                                    </button>
                                </div>

                                <div className="mb-3">
                                    <h3 className="text-sm font-black text-gray-900 leading-tight mb-1 truncate flex items-center gap-1.5">
                                        {lab.name}
                                        {!lab.is_active && <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-black uppercase">OFF</span>}
                                    </h3>
                                    <p className="text-[11px] text-gray-500 line-clamp-2 min-h-[32px] italic leading-tight">
                                        {lab.description || "Global clinical definition."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 group-hover:bg-indigo-50/50 transition-colors">
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Measurement Unit</div>
                                        <div className="text-xs font-bold text-gray-800">{lab.unit || "N/A"}</div>
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 group-hover:bg-indigo-50/50 transition-colors">
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Ref. Range (M/F)</div>
                                        <div className="text-xs font-bold text-gray-800">
                                            {lab.range_male || lab.range_female ? (
                                                <div className="flex flex-col gap-0.5 leading-tight">
                                                    {lab.range_male && <span><span className="text-blue-500 font-black">M:</span> {lab.range_male}</span>}
                                                    {lab.range_female && <span><span className="text-pink-500 font-black">F:</span> {lab.range_female}</span>}
                                                </div>
                                            ) : "N/A"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <button
                                    onClick={() => handleEdit(lab)}
                                    className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                                >
                                    <FaEdit className="text-[9px]" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(lab.id)}
                                    className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                                >
                                    <FaTrash className="text-[9px]" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60] animate-fadeIn transition-all">
                    <div className="bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp border border-indigo-100 h-[90vh] sm:h-auto flex flex-col">
                        <div className="p-6 sm:p-8 pb-4 flex justify-between items-center border-b sm:border-b-0 border-gray-100">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                                    {editingLab ? 'Edit Setup' : 'New Definition'}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500">Global laboratory test configuration.</p>
                            </div>
                            <button onClick={() => setShowAddForm(false)} className="p-3 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                                <FaTimes className="text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 sm:p-8 pt-4 space-y-6 overflow-y-auto flex-1 scrollbar-hide">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Lab Test Identity *
                                    </label>
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Hemoglobin A1c"
                                        className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50/30 outline-none transition-all font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                            Unit (SI)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            placeholder="mg/dL"
                                            className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50/30 outline-none transition-all font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                            Category
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none bg-gray-50/50 font-black cursor-pointer"
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                            Male Reference Range
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.range_male}
                                            onChange={(e) => setFormData({ ...formData, range_male: e.target.value })}
                                            placeholder="e.g. 0.7-1.3"
                                            className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50/30 outline-none transition-all font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                            Female Reference Range
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.range_female}
                                            onChange={(e) => setFormData({ ...formData, range_female: e.target.value })}
                                            placeholder="e.g. 0.6-1.1"
                                            className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50/30 outline-none transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Intelligence Summary
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Clinical significance and utility index..."
                                        rows="3"
                                        className="w-full border-2 border-gray-100 rounded-3xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500 bg-gray-50/30 outline-none transition-all resize-none font-medium h-24"
                                    />
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t sm:border-t-0 mt-6">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-3xl transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {saving ? <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></div> : <FaSave />}
                                    {editingLab ? 'Commit Evolution' : 'Initialize Protocol'}
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
