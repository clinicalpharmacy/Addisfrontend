import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import useScreenshotProtection from '../../hooks/useScreenshotProtection';
import {
    FaHome,
    FaLeaf,
    FaSearch,
    FaExclamationTriangle,
    FaTimes,
    FaHeart,
    FaTrash,
    FaLock,
    FaSpinner,
    FaCheckCircle,
    FaPlus,
    FaEdit,
    FaBan,
    FaShieldAlt,
    FaLemon,
    FaBook
} from 'react-icons/fa';

const HomeRemedies = () => {
    const [remedies, setRemedies] = useState([]);
    const [filteredRemedies, setFilteredRemedies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editRemedy, setEditRemedy] = useState(null);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [protectionEnabled, setProtectionEnabled] = useState(true); // Protection ON by default
    const protectionMsg = useScreenshotProtection(protectionEnabled);

    const [formData, setFormData] = useState({
        name: '',
        amharic_name: '',
        home_remedies: '',
        medical_advise: ''
    });

    // Get user info on mount
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
        fetchRemedies();
    }, []);

    const fetchRemedies = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('home_remedies')
                .select('*')
                .order('name');

            if (error) throw error;

            setRemedies(data);
            setFilteredRemedies(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load home remedies.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        const filtered = remedies.filter(r =>
            r.name.toLowerCase().includes(term.toLowerCase()) ||
            r.amharic_name?.toLowerCase().includes(term.toLowerCase()) ||
            r.home_remedies.toLowerCase().includes(term.toLowerCase()) ||
            r.medical_advise?.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredRemedies(filtered);
    };

    // Toggle protection (Admin only)
    const toggleProtection = () => {
        if (!isAdmin) {
            setError('Only admins can change protection.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        setProtectionEnabled(!protectionEnabled);
        setSuccess(`Copy / Print Protection ${!protectionEnabled ? 'enabled' : 'disabled'} `);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleSaveRemedy = async () => {
        if (!isAdmin) {
            setError('Only admins can add remedies.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        if (!formData.name || !formData.home_remedies) {
            setError('Name and remedy description are required.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            if (editRemedy) {
                const { error } = await supabase
                    .from('home_remedies')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editRemedy.id);
                if (error) throw error;
                setSuccess('Remedy updated successfully!');
            } else {
                const { error } = await supabase.from('home_remedies').insert([{
                    ...formData,
                    created_at: new Date().toISOString()
                }]);
                if (error) throw error;
                setSuccess('Remedy added successfully!');
            }
            fetchRemedies();
            resetForm();
        } catch (err) {
            console.error(err);
            setError('Error saving remedy: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEditRemedy = (remedy) => {
        setEditRemedy(remedy);
        setFormData({
            name: remedy.name,
            amharic_name: remedy.amharic_name || '',
            home_remedies: remedy.home_remedies,
            medical_advise: remedy.medical_advise || ''
        });
        setShowForm(true);
    };

    const handleDeleteRemedy = async (id) => {
        if (!isAdmin) {
            setError('Only admins can delete remedies.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        if (!window.confirm('Are you sure you want to delete this remedy?')) return;
        try {
            const { error } = await supabase.from('home_remedies').delete().eq('id', id);
            if (error) throw error;
            setSuccess('Remedy deleted.');
            fetchRemedies();
        } catch (err) {
            console.error(err);
            setError('Error deleting remedy: ' + err.message);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', amharic_name: '', home_remedies: '', medical_advise: '' });
        setEditRemedy(null);
        setShowForm(false);
    };

    const getRemedyColor = (index) => {
        const colors = [
            'bg-green-50 border-green-200',
            'bg-blue-50 border-blue-200',
            'bg-yellow-50 border-yellow-200',
            'bg-purple-50 border-purple-200',
            'bg-pink-50 border-pink-200',
            'bg-indigo-50 border-indigo-200'
        ];
        return colors[index % colors.length];
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-green-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading home remedies...</p>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-full pb-8">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-3 rounded-full">
                            <FaHome className="text-green-600 text-xl md:text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Home Remedies</h1>
                            <p className="text-gray-600 mt-1 text-sm">
                                Traditional treatments ({remedies.length} items)
                                {!isAdmin && <span className="ml-2 bg-gray-100 px-2 py-1 rounded text-gray-800">Read-only</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                        {isAdmin && (
                            <>
                                <button
                                    onClick={toggleProtection}
                                    className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${protectionEnabled
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                        }`}
                                    title={protectionEnabled ? 'Disable Copy/Print Protection' : 'Enable Copy/Print Protection'}
                                >
                                    {protectionEnabled ? <FaBan /> : <FaShieldAlt />}
                                    <span>{protectionEnabled ? 'Allow Copy' : 'No Copy'}</span>
                                </button>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                >
                                    <FaPlus /> <span className="hidden sm:inline">Add Remedy</span><span className="sm:hidden">Add</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Messages */}
                {protectionMsg && (
                    <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex items-center justify-between text-sm md:text-base animate-pulse">
                        <div className="flex items-center gap-2">
                            <FaShieldAlt className="flex-shrink-0" />
                            <span className="font-bold">{protectionMsg}</span>
                        </div>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-between text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            <FaCheckCircle className="flex-shrink-0" />
                            <span className="font-medium">{success}</span>
                        </div>
                        <button onClick={() => setSuccess('')} className="text-green-800 hover:text-green-900">
                            <FaTimes />
                        </button>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex items-center justify-between text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            <FaExclamationTriangle className="flex-shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                        <button onClick={() => setError('')} className="text-red-800 hover:text-red-900">
                            <FaTimes />
                        </button>
                    </div>
                )}

                {/* Search */}
                <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search remedies..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 flex gap-2 items-center">
                        <span>{filteredRemedies.length} remedies</span>
                        {protectionEnabled && !isAdmin && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded flex items-center gap-1"><FaLock size={10} /> Protected</span>}
                    </div>
                </div>

                {/* Remedies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {filteredRemedies.length > 0 ? (
                        filteredRemedies.map((remedy, idx) => (
                            <div key={remedy.id} className={`border rounded-xl shadow-lg overflow-hidden ${getRemedyColor(idx)} p-4 md:p-6 remedy-content`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-gray-900">{remedy.name}</h3>
                                        {remedy.amharic_name && <p className="text-sm text-gray-600">{remedy.amharic_name}</p>}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="p-1.5 bg-green-100 rounded-full">
                                            <FaLeaf className="text-green-600" />
                                        </div>
                                        {isAdmin && (
                                            <>
                                                <button onClick={() => handleEditRemedy(remedy)} className="text-blue-500 hover:text-blue-700 p-1" title="Edit remedy">
                                                    <FaEdit className="text-sm" />
                                                </button>
                                                <button onClick={() => handleDeleteRemedy(remedy.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete remedy">
                                                    <FaTrash className="text-sm" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <h4 className="font-semibold text-gray-700 text-sm md:text-base">Remedy:</h4>
                                    <p className="text-gray-700 text-sm md:text-base whitespace-pre-line leading-relaxed">{remedy.home_remedies}</p>
                                </div>

                                {remedy.medical_advise && (
                                    <div className="mb-2 p-2 md:p-3 bg-yellow-50 border border-yellow-100 rounded">
                                        <h4 className="font-semibold text-yellow-700 flex items-center gap-1 text-sm md:text-base"><FaExclamationTriangle /> Medical Advice</h4>
                                        <p className="text-yellow-800 text-sm md:text-base whitespace-pre-line">{remedy.medical_advise}</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mt-2 border-t pt-2 text-xs text-gray-500">
                                    <span>Added {new Date(remedy.created_at).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><FaHeart className="text-red-400 text-xs" /> Traditional</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white rounded-xl shadow p-12 text-center">
                            <FaLemon className="text-5xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-800 mb-2">No Remedies Found</h3>
                            <p className="text-gray-500 mb-6">{searchTerm ? 'No matches for your search.' : 'No remedies added yet.'}</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => { setSearchTerm(''); handleSearch(''); }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">Clear Search</button>
                                {isAdmin && <button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"><FaPlus /> Add Remedy</button>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Footer */}
                {filteredRemedies.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{remedies.length}</div>
                                <div className="text-sm text-gray-600">Total Remedies</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {remedies.filter(r => r.amharic_name).length}
                                </div>
                                <div className="text-sm text-gray-600">With Amharic Names</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {remedies.filter(r => r.medical_advise).length}
                                </div>
                                <div className="text-sm text-gray-600">With Medical Advice</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{filteredRemedies.length}</div>
                                <div className="text-sm text-gray-600">Currently Filtered</div>
                            </div>
                        </div>
                        <div className="mt-4 text-center text-sm text-gray-500">
                            {isAdmin
                                ? 'Administrator Mode - Full access'
                                : `User Mode - View only(${protectionEnabled ? 'Copy/Print disabled' : 'Copy allowed'})`}
                        </div>
                    </div>
                )}

                {/* Quick Tips Section */}
                <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaBook className="text-green-600" /> Traditional Remedies Quick Tips
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2">Ginger Tea</h4>
                            <p className="text-sm text-green-700">
                                For colds and sore throat. Boil ginger slices, add honey and lemon.
                            </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">Turmeric Milk</h4>
                            <p className="text-sm text-blue-700">
                                Anti-inflammatory. Mix turmeric in warm milk with honey.
                            </p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg">
                            <h4 className="font-semibold text-yellow-800 mb-2">Honey & Cinnamon</h4>
                            <p className="text-sm text-yellow-700">
                                For cough and immunity. Mix honey with cinnamon powder.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Add/Edit Remedy Form Modal */}
                {showForm && isAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">{editRemedy ? 'Edit Home Remedy' : 'Add Home Remedy'}</h2>
                                    <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 text-2xl" disabled={saving}><FaTimes /></button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Remedy Name *</label>
                                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ginger Tea for Cold" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500" required disabled={saving} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Amharic Name (Optional)</label>
                                        <input type="text" value={formData.amharic_name} onChange={(e) => setFormData({ ...formData, amharic_name: e.target.value })} placeholder="እምቢልታ" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500" disabled={saving} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Home Remedies Description *</label>
                                        <textarea value={formData.home_remedies} onChange={(e) => setFormData({ ...formData, home_remedies: e.target.value })} rows="4" placeholder="Describe remedy, ingredients, preparation..." className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500" required disabled={saving} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Medical Advice (Optional)</label>
                                        <textarea value={formData.medical_advise} onChange={(e) => setFormData({ ...formData, medical_advise: e.target.value })} rows="3" placeholder="Any medical advice, precautions..." className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500" disabled={saving} />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8 pt-6 border-t">
                                    <button onClick={handleSaveRemedy} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaLeaf /> {editRemedy ? 'Update Remedy' : 'Save Remedy'}</>}
                                    </button>
                                    <button onClick={resetForm} disabled={saving} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-medium disabled:opacity-50">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeRemedies;
