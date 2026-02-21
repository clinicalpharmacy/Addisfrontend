import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaExternalLinkAlt, FaLink, FaFolder } from 'react-icons/fa';
import api from '../utils/api';

const AdminUsefulLinks = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        category: 'General',
        icon: 'FaExternalLinkAlt',
        description: ''
    });

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            setLoading(true);
            const data = await api.get('/useful-links');
            if (data.success) {
                setLinks(data.links);
            }
        } catch (error) {
            console.error('Error fetching links:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            let response;
            if (editingLink) {
                response = await api.put(`/useful-links/${editingLink.id}`, formData);
            } else {
                response = await api.post('/useful-links', formData);
            }

            if (response.success) {
                alert(editingLink ? 'Link updated' : 'Link added');
                setIsAdding(false);
                setEditingLink(null);
                setFormData({ title: '', url: '', category: 'General', icon: 'FaExternalLinkAlt', description: '' });
                fetchLinks();
            }
        } catch (error) {
            alert('Error saving link: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this link?')) return;
        try {
            const data = await api.delete(`/useful-links/${id}`);
            if (data.success) {
                fetchLinks();
            }
        } catch (error) {
            alert('Error deleting link');
        }
    };

    const startEdit = (link) => {
        setEditingLink(link);
        setFormData({
            title: link.title,
            url: link.url,
            category: link.category,
            icon: link.icon,
            description: link.description || ''
        });
        setIsAdding(true);
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg border-t-4 border-indigo-500 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                            <FaLink className="text-indigo-500" /> Useful Links
                        </h2>
                        <p className="text-sm text-gray-600">Manage resource links for all system users.</p>
                    </div>
                    <button
                        onClick={() => {
                            setIsAdding(!isAdding);
                            setEditingLink(null);
                            setFormData({ title: '', url: '', category: 'General', icon: 'FaExternalLinkAlt', description: '' });
                        }}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm font-medium ${isAdding ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                            }`}
                    >
                        {isAdding ? <FaPlus className="rotate-45" /> : <FaPlus />}
                        {isAdding ? 'Cancel' : 'Add New Link'}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-gray-50 p-5 md:p-8 rounded-xl border border-gray-200 mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <FaLink className="text-indigo-500" />
                            {editingLink ? 'Edit Link' : 'Add New Link'}
                        </h3>
                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Link Name *</label>
                                <input
                                    type="text" required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="e.g. Clinical Pharmacopeia"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL *</label>
                                <input
                                    type="url" required
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="Brief description of this link..."
                                    rows="2"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="Clinical, Research, Tool, etc."
                                />
                            </div>
                            <div className="md:col-span-1 flex items-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <FaSave />}
                                    {editingLink ? 'Update Link' : 'Save Link'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Link Name</th>
                                <th className="py-3 px-6 text-left">Link URL</th>
                                <th className="py-3 px-6 text-left">Category</th>
                                <th className="py-3 px-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {links.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-500">
                                        No links found. Click "Add New Link" to create one.
                                    </td>
                                </tr>
                            ) : (
                                links.map(link => (
                                    <tr key={link.id} className="border-b border-gray-200 hover:bg-gray-50 transition duration-300">
                                        <td className="py-3 px-6 font-medium">
                                            <a 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                                            >
                                                {link.title}
                                                <FaExternalLinkAlt className="text-xs" />
                                            </a>
                                            {link.description && (
                                                <p className="text-xs text-gray-500 mt-1">{link.description}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-6">
                                            <a 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-gray-600 hover:text-indigo-600 text-xs break-all"
                                            >
                                                {link.url}
                                            </a>
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded">
                                                {link.category}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <button
                                                onClick={() => startEdit(link)}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-1 px-3 rounded transition-all duration-300 mr-2 text-xs"
                                            >
                                                <FaEdit className="inline mr-1" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(link.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-all duration-300 text-xs"
                                            >
                                                <FaTrash className="inline mr-1" /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsefulLinks;
