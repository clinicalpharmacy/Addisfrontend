import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import {
    FaMortarPestle,
    FaVial,
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaPrescriptionBottle,
    FaClock,
    FaTemperatureLow,
    FaExclamationTriangle,
    FaCheckCircle,
    FaTimes,
    FaSync,
    FaLock,
    FaSpinner,
    FaBookOpen,
    FaShieldAlt,
    FaTag,
    FaChevronDown,
    FaChevronUp,
    FaInfoCircle
} from 'react-icons/fa';
import { useOutletContext } from 'react-router-dom';
import useScreenshotProtection from '../../hooks/useScreenshotProtection';

const ExtemporaneousPrep = () => {
    const context = useOutletContext();
    const protectionEnabled = context?.protectionEnabled ?? true;
    const toggleProtection = context?.toggleProtection ?? (() => { });
    const protectionMsg = useScreenshotProtection(protectionEnabled);

    const [preparations, setPreparations] = useState([]);
    const [filteredPreparations, setFilteredPreparations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editPrep, setEditPrep] = useState(null);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedCards, setExpandedCards] = useState({});

    const [formData, setFormData] = useState({
        formula_name: '',
        materials: '',
        preparation_steps: '',
        label_instructions: '',
        storage_info: '',
        stability_info: '',
        use_indication: ''
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setIsAdmin(parsedUser.role === 'admin' || parsedUser.role === 'company_admin');
            } catch (err) {
                console.error('Error parsing user data:', err);
            }
        }
    }, []);

    useEffect(() => {
        fetchPreparations();
    }, []);

    const fetchPreparations = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('extemporaneous_preparations')
                .select('*')
                .order('formula_name');

            if (error) throw error;

            if (data) {
                setPreparations(data);
                setFilteredPreparations(data);
            }
        } catch (err) {
            console.error('❌ Error fetching preparations:', err);
            setError(err.message || 'Failed to load preparations.');
            setPreparations([]);
            setFilteredPreparations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        if (!term.trim()) {
            setFilteredPreparations(preparations);
            return;
        }

        const filtered = preparations.filter(prep =>
            prep.formula_name?.toLowerCase().includes(term.toLowerCase()) ||
            prep.materials?.toLowerCase().includes(term.toLowerCase()) ||
            prep.preparation_steps?.toLowerCase().includes(term.toLowerCase()) ||
            prep.use_indication?.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredPreparations(filtered);
    };

    const toggleCard = (prepId) => {
        setExpandedCards(prev => ({
            ...prev,
            [prepId]: !prev[prepId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        if (!formData.formula_name.trim() || !formData.materials.trim() || !formData.preparation_steps.trim()) {
            setError('Formula Name, Materials and Preparation Steps are required.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const prepData = {
                formula_name: formData.formula_name.trim(),
                materials: formData.materials.trim(),
                preparation_steps: formData.preparation_steps.trim(),
                label_instructions: formData.label_instructions.trim(),
                storage_info: formData.storage_info.trim(),
                stability_info: formData.stability_info.trim(),
                use_indication: formData.use_indication.trim()
            };

            if (editPrep) {
                const { error } = await supabase
                    .from('extemporaneous_preparations')
                    .update(prepData)
                    .eq('id', editPrep.id);
                if (error) throw error;
                setSuccess('Preparation updated successfully');
            } else {
                const { error } = await supabase
                    .from('extemporaneous_preparations')
                    .insert([prepData]);
                if (error) throw error;
                setSuccess('Preparation added successfully');
            }

            fetchPreparations();
            resetForm();
        } catch (err) {
            console.error('❌ Error saving preparation:', err);
            setError(err.message || 'An unexpected error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (prep) => {
        setEditPrep(prep);
        setFormData({
            formula_name: prep.formula_name || '',
            materials: prep.materials || '',
            preparation_steps: prep.preparation_steps || '',
            label_instructions: prep.label_instructions || '',
            storage_info: prep.storage_info || '',
            stability_info: prep.stability_info || '',
            use_indication: prep.use_indication || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!isAdmin) return;
        if (!window.confirm('Are you sure you want to delete this formula?')) return;

        try {
            const { error } = await supabase
                .from('extemporaneous_preparations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSuccess('Formula deleted successfully');
            fetchPreparations();
        } catch (err) {
            setError(err.message);
        }
    };

    const initializeSampleData = async () => {
        if (!isAdmin) return;
        if (!window.confirm('Add sample compounding formulas?')) return;

        setLoading(true);
        try {
            const samplePreparations = [
                {
                    formula_name: 'Amoxicillin Oral Suspension 250mg/5mL',
                    use_indication: 'Pediatric bacterial infections',
                    materials: 'Amoxicillin trihydrate: 5g\nPurified water: qs to 100mL\nPreservative: 0.1%\nFlavor: Raspberry',
                    preparation_steps: '1. Weigh ingredients\n2. Mix in mortar\n3. Transfer to bottle\n4. Add water to volume\n5. Shake well',
                    label_instructions: 'Shake before use\nRefrigerate\nUse within 14 days',
                    storage_info: '2-8°C',
                    stability_info: '14 Days'
                },
                {
                    formula_name: 'Zinc Oxide Paste 20%',
                    use_indication: 'Diaper rash, skin protection',
                    materials: 'Zinc Oxide: 20g\nStarch: 20g\nWhite Petrolatum: 60g',
                    preparation_steps: '1. Sift the zinc oxide and starch\n2. Incorporate with petrolatum using a spatula on an ointment slab until smooth',
                    label_instructions: 'For external use only',
                    storage_info: 'Room Temperature',
                    stability_info: '6 Months'
                }
            ];

            const { error } = await supabase
                .from('extemporaneous_preparations')
                .insert(samplePreparations);

            if (error) throw error;

            setSuccess('Sample formulas added successfully!');
            fetchPreparations();
        } catch (err) {
            console.error('Error adding sample data:', err);
            setError(`Failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            formula_name: '',
            materials: '',
            preparation_steps: '',
            label_instructions: '',
            storage_info: '',
            stability_info: '',
            use_indication: ''
        });
        setEditPrep(null);
        setShowForm(false);
        setError('');
    };

    const renderBullets = (text) => {
        if (!text) return null;
        return text.split('\n').filter(line => line.trim()).map((line, idx) => (
            <li key={idx} className="mb-1">{line}</li>
        ));
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading compounding formulas...</p>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-full pb-8">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
                {protectionMsg && (
                    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md px-4 pointer-events-none">
                        <div className="bg-red-600/90 text-white p-3 rounded-lg shadow-2xl flex items-center justify-center gap-3 animate-pulse border border-red-400 backdrop-blur-sm">
                            <FaLock className="text-xl" />
                            <span className="font-bold text-sm md:text-base">{protectionMsg}</span>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="bg-purple-100 p-3 rounded-full flex-shrink-0">
                                <FaMortarPestle className="text-purple-600 text-xl md:text-2xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 truncate">Compounding</h1>
                                <p className="text-gray-600 text-sm md:text-base mt-1">
                                    {preparations.length} formulas • {filteredPreparations.length} visible
                                    {isAdmin && (
                                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium inline-flex items-center">
                                            Admin
                                        </span>
                                    )}
                                    {!isAdmin && (
                                        <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium inline-flex items-center">
                                            <FaLock className="mr-1" /> View Only
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={fetchPreparations}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition shadow-sm"
                            >
                                <FaSync /> <span className="hidden sm:inline">Refresh</span>
                            </button>
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={initializeSampleData}
                                        className="bg-green-500 hover:bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition shadow-sm"
                                    >
                                        <FaPlus /> <span className="hidden sm:inline">Samples</span>
                                    </button>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition shadow-sm"
                                    >
                                        <FaPlus /> <span className="hidden sm:inline">New Formula</span><span className="sm:hidden">Add</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by formula name, materials or steps..."
                            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition shadow-sm"
                        />
                    </div>
                </div>

                {/* Messages */}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2"><FaCheckCircle /> {success}</div>
                        <button onClick={() => setSuccess('')}><FaTimes /></button>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2"><FaExclamationTriangle /> {error}</div>
                        <button onClick={() => setError('')}><FaTimes /></button>
                    </div>
                )}

                {/* Preparations Grid */}
                {filteredPreparations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPreparations.map((prep) => (
                            <div
                                key={prep.id}
                                className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div
                                            className="flex-1 cursor-pointer group"
                                            onClick={() => toggleCard(prep.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                                    <FaPrescriptionBottle className="text-purple-600 text-lg" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                                                        {prep.formula_name}
                                                    </h3>
                                                    {prep.use_indication && (
                                                        <p className="text-xs text-gray-500 truncate">{prep.use_indication}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {isAdmin && (
                                                <>
                                                    <button onClick={() => handleEdit(prep)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit"><FaEdit /></button>
                                                    <button onClick={() => handleDelete(prep.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete"><FaTrash /></button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => toggleCard(prep.id)}
                                                className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition"
                                            >
                                                {expandedCards[prep.id] ? <FaChevronUp /> : <FaChevronDown />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedCards[prep.id] && (
                                        <div className="mt-4 space-y-4 animate-fadeIn">
                                            {/* Materials */}
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <FaVial /> Materials
                                                </h4>
                                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                    <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                                                        {renderBullets(prep.materials)}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Method */}
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <FaBookOpen /> Preparation Method
                                                </h4>
                                                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                    {prep.preparation_steps}
                                                </div>
                                            </div>

                                            {/* Label */}
                                            {prep.label_instructions && (
                                                <div className="pt-4 border-t border-gray-100">
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                        <FaTag /> Label Instructions
                                                    </h4>
                                                    <div className="bg-purple-50 p-3 rounded-xl flex items-start gap-2 border border-purple-100">
                                                        <FaInfoCircle className="text-purple-600 mt-0.5" />
                                                        <p className="text-sm text-purple-800 font-medium italic">
                                                            {prep.label_instructions}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Stats */}
                                <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-t border-gray-100">
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-1"><FaTemperatureLow className="text-blue-400" /> {prep.storage_info || 'N/A'}</div>
                                        <div className="flex items-center gap-1"><FaClock className="text-orange-400" /> {prep.stability_info || 'N/A'}</div>
                                    </div>
                                    {!expandedCards[prep.id] && (
                                        <button
                                            onClick={() => toggleCard(prep.id)}
                                            className="text-[10px] font-bold text-purple-600 hover:text-purple-800 uppercase tracking-widest"
                                        >
                                            View Details
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 text-center">
                        <FaMortarPestle className="text-6xl text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Formulas Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            {searchTerm ? 'No results match your search criteria.' : 'Start adding your compounding formulas to the repository.'}
                        </p>
                        {isAdmin && !searchTerm && (
                            <button
                                onClick={initializeSampleData}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition"
                            >
                                Load Sample Data
                            </button>
                        )}
                    </div>
                )}

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-purple-600 text-white">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FaMortarPestle /> {editPrep ? 'Edit Formula' : 'Add New Formula'}
                                </h2>
                                <button onClick={resetForm} className="hover:bg-white/20 p-2 rounded-xl transition"><FaTimes size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            Formula Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.formula_name}
                                            onChange={(e) => setFormData({ ...formData, formula_name: e.target.value })}
                                            placeholder="e.g. Salicylic Acid Ointment 5%"
                                            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            Clinical Indication / Use
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.use_indication}
                                            onChange={(e) => setFormData({ ...formData, use_indication: e.target.value })}
                                            placeholder="e.g. Keratolytic, Psoriasis treatment"
                                            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Materials & Composition <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.materials}
                                        onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                                        placeholder="List ingredients and their quantities (one per line)..."
                                        rows="4"
                                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Preparation Steps <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.preparation_steps}
                                        onChange={(e) => setFormData({ ...formData, preparation_steps: e.target.value })}
                                        placeholder="Detailed step-by-step compounding procedure..."
                                        rows="6"
                                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Auxiliary Labeling
                                    </label>
                                    <textarea
                                        value={formData.label_instructions}
                                        onChange={(e) => setFormData({ ...formData, label_instructions: e.target.value })}
                                        placeholder="Specific labels (e.g. Shake well, For external use only)..."
                                        rows="2"
                                        className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Storage Conditions</label>
                                        <input
                                            type="text"
                                            value={formData.storage_info}
                                            onChange={(e) => setFormData({ ...formData, storage_info: e.target.value })}
                                            placeholder="e.g. Protect from light, 2-8°C"
                                            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Beyond Use Date (BUD)</label>
                                        <input
                                            type="text"
                                            value={formData.stability_info}
                                            onChange={(e) => setFormData({ ...formData, stability_info: e.target.value })}
                                            placeholder="e.g. 14 days, 6 months"
                                            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold transition shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
                                    >
                                        {saving ? <FaSpinner className="animate-spin" /> : <FaCheckCircle className="group-hover:scale-110 transition-transform" />}
                                        {editPrep ? 'Update Formula' : 'Save Compounding Formula'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        disabled={saving}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExtemporaneousPrep;
