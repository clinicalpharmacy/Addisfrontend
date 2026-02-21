import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaExternalLinkAlt, FaLink } from 'react-icons/fa';
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
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-indigo-500">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                        className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all font-medium ${isAdding ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                            }`}
                    >
                        {isAdding ? <FaPlus className="rotate-45" /> : <FaPlus />}
                        {isAdding ? 'Cancel' : 'Add New Link'}
                    </button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {editingLink ? 'Edit Link' : 'Add New Link'}
                    </h3>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Link Name *</label>
                            <input
                                type="text" required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="e.g. Clinical Pharmacopeia"
                            />
                        </div>
                        <div>
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="Clinical, Research, Tool, etc."
                            />
                        </div>
                        <div className="flex items-end">
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

            {/* Links Table - Clean lines, no boxes */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link Name</th>
                                <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link URL</th>
                                <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {links.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-8 px-6 text-center text-gray-500">
                                        No links found. Click "Add New Link" to create one.
                                    </td>
                                </tr>
                            ) : (
                                links.map(link => (
                                    <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-6">
                                            <a 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 text-sm"
                                            >
                                                {link.title}
                                                <FaExternalLinkAlt className="text-[10px]" />
                                            </a>
                                            {link.description && (
                                                <p className="text-xs text-gray-500 mt-0.5">{link.description}</p>
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
                                            <span className="text-xs text-gray-600">{link.category}</span>
                                        </td>
                                        <td className="py-3 px-6 text-right">
                                            <button
                                                onClick={() => startEdit(link)}
                                                className="text-yellow-600 hover:text-yellow-800 font-medium mr-3 text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(link.id)}
                                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                                            >
                                                Delete
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
