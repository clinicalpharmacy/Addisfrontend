import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import {
    FaLeaf,
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaTimes,
    FaSync,
    FaLock,
    FaBan,
    FaShieldAlt,
    FaCheckCircle,
    FaExclamationTriangle,
    FaSpinner
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
    const [protectionEnabled, setProtectionEnabled] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        amharic_name: '',
        description: '',
        usage: '',
        notes_for_users: ''
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setIsAdmin(parsedUser.role === 'admin');
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

            if (data) {
                setRemedies(data);
                setFilteredRemedies(data);
            }
        } catch (err) {
            console.error('Error fetching remedies:', err);
            setError('Failed to load remedies. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        let filtered = remedies;

        if (term) {
            filtered = filtered.filter(remedy =>
                remedy.name.toLowerCase().includes(term.toLowerCase()) ||
                (remedy.amharic_name && remedy.amharic_name.toLowerCase().includes(term.toLowerCase())) ||
                (remedy.description && remedy.description.toLowerCase().includes(term.toLowerCase()))
            );
        }

        setFilteredRemedies(filtered);
    };

    const toggleProtection = () => {
        if (!isAdmin) {
            setError('Only administrators can modify protection settings.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        setProtectionEnabled(!protectionEnabled);
        setSuccess(`Copy/Print Protection ${!protectionEnabled ? 'enabled' : 'disabled'}`);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAdmin) {
            setError('Only administrators can add or edit remedies');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!formData.name.trim()) {
            setError('Remedy name is required');
            return;
        }

        if (!formData.description.trim()) {
            setError('Description is required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const remedyData = {
                name: formData.name.trim(),
                amharic_name: formData.amharic_name.trim() || '',
                description: formData.description.trim(),
                usage: formData.usage.trim() || '',
                notes_for_users: formData.notes_for_users.trim() || '',
                updated_at: new Date().toISOString()
            };

            if (editRemedy) {
                const { error } = await supabase
                    .from('home_remedies')
                    .update(remedyData)
                    .eq('id', editRemedy.id);

                if (error) throw error;
                setSuccess('Remedy updated successfully!');
            } else {
                const { error } = await supabase
                    .from('home_remedies')
                    .insert([{ ...remedyData, created_at: new Date().toISOString() }]);

                if (error) throw error;
                setSuccess('Remedy added successfully!');
            }

            fetchRemedies();
            resetForm();

        } catch (err) {
            console.error('Error saving remedy:', err);
            setError('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (remedy) => {
        if (!isAdmin) {
            setError('Only administrators can edit remedies');
            setTimeout(() => setError(''), 3000);
            return;
        }

        setEditRemedy(remedy);
        setFormData({
            name: remedy.name || '',
            amharic_name: remedy.amharic_name || '',
            description: remedy.description || '',
            usage: remedy.usage || '',
            notes_for_users: remedy.notes_for_users || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!isAdmin) {
            setError('Only administrators can delete remedies');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (!window.confirm('Are you sure you want to delete this remedy?')) return;

        try {
            const { error } = await supabase
                .from('home_remedies')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSuccess('Remedy deleted successfully!');
            fetchRemedies();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting remedy:', err);
            setError('Error: ' + err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            amharic_name: '',
            description: '',
            usage: '',
            notes_for_users: ''
        });
        setEditRemedy(null);
        setShowForm(false);
        setError('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-green-600 mx-auto mb-4" />
                    <p className="mt-3 text-gray-600">Loading home remedies...</p>
                </div>
            </div>
        );
    }

    const renderBullets = (text) => {
        if (!text) return null;
        return text
            .replace(/^•\s?/gm, '')
            .split('\n')
            .filter(line => line.trim() !== '')
            .map((line, index) => <li key={index}>{line}</li>);
    };

    return (
        <div className="bg-gray-50 min-h-full pb-8">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Header */}
                <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="bg-green-100 p-3 rounded-full flex-shrink-0">
                            <FaLeaf className="text-green-600 text-xl md:text-2xl" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Home Remedies</h1>
                            <p className="text-gray-600 mt-1 text-sm md:text-base">
                                Collection of {remedies.length} traditional and folk remedies
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {isAdmin && (
                            <button
                                onClick={toggleProtection}
                                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${protectionEnabled
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-green-500 hover:bg-green-600 text-white'}`}
                            >
                                {protectionEnabled ? <FaBan /> : <FaShieldAlt />}
                                <span className="hidden sm:inline">{protectionEnabled ? 'Allow Copy' : 'No Copy'}</span>
                            </button>
                        )}
                        <button
                            onClick={fetchRemedies}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                        >
                            <FaSync /> <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                            >
                                <FaPlus /> <span className="hidden sm:inline">Add Remedy</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Success/Error */}
                {success && (
                    <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-between text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            <FaCheckCircle /> <span className="font-medium">{success}</span>
                        </div>
                        <button onClick={() => setSuccess('')}><FaTimes /></button>
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex items-center justify-between text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            <FaExclamationTriangle /> <span className="font-medium">{error}</span>
                        </div>
                        <button onClick={() => setError('')}><FaTimes /></button>
                    </div>
                )}

                {/* Search */}
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search remedies..."
                            className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                        />
                    </div>
                </div>

                {/* Remedies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                    {filteredRemedies.length > 0 ? filteredRemedies.map(remedy => (
                        <div key={remedy.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                            <div className="p-3 md:p-6">
                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{remedy.name}</h3>
                                        {remedy.amharic_name && <p className="text-xs md:text-sm text-gray-600 mb-2">{remedy.amharic_name}</p>}
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(remedy)} className="text-blue-500 hover:text-blue-700"><FaEdit /></button>
                                            <button onClick={() => handleDelete(remedy.id)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                                        </div>
                                    )}
                                </div>

                                {remedy.description && (
                                    <div className="mb-3 md:mb-4">
                                        <h4 className="font-semibold text-gray-700 mb-1.5 md:mb-2 text-sm md:text-base">Description:</h4>
                                        <ul className="list-disc pl-5 text-xs md:text-sm text-gray-600">{renderBullets(remedy.description)}</ul>
                                    </div>
                                )}
                                {remedy.usage && (
                                    <div className="mb-3 md:mb-4">
                                        <h4 className="font-semibold text-gray-700 mb-1.5 md:mb-2 text-sm md:text-base">Usage:</h4>
                                        <ul className="list-disc pl-5 text-xs md:text-sm text-gray-600">{renderBullets(remedy.usage)}</ul>
                                    </div>
                                )}
                                {remedy.notes_for_users && (
                                    <div className="mb-3 md:mb-4 p-2 md:p-3 bg-blue-50 border border-blue-100 rounded">
                                        <h4 className="font-semibold text-blue-700 mb-1 text-sm md:text-base">Notes for Users:</h4>
                                        <ul className="list-disc pl-5 text-xs md:text-sm text-gray-600">{renderBullets(remedy.notes_for_users)}</ul>
                                    </div>
                                )}
                                <div className="text-xs text-gray-500 mt-3 md:mt-4 pt-2 md:pt-3 border-t border-gray-100">
                                    Last updated: {new Date(remedy.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
                            <FaLeaf className="text-5xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-800 mb-2">No Remedies Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                {searchTerm ? 'No remedies match your search.' : 'No home remedies added yet.'}
                            </p>
                            {isAdmin && (
                                <button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto">
                                    <FaPlus /> Add Remedy
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomeRemedies;
