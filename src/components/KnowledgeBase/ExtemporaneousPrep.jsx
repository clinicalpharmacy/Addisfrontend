import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import {
    FaMortarPestle,
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaVial,
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
    FaTag
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

    const [formData, setFormData] = useState({
        formula_name: '',
        materials: '',
        preparation_steps: '',
        label_instructions: '',
        storage_info: '',
        stability_info: ''
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
            console.error('❌ Error fetching preparations (Full Detail):', JSON.stringify(err, null, 2));
            if (err.code === '42P01') {
                setError('Table not found. Please run the SQL migration script.');
            } else {
                setError(err.message || 'Failed to load preparations.');
            }
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
            prep.preparation_steps?.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredPreparations(filtered);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        if (!formData.formula_name.trim() || !formData.materials.trim() || !formData.preparation_steps.trim()) {
            setError('Formula, Materials and Preparation are required.');
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
                stability_info: formData.stability_info.trim()
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
            console.error('❌ Error saving preparation (Full Detail):', JSON.stringify(err, null, 2));
            setError(err.message || 'An unexpected error occurred while saving.');
        } finally {
            setSaving(false);
        }
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
            setSuccess('Formula deleted.');
            fetchPreparations();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = (prep) => {
        setEditPrep(prep);
        setFormData({
            formula_name: prep.formula_name || prep.name || '',
            materials: prep.materials || prep.ingredients || '',
            preparation_steps: prep.preparation_steps || prep.instructions || '',
            label_instructions: prep.label_instructions || '',
            storage_info: prep.storage_info || prep.storage || '',
            stability_info: prep.stability_info || prep.stability || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            formula_name: '',
            materials: '',
            preparation_steps: '',
            label_instructions: '',
            storage_info: '',
            stability_info: ''
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
            <FaSpinner className="animate-spin text-4xl text-purple-600" />
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-full pb-8">
            {protectionMsg && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md px-4">
                    <div className="bg-red-600/90 text-white p-3 rounded-lg shadow-2xl flex items-center justify-center gap-3 animate-pulse border border-red-400 backdrop-blur-sm">
                        <FaShieldAlt className="text-xl" />
                        <span className="font-bold text-sm md:text-base">{protectionMsg}</span>
                    </div>
                </div>
            )}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <FaMortarPestle className="text-purple-600 text-2xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Extemporaneous Preparations</h1>
                                <p className="text-gray-600 text-sm">Compounding formulas for clinical use</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={fetchPreparations} className="p-2 text-gray-400 hover:text-purple-600 transition"><FaSync /></button>
                            {isAdmin && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition shadow-md"
                                >
                                    <FaPlus /> Add New Formula
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2"><FaCheckCircle /> {success}</div>
                        <button onClick={() => setSuccess('')}><FaTimes /></button>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2"><FaExclamationTriangle /> {error}</div>
                        <button onClick={() => setError('')}><FaTimes /></button>
                    </div>
                )}

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by formula name, materials or steps..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPreparations.length > 0 ? (
                        filteredPreparations.map((prep) => (
                            <div key={prep.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                                <FaPrescriptionBottle className="text-purple-600 text-sm" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{prep.formula_name}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            {isAdmin && (
                                                <>
                                                    <button onClick={() => handleEdit(prep)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition"><FaEdit /></button>
                                                    <button onClick={() => handleDelete(prep.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"><FaTrash /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Materials */}
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <FaVial /> Materials
                                            </h4>
                                            <ul className="text-sm text-gray-700 space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                {renderBullets(prep.materials)}
                                            </ul>
                                        </div>

                                        {/* Preparation */}
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <FaBookOpen /> Preparation
                                            </h4>
                                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                {prep.preparation_steps}
                                            </div>
                                        </div>

                                        {/* Label */}
                                        <div className="pt-4 border-t border-gray-100">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <FaTag /> Label Instructions
                                            </h4>
                                            <div className="text-sm text-purple-700 font-medium bg-purple-50 p-3 rounded-lg flex items-start gap-2 italic">
                                                <span>{prep.label_instructions || 'Standard compounding label'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Stats */}
                                <div className="bg-gray-50 px-5 py-3 flex items-center gap-4 text-[10px] font-bold text-gray-500 border-t border-gray-100 uppercase tracking-widest">
                                    <div className="flex items-center gap-1"><FaTemperatureLow /> {prep.storage_info || 'Cool Place'}</div>
                                    <div className="flex items-center gap-1"><FaClock /> {prep.stability_info || '14 Days'}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <FaMortarPestle className="text-5xl text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400">No formulas found matching your search.</p>
                        </div>
                    )}
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-purple-600 text-white">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FaMortarPestle /> {editPrep ? 'Edit Formula' : 'Add New Compounding Formula'}
                                </h2>
                                <button onClick={resetForm} className="hover:bg-white/20 p-1 rounded transition"><FaTimes size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                        Formula Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.formula_name}
                                        onChange={(e) => setFormData({ ...formData, formula_name: e.target.value })}
                                        placeholder="e.g. Zinc Oxide Paste 20%"
                                        className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition shadow-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                        Materials <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.materials}
                                        onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                                        placeholder="List active ingredients and excipients (one per line)..."
                                        rows="4"
                                        className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition shadow-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                        Preparation Steps <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.preparation_steps}
                                        onChange={(e) => setFormData({ ...formData, preparation_steps: e.target.value })}
                                        placeholder="Step-by-step compounding procedure..."
                                        rows="6"
                                        className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition shadow-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                                        Label Instructions
                                    </label>
                                    <textarea
                                        value={formData.label_instructions}
                                        onChange={(e) => setFormData({ ...formData, label_instructions: e.target.value })}
                                        placeholder="Specific labels (e.g. For External Use Only, Shake Well)..."
                                        rows="2"
                                        className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Storage</label>
                                        <input
                                            type="text"
                                            value={formData.storage_info}
                                            onChange={(e) => setFormData({ ...formData, storage_info: e.target.value })}
                                            placeholder="e.g. 2-8°C"
                                            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Stability</label>
                                        <input
                                            type="text"
                                            value={formData.stability_info}
                                            onChange={(e) => setFormData({ ...formData, stability_info: e.target.value })}
                                            placeholder="e.g. 14 Days"
                                            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {saving ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                                        {editPrep ? 'Update Formula' : 'Save Compounding Formula'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-4 rounded-xl font-bold transition"
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
